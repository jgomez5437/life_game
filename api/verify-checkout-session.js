import { sql } from '@vercel/postgres';
import Stripe from 'stripe';
import { verifyAuth } from './lib/verifyAuth.js';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  const { sessionId } = request.body || {};

  if (!sessionId) {
    return response.status(400).json({ error: 'Missing sessionId parameter' });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    return response.status(500).json({ error: 'Stripe secret key not configured on backend' });
  }

  // Attempt optional Auth verification
  let authUserId = null;
  try {
    authUserId = await verifyAuth(request);
  } catch (e) {
    // Guest or unauthenticated checkout
  }

  try {
    const stripe = new Stripe(stripeSecretKey);
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session || session.payment_status !== 'paid') {
      return response.status(400).json({
        verified: false,
        error: 'Payment not completed or invalid checkout session.'
      });
    }

    const packId = session.metadata?.pack_id;
    const resolvedUserId = authUserId || session.metadata?.user_auth_id || 'guest';
    const amountPaid = session.amount_total || 0;

    if (packId && resolvedUserId !== 'guest') {
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
