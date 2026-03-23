-- ============================================================
-- LUNCH BOTS — Complete Database Schema
-- Run this entire file in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── SUBSCRIBERS (creator accounts) ──────────────────────────
create table if not exists subscribers (
  id            uuid primary key default uuid_generate_v4(),
  email         text unique not null,
  business_name text,
  active        boolean default true,
  plan          text default 'starter',
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ── BOTS ────────────────────────────────────────────────────
create table if not exists bots (
  id              uuid primary key default uuid_generate_v4(),
  owner_id        uuid references subscribers(id) on delete cascade,
  name            text not null,
  descriptor      text,
  greeting        text,
  welcome_message text,
  published       boolean default false,
  published_at    timestamptz,

  -- Knowledge settings
  knowledge_text     text,
  allow_web          boolean default false,
  allow_broad_ai     boolean default false,
  strict_kb_only     boolean default true,
  fallback_message   text default 'I don''t have that information yet. I''ve flagged your question for the team.',

  -- Personality
  tone               text default 'professional',
  response_length    text default 'balanced',
  initiative         text default 'reactive',
  writing_style      text default 'conversational',
  emoji_use          text default 'none',

  -- Branding
  primary_color      text default '#2C1810',
  secondary_color    text default '#F5F0E8',
  font_family        text default 'Inter, system-ui, sans-serif',
  font_size          integer default 14,
  border_radius      integer default 12,
  bubble_style       text default 'filled',
  bg_color           text default '#F5F0E8',
  bg_overlay         integer default 40,
  avatar_letter      text,
  logo_url           text,
  avatar_url         text,
  bg_image_url       text,
  cta_text           text,
  cta_url            text,
  support_email      text,

  -- Suggested prompts
  suggested_prompts  text[] default '{}',

  -- Categories
  categories         jsonb default '[]',

  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

-- ── CONVERSATIONS ────────────────────────────────────────────
create table if not exists conversations (
  id           uuid primary key default uuid_generate_v4(),
  bot_id       uuid references bots(id) on delete cascade,
  session_id   text not null,
  user_name    text,
  user_email   text,
  is_anon      boolean default true,
  type         text default 'chat',  -- 'chat' | 'feedback'
  status       text default 'open', -- 'open' | 'resolved'
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ── MESSAGES ─────────────────────────────────────────────────
create table if not exists messages (
  id              uuid primary key default uuid_generate_v4(),
  conversation_id uuid references conversations(id) on delete cascade,
  role            text not null, -- 'user' | 'bot' | 'admin'
  content         text not null,
  from_kb         boolean default false, -- was this answered from knowledge base?
  created_at      timestamptz default now()
);

-- ── KNOWLEDGE GAPS (unanswered questions) ────────────────────
create table if not exists knowledge_gaps (
  id              uuid primary key default uuid_generate_v4(),
  bot_id          uuid references bots(id) on delete cascade,
  conversation_id uuid references conversations(id) on delete set null,
  question        text not null,
  admin_answer    text,
  added_to_kb     boolean default false,
  resolved        boolean default false,
  created_at      timestamptz default now(),
  resolved_at     timestamptz
);

-- ── FEEDBACK ─────────────────────────────────────────────────
create table if not exists feedback (
  id              uuid primary key default uuid_generate_v4(),
  bot_id          uuid references bots(id) on delete cascade,
  conversation_id uuid references conversations(id) on delete set null,
  content         text not null,
  is_anon         boolean default true,
  user_name       text,
  ai_summary      text,
  category        text,
  urgency         text default 'normal',
  admin_reply     text,
  resolved        boolean default false,
  created_at      timestamptz default now()
);

-- ── ROW LEVEL SECURITY ───────────────────────────────────────
alter table subscribers      enable row level security;
alter table bots              enable row level security;
alter table conversations     enable row level security;
alter table messages          enable row level security;
alter table knowledge_gaps    enable row level security;
alter table feedback          enable row level security;

-- Allow all operations via anon key (we handle auth in app)
create policy "allow_all_subscribers"   on subscribers   for all using (true) with check (true);
create policy "allow_all_bots"          on bots          for all using (true) with check (true);
create policy "allow_all_conversations" on conversations  for all using (true) with check (true);
create policy "allow_all_messages"      on messages      for all using (true) with check (true);
create policy "allow_all_gaps"          on knowledge_gaps for all using (true) with check (true);
create policy "allow_all_feedback"      on feedback      for all using (true) with check (true);

-- ── INDEXES ──────────────────────────────────────────────────
create index if not exists idx_bots_owner         on bots(owner_id);
create index if not exists idx_conversations_bot  on conversations(bot_id);
create index if not exists idx_messages_conv      on messages(conversation_id);
create index if not exists idx_gaps_bot           on knowledge_gaps(bot_id);
create index if not exists idx_feedback_bot       on feedback(bot_id);

-- Done!
select 'Lunch Bots schema created successfully' as status;
