import { useState, useRef, useEffect } from 'react'
import { saveBot, callClaude, buildBotSystem, renderMarkdown } from '../lib/supabase.js'
import { ActiveChat } from './ChatView.jsx'

// Preload fonts whenever bot changes
function usePreloadFonts(bot) {
  useEffect(() => {
    if (bot.body_font) loadGoogleFont(bot.body_font)
    if (bot.title_font) loadGoogleFont(bot.title_font)
    if (bot.resource_font) loadGoogleFont(bot.resource_font)
  }, [bot.body_font, bot.title_font, bot.resource_font])
}
import { I, Spinner } from '../components/UI.jsx'

// ── Constants ─────────────────────────────────────────────────────────────────
const STEPS = [
  { id: 'usecase',      label: 'Use Case' },
  { id: 'identity',     label: 'Identity' },
  { id: 'knowledge',    label: 'Knowledge' },
  { id: 'capabilities', label: 'Capabilities' },
  { id: 'branding',     label: 'Branding' },
  { id: 'personality',  label: 'Personality' },
  { id: 'test',         label: 'Test' },
  { id: 'publish',      label: 'Publish' },
]

const USE_CASES = [
  { id: 'support',    label: 'Support Bot',           desc: 'Answer customer questions, resolve issues, reduce support load.' },
  { id: 'sales',      label: 'Sales Bot',             desc: 'Qualify leads, explain offerings, guide towards a conversation.' },
  { id: 'onboarding', label: 'Onboarding Bot',        desc: 'Guide new customers or team members through getting started.' },
  { id: 'knowledge',  label: 'Internal Knowledge Bot',desc: 'Give your team instant access to SOPs, policies, and processes.' },
  { id: 'training',   label: 'Training & Education',  desc: 'Deliver course material, answer student questions, reinforce learning.' },
  { id: 'intake',     label: 'Intake & Triage Bot',   desc: 'Collect information, qualify requests, route to the right person.' },
]

const KB_TYPES_CUSTOMER = [
  { id: 'products',   label: 'Products / Services',       color: '#2563EB', hint: 'What you sell, descriptions, options, variations' },
  { id: 'pricing',    label: 'Pricing & Payments',        color: '#7C3AED', hint: 'Prices, payment methods, fees, refund rules' },
  { id: 'ordering',   label: 'Ordering / Booking',        color: '#059669', hint: 'How to order, scheduling, availability, lead times' },
  { id: 'delivery',   label: 'Delivery / Pickup / Process', color: '#0891B2', hint: 'What happens after ordering, timelines, locations' },
  { id: 'policies',   label: 'Policies',                  color: '#D97706', hint: 'Refunds, cancellations, returns, guarantees' },
  { id: 'support',    label: 'Contact & Support',         color: '#DC2626', hint: 'Contact methods, hours, escalation' },
  { id: 'faq',        label: 'FAQs',                      color: '#4B5563', hint: 'Common quick-answer questions' },
]

const KB_TYPES_INTERNAL = [
  { id: 'sop',          label: 'SOPs',                      color: '#2563EB', hint: 'Step-by-step processes, workflows, checklists' },
  { id: 'policies',     label: 'Policies & Rules',          color: '#7C3AED', hint: 'HR rules, leave, conduct, compliance, privacy' },
  { id: 'training',     label: 'Training & Onboarding',     color: '#059669', hint: 'Training guides, tutorials, orientation checklists' },
  { id: 'troubleshoot', label: 'Troubleshooting',           color: '#DC2626', hint: 'Common problems, fixes, diagnostics, workarounds' },
  { id: 'product',      label: 'Product / Service Info',    color: '#0891B2', hint: 'Specs, ingredients, pricing rules, substitutions' },
  { id: 'updates',      label: 'Updates & Announcements',   color: '#D97706', hint: 'New info, changes, alerts, temporary instructions' },
  { id: 'hr',           label: 'HR & Employee Info',        color: '#059669', hint: 'Benefits, payroll, leave processes, rights' },
  { id: 'safety',       label: 'Safety & Emergency',        color: '#DC2626', hint: 'Emergency plans, incident response, evacuation' },
  { id: 'tools',        label: 'Tools & Systems',           color: '#4B5563', hint: 'Software guides, login info, equipment instructions' },
]

// Keep a combined reference for rendering badges anywhere
const KB_TYPES = [...KB_TYPES_CUSTOMER, ...KB_TYPES_INTERNAL]

const PRIORITY_LEVELS = [
  { id: 'primary',    label: 'Primary',    desc: 'Always check first' },
  { id: 'secondary',  label: 'Secondary',  desc: 'Use if primary has no answer' },
  { id: 'background', label: 'Background', desc: 'Context only' },
]

// 50 Google Fonts
const FONTS = [
  { label: 'Inter',             value: "'Inter', sans-serif" },
  { label: 'Roboto',            value: "'Roboto', sans-serif" },
  { label: 'Open Sans',         value: "'Open Sans', sans-serif" },
  { label: 'Lato',              value: "'Lato', sans-serif" },
  { label: 'Poppins',           value: "'Poppins', sans-serif" },
  { label: 'Montserrat',        value: "'Montserrat', sans-serif" },
  { label: 'Raleway',           value: "'Raleway', sans-serif" },
  { label: 'Nunito',            value: "'Nunito', sans-serif" },
  { label: 'DM Sans',           value: "'DM Sans', sans-serif" },
  { label: 'Outfit',            value: "'Outfit', sans-serif" },
  { label: 'Plus Jakarta Sans', value: "'Plus Jakarta Sans', sans-serif" },
  { label: 'Figtree',           value: "'Figtree', sans-serif" },
  { label: 'Manrope',           value: "'Manrope', sans-serif" },
  { label: 'Sora',              value: "'Sora', sans-serif" },
  { label: 'Work Sans',         value: "'Work Sans', sans-serif" },
  { label: 'Karla',             value: "'Karla', sans-serif" },
  { label: 'Mulish',            value: "'Mulish', sans-serif" },
  { label: 'Jost',              value: "'Jost', sans-serif" },
  { label: 'Urbanist',          value: "'Urbanist', sans-serif" },
  { label: 'Cabin',             value: "'Cabin', sans-serif" },
  { label: 'Source Sans 3',     value: "'Source Sans 3', sans-serif" },
  { label: 'Noto Sans',         value: "'Noto Sans', sans-serif" },
  { label: 'Rubik',             value: "'Rubik', sans-serif" },
  { label: 'IBM Plex Sans',     value: "'IBM Plex Sans', sans-serif" },
  { label: 'Lexend',            value: "'Lexend', sans-serif" },
  { label: 'Playfair Display',  value: "'Playfair Display', serif" },
  { label: 'Lora',              value: "'Lora', serif" },
  { label: 'Merriweather',      value: "'Merriweather', serif" },
  { label: 'Georgia',           value: "Georgia, serif" },
  { label: 'Cormorant',         value: "'Cormorant', serif" },
  { label: 'EB Garamond',       value: "'EB Garamond', serif" },
  { label: 'Libre Baskerville', value: "'Libre Baskerville', serif" },
  { label: 'Crimson Pro',       value: "'Crimson Pro', serif" },
  { label: 'Source Serif 4',    value: "'Source Serif 4', serif" },
  { label: 'Spectral',          value: "'Spectral', serif" },
  { label: 'DM Serif Display',  value: "'DM Serif Display', serif" },
  { label: 'Fraunces',          value: "'Fraunces', serif" },
  { label: 'Abril Fatface',     value: "'Abril Fatface', serif" },
  { label: 'Space Grotesk',     value: "'Space Grotesk', sans-serif" },
  { label: 'Josefin Sans',      value: "'Josefin Sans', sans-serif" },
  { label: 'Quicksand',         value: "'Quicksand', sans-serif" },
  { label: 'Nunito Sans',       value: "'Nunito Sans', sans-serif" },
  { label: 'Hind',              value: "'Hind', sans-serif" },
  { label: 'Barlow',            value: "'Barlow', sans-serif" },
  { label: 'Exo 2',             value: "'Exo 2', sans-serif" },
  { label: 'Oxanium',           value: "'Oxanium', sans-serif" },
  { label: 'Unbounded',         value: "'Unbounded', sans-serif" },
  { label: 'Bebas Neue',        value: "'Bebas Neue', sans-serif" },
  { label: 'IBM Plex Mono',     value: "'IBM Plex Mono', monospace" },
  { label: 'Space Mono',        value: "'Space Mono', monospace" },
]

const OVERLAYS = [
  { id: 'none',    label: 'None' },
  { id: 'grain',   label: 'Film Grain' },
  { id: 'sand',    label: 'Sand' },
  { id: 'rock',    label: 'Rock' },
  { id: 'linen',   label: 'Linen' },
  { id: 'vintage', label: 'Vintage' },
  { id: 'flare',   label: 'Light Flare' },
  { id: 'vignette',label: 'Vignette' },
]

const IMAGE_EFFECTS = [
  { id: 'none',  label: 'None' },
  { id: 'blur',  label: 'Blur' },
  { id: 'frost', label: 'Frost' },
]

const BOT_DEFAULTS = {
  use_case: '',
  name: '', descriptor: '', greeting: '', welcome_message: '',
  knowledge_entries: [],
  knowledge_text: '',
  allow_web: false, allow_broad_ai: false, strict_kb_only: true,
  fallback_message: "I don't have that information yet. I've flagged your question for the team.",
  tone: 'professional', response_length: 'balanced', initiative: 'reactive',
  writing_style: 'conversational', emoji_use: 'none',
  // Branding
  primary_color: '#2C1810', secondary_color: '#F5F0E8',
  title_font: "'Playfair Display', serif",
  body_font: "'Inter', sans-serif",
  resource_font: "'Lora', serif",
  font_size: 14,
  border_radius: 12,
  bubble_style: 'filled',
  bg_color: '#F5F0E8',
  bg_overlay: 40,
  bg_image_url: null,
  texture_overlay: 'none',
  texture_intensity: 40,
  image_effect: 'none',
  image_effect_intensity: 40,
  // Layout controls
  header_height: 60,
  chat_width: 100,
  spacing: 14,
  text_opacity: 100,
  panel_opacity: 100,
  logo_size: 28,
  button_style: 'filled',
  avatar_letter: '',
  logo_url: null,
  avatar_url: null,
  suggested_prompts: ['', '', '', ''],
  categories: [],
}

