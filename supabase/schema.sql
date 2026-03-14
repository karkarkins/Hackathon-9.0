-- Fish Bowl — run this in Supabase SQL Editor

-- User profiles (extends auth.users)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  role text check (role in ('creator', 'reviewer', 'sponsor')),
  company text,
  verified boolean default false,
  university text,
  created_at timestamp with time zone default now()
);

-- Pitches
create table if not exists pitches (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references profiles(id) on delete cascade,
  title text,
  description text,
  industry text,
  target_demographic text,
  stage text check (stage in ('idea', 'prototype', 'mvp')),
  status text check (status in ('draft', 'public')) default 'draft',
  created_at timestamp with time zone default now()
);

-- Reviews
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  pitch_id uuid references pitches(id) on delete cascade,
  reviewer_id uuid references profiles(id) on delete cascade,
  comment text,
  vote text check (vote in ('up', 'down', 'neutral')),
  created_at timestamp with time zone default now(),
  unique(pitch_id, reviewer_id)
);

-- Sponsor Likes
create table if not exists sponsor_likes (
  id uuid primary key default gen_random_uuid(),
  pitch_id uuid references pitches(id) on delete cascade,
  sponsor_id uuid references profiles(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(pitch_id, sponsor_id)
);

-- Contact Requests
create table if not exists contact_requests (
  id uuid primary key default gen_random_uuid(),
  pitch_id uuid references pitches(id) on delete cascade,
  sponsor_id uuid references profiles(id) on delete cascade,
  creator_id uuid references profiles(id) on delete cascade,
  message text,
  status text check (status in ('pending', 'accepted', 'declined')) default 'pending',
  created_at timestamp with time zone default now()
);

-- AI Feedback
create table if not exists ai_feedback (
  id uuid primary key default gen_random_uuid(),
  pitch_id uuid references pitches(id) on delete cascade unique,
  necessity_score int,
  viability_score int,
  market_fit_score int,
  originality_score int,
  execution_score int,
  summary text,
  similar_stories jsonb,
  refined_pitch text,
  created_at timestamp with time zone default now()
);

-- Knowledge Base
create table if not exists knowledge_base (
  id uuid primary key default gen_random_uuid(),
  name text,
  type text check (type in ('file', 'text')),
  content text,
  active boolean default true,
  uploaded_at timestamp with time zone default now()
);

-- RLS policies (optional: enable RLS in Supabase dashboard and add policies as needed)
alter table profiles enable row level security;
alter table pitches enable row level security;
alter table reviews enable row level security;
alter table sponsor_likes enable row level security;
alter table contact_requests enable row level security;
alter table ai_feedback enable row level security;
alter table knowledge_base enable row level security;

-- Profiles: users can read all, update own
create policy "Profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

-- Pitches: all can read public; creators manage own
create policy "Public pitches are viewable" on pitches for select using (status = 'public' or creator_id = auth.uid());
create policy "Creators can insert pitches" on pitches for insert with check (auth.uid() = creator_id);
create policy "Creators can update own pitches" on pitches for update using (auth.uid() = creator_id);
create policy "Creators can delete own pitches" on pitches for delete using (auth.uid() = creator_id);

-- Reviews: all can read; reviewers can insert/update own
create policy "Reviews are viewable" on reviews for select using (true);
create policy "Users can insert reviews" on reviews for insert with check (auth.uid() = reviewer_id);
create policy "Users can update own reviews" on reviews for update using (auth.uid() = reviewer_id);
create policy "Users can delete own reviews" on reviews for delete using (auth.uid() = reviewer_id);

-- Sponsor likes
create policy "Sponsor likes viewable" on sponsor_likes for select using (true);
create policy "Sponsors can insert likes" on sponsor_likes for insert with check (auth.uid() = sponsor_id);
create policy "Sponsors can delete own likes" on sponsor_likes for delete using (auth.uid() = sponsor_id);

-- Contact requests: participants can see
create policy "Contact requests viewable by participants" on contact_requests for select using (auth.uid() = sponsor_id or auth.uid() = creator_id);
create policy "Sponsors can create contact requests" on contact_requests for insert with check (auth.uid() = sponsor_id);
create policy "Creator can update contact request status" on contact_requests for update using (auth.uid() = creator_id);

-- AI feedback: viewable if user can view pitch
create policy "AI feedback viewable with pitch" on ai_feedback for select using (
  exists (select 1 from pitches p where p.id = ai_feedback.pitch_id and (p.status = 'public' or p.creator_id = auth.uid()))
);
create policy "Authenticated can insert ai_feedback" on ai_feedback for insert with check (auth.uid() is not null);
create policy "Authenticated can update ai_feedback" on ai_feedback for update using (auth.uid() is not null);

-- Knowledge base: allow all for demo (admin pages unprotected)
create policy "Knowledge base readable" on knowledge_base for select using (true);
create policy "Knowledge base insert" on knowledge_base for insert with check (true);
create policy "Knowledge base update" on knowledge_base for update using (true);
create policy "Knowledge base delete" on knowledge_base for delete using (true);
