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