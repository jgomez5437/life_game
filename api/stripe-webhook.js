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

    // 1. Checkout completed event: grant entitlement
    if (event.type === 'checkout.session.completed') {
      const session = event.data?.object;
      if (!session) {
        return response.status(400).json({ error: 'Missing session object' });
      }

      // Payment status check: ensure payment was successfully settled
      if (session.payment_status !== 'paid') {
        console.warn(`[WEBHOOK] Checkout session ${session.id} not paid (status: ${session.payment_status}). Skipping entitlement.`);
        return response.status(200).json({ received: true, ignored: 'unpaid' });
      }

      // Pack ID validation against server-authoritative catalog
      const packId = session.metadata?.pack_id;
      const pack = getPackById(packId);
      if (!packId || !pack) {
        console.warn(`[SECURITY ALERT] Webhook received invalid or unknown pack_id: '${packId}' in session ${session.id}. Skipping.`);
        return response.status(200).json({ received: true, error: 'Invalid pack_id in metadata' });
      }

      // Amount / Price verification (Price Tamper Guard)
      // Verify paid amount matches catalog price (accounting for legitimate Stripe promo discounts)
      const amountPaid = typeof session.amount_total === 'number' ? session.amount_total : 0;
      const discount = typeof session.total_details?.amount_discount === 'number' ? session.total_details.amount_discount : 0;
      const effectiveAmount = amountPaid + discount;
      const expectedAmount = pack.amount;

      if (effectiveAmount < expectedAmount) {
        console.error(`[SECURITY ALERT] Webhook price mismatch for pack '${packId}' (session ${session.id}): paid ${amountPaid} + discount ${discount} < expected ${expectedAmount}. Entitlement rejected.`);
        return response.status(200).json({ received: true, error: 'Price mismatch detected' });
      }

      // User auth verification: ignore guest checkouts without DB write
      const userAuthId = session.metadata?.user_auth_id;
      if (!userAuthId || userAuthId === 'guest') {
        console.log(`[WEBHOOK] Guest checkout session ${session.id} completed for pack '${packId}'. No DB write required for guest.`);
        return response.status(200).json({ received: true, guest: true });
      }

      const stripeSessionId = session.id;

      // Ensure user_purchases table and index exist, then insert entitlement
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
          CREATE INDEX IF NOT EXISTS idx_user_purchases_auth0 ON user_purchases (auth0_id);
        `;

        await sql`
          INSERT INTO user_purchases (auth0_id, pack_id, stripe_session_id, amount_paid)
          VALUES (${userAuthId}, ${packId}, ${stripeSessionId}, ${amountPaid})
          ON CONFLICT (stripe_session_id) DO NOTHING;
        `;
      } catch (dbErr) {
        console.error('Database write error during stripe-webhook:', dbErr.message);
      }

      return response.status(200).json({ received: true });
    }

    // 2. Refund event: revoke entitlement upon full refund
    if (event.type === 'charge.refunded') {
      const charge = event.data?.object;
      if (!charge) {
        return response.status(400).json({ error: 'Missing charge object' });
      }

      // Only revoke entitlement if charge is fully refunded
      const isFullRefund = charge.refunded === true || (typeof charge.amount_refunded === 'number' && charge.amount_refunded >= (charge.amount || 0));
      if (!isFullRefund) {
        console.log(`[WEBHOOK] Partial refund detected for charge ${charge.id}. Entitlement retained.`);
        return response.status(200).json({ received: true, partial: true });
      }

      let revoked = false;
      const metaUserAuthId = charge.metadata?.user_auth_id;
      const metaPackId = charge.metadata?.pack_id;

      if (metaUserAuthId && metaPackId) {
        try {
          await sql`
            DELETE FROM user_purchases
            WHERE auth0_id = ${metaUserAuthId} AND pack_id = ${metaPackId};
          `;
          revoked = true;
          console.log(`[WEBHOOK] Refund processed: revoked pack '${metaPackId}' for user '${metaUserAuthId}' from charge metadata.`);
        } catch (dbErr) {
          console.error('[WEBHOOK] Database delete error on refund:', dbErr.message);
          // Mark revoked so endpoint acknowledges the revocation attempt
          revoked = true;
        }
      } else if (charge.payment_intent) {
        try {
          const sessions = await stripe.checkout.sessions.list({ payment_intent: charge.payment_intent });
          if (sessions?.data && Array.isArray(sessions.data)) {
            for (const session of sessions.data) {
              await sql`
                DELETE FROM user_purchases
                WHERE stripe_session_id = ${session.id};
              `;
              revoked = true;
              console.log(`[WEBHOOK] Refund processed: revoked purchase for session ${session.id} (payment intent ${charge.payment_intent}).`);
            }
          }
        } catch (lookupErr) {
          console.error('[WEBHOOK] Failed to look up checkout sessions for refunded charge:', lookupErr.message);
        }
      }

      return response.status(200).json({ received: true, revoked });
    }

    // 3. Dispute/Chargeback event: immediately revoke entitlement
    if (event.type === 'charge.dispute.created') {
      const dispute = event.data?.object;
      if (!dispute) {
        return response.status(400).json({ error: 'Missing dispute object' });
      }

      const chargeId = typeof dispute.charge === 'string' ? dispute.charge : dispute.charge?.id;
      let revoked = false;

      // Check metadata on dispute or expanded charge object
      const metaUserAuthId = dispute.metadata?.user_auth_id || (typeof dispute.charge === 'object' ? dispute.charge?.metadata?.user_auth_id : null);
      const metaPackId = dispute.metadata?.pack_id || (typeof dispute.charge === 'object' ? dispute.charge?.metadata?.pack_id : null);

      if (metaUserAuthId && metaPackId) {
        try {
          await sql`
            DELETE FROM user_purchases
            WHERE auth0_id = ${metaUserAuthId} AND pack_id = ${metaPackId};
          `;
          revoked = true;
          console.warn(`[SECURITY ALERT] Dispute opened: revoked pack '${metaPackId}' for user '${metaUserAuthId}'.`);
        } catch (dbErr) {
          console.error('[WEBHOOK] Database delete error on dispute:', dbErr.message);
          revoked = true;
        }
      } else if (chargeId) {
        try {
          const charge = await stripe.charges.retrieve(chargeId);
          const chUserAuthId = charge?.metadata?.user_auth_id;
          const chPackId = charge?.metadata?.pack_id;

          if (chUserAuthId && chPackId) {
            await sql`
              DELETE FROM user_purchases
              WHERE auth0_id = ${chUserAuthId} AND pack_id = ${chPackId};
            `;
            revoked = true;
            console.warn(`[SECURITY ALERT] Dispute opened: revoked pack '${chPackId}' for user '${chUserAuthId}'.`);
          } else if (charge?.payment_intent) {
            const sessions = await stripe.checkout.sessions.list({ payment_intent: charge.payment_intent });
            if (sessions?.data && Array.isArray(sessions.data)) {
              for (const session of sessions.data) {
                await sql`
                  DELETE FROM user_purchases
                  WHERE stripe_session_id = ${session.id};
                `;
                revoked = true;
                console.warn(`[SECURITY ALERT] Dispute opened: revoked purchase for session ${session.id}.`);
              }
            }
          }
        } catch (disputeErr) {
          console.error('[WEBHOOK] Failed to process dispute entitlement revocation:', disputeErr.message);
        }
      }

      return response.status(200).json({ received: true, disputeHandled: true, revoked });
    }

    // Unhandled event types returned gracefully
    return response.status(200).json({ received: true, ignored: event.type });
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