// ── Use-case personality presets ──────────────────────────────────────────────
const USE_CASE_PRESETS = {
  support:    { tone: 'warm',         writing_style: 'support',       initiative: 'followup',  response_length: 'balanced' },
  sales:      { tone: 'consultative', writing_style: 'conversational',initiative: 'proactive', response_length: 'balanced' },
  onboarding: { tone: 'warm',         writing_style: 'educational',   initiative: 'proactive', response_length: 'detailed' },
  knowledge:  { tone: 'direct',       writing_style: 'polished',      initiative: 'reactive',  response_length: 'detailed' },
  training:   { tone: 'educational',  writing_style: 'educational',   initiative: 'proactive', response_length: 'detailed' },
  intake:     { tone: 'professional', writing_style: 'conversational',initiative: 'proactive', response_length: 'short' },
}

// ── Google Fonts loader ───────────────────────────────────────────────────────
function loadGoogleFont(fontValue) {
  const name = fontValue.replace(/['"]/g,'').split(',')[0].trim()
  const safe = ['Georgia','monospace','sans-serif','serif']
  if (safe.includes(name)) return
  const id = `gf-${name.replace(/\s/g,'-')}`
  if (document.getElementById(id)) return
  const link = document.createElement('link')
  link.id = id; link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(name)}:wght@300;400;500;600;700&display=swap`
  document.head.appendChild(link)
}

// ── Overlay CSS ───────────────────────────────────────────────────────────────
function getOverlayStyle(type, intensity = 40) {
  const base = { position:'absolute', inset:0, pointerEvents:'none', zIndex:1 }
  const op = intensity / 100
  switch(type) {
    case 'grain':
      return { ...base, backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`, opacity:op }
    case 'flare':
      return { ...base, background:`radial-gradient(ellipse at 20% 20%, rgba(255,240,200,${op*0.6}) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(255,220,180,${op*0.4}) 0%, transparent 40%)` }
    case 'sand':
      return { ...base, backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`, opacity:op, background:`rgba(210,180,140,${op*0.2})` }
    case 'rock':
      return { ...base, backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='turbulence' baseFrequency='0.4' numOctaves='5'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`, opacity:op }
    case 'vintage':
      return { ...base, background:`radial-gradient(ellipse at center, transparent 30%, rgba(60,30,10,${op*0.5}) 100%)`, backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.3'/%3E%3C/svg%3E")` }
    case 'linen':
      return { ...base, backgroundImage:`repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(180,150,100,${op*0.15}) 2px, rgba(180,150,100,${op*0.15}) 4px), repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(180,150,100,${op*0.15}) 2px, rgba(180,150,100,${op*0.15}) 4px)` }
    case 'blur':
      return { ...base, backdropFilter:`blur(${op*8}px)` }
    case 'vignette':
      return { ...base, background:`radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,${op*0.7}) 100%)` }
    case 'frost':
      return { ...base, backdropFilter:`blur(${op*4}px) brightness(1.1)`, background:`rgba(255,255,255,${op*0.15})` }
    default:
      return null
  }
}

// ── Main Wizard ───────────────────────────────────────────────────────────────
export default function WizardView({ user, sub, existingBot, onDone }) {
  const [bot,     setBot]     = useState(existingBot ? { ...BOT_DEFAULTS, ...existingBot } : { ...BOT_DEFAULTS, owner_id: sub.id })
  const [step,    setStep]    = useState(0)
  const [maxStep, setMaxStep] = useState(7)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')

  const f = (k, v) => setBot(p => ({ ...p, [k]: v }))
  const scrollRef = useRef(null)
  usePreloadFonts(bot)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.width = '100%'
    const el = scrollRef.current
    const allowScroll = e => e.stopPropagation()
    if (el) el.addEventListener('touchmove', allowScroll, { passive: true })
    return () => {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
      if (el) el.removeEventListener('touchmove', allowScroll)
    }
  }, [])

  const canNext = step === 0 ? !!bot.use_case
    : step === 1 ? bot.name.trim().length > 0
    : true

  function next() {
    if (step < 7) {
      const n = step + 1
      setStep(n)
      setMaxStep(p => Math.max(p, n))
    }
  }
  function back() { if (step > 0) setStep(s => s - 1) }

  async function handleSave() {
    try {
      const saved = await saveBot({ ...bot, owner_id: sub.id })
      setBot(p => ({ ...p, id: saved.id }))
    } catch (e) { setError(e.message) }
  }

  async function handlePublish() {
    setSaving(true); setError('')
    try {
      
      const saved = await saveBot({
        ...bot, owner_id: sub.id,
        published: true, published_at: new Date().toISOString()
      })
      
      onDone(saved)
    } catch (e) { 
      console.error('PUBLISH ERROR:', e)
      setError(e.message) 
    }
    setSaving(false)
  }

  const progress = ((step + 1) / STEPS.length) * 100

  return (
    <div className="wizard-mobile-wrap" style={{ display:'flex', height:'100vh', background:'var(--bg)', overflow:'hidden', position:'fixed', width:'100%', top:0, left:0, overscrollBehavior:'none' }}>

      {/* ── Left: full content area ── */}
      <div className="wizard-mobile-left" style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, overflow:'hidden' }}>

        {/* Top bar */}
        <div className="wizard-topbar" style={{ height:52, borderBottom:'1px solid var(--line)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 16px', background:'var(--surface)', flexShrink:0 }}>
          <div className="flex ic g8">
            <img src="/bot_brunch_logo_transparent.png" alt="Bot Brunch" style={{ height: 28 }} />
            {bot.name && <span style={{ fontSize:12, fontWeight:500, color:'var(--ink3)' }}>{bot.name}</span>}
          </div>
          <div className="flex ic g8">
            <button onClick={handleSave}
              style={{ background:'none', border:'none', cursor:'pointer', fontSize:12, color:'var(--ink3)', display:'flex', alignItems:'center', gap:4, padding:'4px 8px', borderRadius:'var(--r)' }}>
              <I.Check width={12} height={12} /> Save
            </button>
            {existingBot && (
              <button className="btn btn-ghost btn-sm" onClick={() => onDone(existingBot)}>← Back</button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="wizard-progress-bar" style={{ height:3, background:'var(--line)', flexShrink:0 }}>
          <div style={{ height:'100%', background:'var(--coffee-0)', width:`${progress}%`, transition:'width 0.4s cubic-bezier(0.22,1,0.36,1)' }} />
        </div>

        {/* Step tabs */}
        <div className="wizard-step-tabs" style={{ display:'flex', borderBottom:'1px solid var(--line)', background:'var(--surface)', flexShrink:0, overflowX:'auto' }}>
          {STEPS.map((s, i) => (
            <button key={s.id}
              onClick={() => i <= maxStep && setStep(i)}
              style={{
                display:'flex', alignItems:'center', gap:6,
                padding:'0 16px', height:42, border:'none',
                background:'transparent', flexShrink:0,
                borderBottom: i === step ? '2px solid var(--coffee-0)' : '2px solid transparent',
                color: i === step ? 'var(--coffee-0)' : i < step ? 'var(--ink3)' : 'var(--ink4)',
                fontFamily:'var(--font-body)', fontSize:12.5,
                fontWeight: i === step ? 500 : 400,
                cursor: i <= maxStep ? 'pointer' : 'default',
                marginBottom:-1, transition:'all 0.12s',
              }}>
              <span style={{
                width:17, height:17, borderRadius:'50%', flexShrink:0,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:10, fontWeight:600,
                background: i < step ? 'var(--success)' : i === step ? 'var(--coffee-0)' : 'var(--surface3)',
                color: i < step || i === step ? 'white' : 'var(--ink4)',
              }}>
                {i < step ? <I.Check width={9} height={9} /> : i + 1}
              </span>
              {s.label}
            </button>
          ))}
        </div>

        {/* Step content — scrollable */}
        <div ref={scrollRef} className="wizard-step-content" style={{ flex:1, overflowY:'scroll', overflowX:'hidden', minHeight:0, WebkitOverflowScrolling:'touch', touchAction:'pan-y' }} key={step}>
          <div className="fade-in" style={{ padding:'24px 20px 160px 20px', maxWidth:820, margin:'0 auto' }}>
            {error && <div className="alert alert-error mb-16">{error}</div>}
            {step === 0 && <StepUseCase      bot={bot} f={f} />}
            {step === 1 && <StepIdentity     bot={bot} f={f} />}
            {step === 2 && <StepKnowledge    bot={bot} f={f} />}
            {step === 3 && <StepCapabilities bot={bot} f={f} />}
            {step === 4 && <StepBranding     bot={bot} f={f} />}
            {step === 5 && <StepPersonality  bot={bot} f={f} />}
            {step === 6 && <StepTest         bot={bot} />}
            {step === 7 && <StepPublish      bot={bot} sub={sub} />}
          </div>
        </div>

        {/* Footer */}
        <div className="wizard-mobile-footer" style={{ height:56, borderTop:'1px solid var(--line)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 48px', background:'var(--surface)', flexShrink:0 }}>
          <button onClick={back} disabled={step === 0}
            style={{ background:'none', border:'none', cursor:step===0?'default':'pointer', opacity:step===0?0:1, color:'var(--ink3)', fontSize:13 }}>
            ← Back
          </button>
          <div className="flex ic g8">
            {step < 7 ? (
              <button className="btn btn-primary" onClick={next} disabled={!canNext}>Continue →</button>
            ) : (
              <button className="btn btn-accent btn-lg" onClick={handlePublish} disabled={saving}>
                {saving ? <><Spinner size={15} color="white" /> Publishing…</> : <><I.Rocket /> Publish my bot</>}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Right: pinned live preview ── */}
      <div className="wizard-mobile-right" style={{ width:400, minWidth:400, borderLeft:'1px solid var(--line)', display:'flex', flexDirection:'column', background:'var(--surface2)', flexShrink:0 }}>
        {/* Header */}
        <div className="wizard-preview-header" style={{ height:52, borderBottom:'1px solid var(--line)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 16px', background:'var(--surface)', flexShrink:0 }}>
          <span style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--ink4)' }}>Live Preview</span>
          <span style={{ fontSize:11, color:'var(--ink4)' }}>Updates as you edit</span>
        </div>
       {/* Floating desktop window centred in panel */}
        <div className="wizard-preview-inner" style={{ flex:1, overflow:'hidden', position:'relative', isolation:'isolate', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--surface2)' }}>
          <div style={{ width:'390px', height:'844px', transform:'scale(0.65)', transformOrigin:'center center', pointerEvents:'none', flexShrink:0, marginTop:'148px' }}>
            <ActiveChat bot={bot} previewMode={true} />
          </div>
        </div>
        <div className="wizard-preview-footer" style={{ padding:'8px', fontSize:10, color:'var(--ink4)', textAlign:'center', background:'var(--surface)', borderTop:'1px solid var(--line)', flexShrink:0 }}>
          Live preview · updates as you edit
        </div>
      </div>

    </div>
  )
}

// ── Build flat KB text from entries ──────────────────────────────────────────
function buildKbText(entries, legacyText) {
  const sorted = [...entries].sort((a,b) => {
    const order = { primary:0, secondary:1, background:2 }
    return (order[a.priority]||1) - (order[b.priority]||1)
  })
  const active = sorted.filter(e => e.enabled !== false)
  const parts = active.map(e => {
    const type = KB_TYPES.find(t => t.id === e.type)?.label || e.type
    return `### ${e.title} [${type}]\n${e.content}`
  })
  if (legacyText?.trim()) parts.push(`### General Knowledge\n${legacyText}`)
  return parts.join('\n\n---\n\n')
}

// ── Live preview ──────────────────────────────────────────────────────────────
function BotPreview({ bot }) {
  const name    = bot.name || 'Your Bot'
  const primary = bot.primary_color || '#2C1810'
  const bg      = bot.bg_color || '#F5F0E8'
  const letter  = (bot.avatar_letter || name.charAt(0) || 'B').toUpperCase()
  const r       = `${bot.border_radius ?? 12}px`
  const sz      = (bot.font_size || 14) * 0.78
  const bodyFont  = bot.body_font  || "'Inter', sans-serif"
  const titleFont = bot.title_font || "'Playfair Display', serif"
  const prompts = (bot.suggested_prompts || []).filter(Boolean).slice(0,3)
  const overlayStyle = getOverlayStyle(bot.texture_overlay, bot.texture_intensity ?? 40)
  const spacing = bot.spacing || 14
  const headerH = bot.header_height || 60
  const textOp  = (bot.text_opacity || 100) / 100
  const panelOp = (bot.panel_opacity || 100) / 100

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', width:'100%', background: bot.bg_image_url ? `url(${bot.bg_image_url}) center/cover no-repeat` : bg, fontFamily:bodyFont, fontSize:sz, position:'relative', overflow:'hidden' }}>
      {bot.bg_image_url && <div style={{ position:'absolute', inset:0, background:`rgba(0,0,0,${(bot.bg_overlay||40)/100})`, zIndex:0 }} />}
      {overlayStyle && <div style={overlayStyle} />}

      {/* Header */}
      <div style={{ position:'relative', zIndex:2, height:headerH, minHeight:headerH, padding:`0 ${spacing/2}px`, borderBottom:'1px solid rgba(0,0,0,0.07)', display:'flex', alignItems:'center', gap:8, background:`rgba(253,250,244,${panelOp})`, backdropFilter:'blur(8px)', flexShrink:0 }}>
        <div style={{ width:Math.round(headerH*0.5), height:Math.round(headerH*0.5), borderRadius:`${Math.min(bot.border_radius??12,10)}px`, background:bot.avatar_url||bot.logo_url?'transparent':primary, display:'flex', alignItems:'center', justifyContent:'center', fontSize:sz*0.9, fontWeight:700, color:'white', overflow:'hidden', flexShrink:0 }}>
          {bot.avatar_url ? <img src={bot.avatar_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          : bot.logo_url ? <img src={bot.logo_url} alt="" style={{ width:'100%', height:'100%', objectFit:'contain', padding:4 }} />
          : letter}
        </div>
        <div style={{ minWidth:0 }}>
          <div style={{ fontFamily:titleFont, fontWeight:600, color:'#1E1209', opacity:textOp, fontSize:sz*1.05, lineHeight:1.2 }}>{name}</div>
          {bot.descriptor && <div style={{ fontSize:sz*0.85, color:'#7A5C3E', opacity:textOp*0.8 }}>{bot.descriptor}</div>}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex:1, padding:spacing/1.5, display:'flex', flexDirection:'column', gap:spacing/2, overflowY:'auto', position:'relative', zIndex:2 }}>
        {bot.welcome_message && <p style={{ fontSize:sz*0.88, color: bot.bg_image_url?'rgba(255,255,255,0.85)':'#7A5C3E', opacity:textOp, lineHeight:1.6, textAlign:'center' }}>{bot.welcome_message}</p>}
        {prompts.length > 0 && (
          <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
            {prompts.map((p,i) => <div key={i} style={{ fontSize:sz*0.82, padding:'3px 8px', borderRadius:r, background:`rgba(255,255,255,${panelOp*0.9})`, border:'1px solid rgba(0,0,0,0.09)', color:'#3D2214', opacity:textOp }}>{p}</div>)}
          </div>
        )}
        <div style={{ display:'flex', gap:6 }}>
          <div style={{ width:18, height:18, borderRadius:6, background:primary, flexShrink:0, marginTop:2, display:'flex', alignItems:'center', justifyContent:'center', fontSize:7, fontWeight:700, color:'white' }}>{letter}</div>
          <div style={{ padding:'6px 9px', borderRadius:`2px ${r} ${r} ${r}`, background:`rgba(255,255,255,${panelOp})`, border:'1px solid rgba(0,0,0,0.07)', fontSize:sz*0.9, color:'#1E1209', opacity:textOp, lineHeight:1.5 }}>
            {bot.greeting || `Hi! I'm ${name}. How can I help?`}
          </div>
        </div>
        <div style={{ display:'flex', gap:6, alignSelf:'flex-end', flexDirection:'row-reverse' }}>
          <div style={{ width:18, height:18, borderRadius:6, background:'rgba(0,0,0,0.08)', flexShrink:0, marginTop:2 }} />
          <div style={{ padding:'6px 9px', borderRadius:`${r} 2px ${r} ${r}`, background:primary, fontSize:sz*0.9, color:'white', opacity:textOp, lineHeight:1.5 }}>
            {(bot.suggested_prompts||[]).filter(Boolean)[0] || 'How can you help me?'}
          </div>
        </div>
      </div>

      {/* Input */}
      <div style={{ position:'relative', zIndex:2, padding:`${spacing/2}px`, borderTop:'1px solid rgba(0,0,0,0.07)', display:'flex', gap:6, background:`rgba(253,250,244,${panelOp})`, flexShrink:0, marginTop:'auto' }}>
        <div style={{ flex:1, background:'rgba(0,0,0,0.04)', borderRadius:`${Math.min(bot.border_radius??12,10)}px`, padding:'5px 9px', fontSize:sz*0.85, color:'#C9AD8E', opacity:textOp }}>Send a message…</div>
        <div style={{ width:26, height:26, borderRadius:`${Math.min(bot.border_radius??12,9)}px`, background:primary, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <I.Send width={10} height={10} style={{ color:'white' }} />
        </div>
      </div>
    </div>
  )
}

// ── Step headers ──────────────────────────────────────────────────────────────
function SH({ n, total=8, title, sub }) {
  return (
    <div className="mb-28">
      <div style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--ink4)', marginBottom:8 }}>Step {n} of {total}</div>
      <h2 className="serif mb-6" style={{ fontSize:'1.4rem', fontWeight:600, color:'var(--coffee-0)', letterSpacing:-0.3, lineHeight:1.2 }}>{title}</h2>
      <p style={{ fontSize:13.5, color:'var(--ink3)', lineHeight:1.7 }}>{sub}</p>
    </div>
  )
}

