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

// ── Activity log ──────────────────────────────────────────────────────────────
export async function logActivity(botId, ownerId, type, description, meta = {}) {
  try {
    await supabase.from('activity_log').insert({
      bot_id: botId,
      owner_id: ownerId,
      type,
      description,
      meta,
    })
  } catch(e) {
    console.error('Activity log error:', e)
  }
}

export async function getActivityLog(botId, limit = 20) {
  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .eq('bot_id', botId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data || []
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

export async function getBotsByOwner(ownerId) {
  const { data, error } = await supabase
    .from('bots')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

export async function saveBot(botData) {
  const { id } = botData
  const clean = {
    owner_id: botData.owner_id, name: botData.name, descriptor: botData.descriptor,
    greeting: botData.greeting, welcome_message: botData.welcome_message,
    published: botData.published, published_at: botData.published_at,
    knowledge_text: botData.knowledge_text, knowledge_entries: botData.knowledge_entries,
    allow_web: botData.allow_web, allow_broad_ai: botData.allow_broad_ai,
    strict_kb_only: botData.strict_kb_only, fallback_message: botData.fallback_message,
    tone: botData.tone, response_length: botData.response_length,
    initiative: botData.initiative, writing_style: botData.writing_style,
    emoji_use: botData.emoji_use, primary_color: botData.primary_color,
    title_font: botData.title_font, body_font: botData.body_font,
    resource_font: botData.resource_font, font_size: botData.font_size ? Math.round(Number(botData.font_size)) : null,
    border_radius: botData.border_radius ? Math.round(Number(botData.border_radius)) : null,
    bg_overlay: botData.bg_overlay ? Math.round(Number(botData.bg_overlay)) : null,
    header_height: botData.header_height ? Math.round(Number(botData.header_height)) : null,
    spacing: botData.spacing ? Math.round(Number(botData.spacing)) : null,
    text_opacity: botData.text_opacity ? Math.round(Number(botData.text_opacity)) : null,
    panel_opacity: botData.panel_opacity ? Math.round(Number(botData.panel_opacity)) : null,
    logo_size: botData.logo_size ? Math.round(Number(botData.logo_size)) : null,
    chat_width: botData.chat_width ? Math.round(Number(botData.chat_width)) : null,
    border_radius: botData.border_radius ? Math.round(botData.border_radius) : null,
    bubble_style: botData.bubble_style,
    bg_color: botData.bg_color, bg_overlay: botData.bg_overlay ? Math.round(botData.bg_overlay) : null,
    bg_image_url: botData.bg_image_url, texture_overlay: botData.texture_overlay,
    header_height: botData.header_height ? Math.round(botData.header_height) : null,
    spacing: botData.spacing ? Math.round(botData.spacing) : null,
    text_opacity: botData.text_opacity ? Math.round(botData.text_opacity) : null,
    panel_opacity: botData.panel_opacity ? Math.round(botData.panel_opacity) : null,
    logo_size: botData.logo_size ? Math.round(botData.logo_size) : null,
    button_style: botData.button_style,
    avatar_letter: botData.avatar_letter, logo_url: botData.logo_url,
    avatar_url: botData.avatar_url, suggested_prompts: botData.suggested_prompts,
    categories: botData.categories, cta_text: botData.cta_text,
    cta_url: botData.cta_url, support_email: botData.support_email,
    use_case: botData.use_case, bot_type: botData.bot_type,
    access_password: botData.access_password, chat_width: botData.chat_width ? Math.round(botData.chat_width) : null,
    updated_at: new Date().toISOString(),
  }
  if (id) {
    const { data, error } = await supabase
      .from('bots')
      .update(clean)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
 } else {
    const { data, error } = await supabase
      .from('bots')
      .insert(clean)
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
  const [convRes, gapRes, feedRes, msgRes] = await Promise.all([
    supabase.from('conversations').select('id, created_at, session_id, type').eq('bot_id', botId),
    supabase.from('knowledge_gaps').select('id').eq('bot_id', botId).eq('resolved', false),
    supabase.from('feedback').select('id').eq('bot_id', botId).eq('resolved', false),
    supabase.from('messages').select('id, created_at, role').in('conversation_id',
      (await supabase.from('conversations').select('id').eq('bot_id', botId)).data?.map(c => c.id) || []
    ),
  ])
  const conversations = convRes.data || []
  const messages      = msgRes.data  || []
  const uniqueUsers   = new Set(conversations.map(c => c.session_id)).size
  const now           = Date.now()
  const weekMs        = 7 * 86400000

  // 7-day history — conversations per day
  const sevenDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now - (6 - i) * 86400000)
    const label = d.toLocaleDateString('en-NZ', { weekday: 'short' })
    const count = conversations.filter(c => {
      const cd = new Date(c.created_at)
      return cd.toDateString() === d.toDateString()
    }).length
    return { label, count }
  })

  return {
    totalConversations:   conversations.length,
    uniqueUsers,
    conversationsThisWeek: conversations.filter(c => now - new Date(c.created_at).getTime() < weekMs).length,
    totalMessages:        messages.filter(m => m.role === 'user').length,
    unresolvedGaps:       gapRes.data?.length || 0,
    unresolvedFeedback:   feedRes.data?.length || 0,
    feedbackCount:        conversations.filter(c => c.type === 'feedback').length,
    sevenDays,
  }
}
// ── Input sanitisation ────────────────────────────────────────────────────────
export function sanitise(str, maxLength = 10000) {
  if (!str || typeof str !== 'string') return ''
  return str
    .slice(0, maxLength)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim()
}

export function sanitiseKbEntry(entry) {
  return {
    ...entry,
    title:   sanitise(entry.title,   200),
    content: sanitise(entry.content, 50000),
  }
}

export function sanitiseMessage(msg, maxLength = 2000) {
  if (!msg || typeof msg !== 'string') return ''
  return msg.slice(0, maxLength).trim()
}
// ── Feedback helpers ──────────────────────────────────────────────────────────
export async function getFeedback(botId) {
  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .eq('bot_id', botId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function getFeedbackReplies(feedbackId) {
  const { data, error } = await supabase
    .from('feedback_replies')
    .select('*')
    .eq('feedback_id', feedbackId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

export async function addFeedbackReply(feedbackId, role, content) {
  const { data, error } = await supabase
    .from('feedback_replies')
    .insert({ feedback_id: feedbackId, role, content })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getFeedbackBySession(botId, sessionId) {
  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .eq('bot_id', botId)
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
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
  // Compile knowledge entries + legacy text into one KB string
  const entries = Array.isArray(bot.knowledge_entries) ? bot.knowledge_entries.filter(e => e.enabled !== false) : []
  const entriesText = entries.map(e => `### ${e.title}\n${e.content}`).join('\n\n---\n\n')
  const fullKb = [entriesText, bot.knowledge_text].filter(Boolean).join('\n\n---\n\n')

  const botContext = bot.bot_type === 'internal'
    ? 'You are an internal assistant for a business team. Users are employees or team members.'
    : 'You are a customer-facing assistant. Users are customers or members of the public.'

  return `You are ${bot.name}${bot.descriptor ? `, ${bot.descriptor}` : ''}. ${botContext}

${fullKb.trim() ? `## Your Knowledge Base\nThis is your ONLY source of truth. Always check here first before responding. If the answer is here, use it — even if the question is phrased differently:\n\n---\n${fullKb}\n---\n` : ''}

## Behaviour
- Tone: Be ${toneMap[bot.tone] || 'professional and helpful'}.
- ${lengthMap[bot.response_length] || ''}
- Emoji use: ${bot.emoji_use === 'none' ? 'Use no emojis.' : bot.emoji_use === 'minimal' ? 'Use emojis sparingly.' : 'Use emojis naturally.'}.
${bot.strict_kb_only ? '- ONLY answer from your knowledge base. If the answer is not there, say clearly: "I don\'t have that information yet. I\'ve flagged your question for the team."' : ''}
${bot.allow_broad_ai ? '- You may draw on general knowledge when the knowledge base does not cover the topic.' : ''}
- Never fabricate information. If the answer is not in your knowledge base and you cannot confidently help, you MUST include the exact token [FALLBACK] at the very start of your response, before any other text. This token will be hidden from the user — it is for internal routing only.
- If you include [FALLBACK], still give a brief, polite response after it explaining you don't have that information.
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

// ── Billing helpers ───────────────────────────────────────────────────────────
export const PLAN_LIMITS = {
  trial:    { bots: 1,  messages: 500 },
  solo:     { bots: 1,  messages: 500 },
  squadron: { bots: 3,  messages: 2000 },
  fleet:    { bots: 10, messages: 6000 },
  cancelled:     { bots: 0, messages: 0 },
  payment_failed: { bots: 0, messages: 0 },
}

export function getPlanLimits(sub) {
  return PLAN_LIMITS[sub?.plan] || PLAN_LIMITS.trial
}

export function isTrialActive(sub) {
  if (!sub?.trial_ends_at) return true
  return new Date(sub.trial_ends_at) > new Date()
}

export function canCreateBot(sub, currentBotCount) {
  if (isTrialActive(sub)) return true
  const limits = getPlanLimits(sub)
  return currentBotCount < limits.bots
}

export function canSendMessage(sub) {
  if (isTrialActive(sub)) return true
  if (!sub?.plan || sub.plan === 'cancelled' || sub.plan === 'payment_failed') return false
  const limits = getPlanLimits(sub)
  return (sub.messages_used || 0) < limits.messages
}

export async function incrementMessageCount(userId) {
  const { data } = await supabase
    .from('subscribers')
    .select('messages_used, messages_reset_at')
    .eq('id', userId)
    .single()
  if (!data) return
  // Reset counter if new month
  const resetAt = new Date(data.messages_reset_at)
  const now = new Date()
  if (now.getMonth() !== resetAt.getMonth() || now.getFullYear() !== resetAt.getFullYear()) {
    await supabase.from('subscribers').update({
      messages_used: 1,
      messages_reset_at: now.toISOString(),
    }).eq('id', userId)
  } else {
    await supabase.from('subscribers').update({
      messages_used: (data.messages_used || 0) + 1,
    }).eq('id', userId)
  }
}

export async function startCheckout(plan, userId, email) {
  const res = await fetch('/api/stripe-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan, userId, email }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Checkout failed')
  window.location.href = data.url
}