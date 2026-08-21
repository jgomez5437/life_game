import Stripe from 'stripe';
import { verifyAuth } from './lib/verifyAuth.js';
import { checkRateLimit } from './lib/rateLimit.js';
import { resolvePack } from './lib/validation.js';

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

  // Enforce rate limiting: 5 checkout sessions / min per authenticated user
  if (!checkRateLimit(request, response, 'checkout', null, userAuthId)) {
    return;
  }

  // Authoritatively resolve and validate pack selection from server catalog
  const resolution = resolvePack(packId, priceId);
  if (resolution.error) {
    return response.status(resolution.status || 400).json({ error: resolution.error });
  }

  const pack = resolution.pack;

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

    const ALLOWED_ORIGINS = [
        'https://startalife.vercel.app',
        'http://localhost:3000',
        'http://localhost:5173'
    ];
    const rawOrigin = request.headers?.origin || request.headers?.referer || '';
    const origin = ALLOWED_ORIGINS.includes(rawOrigin) ? rawOrigin : 'https://startalife.vercel.app';

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
      success_url: `${origin}/?purchase_success=true&pack_id=${pack.id}`,
      cancel_url: `${origin}/?purchase_cancelled=true`
    });

    return response.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Stripe Checkout Error:', error);
    return response.status(500).json({ error: error.message || 'Failed to create checkout session' });
  }
}
