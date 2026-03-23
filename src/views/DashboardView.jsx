import { useState, useEffect } from 'react'
import { getBotStats, getKnowledgeGaps, getConversations, getBotsByOwner, getFeedback, signOut } from '../lib/supabase.js'
import { I, Spinner } from '../components/UI.jsx'

const NAV = [
  { id: 'dashboard', label: 'Dashboard', Icon: I.Home },
  { id: 'inbox',     label: 'Inbox',     Icon: I.Inbox },
  { id: 'feedback',  label: 'Feedback',  Icon: I.Users },
  { id: 'insights',  label: 'Insights',  Icon: I.Chart },
]

export default function DashboardView({ user, sub, bot, onEditBot, onLogout }) {
  const [page,    setPage]    = useState('dashboard')
  const [stats,   setStats]   = useState(null)
  const [gaps,    setGaps]    = useState([])
  const [convs,   setConvs]   = useState([])
  const [loading, setLoading] = useState(true)
  const [allBots,   setAllBots]   = useState([])
  const [activeBot, setActiveBot] = useState(bot)
  const [feedback,  setFeedback]  = useState([])

  useEffect(() => {
    getBotsByOwner(sub.id).then(bots => {
      setAllBots(bots)
      // default to first bot or passed bot
      const current = bot || bots[0] || null
      setActiveBot(current)
    }).catch(console.error)
  }, [sub.id])

  useEffect(() => {
    if (!activeBot) { setLoading(false); return }
    setLoading(true)
    Promise.all([
      getBotStats(activeBot.id),
      getKnowledgeGaps(activeBot.id),
      getConversations(activeBot.id),
      getFeedback(activeBot.id),
    ]).then(([s, g, c, fb]) => {
      setStats(s); setGaps(g); setConvs(c); setFeedback(fb)
    }).catch(console.error).finally(() => setLoading(false))
  }, [activeBot?.id])

  const shareUrl = activeBot ? `${window.location.origin}?bot=${activeBot.id}` : ''

  return (
    <div className="app">
      {/* Top nav pill */}
      <nav className="topnav">
        <div className="topnav-logo">
          <div className="topnav-logo-mark">🥪</div>
          Lunch Bots
        </div>

        <div className="topnav-pill">
          {NAV.map(({ id, label, Icon }) => (
            <button key={id} className={`pill-item ${page === id ? 'active' : ''}`}
              onClick={() => setPage(id)}>
              {label}
            </button>
          ))}
          <button className="pill-item" onClick={onEditBot}>
            {bot ? 'Edit Bot' : 'Create Bot'}
          </button>
          <button className="pill-item" onClick={() => setPage('settings')}>
            Settings
          </button>
        </div>

        <div className="topnav-right">
          <span style={{ fontSize: 12, color: 'var(--ink4)' }}>{sub?.business_name || user?.email}</span>
          <button className="btn btn-ghost btn-sm" onClick={onLogout}>Sign out</button>
        </div>
      </nav>

      {/* Pages */}
      {/* Bot switcher */}
      {allBots.length > 0 && (
        <div style={{ padding:'8px 28px', borderBottom:'1px solid var(--line)', background:'var(--surface2)', display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--ink4)', marginRight:4 }}>Active bot:</span>
          {allBots.map(b => (
            <button key={b.id} onClick={() => { setActiveBot(b); setPage('dashboard') }}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 12px', borderRadius:20, border:`1.5px solid ${activeBot?.id===b.id?'var(--coffee-0)':'var(--line)'}`, background: activeBot?.id===b.id?'var(--coffee-0)':'var(--surface)', color: activeBot?.id===b.id?'var(--parch-1)':'var(--ink3)', fontSize:12.5, fontWeight:500, cursor:'pointer', transition:'all 0.12s' }}>
              {b.bot_type === 'internal' ? '🔒' : '🌐'} {b.name || 'Unnamed bot'}
            </button>
          ))}
          <button onClick={() => onEditBot(null)}
            style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:20, border:'1.5px dashed var(--line)', background:'transparent', color:'var(--ink4)', fontSize:12, cursor:'pointer', marginLeft:4 }}>
            + New bot
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex ic jc" style={{ height: 'calc(100vh - 54px)', gap: 8 }}>
          <Spinner size={20} color="var(--coffee-3)" />
          <span style={{ color: 'var(--ink3)', fontSize: 13 }}>Loading…</span>
        </div>
      ) : (
        <>
          {page === 'dashboard' && <DashPage bot={activeBot} stats={stats} convs={convs} gaps={gaps} shareUrl={shareUrl} onEdit={() => onEditBot(activeBot)} />}
          {page === 'inbox'     && <InboxPage bot={activeBot} gaps={gaps} setGaps={setGaps} />}
          {page === 'feedback'  && <FeedbackAdminPage bot={activeBot} feedback={feedback} setFeedback={setFeedback} />}
          {page === 'insights'  && <InsightsPage bot={activeBot} convs={convs} />}
          {page === 'settings'  && <SettingsPage user={user} sub={sub} onLogout={onLogout} />}
        </>
      )}
    </div>
  )
}

