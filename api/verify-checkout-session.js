import { sql } from '@vercel/postgres';
import Stripe from 'stripe';
import { verifyAuth } from './lib/verifyAuth.js';
import { checkRateLimit } from './lib/rateLimit.js';
import { getPackById } from './lib/validation.js';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  const { sessionId } = request.body || {};

  if (!sessionId || typeof sessionId !== 'string' || !sessionId.trim()) {
    return response.status(400).json({ error: 'Missing or invalid sessionId parameter' });
  }

  // Attempt optional Auth verification (used for rate-limiting identifier and session ownership check)
  let authUserId = null;
  try {
    authUserId = await verifyAuth(request);
  } catch (e) {
    // Unauthenticated or guest request
  }

  // Enforce rate limiting: 10 checkout verifications / min per user/IP
  if (!checkRateLimit(request, response, 'checkout', null, authUserId)) {
    return;
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    return response.status(500).json({ error: 'Stripe secret key not configured on backend' });
  }

  try {
    const stripe = new Stripe(stripeSecretKey);
    const session = await stripe.checkout.sessions.retrieve(sessionId.trim());

    if (!session || session.payment_status !== 'paid') {
      return response.status(400).json({
        verified: false,
        error: 'Payment not completed or invalid checkout session.'
      });
    }

    // Server-authoritative session ownership verification:
    // If the checkout session was created by an authenticated user, the verifying request
    // MUST be authenticated as that exact same user.
    const sessionOwnerId = session.metadata?.user_auth_id || 'guest';

    if (sessionOwnerId !== 'guest') {
      if (!authUserId) {
        return response.status(401).json({
          verified: false,
          error: 'Authentication required to verify this checkout session.'
        });
      }
      if (authUserId !== sessionOwnerId) {
        return response.status(403).json({
          verified: false,
          error: 'Session belongs to a different authenticated user.'
        });
      }
    }

    // Validate pack ID against authoritative server catalog
    const packId = session.metadata?.pack_id;
    const pack = getPackById(packId);

    if (!packId || !pack) {
      return response.status(400).json({
        verified: false,
        error: 'Invalid or unknown pack_id in checkout session metadata.'
      });
    }

    // Price Tamper Guard: Verify amount paid matches catalog price (accounting for discounts)
    const amountPaid = typeof session.amount_total === 'number' ? session.amount_total : 0;
    const discount = typeof session.total_details?.amount_discount === 'number' ? session.total_details.amount_discount : 0;
    const effectiveAmount = amountPaid + discount;
    const expectedAmount = pack.amount;

    if (effectiveAmount < expectedAmount) {
      return response.status(400).json({
        verified: false,
        error: 'Price mismatch detected: paid amount does not match catalog price.'
      });
    }

    // Session metadata is strictly authoritative; guest sessions cannot be claimed into user accounts
    const resolvedUserId = sessionOwnerId;

    if (resolvedUserId !== 'guest') {
      try {
        await sql`
          CREATE TABLE IF NOT EXISTS user_purchases (
            id SERIAL PRIMARY KEY,
            auth0_id VARCHAR(255) NOT NULL,
            pack_id VARCHAR(100) NOT NULL,
            stripe_session_id VARCHAR(255) UNIQUE,
            amount_paid INT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `;

        await sql`
          INSERT INTO user_purchases (auth0_id, pack_id, stripe_session_id, amount_paid)
          VALUES (${resolvedUserId}, ${packId}, ${session.id}, ${amountPaid})
          ON CONFLICT (stripe_session_id) DO NOTHING;
        `;
      } catch (dbErr) {
        console.error('Database write error during verify-checkout-session:', dbErr);
      }
    }

    return response.status(200).json({
      success: true,
      verified: true,
      packId: packId,
      amountPaid: amountPaid
    });
  } catch (error) {
    console.error('Stripe Session Verification Error:', error);
    return response.status(500).json({ error: error.message || 'Failed to verify checkout session' });
  }
}
