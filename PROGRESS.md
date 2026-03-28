# Lunch Bots — Progress Tracker

## Project
- Name: Lunch Bots
- Stack: React + Vite + Supabase + Anthropic API
- Supabase URL: https://vklbfvfrfcncpsslnivm.supabase.co

## URLs
- Main app:   http://localhost:5173
- Admin:      http://localhost:5173?mode=admin
- Bot link:   http://localhost:5173?bot=BOT_ID

## Admin password: admin (changeable in AdminView.jsx line 4)

## Layer 1 Status: ✅ COMPLETE
Built:
- Supabase schema (subscribers, bots, conversations, messages, knowledge_gaps, feedback)
- Auth flow (signup, email verify, login) using Supabase Auth
- 7-step bot wizard with live preview panel
- Creator dashboard with stats, share link, inbox preview
- Inbox page (answer knowledge gaps → auto-added to KB)
- Customer-facing chat with full branding
- Super admin panel (overview, subscribers, bots)
- Parchment/coffee aesthetic design system

## Layer 2 — Next (Knowledge system improvements)
- FAQ management UI
- Multiple knowledge source types
- Better knowledge gap detection

## Layer 3 — Feedback system
## Layer 4 — Insights
## Layer 5 — Super admin (full)
## Layer 6 — Polish + motion

## Setup Steps
1. npm install
2. Add .env with VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_ANTHROPIC_API_KEY
3. Run schema.sql in Supabase SQL Editor
4. npm run dev
Got it — Lunch Bots (two words).
Let me build the full Layer 1 now. This will be a complete, clean project.Created 16 files, ran a commandCreated 16 files, ran a commandNow zip it all up:Ran 2 commands, read a fileRan 2 commands, read a fileHere's Lunch Bots Layer 1 — complete fresh start. Here's your exact setup sequence:
Step 1 — Run the SQL schema

Go to supabase.com → your project → SQL Editor
Open schema.sql from the zip and paste the entire thing
Click Run — you'll see "Lunch Bots schema created successfully"

Step 2 — Set up the project

Unzip lunchbots.zip somewhere on your Mac
Open the lunchbots folder in VS Code
Open .env and add your Anthropic API key on the third line
In terminal: npm install then npm run dev

Step 3 — Your URLs
URLPurposelocalhost:5173Creator signup / dashboardlocalhost:5173?mode=adminSuper admin (password: admin)localhost:5173?bot=BOT_IDCustomer chat
What's included in Layer 1:

✅ Real Supabase auth (signup, email verification, login)
✅ 7-step wizard with live phone preview
✅ Full branding controls (colours, fonts, images, radius, bubbles)
✅ Creator dashboard with stats and share link
✅ Inbox — answer knowledge gaps, auto-adds to KB
✅ Customer chat with full branding applied
✅ Super admin panel
✅ Parchment/coffee aesthetic throughout
✅ PROGRESS.md to track sessions
## Layer 3 Status: ✅ COMPLETE
- Customer + Internal bot types with password gate
- Landing page (Ask / Feedback) 
- Full feedback flows (card for customer, messenger for internal)
- Two-way feedback conversations
- AI feedback summaries auto-generated on submission
- AI insights page
- Dashboard analytics with 7-day chart
- Inline inbox answering

## Next session priorities:
1. Verify feedback summary auto-display is working
2. Polish & visual improvements
3. Deploy to Vercel

# Lunch Bots — Progress Tracker

## Project
- Name: Lunch Bots
- Stack: React + Vite + Supabase + Anthropic API + Vercel
- Supabase URL: https://vklbfvfrfcncpsslnivm.supabase.co
- Live URL: https://lunchbots.vercel.app
- GitHub: https://github.com/Robduediligence/Lunchbots

## URLs
- Local dev:   http://localhost:5173
- Bot link:    https://lunchbots.vercel.app?bot=BOT_ID
- Admin panel: https://lunchbots.vercel.app?mode=admin

## Admin password: admin (changeable in AdminView.jsx line 4)

## Phase 1 Status: ✅ COMPLETE — Foundation Hardened

### Authentication & Accounts ✅
- Supabase Auth with email/password and email verification
- Every creator has a real account tied to their bots server-side
- Session management with auth state listener

### Real Database ✅
- Full Supabase Postgres schema
- Tables: subscribers, bots, conversations, messages, knowledge_gaps, feedback, feedback_replies
- Row Level Security (RLS) policies applied — creators can only see their own data
- Public can insert conversations, messages, gaps, feedback

### Bot Builder ✅
- 8-step wizard: UseCase → Identity → Knowledge → Capabilities → Branding → Personality → Test → Publish
- Live preview panel (desktop only)
- 50 Google Fonts, 3 font selectors
- Full branding controls (colours, fonts, images, radius, bubbles, textures, sliders)
- Two bot types: Customer-facing and Internal (password-gated)
- 6 use case presets (Support, Sales, Onboarding, Internal Knowledge, Training, Intake)
- AI auto-title and auto-categorise knowledge entries on content paste (800ms debounce)
- Knowledge entry types: customer (products/pricing/ordering/delivery/policies/support/faq)
  and internal (sop/policies/training/troubleshoot/product/updates/hr/safety/tools)
