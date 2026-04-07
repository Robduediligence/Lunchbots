import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { botId, conversationId, question } = req.body
  if (!botId || !question) return res.status(400).json({ error: 'Missing fields' })
  const { data, error } = await supabase
    .from('knowledge_gaps')
    .insert({ bot_id: botId, conversation_id: conversationId, question })
    .select()
    .single()
  if (error) return res.status(500).json({ error: error.message })
  res.status(200).json(data)
}