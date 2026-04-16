import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { gapId, email } = req.body
  if (!gapId) return res.status(400).json({ error: 'Missing gapId' })

  const { error } = await supabase
    .from('knowledge_gaps')
    .update({ user_email: email })
    .eq('id', gapId)

  if (error) return res.status(500).json({ error: error.message })
  return res.status(200).json({ ok: true })
}