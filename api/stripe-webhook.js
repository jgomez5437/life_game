import { sql } from '@vercel/postgres';
import Stripe from 'stripe';
import { checkRateLimit } from './lib/rateLimit.js';
import { getPackById } from './lib/validation.js';

/**
 * Buffers the raw request body from the incoming stream.
 * Required because Vercel auto-parses JSON bodies, but Stripe
 * signature verification needs the raw string.
 */
async function getRawBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on('data', (chunk) => chunks.push(chunk));
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
    });
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  // Enforce high ceiling rate limit: 120 webhook events / min per IP
  if (!checkRateLimit(request, response, 'webhook')) {
    return;
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey || !webhookSecret) {
    return response.status(400).json({ error: 'Stripe Webhook Secret not configured.' });
  }

  try {
    const stripe = new Stripe(stripeSecretKey);

    const sig = request.headers['stripe-signature'];
    let event;

    try {
      const rawBody = await getRawBody(request);
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return response.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data?.object;
      if (!session) {
        return response.status(400).json({ error: 'Missing session object' });
      }

      // 1. Payment status check: ensure payment was successfully settled
      if (session.payment_status !== 'paid') {
        console.warn(`[WEBHOOK] Checkout session ${session.id} not paid (status: ${session.payment_status}). Skipping entitlement.`);
        return response.status(200).json({ received: true, ignored: 'unpaid' });
      }

      // 2. Pack ID validation against server-authoritative catalog
      const packId = session.metadata?.pack_id;
      const pack = getPackById(packId);
      if (!packId || !pack) {
        console.warn(`[SECURITY ALERT] Webhook received invalid or unknown pack_id: '${packId}' in session ${session.id}. Skipping.`);
        return response.status(200).json({ received: true, error: 'Invalid pack_id in metadata' });
      }

      // 3. Amount / Price verification (Price Tamper Guard)
      // Verify paid amount matches catalog price (accounting for legitimate Stripe promo discounts)
      const amountPaid = typeof session.amount_total === 'number' ? session.amount_total : 0;
      const discount = typeof session.total_details?.amount_discount === 'number' ? session.total_details.amount_discount : 0;
      const effectiveAmount = amountPaid + discount;
      const expectedAmount = pack.amount;

      if (effectiveAmount < expectedAmount) {
        console.error(`[SECURITY ALERT] Webhook price mismatch for pack '${packId}' (session ${session.id}): paid ${amountPaid} + discount ${discount} < expected ${expectedAmount}. Entitlement rejected.`);
        return response.status(200).json({ received: true, error: 'Price mismatch detected' });
      }

      // 4. User auth verification: ignore guest checkouts without DB write
      const userAuthId = session.metadata?.user_auth_id;
      if (!userAuthId || userAuthId === 'guest') {
        console.log(`[WEBHOOK] Guest checkout session ${session.id} completed for pack '${packId}'. No DB write required for guest.`);
        return response.status(200).json({ received: true, guest: true });
      }

      const stripeSessionId = session.id;

      // 5. Ensure user_purchases table exists and insert entitlement
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
        VALUES (${userAuthId}, ${packId}, ${stripeSessionId}, ${amountPaid})
        ON CONFLICT (stripe_session_id) DO NOTHING;
      `;
    }

    return response.status(200).json({ received: true });
  } catch (error) {
    console.error('Stripe Webhook Error:', error);
    return response.status(500).json({ error: 'Webhook processing failed' });
  }
}

export const config = {
    api: {
        bodyParser: false,
    },
};
