# Fish Bowl

**Start as a little fish, expand into a bigger pond.**

A startup pitch platform: Creators post ideas, Reviewers vote and comment, Sponsors like and contact creators. Includes AI-powered pitch evaluation with visual scoring (Claude + Recharts radar chart).

## Tech stack

- **Frontend:** React (Vite), Tailwind CSS, Recharts, React Router
- **Backend / DB / Auth:** Supabase
- **AI:** Anthropic Claude API (`claude-sonnet-4-20250514`)
- **PDF parsing:** PDF.js (client-side)
- **Deploy:** Vercel

## Setup

1. **Clone and install**
   ```bash
   npm install
   ```

2. **Supabase**
   - Create a project at [supabase.com](https://supabase.com).
   - In the SQL Editor, run the contents of `supabase/schema.sql` to create tables and RLS policies.

3. **Environment variables**
   - Copy `.env.example` to `.env`.
   - Set:
     - `VITE_SUPABASE_URL` — Supabase project URL
     - `VITE_SUPABASE_ANON_KEY` — Supabase anon/public key
     - `VITE_ANTHROPIC_API_KEY` — Anthropic API key (for AI evaluation)

4. **Run locally**
   ```bash
   npm run dev
   ```

5. **Deploy to Vercel**
   - Connect the repo to Vercel and add the same env vars in the project settings.
   - Build and deploy; `vercel.json` is already configured.

## Demo seed data

Create these users in Supabase (Auth → Users → Add user) or via signup, then run the SQL below in the SQL Editor (replace UUIDs with the real `auth.users.id` values from your project).

### 1. Create demo users (Auth)

In Supabase Dashboard → Authentication → Users, add:

| Email | Password | (then set profile via SQL below) |
|-------|----------|-----------------------------------|
| creator@fishbowl.demo | password123 | role: creator |
| reviewer@fishbowl.demo | password123 | role: reviewer |
| sponsor@fishbowl.demo | password123 | role: sponsor, verified: true |

Or sign up normally and note the user IDs.

### 2. Profiles and demo content (SQL)

After you have the three user UUIDs (`creator_id`, `reviewer_id`, `sponsor_id`), run:

```sql
-- Insert profiles (use your actual auth user IDs from Auth → Users)
-- Example: replace these with real UUIDs from auth.users
INSERT INTO profiles (id, name, role, company, verified, university)
VALUES
  ('CREATOR_UUID', 'Demo Creator', 'creator', null, false, null),
  ('REVIEWER_UUID', 'Demo Reviewer', 'reviewer', null, false, 'Demo University'),
  ('SPONSOR_UUID', 'Demo Sponsor', 'sponsor', 'Demo Ventures', true, null)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role, company = EXCLUDED.company, verified = EXCLUDED.verified, university = EXCLUDED.university;

-- Insert 2 public pitches for the creator (replace CREATOR_UUID)
INSERT INTO pitches (id, creator_id, title, description, industry, target_demographic, stage, status)
VALUES
  (gen_random_uuid(), 'CREATOR_UUID', 'AI Study Buddy', 'An AI-powered study assistant that adapts to your learning style and helps students prepare for exams with personalized quizzes and explanations. Targets college students and high schoolers.', 'Education', 'Students 16-24', 'prototype', 'public'),
  (gen_random_uuid(), 'CREATOR_UUID', 'Local Food Rescue', 'Connects restaurants and grocery stores with surplus food to local shelters and food banks. Reduces waste and fights hunger in the community.', 'Food', 'Nonprofits, restaurants', 'idea', 'public');

-- Add 3 reviews from the reviewer (replace REVIEWER_UUID and pitch IDs from previous insert)
-- Get pitch IDs: SELECT id FROM pitches WHERE creator_id = 'CREATOR_UUID';
-- Then insert reviews for two of those pitch IDs.

-- Add one sponsor like (replace SPONSOR_UUID and one pitch_id)

-- Knowledge base: one Shark Tank–style success story
INSERT INTO knowledge_base (name, type, content, active)
VALUES (
  'Shark Tank success story',
  'text',
  'Scrub Daddy (season 4): A smiley-faced sponge that changes texture with water temperature. Founder Aaron Krause secured a deal with Lori Greiner. Key lesson: Simple, relatable product with a memorable pitch and clear demographic (households) can win over sharks. Company went on to become one of Shark Tank''s most successful products.',
  true
);
```

### 3. AI feedback for demo pitches

After the first pitch is created, run “Re-run AI Evaluation” from the pitch detail page (logged in as the creator) so the radar chart and summary appear. Or call your backend/script that uses `evaluatePitch` for each demo pitch.

## Routes

| Route | Who |
|-------|-----|
| `/login`, `/signup` | Everyone |
| `/` | Feed (all roles) |
| `/pitch/:id` | Pitch detail (all roles; actions by role) |
| `/submit` | Creator only |
| `/my-pitches` | Creator only |
| `/reviewer/:id` | Reviewer public profile |
| `/admin/knowledge` | Knowledge base manager (demo: no auth) |
| `/admin/sponsors` | Sponsor verification (demo: no auth) |

## Business rules

- Pitches default to **draft**; creators set them to **public**.
- One **vote** per reviewer per pitch (up/neutral/down); new vote overwrites.
- One **sponsor like** per sponsor per pitch.
- **Contact requests** require creator acceptance before sharing contact info.
- **Sponsors** can like and reach out only when `verified = true` (set in Admin → Sponsor Verification).
