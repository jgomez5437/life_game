import { sql } from '@vercel/postgres';
import { verifyAuth } from './lib/verifyAuth.js';
import { checkRateLimit } from './lib/rateLimit.js';
import {
  validateFeedbackPayload,
  escapeEmailHtml,
  isValidEmail,
  checkPayloadSize,
  MAX_FEEDBACK_PAYLOAD_BYTES
} from './lib/validation.js';

let testDbHandler = null;
let testMailer = null;
let feedbackSchemaPromise = null;

function isTestEnv() {
  return process.env.NODE_ENV !== 'production' || Boolean(process.env.JEST_WORKER_ID);
}

export function setTestFeedbackDb(fn) {
  if (!isTestEnv()) return;
  testDbHandler = fn;
}

export function setTestFeedbackMailer(fn) {
  if (!isTestEnv()) return;
  testMailer = fn;
}

async function ensureFeedbackSchema() {
  if (!feedbackSchemaPromise) {
    feedbackSchemaPromise = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS user_feedback (
          id SERIAL PRIMARY KEY,
          auth0_id TEXT NOT NULL,
          user_email TEXT,
          category TEXT NOT NULL DEFAULT 'general',
          message TEXT NOT NULL,
          app_version TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `;
    })().catch((err) => {
      feedbackSchemaPromise = null;
      throw err;
    });
  }
  return feedbackSchemaPromise;
}

const CATEGORY_LABELS = {
  general: 'General Feedback',
  feature: 'Feature Request',
  bug: 'Bug Report'
};

function checkFeedbackPayloadSize(request) {
  return checkPayloadSize(request, MAX_FEEDBACK_PAYLOAD_BYTES).ok;
}

async function persistFeedbackToDb({ authUserId, category, message, appVersion, clientEmail }) {
  if (testDbHandler && isTestEnv()) {
    return testDbHandler({ authUserId, category, message, appVersion, clientEmail });
  }

  // Look up player's stored email in users table (prefer DB-verified record over client-supplied)
  let resolvedEmail = clientEmail || null;
  try {
    const userRes = await sql`
      SELECT email FROM users
      WHERE auth0_id = ${authUserId}
      LIMIT 1;
    `;
    const dbEmail = userRes?.rows?.[0]?.email;
    if (isValidEmail(dbEmail)) {
      resolvedEmail = dbEmail.trim();
    }
  } catch (lookupErr) {
    console.warn('[Feedback] User email lookup skipped:', lookupErr.message);
  }

  await ensureFeedbackSchema();

  const insertRes = await sql`
    INSERT INTO user_feedback (auth0_id, user_email, category, message, app_version)
    VALUES (${authUserId}, ${resolvedEmail}, ${category}, ${message}, ${appVersion})
    RETURNING id, created_at;
  `;

  return {
    id: insertRes?.rows?.[0]?.id ?? null,
    createdAt: insertRes?.rows?.[0]?.created_at ?? null,
    resolvedEmail
  };
}

async function sendFeedbackEmail({ authUserId, userEmail, category, message, appVersion, feedbackId }) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const feedbackToEmail = process.env.FEEDBACK_TO_EMAIL;
  const feedbackFromEmail = process.env.FEEDBACK_FROM_EMAIL || 'Start a Life <onboarding@resend.dev>';

  if (!resendApiKey || !feedbackToEmail) {
    return { sent: false, reason: 'not_configured' };
  }

  const categoryLabel = CATEGORY_LABELS[category] || 'General Feedback';
  const subject = `[Start a Life] ${categoryLabel}`;
  const safeMessageHtml = escapeEmailHtml(message).replace(/\n/g, '<br>');
  const safeEmailHtml = escapeEmailHtml(userEmail || 'Unknown');
  const safeAuthIdHtml = escapeEmailHtml(authUserId);
  const safeVersionHtml = escapeEmailHtml(appVersion || 'Unknown');
  const safeIdHtml = escapeEmailHtml(feedbackId ?? 'N/A');

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #0f172a;">
      <h2 style="margin: 0 0 12px; color: #1e293b;">New ${escapeEmailHtml(categoryLabel)}</h2>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-bottom: 16px; line-height: 1.5; white-space: normal;">
        ${safeMessageHtml}
      </div>
      <table style="font-size: 13px; color: #475569; border-collapse: collapse;">
        <tr><td style="padding: 3px 12px 3px 0; font-weight: 600;">Player Email:</td><td>${safeEmailHtml}</td></tr>
        <tr><td style="padding: 3px 12px 3px 0; font-weight: 600;">Auth0 ID:</td><td><code>${safeAuthIdHtml}</code></td></tr>
        <tr><td style="padding: 3px 12px 3px 0; font-weight: 600;">App Version:</td><td>${safeVersionHtml}</td></tr>
        <tr><td style="padding: 3px 12px 3px 0; font-weight: 600;">Record ID:</td><td>#${safeIdHtml}</td></tr>
      </table>
    </div>
  `.trim();

  const text = [
    `New ${categoryLabel}`,
    '',
    message,
    '',
    `Player Email: ${userEmail || 'Unknown'}`,
    `Auth0 ID: ${authUserId}`,
    `App Version: ${appVersion || 'Unknown'}`,
    `Record ID: #${feedbackId ?? 'N/A'}`
  ].join('\n');

  const emailPayload = {
    from: feedbackFromEmail,
    to: [feedbackToEmail],
    subject,
    html,
    text
  };
  if (isValidEmail(userEmail)) {
    emailPayload.reply_to = userEmail;
  }

  if (testMailer && isTestEnv()) {
    return testMailer(emailPayload);
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(emailPayload)
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Resend API error (${res.status}): ${errText}`);
  }

  return { sent: true };
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  let authUserId;
  try {
    authUserId = await verifyAuth(request);
  } catch (error) {
    return response.status(401).json({ error: 'Authentication required to submit feedback' });
  }

  if (!authUserId || authUserId === 'guest') {
    return response.status(401).json({ error: 'Authentication required to submit feedback' });
  }

  if (!checkRateLimit(request, response, 'feedback', null, authUserId)) {
    return;
  }

  if (!checkFeedbackPayloadSize(request)) {
    return response.status(413).json({
      error: `Payload too large: exceeds ${MAX_FEEDBACK_PAYLOAD_BYTES / 1024} KB limit`
    });
  }

  let body;
  try {
    body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
  } catch (_) {
    return response.status(400).json({ error: 'Invalid JSON request body' });
  }

  const validation = validateFeedbackPayload(body);
  if (!validation.ok) {
    return response.status(validation.status || 400).json({ error: validation.error });
  }

  const { category, message, appVersion, clientEmail } = validation.data;

  let dbSaved = false;
  let feedbackId = null;
  let resolvedEmail = clientEmail;

  try {
    const dbResult = await persistFeedbackToDb({
      authUserId,
      category,
      message,
      appVersion,
      clientEmail
    });
    dbSaved = true;
    feedbackId = dbResult?.id ?? null;
    if (isValidEmail(dbResult?.resolvedEmail)) {
      resolvedEmail = dbResult.resolvedEmail.trim();
    }
  } catch (dbErr) {
    console.error('[Feedback] Database persistence error:', dbErr);
  }

  let emailSent = false;
  try {
    const mailResult = await sendFeedbackEmail({
      authUserId,
      userEmail: resolvedEmail,
      category,
      message,
      appVersion,
      feedbackId
    });
    emailSent = !!mailResult?.sent;
  } catch (mailErr) {
    console.error('[Feedback] Email dispatch error:', mailErr);
  }

  if (!dbSaved && !emailSent) {
    return response.status(500).json({
      error: 'Unable to save or send feedback right now. Please try again later.'
    });
  }

  return response.status(200).json({
    ok: true,
    id: feedbackId,
    emailSent
  });
}
