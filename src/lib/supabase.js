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
    .insert({ 
      id: userId, 
      email, 
      business_name: businessName, 
      active: true,
      plan: 'trial',
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    })
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
    avatar_size: botData.avatar_size ? Math.round(Number(botData.avatar_size)) : null,
    avatar_shape: botData.avatar_shape,
    header_gradient_depth: botData.header_gradient_depth ? Math.round(Number(botData.header_gradient_depth)) : null,
    bubble_border_width: botData.bubble_border_width,
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
    texture_intensity: botData.texture_intensity,
    image_effect: botData.image_effect,
    image_effect_intensity: botData.image_effect_intensity,
    header_color: botData.header_color,
    bot_name_color: botData.bot_name_color,
    descriptor_color: botData.descriptor_color,
    welcome_color: botData.welcome_color,
    chat_font_color: botData.chat_font_color,
    online_color: botData.online_color,
    placeholder_color: botData.placeholder_color,
    input_text_color: botData.input_text_color,
    bot_bubble_color: botData.bot_bubble_color,
    user_chat_font_color: botData.user_chat_font_color,
    bubble_glow_color: botData.bubble_glow_color,
    bubble_glow_intensity: botData.bubble_glow_intensity,
    text_glow_color: botData.text_glow_color,
    text_glow_intensity: botData.text_glow_intensity,
    bubble_shadow_color: botData.bubble_shadow_color,
    bubble_shadow_intensity: botData.bubble_shadow_intensity,
    bubble_shadow_hardness: botData.bubble_shadow_hardness,
    header_text_outline_thickness: botData.header_text_outline_thickness,
    header_text_outline_opacity: botData.header_text_outline_opacity,
    header_text_outline_color: botData.header_text_outline_color,
    chat_text_outline_thickness: botData.chat_text_outline_thickness,
    chat_text_outline_opacity: botData.chat_text_outline_opacity,
    chat_text_outline_color: botData.chat_text_outline_color,
    header_alignment: botData.header_alignment,
    logo_position: botData.logo_position,
    user_bubble_color: botData.user_bubble_color,
    header_text_color: botData.header_text_color,
    input_bg_color: botData.input_bg_color,
    input_area_color: botData.input_area_color,
    title_color: botData.title_color,
    body_color: botData.body_color,
    resource_color: botData.resource_color,
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
    warm:         'warm, empathetic, and approachable. Use phrases like "I understand", "That\'s a great question", "I\'m happy to help". Address the user\'s feelings before giving information.',
    professional: 'professional, clear, and competent. Use formal language, avoid slang, structure responses logically. Never use exclamation marks.',
    expert:       'authoritative and precise. State facts confidently, reference specifics from your knowledge base, avoid hedging language like "I think" or "maybe".',
    playful:      'friendly, light-hearted, and fun. Use casual language, occasional humour, and keep things upbeat. Short punchy sentences work well.',
    calm:         'calm, measured, and reassuring. Never rush. Acknowledge concerns, speak slowly through your writing, use gentle language.',
    educational:  'structured and educational. Break things down step by step. Use numbered lists, explain the "why" behind answers, and check understanding.',
    direct:       'extremely direct and brief. Get to the point immediately. No preamble, no pleasantries. Just the answer.',
    consultative: 'consultative and thoughtful. Ask clarifying questions before giving advice. Consider multiple angles. Help the user think through their situation.',
  }
  const lengthMap = {
    short:    'Keep responses to 1-3 sentences MAXIMUM. Be ruthlessly concise. If you need more, use bullet points.',
    balanced: 'Aim for 2-4 sentences for simple questions, up to a short paragraph for complex ones. Never pad responses.',
    detailed: 'Give comprehensive, detailed responses. Cover all angles. Use headings and bullet points for long answers.',
  }
  const initiativeMap = {
    reactive:  'Only answer what is asked. Do not volunteer additional information or ask follow-up questions unless necessary.',
    followup:  'After answering, ask ONE relevant follow-up question to help the user further.',
    proactive: 'Proactively offer related information the user might need. Anticipate follow-up questions and answer them before they\'re asked.',
  }
  const styleMap = {
    conversational: 'Write conversationally, like a helpful human assistant. Natural sentences, no jargon.',
    polished:       'Write in polished, refined prose. Elegant word choices, well-structured sentences.',
    educational:    'Write to teach. Use examples, analogies, and step-by-step explanations.',
    support:        'Write like a support agent. Acknowledge the issue first, then solve it. Always confirm resolution.',
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

## Personality — follow these STRICTLY, they define your character
- TONE: ${toneMap[bot.tone] || 'Be professional and helpful.'}
- RESPONSE LENGTH: ${lengthMap[bot.response_length] || 'Aim for balanced responses.'}
- INITIATIVE: ${initiativeMap[bot.initiative] || 'Answer what is asked.'}
- WRITING STYLE: ${styleMap[bot.writing_style] || 'Write conversationally.'}
- EMOJI USE: ${bot.emoji_use === 'none' ? 'Never use emojis under any circumstances.' : bot.emoji_use === 'minimal' ? 'Use emojis very sparingly — maximum 1 per response, only when natural.' : 'Use emojis naturally to match your tone.'}

## Rules
${bot.strict_kb_only ? '- ONLY answer from your knowledge base. If the answer is not in your knowledge base, you MUST start your response with the exact token [FALLBACK] before any other text.' : ''}
${bot.allow_broad_ai ? '- You may draw on general knowledge when the knowledge base does not cover the topic.' : ''}
- Never fabricate information. If the answer is not in your knowledge base and you cannot confidently help, you MUST include the exact token [FALLBACK] at the very start of your response, before any other text. This token will be hidden from the user — it is for internal routing only.
- If you include [FALLBACK], your response after it MUST be exactly this message (word for word): "${bot.fallback_message || "I don't have that information yet. I've flagged your question for the team."}"
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