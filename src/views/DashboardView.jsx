import { useState, useEffect } from 'react'
import { getBotStats, getKnowledgeGaps, getConversations, getBotsByOwner, getFeedback, signOut, getActivityLog, getPlanLimits, renderMarkdown } from '../lib/supabase.js'
import { I, Spinner } from '../components/UI.jsx'

const NAV = [
  { id: 'dashboard', label: 'Dashboard', Icon: I.Home },
  { id: 'inbox',     label: 'Inbox',     Icon: I.Inbox },
  { id: 'feedback',  label: 'Feedback',  Icon: I.Users },
  { id: 'insights',  label: 'Insights',  Icon: I.Chart },
  { id: 'share',     label: 'Share',     Icon: I.Eye },
]

export default function DashboardView({ user, sub, bot, onEditBot, onLogout, initialBots, showPlanOnLoad }) {
  const saved = (() => { try { return JSON.parse(localStorage.getItem('lb_dash') || '{}') } catch { return {} } })()
  const cachedBots = (() => { try { return JSON.parse(localStorage.getItem('lb_bots') || '[]') } catch { return [] } })()
  const [page, setPage] = useState(saved.page || 'dashboard')
  const [showWelcomePlan, setShowWelcomePlan] = useState(showPlanOnLoad || false)
  const [stats,     setStats]     = useState(null)
  const [gaps,      setGaps]      = useState([])
  const [convs,     setConvs]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [loadError, setLoadError] = useState(null)
  const startingBots = initialBots?.length ? initialBots : cachedBots
  const [allBots,   setAllBots]   = useState(startingBots)
  const savedBot = startingBots.find(b => b.id === saved.botId) || startingBots[0] || null
  const [activeBot, setActiveBot] = useState(savedBot)
  const [feedback,  setFeedback]  = useState([])
  const [activity,  setActivity]  = useState([])
  const [resolvedCount, setResolvedCount] = useState(0)


  useEffect(() => {
    localStorage.setItem('lb_dash', JSON.stringify({ page, botId: activeBot?.id }))
  }, [page, activeBot?.id])

  useEffect(() => {
    if (!sub?.id) return
    getBotsByOwner(sub.id).then(bots => {
      setAllBots(bots)
      try { localStorage.setItem('lb_bots', JSON.stringify(bots)) } catch(e) { console.warn('localStorage full') }
      if (!activeBot) {
        const current = bots.find(b => b.id === saved.botId) || bots[0] || null
        setActiveBot(current)
      }
    }).catch(console.error)
  }, [sub?.id])

  useEffect(() => {
    if (!activeBot) { setLoading(false); return }
    setLoading(true)
    Promise.all([
      getBotStats(activeBot.id),
      getKnowledgeGaps(activeBot.id),
      getConversations(activeBot.id),
      getFeedback(activeBot.id),
      getActivityLog(activeBot.id),
    ]).then(([s, g, c, fb, al]) => {
      setStats(s); setGaps(g); setConvs(c); setFeedback(fb); setActivity(al)
    }).catch(e => {
      console.error(e)
      setLoadError('Could not load dashboard data. Please refresh the page.')
    }).finally(() => setLoading(false))
  }, [activeBot?.id])

useEffect(() => {
    if (!activeBot?.id) return
    const interval = setInterval(async () => {
      const [freshGaps, freshStats] = await Promise.all([
        getKnowledgeGaps(activeBot.id),
        getBotStats(activeBot.id),
      ])
      setGaps(freshGaps)
      setStats(freshStats)
    }, 5000)
    return () => clearInterval(interval)
  }, [activeBot?.id])

  const shareUrl = activeBot ? `${window.location.origin}/dashboard?bot=${activeBot.id}&widget=true` : ''

  return (
    <div className="app">
      {showWelcomePlan && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'white', borderRadius:12, padding:32, width:480, maxWidth:'90vw', boxShadow:'0 24px 48px rgba(0,0,0,0.2)' }}>
            <h2 className="serif mb-4" style={{ fontSize:'1.4rem', color:'var(--coffee-0)' }}>Choose your plan</h2>
            <p style={{ fontSize:13.5, color:'var(--ink3)', marginBottom:24, lineHeight:1.7 }}>
              You're on a 14-day free trial. Pick a plan now — you won't be charged until your trial ends.
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:24 }}>
              {[
                { id:'solo',     label:'Solo',     price:'$9/mo',  desc:'1 bot · 500 messages/month' },
                { id:'squadron', label:'Squadron', price:'$19/mo', desc:'3 bots · 2,000 messages/month' },
                { id:'fleet',    label:'Fleet',    price:'$39/mo', desc:'10 bots · 6,000 messages/month' },
              ].map(p => (
                <button key={p.id} onClick={() => {
                  setShowWelcomePlan(false)
                  import('../lib/supabase.js').then(({ startCheckout }) => startCheckout(p.id, user.id, user.email))
                }} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 18px', border:'1.5px solid var(--line)', borderRadius:'var(--r-md)', background:'var(--surface)', cursor:'pointer', transition:'all 0.12s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor='var(--coffee-0)'}
                onMouseLeave={e => e.currentTarget.style.borderColor='var(--line)'}>
                  <div style={{ textAlign:'left' }}>
                    <div style={{ fontSize:14, fontWeight:600, color:'var(--ink)', marginBottom:2 }}>{p.label}</div>
                    <div style={{ fontSize:12, color:'var(--ink3)' }}>{p.desc}</div>
                  </div>
                  <div style={{ fontSize:15, fontWeight:700, color:'var(--coffee-0)' }}>{p.price}</div>
                </button>
              ))}
            </div>
            <p style={{ fontSize:11.5, color:'var(--ink4)', textAlign:'center', marginTop:8 }}>
              You won't be charged until your 14-day trial ends. Cancel anytime.
            </p>
          </div>
        </div>
      )}
      {/* Top nav pill */}
      <div>
      <nav className="topnav">
        <div className="topnav-bottom-row">
          <div className="topnav-logo">
            <img src="/bot_brunch_logo_transparent.png" alt="Bot Brunch" />
          </div>
          <div className="topnav-pill" id="main-nav-pill">
            {NAV.map(({ id, label, Icon }) => {
              let count = null
              if (id === 'inbox') count = Math.max(0, (stats?.unresolvedGaps ?? 0) - resolvedCount)
              if (id === 'feedback') count = feedback.filter(f => !f.resolved).length
              return (
                <button key={id} className={`pill-item ${page === id ? 'active' : ''}`}
                  onClick={() => setPage(id)}>
                  {label}{count > 0 ? ` (${count})` : ''}
                </button>
              )
            })}
            <button className="pill-item" onClick={() => onEditBot(activeBot)}>
              {activeBot ? 'Edit Bot' : 'Create Bot'}
            </button>
            <button className="pill-item" onClick={() => setPage('settings')}>
              Settings
            </button>
          </div>
          <div className="topnav-right">
            
            <button className="btn btn-ghost btn-sm" onClick={onLogout}>Sign out</button>
          </div>
        </div>
      </nav>
      

      {/* Pages */}
      {/* Bot switcher */}
      {allBots.length > 0 && (
        <div className="bot-switcher" style={{ padding:'8px 16px', marginTop:'16px', borderBottom:'1px solid var(--line)', background:'var(--surface2)', display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--ink4)', marginRight:4 }}>Active bot:</span>
          {allBots.map(b => (
            <button key={b.id} onClick={() => { setActiveBot(b) }}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 12px', borderRadius:20, border:`1.5px solid ${activeBot?.id===b.id?'var(--coffee-0)':'var(--line)'}`, background: activeBot?.id===b.id?'var(--coffee-0)':'var(--surface)', color: activeBot?.id===b.id?'var(--parch-1)':'var(--ink3)', fontSize:12.5, fontWeight:500, cursor:'pointer', transition:'all 0.12s', opacity: b.disabled ? 0.5 : 1 }}>
              {b.disabled ? '🔐' : b.bot_type === 'internal' ? '🔒' : '🌐'} {b.name || 'Unnamed bot'}
              {b.disabled && <span style={{ fontSize:10, color:'var(--danger)', fontWeight:600 }}>LOCKED</span>}
            </button>
          ))}
          <button onClick={() => {
  const limits = getPlanLimits(sub)
  if (allBots.length >= limits.bots) {
    alert(`Your ${sub?.plan || 'trial'} plan allows ${limits.bots} bot${limits.bots === 1 ? '' : 's'}. Upgrade to add more.`)
    return
  }
  onEditBot(null)
}}
            style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:20, border:'1.5px dashed var(--line)', background:'transparent', color:'var(--ink4)', fontSize:12, cursor:'pointer', marginLeft:4 }}>
            + New bot
          </button>
        </div>
      )}
      </div>

      {loadError ? (
        <div className="flex ic jc" style={{ height:'calc(100vh - 54px)', flexDirection:'column', gap:12 }}>
          <div style={{ fontSize:24 }}>⚠️</div>
          <div style={{ fontSize:14, color:'var(--ink2)', fontWeight:500 }}>{loadError}</div>
          <button className="btn btn-secondary" onClick={() => window.location.reload()}>Refresh page</button>
        </div>
      ) : loading ? (
        <div className="flex ic jc" style={{ height: 'calc(100vh - 54px)', gap: 8 }}>
          <Spinner size={20} color="var(--coffee-3)" />
          <span style={{ color: 'var(--ink3)', fontSize: 13 }}>Loading…</span>
        </div>
      ) : (
        <>
          {page === 'dashboard' && (activeBot?.disabled ? (
  <div className="flex ic jc" style={{ height:'calc(100vh - 54px)', flexDirection:'column', gap:16 }}>
    <div style={{ fontSize:32 }}>🔐</div>
    <h2 className="serif" style={{ fontSize:'1.4rem', color:'var(--coffee-0)' }}>This bot is locked</h2>
    <p style={{ fontSize:13.5, color:'var(--ink3)', textAlign:'center', maxWidth:340, lineHeight:1.7 }}>
      This bot was disabled when you changed to a lower plan. Upgrade your plan to unlock it and all its data.
    </p>
    <button className="btn btn-accent btn-lg" onClick={() => setPage('settings')}>
      Upgrade plan →
    </button>
  </div>
) : <DashPage bot={activeBot} sub={sub} allBots={allBots} stats={stats} convs={convs} gaps={gaps} setGaps={setGaps} activity={activity} setActivity={setActivity} shareUrl={shareUrl} onEdit={() => onEditBot(activeBot)} onNewBot={() => onEditBot(null)} />)}
          {page === 'inbox'     && <InboxPage bot={activeBot} gaps={gaps} setGaps={setGaps} />}
          {page === 'feedback'  && <FeedbackAdminPage bot={activeBot} feedback={feedback} setFeedback={setFeedback} />}
          {page === 'insights'  && <InsightsPage bot={activeBot} convs={convs} />}
         {page === 'share'     && <SharePage bot={activeBot} shareUrl={shareUrl} />}
          {page === 'settings'  && <SettingsPage user={user} sub={sub} onLogout={onLogout} activeBot={activeBot} onBotDeleted={() => { setAllBots(p => p.filter(b => b.id !== activeBot?.id)); setActiveBot(null); setPage('dashboard') }} />}
        </>
      )}
    {/* Mobile bottom nav */}
      <nav className="mobile-bottom-nav">
        {[
          { id: 'dashboard', label: 'Home', icon: '⌂' },
          { id: 'inbox', label: 'Inbox', icon: '✉' },
          { id: 'feedback', label: 'Feed', icon: '✦' },
          { id: 'insights', label: 'Insights', icon: '◈' },
          { id: 'share', label: 'Share', icon: '⊕' },
          { id: 'settings', label: 'Settings', icon: '⚙' },
        ].map(({ id, label, icon }) => {
          let badge = null
          if (id === 'inbox') badge = Math.max(0, (stats?.unresolvedGaps ?? 0) - resolvedCount)
          if (id === 'feedback') badge = feedback.filter(f => !f.resolved).length
          return (
            <button key={id} className={`mobile-nav-item ${page === id ? 'active' : ''}`}
              onClick={() => setPage(id)}>
              {badge > 0 && <span className="mobile-nav-badge">{badge}</span>}
              <span className="nav-icon">{icon}</span>
              <span>{label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}



// ── Dashboard page ────────────────────────────────────────────────────────────
function DashPage({ bot, sub, allBots, stats, convs, gaps, shareUrl, onEdit, onNewBot, setGaps, activity, setActivity }) {
  const [copied, setCopied] = useState(false)

  if (!bot) {
    return (
      <div className="flex ic jc" style={{ height: 'calc(100vh - 54px)', flexDirection: 'column', gap: 16 }}>
        <h2 className="serif" style={{ fontSize: '1.5rem', color: 'var(--coffee-0)' }}>Build your first bot</h2>
        <p style={{ fontSize: 13.5, color: 'var(--ink3)', textAlign: 'center', maxWidth: 340, lineHeight: 1.7 }}>
          Turn your knowledge into a branded AI assistant in about 5 minutes.
        </p>
        <button className="btn btn-accent btn-lg" onClick={onNewBot}>
          <I.Rocket /> Launch setup →
        </button>
      </div>
    )
  }

  const inboxCount = (stats?.unresolvedGaps ?? 0) + (stats?.unresolvedFeedback ?? 0)
  const answeredToday = stats?.conversationsThisWeek ?? 0
  const statusDot = inboxCount === 0 ? '#7F9C8B' : inboxCount <= 2 ? '#C89B5A' : '#C0522A'
  const sentiment = bot?.feedback_summary?.sentiment
  const feedbackDot = sentiment === 'positive' ? '#7F9C8B' : sentiment === 'negative' ? '#C0522A' : sentiment === 'mixed' ? '#C89B5A' : null

  return (
    <div className="page fade-up" style={{ display:'flex', flexDirection:'column', gap:14 }}>

      {/* ── Stat cards ── */}
      <div className="stat-grid">
        {[
          { label: 'Total conversations', num: stats?.totalConversations ?? 0, dot: null },
          { label: 'Unique users',        num: stats?.uniqueUsers ?? 0,        dot: null },
          { label: 'Messages sent',       num: stats?.totalMessages ?? 0,      dot: null },
          { label: 'This week',           num: stats?.conversationsThisWeek ?? 0, dot: null },
          { label: 'Feedback received',   num: stats?.feedbackCount ?? 0,      dot: feedbackDot },
          { label: 'Inbox items',         num: inboxCount,                     dot: inboxCount === 0 ? '#7F9C8B' : inboxCount <= 2 ? '#C89B5A' : '#C0522A' },
        ].map((s, i) => (
          <div key={i} className={`stat-card fade-up d${i+1}`}>
            <div className="stat-label" style={{ display:'flex', alignItems:'center', gap:6 }}>
              {s.dot && <span style={{ width:7, height:7, borderRadius:'50%', background:s.dot, flexShrink:0, display:'inline-block' }} />}
              {s.label}
            </div>
            <div className="stat-num">{s.num}</div>
          </div>
        ))}
      </div>

      {/* ── Top: Bot Status + Quick Actions ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:16, alignItems:'start', marginBottom:20 }}>

        {/* Bot Status */}
        <div className="card" style={{ padding:'20px 20px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
            <span style={{ width:10, height:10, borderRadius:'50%', background:statusDot, flexShrink:0, display:'inline-block' }} />
            <h1 style={{ fontSize:18, fontWeight:600, color:'var(--ink)', fontFamily:'var(--font-display)' }}>{bot.name}</h1>
            <span className="badge badge-green" style={{ marginLeft:4 }}>Live</span>
            <button className="btn btn-secondary btn-sm" style={{ marginLeft:'auto' }} onClick={onEdit}>Edit bot</button>
          </div>
          <p style={{ fontSize:14, color:'var(--ink3)', lineHeight:1.6 }}>
            Your bot answered <strong style={{ color:'var(--ink)' }}>{answeredToday} questions</strong> this week
            {inboxCount > 0 && <> · <strong style={{ color:'#C0522A' }}>{inboxCount} question{inboxCount > 1 ? 's' : ''} need{inboxCount === 1 ? 's' : ''} your help</strong></>}
            {inboxCount === 0 && <> · <span style={{ color:'#7F9C8B' }}>all caught up</span></>}
          </p>
          {/* Share link inline */}
          <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:14, padding:'8px 12px', background:'var(--surface2)', border:'1px solid var(--line)', borderRadius:'var(--r)' }}>
            <span style={{ flex:1, fontSize:12, color:'var(--ink3)', fontFamily:'monospace', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{shareUrl}</span>
            <button className="btn btn-secondary btn-sm" onClick={() => window.open(shareUrl, '_blank')}>Preview</button>
            <button className="btn btn-primary btn-sm" onClick={() => { navigator.clipboard.writeText(shareUrl).catch(()=>{}); setCopied(true); setTimeout(()=>setCopied(false), 2000) }}>
              {copied ? 'Copied!' : 'Copy link'}
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card" style={{ padding:'7px 20px', minWidth:200, alignSelf:'start' }}>
          <div style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--ink4)', marginBottom:12 }}>Quick actions</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {[
              { label:'Edit knowledge base', action: onEdit },
              { label:'Test my bot', action: () => window.open(shareUrl, '_blank') },
              { label:'Copy bot link', action: () => { navigator.clipboard.writeText(shareUrl).catch(()=>{}); setCopied(true); setTimeout(()=>setCopied(false), 2000) } },
            ].map((a, i) => (
              <button key={i} className="btn btn-secondary btn-sm" style={{ justifyContent:'flex-start', width:'100%' }} onClick={a.action}>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Middle: Questions needing attention ── */}
      <div className="card">
        <div className="card-head">
          <div>
            <div className="card-title">Questions that need your attention</div>
            <div className="card-sub">Answer to help your customers and improve your bot</div>
          </div>
          {inboxCount > 0 && <span className="badge badge-amber">{inboxCount} unresolved</span>}
        </div>
        {gaps.length === 0 ? (
          <div className="empty" style={{ padding:'32px 20px' }}>
            <div className="empty-icon">✅</div>
            <div className="empty-title">All caught up</div>
            <div className="empty-sub">No questions need your attention right now.</div>
          </div>
        ) : (
          <div>
            {gaps.slice(0, 5).map((g, i) => (
              <AttentionRow key={i} gap={g} bot={bot} isLast={i >= Math.min(gaps.length-1, 4)}
               onAnswered={(answeredGap, mode, answerText) => {
  setGaps(p => p.filter(x => x.id !== answeredGap.id))
  setResolvedCount(p => p + 1)
  setActivity(p => [{
    id: Date.now(),
    type: mode === 'answer' ? 'answered_question' : 'replied_question',
    description: mode === 'answer' 
      ? `Answered: "${answeredGap.question.slice(0, 60)}"` 
      : `Replied to: "${answeredGap.question.slice(0, 60)}"`,
    created_at: new Date().toISOString(),
  }, ...p])
}} />
            ))}
          </div>
        )}
      </div>

      {/* ── Bottom: Recent Activity ── */}
      <div className="card">
        <div className="card-head"><div className="card-title">Recent activity</div></div>
        {activity.length === 0 ? (
          <div className="empty" style={{ padding:'24px 20px' }}>
            <div className="empty-icon">💬</div>
            <div className="empty-title">No activity yet</div>
            <div className="empty-sub">Activity will appear here as you and your bot interact.</div>
          </div>
        ) : (
          <div style={{ padding:'8px 0' }}>
            {activity.map((a, i) => {
              const isLast = i >= activity.length - 1
              const dots = {
                answered_question: '#7F9C8B',
                replied_question:  '#749CA5',
                kb_updated:        '#C89B5A',
                bot_created:       '#9AB86C',
                bot_updated:       '#A28791',
                new_conversation:  '#749CA5',
                new_feedback:      '#D98757',
                knowledge_gap:     '#C98278',
                bot_previewed:     '#8A8480',
                kb_milestone:      '#C89B5A',
                first_conversation:'#7F9C8B',
              }
              const dot = dots[a.type] || '#8A8480'
              return (
                <div key={i} style={{ padding:'10px 20px', display:'flex', alignItems:'center', gap:10, borderBottom: isLast ? 'none' : '1px solid var(--line)' }}>
                  <span style={{ width:7, height:7, borderRadius:'50%', background:dot, flexShrink:0 }} />
                  <span style={{ fontSize:13.5, color:'var(--ink)', flex:1 }}>{a.description}</span>
                  <span style={{ fontSize:12, color:'var(--ink4)' }}>{new Date(a.created_at).toLocaleDateString('en-NZ', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}

// ── Attention row (answer or reply only) ──────────────────────────────────────
function AttentionRow({ gap, bot, isLast, onAnswered }) {
  const [mode,    setMode]    = useState(null) // null | 'answer' | 'reply'
  const [text,    setText]    = useState('')
  const [saving,  setSaving]  = useState(false)

  async function handleAnswer() {
    if (!text.trim()) return
    setSaving(true)
    try {
      const { supabase } = await import('../lib/supabase.js')
      const isKb = mode === 'answer'
      await supabase.from('knowledge_gaps').update({
        admin_answer: text.trim(),
        resolved: true,
        added_to_kb: isKb,
        resolved_at: new Date().toISOString(),
      }).eq('id', gap.id)

      const { logActivity } = await import('../lib/supabase.js')
      await logActivity(bot.id, bot.owner_id,
        isKb ? 'answered_question' : 'replied_question',
        isKb ? `Answered: "${gap.question.slice(0, 60)}"` : `Replied to: "${gap.question.slice(0, 60)}"`,
        { question: gap.question, mode }
      )
      if (isKb) {
        const currentEntries = Array.isArray(bot.knowledge_entries) ? bot.knowledge_entries : []
        const newEntry = {
          id: Date.now().toString(),
          title: gap.question.slice(0, 60) + (gap.question.length > 60 ? '…' : ''),
          type: 'faq', priority: 'primary',
          content: `Q: ${gap.question}\n\nA: ${text.trim()}`,
          enabled: true, source: 'inbox',
          created_at: new Date().toISOString(),
        }
        const updatedEntries = [...currentEntries, newEntry]
        const newKbText = (bot.knowledge_text || '') + `\n\nQ: ${gap.question}\nA: ${text.trim()}`
        await supabase.from('bots').update({
          knowledge_entries: updatedEntries,
          knowledge_text: newKbText,
          updated_at: new Date().toISOString(),
        }).eq('id', bot.id)
        bot.knowledge_entries = updatedEntries
        bot.knowledge_text = newKbText
      }
      onAnswered(gap, mode, text)
    } catch(e) { console.error(e) }
    setSaving(false)
  }

  return (
    <div style={{ borderBottom: isLast ? 'none' : '1px solid var(--line)' }}>
      <div style={{ padding:'12px 20px', display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
        <div style={{ minWidth:0 }}>
          <div style={{ fontSize:13.5, color:'var(--ink)', lineHeight:1.55, marginBottom:3 }}>
            "{gap.question.slice(0, 80)}{gap.question.length > 80 ? '…' : ''}"
          </div>
          <div style={{ fontSize:11.5, color:'var(--ink4)' }}>
            {new Date(gap.created_at).toLocaleDateString('en-NZ', { day:'numeric', month:'short' })}
          </div>
        </div>
        <div style={{ display:'flex', gap:6, flexShrink:0 }}>
          {mode ? (
            <button className="btn btn-ghost btn-xs" onClick={() => { setMode(null); setText('') }}>Cancel</button>
          ) : (
            <>
              <button className="btn btn-primary btn-xs" onClick={() => setMode('answer')}>Answer</button>
              <button className="btn btn-secondary btn-xs" onClick={() => setMode('reply')}>Reply only</button>
            </>
          )}
        </div>
      </div>
      {mode && (
        <div style={{ padding:'0 20px 14px' }}>
          <div style={{ fontSize:11.5, color:'var(--ink4)', marginBottom:6 }}>
            {mode === 'answer' ? '✓ This reply will be saved to your knowledge base' : '→ This reply will be sent once and not saved'}
          </div>
          <textarea className="input" style={{ minHeight:80, marginBottom:8 }}
            placeholder={mode === 'answer' ? 'Type your answer…' : 'Type a one-off reply…'}
            value={text} onChange={e => setText(e.target.value)} autoFocus />
          <button className="btn btn-primary btn-sm w100" onClick={handleAnswer} disabled={!text.trim() || saving}>
            {saving ? <Spinner size={13} color="white" /> : mode === 'answer' ? 'Save & add to knowledge base' : 'Send reply only'}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Inbox page ────────────────────────────────────────────────────────────────
function InboxPage({ bot, gaps, setGaps }) {
  const [selected, setSelected] = useState(null)
  const [answer,   setAnswer]   = useState('')
  const [saving,   setSaving]   = useState(false)

  useEffect(() => {
    if (!bot?.id) return
    const interval = setInterval(async () => {
      const { getKnowledgeGaps } = await import('../lib/supabase.js')
      const fresh = await getKnowledgeGaps(bot.id)
      setGaps(fresh)
    }, 5000)
    return () => clearInterval(interval)
  }, [bot?.id])

  if (!bot) return <EmptyBot label="Inbox" />

  async function handleAnswer(gap) {
    if (!answer.trim()) return
    setSaving(true)
    try {
      const { supabase } = await import('../lib/supabase.js')

      // 1. Mark gap as resolved with admin answer
      await supabase.from('knowledge_gaps').update({
        admin_answer: answer.trim(),
        resolved: true,
        added_to_kb: true,
        resolved_at: new Date().toISOString(),
      }).eq('id', gap.id)

      // 2. Add as a proper FAQ entry in knowledge_entries
      const currentEntries = Array.isArray(bot.knowledge_entries) ? bot.knowledge_entries : []
      const newEntry = {
        id: Date.now().toString(),
        title: gap.question.slice(0, 60) + (gap.question.length > 60 ? '…' : ''),
        type: 'faq',
        priority: 'primary',
        content: `Q: ${gap.question}\n\nA: ${answer.trim()}`,
        enabled: true,
        source: 'inbox',
        created_at: new Date().toISOString(),
      }
      const updatedEntries = [...currentEntries, newEntry]

      // 3. Also append to flat knowledge_text for AI context
      const newKbText = (bot.knowledge_text || '') + `\n\nQ: ${gap.question}\nA: ${answer.trim()}`

      await supabase.from('bots').update({
        knowledge_entries: updatedEntries,
        knowledge_text: newKbText,
        updated_at: new Date().toISOString(),
      }).eq('id', bot.id)

      // 4. Update local bot state so dashboard reflects change immediately
      bot.knowledge_entries = updatedEntries
      bot.knowledge_text = newKbText

      setGaps(p => p.filter(g => g.id !== gap.id))
      setSelected(null)
      setAnswer('')

      // Notify user by email if they left one
      if (gap.user_email) {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: gap.user_email,
            question: gap.question,
            answer: answer.trim(),
            botName: bot.name,
          }),
        }).catch(console.error)
      }
      const toast = document.createElement('div')
toast.textContent = '✓ Answer saved to knowledge base'
toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#2C1810;color:#FDF9F4;padding:12px 24px;border-radius:8px;font-size:13.5px;font-weight:500;z-index:9999;box-shadow:0 4px 16px rgba(0,0,0,0.18);transition:opacity 0.4s;'
document.body.appendChild(toast)
setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 400) }, 2500)
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  return (
    <div className="page-wide fade-up">
      <div className="mb-24">
        <h1 className="page-title">Inbox</h1>
        <p className="page-sub">Questions your bot couldn't answer. Reply to answer them — your response gets added to your knowledge base automatically.</p>
      </div>

      {gaps.length === 0 ? (
        <div className="card">
          <div className="empty">
            <div className="empty-icon">✉️</div>
            <div className="empty-title">Inbox is clear</div>
            <div className="empty-sub">When your bot can't answer a question, it appears here. Your replies are automatically added to your knowledge base.</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 400px' : '1fr', gap: 14, alignItems: 'start' }}>
          <div className="card">
            <table className="tbl">
              <thead><tr><th>Question</th><th>Date</th><th></th></tr></thead>
              <tbody>
                {gaps.map((g, i) => (
                  <tr key={i} style={{ cursor: 'pointer' }} onClick={() => { setSelected(g); setAnswer('') }}>
                    <td style={{ maxWidth: 400 }}>
                      <div style={{ fontSize: 13.5, color: 'var(--ink)', lineHeight: 1.5 }}>"{g.question.slice(0, 80)}{g.question.length > 80 ? '…' : ''}"</div>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--ink4)', whiteSpace: 'nowrap' }}>{new Date(g.created_at).toLocaleDateString('en-NZ', { day:'numeric', month:'short' })}</td>
                    <td><button className="btn btn-secondary btn-xs">Answer →</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selected && (
            <div className="card fade-in" style={{ position: 'sticky', top: 66 }}>
              <div className="card-head">
                <div className="card-title">Answer this question</div>
                <button className="btn btn-ghost btn-xs" onClick={() => setSelected(null)}><I.X /></button>
              </div>
              <div className="card-body">
                <div style={{ marginBottom:14 }}>
                  <div style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--ink4)', marginBottom:6 }}>Question</div>
                  <div style={{ padding:'10px 14px', background:'var(--surface2)', border:'1px solid var(--line)', borderRadius:'var(--r)', fontSize:13.5, color:'var(--ink)', lineHeight:1.6, fontStyle:'italic' }}>
                    "{selected.question}"
                  </div>
                </div>
                {selected.conversation_id && <ConversationContext convId={selected.conversation_id} />}
                <div className="field">
                  <label className="label">Your answer</label>
                  <textarea className="input" style={{ minHeight: 120 }} placeholder="Type your answer here. It will be saved to your knowledge base and the user will be notified." value={answer} onChange={e => setAnswer(e.target.value)} />
                </div>
                <div className="alert alert-info" style={{ fontSize: 12, marginBottom: 14 }}>
                  Your answer will be automatically added to your knowledge base as an FAQ.
                </div>
                <button className="btn btn-primary w100" onClick={() => handleAnswer(selected)} disabled={!answer.trim() || saving}>
                  {saving ? <Spinner size={15} color="white" /> : 'Save answer & add to knowledge base'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Feedback admin page ───────────────────────────────────────────────────────
function FeedbackAdminPage({ bot, feedback, setFeedback }) {
  if (!bot) return <EmptyBot label="Feedback" />

  const [selected,  setSelected]  = useState(null)
  const [replies,   setReplies]   = useState([])
  const [reply,     setReply]     = useState('')
  const [sending,   setSending]   = useState(false)
  const [summary,     setSummary]     = useState(null)

  useEffect(() => {
    if (bot?.id) {
      import('../lib/supabase.js').then(({ supabase }) => {
        supabase.from('bots').select('feedback_summary').eq('id', bot.id).single()
          .then(({ data }) => { if (data?.feedback_summary) setSummary(data.feedback_summary) })
      })
    }
  }, [bot?.id])
  const [summarising, setSummarising] = useState(false)

  async function loadReplies(fb) {
    setSelected(fb)
    setReply('')
    const { getFeedbackReplies } = await import('../lib/supabase.js')
    const data = await getFeedbackReplies(fb.id)
    setReplies(data)
  }

  async function sendReply() {
    if (!reply.trim() || !selected) return
    setSending(true)
    try {
      const { addFeedbackReply, supabase } = await import('../lib/supabase.js')
      await addFeedbackReply(selected.id, 'admin', reply.trim())
      await supabase.from('feedback').update({ resolved: true }).eq('id', selected.id)
      const data = await (await import('../lib/supabase.js')).getFeedbackReplies(selected.id)
      setReplies(data)
      setFeedback(p => p.map(f => f.id === selected.id ? { ...f, resolved: true } : f))
      setReply('')
    } catch(e) { console.error(e) }
    setSending(false)
  }

  async function generateSummary() {
    if (feedback.length === 0) return
    setSummarising(true)
    try {
      const { callClaude } = await import('../lib/supabase.js')
      const text = feedback.map(f => `- ${f.content}`).join('\n')
      const result = await callClaude({
        system: `You are analysing customer feedback for a business. Return a JSON object with:
{
  "overview": "2-3 sentence summary of overall feedback themes",
  "topThemes": ["theme1", "theme2", "theme3"],
  "sentiment": "positive|neutral|mixed|negative",
  "urgent": ["urgent issue 1", "urgent issue 2"],
  "suggestions": ["improvement 1", "improvement 2", "improvement 3"]
}
Return ONLY valid JSON, no markdown.`,
        messages: [],
        userMessage: `Analyse this customer feedback:\n\n${text}`,
      })
      const cleaned = result.replace(/```json|```/g, '').trim()
      setSummary(JSON.parse(cleaned))
    } catch(e) { console.error(e) }
    setSummarising(false)
  }

  return (
    <div className="page-wide fade-up">
      <div className="flex ic jb mb-24">
        <div>
          <h1 className="page-title">Feedback</h1>
          <p className="page-sub">{feedback.length} total · {feedback.filter(f => !f.resolved).length} unresolved</p>
        </div>
        <button className="btn btn-secondary" onClick={generateSummary} disabled={summarising || feedback.length === 0}>
          {summarising ? <><Spinner size={13} color="var(--ink3)" /> Analysing…</> : '✦ AI Summary'}
        </button>
      </div>

    {feedback.length === 0 ? (
        <div className="card">
          <div className="empty">
            <div className="empty-icon">📝</div>
            <div className="empty-title">No feedback yet</div>
            <div className="empty-sub">When users submit feedback through your bot link, it appears here.</div>
          </div>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns: summary ? '1fr 1fr' : '1fr', gap:14, alignItems:'start' }}>
          <div style={{ display:'grid', gridTemplateColumns: selected ? '1fr 420px' : '1fr', gap:14, alignItems:'start' }}>
          {/* Feedback list */}
          <div className="card">
            <table className="tbl">
              <thead><tr><th>Feedback</th><th>From</th><th>Date</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {feedback.map((fb, i) => (
                  <tr key={i} style={{ cursor:'pointer', background: selected?.id===fb.id?'var(--surface2)':'' }}
                    onClick={() => loadReplies(fb)}>
                    <td style={{ maxWidth:300 }}>
                      <div style={{ fontSize:13.5, color:'var(--ink)', lineHeight:1.5 }}>
                        {fb.content.slice(0, 80)}{fb.content.length > 80 ? '…' : ''}
                      </div>
                    </td>
                    <td style={{ fontSize:12.5, color:'var(--ink3)' }}>
                      {fb.is_anon ? <span style={{ color:'var(--ink4)', fontStyle:'italic' }}>Anonymous</span> : fb.user_name || 'Named'}
                    </td>
                    <td style={{ fontSize:12, color:'var(--ink4)', whiteSpace:'nowrap' }}>
                      {new Date(fb.created_at).toLocaleDateString('en-NZ', { day:'numeric', month:'short' })}
                    </td>
                    <td>
                      <span className={`badge ${fb.resolved ? 'badge-green' : 'badge-amber'}`}>
                        {fb.resolved ? 'Replied' : 'New'}
                      </span>
                    </td>
                    <td><button className="btn btn-secondary btn-xs">View →</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Reply panel */}
          {selected && (
            <div className="card fade-in" style={{ position:'sticky', top:66 }}>
              <div className="card-head">
                <div className="card-title">Reply</div>
                <button className="btn btn-ghost btn-xs" onClick={() => setSelected(null)}><I.X /></button>
              </div>
              <div className="card-body">
                <div style={{ padding:'10px 14px', background:'var(--surface2)', border:'1px solid var(--line)', borderRadius:'var(--r)', marginBottom:14, fontSize:13.5, color:'var(--ink)', lineHeight:1.65 }}>
                  <div style={{ fontSize:11, fontWeight:600, color:'var(--ink4)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>
                    {selected.is_anon ? 'Anonymous' : selected.user_name || 'User'}
                    {selected.user_contact && <span style={{ marginLeft:8, fontWeight:400, color:'var(--ink4)' }}>· {selected.user_contact}</span>}
                  </div>
                  {selected.content}
                </div>
                {replies.length > 0 && (
                  <div style={{ marginBottom:14 }}>
                    {replies.map((r, i) => (
                      <div key={i} style={{ padding:'8px 12px', borderRadius:'var(--r)', marginBottom:6, background: r.role==='admin'?'var(--coffee-0)':'var(--surface2)', border: r.role==='admin'?'none':'1px solid var(--line)' }}>
                        <div style={{ fontSize:10.5, fontWeight:600, color: r.role==='admin'?'rgba(253,250,244,0.7)':'var(--ink4)', marginBottom:3, textTransform:'uppercase', letterSpacing:'0.06em' }}>
                          {r.role === 'admin' ? '👋 You' : 'User'}
                        </div>
                        <div style={{ fontSize:13, color: r.role==='admin'?'var(--parch-1)':'var(--ink)', lineHeight:1.55 }}>{r.content}</div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="field">
                  <label className="label">Your reply</label>
                  <textarea className="input" style={{ minHeight:100 }}
                    placeholder="Write a reply to this feedback…"
                    value={reply} onChange={e => setReply(e.target.value)} />
                </div>
                <button className="btn btn-primary w100" onClick={sendReply} disabled={!reply.trim() || sending}>
                  {sending ? <Spinner size={14} color="white" /> : 'Send reply →'}
                </button>
              </div>
            </div>
          )}
          </div>

          {summary && (
            <div className="card fade-in" style={{ position:'sticky', top:8 }}>
              <div className="card-head">
                <div className="card-title">Feedback summary</div>
                <button className="btn btn-secondary btn-sm" onClick={generateSummary} disabled={summarising}>
                  {summarising ? <Spinner size={13} color="var(--ink3)" /> : '↻ Refresh'}
                </button>
              </div>
              <div className="card-body">
                <p style={{ fontSize:13.5, color:'var(--ink)', lineHeight:1.75, marginBottom:16 }}>{summary.overview}</p>
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  <div>
                    <div style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--ink4)', marginBottom:8 }}>Top themes</div>
                    {summary.topThemes?.map((t, i) => (
                      <div key={i} style={{ fontSize:13, color:'var(--ink)', padding:'5px 0', borderBottom:'1px solid var(--line)' }}>• {t}</div>
                    ))}
                  </div>
                  <div>
                    <div style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--ink4)', marginBottom:8 }}>Suggestions</div>
                    {summary.suggestions?.map((s, i) => (
                      <div key={i} style={{ fontSize:13, color:'var(--ink)', padding:'5px 0', borderBottom:'1px solid var(--line)' }}>💡 {s}</div>
                    ))}
                  </div>
                  {summary.urgent?.length > 0 && (
                    <div style={{ padding:'10px 14px', background:'var(--warn-bg)', borderRadius:'var(--r)', border:'1px solid rgba(181,99,26,0.2)' }}>
                      <div style={{ fontSize:11, fontWeight:600, color:'var(--warn)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.08em' }}>Urgent</div>
                      {summary.urgent.map((u, i) => <div key={i} style={{ fontSize:13, color:'var(--warn)' }}>⚠️ {u}</div>)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
// ── Insights page  ─────────────────────────────────────────────────────────────
function InsightsPage({ bot, convs }) {
  if (!bot) return <EmptyBot label="Insights" />

  const [insights,  setInsights]  = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState(null)
  const [messages,  setMessages]  = useState([])

  useEffect(() => {
    if (!bot?.id) return
    import('../lib/supabase.js').then(({ supabase }) => {
      supabase.from('messages')
        .select('role, content, created_at, conversation_id')
        .in('conversation_id',
          convs.map(c => c.id).filter(Boolean)
        )
        .order('created_at', { ascending: true })
        .then(({ data }) => setMessages(data || []))
    })
  }, [bot?.id, convs])

  useEffect(() => {
    if (messages.length > 0) generateInsights()
  }, [messages])

  async function generateInsights() {
    if (messages.length === 0) return
    setLoading(true)
    setError(null)
    try {
      const { callClaude } = await import('../lib/supabase.js')
      const transcript = messages
        .filter(m => m.role === 'user')
        .map(m => `- ${m.content}`)
        .slice(-100)
        .join('\n')

      const result = await callClaude({
        system: `You are an AI analyst reviewing chatbot conversations for a business. 
Analyse the user messages and return a JSON object with exactly these fields:
{
  "summary": "2-3 sentence overview of what users are asking about",
  "topTopics": ["topic1", "topic2", "topic3", "topic4", "topic5"],
  "gaps": ["gap1", "gap2", "gap3"],
  "sentiment": "positive|neutral|mixed|negative",
  "sentimentNote": "one sentence explanation",
  "recommendations": ["rec1", "rec2", "rec3"],
  "urgentGap": "the single most important missing knowledge base entry or null"
}
Return ONLY valid JSON, no markdown, no explanation.`,
        messages: [],
        userMessage: `Here are the last ${messages.filter(m=>m.role==='user').length} user messages from this bot:\n\n${transcript}`,
      })

      const cleaned = result.replace(/```json|```/g, '').trim()
      setInsights(JSON.parse(cleaned))
    } catch(e) {
      setError('Could not generate insights. Please try again.')
      console.error(e)
    }
    setLoading(false)
  }

  const sentimentColor = {
    positive: 'var(--success)',
    neutral:  'var(--ink3)',
    mixed:    'var(--warn)',
    negative: 'var(--danger)',
  }

  const sentimentBg = {
    positive: 'var(--success-bg)',
    neutral:  'var(--surface2)',
    mixed:    'var(--warn-bg)',
    negative: 'var(--danger-bg)',
  }

  return (
    <div className="page fade-up">
      <div className="flex ic jb mb-28">
        <div>
          <h1 className="page-title">Insights</h1>
          <p className="page-sub">AI-generated analysis of your conversation history.</p>
        </div>
        <button className="btn btn-primary" onClick={generateInsights} disabled={loading || messages.length === 0}>
          {loading ? <><Spinner size={14} color="white" /> Analysing…</> : '✦ Generate insights'}
        </button>
      </div>

      {messages.length === 0 && (
        <div className="card mb-12">
          <div className="empty">
            <div className="empty-icon">💬</div>
            <div className="empty-title">No conversations yet</div>
            <div className="empty-sub">Once users start chatting, you can generate AI insights about what they're asking and where your knowledge base has gaps.</div>
          </div>
        </div>
      )}

      {error && <div className="alert alert-error mb-16">{error}</div>}

      {!insights && messages.length > 0 && !loading && (
        <div className="card mb-12">
          <div className="empty">
            <div className="empty-icon">✦</div>
            <div className="empty-title">Ready to analyse</div>
            <div className="empty-sub">{messages.filter(m=>m.role==='user').length} user messages ready. Click "Generate insights" to analyse what your users are asking, what's missing, and what to improve.</div>
          </div>
        </div>
      )}

      {insights && (
        <>
          {/* Summary */}
          <div className="card mb-12 fade-up">
            <div className="card-head"><div className="card-title">Summary</div></div>
            <div className="card-body">
              <p style={{ fontSize:14, color:'var(--ink)', lineHeight:1.75 }}>{insights.summary}</p>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
            {/* Top topics */}
            <div className="card fade-up d1">
              <div className="card-head"><div className="card-title">Top topics</div></div>
              <div className="card-body">
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {insights.topTopics?.map((topic, i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:22, height:22, borderRadius:6, background:'var(--coffee-0)', color:'var(--parch-1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0 }}>{i+1}</div>
                      <span style={{ fontSize:13.5, color:'var(--ink)' }}>{topic}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sentiment */}
            <div className="card fade-up d2">
              <div className="card-head"><div className="card-title">User sentiment</div></div>
              <div className="card-body">
                <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'8px 16px', borderRadius:20, background: sentimentBg[insights.sentiment] || 'var(--surface2)', marginBottom:12 }}>
                  <span style={{ fontSize:20 }}>
                    {insights.sentiment === 'positive' ? '😊' : insights.sentiment === 'negative' ? '😞' : insights.sentiment === 'mixed' ? '😐' : '😶'}
                  </span>
                  <span style={{ fontSize:14, fontWeight:600, color: sentimentColor[insights.sentiment] || 'var(--ink3)', textTransform:'capitalize' }}>
                    {insights.sentiment}
                  </span>
                </div>
                <p style={{ fontSize:13, color:'var(--ink3)', lineHeight:1.65 }}>{insights.sentimentNote}</p>
              </div>
            </div>
          </div>

          {/* Knowledge gaps */}
          <div className="card mb-12 fade-up d3">
            <div className="card-head">
              <div className="card-title">Knowledge gaps</div>
              <span className="badge badge-amber">{insights.gaps?.length} identified</span>
            </div>
            <div className="card-body">
              {insights.urgentGap && (
                <div style={{ padding:'10px 14px', background:'var(--warn-bg)', border:'1px solid rgba(181,99,26,0.2)', borderRadius:'var(--r)', marginBottom:14, fontSize:13.5, color:'var(--warn)' }}>
                  <strong>Most urgent:</strong> {insights.urgentGap}
                </div>
              )}
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {insights.gaps?.map((gap, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 0', borderBottom: i < insights.gaps.length-1 ? '1px solid var(--line)' : 'none' }}>
                    <span style={{ fontSize:14, flexShrink:0 }}>⚠️</span>
                    <span style={{ fontSize:13.5, color:'var(--ink)', lineHeight:1.55 }}>{gap}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="card fade-up d4">
            <div className="card-head"><div className="card-title">Recommendations</div></div>
            <div className="card-body">
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {insights.recommendations?.map((rec, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 0', borderBottom: i < insights.recommendations.length-1 ? '1px solid var(--line)' : 'none' }}>
                    <span style={{ fontSize:14, flexShrink:0 }}>💡</span>
                    <span style={{ fontSize:13.5, color:'var(--ink)', lineHeight:1.55 }}>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── Share page ────────────────────────────────────────────────────────────────
function SharePage({ bot, shareUrl }) {
  const [copied, setCopied]       = useState(null)
  const [platform, setPlatform]   = useState('squarespace')

  if (!bot) return <EmptyBot label="Share" />

  const embedCode = `<script src="https://botbrunch.com/widget.js" data-bot-id="${bot.id}"></script>`

  function copy(text, key) {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const platforms = {
    squarespace: {
      label: 'Squarespace',
      steps: [
        'Log in to your Squarespace account',
        'Click Settings in the left sidebar',
        'Click Advanced → Code Injection',
        'Paste the code below into the Footer box',
        'Click Save — your chat bubble will appear immediately',
      ]
    },
    wix: {
      label: 'Wix',
      steps: [
        'Log in to your Wix account and open your site editor',
        'Click Settings in the top menu',
        'Click Custom Code',
        'Click + Add Custom Code',
        'Paste the code below, set "Place Code in" to Body — end, set "Add Code to Pages" to All Pages',
        'Click Apply — your chat bubble will appear immediately',
      ]
    },
    wordpress: {
      label: 'WordPress',
      steps: [
        'Log in to your WordPress dashboard',
        'Go to Appearance → Theme File Editor',
        'Find and click footer.php in the file list on the right',
        'Find the line that says </body> near the bottom',
        'Paste the code just above that line',
        'Click Update File — your chat bubble will appear immediately',
      ]
    },
    shopify: {
      label: 'Shopify',
      steps: [
        'Log in to your Shopify admin',
        'Go to Online Store → Themes',
        'Click Actions → Edit Code on your current theme',
        'Find and click theme.liquid in the file list',
        'Find the line that says </body> near the bottom',
        'Paste the code just above that line',
        'Click Save — your chat bubble will appear immediately',
      ]
    },
    other: {
      label: 'Other website',
      steps: [
        'Open your website\'s HTML editor or admin panel',
        'Find the footer section of your site',
        'Paste the code just before the closing </body> tag',
        'Save your changes — your chat bubble will appear immediately',
        'If you\'re not sure how to do this, send the code to your web developer',
      ]
    },
  }

  return (
    <div className="page fade-up" style={{ maxWidth: 680 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 className="page-title">Share your bot</h1>
        <p className="page-sub">Share your bot link or install it as a chat widget on your website.</p>
      </div>

      {/* Bot link */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-head"><div className="card-title">Your bot link</div></div>
        <div className="card-body">
          <p style={{ fontSize:13.5, color:'var(--ink3)', marginBottom:12 }}>
            Share this link directly with anyone — they can chat with your bot instantly, no install needed.
          </p>
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 12px', background:'var(--surface2)', border:'1px solid var(--line)', borderRadius:'var(--r)' }}>
            <span style={{ flex:1, fontSize:12.5, color:'var(--coffee-3)', fontFamily:'monospace', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{shareUrl}</span>
            <button className="btn btn-secondary btn-sm" onClick={() => window.open(shareUrl, '_blank')}>Preview</button>
            <button className="btn btn-primary btn-sm" onClick={() => copy(shareUrl, 'link')}>
              {copied === 'link' ? 'Copied!' : 'Copy link'}
            </button>
          </div>
        </div>
      </div>

      {/* Website widget */}
      <div className="card">
        <div className="card-head"><div className="card-title">Add to your website</div></div>
        <div className="card-body">
          <p style={{ fontSize:13.5, color:'var(--ink3)', marginBottom:20 }}>
            Add a chat bubble to your website so visitors can talk to your bot without leaving your site. Choose your website platform below for step-by-step instructions.
          </p>

          {/* Platform selector */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:24 }}>
            {Object.entries(platforms).map(([key, p]) => (
              <button key={key}
                onClick={() => setPlatform(key)}
                style={{ padding:'6px 14px', borderRadius:20, border:`1.5px solid ${platform===key?'var(--coffee-0)':'var(--line)'}`, background: platform===key?'var(--coffee-0)':'transparent', color: platform===key?'var(--parch-1)':'var(--ink3)', fontSize:13, cursor:'pointer', fontFamily:'var(--font-body)', transition:'all 0.15s' }}>
                {p.label}
              </button>
            ))}
          </div>

          {/* Steps */}
          <div style={{ marginBottom:24 }}>
            <div style={{ fontSize:12, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--ink4)', marginBottom:12 }}>
              How to install on {platforms[platform].label}
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {platforms[platform].steps.map((step, i) => (
                <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                  <div style={{ width:24, height:24, borderRadius:'50%', background:'var(--coffee-0)', color:'var(--parch-1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0 }}>
                    {i + 1}
                  </div>
                  <span style={{ fontSize:13.5, color:'var(--ink)', lineHeight:1.6, paddingTop:2 }}>{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Embed code */}
          <div style={{ fontSize:12, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--ink4)', marginBottom:8 }}>
            Your embed code
          </div>
          <div style={{ padding:'12px 14px', background:'var(--surface2)', border:'1px solid var(--line)', borderRadius:'var(--r)', fontFamily:'monospace', fontSize:12, color:'var(--coffee-2)', wordBreak:'break-all', marginBottom:10 }}>
            {embedCode}
          </div>
          <button className="btn btn-primary" onClick={() => copy(embedCode, 'embed')} style={{ width:'100%' }}>
            {copied === 'embed' ? '✓ Copied!' : 'Copy embed code'}
          </button>

          <div style={{ marginTop:14, padding:'10px 14px', background:'var(--surface2)', borderRadius:'var(--r)', fontSize:12.5, color:'var(--ink4)' }}>
            💡 Not sure how to do this? Copy the embed code and send it to whoever built your website — they'll know exactly what to do with it.
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Settings page ─────────────────────────────────────────────────────────────
function SettingsPage({ user, sub, onLogout, activeBot, onBotDeleted }) {
  const [pw,  setPw]  = useState('')
  const [pw2, setPw2] = useState('')
  const [msg, setMsg] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showPlanModal, setShowPlanModal] = useState(false)

  async function handleDeleteBot() {
    if (!activeBot) return
    setDeleting(true)
    try {
      const { supabase } = await import('../lib/supabase.js')
      await supabase.from('conversations').delete().eq('bot_id', activeBot.id)
      await supabase.from('knowledge_gaps').delete().eq('bot_id', activeBot.id)
      await supabase.from('feedback').delete().eq('bot_id', activeBot.id)
      await supabase.from('activity_log').delete().eq('bot_id', activeBot.id)
      await supabase.from('bots').delete().eq('id', activeBot.id)
      onBotDeleted()
    } catch(e) { console.error(e) }
    setDeleting(false)
  }

  async function changePw() {
    if (!pw || pw !== pw2) return setMsg('error:Passwords do not match.')
    if (pw.length < 6) return setMsg('error:Must be at least 6 characters.')
    try {
      const { supabase } = await import('../lib/supabase.js')
      const { error } = await supabase.auth.updateUser({ password: pw })
      if (error) throw error
      setPw(''); setPw2(''); setMsg('success:Password updated.')
      setTimeout(() => setMsg(''), 3000)
    } catch (e) { setMsg(`error:${e.message}`) }
  }

  const [type, text] = (msg || ':').split(':')

  return (
    <div className="page fade-up" style={{ maxWidth: '100%', textAlign:'center' }}>
      {showPlanModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={() => setShowPlanModal(false)}>
          <div style={{ background:'#0f0f18', border:'1px solid rgba(124,58,237,0.3)', borderRadius:4, padding:32, width:480, maxWidth:'90vw', boxShadow:'0 24px 48px rgba(0,0,0,0.9)' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily:'LLPixel, monospace', fontSize:18, color:'#f59e0b', marginBottom:8, letterSpacing:3 }}>CHANGE PLAN</div>
            <p style={{ fontSize:13, color:'#7878a0', marginBottom:24 }}>Select a plan. You'll be taken to a secure checkout page.</p>
            <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:24 }}>
              {[
                { id:'solo', label:'SOLO', price:'$9/mo', desc:'1 bot · 500 messages/month' },
                { id:'squadron', label:'SQUADRON', price:'$19/mo', desc:'3 bots · 2,000 messages/month' },
                { id:'fleet', label:'FLEET', price:'$39/mo', desc:'10 bots · 6,000 messages/month' },
              ].map(p => (
                <button key={p.id} onClick={async () => {
                  setShowPlanModal(false)
                  console.log('sub:', sub)
if (sub?.stripe_subscription_id) {
                    // Existing subscriber — update subscription directly
                    const res = await fetch('/api/stripe-checkout', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ plan: p.id, userId: user.id, subscriptionId: sub.stripe_subscription_id })
                    })
                    if (res.ok) window.location.reload()
                    else alert('Something went wrong. Please try again.')
                  } else {
                    // New subscriber — go through checkout
                    const { startCheckout } = await import('../lib/supabase.js')
                    startCheckout(p.id, user.id, user.email)
                  }
                }} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 18px', border:`1px solid ${sub?.plan === p.id ? '#f59e0b' : 'rgba(124,58,237,0.2)'}`, borderRadius:4, background: sub?.plan === p.id ? 'rgba(245,158,11,0.1)' : '#161622', cursor:'pointer' }}>
                  <div style={{ textAlign:'left' }}>
                    <div style={{ fontFamily:'LLPixel, monospace', fontSize:13, color:'#f59e0b', letterSpacing:2 }}>{p.label}</div>
                    <div style={{ fontSize:12, color:'#7878a0', marginTop:2 }}>{p.desc}</div>
                  </div>
                  <div style={{ fontSize:16, fontWeight:700, color:'#f0f0ff' }}>{p.price}</div>
                </button>
              ))}
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowPlanModal(false)}>Close</button>
          </div>
        </div>
      )}
      <div className="mb-28">
        <h1 className="page-title">Settings</h1>
      </div>
      <div className="card mb-12">
        <div className="card-head"><div className="card-title">Account</div></div>
        <div className="card-body">
          <div className="field"><label className="label">Email</label><input className="input" value={user?.email || ''} disabled style={{ opacity: 0.6 }} /></div>
          {sub?.business_name && <div className="field" style={{ marginBottom: 0 }}><label className="label">Business name</label><input className="input" value={sub.business_name} disabled style={{ opacity: 0.6 }} /></div>}
        </div>
      </div>
      <div className="card mb-12">
        <div className="card-head"><div className="card-title">Subscription</div></div>
        <div className="card-body">
          
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:15, fontWeight:600, color:'var(--ink)', textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>
              {sub?.plan && sub.plan !== 'trial' ? sub.plan.charAt(0).toUpperCase() + sub.plan.slice(1) : 'Free Trial'} Plan
            </div>
            <div style={{ fontSize:12, color:'var(--ink3)', marginBottom:14 }}>
              {sub?.trial_ends_at && new Date(sub.trial_ends_at) > new Date()
                ? `Trial ends ${new Date(sub.trial_ends_at).toLocaleDateString('en-NZ', { day:'numeric', month:'short', year:'numeric' })}`
                : sub?.stripe_subscription_id ? 'Active subscription' : 'No active subscription'}
            </div>
            </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {['solo','squadron','fleet'].map(plan => (
              <div key={plan} style={{ flex:1, minWidth:120, padding:'12px 14px', borderRadius:'var(--r)', border:`1px solid ${sub?.plan === plan ? 'var(--accent)' : 'var(--line)'}`, background: sub?.plan === plan ? 'var(--accent-bg)' : 'var(--surface2)' }}>
                <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:1, color: sub?.plan === plan ? 'var(--accent)' : 'var(--ink3)', marginBottom:4 }}>{plan}</div>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--ink)' }}>{plan === 'solo' ? '$9' : plan === 'squadron' ? '$19' : '$39'}<span style={{ fontSize:10, color:'var(--ink3)', fontWeight:400 }}>/mo</span></div>
                <div style={{ fontSize:11, color:'var(--ink4)', marginTop:2 }}>{plan === 'solo' ? '1 bot · 500 msg' : plan === 'squadron' ? '3 bots · 2000 msg' : '10 bots · 6000 msg'}</div>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:8, justifyContent:'center', marginTop:16 }}>
            <button className="btn btn-primary btn-sm" onClick={() => setShowPlanModal(true)}>
              Change plan
            </button>
            {sub?.stripe_subscription_id && sub?.plan !== 'cancelled' && (
              <button className="btn btn-secondary btn-sm" onClick={async () => {
                if (!confirm('Are you sure you want to cancel your subscription?')) return
                const res = await fetch('/api/cancel-subscription', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ subscriptionId: sub.stripe_subscription_id })
                })
                if (res.ok) alert('Subscription cancelled. You\'ll retain access until the end of your billing period.')
                else alert('Something went wrong. Please try again.')
              }}>
                Cancel subscription
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="card mb-12">
        <div className="card-head"><div className="card-title">Change password</div></div>
        <div className="card-body">
          {msg && <div className={`alert alert-${type === 'error' ? 'error' : 'success'} mb-16`}>{text}</div>}
          <div className="field"><label className="label">New password</label><input className="input" type="password" placeholder="••••••••" value={pw} onChange={e => setPw(e.target.value)} /></div>
          <div className="field"><label className="label">Confirm password</label><input className="input" type="password" placeholder="••••••••" value={pw2} onChange={e => setPw2(e.target.value)} /></div>
          <button className="btn btn-primary btn-sm" onClick={changePw}>Update password</button>
        </div>
      </div>
      <div className="card">
        <div className="card-head"><div className="card-title">Session</div></div>
        <div className="card-body"><button className="btn btn-danger" onClick={onLogout}>Sign out</button></div>
      </div>

      {activeBot && (
        <div className="card mt-12" style={{ borderColor: 'rgba(155,34,38,0.2)' }}>
          <div className="card-head"><div className="card-title" style={{ color:'var(--danger)' }}>Danger zone</div></div>
          <div className="card-body">
            <p style={{ fontSize:13.5, color:'var(--ink3)', marginBottom:14 }}>
              Permanently delete <strong>{activeBot.name || 'this bot'}</strong> and all its data — conversations, knowledge base, feedback, and inbox items. This cannot be undone.
            </p>
            {!confirmDelete ? (
              <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(true)}>
                Delete this bot
              </button>
            ) : (
              <div style={{ padding:'16px', background:'var(--danger-bg)', borderRadius:'var(--r)', border:'1px solid rgba(155,34,38,0.2)' }}>
                <p style={{ fontSize:13.5, fontWeight:600, color:'var(--danger)', marginBottom:12 }}>
                  Are you sure? This will permanently delete "{activeBot.name}" and all its data.
                </p>
                <div style={{ display:'flex', gap:8 }}>
                  <button className="btn btn-danger btn-sm" disabled={deleting} onClick={handleDeleteBot}>
                    {deleting ? 'Deleting...' : 'Yes, delete permanently'}
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setConfirmDelete(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function EmptyBot({ label }) {
  return (
    <div className="page flex ic jc" style={{ minHeight: 'calc(100vh - 54px)', flexDirection: 'column', gap: 10 }}>
      <div className="empty-icon">🤖</div>
      <div className="empty-title">Create your bot first</div>
      <div className="empty-sub">Build and publish your bot to access {label}.</div>
    </div>
  )
}
function ConversationContext({ convId }) {
  const [msgs,    setMsgs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [open,    setOpen]    = useState(false)

  useEffect(() => {
    import('../lib/supabase.js').then(({ supabase }) => {
      supabase.from('messages').select('*').eq('conversation_id', convId)
        .order('created_at', { ascending: true })
        .then(({ data }) => { setMsgs(data || []); setLoading(false) })
    })
  }, [convId])

  if (loading) return null
  if (msgs.length === 0) return null

  return (
    <div style={{ marginBottom:14 }}>
      <button onClick={() => setOpen(p => !p)}
        style={{ fontSize:12, fontWeight:500, color:'var(--coffee-1)', background:'none', border:'none', cursor:'pointer', padding:0, marginBottom:6, display:'flex', alignItems:'center', gap:5 }}>
        {open ? '▾' : '▸'} {open ? 'Hide' : 'Show'} conversation ({msgs.length} messages)
      </button>
      {open && (
        <div style={{ border:'1px solid var(--line)', borderRadius:'var(--r)', overflow:'hidden', maxHeight:240, overflowY:'auto' }}>
          {msgs.map((m, i) => (
            <div key={i} style={{
              padding:'8px 12px',
              borderBottom: i < msgs.length-1 ? '1px solid var(--line)' : 'none',
              background: m.role === 'user' ? 'var(--surface)' : 'var(--surface2)',
              display:'flex', gap:8, alignItems:'flex-start',
            }}>
              <span style={{ fontSize:10, fontWeight:600, color: m.role==='user'?'var(--coffee-1)':'var(--ink4)', textTransform:'uppercase', letterSpacing:'0.06em', whiteSpace:'nowrap', marginTop:2, minWidth:28 }}>
                {m.role === 'user' ? 'User' : 'Bot'}
              </span>
              {m.role === 'bot'? <span style={{ fontSize:12.5, color:'var(--ink)', lineHeight:1.55 }} dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content.replace(/\[FALLBACK\]/g, '')) }} />
                
                : <span style={{ fontSize:12.5, color:'var(--ink)', lineHeight:1.55 }}>{m.content}</span>
              }
            </div>
          ))}
        </div>
      )}
    </div>
  )
}