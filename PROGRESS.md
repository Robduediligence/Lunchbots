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

Project: Lunch Bots

Stack: React + Vite + Supabase + Anthropic API
Live: https://lunchbots.vercel.app
GitHub: https://github.com/Robduediligence/Lunchbots
Local dev: http://localhost:5175

What we were just working on:
We tried to make the dashboard remember which page (Dashboard/Inbox/Feedback/Insights) and which bot was active when you refresh the browser. The approach was to write ?page=feedback&activeBotId=xxx to the URL using window.history.replaceState and read it back on load.
It's not working — refreshing still goes to the Dashboard of the newest bot. The URL params approach got messy across App.jsx and DashboardView.jsx and caused a blank screen at one point.
Please try a simpler approach using localStorage instead:

When the user changes page or switches bot, save { page, botId } to localStorage
On load, read from localStorage and restore the last page and bot
This avoids touching the URL routing entirely

Key files:

src/App.jsx — routing, session check, passes bot prop to DashboardView
src/views/DashboardView.jsx — has page and activeBot state, setPage and setActiveBot functions

# Lunch Bots — Progress Tracker

## Project
- Name: Lunch Bots
- Stack: React + Vite + Supabase + Anthropic API + Vercel
- Supabase URL: https://vklbfvfrfcncpsslnivm.supabase.co
- Live URL: https://lunchbots.vercel.app
- GitHub: https://github.com/Robduediligence/Lunchbots
- Local dev: http://localhost:5175

## Admin password: admin (changeable in AdminView.jsx line 4)

---

## Phase 1: Foundation ✅ COMPLETE
- Supabase Auth (email/password, email verification)
- Full Postgres schema: subscribers, bots, conversations, messages, knowledge_gaps, feedback, feedback_replies
- Row Level Security on all tables
- 8-step bot wizard with live preview
- Two bot types: Customer-facing and Internal (password-gated)
- Customer chat with streaming, fallback detection, suggested prompts, markdown
- Internal bot with messenger-style feedback UI
- Two-way feedback conversations
- AI feedback summaries
- Inbox with inline answering (auto-adds to knowledge base)
- Insights page (AI-generated analysis)
- Dashboard with 6 stat cards + 7-day activity chart
- Bot switcher
- Settings page (change password, sign out)
- Super admin panel
- Anthropic API key server-side only (api/claude.js)
- Rate limiting on claude proxy + email notifications
- Resend email notifications (knowledge gaps + feedback)
- RLS policies on all tables
- Input sanitisation
- Vercel deployment + GitHub auto-deploy

## Phase 2: Infrastructure ✅ MOSTLY COMPLETE
- Vercel connected to GitHub, auto-deploys on push to main
- Environment variables set in Vercel
- Local dev uses VITE_ANTHROPIC_API_KEY directly
- Production routes through /api/claude proxy
- Mobile responsiveness (partial — nav, wizard, bot switcher)

### Phase 2 remaining:
- [ ] Custom domain (buy lunchbots.app or similar)
- [ ] Sentry error monitoring
- [ ] Staging environment

---

## Phase 3: Billing ❌ NOT STARTED
- [ ] Stripe integration
- [ ] Starter / Creator / Pro tiers
- [ ] Message limits per plan
- [ ] Billing page in dashboard
- [ ] Upgrade prompts when limits hit
- [ ] Webhooks for subscription events

## Phase 4: Creator Experience ✅ MOSTLY COMPLETE
- Wizard with 8 steps and live preview
- Dashboard analytics
- Inbox + knowledge base management
- Feedback admin with AI summary
- Insights page

### Phase 4 remaining:
- [ ] Onboarding flow (new signup → wizard immediately)
- [ ] Duplicate / archive / delete bots
- [ ] Rate limiting per end user per bot

## Phase 5: Legal ❌ NOT STARTED
- [ ] Terms of Service (use Termly)
- [ ] Privacy Policy (use Termly)
- [ ] GDPR cookie banner
- [ ] Review Anthropic usage policies
- [ ] Register LLC
- [ ] Business bank account

