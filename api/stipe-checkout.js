import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const PRICE_IDS = {
  solo:     'price_1THArnLsquikuKFTWp3JCd17',
  squadron: 'price_1THAvtLsquikuKFTLnJUfGcz',
  fleet:    'price_1THAzSLsquikuKFTeyGWOAHs',
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { plan, userId, email } = req.body
  if (!plan || !userId || !email) return res.status(400).json({ error: 'Missing required fields' })
  const priceId = PRICE_IDS[plan]
  if (!priceId) return res.status(400).json({ error: 'Invalid plan' })
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `https://botbrunch.com?checkout=success`,
      cancel_url: `https://botbrunch.com?checkout=cancelled`,
      metadata: { userId, plan },
      subscription_data: { metadata: { userId, plan } },
    })
    res.status(200).json({ url: session.url })
  } catch(e) {
    console.error('Stripe checkout error:', e)
    res.status(500).json({ error: e.message })
  }
}