// ── Dashboard page ────────────────────────────────────────────────────────────
function DashPage({ bot, stats, convs, gaps, shareUrl, onEdit }) {
  const [copied, setCopied] = useState(false)

  if (!bot) {
    return (
      <div className="flex ic jc" style={{ height: 'calc(100vh - 54px)', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 48 }}>🥪</div>
        <h2 className="serif" style={{ fontSize: '1.5rem', color: 'var(--coffee-0)' }}>Build your first bot</h2>
        <p style={{ fontSize: 13.5, color: 'var(--ink3)', textAlign: 'center', maxWidth: 340, lineHeight: 1.7 }}>
          Turn your knowledge into a branded AI assistant in about 5 minutes. Share it with your customers or team.
        </p>
        <button className="btn btn-accent btn-lg" onClick={onEdit}>
          <I.Rocket /> Launch setup →
        </button>
      </div>
    )
  }

  return (
    <div className="page fade-up">
      <div className="flex ic jb mb-28">
        <div>
          <h1 className="page-title">{bot.name}</h1>
          {bot.descriptor && <p className="page-sub">{bot.descriptor}</p>}
        </div>
        <div className="flex ic g8">
          <span className="badge badge-green">● Live</span>
          <button className="btn btn-secondary btn-sm" onClick={onEdit}>Edit bot</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:12, marginBottom:24 }}>
        {[
          { label: 'Total conversations', num: stats?.totalConversations ?? 0 },
          { label: 'Unique users',        num: stats?.uniqueUsers ?? 0 },
          { label: 'Messages sent',       num: stats?.totalMessages ?? 0 },
          { label: 'This week',           num: stats?.conversationsThisWeek ?? 0 },
          { label: 'Feedback received',   num: stats?.feedbackCount ?? 0 },
          { label: 'Inbox items',         num: (stats?.unresolvedGaps ?? 0) + (stats?.unresolvedFeedback ?? 0) },
        ].map((s, i) => (
          <div key={i} className={`stat-card fade-up d${i+1}`}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-num">{s.num}</div>
          </div>
        ))}
      </div>

      {/* 7-day activity chart */}
      {stats?.sevenDays && stats.sevenDays.some(d => d.count > 0) && (
        <div className="card mb-12 fade-up d3">
          <div className="card-head"><div className="card-title">Activity — last 7 days</div></div>
          <div className="card-body">
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:6, height:80, alignItems:'flex-end' }}>
              {stats.sevenDays.map((d, i) => {
                const max = Math.max(...stats.sevenDays.map(x => x.count), 1)
                const h   = Math.max((d.count / max) * 100, d.count > 0 ? 8 : 2)
                return (
                  <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
                    <div style={{ fontSize:10, color:'var(--ink4)', fontWeight:500 }}>{d.count > 0 ? d.count : ''}</div>
                    <div style={{ width:'100%', height:80, display:'flex', alignItems:'flex-end' }}>
                      <div style={{ width:'100%', height:`${h}%`, background: d.count > 0 ? 'var(--coffee-0)' : 'var(--surface3)', borderRadius:'3px 3px 0 0', transition:'height 0.4s ease', minHeight:3 }} />
                    </div>
                    <div style={{ fontSize:10.5, color:'var(--ink4)' }}>{d.label}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Share link */}
      <div className="card mb-12 fade-up d2">
        <div className="card-head">
          <div>
            <div className="card-title">Your bot link</div>
            <div className="card-sub">Share this with your customers to start conversations.</div>
          </div>
          <button className="btn btn-secondary btn-sm"
            onClick={() => window.open(shareUrl, '_blank')}>
            <I.Eye /> Preview
          </button>
        </div>
        <div className="card-body">
          <div className="flex ic g8" style={{ padding: '9px 12px', background: 'var(--surface2)', border: '1px solid var(--line)', borderRadius: 'var(--r)' }}>
            <span style={{ flex: 1, fontSize: 12.5, color: 'var(--coffee-3)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shareUrl}</span>
            <button className="btn btn-primary btn-sm"
              onClick={() => { navigator.clipboard.writeText(shareUrl).catch(()=>{}); setCopied(true); setTimeout(()=>setCopied(false), 2000) }}>
              <I.Copy width={12} height={12} /> {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Recent conversations */}
        <div className="card fade-up d3">
          <div className="card-head"><div className="card-title">Recent conversations</div></div>
          {convs.length === 0 ? (
            <div className="empty" style={{ padding: '32px 20px' }}>
              <div className="empty-icon">💬</div>
              <div className="empty-title">No conversations yet</div>
              <div className="empty-sub">Share your bot link to start collecting real questions from your customers.</div>
            </div>
          ) : (
            <table className="tbl">
              <thead><tr><th>Type</th><th>Messages</th><th>Date</th></tr></thead>
              <tbody>
                {convs.slice(0, 6).map((c, i) => (
                  <tr key={i}>
                    <td><span className={`badge ${c.type==='feedback'?'badge-amber':'badge-coffee'}`}>{c.type}</span></td>
                    <td style={{ fontSize: 13 }}>{c.messages?.[0]?.count ?? '—'}</td>
                    <td style={{ fontSize: 12, color: 'var(--ink4)' }}>{new Date(c.created_at).toLocaleDateString('en-NZ', { day:'numeric', month:'short' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Knowledge gaps */}
        <div className="card fade-up d4">
          <div className="card-head">
            <div className="card-title">Inbox preview</div>
            {gaps.length > 0 && <span className="badge badge-amber">{gaps.length} unresolved</span>}
          </div>
          {gaps.length === 0 ? (
            <div className="empty" style={{ padding: '32px 20px' }}>
              <div className="empty-icon">✉️</div>
              <div className="empty-title">Inbox is clear</div>
              <div className="empty-sub">When your bot can't answer a question, it appears here for you to respond to.</div>
            </div>
          ) : (
            <div style={{ padding: '8px 0' }}>
              {gaps.slice(0, 5).map((g, i) => (
                <QuickAnswerRow key={i} gap={g} bot={bot} isLast={i >= Math.min(gaps.length-1, 4)}
                  onAnswered={() => setGaps(p => p.filter(x => x.id !== g.id))} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Knowledge health */}
      <div className="card mt-12 fade-up d5">
        <div className="card-head">
          <div className="card-title">Knowledge base</div>
          <button className="btn btn-secondary btn-sm" onClick={onEdit}>Edit content</button>
        </div>
        <div className="card-body">
          {bot.knowledge_text ? (
            <div>
              <div style={{ fontSize: 13, color: 'var(--ink2)', marginBottom: 8 }}>
                {bot.knowledge_text.split(/\s+/).filter(Boolean).length.toLocaleString()} words · {bot.knowledge_text.length.toLocaleString()} characters
              </div>
              <div style={{ height: 4, background: 'var(--surface3)', borderRadius: 2, maxWidth: 400 }}>
                <div style={{ height: 4, width: `${Math.min(100, (bot.knowledge_text.split(/\s+/).filter(Boolean).length / 2000) * 100)}%`, background: 'var(--coffee-0)', borderRadius: 2, transition: 'width 0.6s ease' }} />
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink4)', marginTop: 6 }}>
                {bot.knowledge_text.split(/\s+/).filter(Boolean).length < 300 ? '⚠ Consider adding more content for stronger answers.' : '✓ Good knowledge base.'}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 13.5, color: 'var(--ink3)' }}>
              No content added yet. <button className="btn btn-ghost btn-sm" style={{ display: 'inline-flex' }} onClick={onEdit}>Add knowledge base →</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
// ── Quick answer row (used in dashboard inbox preview) ────────────────────────
function QuickAnswerRow({ gap, bot, isLast, onAnswered }) {
  const [open,    setOpen]    = useState(false)
  const [answer,  setAnswer]  = useState('')
  const [saving,  setSaving]  = useState(false)

  async function handleAnswer() {
    if (!answer.trim()) return
    setSaving(true)
    try {
      const { supabase } = await import('../lib/supabase.js')
      await supabase.from('knowledge_gaps').update({
        admin_answer: answer.trim(),
        resolved: true,
        added_to_kb: true,
        resolved_at: new Date().toISOString(),
      }).eq('id', gap.id)

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
      const newKbText = (bot.knowledge_text || '') + `\n\nQ: ${gap.question}\nA: ${answer.trim()}`
      await supabase.from('bots').update({
        knowledge_entries: updatedEntries,
        knowledge_text: newKbText,
        updated_at: new Date().toISOString(),
      }).eq('id', bot.id)
      bot.knowledge_entries = updatedEntries
      bot.knowledge_text = newKbText
      onAnswered()
    } catch(e) { console.error(e) }
    setSaving(false)
  }

  return (
    <div style={{ borderBottom: isLast ? 'none' : '1px solid var(--line)' }}>
      <div style={{ padding:'10px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, cursor:'pointer' }}
        onClick={() => setOpen(p => !p)}>
        <div style={{ minWidth:0 }}>
          <div style={{ fontSize:13, color:'var(--ink)', marginBottom:2, lineHeight:1.5 }}>
            "{gap.question.slice(0, 60)}{gap.question.length > 60 ? '…' : ''}"
          </div>
          <div style={{ fontSize:11.5, color:'var(--ink4)' }}>
            {new Date(gap.created_at).toLocaleDateString('en-NZ', { day:'numeric', month:'short' })}
          </div>
        </div>
        <button className="btn btn-secondary btn-xs" style={{ flexShrink:0 }}>
          {open ? 'Cancel' : 'Answer →'}
        </button>
      </div>
      {open && (
        <div style={{ padding:'0 20px 14px' }}>
          <textarea
            className="input" style={{ minHeight:80, marginBottom:8 }}
            placeholder="Type your answer…"
            value={answer} onChange={e => setAnswer(e.target.value)}
            autoFocus
          />
          <button className="btn btn-primary btn-sm w100" onClick={handleAnswer} disabled={!answer.trim() || saving}>
            {saving ? <Spinner size={13} color="white" /> : 'Save & add to knowledge base'}
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
      alert('✓ Answer saved to knowledge base and sent to user.')
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

      {/* AI Summary */}
      {summary && (
        <div className="card mb-16 fade-in">
          <div className="card-head"><div className="card-title">Feedback summary</div></div>
          <div className="card-body">
            <p style={{ fontSize:13.5, color:'var(--ink)', lineHeight:1.75, marginBottom:16 }}>{summary.overview}</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
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
            </div>
            {summary.urgent?.length > 0 && (
              <div style={{ marginTop:12, padding:'10px 14px', background:'var(--warn-bg)', borderRadius:'var(--r)', border:'1px solid rgba(181,99,26,0.2)' }}>
                <div style={{ fontSize:11, fontWeight:600, color:'var(--warn)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.08em' }}>Urgent</div>
                {summary.urgent.map((u, i) => <div key={i} style={{ fontSize:13, color:'var(--warn)' }}>⚠️ {u}</div>)}
              </div>
            )}
          </div>
        </div>
      )}

      {feedback.length === 0 ? (
        <div className="card">
          <div className="empty">
            <div className="empty-icon">📝</div>
            <div className="empty-title">No feedback yet</div>
            <div className="empty-sub">When users submit feedback through your bot link, it appears here.</div>
          </div>
        </div>
      ) : (
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
                {/* Original message */}
                <div style={{ padding:'10px 14px', background:'var(--surface2)', border:'1px solid var(--line)', borderRadius:'var(--r)', marginBottom:14, fontSize:13.5, color:'var(--ink)', lineHeight:1.65 }}>
                  <div style={{ fontSize:11, fontWeight:600, color:'var(--ink4)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>
                    {selected.is_anon ? 'Anonymous' : selected.user_name || 'User'}
                    {selected.user_contact && <span style={{ marginLeft:8, fontWeight:400, color:'var(--ink4)' }}>· {selected.user_contact}</span>}
                  </div>
                  {selected.content}
                </div>

                {/* Replies thread */}
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

                {/* Reply input */}
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
      )}
    </div>
  )
}
// ── Insights page ─────────────────────────────────────────────────────────────
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

// ── Settings page ─────────────────────────────────────────────────────────────
function SettingsPage({ user, sub, onLogout }) {
  const [pw,  setPw]  = useState('')
  const [pw2, setPw2] = useState('')
  const [msg, setMsg] = useState('')

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
    <div className="page fade-up" style={{ maxWidth: 520 }}>
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
              <span style={{ fontSize:12.5, color:'var(--ink)', lineHeight:1.55 }}>{m.content}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}