// ── Step 1: Use Case ──────────────────────────────────────────────────────────
function StepUseCase({ bot, f }) {
  function select(uc) {
    const preset = USE_CASE_PRESETS[uc] || {}
    f('use_case', uc)
    Object.entries(preset).forEach(([k,v]) => f(k,v))
  }
  return (
    <>
      <SH n={1} title="What kind of bot are you building?" sub="Choose the use case and who it's for. This pre-configures personality and knowledge structure — adjust everything afterwards." />

      {/* Bot type selector */}
      <div style={{ display:'flex', gap:10, marginBottom:20 }}>
        {[
          { id:'customer', label:'Customer facing', icon:'🌐', desc:'Public link for your customers' },
          { id:'internal', label:'Internal team',   icon:'🔒', desc:'Password protected for your team' },
        ].map(t => (
          <button key={t.id} onClick={() => f('bot_type', t.id)}
            style={{ flex:1, padding:'14px', borderRadius:'var(--r-md)', textAlign:'left', border:`1.5px solid ${bot.bot_type===t.id?'var(--coffee-0)':'var(--line)'}`, background: bot.bot_type===t.id?'var(--coffee-0)':'var(--surface)', cursor:'pointer', transition:'all 0.12s' }}>
            <div style={{ fontSize:20, marginBottom:6 }}>{t.icon}</div>
            <div style={{ fontSize:13, fontWeight:600, color: bot.bot_type===t.id?'var(--parch-1)':'var(--ink)', marginBottom:3 }}>{t.label}</div>
            <div style={{ fontSize:11.5, color: bot.bot_type===t.id?'rgba(253,250,244,0.7)':'var(--ink4)', lineHeight:1.5 }}>{t.desc}</div>
          </button>
        ))}
      </div>

      {/* Password field for internal bots */}
      {bot.bot_type === 'internal' && (
        <div className="field" style={{ marginBottom:20 }}>
          <label className="label">Access password</label>
          <div className="label-sub mb-8">Team members will need this to access the bot.</div>
          <input className="input" type="text" placeholder="e.g. team2024" value={bot.access_password||''} onChange={e => f('access_password', e.target.value)} />
        </div>
      )}

      <div className="field">
        <label className="label">What kind of bot is this?</label>
        <select className="input" value={bot.use_case||''} onChange={e => select(e.target.value)}>
          <option value="" disabled>Select a bot type…</option>
          {USE_CASES.map(uc => (
            <option key={uc.id} value={uc.id}>{uc.label}</option>
          ))}
        </select>
        {bot.use_case && (
          <div style={{ marginTop:8, padding:'10px 14px', background:'var(--surface2)', border:'1px solid var(--line)', borderRadius:'var(--r)', fontSize:13, color:'var(--ink3)', lineHeight:1.6 }}>
            {USE_CASES.find(uc => uc.id === bot.use_case)?.desc}
          </div>
        )}
      </div>
    </>
  )
}

