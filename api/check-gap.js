import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  const { id } = req.query
  if (!id) return res.status(400).json({ error: 'Missing id' })
  const { data, error } = await supabase
    .from('knowledge_gaps')
    .select('admin_answer, resolved')
    .eq('id', id)
    .single()
  if (error) return res.status(500).json({ error: error.message })
  res.status(200).json(data)
}