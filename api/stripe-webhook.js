import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const PLAN_LIMITS = {
  solo:     { bots: 1,  messages: 500 },
  squadron: { bots: 3,  messages: 2000 },
  fleet:    { bots: 10, messages: 6000 },
}

export const config = { api: { bodyParser: false } }

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', chunk => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const sig = req.headers['stripe-signature']
  const rawBody = await getRawBody(req)
  let event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch(e) {
    console.error('Webhook signature failed:', e.message)
    return res.status(400).json({ error: `Webhook error: ${e.message}` })
  }

  try {
    switch(event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const { userId, plan } = session.metadata || {}
        if (!userId || !plan) break
        await supabase.from('subscribers').update({
          plan,
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
          messages_used: 0,
          messages_reset_at: new Date().toISOString(),
        }).eq('id', userId)
        break
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object
        const userId = sub.metadata?.userId
        if (!userId) break
        const plan = sub.metadata?.plan
        const status = sub.status
        if (status === 'active' && plan) {
          await supabase.from('subscribers').update({ plan }).eq('id', userId)
        }
        break
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object
        const userId = sub.metadata?.userId
        if (!userId) break
        await supabase.from('subscribers').update({
          plan: 'cancelled',
          stripe_subscription_id: null,
        }).eq('id', userId)
        break
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object
        const customerId = invoice.customer
        await supabase.from('subscribers').update({
          plan: 'payment_failed',
        }).eq('stripe_customer_id', customerId)
        break
      }
    }
  } catch(e) {
    console.error('Webhook handler error:', e)
  }

  res.status(200).json({ received: true })
}