// ── Step 2: Identity ──────────────────────────────────────────────────────────
function StepIdentity({ bot, f }) {
  return (
    <>
      <SH n={2} title="Give your assistant an identity" sub="Choose a name and description that feels natural for your brand." />
      <div className="grid2 mb-16">
        <div className="field" style={{ marginBottom:0 }}>
          <label className="label">Bot name <span style={{ color:'var(--danger)' }}>*</span></label>
          <input className="input" placeholder="e.g. Aria, Max, Scout…" value={bot.name} onChange={e => f('name', e.target.value)} autoFocus />
        </div>
        <div className="field" style={{ marginBottom:0 }}>
          <label className="label">What is this bot's focus?</label>
          <input className="input" placeholder="Your support specialist" value={bot.descriptor} onChange={e => f('descriptor', e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label className="label">Greeting message</label>
        <input className="input" placeholder={`Hi! I'm ${bot.name||'here to help'}. What can I do for you?`} value={bot.greeting} onChange={e => f('greeting', e.target.value)} />
        <div className="label-sub mt-4">The first message your users see.</div>
      </div>
      <div className="field">
        <label className="label">Welcome message</label>
        <textarea className="input" style={{ minHeight:80 }} placeholder="Briefly describe what your assistant helps with. Appears above the suggested prompts." value={bot.welcome_message} onChange={e => f('welcome_message', e.target.value)} />
      </div>
    
    </>
  )
}async function aiClassifyEntry(entry, bot, f, idx) {
  try {
    const { callClaude } = await import('../lib/supabase.js')
    const kbTypes = bot.bot_type === 'internal'
      ? 'sop, policies, training, troubleshoot, product, updates, hr, safety, tools'
      : 'products, pricing, ordering, delivery, policies, support, faq'
    const result = await callClaude({
      system: `You are categorising a knowledge base entry. Return JSON only:
{
  "title": "concise descriptive title (max 60 chars)",
  "type": "best matching type from: ${kbTypes}"
}`,
      messages: [],
      userMessage: `Categorise this knowledge base content:\n\n${entry.content.slice(0, 500)}`,
    })
    const cleaned = result.replace(/```json|```/g, '').trim()
    const { title, type } = JSON.parse(cleaned)
    // Use a callback-style update via a custom event to avoid stale closure
    const event = new CustomEvent('lb-update-entry', { detail: { idx, title, type } })
    window.dispatchEvent(event)
  } catch(e) { console.error('AI classify failed:', e) }
}

// ── Step 3: Knowledge ─────────────────────────────────────────────────────────
function StepKnowledge({ bot, f }) {
  const KB_TYPES_ACTIVE = bot.bot_type === 'internal' ? KB_TYPES_INTERNAL : KB_TYPES_CUSTOMER

  useEffect(() => {
    function handleUpdate(e) {
      const { idx, title, type } = e.detail
      f('knowledge_entries', (bot.knowledge_entries || []).map((entry, i) =>
        i === idx ? { ...entry, title: title || entry.title, type: type || entry.type } : entry
      ))
    }
    window.addEventListener('lb-update-entry', handleUpdate)
    return () => window.removeEventListener('lb-update-entry', handleUpdate)
  }, [bot.knowledge_entries])
  const [adding, setAdding]   = useState(false)
  const [form,      setForm]      = useState({ title:'', type:'faq', priority:'primary', content:'', enabled:true })
  const [titling,   setTitling]   = useState(false)
  const titleTimer = useRef(null)
  const [editIdx,setEditIdx]  = useState(null)
  const fileRef = useRef(null)
  const entries = bot.knowledge_entries || []

  const totalWords = entries.filter(e => e.enabled !== false).reduce((a,e) => a + (e.content?.split(/\s+/).filter(Boolean).length||0), 0)
  const quality = totalWords === 0 ? null
    : totalWords < 100  ? { label:'Very thin', color:'var(--danger)' }
    : totalWords < 500  ? { label:'Minimal',   color:'var(--warn)' }
    : totalWords < 2000 ? { label:'Good',       color:'var(--success)' }
    :                     { label:'Strong',     color:'var(--success)' }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return

    let text = ''

    if (file.type === 'application/pdf') {
      try {
        const { extractText } = await import('unpdf')
        const arrayBuffer = await file.arrayBuffer()
        const { text: extracted } = await extractText(new Uint8Array(arrayBuffer), { mergePages: true })
        // Use Claude to clean and restructure the raw PDF text
        try {
          const { callClaude } = await import('../lib/supabase.js')
          const result = await callClaude({
            system: `You are cleaning up raw text extracted from a PDF. The text may be jumbled due to column layouts, tables, or formatting. 
Restructure it into clean, readable, well-organised plain text that preserves all the information.
- Fix ordering issues caused by multi-column layouts
- Preserve headings and categories
- Format lists cleanly, one item per line
- Do not add or remove any information
- Return only the cleaned text, no explanation`,
            messages: [],
            userMessage: `Clean up this raw PDF text:\n\n${extracted.slice(0, 8000)}`,
          })
          text = result
        } catch(e) {
          // If Claude fails, fall back to raw extracted text
          text = extracted
        }
      } catch (err) {
        console.error('PDF parse error:', err)
        text = await file.text()
      }
    } else {
      text = await file.text()
    }

    setForm(p => ({ ...p, title: file.name.replace(/\.[^.]+$/, ''), content: text.slice(0, 50000) }))
    setAdding(true)
  }

  const [entryError,   setEntryError]   = useState('')
  const [scraping,     setScraping]     = useState(false)
  const [scrapeUrl,    setScrapeUrl]    = useState('')
  const [scrapeLoading,setScrapeLoading]= useState(false)
  const [scrapeError,  setScrapeError]  = useState('')

  async function handleScrape() {
    if (!scrapeUrl.trim()) return
    setScrapeLoading(true)
    setScrapeError('')
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: scrapeUrl.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to import')
      if (!data.text || data.text.length < 50) throw new Error('Not enough content found on that page.')

      // Use AI to clean and structure the content
      const { callClaude } = await import('../lib/supabase.js')
      const existingTitles = (bot.knowledge_entries || []).map(e => e.title).join(', ')
      const existingContent = (bot.knowledge_entries || []).map(e => `${e.title}: ${e.content.slice(0, 200)}`).join('\n')
      const result = await callClaude({
        system: `You are extracting knowledge base content from a website.
Clean the text, remove navigation/footer/cookie notices, and return a JSON array of knowledge entries:
[{ "title": "concise title", "type": "faq|products|policies|support", "content": "clean content" }]
Create as many entries as needed to capture all distinct topics on the page.
Do NOT duplicate topics already in the knowledge base unless the context is meaningfully different.
Return ONLY valid JSON.`,
        messages: [],
        userMessage: `Extract knowledge from this website content:\n\n${data.text.slice(0, 8000)}

Existing knowledge base entries (do not duplicate these unless context differs):
${existingContent || 'None yet'}`,
      })

      const cleaned = result.replace(/```json|```/g, '').trim()
      const entries = JSON.parse(cleaned)

      const newEntries = entries.map(e => ({
        id: Date.now().toString() + Math.random(),
        title: e.title,
        type: e.type || 'faq',
        priority: 'primary',
        content: e.content,
        enabled: true,
        source: 'website',
        created_at: new Date().toISOString(),
      }))

      f('knowledge_entries', [...(bot.knowledge_entries || []), ...newEntries])
      setScraping(false)
      setScrapeUrl('')
    } catch(e) {
      setScrapeError(e.message || 'Failed to import. Try a different URL.')
    }
    setScrapeLoading(false)
  }

function saveEntry() {
    if (!form.content.trim()) { setEntryError('Please add some content for this entry.'); return }
    setEntryError('')
    // If no title, use placeholder then let AI fill it in
    const entryToSave = { ...form }
    if (!entryToSave.title.trim()) {
      entryToSave.title = form.content.trim().split('\n')[0].slice(0, 50)
    }
    // Sanitise content before saving
    if (entryToSave.content) entryToSave.content = entryToSave.content.replace(/<[^>]+>/g, '').slice(0, 50000)
    if (entryToSave.title) entryToSave.title = entryToSave.title.replace(/<[^>]+>/g, '').slice(0, 200)
    const entry = { ...entryToSave, id: editIdx !== null ? entries[editIdx].id : Date.now().toString() }
    if (editIdx !== null) {
      const updated = [...entries]; updated[editIdx] = entry
      f('knowledge_entries', updated); setEditIdx(null)
    } else {
      f('knowledge_entries', [...entries, entry])
    }
   setForm({ title:'', type:'faq', priority:'primary', content:'', enabled:true })
    setAdding(false)
    // AI classify in background — updates title and type automatically
    aiClassifyEntry(entry, bot, f, editIdx !== null ? editIdx : (entries.length))
  }

  async function removeEntry(idx) {
  const updated = entries.filter((_,i) => i !== idx)
  f('knowledge_entries', updated)
  // Immediately save to Supabase so deleted entries don't linger
  try {
    const { supabase } = await import('../lib/supabase.js')
    await supabase.from('bots').update({ knowledge_entries: updated }).eq('id', bot.id)
  } catch(e) { console.error('Failed to delete entry:', e) }
}
  function toggleEntry(idx) {
    const updated = [...entries]; updated[idx] = { ...updated[idx], enabled: updated[idx].enabled === false ? true : false }
    f('knowledge_entries', updated)
  }
  function editEntry(idx) { setForm({ ...entries[idx] }); setEditIdx(idx); setAdding(true) }

  return (
    <>
      <SH n={3} title="Build your knowledge base" sub="Add everything your bot should know. Organise by type and priority so it answers from the right sources first." />

      {/* Summary bar */}
      {entries.length > 0 && (
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', background:'var(--surface2)', border:'1px solid var(--line)', borderRadius:'var(--r)', marginBottom:16 }}>
          <div style={{ flex:1, fontSize:13, color:'var(--ink2)' }}>
            <strong>{entries.filter(e=>e.enabled!==false).length}</strong> active entries · <strong>{totalWords.toLocaleString()}</strong> words
          </div>
          {quality && <span style={{ fontSize:12, fontWeight:600, color:quality.color }}>{quality.label}</span>}
        </div>
      )}

      {/* Entry list */}
      {entries.length > 0 && (
        <div style={{ marginBottom:16 }}>
          {entries.map((entry, idx) => {
            const kbType = KB_TYPES.find(t => t.id === entry.type)
            const disabled = entry.enabled === false
            return (
              <div key={entry.id||idx} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:'var(--r)', border:'1px solid var(--line)', marginBottom:6, background: disabled?'var(--surface2)':'var(--surface)', opacity: disabled?0.6:1, transition:'all 0.12s' }}>
                <button onClick={() => toggleEntry(idx)} style={{ background:'none', border:'none', cursor:'pointer', padding:0, flexShrink:0 }}>
                  <div style={{ width:16, height:16, borderRadius:3, border:`1.5px solid ${disabled?'var(--line2)':'var(--coffee-0)'}`, background: disabled?'transparent':'var(--coffee-0)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {!disabled && <I.Check width={9} height={9} style={{ color:'white' }} />}
                  </div>
                </button>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:500, color:'var(--ink)', marginBottom:2 }}>{entry.title}</div>
                  <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                    <span style={{ fontSize:10.5, fontWeight:600, padding:'1px 7px', borderRadius:20, background: kbType?`${kbType.color}18`:'var(--surface3)', color: kbType?.color||'var(--ink4)' }}>{kbType?.label||entry.type}</span>
                    <span style={{ fontSize:10.5, color:'var(--ink4)' }}>{PRIORITY_LEVELS.find(p=>p.id===entry.priority)?.label}</span>
                    <span style={{ fontSize:10.5, color:'var(--ink4)' }}>{entry.content?.split(/\s+/).filter(Boolean).length||0} words</span>
                  </div>
                </div>
                <button className="btn btn-ghost btn-xs" onClick={() => editEntry(idx)}><I.Pencil width={12} height={12} /></button>
                <button className="btn btn-danger btn-xs" onClick={() => removeEntry(idx)}><I.X width={11} height={11} /></button>
              </div>
            )
          })}
        </div>
      )}

      {/* Add / Edit form */}
      {adding ? (
        <div style={{ border:'1px solid var(--line)', borderRadius:'var(--r-md)', padding:'18px', background:'var(--surface)', marginBottom:16 }}>
          <div style={{ fontFamily:'var(--font-display)', fontSize:14, fontWeight:600, color:'var(--coffee-0)', marginBottom:14 }}>
            {editIdx !== null ? 'Edit entry' : 'Add knowledge entry'}
          </div>
          <div className="grid2 mb-12">
            <div className="field" style={{ marginBottom:0 }}>
              <label className="label">Title</label>
              <input className="input input-sm" placeholder="e.g. Pricing FAQ, Refund Policy…" value={form.title} onChange={e => setForm(p=>({...p,title:e.target.value}))} autoFocus />
            </div>
            <div className="field" style={{ marginBottom:0 }}>
              <label className="label">Type</label>
              <select className="input input-sm" value={form.type} onChange={e => setForm(p=>({...p,type:e.target.value}))}>
                {KB_TYPES_ACTIVE.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
              {KB_TYPES_ACTIVE.find(t => t.id === form.type)?.hint && (
                <div style={{ fontSize:11.5, color:'var(--ink4)', marginTop:5, lineHeight:1.5 }}>
                  💡 {KB_TYPES_ACTIVE.find(t => t.id === form.type).hint}
                </div>
              )}
            </div>
          </div>
          <div className="field mb-12">
            <label className="label">Priority</label>
            <div style={{ display:'flex', gap:8 }}>
              {PRIORITY_LEVELS.map(p => (
                <button key={p.id} onClick={() => setForm(prev=>({...prev,priority:p.id}))}
                  style={{ flex:1, padding:'8px', borderRadius:'var(--r)', border:`1px solid ${form.priority===p.id?'var(--coffee-0)':'var(--line)'}`, background:form.priority===p.id?'var(--coffee-0)':'var(--surface)', color:form.priority===p.id?'var(--parch-1)':'var(--ink3)', cursor:'pointer', fontSize:12, textAlign:'center', transition:'all 0.12s' }}>
                  <div style={{ fontWeight:600, marginBottom:2 }}>{p.label}</div>
                  <div style={{ fontSize:10.5, opacity:0.75 }}>{p.desc}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="field" style={{ marginBottom:14 }}>
            <label className="label">Content</label>
            <textarea className="input" style={{ minHeight:160, lineHeight:1.7 }} placeholder="Paste your content here…" value={form.content}
              onChange={e => {
                const content = e.target.value
                setForm(p=>({...p, content}))
                // Auto-title after 800ms pause in typing — always regenerate if content changed significantly
                if (true) {
                  clearTimeout(titleTimer.current)
                  titleTimer.current = setTimeout(async () => {
                    if (!content.trim() || content.trim().length < 30) return
                    setTitling(true)
                    try {
                      const { callClaude } = await import('../lib/supabase.js')
                      const kbTypes = bot.bot_type === 'internal'
                        ? 'sop, policies, training, troubleshoot, product, updates, hr, safety, tools'
                        : 'products, pricing, ordering, delivery, policies, support, faq'
                      const result = await callClaude({
                        system: `Return JSON only: { "title": "concise title max 60 chars", "type": "best type from: ${kbTypes}" }`,
                        messages: [],
                        userMessage: content.slice(0, 400),
                      })
                      const { title, type } = JSON.parse(result.replace(/```json|```/g,'').trim())
                      setForm(p => ({ ...p, title: title || p.title, type: type || p.type }))
                    } catch(e) { console.error(e) }
                    setTitling(false)
                  }, 800)
                }
              }}
            />
            <div className="flex ic jb mt-4">
              <div className="label-sub">{form.content?.split(/\s+/).filter(Boolean).length||0} words</div>
              {titling && <div style={{ fontSize:11, color:'var(--ink4)', display:'flex', alignItems:'center', gap:4 }}><span style={{ animation:'spin 0.7s linear infinite', display:'inline-block' }}>⟳</span> Naming…</div>}
            </div>
          </div>
          {entryError && (
            <div className="alert alert-error mb-8" style={{ fontSize:12.5 }}>{entryError}</div>
          )}
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn btn-primary" onClick={saveEntry} disabled={!form.content.trim()}>
              {editIdx !== null ? 'Save changes' : 'Add entry'}
            </button>
            <button className="btn btn-ghost" onClick={() => { setAdding(false); setEditIdx(null); setForm({ title:'', type:'faq', priority:'primary', content:'', enabled:true }) }}>Cancel</button>
          </div>
        </div>
      ) : (
        <>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
          <button className="btn btn-primary btn-sm" onClick={() => setScraping(true)}>
            🌐 Import from website
          </button>
          <input ref={fileRef} type="file" accept=".pdf,.docx,.txt,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" style={{ display:'none' }} onChange={handleFileUpload} />
          <button className="btn btn-primary btn-sm" onClick={() => fileRef.current?.click()}>
            ↑ Upload file
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setAdding(true)}>
            <I.Plus width={13} height={13} /> Add text entry
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => {
            if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
              alert('Speech recognition not supported in this browser.')
              return
            }
            const SR = window.SpeechRecognition || window.webkitSpeechRecognition
            const recognition = new SR()
            recognition.continuous = true
            recognition.interimResults = false
            recognition.lang = 'en-US'
            let lastResultIndex = 0
            recognition.onresult = e => {
              const newTranscript = Array.from(e.results)
                .slice(lastResultIndex)
                .map(r => r[0].transcript)
                .join(' ')
              lastResultIndex = e.results.length
              setForm(p => ({ ...p, content: p.content ? p.content + ' ' + newTranscript : newTranscript }))
            }
            recognition.start()
            setAdding(true)
            setTimeout(() => recognition.stop(), 120000)
          }}>
            🎤 Dictate
          </button>
        </div>

        {scraping && (
          <div style={{ border:'1px solid var(--line)', borderRadius:'var(--r-md)', padding:'18px', background:'var(--surface)', marginBottom:16 }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:14, fontWeight:600, color:'var(--coffee-0)', marginBottom:10 }}>
              Import from website
            </div>
            <div style={{ fontSize:13, color:'var(--ink3)', marginBottom:12, lineHeight:1.6 }}>
              Paste your website URL and we'll automatically pull the content into your knowledge base.
            </div>
            <div className="flex ic g8 mb-12">
              <input className="input input-sm" style={{ flex:1 }} placeholder="https://yourwebsite.com" value={scrapeUrl} onChange={e => setScrapeUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleScrape()} />
              <button className="btn btn-primary btn-sm" onClick={handleScrape} disabled={!scrapeUrl.trim() || scrapeLoading}>
                {scrapeLoading ? '⟳ Importing…' : 'Import'}
              </button>
            </div>
            {scrapeError && <div className="alert alert-error mb-8" style={{ fontSize:12.5 }}>{scrapeError}</div>}
            <button className="btn btn-ghost btn-sm" onClick={() => { setScraping(false); setScrapeUrl(''); setScrapeError('') }}>Cancel</button>
          </div>
        )}
        </>
      )}

      {entries.length === 0 && !adding && (
        <div style={{ padding:'32px 20px', border:'2px dashed var(--line)', borderRadius:'var(--r-lg)', textAlign:'center' }}>
          <div style={{ fontSize:24, marginBottom:10 }}>📚</div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:15, color:'var(--coffee-1)', marginBottom:6 }}>No knowledge entries yet</div>
          <div style={{ fontSize:13, color:'var(--ink4)', lineHeight:1.65 }}>Add your FAQs, policies, product info, SOPs — anything your customers ask about. The more you add, the better your bot answers.</div>
        </div>
      )}

      {entries.length > 0 && entries.length < 3 && (
        <div className="alert alert-info" style={{ fontSize:12.5 }}>
          💡 Add at least 3–5 entries for reliable answers. Your bot currently has very thin knowledge.
        </div>
      )}
    </>
  )
}

