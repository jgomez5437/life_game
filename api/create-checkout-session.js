import Stripe from 'stripe';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  const { packId, userAuthId } = request.body || {};

  if (!packId) {
    return response.status(400).json({ error: 'Missing packId' });
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

    const priceMap = {
      god_mode: 299,
      instant_diplomas: 199,
      time_machine: 199,
      vip_supporter: 499,
      mafia_syndicate: 299,
      mafia_expansion: 299,
      artist_pack: 399,
      athlete_pack: 399,
      politician_pack: 399
    };

    const nameMap = {
      god_mode: 'God Mode & Stat Editor',
      instant_diplomas: 'Instant Diplomas',
      time_machine: 'Time Machine & Multi-Save Slots',
      vip_supporter: 'VIP Supporter & Unique Theme',
      mafia_syndicate: 'Start a Life Expansion: Mafia Pack',
      mafia_expansion: 'Start a Life Expansion: Mafia Pack',
      artist_pack: 'Artist & Creative Industry',
      athlete_pack: 'Athlete & Pro Sports',
      politician_pack: 'Politician & Head of State'
    };

    const amount = priceMap[packId] || 299;
    const name = nameMap[packId] || 'Life Game Expansion Pack';

    const origin = request.headers.origin || request.headers.referer || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      managed_payments: { enabled: false },
      allow_promotion_codes: true,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: name,
              tax_code: 'txcd_10000000',
              metadata: { pack_id: packId }
            },
            unit_amount: amount
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      metadata: {
        user_auth_id: userAuthId || 'guest',
        pack_id: packId
      },
      success_url: `${origin}/?purchase_success=true&pack_id=${packId}`,
      cancel_url: `${origin}/?purchase_cancelled=true`
    });

    return response.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Stripe Checkout Error:', error);
    return response.status(500).json({ error: error.message || 'Failed to create checkout session' });
  }
}
