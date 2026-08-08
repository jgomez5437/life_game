import { sql } from '@vercel/postgres';
import Stripe from 'stripe';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
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
      event = stripe.webhooks.constructEvent(request.body, sig, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return response.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userAuthId = session.metadata?.user_auth_id;
      const packId = session.metadata?.pack_id;
      const stripeSessionId = session.id;
      const amountPaid = session.amount_total;

      if (userAuthId && packId) {
        // Ensure user_purchases table exists and insert entitlement
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
    }

    return response.status(200).json({ received: true });
  } catch (error) {
    console.error('Stripe Webhook Error:', error);
    return response.status(500).json({ error: 'Webhook processing failed' });
  }
}