// ── Step 4: Capabilities ──────────────────────────────────────────────────────
function StepCapabilities({ bot, f }) {
  return (
    <>
      <SH n={4} title="Configure capabilities" sub="Control what your bot can access and how it handles questions it can't answer." />
      <div style={{ border:'1px solid var(--line)', borderRadius:'var(--r-md)', marginBottom:20, overflow:'hidden' }}>
        <div className="toggle-row" style={{ padding:'14px 18px' }}>
          <div><div className="toggle-title">Strict knowledge base only</div><div className="toggle-desc">Only answers from your knowledge base. Unknown questions go to your inbox.</div></div>
          <label className="switch"><input type="checkbox" checked={bot.strict_kb_only} onChange={e=>f('strict_kb_only',e.target.checked)}/><span className="switch-track"/></label>
        </div>
        <div className="toggle-row" style={{ padding:'14px 18px' }}>
          <div><div className="toggle-title">Broad AI knowledge</div><div className="toggle-desc">Bot can draw on general AI knowledge when your content doesn't have the answer.</div></div>
          <label className="switch"><input type="checkbox" checked={bot.allow_broad_ai} onChange={e=>f('allow_broad_ai',e.target.checked)}/><span className="switch-track"/></label>
        </div>
        <div className="toggle-row" style={{ padding:'14px 18px' }}>
          <div><div className="toggle-title">Web search</div><div className="toggle-desc">Bot can search the internet for current information.</div></div>
          <label className="switch"><input type="checkbox" checked={bot.allow_web} onChange={e=>f('allow_web',e.target.checked)}/><span className="switch-track"/></label>
        </div>
      </div>
      <div className="field mb-16">
        <label className="label">Fallback message</label>
        <div className="label-sub mb-8">What the bot says when it can't answer. The question gets sent to your inbox.</div>
        <textarea className="input" style={{ minHeight:72 }} value={bot.fallback_message} onChange={e=>f('fallback_message',e.target.value)} />
      </div>
      
    </>
  )
}

