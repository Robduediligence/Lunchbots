import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import { I, Spinner } from '../components/UI.jsx'

const ADMIN_PW = 'admin'  // ← change this via Settings

export default function AdminView() {
  const [authed, setAuthed] = useState(false)
  const [pw,     setPw]     = useState('')
  const [err,    setErr]    = useState('')
  const [tab,    setTab]    = useState('overview')
  const [data,   setData]   = useState({ subs:[], bots:[], gaps:[] })
  const [loading,setLoading]= useState(false)

  async function loadData() {
    setLoading(true)
    try {
      const [subsRes, botsRes, gapsRes] = await Promise.all([
        supabase.from('subscribers').select('*').order('created_at', { ascending:false }),
        supabase.from('bots').select('*').order('created_at', { ascending:false }),
        supabase.from('knowledge_gaps').select('*').eq('resolved', false),
      ])
      setData({ subs: subsRes.data||[], bots: botsRes.data||[], gaps: gapsRes.data||[] })
    } catch(e) { console.error(e) }
    setLoading(false)
  }

  function login() {
    if (pw === ADMIN_PW) { setAuthed(true); loadData() }
    else { setErr('Incorrect password.'); setPw('') }
  }

  async function toggleSub(id, active) {
    await supabase.from('subscribers').update({ active:!active }).eq('id', id)
    setData(p => ({ ...p, subs: p.subs.map(s => s.id===id ? {...s, active:!active} : s) }))
  }

  if (!authed) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'var(--parch-1)', padding:24 }}>
        <div style={{ background:'var(--surface)', border:'1px solid var(--line)', borderRadius:'var(--r-xl)', padding:'40px 36px', width:'100%', maxWidth:380, boxShadow:'var(--shadow-lg)' }} className="fade-up">
          <div style={{ fontSize:28, marginBottom:12 }}>☕</div>
          <h2 className="serif mb-4" style={{ fontSize:'1.3rem', color:'var(--coffee-0)' }}>Admin Access</h2>
          <p style={{ fontSize:13, color:'var(--ink4)', marginBottom:24 }}>Restricted. Authorised personnel only.</p>
          {err && <div className="alert alert-error mb-16">{err}</div>}
          <div className="field">
            <label className="label">Password</label>
            <input className="input" type="password" placeholder="••••••••" value={pw}
              onChange={e => setPw(e.target.value)}
              onKeyDown={e => e.key==='Enter' && login()} />
          </div>
          <button className="btn btn-primary btn-full" onClick={login}>Enter</button>
        </div>
      </div>
    )
  }

  const activeSubs = data.subs.filter(s => s.active).length

  return (
    <div className="app">
      <nav className="topnav">
        <div className="topnav-logo"><img src="/Bot_Brunch_Logo.png" alt="Bot Brunch" style={{ height: 40 }} /></div>
        <div className="topnav-pill">
          {['overview','subscribers','bots'].map(t => (
            <button key={t} className={`pill-item ${tab===t?'active':''}`} onClick={() => setTab(t)} style={{ textTransform:'capitalize' }}>{t}</button>
          ))}
        </div>
        <span style={{ fontSize:11, color:'var(--warn)', fontWeight:600, padding:'3px 10px', background:'var(--warn-bg)', borderRadius:20 }}>Admin</span>
      </nav>

      {loading ? (
        <div className="flex ic jc" style={{ height:'calc(100vh - 54px)', gap:8 }}>
          <Spinner size={20} color="var(--coffee-3)" />
        </div>
      ) : (
        <>
          {tab==='overview' && (
            <div className="page fade-up">
              <div className="mb-24">
                <h1 className="page-title">Platform <em>Overview</em></h1>
                <p className="page-sub">Real-time stats across all subscribers and bots.</p>
              </div>
              <div className="stat-grid mb-24">
                {[
                  { label:'Total subscribers', num:data.subs.length },
                  { label:'Active',             num:activeSubs },
                  { label:'Total bots',         num:data.bots.length },
                  { label:'Unresolved gaps',    num:data.gaps.length },
                ].map((s,i) => (
                  <div key={i} className="stat-card">
                    <div className="stat-label">{s.label}</div>
                    <div className="stat-num">{s.num}</div>
                  </div>
                ))}
              </div>
              <div className="card">
                <div className="card-head"><div className="card-title">Recent subscribers</div></div>
                <SubTable subs={data.subs.slice(0,8)} bots={data.bots} onToggle={toggleSub} />
              </div>
            </div>
          )}

          {tab==='subscribers' && (
            <div className="page-wide fade-up">
              <div className="mb-24">
                <h1 className="page-title">Subscribers</h1>
                <p className="page-sub">{data.subs.length} total · {activeSubs} active</p>
              </div>
              <div className="card">
                <SubTable subs={data.subs} bots={data.bots} onToggle={toggleSub} />
              </div>
            </div>
          )}

          {tab==='bots' && (
            <div className="page-wide fade-up">
              <div className="mb-24">
                <h1 className="page-title">All Bots</h1>
                <p className="page-sub">{data.bots.length} bots across all subscribers</p>
              </div>
              <div className="card">
                {data.bots.length === 0 ? (
                  <div className="empty"><div className="empty-icon">🤖</div><div className="empty-title">No bots yet</div><div className="empty-sub">Bots appear here once subscribers complete setup.</div></div>
                ) : (
                  <table className="tbl">
                    <thead><tr><th>Bot name</th><th>Owner</th><th>Knowledge</th><th>Published</th></tr></thead>
                    <tbody>
                      {data.bots.map(bot => {
                        const owner = data.subs.find(s => s.id === bot.owner_id)
                        return (
                          <tr key={bot.id}>
                            <td>
                              <div className="flex ic g10">
                                <div style={{ width:26, height:26, borderRadius:6, background:bot.primary_color||'var(--coffee-0)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:11, fontWeight:700, flexShrink:0 }}>{bot.name?.charAt(0)}</div>
                                <div>
                                  <div style={{ fontWeight:500 }}>{bot.name}</div>
                                  {bot.descriptor && <div style={{ fontSize:11.5, color:'var(--ink4)' }}>{bot.descriptor}</div>}
                                </div>
                              </div>
                            </td>
                            <td style={{ fontSize:12.5, color:'var(--ink3)' }}>{owner?.email || '—'}</td>
                            <td style={{ fontSize:12.5, color:'var(--ink3)' }}>{bot.knowledge_text ? `${bot.knowledge_text.split(/\s+/).filter(Boolean).length.toLocaleString()} words` : '—'}</td>
                            <td><span className={`badge ${bot.published?'badge-green':'badge-gray'}`}>{bot.published?'Live':'Draft'}</span></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function SubTable({ subs, bots, onToggle }) {
  if (subs.length === 0) return (
    <div className="empty"><div className="empty-icon">👥</div><div className="empty-title">No subscribers yet</div></div>
  )
  return (
    <table className="tbl">
      <thead><tr><th>Email</th><th>Business</th><th>Joined</th><th>Bot</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>
        {subs.map(sub => {
          const bot = bots.find(b => b.owner_id === sub.id)
          return (
            <tr key={sub.id}>
              <td style={{ fontWeight:500 }}>{sub.email}</td>
              <td style={{ fontSize:12.5, color:'var(--ink3)' }}>{sub.business_name || '—'}</td>
              <td style={{ fontSize:12, color:'var(--ink4)' }}>{new Date(sub.created_at).toLocaleDateString('en-NZ', { day:'numeric', month:'short', year:'numeric' })}</td>
              <td>{bot ? <span className="badge badge-coffee">{bot.name}</span> : <span style={{ fontSize:12, color:'var(--ink4)' }}>None</span>}</td>
              <td><span className={`badge ${sub.active?'badge-green':'badge-red'}`}>{sub.active?'Active':'Inactive'}</span></td>
              <td>
                <button className={`btn btn-xs ${sub.active?'btn-danger':''}`}
                  style={!sub.active?{background:'var(--success-bg)',color:'var(--success)',border:'1px solid rgba(45,106,79,0.15)'}:{}}
                  onClick={() => onToggle(sub.id, sub.active)}>
                  {sub.active?'Disable':'Enable'}
                </button>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
