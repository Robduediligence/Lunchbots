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
        <div className="serif" style={{ fontSize:17, fontWeight:600, marginBottom:8, color:'var(--coffee-0)' }}>Bot not found</div>
        <p style={{ fontSize:13.5, color:'var(--ink3)', lineHeight:1.65 }}>This link may be invalid or the bot may have been removed.</p>
      </div>
    </div>
  )

  return <ActiveChat bot={bot} />
}

function ActiveChat({ bot }) {
  const [msgs,      setMsgs]      = useState([])
  const [input,     setInput]     = useState('')
  const [thinking,  setThinking]  = useState(false)
  const [convId,    setConvId]    = useState(null)
  const [sessionId] = useState(() => Math.random().toString(36).slice(2,10))
  const msgsRef  = useRef([])
  const bottomRef= useRef(null)
  const inputRef = useRef(null)

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
    // Create conversation record
    createConversation(bot.id, sessionId).then(c => setConvId(c.id)).catch(console.error)
  }, [bot.id])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }) }, [msgs, thinking])

  async function send(text) {
    const t = (text || input).trim()
    if (!t || thinking) return
    setInput('')
    inputRef.current?.focus()

    const userMsg = { role:'user', content:t, id:Date.now().toString() }
    setMsgs(p => [...p, userMsg])
    msgsRef.current = [...msgsRef.current, { role:'user', content:t }]
    if (convId) await addMessage(convId, 'user', t).catch(console.error)
    setThinking(true)

    const history = msgsRef.current.slice(0,-1).map(m => ({ role: m.role==='bot'?'assistant':'user', content:m.content }))

    try {
      const reply = await callClaude({ system: buildBotSystem(bot), messages: history, userMessage: t, allowWeb: bot.allow_web })

      // Detect if it's a fallback
      const isFallback = reply.includes("don't have that information") || reply.includes("flagged your question")

      const botMsg = { role:'bot', content:reply, id:(Date.now()+1).toString() }
      setMsgs(p => [...p, botMsg])
      msgsRef.current = [...msgsRef.current, { role:'bot', content:reply }]
      if (convId) await addMessage(convId, 'bot', reply, !isFallback).catch(console.error)

      // If fallback, create knowledge gap
      if (isFallback && convId) {
        await createKnowledgeGap(bot.id, convId, t).catch(console.error)
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
      {bgImage && <div style={{ position:'fixed', inset:0, background:`rgba(0,0,0,${bgOv/100})`, zIndex:0 }} />}

      {/* Header */}
      <div style={{
        position:'relative', zIndex:1, padding:'12px 18px',
        borderBottom:'1px solid rgba(0,0,0,0.07)',
        display:'flex', alignItems:'center', gap:12,
        background: bgImage ? 'rgba(253,250,244,0.9)' : 'rgba(253,250,244,0.95)',
        backdropFilter:'blur(12px)', flexShrink:0,
      }}>
        {bot.logo_url && <img src={bot.logo_url} alt="logo" style={{ height:26, maxWidth:80, objectFit:'contain', borderRadius:4 }} />}
        <div style={{ width:38, height:38, borderRadius:`${Math.min(radius,12)}px`, flexShrink:0, background:bot.avatar_url?'transparent':primary, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:700, color:'white', overflow:'hidden', boxShadow:`0 2px 8px ${primary}33` }}>
          {bot.avatar_url ? <img src={bot.avatar_url} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : letter}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:font, fontSize:sz*0.95, fontWeight:600, color:'var(--ink)', lineHeight:1.2 }}>{bot.name}</div>
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
              {m.role==='bot' ? (bot.avatar_url ? <img src={bot.avatar_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : letter) : 'U'}
            </div>
            <div
              style={{
                padding:'10px 14px', fontFamily:font, fontSize:sz*0.92, lineHeight:1.65,
                borderRadius: m.role==='bot' ? `3px ${rr} ${rr} ${rr}` : `${rr} 3px ${rr} ${rr}`,
                ...(m.role==='user' ? userBubble : { background: bgImage?'rgba(255,255,255,0.93)':'white', border:'1px solid rgba(0,0,0,0.07)', color:'var(--ink)', boxShadow:'var(--shadow-xs)' }),
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
        <textarea ref={inputRef}
          style={{ flex:1, background: bgImage?'rgba(255,255,255,0.9)':'var(--surface2)', border:'1px solid rgba(0,0,0,0.08)', color:'var(--ink)', fontFamily:font, fontSize:sz*0.9, borderRadius:`${radius*0.75}px`, padding:'9px 13px', outline:'none', resize:'none', lineHeight:1.5, maxHeight:120 }}
          placeholder="Send a message…"
          value={input} rows={1}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
        />
        <button onClick={() => send()} disabled={!input.trim()||thinking}
          style={{ width:38, height:38, borderRadius:`${Math.min(radius,12)}px`, background:primary, border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:input.trim()&&!thinking?'pointer':'not-allowed', opacity:input.trim()&&!thinking?1:0.4, alignSelf:'flex-end', transition:'all 0.12s', boxShadow:`0 2px 8px ${primary}44` }}>
          {thinking ? <Spinner size={15} color="white" /> : <I.Send width={15} height={15} style={{ color:'white' }} />}
        </button>
      </div>

      {/* Footer */}
      <div style={{ position:'relative', zIndex:1, padding:'6px 16px', textAlign:'center', fontSize:11, color: bgImage?'rgba(255,255,255,0.4)':'var(--ink5)', background: bgImage?'rgba(0,0,0,0.1)':'transparent', flexShrink:0 }}>
        {bot.cta_text && bot.cta_url
          ? <a href={bot.cta_url} target="_blank" rel="noreferrer" style={{ color:primary, textDecoration:'none', fontWeight:500 }}>{bot.cta_text}</a>
          : 'Powered by Lunch Bots'}
      </div>
    </div>
  )
}