- File upload support (PDF, Word, TXT)
- Priority levels (Primary/Secondary/Background)

### Customer-Facing Chat ✅
- Full branding applied from bot settings
- Landing screen: Ask a question / Leave feedback
- Active chat with streaming-style responses
- Fallback detection → knowledge gap created → polling for admin answer
- Suggested prompts support
- Markdown rendering

### Internal Bot ✅
- Password gate on entry
- Landing screen: Ask / Message the team
- Messenger-style feedback UI with thread list + conversation view
- Two-way conversations (admin replies visible to user)
- Session persistence via localStorage

### Feedback System ✅
- Customer feedback: card form, anonymous toggle, optional name/contact
- Internal feedback: messenger-style UI
- Two-way conversations (admin replies, user can reply back)
- AI feedback summaries triggered automatically on submission
- Summary saved to bots.feedback_summary for instant load

### Admin Dashboard ✅
- 6 stat cards: total conversations, unique users, messages sent, this week, feedback received, inbox items
- 7-day activity bar chart
- Bot switcher
- Share link with copy button
- Recent conversations table
- Inbox preview with inline answering
- Knowledge base preview with word count

### Inbox Page ✅
- Knowledge gaps listed with questions
- Click to expand inline answer form
- Answer saved to knowledge base automatically as FAQ entry
- Answer sent to waiting user via polling

### Feedback Admin Page ✅
- Full feedback list with status (New/Replied)
- Click any row → reply panel slides in
- Full conversation thread view
- Admin can reply, user sees reply on their end
- AI summary of all feedback trends (auto-generated on new submission)
- Shows top themes, sentiment, urgent issues, suggestions

### Insights Page ✅
- AI-generated analysis of all conversations
- Summary, top topics, user sentiment, knowledge gaps, recommendations
- Generate insights button

### Settings Page ✅
- Change password
- Sign out

### Super Admin Panel ✅
- Overview stats
- Subscriber list
- Bot list
- Password: admin (changeable in AdminView.jsx line 4)

### Security ✅
- Anthropic API key server-side only in api/claude.js
- Rate limiting: 30 req/min on claude proxy, 10 emails/min on notify
- RLS policies on all tables
- Input sanitisation on chat messages, knowledge entries, and feedback
- .env in .gitignore

### Email Notifications ✅
- Resend integration via api/notify.js
- Triggers: knowledge gap created, feedback submitted
- Sends to subscriber's email from Supabase subscribers table
- FROM_EMAIL=onboarding@resend.dev (free tier)
- Env vars: RESEND_API_KEY, FROM_EMAIL in Vercel

### Deployment ✅
- Vercel connected to GitHub, auto-deploys on push to main
- Environment variables set in Vercel:
  VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, ANTHROPIC_API_KEY, RESEND_API_KEY, FROM_EMAIL
- Local dev uses VITE_ANTHROPIC_API_KEY directly
- Production routes through /api/claude proxy

### Mobile Responsiveness ✅ (partial)
- Dashboard stat cards responsive
- Nav stacks vertically on mobile (logo above pill)
- Wizard preview hidden on mobile
- Bot switcher scrolls horizontally
- Pending: mobile pill full-width fix still in progress

---

## Phase 2 — Next Priorities

### Immediate (do next):
1. Fix mobile nav pill full width
2. Visual polish — parchment aesthetic, typography, spacing, animations
3. Custom domain — buy lunchbots.app or similar
4. Terms of Service + Privacy Policy (use Termly)

### Soon:
5. Stripe billing — Starter/Creator/Pro tiers with message limits
6. Onboarding flow — new signup → wizard immediately
7. Bot management — duplicate, archive, delete bots
8. Sentry error monitoring

### Pre-launch:
9. Landing page (separate marketing site)
10. Waitlist
11. Find first 10 creators manually
12. Soft launch to waitlist

---

## Key Code Patterns

### callClaude (src/lib/supabase.js)
Routes to /api/claude in production, direct Anthropic in dev.
Includes bot context (internal vs customer-facing).

### buildBotSystem
Compiles knowledge_entries + knowledge_text into system prompt.
Includes bot_type context.

### saveBot
Explicitly whitelists all known columns before saving.
Prevents React internals from being serialised.

### triggerFeedbackSummary (src/views/ChatView.jsx)
Top-level async function — shared between CustomerFeedback and InternalMessaging.
Fires on feedback submission, saves summary to bots.feedback_summary.

## Git Workflow
git add .
git commit -m "description"
git push origin main   # triggers Vercel auto-deploy

## Multi-machine workflow
On new computer: git clone https://github.com/Robduediligence/Lunchbots
Use GitHub Personal Access Token as password (not account password)
Run: rm -rf node_modules && npm install