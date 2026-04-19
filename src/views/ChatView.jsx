import { useState, useRef, useEffect } from 'react'
import {
  getPublishedBot, createConversation, addMessage,
  createKnowledgeGap, callClaude, buildBotSystem, renderMarkdown
} from '../lib/supabase.js'
import { I, Spinner } from '../components/UI.jsx'

export default function ChatView({ botId }) {
  const [bot,     setBot]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [mode,    setMode]    = useState(null)
  const [unlocked, setUnlocked] = useState(false) // null=landing, 'chat', 'feedback'

  useEffect(() => {
    getPublishedBot(botId)
      .then(setBot)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [botId])

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--parch-1)', gap:8 }}>
      <Spinner size={20} color="var(--coffee-3)" />
    </div>
  )

  if (error || !bot) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--parch-1)', padding:24 }}>
      <div style={{ background:'var(--surface)', border:'1px solid var(--line)', borderRadius:'var(--r-xl)', padding:'48px 40px', textAlign:'center', maxWidth:380, boxShadow:'var(--shadow-md)' }}>
        <div style={{ fontSize:28, marginBottom:14, opacity:0.4 }}>✦</div>
        <div className="serif" style={{ fontSize:17, fontWeight:600, marginBottom:8, color:'var(--coffee-0)' }}>
          {error ? 'Something went wrong' : 'Bot not found'}
        </div>
        <p style={{ fontSize:13.5, color:'var(--ink3)', lineHeight:1.65, marginBottom:20 }}>
          {error === 'Failed to fetch'
            ? 'Could not connect. Please check your internet connection and try again.'
            : error
            ? error
            : 'This link may be invalid or the bot may have been removed.'}
        </p>
        {error && (
          <button onClick={() => window.location.reload()}
            style={{ background:'var(--coffee-0)', color:'var(--parch-1)', border:'none', borderRadius:'var(--r)', padding:'10px 20px', cursor:'pointer', fontSize:13, fontWeight:500 }}>
            Try again
          </button>
        )}
      </div>
    </div>
  )

  if (bot.bot_type === 'internal' && !unlocked)
    return <PasswordGate bot={bot} onUnlock={() => setUnlocked(true)} />
  if (mode === 'chat')     return <ActiveChat bot={bot} />
  if (mode === 'feedback') return <FeedbackView bot={bot} onBack={() => setMode(null)} />
  return <LandingScreen bot={bot} onChat={() => setMode('chat')} onFeedback={() => setMode('feedback')} />
}

