import { useState } from 'react'
import { signUp, signIn, ensureSubscriber } from '../lib/supabase.js'
import { Spinner } from '../components/UI.jsx'

export default function AuthView({ onAuth }) {
  const [mode,    setMode]    = useState('choice')
  const [email,   setEmail]   = useState('')
  const [pw,      setPw]      = useState('')
  const [pw2,     setPw2]     = useState('')
  const [biz,     setBiz]     = useState('')
  const [err,     setErr]     = useState('')
  const [loading, setLoading] = useState(false)
  const [done,    setDone]    = useState(false) // email verify sent

  async function handleRegister() {
    setErr('')
    if (!email.trim() || !pw) return setErr('Email and password are required.')
    if (pw.length < 6)        return setErr('Password must be at least 6 characters.')
    if (pw !== pw2)           return setErr('Passwords do not match.')
    setLoading(true)
    try {
      const data = await signUp(email.trim(), pw)
      if (data.user) {
        await ensureSubscriber(data.user.id, email.trim(), biz.trim())
      }
      setDone(true)
    } catch (e) {
      setErr(e.message || 'Registration failed. Please try again.')
    }
    setLoading(false)
  }

  async function handleLogin() {
    setErr('')
    if (!email.trim() || !pw) return setErr('Email and password are required.')
    setLoading(true)
    try {
      const data = await signIn(email.trim(), pw)
      const sub  = await ensureSubscriber(data.user.id, data.user.email)
      onAuth(data.user, sub)
    } catch (e) {
      setErr(e.message || 'Sign in failed. Please check your details.')
    }
    setLoading(false)
  }

  if (done) {
    return (
      <div className="auth-wrap">
        <div className="auth-card fade-up tc">
          <div style={{ fontSize: 32, marginBottom: 16 }}>☕</div>
          <h2 className="serif mb-8" style={{ fontSize: '1.4rem', color: 'var(--coffee-0)' }}>Check your inbox</h2>
          <p style={{ fontSize: 13.5, color: 'var(--ink3)', lineHeight: 1.7, marginBottom: 24 }}>
            We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then come back here to sign in.
          </p>
          <button className="btn btn-secondary w100" onClick={() => { setMode('login'); setDone(false) }}>
            Back to sign in
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-wrap">
      {mode === 'choice' && (
        <div className="auth-card fade-up tc">
          <div style={{ fontSize: 36, marginBottom: 12 }}>🥪</div>
          <h1 className="serif mb-8" style={{ fontSize: '1.8rem', fontWeight: 600, color: 'var(--coffee-0)', letterSpacing: -0.3 }}>
            Lunch Bots
          </h1>
          <p style={{ fontSize: 13.5, color: 'var(--ink3)', lineHeight: 1.7, marginBottom: 28, maxWidth: 280, margin: '0 auto 28px' }}>
            Turn your knowledge into a branded AI assistant. Share it with your customers in minutes.
          </p>
          <div className="flex col g8">
            <button className="btn btn-primary btn-full btn-lg" onClick={() => setMode('register')}>
              Create my account
            </button>
            <button className="btn btn-ghost btn-full" onClick={() => setMode('login')}
              style={{ color: 'var(--ink3)', fontSize: 13 }}>
              I already have an account
            </button>
          </div>
        </div>
      )}

      {(mode === 'register' || mode === 'login') && (
        <div className="auth-card fade-up">
          <div className="mb-24">
            <div style={{ fontSize: 22, marginBottom: 6 }}>☕</div>
            <h2 className="serif mb-4" style={{ fontSize: '1.3rem', color: 'var(--coffee-0)' }}>
              {mode === 'register' ? 'Create your account' : 'Welcome back'}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--ink4)' }}>
              {mode === 'register' ? 'Ready to launch your AI assistant?' : 'Sign in to your dashboard.'}
            </p>
          </div>

          {err && <div className="alert alert-error mb-16">{err}</div>}

          {mode === 'register' && (
            <div className="field">
              <label className="label">Business name <span style={{ color: 'var(--ink4)', fontWeight: 400 }}>(optional)</span></label>
              <input className="input" placeholder="Your business or brand name" value={biz}
                onChange={e => setBiz(e.target.value)} />
            </div>
          )}

          <div className="field">
            <label className="label">Email address</label>
            <input className="input" type="email" placeholder="you@example.com" value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (mode === 'register' ? handleRegister() : handleLogin())} />
          </div>

          <div className="field">
            <label className="label">Password</label>
            <input className="input" type="password" placeholder="••••••••" value={pw}
              onChange={e => setPw(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (mode === 'register' ? handleRegister() : handleLogin())} />
          </div>

          {mode === 'register' && (
            <div className="field">
              <label className="label">Confirm password</label>
              <input className="input" type="password" placeholder="••••••••" value={pw2}
                onChange={e => setPw2(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleRegister()} />
            </div>
          )}

          <button className="btn btn-primary btn-full btn-lg mt-8"
            disabled={loading}
            onClick={mode === 'register' ? handleRegister : handleLogin}>
            {loading
              ? <Spinner size={16} color="var(--parch-1)" />
              : mode === 'register' ? 'Create account →' : 'Sign in →'}
          </button>

          <div className="tc mt-16">
            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--ink4)', fontSize: 12 }}
              onClick={() => { setMode(mode === 'register' ? 'login' : 'register'); setErr('') }}>
              {mode === 'register' ? 'Already have an account? Sign in' : 'Need an account? Register'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
