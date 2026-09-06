import { sql } from '@vercel/postgres';
import Stripe from 'stripe';
import { verifyAuth } from './lib/verifyAuth.js';
import { checkRateLimit } from './lib/rateLimit.js';
import { resolvePack } from './lib/validation.js';

/**
 * Resolves the client origin from Origin or Referer header against a strict whitelist.
 * Strips pathnames and query strings from referers and prevents open redirects.
 */
export function resolveOrigin(request) {
  const DEFAULT_ORIGIN = 'https://startalife.app';
  const raw = request?.headers?.origin || request?.headers?.referer || '';
  if (!raw || typeof raw !== 'string') return DEFAULT_ORIGIN;

  try {
    const parsed = new URL(raw);
    const origin = parsed.origin.toLowerCase();

    if (origin === 'https://startalife.app' || origin === 'https://startalife.vercel.app') {
      return origin;
    }
    // Vercel preview branch deployments
    if (/^https:\/\/[a-z0-9-_]+\.vercel\.app$/.test(origin)) {
      return origin;
    }
    // Local development ports (3000, 5173, 4173 on localhost or 127.0.0.1)
    if (/^http:\/\/(localhost|127\.0\.0\.1):(3000|5173|4173)$/.test(origin)) {
      return origin;
    }
  } catch (_) {}

  return DEFAULT_ORIGIN;
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  const { packId, priceId } = request.body || {};

  // Derive userAuthId from the verified JWT token — authentication is strictly required
  let userAuthId;
  try {
    userAuthId = await verifyAuth(request);
  } catch (error) {
    return response.status(401).json({ error: 'Authentication required to start checkout session' });
  }

  if (!userAuthId || userAuthId === 'guest') {
    return response.status(401).json({ error: 'Authentication required to start checkout session' });
  }

  // Enforce rate limiting: 10 checkout sessions / min per authenticated user
  if (!checkRateLimit(request, response, 'checkout', null, userAuthId)) {
    return;
  }

  // Authoritatively resolve and validate pack selection from server catalog
  const resolution = resolvePack(packId, priceId);
  if (resolution.error) {
    return response.status(resolution.status || 400).json({ error: resolution.error });
  }

  const pack = resolution.pack;

  // Duplicate Purchase Prevention: Reject checkout if player already owns this pack
  try {
    const existing = await sql`
      SELECT id FROM user_purchases
      WHERE auth0_id = ${userAuthId} AND pack_id = ${pack.id}
      LIMIT 1;
    `;
    if (existing?.rows?.length > 0) {
      return response.status(409).json({
        error: `You already own the ${pack.name} expansion pack.`,
        alreadyOwned: true,
        packId: pack.id
      });
    }
  } catch (dbErr) {
    // Gracefully handle environments without database connections (e.g. test mocks without DB)
    console.warn('Duplicate purchase check skipped (database unavailable):', dbErr.message);
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    return response.status(200).json({
      sandbox: true,
      url: null,
      message: 'STRIPE_SECRET_KEY environment variable is missing on Vercel backend.'
    });
  }

  try {
    const stripe = new Stripe(stripeSecretKey);
    const origin = resolveOrigin(request);

    const session = await stripe.checkout.sessions.create({
      managed_payments: { enabled: false },
      allow_promotion_codes: true,
      line_items: [
        {
          price_data: {
            currency: pack.currency || 'usd',
            product_data: {
              name: pack.name,
              tax_code: 'txcd_10000000',
              metadata: { pack_id: pack.id }
            },
            unit_amount: pack.amount
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      metadata: {
        user_auth_id: userAuthId,
        pack_id: pack.id
      },
      payment_intent_data: {
        metadata: {
          user_auth_id: userAuthId,
          pack_id: pack.id
        }
      },
      success_url: `${origin}/?purchase_success=true&pack_id=${pack.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?purchase_cancelled=true`
    });

    return response.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Stripe Checkout Error:', error);
    return response.status(500).json({ error: error.message || 'Failed to create checkout session' });
  }
}