export function ActiveChat({ bot, previewMode = false }) {
  const [msgs,      setMsgs]      = useState([])
  const [input,     setInput]     = useState('')
  const [thinking,  setThinking]  = useState(false)
  const [convId,    setConvId]    = useState(null)
  const [sessionId] = useState(() => Math.random().toString(36).slice(2,10))
  const [pendingGap, setPendingGap] = useState(null) // gap id waiting for admin answer
const [awaitingEmail, setAwaitingEmail] = useState(false)
const [userEmail, setUserEmail] = useState('')
const [emailInput, setEmailInput] = useState('')
  const pollRef = useRef(null)
  const msgsRef  = useRef([])
  const bottomRef= useRef(null)
  const inputRef = useRef(null)

  // Poll for admin answer when a gap is pending
  useEffect(() => {
    if (!pendingGap) return
    pollRef.current = setInterval(async () => {
      try {
        const data = await fetch(`/api/check-gap?id=${pendingGap}`)
          .then(r => r.json()).catch(() => null)
        if (data?.resolved && data?.admin_answer) {
          clearInterval(pollRef.current)
          setPendingGap(null)
          // Remove waiting message and add real answer
          setMsgs(p => [
            ...p.filter(m => m.id !== 'waiting'),
            { role:'bot', content: `✅ The team just got back to you:\n\n${data.admin_answer}`, id:'admin-reply-' + Date.now() }
          ])
        }
      } catch(e) { console.error(e) }
    }, 5000)
    return () => clearInterval(pollRef.current)
  }, [pendingGap])

  // Bot branding
  const primary  = bot.primary_color  || '#2C1810'
  const bg       = bot.bg_color       || '#F5F0E8'
  const bgImage  = bot.bg_image_url   || null
  const bgOv     = typeof bot.bg_overlay === 'number' ? bot.bg_overlay : 40
  const font     = bot.font_family    || 'Inter, system-ui, sans-serif'
  const sz       = typeof bot.font_size === 'number' ? bot.font_size : 14
  const radius   = typeof bot.border_radius === 'number' ? bot.border_radius : 12
  const rr       = `${radius}px`
  const letter   = (bot.avatar_letter || bot.name?.charAt(0) || 'B').toUpperCase()
  const prompts  = (bot.suggested_prompts || []).filter(Boolean)

  const userBubble = bot.bubble_style === 'outlined'
    ? { background:'transparent', border:`1.5px solid ${primary}`, color:primary }
    : bot.bubble_style === 'minimal'
    ? { background:`${primary}18`, color:primary, border:'none' }
    : { background:primary, color:'white', border:'none' }

  useEffect(() => {
    const greeting = bot.greeting || `Hi! I'm ${bot.name}. How can I help you today?`
    setMsgs([{ role:'bot', content:greeting, id:'greeting' }])
    msgsRef.current = []
    setConvId(null)
    setPendingGap(null)
    // Create conversation record
    if (!previewMode) {
      fetch('/api/create-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botId: bot.id, sessionId })
      }).then(r => r.json()).then(c => { if (c.id) setConvId(c.id) }).catch(console.error)
    }
  }, [bot.id])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }) }, [msgs, thinking])

  async function send(text) {
    const { sanitiseMessage } = await import('../lib/supabase.js')
    const t = sanitiseMessage((text || input).trim())
    if (!t || thinking) return
    // Ensure conversation exists before proceeding
    if (!convId) {
      const newConv = await fetch('/api/create-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botId: bot.id, sessionId })
      }).then(r => r.json()).catch(() => null)
      if (newConv?.id) setConvId(newConv.id)
    }
    setInput('')
    inputRef.current?.focus()

    const userMsg = { role:'user', content:t, id:Date.now().toString() }
    setMsgs(p => [...p, userMsg])
    msgsRef.current = [...msgsRef.current, { role:'user', content:t }]
    if (convId && !previewMode) await fetch('/api/add-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: convId, role: 'user', content: t })
    }).catch(console.error)
    setThinking(true)

    const history = msgsRef.current.slice(0,-1).map(m => ({ role: m.role==='bot'?'assistant':'user', content:m.content }))

    try {
      const reply = await callClaude({ system: buildBotSystem(bot), messages: history, userMessage: t, allowWeb: bot.allow_web })

      // Detect if it's a fallback
      const isFallback = reply.includes('[FALLBACK]')
      const cleanReply = reply.replace(/\[FALLBACK\]/g, '').trimStart()
      console.log('BOT REPLY:', reply.substring(0, 100))
      console.log('IS FALLBACK:', isFallback)
      console.log('STRICT KB:', bot.strict_kb_only)

      const botMsg = { role:'bot', content:cleanReply, id:(Date.now()+1).toString() }
      setMsgs(p => [...p, botMsg])
      msgsRef.current = [...msgsRef.current, { role:'bot', content:cleanReply }]
      if (convId) await fetch('/api/add-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: convId, role: 'bot', content: cleanReply, answered: !isFallback })
      }).catch(console.error)

 // If fallback, create knowledge gap and start polling
      if (isFallback) {
        const activeConvId = convId || await fetch('/api/create-conversation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ botId: bot.id, sessionId })
        }).then(r => r.json()).then(c => { if (c.id) { setConvId(c.id); return c.id } }).catch(() => null)
        console.log('activeConvId:', activeConvId)
        if (activeConvId) {
          console.log('Creating gap with convId:', activeConvId)
          const gapRes = await fetch('/api/create-gap', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ botId: bot.id, conversationId: activeConvId, question: t })
          })
          console.log('Gap response status:', gapRes.status)
          const gap = await gapRes.json().catch(console.error)
          console.log('Gap result:', gap)
          if (gap) {
            setPendingGap(gap.id)
            setAwaitingEmail(true)
            setMsgs(p => [...p, { role:'bot', content:'⏳ I\'ve flagged this for the team. If you\'d like to be notified when they respond, drop your email below.', id:'waiting', isWaiting:true }])
          }
        }
      }
    } catch {
      const errMsg = { role:'bot', content:'Something went wrong. Please try again.', id:(Date.now()+1).toString() }
      setMsgs(p => [...p, errMsg])
    }
    setThinking(false)
  }

  return (
    <div style={{
      display:'flex', flexDirection:'column', height:'100vh',
      fontFamily:font, fontSize:sz, position:'relative',
      background: bgImage ? `url(${bgImage}) center/cover no-repeat` : bg,
    }}>
      {bgImage && <div style={{ position: previewMode ? 'absolute' : 'fixed', inset:0, background:`rgba(0,0,0,${bgOv/100})`, zIndex:0 }} />}

      {/* Header */}
      <div style={{
        position:'relative', zIndex:1, padding:'12px 18px',
        borderBottom:'1px solid rgba(0,0,0,0.07)',
        display:'flex', alignItems:'center', gap:12,
        background: bgImage ? 'rgba(253,250,244,0.9)' : 'rgba(253,250,244,0.95)',
        backdropFilter:'blur(12px)', flexShrink:0,
      }}>
        <div style={{ width:38, height:38, borderRadius:`${Math.min(radius,12)}px`, flexShrink:0, background:bot.avatar_url||bot.logo_url?'transparent':primary, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:700, color:'white', overflow:'hidden', boxShadow:`0 2px 8px ${primary}33` }}>
          {bot.avatar_url ? <img src={bot.avatar_url} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          : bot.logo_url ? <img src={bot.logo_url} alt="logo" style={{ width:'100%', height:'100%', objectFit:'contain', padding:4 }} />
          : letter}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:font, fontSize:sz*0.95, fontWeight:600, color:'#2F2F2F', lineHeight:1.2 }}>{bot.name}</div>
          {bot.descriptor && <div style={{ fontSize:sz*0.78, color:'var(--ink4)', marginTop:1 }}>{bot.descriptor}</div>}
          <div style={{ fontSize:sz*0.75, color:'var(--success)', display:'flex', alignItems:'center', gap:4, marginTop:2 }}>
            <span style={{ width:5, height:5, borderRadius:'50%', background:'var(--success)', display:'inline-block', flexShrink:0 }} /> Online
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:'auto', padding:'20px 22px', display:'flex', flexDirection:'column', gap:14, position:'relative', zIndex:1 }}>
        {/* Welcome + prompts */}
        {(bot.welcome_message || prompts.length > 0) && msgs.length <= 1 && (
          <div style={{ marginBottom:8 }}>
            {bot.welcome_message && <p style={{ fontFamily:font, fontSize:sz*0.88, color: bgImage ? 'rgba(255,255,255,0.85)' : 'var(--ink3)', lineHeight:1.7, marginBottom:12 }}>{bot.welcome_message}</p>}
            {prompts.length > 0 && (
              <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
                {prompts.map((p, i) => (
                  <button key={i} onClick={() => send(p)}
                    style={{ fontFamily:font, fontSize:sz*0.84, padding:'7px 13px', borderRadius:rr, cursor:'pointer', background: bgImage ? 'rgba(255,255,255,0.92)' : 'white', border:'1px solid rgba(0,0,0,0.09)', color:'var(--ink)', transition:'all 0.12s' }}>
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {msgs.map((m, i) => (
          <div key={m.id || i} className="msg-in" style={{ display:'flex', gap:9, maxWidth:'83%', alignSelf:m.role==='user'?'flex-end':'flex-start', flexDirection:m.role==='user'?'row-reverse':'row' }}>
            <div style={{ width:26, height:26, borderRadius:`${Math.min(radius*0.65,8)}px`, flexShrink:0, marginTop:3, background:m.role==='bot'?(bot.avatar_url?'transparent':primary):'rgba(0,0,0,0.08)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:m.role==='bot'?'white':'rgba(0,0,0,0.4)', overflow:'hidden' }}>
              {m.role==='bot' ? (bot.avatar_url ? <img src={bot.avatar_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : bot.logo_url ? <img src={bot.logo_url} alt="" style={{ width:'100%', height:'100%', objectFit:'contain', padding:2 }} /> : letter) : 'U'}
            </div>
            <div
              style={{
                padding:'10px 14px', fontFamily:font, fontSize:sz*0.92, lineHeight:1.65,
                borderRadius: m.role==='bot' ? `3px ${rr} ${rr} ${rr}` : `${rr} 3px ${rr} ${rr}`,
                ...(m.role==='user' ? userBubble : { background: bgImage?'rgba(255,255,255,0.93)':'white', border:'1px solid rgba(0,0,0,0.07)', color:'#2F2F2F', boxShadow:'0 1px 2px rgba(0,0,0,0.06)' }),
              }}
              dangerouslySetInnerHTML={m.role==='bot' ? { __html:renderMarkdown(m.content) } : undefined}
            >{m.role==='user' ? m.content : undefined}</div>
          </div>
        ))}

        {thinking && (
          <div className="msg-in" style={{ display:'flex', gap:9, maxWidth:'83%' }}>
            <div style={{ width:26, height:26, borderRadius:`${Math.min(radius*0.65,8)}px`, background:primary, flexShrink:0, marginTop:3, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'white', overflow:'hidden' }}>
              {bot.avatar_url ? <img src={bot.avatar_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : letter}
            </div>
            <div style={{ padding:'12px 16px', borderRadius:`3px ${rr} ${rr} ${rr}`, background: bgImage?'rgba(255,255,255,0.93)':'white', border:'1px solid rgba(0,0,0,0.07)', display:'flex', gap:5, alignItems:'center', boxShadow:'var(--shadow-xs)' }}>
              {[0,1,2].map(i => <div key={i} className="t-dot" style={{ background:'var(--coffee-4)' }} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        position:'relative', zIndex:1,
        padding:'12px 16px', borderTop:'1px solid rgba(0,0,0,0.07)',
        display:'flex', gap:9, alignItems:'flex-end',
        background: bgImage ? 'rgba(253,250,244,0.9)' : 'rgba(253,250,244,0.97)',
        backdropFilter:'blur(12px)', flexShrink:0,
      }}>
        {awaitingEmail ? (
          <div style={{ display:'flex', gap:8, flex:1, alignItems:'center' }}>
            <input
              style={{ flex:1, background:'white', border:'1px solid rgba(0,0,0,0.15)', color:'#1a1a1a', fontFamily:font, fontSize:sz*0.9, borderRadius:`${radius*0.75}px`, padding:'9px 13px', outline:'none' }}
              placeholder="your@email.com (optional)"
              value={emailInput}
              onChange={e => setEmailInput(e.target.value)}
              onKeyDown={async e => {
                if (e.key === 'Enter') {
                  setAwaitingEmail(false)
                  if (emailInput.trim() && pendingGap) {
                    await fetch('/api/update-gap-email', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ gapId: pendingGap, email: emailInput.trim() })
                    }).catch(console.error)
                  }
                  setMsgs(p => p.map(m => m.id === 'waiting' ? { ...m, content: emailInput.trim() ? '✅ Got it! We\'ll email you at ' + emailInput.trim() + ' when we have an answer.' : '✅ No problem — we\'ll have an answer ready next time you visit.' } : m))
                }
              }}
              autoFocus
            />
            <button
              onClick={async () => {
                setAwaitingEmail(false)
                if (emailInput.trim() && pendingGap) {
                  await fetch('/api/update-gap-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ gapId: pendingGap, email: emailInput.trim() })
                  }).catch(console.error)
                }
                setMsgs(p => p.map(m => m.id === 'waiting' ? { ...m, content: emailInput.trim() ? '✅ Got it! We\'ll email you at ' + emailInput.trim() + ' when we have an answer.' : '✅ No problem — we\'ll have an answer ready next time you visit.' } : m))
              }}
              style={{ padding:'9px 16px', borderRadius:`${Math.min(radius,12)}px`, background:primary, border:'none', color:'white', fontSize:sz*0.9, fontWeight:500, cursor:'pointer', whiteSpace:'nowrap' }}>
              Notify me
            </button>
            <button
              onClick={() => {
                setAwaitingEmail(false)
                setMsgs(p => p.map(m => m.id === 'waiting' ? { ...m, content: '✅ No problem — we\'ll have an answer ready next time you visit.' } : m))
              }}
              style={{ padding:'9px 12px', borderRadius:`${Math.min(radius,12)}px`, background:'transparent', border:'1px solid rgba(0,0,0,0.1)', color:'var(--ink3)', fontSize:sz*0.85, cursor:'pointer', whiteSpace:'nowrap' }}>
              Skip
            </button>
          </div>
        ) : (
          <>
            <textarea ref={inputRef}
              style={{ flex:1, background:'white', border:'1px solid rgba(0,0,0,0.15)', color:'#1a1a1a', fontFamily:font, fontSize:sz*0.9, borderRadius:`${radius*0.75}px`, padding:'9px 13px', outline:'none', resize:'none', lineHeight:1.5, maxHeight:120 }}
              placeholder="Send a message…"
              value={input} rows={1}
              onChange={e => setInput(e.target.value.slice(0, 2000))}
              onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            />
            <button onClick={() => send()} disabled={!input.trim()||thinking}
              style={{ width:38, height:38, borderRadius:`${Math.min(radius,12)}px`, background:primary, border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:input.trim()&&!thinking?'pointer':'not-allowed', opacity:input.trim()&&!thinking?1:0.4, alignSelf:'flex-end', transition:'all 0.12s', boxShadow:`0 2px 8px ${primary}44` }}>
              {thinking ? <Spinner size={15} color="white" /> : <I.Send width={15} height={15} style={{ color:'white' }} />}
            </button>
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{ position:'relative', zIndex:1, padding:'6px 16px', textAlign:'center', fontSize:11, color: bgImage?'rgba(255,255,255,0.4)':'var(--ink5)', background: bgImage?'rgba(0,0,0,0.1)':'transparent', flexShrink:0 }}>
        {bot.cta_text && bot.cta_url
          ? <a href={bot.cta_url} target="_blank" rel="noreferrer" style={{ color:primary, textDecoration:'none', fontWeight:500 }}>{bot.cta_text}</a>
         : 'Powered by Bot Brunch'}
      </div>
    </div>
  )
}

// ── Landing screen — Ask a question or Leave feedback ─────────────────────────
function LandingScreen({ bot, onChat, onFeedback }) {
  const primary  = bot.primary_color  || '#2C1810'
  const bg       = bot.bg_color       || '#F5F0E8'
  const bgImage  = bot.bg_image_url   || null
  const bgOv     = typeof bot.bg_overlay === 'number' ? bot.bg_overlay : 40
  const font     = bot.body_font      || bot.font_family || 'Inter, system-ui, sans-serif'
  const titleFont= bot.title_font     || "'Playfair Display', serif"
  const sz       = typeof bot.font_size === 'number' ? bot.font_size : 14
  const radius   = typeof bot.border_radius === 'number' ? bot.border_radius : 12
  const letter   = (bot.avatar_letter || bot.name?.charAt(0) || 'B').toUpperCase()

  return (
    <div style={{
      display:'flex', flexDirection:'column', alignItems:'center',
      justifyContent:'center', minHeight:'100vh', padding:28,
      fontFamily:font, fontSize:sz, position:'relative',
      background: bgImage ? `url(${bgImage}) center/cover no-repeat` : bg,
    }}>
      {bgImage && <div style={{ position:'fixed', inset:0, background:`rgba(0,0,0,${bgOv/100})`, zIndex:0 }} />}

      <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:400, display:'flex', flexDirection:'column', alignItems:'center', gap:28 }}>

        {/* Bot identity */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12, animation:'fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both' }}>
          <div style={{
            width:72, height:72, borderRadius:`${Math.min(radius*1.2,20)}px`,
            background: bot.avatar_url ? 'transparent' : primary,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:28, fontWeight:700, color:'white', overflow:'hidden',
            boxShadow:`0 8px 24px ${primary}44`,
          }}>
            {bot.avatar_url
              ? <img src={bot.avatar_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              : letter}
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontFamily:titleFont, fontSize:sz*1.4, fontWeight:600, color: bgImage?'white':'var(--ink)', marginBottom:4, letterSpacing:-0.3 }}>
              {bot.name}
            </div>
            {bot.descriptor && (
              <div style={{ fontSize:sz*0.9, color: bgImage?'rgba(255,255,255,0.7)':'var(--ink3)' }}>
                {bot.descriptor}
              </div>
            )}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:5, marginTop:6, fontSize:sz*0.8, color:'#2D9E6B' }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'#2D9E6B', display:'inline-block' }} />
              Online
            </div>
          </div>
        </div>

        {/* Welcome message */}
        {bot.welcome_message && (
          <p style={{
            textAlign:'center', fontSize:sz*0.95, lineHeight:1.7,
            color: bgImage?'rgba(255,255,255,0.85)':'var(--ink3)',
            maxWidth:340, animation:'fadeUp 0.5s 0.08s cubic-bezier(0.22,1,0.36,1) both',
          }}>
            {bot.welcome_message}
          </p>
        )}

        {/* Two option cards */}
        <div style={{ width:'100%', display:'flex', flexDirection:'column', gap:12, animation:'fadeUp 0.5s 0.16s cubic-bezier(0.22,1,0.36,1) both' }}>
          <button onClick={onChat} style={{
            width:'100%', padding:'20px 24px', borderRadius:`${radius}px`,
            background: bgImage ? 'rgba(255,255,255,0.95)' : 'white',
            border:`1.5px solid ${primary}22`,
            boxShadow:`0 2px 12px rgba(0,0,0,0.08), 0 0 0 0 ${primary}`,
            cursor:'pointer', textAlign:'left', transition:'all 0.18s',
            display:'flex', alignItems:'center', gap:16,
          }}
          onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=`0 8px 24px rgba(0,0,0,0.12)` }}
          onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=`0 2px 12px rgba(0,0,0,0.08)` }}>
            <div style={{ width:44, height:44, borderRadius:`${Math.min(radius,12)}px`, background:primary, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <span style={{ fontSize:20 }}>💬</span>
            </div>
            <div>
              <div style={{ fontFamily:titleFont, fontSize:sz*1.05, fontWeight:600, color:'var(--ink)', marginBottom:3 }}>Ask a question</div>
              <div style={{ fontSize:sz*0.85, color:'var(--ink3)', lineHeight:1.5 }}>Get an instant answer from the knowledge base</div>
            </div>
            <I.ChevR style={{ marginLeft:'auto', color:'var(--ink4)', flexShrink:0 }} />
          </button>

          <button onClick={onFeedback} style={{
            width:'100%', padding:'20px 24px', borderRadius:`${radius}px`,
            background: bgImage ? 'rgba(255,255,255,0.95)' : 'white',
            border:'1.5px solid rgba(0,0,0,0.06)',
            boxShadow:'0 2px 12px rgba(0,0,0,0.06)',
            cursor:'pointer', textAlign:'left', transition:'all 0.18s',
            display:'flex', alignItems:'center', gap:16,
          }}
          onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.1)' }}
          onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ width:44, height:44, borderRadius:`${Math.min(radius,12)}px`, background:'var(--surface2)', border:'1px solid var(--line)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <span style={{ fontSize:20 }}>📝</span>
            </div>
            <div>
              <div style={{ fontFamily:titleFont, fontSize:sz*1.05, fontWeight:600, color:'var(--ink)', marginBottom:3 }}>
                {bot.bot_type === 'internal' ? 'Message the team' : 'Leave feedback'}
              </div>
              <div style={{ fontSize:sz*0.85, color:'var(--ink3)', lineHeight:1.5 }}>
                {bot.bot_type === 'internal' ? 'Send a message directly to your team' : 'Share a suggestion, thought, or experience'}
              </div>
            </div>
            <I.ChevR style={{ marginLeft:'auto', color:'var(--ink4)', flexShrink:0 }} />
          </button>
        </div>

        {/* Footer */}
        <div style={{ fontSize:sz*0.75, color: bgImage?'rgba(255,255,255,0.4)':'var(--ink5)', animation:'fadeUp 0.5s 0.24s cubic-bezier(0.22,1,0.36,1) both' }}>
          {bot.cta_text && bot.cta_url
            ? <a href={bot.cta_url} target="_blank" rel="noreferrer" style={{ color:primary, textDecoration:'none' }}>{bot.cta_text}</a>
            : 'Powered by Bot Brunch'}
        </div>
      </div>
    </div>
  )
}

