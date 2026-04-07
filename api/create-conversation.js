import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { botId, sessionId } = req.body
  const { data, error } = await supabase
    .from('conversations')
    .insert({ bot_id: botId, session_id: sessionId, type: 'chat' })
    .select()
    .single()
  if (error) return res.status(500).json({ error: error.message })
  res.status(200).json(data)
}