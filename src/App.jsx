import { useState, useEffect } from 'react'
import { supabase, getSession, ensureSubscriber, getBotByOwner, getBotsByOwner } from './lib/supabase.js'
import AuthView      from './views/AuthView.jsx'
import WizardView    from './views/WizardView.jsx'
import DashboardView from './views/DashboardView.jsx'
import ChatView      from './views/ChatView.jsx'
import AdminView     from './views/AdminView.jsx'

export default function App() {
  const [route,   setRoute]   = useState(null) // null=loading
  const [user,    setUser]    = useState(null)
  const [sub,     setSub]     = useState(null)
  const [bot,     setBot]     = useState(null)
  const [editing, setEditing] = useState(false)

  // Check URL params first
  useEffect(() => {
    const params      = new URLSearchParams(window.location.search)
  const botId       = params.get('bot')
  const mode        = params.get('mode')
  const activePage  = params.get('page')
  const activeBotId = params.get('activeBotId')
  if (mode === 'admin') { setRoute('admin'); return }
  if (botId)            { setRoute({ type:'chat', botId }); return }
  if (activePage || activeBotId) { setRoute({ type:'dashboard', activePage, activeBotId }); return }
    // Check Supabase session
    getSession().then(async session => {
      if (session?.user) {
        setUser(session.user)
        const s = await ensureSubscriber(session.user.id, session.user.email)
        setSub(s)
        const b = await getBotByOwner(session.user.id)
        setBot(b)
        setRoute('dashboard')
      } else {
        setRoute('auth')
      }
    }).catch(() => setRoute('auth'))

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null); setSub(null); setBot(null); setRoute('auth')
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleAuth(user, sub) {
    setUser(user)
    setSub(sub)
    const b = await getBotByOwner(user.id)
    setBot(b)
    setRoute('dashboard')
  }

  async function refreshBots() {
    const b = await getBotByOwner(user.id)
    setBot(b)
  }

  async function handleLogout() {
    const { signOut } = await import('./lib/supabase.js')
    await signOut()
    setUser(null); setSub(null); setBot(null); setRoute('auth')
  }

  function handleEditBot(botToEdit) { setEditing(true); setBot(botToEdit); setRoute('wizard') }

  async function handleWizardDone(savedBot) {
    setBot(savedBot)
    setEditing(false)
    setRoute('dashboard')
  }

  // Loading state
  if (route === null) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--parch-1)', gap:6 }}>
      {[0,1,2].map(i => (
        <div key={i} style={{ width:8, height:8, borderRadius:'50%', background:'var(--coffee-3)', animation:'blink 1.2s infinite', animationDelay:`${i*0.2}s` }} />
      ))}
    </div>
  )

  if (route === 'admin') return <AdminView />

  if (route?.type === 'chat') return <ChatView botId={route.botId} />

  if (route === 'auth') return <AuthView onAuth={handleAuth} />

  if (route === 'wizard') return (
    <WizardView
      user={user}
      sub={sub}
      existingBot={editing ? bot : null}
      onDone={handleWizardDone}
    />
  )

  if (route === 'dashboard') return (
    <DashboardView
      user={user}
      sub={sub}
      bot={bot}
      onEditBot={handleEditBot}
      onLogout={handleLogout}
      initialPage={route?.activePage}
      initialBotId={route?.activeBotId}
    />
  )

  return null
}
