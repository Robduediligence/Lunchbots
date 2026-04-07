import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { conversationId, role, content, answered } = req.body
  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, role, content, answered })
    .select()
    .single()
  if (error) return res.status(500).json({ error: error.message })
  res.status(200).json(data)
}