## Phase 6: Marketing ❌ NOT STARTED
- [ ] Landing page (separate from app)
- [ ] Waitlist
- [ ] Find first 10 creators manually
- [ ] Soft launch to waitlist

## Phase 7: Launch ❌ NOT STARTED
- [ ] Product Hunt preparation
- [ ] Beta/founding member pricing
- [ ] Announcement sequence

---

## UX Fixes Completed This Session
- Page + active bot now persists across refresh (localStorage)
- Active bot switcher loads instantly with everything else
- Switching bots stays on current page (no more reset to dashboard)
- Bot list cached in localStorage (lb_bots) for instant load on return visits
- All data fetches run in parallel on login

## Known Issues
- First load on free Supabase tier can take 3-5 seconds (DB cold start)
  → Fix: upgrade to Supabase Pro ($25/mo) before launch
- Mobile nav pill not full width (minor)

---

## Key Code Patterns

### callClaude (src/lib/supabase.js)
Routes to /api/claude in production, direct Anthropic in dev.

### buildBotSystem
Compiles knowledge_entries + knowledge_text into system prompt.

### saveBot
Explicitly whitelists all known columns before saving.

### triggerFeedbackSummary (src/views/ChatView.jsx)
Top-level async function shared between CustomerFeedback and InternalMessaging.

### localStorage keys
- lb_dash: { page, botId } — remembers active page + bot
- lb_bots: [...] — cached bot list for instant load

---

## Git Workflow
git add .
git commit -m "description"
git push origin main   # triggers Vercel auto-deploy

## Multi-machine workflow
On new computer: git clone https://github.com/Robduediligence/Lunchbots
Use GitHub Personal Access Token as password
Run: rm -rf node_modules && npm install

# Bot Brunch — Progress Tracker

## Project
- Name: Bot Brunch
- Domain: botbrunch.com (connected to Vercel)
- Stack: React + Vite + Supabase + Anthropic API + Vercel
- Supabase URL: https://vklbfvfrfcncpsslnivm.supabase.co
- Live URL: https://lunchbots.vercel.app (update to botbrunch.com once DNS propagates)
- GitHub: https://github.com/Robduediligence/Lunchbots
- Local dev: http://localhost:5175

## Admin password: admin (changeable in AdminView.jsx line 4)

---

## Phase 1: Foundation ✅ COMPLETE
- Supabase Auth (email/password, email verification)
- Full Postgres schema: subscribers, bots, conversations, messages, knowledge_gaps, feedback, feedback_replies
- Row Level Security on all tables
- 8-step bot wizard with live preview
- Two bot types: Customer-facing and Internal (password-gated)
- Customer chat with streaming, fallback detection, suggested prompts, markdown
- Internal bot with messenger-style feedback UI
- Two-way feedback conversations
- AI feedback summaries
- Inbox with inline answering (auto-adds to knowledge base)
- Insights page (AI-generated analysis)
- Dashboard with stat cards + 7-day activity chart
- Bot switcher
- Settings page (change password, sign out)
- Super admin panel
- Anthropic API key server-side only (api/claude.js)
- Rate limiting on claude proxy + email notifications
- Resend email notifications (knowledge gaps + feedback)
- RLS policies on all tables
- Input sanitisation
- Vercel deployment + GitHub auto-deploy

## Phase 2: Infrastructure ✅ MOSTLY COMPLETE
- Vercel connected to GitHub, auto-deploys on push to main
- Environment variables set in Vercel
- botbrunch.com domain purchased and connected to Vercel
- Local dev uses VITE_ANTHROPIC_API_KEY directly
- Production routes through /api/claude proxy

### Phase 2 remaining:
- [ ] Sentry error monitoring
- [ ] Staging environment
- [ ] Update live URL to botbrunch.com once DNS confirmed

---

## Phase 3: Billing ❌ NOT STARTED
- [ ] Stripe integration
- [ ] Starter / Creator / Pro tiers
- [ ] Message limits per plan
- [ ] Billing page in dashboard
- [ ] Upgrade prompts when limits hit
- [ ] Webhooks for subscription events