// ── Step 5: Branding ──────────────────────────────────────────────────────────
// ── Slider component (must be outside StepBranding to use hooks) ─────────────
function Slider({ label, field, min, max, step=1, unit='', leftLabel='', rightLabel='', bot, f }) {
  const val = bot[field] ?? min
  const [local, setLocal] = useState(val)
  const dragging = useRef(false)
  useEffect(() => { if (!dragging.current) setLocal(bot[field] ?? min) }, [bot[field]])
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
        <span style={{ fontSize:12, fontWeight:500, color:'var(--ink2)' }}>{label}</span>
        <span style={{ fontSize:12, color:'var(--ink4)' }}>{Math.round(local)}{unit}</span>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        {leftLabel && <span style={{ fontSize:10.5, color:'var(--ink4)', whiteSpace:'nowrap', minWidth:40 }}>{leftLabel}</span>}
        <input type="range" min={min} max={max} step={step} value={local}
          style={{ flex:1 }}
          onMouseDown={() => { dragging.current = true }}
          onTouchStart={() => { dragging.current = true }}
          onChange={e => { const n=Number(e.target.value); setLocal(n); f(field,n) }}
          onMouseUp={() => { dragging.current = false }}
          onTouchEnd={() => { dragging.current = false }}
        />
        {rightLabel && <span style={{ fontSize:10.5, color:'var(--ink4)', whiteSpace:'nowrap', minWidth:40, textAlign:'right' }}>{rightLabel}</span>}
      </div>
    </div>
  )
}

