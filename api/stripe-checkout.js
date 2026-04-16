import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const PRICE_IDS = {
  solo:     'price_1THvx0L44h2epxDzfqMJhpEy',
  squadron: 'price_1THvyTL44h2epxDznvXKqMNk',
  fleet:    'price_1THvzDL44h2epxDzUQwdMF9U',
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { plan, userId, email, subscriptionId } = req.body
  if (!plan || !userId) return res.status(400).json({ error: 'Missing required fields' })
  const priceId = PRICE_IDS[plan]
  if (!priceId) return res.status(400).json({ error: 'Invalid plan' })

  try {
    if (subscriptionId) {
      // Existing subscriber — update subscription directly, no new checkout
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      const itemId = subscription.items.data[0].id
      await stripe.subscriptions.update(subscriptionId, {
        items: [{ id: itemId, price: priceId }],
        proration_behavior: 'always_invoice',
        metadata: { userId, plan },
      })
      await supabase.from('subscribers')
        .update({ plan })
        .eq('id', userId)
      return res.status(200).json({ ok: true })
    }

    // New subscriber — create checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `https://botbrunch.com/dashboard?checkout=success`,
      cancel_url: `https://botbrunch.com/dashboard?checkout=cancelled`,
      metadata: { userId, plan },
      subscription_data: {
        metadata: { userId, plan },
        trial_period_days: 14,
      },
    })
    return res.status(200).json({ url: session.url })
  } catch(e) {
    console.error('Stripe checkout error:', e)
    return res.status(500).json({ error: e.message })
  }
}