## Phase 4: Creator Experience ✅ MOSTLY COMPLETE
- Wizard with 8 steps and live preview
- Dashboard analytics
- Inbox + knowledge base management
- Feedback admin with AI summary
- Insights page
- New action-oriented dashboard layout

### Phase 4 remaining:
- [ ] Edit Bot should stay inside dashboard layout (not replace full screen)
- [ ] Onboarding flow (new signup → wizard immediately)
- [ ] Duplicate / archive / delete bots
- [ ] Rate limiting per end user per bot

## Phase 5: Legal ❌ NOT STARTED
- [ ] Terms of Service (use Termly)
- [ ] Privacy Policy (use Termly)
- [ ] GDPR cookie banner
- [ ] Review Anthropic usage policies
- [ ] Register LLC
- [ ] Business bank account

## Phase 6: Marketing ❌ NOT STARTED
- [ ] Landing page (separate from app)
- [ ] Waitlist
- [ ] Find first 10 creators manually
- [ ] Soft launch to waitlist

## Phase 7: Launch ❌ NOT STARTED
- [ ] Product Hunt preparation
- [ ] Beta/founding member pricing
- [ ] Announcement sequence

---

## Rebrand: Bot Brunch ✅ IN PROGRESS

### Completed:
- New name: Bot Brunch (botbrunch.com)
- Logo: Bot_Brunch_Logo.png (in /public)
- Parchment background: Bot_Brunch_Parchment.jpg (in /public)
- New colour system applied to :root CSS variables:
  - Espresso #3B2B23 (primary brand)
  - Warm gold #C89B5A (accent)
  - Soft sage #7F9C8B (support/success)
  - Neutral text #2F2F2F
  - Secondary text #7A7A7A
  - Borders #E6DFD4
- Logo sits above nav pill, scrolls away as you scroll
- Nav pill stays sticky at top when scrolling
- Stat cards: white with coloured indicator dots
- Cards: soft parchment tones with blur backdrop
- Action-oriented dashboard layout:
  - Bot status with inline share link
  - Quick actions panel
  - Questions needing attention (Answer / Reply only)
  - Recent activity feed
  - Stat cards retained at top

### Remaining rebrand work:
- [ ] Apply new colour system to Inbox page
- [ ] Apply new colour system to Feedback page
- [ ] Apply new colour system to Insights page
- [ ] Apply new colour system to Settings page
- [ ] Apply new colour system to Wizard
- [ ] Apply new colour system to Chat/bot view
- [ ] Apply new colour system to Auth (login/signup) page
- [ ] Edit Bot should stay within dashboard layout
- [ ] Remove all remaining "Lunch Bots" references in code
- [ ] Update page title in index.html to "Bot Brunch"
- [ ] Add favicon

---

## Colour System (Bot Brunch)

### Brand
- Espresso: #3B2B23
- Warm gold: #C89B5A
- Soft sage: #7F9C8B

### Neutrals
- Text primary: #2F2F2F
- Text secondary: #7A7A7A
- Borders: #E6DFD4

### Surfaces
- Page background: #F6F1E7
- Panel background: #FFFFFF
- Section background: #FBF7EF

### Midday accents (used sparingly)
- Clay red: #C98278
- Burnt orange: #D98757
- Warm yellow: #E8D167
- Soft green: #9AB86C
- Dusty teal: #749CA5
- Slate blue: #708C91
- Muted lavender: #A28791
- Stone grey: #8A8480

---

## Key Code Patterns

### callClaude (src/lib/supabase.js)
Routes to /api/claude in production, direct Anthropic in dev.

### buildBotSystem
Compiles knowledge_entries + knowledge_text into system prompt.

### saveBot
Explicitly whitelists all known columns before saving.

### triggerFeedbackSummary (src/views/ChatView.jsx)
Top-level async function shared between CustomerFeedback and InternalMessaging.

### localStorage keys
- lb_dash: { page, botId } — remembers active page + bot
- lb_bots: [...] — cached bot list for instant load

### Answer vs Reply only (dashboard inbox)
- Answer: saves to knowledge base + sends to user
- Reply only: sends to user only, not saved to KB

