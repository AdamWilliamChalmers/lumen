-- Users
create table users (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  email text unique,
  display_name text,
  birth_year integer,
  account_status text default 'active',
  parent_guardian_email text,
  parent_consent_at timestamptz,
  is_family_plan boolean default false,
  share_card_public boolean default false,
  onboarding_goals jsonb,
  exemptions jsonb default '[]'
);

-- Child-initiated family sharing (weekly card only — no session logs)
create table family_shares (
  id uuid primary key default gen_random_uuid(),
  child_user_id uuid references users(id) on delete cascade not null,
  parent_email text not null,
  invite_token uuid default gen_random_uuid(),
  status text default 'pending',
  created_at timestamptz default now(),
  activated_at timestamptz,
  revoked_at timestamptz,
  unique(child_user_id, parent_email)
);

create index family_shares_parent on family_shares(parent_email, status);
create index family_shares_child on family_shares(child_user_id, status);

-- Sessions — one row per extension session POST
create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  session_date date not null,
  platform text not null,
  duration_minutes integer,
  message_count integer,
  composite_score integer,
  human_state text,
  depth_moments integer default 0,
  questions_asked integer default 0,
  conscious_delegates integer default 0,
  loop_breaks_taken integer default 0,
  interventions_fired integer default 0,
  interventions_bypassed integer default 0,
  reflections_submitted integer default 0,
  signals jsonb,
  feedback jsonb default '[]',
  created_at timestamptz default now()
);

-- Weekly summaries — generated every Monday from sessions
create table weekly_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  week_start date not null,
  shape text,
  intentional_pct integer,
  questions_asked integer,
  depth_moments integer,
  conscious_delegates integer,
  loop_breaks_taken integer,
  session_count integer,
  total_messages integer,
  insight_line text,
  card_shared boolean default false,
  created_at timestamptz default now(),
  unique(user_id, week_start)
);

create index sessions_user_date on sessions(user_id, session_date);
create index weekly_user_week on weekly_summaries(user_id, week_start);
