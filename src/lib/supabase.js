import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(url, key)

// ── Auth helpers ──────────────────────────────────────────────────────────────
export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
  return data
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

// ── Subscriber helpers ────────────────────────────────────────────────────────
export async function getSubscriber(userId) {
  const { data, error } = await supabase
    .from('subscribers')
    .select('*')
    .eq('id', userId)
    .single()
  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function createSubscriber(userId, email, businessName = '') {
  const { data, error } = await supabase
    .from('subscribers')
    .insert({ id: userId, email, business_name: businessName, active: true })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function ensureSubscriber(userId, email) {
  let sub = await getSubscriber(userId)
  if (!sub) sub = await createSubscriber(userId, email)
  return sub
}

// ── Bot helpers ───────────────────────────────────────────────────────────────
export async function getBot(botId) {
  const { data, error } = await supabase
    .from('bots')
    .select('*')
    .eq('id', botId)
    .single()
  if (error) throw error
  return data
}

export async function getPublishedBot(botId) {
  const { data, error } = await supabase
    .from('bots')
    .select('*')
    .eq('id', botId)
    .eq('published', true)
    .single()
  if (error) throw error
  return data
}

export async function getBotByOwner(ownerId) {
  const { data, error } = await supabase
    .from('bots')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function saveBot(botData) {
  const { id, ...rest } = botData
  rest.updated_at = new Date().toISOString()
  if (id) {
    const { data, error } = await supabase
      .from('bots')
      .update(rest)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  } else {
    const { data, error } = await supabase
      .from('bots')
      .insert(rest)
      .select()
      .single()
    if (error) throw error
    return data
  }
}

// ── Conversation helpers ──────────────────────────────────────────────────────
export async function createConversation(botId, sessionId, type = 'chat', isAnon = true, userName = null) {
  const { data, error } = await supabase
    .from('conversations')
    .insert({ bot_id: botId, session_id: sessionId, type, is_anon: isAnon, user_name: userName })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getConversations(botId) {
  const { data, error } = await supabase
    .from('conversations')
    .select('*, messages(count)')
    .eq('bot_id', botId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

// ── Message helpers ───────────────────────────────────────────────────────────
export async function addMessage(conversationId, role, content, fromKb = false) {
  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, role, content, from_kb: fromKb })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getMessages(conversationId) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

// ── Knowledge gap helpers ─────────────────────────────────────────────────────
export async function createKnowledgeGap(botId, conversationId, question) {
  const { data, error } = await supabase
    .from('knowledge_gaps')
    .insert({ bot_id: botId, conversation_id: conversationId, question })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getKnowledgeGaps(botId) {
  const { data, error } = await supabase
    .from('knowledge_gaps')
    .select('*')
    .eq('bot_id', botId)
    .eq('resolved', false)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

// ── Stats helpers ─────────────────────────────────────────────────────────────
export async function getBotStats(botId) {
  const [convRes, gapRes, feedRes] = await Promise.all([
    supabase.from('conversations').select('id, created_at, session_id').eq('bot_id', botId),
    supabase.from('knowledge_gaps').select('id').eq('bot_id', botId).eq('resolved', false),
    supabase.from('feedback').select('id').eq('bot_id', botId).eq('resolved', false),
  ])
  const conversations = convRes.data || []
  const uniqueUsers   = new Set(conversations.map(c => c.session_id)).size
  const now           = Date.now()
  const week          = conversations.filter(c => now - new Date(c.created_at).getTime() < 7 * 86400000).length
  return {
    totalConversations: conversations.length,
    uniqueUsers,
    conversationsThisWeek: week,
    unresolvedGaps: gapRes.data?.length || 0,
    unresolvedFeedback: feedRes.data?.length || 0,
  }
}

// ── Claude AI ─────────────────────────────────────────────────────────────────
export async function callClaude({ system, messages, userMessage, allowWeb = false }) {
  const key   = import.meta.env.VITE_ANTHROPIC_API_KEY
  const tools = allowWeb ? [{ type: 'web_search_20250305', name: 'web_search' }] : undefined
  const res   = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system,
      messages: [...messages, { role: 'user', content: userMessage }],
      ...(tools ? { tools } : {}),
    }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n')
    || 'I was unable to generate a response. Please try again.'
}

export function buildBotSystem(bot) {
  const toneMap = {
    warm:         'warm, empathetic, and approachable',
    professional: 'professional, clear, and competent',
    expert:       'authoritative, precise, and knowledgeable',
    playful:      'friendly, light-hearted, and engaging',
    calm:         'calm, measured, and reassuring',
    educational:  'clear, structured, and educational',
    direct:       'direct, concise, and no-nonsense',
    consultative: 'consultative, thoughtful, and solution-focused',
  }
  const lengthMap = {
    short:    'Keep responses concise — 1-3 sentences where possible.',
    balanced: 'Aim for balanced responses — thorough but not excessive.',
    detailed: 'Give detailed, comprehensive responses.',
  }
  return `You are ${bot.name}${bot.descriptor ? `, ${bot.descriptor}` : ''}.

${bot.knowledge_text?.trim() ? `## Your Knowledge Base\nYour primary source of truth. Always prioritise this:\n\n---\n${bot.knowledge_text}\n---\n` : ''}

## Behaviour
- Tone: Be ${toneMap[bot.tone] || 'professional and helpful'}.
- ${lengthMap[bot.response_length] || ''}
- Emoji use: ${bot.emoji_use === 'none' ? 'Use no emojis.' : bot.emoji_use === 'minimal' ? 'Use emojis sparingly.' : 'Use emojis naturally.'}.
${bot.strict_kb_only ? '- ONLY answer from your knowledge base. If the answer is not there, say clearly: "I don\'t have that information yet. I\'ve flagged your question for the team."' : ''}
${bot.allow_broad_ai ? '- You may draw on general knowledge when the knowledge base does not cover the topic.' : ''}
- Never fabricate information. If you do not know, say so honestly.
- Stay in character as ${bot.name} at all times.

## Formatting
- Use clean markdown. Bold key terms, use bullet lists for multiple items, headings for long answers.
- Never output raw asterisks or hashes as visible characters.
- Keep answers scannable and easy to read.`
}

export function renderMarkdown(text) {
  if (!text) return ''
  const lines = text.split('\n')
  let html = '', inUl = false, inOl = false
  const close = () => { if (inUl) { html += '</ul>'; inUl = false } if (inOl) { html += '</ol>'; inOl = false } }
  const inline = s => s
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code style="font-family:monospace;font-size:0.9em;background:rgba(0,0,0,0.07);padding:1px 4px;border-radius:3px">$1</code>')
  for (const line of lines) {
    if (/^### (.+)/.test(line)) { close(); html += `<h3 style="font-size:13.5px;font-weight:600;margin:10px 0 4px">${inline(line.replace(/^### /,''))}</h3>`; continue }
    if (/^## (.+)/.test(line))  { close(); html += `<h2 style="font-size:14px;font-weight:600;margin:12px 0 4px">${inline(line.replace(/^## /,''))}</h2>`; continue }
    if (/^# (.+)/.test(line))   { close(); html += `<h2 style="font-size:15px;font-weight:700;margin:12px 0 4px">${inline(line.replace(/^# /,''))}</h2>`; continue }
    if (/^[-*•]\s+(.+)/.test(line)) { if (inOl){html+='</ol>';inOl=false} if(!inUl){html+='<ul style="padding-left:16px;margin:6px 0">';inUl=true} html+=`<li style="margin-bottom:3px">${inline(line.replace(/^[-*•]\s+/,''))}</li>`; continue }
    if (/^\d+[.)]\s+(.+)/.test(line)) { if (inUl){html+='</ul>';inUl=false} if(!inOl){html+='<ol style="padding-left:16px;margin:6px 0">';inOl=true} html+=`<li style="margin-bottom:3px">${inline(line.replace(/^\d+[.)]\s+/,''))}</li>`; continue }
    if (line.trim()==='') { close(); html+='<div style="height:5px"></div>'; continue }
    close(); html+=`<p style="margin:0 0 4px">${inline(line)}</p>`
  }
  close()
  return html
}
