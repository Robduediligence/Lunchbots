import { useState, useEffect } from 'react'
import { getBotStats, getKnowledgeGaps, getConversations, signOut } from '../lib/supabase.js'
import { I, Spinner } from '../components/UI.jsx'

const NAV = [
  { id: 'dashboard', label: 'Dashboard', Icon: I.Home },
  { id: 'inbox',     label: 'Inbox',     Icon: I.Inbox },
  { id: 'insights',  label: 'Insights',  Icon: I.Chart },
]

export default function DashboardView({ user, sub, bot, onEditBot, onLogout }) {
  const [page,   setPage]   = useState('dashboard')
  const [stats,  setStats]  = useState(null)
  const [gaps,   setGaps]   = useState([])
  const [convs,  setConvs]  = useState([])
  const [loading,setLoading]= useState(true)

  useEffect(() => {
    if (!bot) { setLoading(false); return }
    Promise.all([
      getBotStats(bot.id),
      getKnowledgeGaps(bot.id),
      getConversations(bot.id),
    ]).then(([s, g, c]) => {
      setStats(s); setGaps(g); setConvs(c)
    }).catch(console.error).finally(() => setLoading(false))
  }, [bot?.id])

  const shareUrl = bot ? `${window.location.origin}?bot=${bot.id}` : ''

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
      {loading ? (
        <div className="flex ic jc" style={{ height: 'calc(100vh - 54px)', gap: 8 }}>
          <Spinner size={20} color="var(--coffee-3)" />
          <span style={{ color: 'var(--ink3)', fontSize: 13 }}>Loading…</span>
        </div>
      ) : (
        <>
          {page === 'dashboard' && <DashPage bot={bot} stats={stats} convs={convs} gaps={gaps} shareUrl={shareUrl} onEdit={onEditBot} />}
          {page === 'inbox'     && <InboxPage bot={bot} gaps={gaps} setGaps={setGaps} />}
          {page === 'insights'  && <InsightsPage bot={bot} convs={convs} />}
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
      <div className="stat-grid mb-24">
        {[
          { label: 'Total conversations', num: stats?.totalConversations ?? 0 },
          { label: 'Unique users',        num: stats?.uniqueUsers ?? 0 },
          { label: 'This week',           num: stats?.conversationsThisWeek ?? 0 },
          { label: 'Inbox items',         num: (stats?.unresolvedGaps ?? 0) + (stats?.unresolvedFeedback ?? 0) },
        ].map((s, i) => (
          <div key={i} className={`stat-card fade-up d${i+1}`}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-num">{s.num}</div>
          </div>
        ))}
      </div>

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
                <div key={i} style={{ padding: '10px 20px', borderBottom: i < Math.min(gaps.length-1, 4) ? '1px solid var(--line)' : 'none' }}>
                  <div style={{ fontSize: 13, color: 'var(--ink)', marginBottom: 2, lineHeight: 1.5 }}>"{g.question.slice(0, 60)}{g.question.length > 60 ? '…' : ''}"</div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink4)' }}>{new Date(g.created_at).toLocaleDateString('en-NZ', { day:'numeric', month:'short' })}</div>
                </div>
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
      await supabase.from('knowledge_gaps').update({
        admin_answer: answer.trim(),
        resolved: true,
        added_to_kb: true,
        resolved_at: new Date().toISOString(),
      }).eq('id', gap.id)

      // Add to knowledge base
      const newKb = (bot.knowledge_text || '') + `\n\nQ: ${gap.question}\nA: ${answer.trim()}`
      await supabase.from('bots').update({ knowledge_text: newKb, updated_at: new Date().toISOString() }).eq('id', bot.id)

      setGaps(p => p.filter(g => g.id !== gap.id))
      setSelected(null)
      setAnswer('')
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
                <div style={{ padding: '10px 14px', background: 'var(--surface2)', border: '1px solid var(--line)', borderRadius: 'var(--r)', marginBottom: 14, fontSize: 13.5, color: 'var(--ink)', lineHeight: 1.6, fontStyle: 'italic' }}>
                  "{selected.question}"
                </div>
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

// ── Insights page ─────────────────────────────────────────────────────────────
function InsightsPage({ bot, convs }) {
  if (!bot) return <EmptyBot label="Insights" />
  return (
    <div className="page fade-up">
      <div className="mb-28">
        <h1 className="page-title">Insights</h1>
        <p className="page-sub">AI-generated insights from your conversation history. Coming in Layer 4.</p>
      </div>
      <div className="card">
        <div className="empty">
          <div className="empty-icon">📊</div>
          <div className="empty-title">Insights coming soon</div>
          <div className="empty-sub">Once you have conversations, AI will analyse what users are asking, what the bot is doing well, and where your knowledge base has gaps.</div>
        </div>
      </div>
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