function StepBranding({ bot, f }) {
  const logoRef   = useRef(null)
  const avatarRef = useRef(null)
  const bgRef     = useRef(null)

  async function handleFile(e, key) {
    const file = e.target.files?.[0]; if (!file) return
    if (key === 'bg_image_url' && file.size > 10*1024*1024) { alert('Max 10MB for background images.'); return }
    if (key !== 'bg_image_url' && file.size > 5*1024*1024) { alert('Max 5MB.'); return }
    const reader = new FileReader()
    reader.onload = () => f(key, reader.result)
    reader.readAsDataURL(file)
  }

  function FontSelect({ label, fieldKey }) {
    const val = bot[fieldKey] || FONTS[0].value
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState('')
    const dropRef = useRef(null)
    loadGoogleFont(val)

    const filtered = FONTS.filter(fn => fn.label.toLowerCase().includes(search.toLowerCase()))
    const selectedFont = FONTS.find(fn => fn.value === val) || FONTS[0]

    useEffect(() => {
      function handleClick(e) { if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false) }
      document.addEventListener('mousedown', handleClick)
      return () => document.removeEventListener('mousedown', handleClick)
    }, [])

    return (
      <div className="field" style={{ marginBottom:16 }} ref={dropRef}>
        <label className="label">{label}</label>
        <div style={{ position:'relative' }}>
          <button onClick={() => setOpen(p => !p)}
            style={{ width:'100%', padding:'8px 12px', background:'var(--surface)', border:'1px solid var(--line2)', borderRadius:'var(--r)', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', fontFamily:val, fontSize:15, color:'var(--ink)' }}>
            <span>{selectedFont.label}</span>
            <span style={{ fontSize:10, color:'var(--ink4)', fontFamily:'var(--font-body)' }}>▼</span>
          </button>
          {open && (
            <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0, zIndex:500, background:'var(--surface)', border:'1px solid var(--line2)', borderRadius:'var(--r)', boxShadow:'var(--shadow-lg)', maxHeight:280, display:'flex', flexDirection:'column' }}>
              <div style={{ padding:'8px', borderBottom:'1px solid var(--line)', flexShrink:0 }}>
                <input autoFocus placeholder="Search fonts…" value={search} onChange={e => setSearch(e.target.value)}
                  style={{ width:'100%', padding:'5px 8px', border:'1px solid var(--line)', borderRadius:'var(--r-sm)', fontSize:12, background:'var(--surface2)', color:'var(--ink)', outline:'none', boxSizing:'border-box' }} />
              </div>
              <div style={{ overflowY:'auto', flex:1 }}>
                {filtered.map(fn => {
                  loadGoogleFont(fn.value)
                  return (
                    <button key={fn.value} onClick={() => { f(fieldKey, fn.value); setOpen(false); setSearch('') }}
                      style={{ width:'100%', padding:'10px 12px', background: fn.value === val ? 'var(--accent-bg)' : 'transparent', border:'none', borderBottom:'1px solid var(--line)', cursor:'pointer', textAlign:'left', fontFamily:fn.value, fontSize:16, color:'var(--ink)', display:'block' }}>
                      {fn.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
        
      </div>
    )
  }

  return (
    <>
      <SH n={5} title="Build your brand experience" sub="Every change updates the preview instantly." />

      {/* Assets */}
      <Section title="Identity Assets">
        <div className="grid2">
          <div>
            <label className="label">Logo</label>
            <div className="label-sub mb-8">Shown in chat header.</div>
            <input ref={logoRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e=>handleFile(e,'logo_url')} />
            {bot.logo_url ? (
              <div className="flex ic g8">
                <img src={bot.logo_url} alt="logo" style={{ height:28, maxWidth:80, objectFit:'contain', borderRadius:4, border:'1px solid var(--line)' }} />
                <button className="btn btn-secondary btn-xs" onClick={()=>logoRef.current?.click()}>Replace</button>
                <button className="btn btn-danger btn-xs" onClick={()=>f('logo_url',null)}>✕</button>
              </div>
            ) : <button className="btn btn-secondary btn-sm" onClick={()=>logoRef.current?.click()}>Upload logo</button>}
          </div>
          <div>
            <label className="label">Bot avatar</label>
            <div className="label-sub mb-8">Replaces the letter initial.</div>
            <input ref={avatarRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e=>handleFile(e,'avatar_url')} />
            {bot.avatar_url ? (
              <div className="flex ic g8">
                <div style={{ width:36, height:36, borderRadius:'50%', overflow:'hidden', border:'1px solid var(--line)' }}>
                  <img src={bot.avatar_url} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                </div>
                <button className="btn btn-secondary btn-xs" onClick={()=>avatarRef.current?.click()}>Replace</button>
                <button className="btn btn-danger btn-xs" onClick={()=>f('avatar_url',null)}>✕</button>
              </div>
            ) : <button className="btn btn-secondary btn-sm" onClick={()=>avatarRef.current?.click()}>Upload avatar</button>}
          </div>
        </div>
        
      </Section>

      {/* Colour Presets */}
      <Section title="Colour Presets" sub="Pick a starting point then customise below.">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:4 }}>
          {[
            {
              name:'Parchment',
              preview:['#3B2B23','#F6F1E7','#c1b69f'],
              apply:{ primary_color:'#3B2B23', bg_color:'#F6F1E7', header_color:'#c1b69f', header_text_color:'#3B2B23', bot_name_color:'#3B2B23', descriptor_color:'#1f170f', welcome_color:'#211a12', chat_font_color:'#000000', online_color:'#2d6a4f', input_area_color:'#c0b69f', input_bg_color:'#FFFFFF', placeholder_color:'#C9AD8E', input_text_color:'#3B2B23', bot_bubble_color:'#c0b69f', user_bubble_color:'#f8d17c' }
            },
            {
              name:'Midnight',
              preview:['#818cf8','#0f172a','#1e1b4b'],
              apply:{ primary_color:'#818cf8', bg_color:'#0f172a', header_color:'#1e1b4b', header_text_color:'#e0e7ff', bot_name_color:'#e0e7ff', descriptor_color:'#a5b4fc', welcome_color:'#c7d2fe', chat_font_color:'#e0e7ff', online_color:'#6ee7b7', input_area_color:'#1e1b4b', input_bg_color:'#0f172a', placeholder_color:'#4f46e5', input_text_color:'#e0e7ff', bot_bubble_color:'#312e81', user_bubble_color:'#818cf8' }
            },
            {
              name:'Forest',
              preview:['#001f11','#003d18','#092c07'],
              apply:{ primary_color:'#001f11', bg_color:'#003d18', header_color:'#092c07', header_text_color:'#a3ffd9', bot_name_color:'#a3ffd9', descriptor_color:'#57ffb3', welcome_color:'#ffffff', chat_font_color:'#ffffff', online_color:'#40916c', input_area_color:'#092c07', input_bg_color:'#7ca287', placeholder_color:'#74c69d', input_text_color:'#ffffff', bot_bubble_color:'#000000', user_bubble_color:'#2d6a4f' }
            },
            {
              name:'Sunset',
              preview:['#ea580c','#fff7ed','#ffedd5'],
              apply:{ primary_color:'#ea580c', bg_color:'#fff7ed', header_color:'#ffedd5', header_text_color:'#7c2d12', bot_name_color:'#7c2d12', descriptor_color:'#c2410c', welcome_color:'#c2410c', chat_font_color:'#431407', online_color:'#16a34a', input_area_color:'#ffedd5', input_bg_color:'#ffffff', placeholder_color:'#fb923c', input_text_color:'#7c2d12', bot_bubble_color:'#ffffff', user_bubble_color:'#ea580c' }
            },
            {
              name:'Ocean',
              preview:['#032b3f','#f0f9ff','#b3e0ff'],
              apply:{ primary_color:'#032b3f', bg_color:'#f0f9ff', header_color:'#b3e0ff', header_text_color:'#000000', bot_name_color:'#000000', descriptor_color:'#002b42', welcome_color:'#0369a1', chat_font_color:'#000000', online_color:'#009465', input_area_color:'#abd6f2', input_bg_color:'#74b9b4', placeholder_color:'#7dd3fc', input_text_color:'#000000', bot_bubble_color:'#ffffff', user_bubble_color:'#74a2b9' }
            },
            {
              name:'Rose',
              preview:['#be185d','#fff1f2','#ffe4e6'],
              apply:{ primary_color:'#be185d', bg_color:'#fff1f2', header_color:'#ffe4e6', header_text_color:'#881337', bot_name_color:'#881337', descriptor_color:'#be185d', welcome_color:'#be185d', chat_font_color:'#4c0519', online_color:'#16a34a', input_area_color:'#ffe4e6', input_bg_color:'#ffffff', placeholder_color:'#fb7185', input_text_color:'#881337', bot_bubble_color:'#ffffff', user_bubble_color:'#be185d' }
            },
            {
              name:'Charcoal',
              preview:['#f8fafc','#1e293b','#0f172a'],
              apply:{ primary_color:'#94a3b8', bg_color:'#1e293b', header_color:'#0f172a', header_text_color:'#f8fafc', bot_name_color:'#f8fafc', descriptor_color:'#94a3b8', welcome_color:'#cbd5e1', chat_font_color:'#e2e8f0', online_color:'#4ade80', input_area_color:'#0f172a', input_bg_color:'#1e293b', placeholder_color:'#94a3b8', input_text_color:'#f8fafc', bot_bubble_color:'#334155', user_bubble_color:'#94a3b8' }
            },
            {
              name:'Amber',
              preview:['#f59e0b','#09090e','#1a1000'],
              apply:{ primary_color:'#f59e0b', bg_color:'#09090e', header_color:'#1a1000', header_text_color:'#fef3c7', bot_name_color:'#fbbf24', descriptor_color:'#d97706', welcome_color:'#d97706', chat_font_color:'#fef3c7', online_color:'#f59e0b', input_area_color:'#1a1000', input_bg_color:'#09090e', placeholder_color:'#d97706', input_text_color:'#fef3c7', bot_bubble_color:'#1c1400', user_bubble_color:'#f59e0b' }
            },
          ].map(p => (
            <button key={p.name} onClick={() => Object.entries(p.apply).forEach(([k,v]) => f(k,v))}
              style={{ padding:'10px 6px', borderRadius:'var(--r)', border:'1px solid var(--line)', background:'var(--surface)', cursor:'pointer', transition:'all 0.12s', display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
              <div style={{ display:'flex', gap:3 }}>
                {p.preview.map((c,i) => <div key={i} style={{ width:16, height:16, borderRadius:'50%', background:c, border:'1px solid rgba(0,0,0,0.1)' }} />)}
              </div>
              <span style={{ fontSize:10, color:'var(--ink3)', fontWeight:500 }}>{p.name}</span>
            </button>
          ))}
        </div>
      </Section>

      {/* Colours */}
      <Section title="Colours">
        <div className="grid2">
          {[
            ['Background colour','bg_color'],
            ['Header colour','header_color'],
            ['Bot name colour','bot_name_color'],
            ['Descriptor colour','descriptor_color'],
            ['Welcome message colour','welcome_color'],
            ['Chat font colour','chat_font_color'],
            ['Online status colour','online_color'],
            ['Input bar colour','input_bg_color'],
            ['Input area colour','input_area_color'],
            ['Placeholder colour','placeholder_color'],
            ['Input text colour','input_text_color'],
            ['Send button colour','primary_color'],
            ['Bot bubble colour','bot_bubble_color'],
            ['User bubble colour','user_bubble_color'],
          ].map(([lbl,field])=>(
            <div key={field} className="field" style={{ marginBottom:0 }}>
              <label className="label">{lbl}</label>
              <div className="flex ic g8">
                <div style={{ width:34, height:34, borderRadius:'var(--r-sm)', border:'1px solid var(--line)', overflow:'hidden', flexShrink:0, position:'relative' }}>
                  <input type="color" value={bot[field]||'#ffffff'} onChange={e=>f(field,e.target.value)} style={{ position:'absolute', inset:-4, width:'calc(100% + 8px)', height:'calc(100% + 8px)', border:'none', cursor:'pointer', padding:0 }} />
                </div>
                <input className="input input-sm" style={{ flex:1, fontFamily:'monospace' }} value={bot[field]||''} onChange={e=>f(field,e.target.value)} />
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Background image */}
      <Section title="Background Image" sub="Optional. Will be dimmed automatically for readability.">
        <input ref={bgRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e=>handleFile(e,'bg_image_url')} />
        {bot.bg_image_url ? (
          <div>
            <div style={{ width:'100%', height:56, borderRadius:'var(--r)', overflow:'hidden', border:'1px solid var(--line)', marginBottom:8 }}>
              <img src={bot.bg_image_url} alt="bg" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            </div>
            <div className="flex g6 mb-12">
              <button className="btn btn-secondary btn-xs" onClick={()=>bgRef.current?.click()}>Replace</button>
              <button className="btn btn-danger btn-xs" onClick={()=>f('bg_image_url',null)}>Remove</button>
            </div>
            <Slider label="Overlay darkness" field="bg_overlay" min={0} max={100} step={0.1} unit="%" leftLabel="Lighter" rightLabel="Darker" bot={bot} f={f} />
          </div>
        ) : <button className="btn btn-secondary btn-sm" onClick={()=>bgRef.current?.click()}>Upload background image</button>}
      </Section>

      {/* Texture overlays */}
      <Section title="Texture Overlay" sub="Covers the whole chat view.">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:14 }}>
          {OVERLAYS.map(o=>(
            <button key={o.id} onClick={()=>f('texture_overlay',o.id)}
              style={{ padding:'8px 4px', borderRadius:'var(--r)', border:`1.5px solid ${bot.texture_overlay===o.id?'var(--coffee-0)':'var(--line)'}`, background:bot.texture_overlay===o.id?'var(--coffee-0)':'var(--surface)', cursor:'pointer', fontSize:11, fontWeight:500, color:bot.texture_overlay===o.id?'var(--parch-1)':'var(--ink3)', transition:'all 0.12s', textAlign:'center' }}>
              {o.label}
            </button>
          ))}
        </div>
        {bot.texture_overlay && bot.texture_overlay !== 'none' && (
          <Slider label="Intensity" field="texture_intensity" min={0} max={100} step={1} unit="%" leftLabel="Subtle" rightLabel="Strong" bot={bot} f={f} />
        )}
      </Section>

      {/* Image effects */}
      <Section title="Image Effect" sub="Only affects the background image.">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
          {IMAGE_EFFECTS.map(o=>(
            <button key={o.id} onClick={()=>f('image_effect',o.id)}
              style={{ padding:'8px 4px', borderRadius:'var(--r)', border:`1.5px solid ${bot.image_effect===o.id?'var(--coffee-0)':'var(--line)'}`, background:bot.image_effect===o.id?'var(--coffee-0)':'var(--surface)', cursor:'pointer', fontSize:11, fontWeight:500, color:bot.image_effect===o.id?'var(--parch-1)':'var(--ink3)', transition:'all 0.12s', textAlign:'center' }}>
              {o.label}
            </button>
          ))}
        </div>
        {bot.image_effect && bot.image_effect !== 'none' && (
          <Slider label="Intensity" field="image_effect_intensity" min={0} max={100} step={1} unit="%" leftLabel="Subtle" rightLabel="Strong" bot={bot} f={f} />
        )}
      </Section>

      {/* Typography */}
      <Section title="Typography">
        <FontSelect label="Title / Bot name font" fieldKey="title_font" />
        <FontSelect label="Body / Chat font"      fieldKey="body_font" />
        <Slider label="Base text size"    field="font_size" min={10} max={22} step={0.1} unit="px" bot={bot} f={f} />
      </Section>

      {/* Shape */}
      <Section title="Shape & Form">
        <Slider label="Border radius"  field="border_radius" min={0} max={32} step={0.1} unit="px" leftLabel="Sharp"   rightLabel="Rounded" bot={bot} f={f} />
        <div style={{ display:'flex', gap:8, marginBottom:14 }}>
          {[{v:'filled',l:'Filled'},{v:'outlined',l:'Outlined'},{v:'minimal',l:'Minimal'}].map(o=>(
            <button key={o.v} onClick={()=>f('bubble_style',o.v)} style={{ flex:1, padding:'8px', borderRadius:'var(--r)', border:`1px solid ${bot.bubble_style===o.v?'var(--coffee-0)':'var(--line)'}`, background:bot.bubble_style===o.v?'var(--coffee-0)':'var(--surface)', color:bot.bubble_style===o.v?'var(--parch-1)':'var(--ink3)', cursor:'pointer', fontSize:12, fontWeight:500, transition:'all 0.12s' }}>{o.l}</button>
          ))}
        </div>
      </Section>

      {/* Layout controls */}
      <Section title="Layout & Spacing">
        <Slider label="Header height"    field="header_height" min={40} max={90} step={0.1} unit="px" bot={bot} f={f} />
        <Slider label="Overall spacing"  field="spacing" min={4} max={32} step={0.1} unit="px" leftLabel="Tight" rightLabel="Spacious" bot={bot} f={f} />
        <Slider label="Logo size"        field="logo_size" min={12} max={60} step={0.1} unit="px" bot={bot} f={f} />
      </Section>

      {/* Opacity controls */}
      <Section title="Opacity & Visibility">
        <Slider label="Text opacity"     field="text_opacity" min={30} max={100} step={0.1} unit="%" leftLabel="Subtle" rightLabel="Full" bot={bot} f={f} />
        <Slider label="Panel opacity"    field="panel_opacity" min={20} max={100} step={0.1} unit="%" leftLabel="Transparent" rightLabel="Solid" bot={bot} f={f} />
      </Section>

      {/* CTA */}
      <Section title="Optional Links">
        <div className="grid2">
          <div className="field" style={{ marginBottom:0 }}><label className="label">CTA text</label><input className="input input-sm" placeholder="Book a call" value={bot.cta_text||''} onChange={e=>f('cta_text',e.target.value)} /></div>
          <div className="field" style={{ marginBottom:0 }}><label className="label">CTA URL</label><input className="input input-sm" placeholder="https://…" value={bot.cta_url||''} onChange={e=>f('cta_url',e.target.value)} /></div>
        </div>
        <div className="field mt-8" style={{ marginBottom:0 }}><label className="label">Support email</label><input className="input input-sm" placeholder="support@yoursite.com" value={bot.support_email||''} onChange={e=>f('support_email',e.target.value)} /></div>
      </Section>
    </>
  )
}

// ── Step 6: Personality ───────────────────────────────────────────────────────
function StepPersonality({ bot, f }) {
  const Row = ({ label, desc, field, opts }) => (
    <div style={{ paddingBottom:16, marginBottom:16, borderBottom:'1px solid var(--line)' }}>
      <div style={{ fontSize:13.5, fontWeight:500, color:'var(--ink)', marginBottom:2 }}>{label}</div>
      <div style={{ fontSize:12, color:'var(--ink4)', marginBottom:10, lineHeight:1.5 }}>{desc}</div>
      <div className="flex wrap g6">
        {opts.map(o=>(
          <button key={o.v} onClick={()=>f(field,o.v)}
            style={{ padding:'5px 13px', borderRadius:20, border:`1px solid ${bot[field]===o.v?'var(--coffee-0)':'var(--line)'}`, background:bot[field]===o.v?'var(--coffee-0)':'var(--surface)', color:bot[field]===o.v?'var(--parch-1)':'var(--ink3)', fontSize:12.5, cursor:'pointer', transition:'all 0.12s', fontFamily:'var(--font-body)' }}>
            {o.l}
          </button>
        ))}
      </div>
    </div>
  )
  return (
    <>
      <SH n={6} title="Define the personality" sub="Your bot should sound like a deliberate representative of your brand — not a generic AI." />
      {bot.use_case && (
        <div className="alert alert-info mb-20" style={{ fontSize:12.5 }}>
          ✓ Pre-configured for <strong>{USE_CASES.find(u=>u.id===bot.use_case)?.label}</strong>. Adjust anything below.
        </div>
      )}
      <Row label="Tone" desc="How does your assistant communicate?" field="tone" opts={[{v:'warm',l:'Warm'},{v:'professional',l:'Professional'},{v:'expert',l:'Expert'},{v:'educational',l:'Educational'},{v:'direct',l:'Direct'},{v:'consultative',l:'Consultative'},{v:'premium',l:'Premium'}]} />
      <Row label="Response length" desc="How much does it say per answer?" field="response_length" opts={[{v:'short',l:'Concise'},{v:'balanced',l:'Balanced'},{v:'detailed',l:'Detailed'}]} />
      <Row label="Initiative" desc="How proactively does it guide?" field="initiative" opts={[{v:'reactive',l:'Just answers'},{v:'followup',l:'Asks follow-ups'},{v:'proactive',l:'Guides proactively'}]} />
      <Row label="Writing style" field="writing_style" desc="How does it structure responses?" opts={[{v:'conversational',l:'Conversational'},{v:'polished',l:'Polished'},{v:'educational',l:'Educational'},{v:'support',l:'Support-focused'}]} />
      <Row label="Emoji use" field="emoji_use" desc="How often does it use emoji?" opts={[{v:'none',l:'None'},{v:'minimal',l:'Minimal'},{v:'moderate',l:'Moderate'}]} />
    </>
  )
}

// ── Step 7: Test ──────────────────────────────────────────────────────────────
function StepTest({ bot }) {
  const [msgs,    setMsgs]    = useState([{ role:'bot', content:bot.greeting||`Hi! I'm ${bot.name}. How can I help?` }])
  const [input,   setInput]   = useState('')
  const [thinking,setThinking]= useState(false)
  const primary = bot.primary_color||'#2C1810'
  const r = `${bot.border_radius??12}px`

  async function send() {
    const t = input.trim(); if (!t||thinking) return
    setInput('')
    setMsgs(p=>[...p,{ role:'user', content:t }])
    setThinking(true)
    try {
      const kbText = buildKbText(bot.knowledge_entries||[], bot.knowledge_text||'')
      const botWithKb = { ...bot, knowledge_text: kbText }
      const history = msgs.map(m=>({ role:m.role==='bot'?'assistant':'user', content:m.content }))
      const reply = await callClaude({ system:buildBotSystem(botWithKb), messages:history, userMessage:t, allowWeb:bot.allow_web })
      setMsgs(p=>[...p,{ role:'bot', content:reply }])
    } catch { setMsgs(p=>[...p,{ role:'bot', content:'Error — check your API key.' }]) }
    setThinking(false)
  }

  return (
    <>
      <SH n={7} title="Test before you launch" sub="Have a real conversation. Make sure the answers feel right." />
      <div style={{ border:'1px solid var(--line)', borderRadius:'var(--r-lg)', overflow:'hidden', height:380, display:'flex', flexDirection:'column', background:'var(--surface)' }}>
        <div style={{ flex:1, overflowY:'auto', padding:'14px 16px', display:'flex', flexDirection:'column', gap:10 }}>
          {msgs.map((m,i)=>(
            <div key={i} style={{ display:'flex', gap:8, maxWidth:'84%', alignSelf:m.role==='user'?'flex-end':'flex-start', flexDirection:m.role==='user'?'row-reverse':'row' }}>
              <div style={{ width:22, height:22, borderRadius:6, flexShrink:0, background:m.role==='bot'?primary:'var(--surface3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, color:m.role==='bot'?'white':'var(--ink3)', marginTop:2 }}>
                {m.role==='bot'?(bot.avatar_letter||bot.name?.charAt(0)||'B').toUpperCase():'U'}
              </div>
              <div style={{ padding:'9px 12px', borderRadius:m.role==='bot'?`3px ${r} ${r} ${r}`:`${r} 3px ${r} ${r}`, background:m.role==='user'?primary:'var(--surface2)', border:m.role==='bot'?'1px solid var(--line)':'none', color:m.role==='user'?'white':'var(--ink)', fontSize:13.5, lineHeight:1.65 }}
                dangerouslySetInnerHTML={m.role==='bot'?{__html:renderMarkdown(m.content)}:undefined}>
                {m.role==='user'?m.content:undefined}
              </div>
            </div>
          ))}
          {thinking && (
            <div style={{ display:'flex', gap:8, maxWidth:'84%' }}>
              <div style={{ width:22, height:22, borderRadius:6, background:primary, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, color:'white', marginTop:2 }}>{(bot.avatar_letter||bot.name?.charAt(0)||'B').toUpperCase()}</div>
              <div style={{ padding:'10px 14px', borderRadius:`3px ${r} ${r} ${r}`, background:'var(--surface2)', border:'1px solid var(--line)', display:'flex', gap:4 }}>
                {[0,1,2].map(i=><div key={i} style={{ width:5, height:5, borderRadius:'50%', background:'var(--coffee-4)', animation:'blink 1.3s infinite', animationDelay:`${i*0.18}s` }}/>)}
              </div>
            </div>
          )}
        </div>
        <div style={{ padding:'10px 12px', borderTop:'1px solid var(--line)', display:'flex', gap:8 }}>
          <input className="input input-sm" style={{ flex:1 }} placeholder="Ask your bot something…" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} />
          <button style={{ width:32, height:32, borderRadius:`${Math.min(bot.border_radius??12,9)}px`, background:primary, border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:input.trim()&&!thinking?'pointer':'not-allowed', opacity:input.trim()&&!thinking?1:0.4 }} onClick={send} disabled={!input.trim()||thinking}>
            <I.Send width={13} height={13} style={{ color:'white' }} />
          </button>
        </div>
      </div>
      <div className="alert alert-neutral mt-12" style={{ fontSize:12.5 }}>
        More specific knowledge base content = better answers. If it's not answering well, add more entries.
      </div>
    </>
  )
}

// ── Step 8: Publish ───────────────────────────────────────────────────────────
function StepPublish({ bot, sub }) {
  const [copied, setCopied] = useState(false)
  const url = `${window.location.origin}/dashboard?bot=${bot.id||'preview'}&widget=true`
  const ucName = USE_CASES.find(u=>u.id===bot.use_case)?.label||'—'
  const entryCount = (bot.knowledge_entries||[]).filter(e=>e.enabled!==false).length
  const checks = [
    { label:'Use case',      done:!!bot.use_case,           value:ucName },
    { label:'Bot name',      done:!!bot.name?.trim(),        value:bot.name||'—' },
    { label:'Knowledge',     done:entryCount>0,              value:`${entryCount} entries` },
    { label:'Primary colour',done:true,                      value:bot.primary_color||'#2C1810' },
    { label:'Tone',          done:true,                      value:bot.tone||'Professional' },
  ]
  return (
    <>
      <SH n={8} title="Ready to launch" sub="Review your setup. Once published your bot link is live immediately." />
      <div className="mb-20">
        {checks.map((c,i)=>(
          <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 0', borderBottom:i<checks.length-1?'1px solid var(--line)':'none' }}>
            <div style={{ width:20, height:20, borderRadius:'50%', flexShrink:0, background:c.done?'var(--success-bg)':'var(--warn-bg)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              {c.done?<I.Check width={10} height={10} style={{ color:'var(--success)' }}/>:<span style={{ fontSize:9, color:'var(--warn)', fontWeight:700 }}>!</span>}
            </div>
            <span style={{ flex:1, fontSize:13.5, fontWeight:500, color:'var(--ink)' }}>{c.label}</span>
            <span style={{ fontSize:12.5, color:'var(--ink3)' }}>{c.value}</span>
          </div>
        ))}
      </div>
      <div style={{ padding:'14px 16px', borderRadius:'var(--r-md)', background:'var(--surface)', border:'1px solid var(--line)', marginBottom:14 }}>
        <div className="label mb-8">Your bot link</div>
        <div className="flex ic g8" style={{ padding:'8px 12px', background:'var(--surface2)', border:'1px solid var(--line)', borderRadius:'var(--r)' }}>
          <span style={{ flex:1, fontSize:12, color:'var(--coffee-3)', fontFamily:'monospace', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{url}</span>
          <button className="btn btn-primary btn-xs" onClick={()=>{ navigator.clipboard.writeText(url).catch(()=>{}); setCopied(true); setTimeout(()=>setCopied(false),2000) }}>
            <I.Copy width={11} height={11}/> {copied?'Copied!':'Copy'}
          </button>
        </div>
        <div className="label-sub mt-8">Live immediately after you publish.</div>
      </div>
      <div className="alert alert-neutral" style={{ fontSize:12.5 }}>You can edit everything after publishing. Changes take effect immediately.</div>
    </>
  )
}

// ── Shared section wrapper ────────────────────────────────────────────────────
function Section({ title, sub, children }) {
  return (
    <div style={{ marginBottom:22, paddingBottom:22, borderBottom:'1px solid var(--line)' }}>
      <div style={{ marginBottom:12 }}>
        <div style={{ fontSize:13, fontWeight:600, color:'var(--ink)' }}>{title}</div>
        {sub && <div style={{ fontSize:12, color:'var(--ink4)', marginTop:2 }}>{sub}</div>}
      </div>
      {children}
    </div>
  )
}