// ── Feedback view — routes to correct version based on bot type ───────────────
function FeedbackView({ bot, onBack }) {
  if (bot.bot_type === 'internal') return <InternalMessaging bot={bot} onBack={onBack} />
  return <CustomerFeedback bot={bot} onBack={onBack} />
}

// ── Customer feedback — simple card form ──────────────────────────────────────
function CustomerFeedback({ bot, onBack }) {
  const primary   = bot.primary_color || '#2C1810'
  const bg        = bot.bg_color      || '#F5F0E8'
  const bgImage   = bot.bg_image_url  || null
  const bgOv      = typeof bot.bg_overlay === 'number' ? bot.bg_overlay : 40
  const font      = bot.body_font     || 'Inter, system-ui, sans-serif'
  const titleFont = bot.title_font    || "'Playfair Display', serif"
  const sz        = typeof bot.font_size === 'number' ? bot.font_size : 14
  const radius    = typeof bot.border_radius === 'number' ? bot.border_radius : 12
  const [text,    setText]    = useState('')
  const [isAnon,  setIsAnon]  = useState(true)
  const [name,    setName]    = useState('')
  const [contact, setContact] = useState('')
  const [sent,    setSent]    = useState(false)
  const [sending, setSending] = useState(false)
  const [sessionId] = useState(() => Math.random().toString(36).slice(2,10))

  async function submit() {
    const { supabase, sanitise } = await import('../lib/supabase.js')
    const cleanText = sanitise(text.trim(), 5000)
    if (!cleanText) return
    setSending(true)
    try {
      const { data: conv } = await supabase.from('conversations').insert({
        bot_id: bot.id, session_id: sessionId, type: 'feedback',
        is_anon: isAnon, user_name: isAnon ? null : name.trim() || null,
      }).select().single()
      await supabase.from('feedback').insert({
        bot_id: bot.id, conversation_id: conv.id,
        content: cleanText, is_anon: isAnon,
        user_name: isAnon ? null : name.trim() || null,
        user_contact: isAnon ? null : contact.trim() || null,
        session_id: sessionId,
      })
      setSent(true)
      triggerFeedbackSummary(bot)
    } catch(e) { console.error(e) }
    setSending(false)
  }



  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', padding:28, fontFamily:font, fontSize:sz, position:'relative', background: bgImage ? `url(${bgImage}) center/cover no-repeat` : bg }}>
      {bgImage && <div style={{ position:'fixed', inset:0, background:`rgba(0,0,0,${bgOv/100})`, zIndex:0 }} />}
      <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:400 }}>
        <button onClick={onBack} style={{ background:'none', border:'none', cursor:'pointer', fontSize:13, color: bgImage?'rgba(255,255,255,0.7)':'var(--ink3)', marginBottom:20, display:'flex', alignItems:'center', gap:5, padding:0 }}>← Back</button>
        <div style={{ background: bgImage?'rgba(255,255,255,0.97)':'white', borderRadius:`${radius}px`, padding:'28px 24px', boxShadow:'0 8px 32px rgba(0,0,0,0.12)' }}>
          {sent ? (
            <div style={{ textAlign:'center', padding:'20px 0' }}>
              <div style={{ fontSize:36, marginBottom:16 }}>🙏</div>
              <div style={{ fontFamily:titleFont, fontSize:sz*1.3, fontWeight:600, color:'var(--ink)', marginBottom:8 }}>Thank you</div>
              <p style={{ fontSize:sz*0.9, color:'var(--ink3)', lineHeight:1.65, marginBottom:24 }}>Your feedback has been sent to the team.</p>
              <button onClick={onBack} style={{ width:'100%', padding:'11px', borderRadius:`${Math.min(radius,10)}px`, background:primary, color:'white', border:'none', fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:font }}>← Back to start</button>
            </div>
          ) : (
            <>
              <div style={{ fontFamily:titleFont, fontSize:sz*1.2, fontWeight:600, color:'var(--ink)', marginBottom:4 }}>Share your feedback</div>
              <p style={{ fontSize:sz*0.85, color:'var(--ink3)', marginBottom:20, lineHeight:1.6 }}>Your thoughts go directly to the team.</p>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', background:'var(--surface2)', borderRadius:`${Math.min(radius,8)}px`, marginBottom:16, border:'1px solid var(--line)' }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:500, color:'var(--ink)' }}>Send anonymously</div>
                  <div style={{ fontSize:11.5, color:'var(--ink4)' }}>{isAnon ? "Your name won't be shown" : 'Your name will be visible'}</div>
                </div>
                <span onClick={() => setIsAnon(p=>!p)} style={{ position:'relative', display:'inline-block', width:36, height:20, background:isAnon?primary:'var(--parch-3)', borderRadius:20, cursor:'pointer', transition:'0.18s', flexShrink:0 }}>
                  <span style={{ position:'absolute', width:14, height:14, left: isAnon?19:2, top:3, background:'white', borderRadius:'50%', transition:'0.18s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }} />
                </span>
              </div>
              {!isAnon && (
                <>
                  <div style={{ marginBottom:14 }}>
                    <label style={{ fontSize:12, fontWeight:500, color:'var(--ink2)', display:'block', marginBottom:5 }}>Your name</label>
                    <input value={name} onChange={e=>setName(e.target.value)} placeholder="How should we address you?" style={{ width:'100%', padding:'9px 12px', borderRadius:`${Math.min(radius,8)}px`, border:'1px solid var(--line)', fontSize:13.5, fontFamily:font, outline:'none', boxSizing:'border-box' }} />
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={{ fontSize:12, fontWeight:500, color:'var(--ink2)', display:'block', marginBottom:5 }}>Contact <span style={{ fontWeight:400, color:'var(--ink4)' }}>(optional)</span></label>
                    <input value={contact} onChange={e=>setContact(e.target.value)} placeholder="Email or phone for follow up" style={{ width:'100%', padding:'9px 12px', borderRadius:`${Math.min(radius,8)}px`, border:'1px solid var(--line)', fontSize:13.5, fontFamily:font, outline:'none', boxSizing:'border-box' }} />
                  </div>
                </>
              )}
              <div style={{ marginBottom:18 }}>
                <label style={{ fontSize:12, fontWeight:500, color:'var(--ink2)', display:'block', marginBottom:5 }}>Your message</label>
                <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Share what's on your mind…" style={{ width:'100%', padding:'10px 12px', borderRadius:`${Math.min(radius,8)}px`, border:'1px solid var(--line)', fontSize:13.5, fontFamily:font, outline:'none', resize:'none', minHeight:120, lineHeight:1.65, boxSizing:'border-box' }} />
              </div>
              <button onClick={submit} disabled={!text.trim()||sending} style={{ width:'100%', padding:'12px', borderRadius:`${Math.min(radius,10)}px`, background:primary, color:'white', border:'none', fontSize:14, fontWeight:500, cursor:text.trim()&&!sending?'pointer':'not-allowed', opacity:text.trim()&&!sending?1:0.5, fontFamily:font }}>
                {sending ? 'Sending…' : 'Send feedback →'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
// ── Shared feedback summary trigger ──────────────────────────────────────────
async function triggerFeedbackSummary(bot) {
  try {
    const { supabase, callClaude } = await import('../lib/supabase.js')
    const { data: allFeedback } = await supabase
      .from('feedback').select('content').eq('bot_id', bot.id)
    if (!allFeedback || allFeedback.length === 0) return
    const text = allFeedback.map(f => `- ${f.content}`).join('\n')
    const isInternal = bot.bot_type === 'internal'
    const result = await callClaude({
      system: `Analyse this ${isInternal ? 'internal team' : 'customer'} feedback and return JSON only:
{
  "overview": "2-3 sentence summary",
  "topThemes": ["theme1","theme2","theme3"],
  "sentiment": "positive|neutral|mixed|negative",
  "urgent": ["urgent1"],
  "suggestions": ["suggestion1","suggestion2"]
}
${isInternal ? 'These are messages from employees or team members, not customers.' : 'These are messages from customers.'}`,
      messages: [],
      userMessage: `Feedback:\n${text}`,
    })
    const cleaned = result.replace(/```json|```/g, '').trim()
    const summary = JSON.parse(cleaned)
    await supabase.from('bots').update({
      feedback_summary: summary,
      feedback_summary_at: new Date().toISOString(),
    }).eq('id', bot.id)
    console.log('Summary trigger completed')
  } catch(e) { console.error('Summary generation failed:', e) }
}

// ── Internal messaging — messenger-style ──────────────────────────────────────
function InternalMessaging({ bot, onBack }) {
  const primary   = bot.primary_color || '#2C1810'
  const bg        = bot.bg_color      || '#F5F0E8'
  const font      = bot.body_font     || 'Inter, system-ui, sans-serif'
  const titleFont = bot.title_font    || "'Playfair Display', serif"
  const sz        = typeof bot.font_size === 'number' ? bot.font_size : 14
  const radius    = typeof bot.border_radius === 'number' ? bot.border_radius : 12
  const [sessionId] = useState(() => {
    try {
      const key = `lb_session_${bot.id}`
      const existing = localStorage.getItem(key)
      if (existing) return existing
      const id = Math.random().toString(36).slice(2,10)
      localStorage.setItem(key, id)
      return id
    } catch(e) {
      return Math.random().toString(36).slice(2,10)
    }
  })
  const [threads,   setThreads]   = useState([])
  const [selected,  setSelected]  = useState(null)
  const [replies,   setReplies]   = useState([])
  const [newMsg,    setNewMsg]     = useState('')
  const [sending,   setSending]   = useState(false)
  const [loading,   setLoading]   = useState(true)
  const [composing, setComposing] = useState(false)
  const [draftText, setDraftText] = useState('')
  const [isAnon,    setIsAnon]    = useState(true)
  const [name,      setName]      = useState('')
  const bottomRef = useRef(null)

  useEffect(() => { loadThreads() }, [])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }) }, [replies])

  async function loadThreads() {
    setLoading(true)
    try {
      const { getFeedbackBySession } = await import('../lib/supabase.js')
      const data = await getFeedbackBySession(bot.id, sessionId)
      setThreads(data)
    } catch(e) { console.error(e) }
    setLoading(false)
  }

  async function openThread(fb) {
    setSelected(fb)
    setComposing(false)
    const { getFeedbackReplies } = await import('../lib/supabase.js')
    const data = await getFeedbackReplies(fb.id)
    setReplies(data)
  }

  async function sendReply() {
    if (!newMsg.trim() || !selected) return
    setSending(true)
    try {
      const { addFeedbackReply } = await import('../lib/supabase.js')
      await addFeedbackReply(selected.id, 'user', newMsg.trim())
      const { getFeedbackReplies } = await import('../lib/supabase.js')
      const data = await getFeedbackReplies(selected.id)
      setReplies(data)
      setNewMsg('')
    } catch(e) { console.error(e) }
    setSending(false)
  }

  async function startNewThread() {
    if (!draftText.trim()) return
    setSending(true)
    try {
      const { supabase, sanitise } = await import('../lib/supabase.js')
      const cleanDraft = sanitise(draftText.trim(), 5000)
      if (!cleanDraft) return
      const { data: conv } = await supabase.from('conversations').insert({
        bot_id: bot.id, session_id: sessionId, type: 'feedback',
        is_anon: isAnon, user_name: isAnon ? null : name.trim() || null,
      }).select().single()
      const { data: fb } = await supabase.from('feedback').insert({
        bot_id: bot.id, conversation_id: conv.id,
        content: cleanDraft, is_anon: isAnon,
        user_name: isAnon ? null : name.trim() || null,
        session_id: sessionId,
      }).select().single()
      setDraftText('')
      setComposing(false)
      await loadThreads()
      await openThread(fb)
      triggerFeedbackSummary(bot)
    } catch(e) { console.error(e) }
    setSending(false)
  }

  return (
    <div style={{ display:'flex', height:'100vh', fontFamily:font, fontSize:sz, background:bg }}>

      {/* Left — thread list */}
      <div style={{ width:260, minWidth:260, borderRight:'1px solid rgba(0,0,0,0.08)', display:'flex', flexDirection:'column', background:'white' }}>
        {/* Header */}
        <div style={{ padding:'16px 16px 12px', borderBottom:'1px solid rgba(0,0,0,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <button onClick={onBack} style={{ background:'none', border:'none', cursor:'pointer', fontSize:12, color:'var(--ink4)', padding:0, marginBottom:4, display:'block' }}>← Back</button>
            <div style={{ fontFamily:titleFont, fontSize:sz*1.1, fontWeight:600, color:'var(--ink)' }}>Messages</div>
          </div>
          <button onClick={() => { setComposing(true); setSelected(null) }}
            style={{ width:32, height:32, borderRadius:'50%', background:primary, border:'none', color:'white', fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            +
          </button>
        </div>

        {/* Thread list */}
        <div style={{ flex:1, overflowY:'auto' }}>
          {loading ? (
            <div style={{ padding:20, textAlign:'center', color:'var(--ink4)', fontSize:12 }}>Loading…</div>
          ) : threads.length === 0 ? (
            <div style={{ padding:24, textAlign:'center' }}>
              <div style={{ fontSize:24, marginBottom:8 }}>💬</div>
              <div style={{ fontSize:13, color:'var(--ink3)', lineHeight:1.6 }}>No messages yet. Tap + to start a conversation.</div>
            </div>
          ) : (
            threads.map((fb, i) => (
              <div key={i} onClick={() => openThread(fb)}
                style={{ padding:'12px 16px', borderBottom:'1px solid rgba(0,0,0,0.05)', cursor:'pointer', background: selected?.id===fb.id?`${primary}12`:'white', transition:'background 0.1s' }}>
                <div style={{ fontSize:13, fontWeight:500, color:'var(--ink)', marginBottom:3, lineHeight:1.4 }}>
                  {fb.content.slice(0, 45)}{fb.content.length > 45 ? '…' : ''}
                </div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ fontSize:11, color:'var(--ink4)' }}>
                    {new Date(fb.created_at).toLocaleDateString('en-NZ', { day:'numeric', month:'short' })}
                  </div>
                  {!fb.resolved && <span style={{ width:7, height:7, borderRadius:'50%', background:primary, display:'inline-block' }} />}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right — conversation or compose */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', background:bg }}>
        {composing ? (
          // New message compose
          <div style={{ flex:1, display:'flex', flexDirection:'column', padding:24, maxWidth:560 }}>
            <div style={{ fontFamily:titleFont, fontSize:sz*1.1, fontWeight:600, color:'var(--ink)', marginBottom:6 }}>New message</div>
            <p style={{ fontSize:sz*0.85, color:'var(--ink3)', marginBottom:20 }}>Your message goes directly to the team.</p>

            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:'white', borderRadius:`${Math.min(radius,8)}px`, marginBottom:14, border:'1px solid rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize:13, color:'var(--ink)' }}>Send anonymously</div>
              <span onClick={() => setIsAnon(p=>!p)} style={{ position:'relative', display:'inline-block', width:36, height:20, background:isAnon?primary:'var(--parch-3)', borderRadius:20, cursor:'pointer', transition:'0.18s' }}>
                <span style={{ position:'absolute', width:14, height:14, left: isAnon?19:2, top:3, background:'white', borderRadius:'50%', transition:'0.18s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }} />
              </span>
            </div>

            {!isAnon && (
              <div style={{ marginBottom:14 }}>
                <label style={{ fontSize:12, fontWeight:500, color:'var(--ink2)', display:'block', marginBottom:5 }}>Your name</label>
                <input value={name} onChange={e=>setName(e.target.value)} placeholder="How should we address you?" style={{ width:'100%', padding:'9px 12px', borderRadius:`${Math.min(radius,8)}px`, border:'1px solid rgba(0,0,0,0.1)', fontSize:13.5, fontFamily:font, outline:'none', background:'white', boxSizing:'border-box' }} />
              </div>
            )}

            <textarea value={draftText} onChange={e=>setDraftText(e.target.value)}
              placeholder="What would you like to say to the team?"
              style={{ flex:1, padding:'12px', borderRadius:`${Math.min(radius,8)}px`, border:'1px solid rgba(0,0,0,0.1)', fontSize:13.5, fontFamily:font, outline:'none', resize:'none', lineHeight:1.65, background:'white', marginBottom:12, boxSizing:'border-box' }} />

            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => setComposing(false)} style={{ flex:1, padding:'11px', borderRadius:`${Math.min(radius,8)}px`, background:'white', border:'1px solid rgba(0,0,0,0.1)', fontSize:13, cursor:'pointer', fontFamily:font }}>Cancel</button>
              <button onClick={startNewThread} disabled={!draftText.trim()||sending}
                style={{ flex:2, padding:'11px', borderRadius:`${Math.min(radius,8)}px`, background:primary, color:'white', border:'none', fontSize:13, fontWeight:500, cursor:draftText.trim()&&!sending?'pointer':'not-allowed', opacity:draftText.trim()&&!sending?1:0.5, fontFamily:font }}>
                {sending ? 'Sending…' : 'Send message →'}
              </button>
            </div>
          </div>
        ) : selected ? (
          // Open thread
          <>
            <div style={{ padding:'14px 20px', borderBottom:'1px solid rgba(0,0,0,0.07)', background:'white', flexShrink:0 }}>
              <div style={{ fontSize:13.5, fontWeight:500, color:'var(--ink)' }}>
                {selected.content.slice(0, 60)}{selected.content.length > 60 ? '…' : ''}
              </div>
              <div style={{ fontSize:11.5, color:'var(--ink4)', marginTop:2 }}>
                {new Date(selected.created_at).toLocaleDateString('en-NZ', { day:'numeric', month:'short', year:'numeric' })}
              </div>
            </div>

            <div style={{ flex:1, overflowY:'auto', padding:'16px 20px', display:'flex', flexDirection:'column', gap:10 }}>
              {/* Original message */}
              <div style={{ display:'flex', gap:8, maxWidth:'80%', alignSelf:'flex-end', flexDirection:'row-reverse' }}>
                <div style={{ width:24, height:24, borderRadius:7, background:'var(--surface3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'var(--ink3)', flexShrink:0, marginTop:2 }}>U</div>
                <div style={{ padding:'9px 13px', borderRadius:`${radius}px 3px ${radius}px ${radius}px`, background:primary, color:'white', fontSize:sz*0.9, lineHeight:1.6 }}>
                  {selected.content}
                </div>
              </div>

              {/* Replies */}
              {replies.map((r, i) => (
                <div key={i} style={{ display:'flex', gap:8, maxWidth:'80%', alignSelf: r.role==='admin'?'flex-start':'flex-end', flexDirection: r.role==='admin'?'row':'row-reverse' }}>
                  <div style={{ width:24, height:24, borderRadius:7, background: r.role==='admin'?primary:'var(--surface3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color: r.role==='admin'?'white':'var(--ink3)', flexShrink:0, marginTop:2 }}>
                    {r.role === 'admin' ? '👋' : 'U'}
                  </div>
                  <div style={{ padding:'9px 13px', borderRadius: r.role==='admin'?`3px ${radius}px ${radius}px ${radius}px`:`${radius}px 3px ${radius}px ${radius}px`, background: r.role==='admin'?'white':primary, border: r.role==='admin'?'1px solid rgba(0,0,0,0.08)':'none', color: r.role==='admin'?'var(--ink)':'white', fontSize:sz*0.9, lineHeight:1.6 }}>
                    {r.content}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Reply input */}
            <div style={{ padding:'12px 16px', borderTop:'1px solid rgba(0,0,0,0.07)', display:'flex', gap:8, background:'white', flexShrink:0 }}>
              <input value={newMsg} onChange={e=>setNewMsg(e.target.value)}
                onKeyDown={e => e.key==='Enter' && !e.shiftKey && sendReply()}
                placeholder="Reply…"
                style={{ flex:1, padding:'9px 13px', borderRadius:`${Math.min(radius,10)}px`, border:'1px solid rgba(0,0,0,0.1)', fontSize:13.5, fontFamily:font, outline:'none', background:'var(--surface2)' }} />
              <button onClick={sendReply} disabled={!newMsg.trim()||sending}
                style={{ width:38, height:38, borderRadius:`${Math.min(radius,10)}px`, background:primary, border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:newMsg.trim()&&!sending?'pointer':'not-allowed', opacity:newMsg.trim()&&!sending?1:0.4, flexShrink:0 }}>
                <I.Send width={15} height={15} style={{ color:'white' }} />
              </button>
            </div>
          </>
        ) : (
          // Empty state
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12, color:'var(--ink4)' }}>
            <div style={{ fontSize:32 }}>💬</div>
            <div style={{ fontSize:13.5, fontFamily:titleFont }}>Select a conversation or start a new one</div>
          </div>
        )}
      </div>
    </div>
  )
}
function PasswordGate({ bot, onUnlock }) {
  const [pw,  setPw]  = useState('')
  const [err, setErr] = useState(false)
  const primary   = bot.primary_color || '#2C1810'
  const bg        = bot.bg_color      || '#F5F0E8'
  const bgImage   = bot.bg_image_url  || null
  const bgOv      = typeof bot.bg_overlay === 'number' ? bot.bg_overlay : 40
  const font      = bot.body_font     || 'Inter, system-ui, sans-serif'
  const titleFont = bot.title_font    || "'Playfair Display', serif"
  const radius    = typeof bot.border_radius === 'number' ? bot.border_radius : 12
  const letter    = (bot.avatar_letter || bot.name?.charAt(0) || 'B').toUpperCase()

  function attempt() {
    if (pw === bot.access_password) { onUnlock() }
    else { setErr(true); setPw(''); setTimeout(() => setErr(false), 2000) }
  }

  return (
    <div style={{
      display:'flex', flexDirection:'column', alignItems:'center',
      justifyContent:'center', minHeight:'100vh', padding:28,
      fontFamily:font, position:'relative',
      background: bgImage ? `url(${bgImage}) center/cover no-repeat` : bg,
    }}>
      {bgImage && <div style={{ position:'fixed', inset:0, background:`rgba(0,0,0,${bgOv/100})`, zIndex:0 }} />}
      <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:360 }}>
        <div style={{ background: bgImage?'rgba(255,255,255,0.97)':'white', borderRadius:`${radius}px`, padding:'32px 28px', boxShadow:'0 8px 32px rgba(0,0,0,0.12)' }}>

          {/* Bot identity */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10, marginBottom:24 }}>
            <div style={{ width:56, height:56, borderRadius:`${Math.min(radius,16)}px`, background:bot.avatar_url?'transparent':primary, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:700, color:'white', overflow:'hidden', boxShadow:`0 4px 16px ${primary}44` }}>
              {bot.avatar_url ? <img src={bot.avatar_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : letter}
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontFamily:titleFont, fontSize:17, fontWeight:600, color:'var(--ink)', marginBottom:3 }}>{bot.name}</div>
              <div style={{ fontSize:12, color:'var(--ink4)' }}>🔒 Team access only</div>
            </div>
          </div>

          {err && (
            <div style={{ background:'var(--danger-bg)', border:'1px solid rgba(155,34,38,0.15)', color:'var(--danger)', borderRadius:'var(--r)', padding:'8px 12px', fontSize:13, marginBottom:14, textAlign:'center' }}>
              Incorrect password
            </div>
          )}

          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:12, fontWeight:500, color:'var(--ink2)', display:'block', marginBottom:5 }}>Password</label>
            <input
              type="password" value={pw} onChange={e => setPw(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && attempt()}
              placeholder="Enter team password"
              style={{ width:'100%', padding:'10px 12px', borderRadius:`${Math.min(radius,8)}px`, border:`1px solid ${err?'var(--danger)':'var(--line)'}`, fontSize:14, fontFamily:font, outline:'none', boxSizing:'border-box', transition:'border-color 0.15s' }}
              autoFocus
            />
          </div>

          <button onClick={attempt} disabled={!pw.trim()}
            style={{ width:'100%', padding:'11px', borderRadius:`${Math.min(radius,10)}px`, background:primary, color:'white', border:'none', fontSize:14, fontWeight:500, cursor:pw.trim()?'pointer':'not-allowed', opacity:pw.trim()?1:0.5, fontFamily:font, transition:'opacity 0.15s' }}>
            Enter →
          </button>
        </div>
      </div>
    </div>
  )
}