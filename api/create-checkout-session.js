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
    // Return sandbox notice if Stripe credentials are not configured yet
    return response.status(200).json({
      sandbox: true,
      url: null,
      message: 'Stripe keys not configured. Falling back to sandbox purchase simulation.'
    });
  }

  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(stripeSecretKey);

    const priceMap = {
      god_mode: 299,
      royalty_expansion: 499,
      mafia_expansion: 399,
      business_tycoon: 399,
      time_machine: 199,
      custom_avatar_studio: 199,
      vip_supporter: 499
    };

    const nameMap = {
      god_mode: 'God Mode & Stat Editor',
      royalty_expansion: 'Royalty & Nobility Expansion',
      mafia_expansion: 'Underworld & Crime Syndicate',
      business_tycoon: 'Business Tycoon Empire',
      time_machine: 'Time Machine & Multi-Save Slots',
      custom_avatar_studio: 'Custom Avatar Studio',
      vip_supporter: 'VIP Supporter & Luxury Dark Theme'
    };

    const amount = priceMap[packId] || 299;
    const name = nameMap[packId] || 'Life Game Expansion Pack';

    const origin = request.headers.origin || request.headers.referer || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: name,
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
    return response.status(500).json({ error: 'Failed to create checkout session' });
  }
}