---

## Git Workflow
git add .
git commit -m "description"
git push origin main   # triggers Vercel auto-deploy

## Multi-machine workflow
On new computer: git clone https://github.com/Robduediligence/Lunchbots
Use GitHub Personal Access Token as password
Run: rm -rf node_modules && npm install

# Bot Brunch — Progress Tracker

## Project
- Name: Bot Brunch
- Domain: botbrunch.com
- Stack: React + Vite + Supabase + Anthropic API + Vercel + Resend + Sentry
- Supabase URL: https://vklbfvfrfcncpsslnivm.supabase.co
- Live URL: https://botbrunch.com
- GitHub: https://github.com/Robduediligence/Lunchbots
- Local dev: http://localhost:5175

## Admin password: admin (changeable in AdminView.jsx line 4)

---

## Phase 1: Foundation ✅ COMPLETE

## Phase 2: Infrastructure ✅ COMPLETE
- Vercel connected to GitHub, auto-deploys on push to main
- botbrunch.com domain live and connected
- Sentry error monitoring installed
- Resend email via custom SMTP (hello@botbrunch.com)
- Supabase Pro upgraded
- Selective column fetching to reduce egress

## Phase 3: Billing ✅
- ✅ Stripe integration
- ✅ Starter / Creator / Pro tiers
- ✅ Message limits per plan
- ✅ Billing page in dashboard
- (Im not sure, can we chaeck this) Upgrade prompts when limits hit
- ✅ Webhooks for subscription events

## Phase 4: Creator Experience ✅ MOSTLY COMPLETE
- Wizard with 8 steps and live preview
- Dashboard — action-oriented layout
- Stat cards with colour indicators
- Questions needing attention (Answer / Reply only)
- Recent activity feed with logging
- Inbox + knowledge base management
- Feedback admin with AI summary (side by side layout)
- Insights page
- Share page with platform-specific widget install instructions
- Delete bot in settings (with confirmation)
- Chat widget (widget.js) — one line install for client websites
- Signup flow fixed — Check your email screen
- Email confirmation sends from hello@botbrunch.com

### Phase 4 remaining:
- [ ] Edit Bot should stay within dashboard layout
- [ ] Onboarding flow (new signup → wizard immediately)
- [ ] Duplicate / archive bots
- [ ] Rate limiting per end user per bot

## Phase 5: Legal ✅ COMPLETE
- Privacy Policy via Termly (botbrunch.com/privacy.html)
- Terms of Service via Termly (botbrunch.com/terms.html)
- Links on signup page
- Termly Pro — auto-updates, no branding

## Phase 6: Marketing ❌ NOT STARTED
- ✅ Landing page (separate from app)
- [ ] Waitlist
- [ ] Find first 10 creators manually
- [ ] Soft launch to waitlist

## Phase 7: Launch ❌ NOT STARTED
- [ ] Product Hunt preparation
- [ ] Beta/founding member pricing
- [ ] Announcement sequence

---

## Rebrand: Bot Brunch ✅ MOSTLY COMPLETE
- New name: Bot Brunch (botbrunch.com)
- Logo: Bot_Brunch_Logo.png (in /public)
- Parchment background removed, clean #F6F1E7 base
- New colour system (Espresso, Warm Gold, Soft Sage)
- Logo above nav pill, scrolls away on scroll
- Pill stays sticky at top
- White stat cards with colour indicator dots
- Action-oriented dashboard
- Auth page updated with Bot Brunch logo
- Page title updated to Bot Brunch

### Remaining rebrand:
- [ ] Chat/bot view
- [ ] Add favicon

---

## Widget (widget.js)
Clients paste one line into their website:
```html
<script src="https://botbrunch.com/widget.js" data-bot-id="BOT_ID"></script>
```
Optional colour: add `data-color="#FF4800"`
Share page shows platform-specific instructions (Squarespace, Wix, WordPress, Shopify)

---

## Key Code Patterns

### callClaude (src/lib/supabase.js)
Routes to /api/claude in production, direct Anthropic in dev.

