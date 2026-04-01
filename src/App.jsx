import { useState, useEffect } from 'react'
import { supabase, getSession, ensureSubscriber, getBotByOwner, getBotsByOwner } from './lib/supabase.js'
import AuthView      from './views/AuthView.jsx'
import WizardView    from './views/WizardView.jsx'
import DashboardView from './views/DashboardView.jsx'
import ChatView      from './views/ChatView.jsx'
import AdminView     from './views/AdminView.jsx'

export default function App() {
  const [route,   setRoute]   = useState(null)
  const [user,    setUser]    = useState(null)
  const [sub,     setSub]     = useState(null)
  const [bot,     setBot]     = useState(null)
  const [editing, setEditing] = useState(false)
  const [bots,    setBots]    = useState([])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const botId  = params.get('bot')
    const mode   = params.get('mode')
    
if (mode === 'admin') { setRoute('admin'); return }
    if (botId)            { setRoute({ type:'chat', botId }); return }
    if (params.get('signup') === 'true') { setRoute('auth'); return }
    // Wake up Supabase immediately in background
    supabase.from('bots').select('id').limit(1).then(() => {})

    // Check for cached session synchronously
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) { setRoute('auth'); return }
      setUser(session.user)
      const [s, b, allBots] = await Promise.all([
        ensureSubscriber(session.user.id, session.user.email),
        getBotByOwner(session.user.id),
        getBotsByOwner(session.user.id),
      ])
      setSub(s)
      setBot(b)
      setBots(allBots)
      setRoute('dashboard')
    }).catch(() => setRoute('auth'))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setUser(null); setSub(null); setBot(null); setBots([]); setRoute('auth')
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleAuth(user, sub) {
    setUser(user)
    setSub(sub)
    const [b, allBots] = await Promise.all([
      getBotByOwner(user.id),
      getBotsByOwner(user.id),
    ])
    setBot(b)
    setBots(allBots)
    setRoute('dashboard')
    const plan = new URLSearchParams(window.location.search).get('plan')
    if (plan) {
      const { startCheckout } = await import('./lib/supabase.js')
      startCheckout(plan)
    }
  }

  async function handleLogout() {
    const { signOut } = await import('./lib/supabase.js')
    await signOut()
    setUser(null); setSub(null); setBot(null); setBots([]); setRoute('auth')
  }

  function handleEditBot(botToEdit) { setEditing(true); setBot(botToEdit); setRoute('wizard') }

  async function handleWizardDone(savedBot) {
    setBot(savedBot)
    setEditing(false)
    // Update localStorage cache and initialBots so dashboard shows fresh data instantly
    try {
      const cached = JSON.parse(localStorage.getItem('lb_bots') || '[]')
      const updated = cached.some(b => b.id === savedBot.id)
        ? cached.map(b => b.id === savedBot.id ? savedBot : b)
        : [...cached, savedBot]
      localStorage.setItem('lb_bots', JSON.stringify(updated))
      setBots(updated)
    } catch(e) {}
    setRoute('dashboard')
  }

  if (route === null) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--parch-1)', gap:6 }}>
      {[0,1,2].map(i => (
        <div key={i} style={{ width:8, height:8, borderRadius:'50%', background:'var(--coffee-3)', animation:'blink 1.2s infinite', animationDelay:`${i*0.2}s` }} />
      ))}
    </div>
  )

  if (route === 'admin')       return <AdminView />
  if (route?.type === 'chat')  return <ChatView botId={route.botId} />
  if (route === 'auth')        return <AuthView onAuth={handleAuth} />

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
      initialBots={bots}
      onEditBot={handleEditBot}
      onLogout={handleLogout}
    />
  )

  return null
}