### saveBot (src/lib/supabase.js)
Whitelists columns, rounds all integer fields with Math.round().

### localStorage keys
- lb_dash: { page, botId } — remembers active page + bot
- lb_bots: [...] — cached bot list for instant load

### Answer vs Reply only
- Answer: saves to knowledge base + resolves gap
- Reply only: sends to user, not saved to KB

### Activity log
Tracks: answered_question, replied_question, kb_updated,
bot_created, bot_updated, new_feedback, knowledge_gap etc.

---

## Git Workflow
git add .
git commit -m "description"
git push origin main   # triggers Vercel auto-deploy

## Multi-machine workflow
On new computer: git clone https://github.com/Robduediligence/Lunchbots
Use GitHub Personal Access Token as password
Run: rm -rf node_modules && npm install


# Bot Brunch — Progress Tracker

## Project
- Name: Bot Brunch
- Domain: botbrunch.com
- Stack: React + Vite + Supabase + Anthropic API + Vercel + Resend + Sentry
- Supabase URL: https://vklbfvfrfcncpsslnivm.supabase.co
- Live URL: https://botbrunch.com
- GitHub: https://github.com/Robduediligence/Lunchbots
- Local dev: http://localhost:5175

## Admin password: admin (changeable in AdminView.jsx line 4)

---

## Phase 1: Foundation ✅ COMPLETE
## Phase 2: Infrastructure ✅ COMPLETE
## Phase 3: Billing ✅ COMPLETE
## Phase 4: Creator Experience ✅ MOSTLY COMPLETE
## Phase 5: Legal ✅ COMPLETE
## Phase 6: Marketing ❌ NOT STARTED
## Phase 7: Launch ❌ NOT STARTED

---

## Priority 1 Fixes ✅ COMPLETE (Apr 16 2026)

- ✅ Email confirmation redirect goes to sign in page
  - Supabase redirect URL set to https://botbrunch.com/?signin=true
  - AuthView.jsx reads ?signin=true param and opens login tab directly

- ✅ PDF upload extracts real readable text
  - Installed unpdf library for text extraction
  - Claude cleans and restructures extracted text for any PDF format

- ✅ Browser alert replaced with toast notification
  - Inbox answer confirmation now shows polished dark toast

- ✅ Chat asks for email on fallback
  - When bot hits [FALLBACK], input area switches to email capture
  - Email saved to knowledge_gaps.user_email via /api/update-gap-email

- ✅ Email notification when admin answers inbox question
  - Created /api/send-email using Resend
  - Sends branded email from hello@botbrunch.com with bot name as sender
  - Only fires if user_email is present on the gap

- ✅ Markdown renders properly in conversation panel
  - ConversationContext uses renderMarkdown for bot messages
  - renderMarkdown imported at top level of DashboardView.jsx

- ✅ Bot messages now saving to database
  - Added answered (bool, nullable) column to messages table
  - Was causing silent insert failures before

- ✅ Knowledge base security locked down
  - bots_public_read RLS policy updated to exclude internal bots
  - Only customer bots with published=true are publicly readable
  - Internal bots only accessible to authenticated owner

- ✅ Inbox auto-refresh every 15 seconds
  - Polls getKnowledgeGaps and getBotStats at DashboardView level
  - Badge counts update automatically without page refresh

---

## Priority 2 Fixes ✅ COMPLETE (Apr 16 2026)

- ✅ Plan name fixed — shows Solo/Squadron/Fleet not "Starter"
  - createSubscriber now defaults to plan: 'trial'
  - Supabase subscribers table default changed from 'starter' to 'trial'

- ✅ Cancel subscription working
  - Button shows only when stripe_subscription_id exists
  - Uses cancel_at_period_end so access continues until billing period ends

- ✅ Plan selection required on signup
  - New trial users see plan selection modal on first dashboard load
  - Must select a plan before accessing dashboard (no skip option)
  - Reassurance message: "Won't be charged until trial ends"

- ✅ Plan changes update existing subscription (no new checkout)
  - /api/stripe-checkout now handles both new and existing subscribers
  - If subscriptionId present: updates subscription via Stripe API directly
  - If no subscriptionId: creates new checkout session as before
  - Eliminates duplicate subscription problem

- ✅ Bot disable modal on plan downgrade
  - disabled (bool) column added to bots table
  - When user has more bots than plan allows, modal appears on dashboard load
  - User chooses which bots to disable (keeps data, blocks usage)
  - Locked bots show 🔐 LOCKED in bot switcher
  - Clicking locked bot shows upgrade prompt

- ✅ stripe_subscription_id now saves correctly
  - Added customer.subscription.created webhook handler
  - Saves subscription ID and customer ID to subscribers table

---

## Priority 3: Mobile / Usability ❌ NOT STARTED
- [ ] Mobile friendly
- [ ] Widget feels more premium (like Renti)
- [ ] Widget on admin page goes to super admin chat
- [ ] All Conversations section in admin area
- [ ] Tabs for Home, Messages, Feedback in widget (for signed-in users)

## Priority 4: Wizard UX ❌ NOT STARTED
- [ ] Use Case panel: Customer Facing / Internal Team as main options with dropdown
- [ ] Remove emojis from Use Case panel
- [ ] Rename "Descriptor" to "What is this bot's focus?"
- [ ] Remove Suggested Prompts OR rename to "Common Questions"
- [ ] Remove Welcome Message from wizard
- [ ] Knowledge panel order: Import from Website, Upload File, Add Text Entry
- [ ] All 3 knowledge options coloured yellow

## Priority 5: Branding Panel ❌ NOT STARTED
- [ ] Logo replaces avatar letter if no avatar uploaded
- [ ] Avatar uploaded replaces avatar letter
- [ ] Bot avatar not shown in header
- [ ] Full colour control for all UI surfaces
- [ ] Header colour and text colour editable
- [ ] Header fade/gradient into background
- [ ] Stronger texture overlay with intensity fader
- [ ] More texture options
- [ ] Typography defaults to Inter
- [ ] Font colour sits next to font selector
- [ ] Fill/Outline/Minimal actually change preview
- [ ] Remove text opacity option
- [ ] Panel opacity: 0=transparent, 100=solid (doesn't affect text/logos)

---

## Remaining Phase 4 items
- [ ] Edit Bot should stay within dashboard layout
- [ ] Onboarding flow (new signup → wizard immediately)
- [ ] Duplicate / archive bots
- [ ] Rate limiting per end user per bot

---

## Key Infrastructure

### API Endpoints (12 — Vercel free plan limit reached)
- /api/add-message
- /api/cancel-subscription
- /api/check-gap
- /api/claude
- /api/create-conversation
- /api/create-gap
- /api/landing
- /api/scrape
- /api/send-email
- /api/stripe-checkout (handles both new checkout AND plan changes)
- /api/stripe-webhook
- /api/update-gap-email

### Supabase Tables & Key Columns
- subscribers: plan, trial_ends_at, stripe_customer_id, stripe_subscription_id, messages_used, messages_reset_at
- bots: owner_id, published, bot_type, disabled, knowledge_entries, knowledge_text
- knowledge_gaps: user_email, resolved, admin_answer, conversation_id
- messages: role, content, conversation_id, answered

### Plan Limits
- Solo: 1 bot, 500 messages/month — $9/mo
- Squadron: 3 bots, 2,000 messages/month — $19/mo
- Fleet: 10 bots, 6,000 messages/month — $39/mo

### Key Patterns
- PDF upload: unpdf extracts text → Claude cleans and structures it
- Plan changes: POST /api/stripe-checkout with subscriptionId = update in place
- Bot security: RLS bots_public_read only returns published customer bots
- Inbox refresh: polls every 15 seconds at DashboardView level
- Email notifications: Resend via /api/send-email, from hello@botbrunch.com

### Git Workflow
git add .
git commit -m "description"
git push origin main

### Warning: Vercel free plan limit
At 12/12 serverless functions. Any new API endpoints require either:
- Merging into existing files
- Upgrading Vercel to Pro ($20/mo)