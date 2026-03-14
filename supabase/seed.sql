-- Fish Bowl — demo seed
-- 1. Create 3 users in Supabase Auth (Authentication → Users): creator@fishbowl.demo, reviewer@fishbowl.demo, sponsor@fishbowl.demo (password: password123)
-- 2. Copy their UUIDs from Auth → Users, then replace CREATOR_UUID, REVIEWER_UUID, SPONSOR_UUID below
-- 3. Run this script in SQL Editor

-- Profiles
INSERT INTO profiles (id, name, role, company, verified, university)
VALUES
  ('CREATOR_UUID', 'Demo Creator', 'creator', null, false, null),
  ('REVIEWER_UUID', 'Demo Reviewer', 'reviewer', null, false, 'Demo University'),
  ('SPONSOR_UUID', 'Demo Sponsor', 'sponsor', 'Demo Ventures', true, null)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role, company = EXCLUDED.company, verified = EXCLUDED.verified, university = EXCLUDED.university;

-- Pitches (replace CREATOR_UUID with actual creator user id)
INSERT INTO pitches (id, creator_id, title, description, industry, target_demographic, stage, status)
VALUES
  ('00000000-0000-4000-a000-000000000001', 'CREATOR_UUID', 'AI Study Buddy', 'An AI-powered study assistant that adapts to your learning style and helps students prepare for exams with personalized quizzes and explanations. Targets college students and high schoolers who need efficient, adaptive study tools.', 'Education', 'Students 16-24', 'prototype', 'public'),
  ('00000000-0000-4000-a000-000000000002', 'CREATOR_UUID', 'Local Food Rescue', 'Connects restaurants and grocery stores with surplus food to local shelters and food banks. Reduces waste and fights hunger in the community. Real-time matching and pickup scheduling.', 'Food', 'Nonprofits, restaurants', 'idea', 'public')
ON CONFLICT (id) DO NOTHING;

-- Reviews (replace REVIEWER_UUID and use pitch ids from above)
INSERT INTO reviews (pitch_id, reviewer_id, comment, vote)
VALUES
  ('00000000-0000-4000-a000-000000000001', 'REVIEWER_UUID', 'Strong problem-solution fit. Consider clearer differentiation from existing apps.', 'up'),
  ('00000000-0000-4000-a000-000000000002', 'REVIEWER_UUID', 'Love the impact focus. Logistics could be the main challenge.', 'up')
ON CONFLICT (pitch_id, reviewer_id) DO UPDATE SET comment = EXCLUDED.comment, vote = EXCLUDED.vote;

-- Sponsor like (replace SPONSOR_UUID)
INSERT INTO sponsor_likes (pitch_id, sponsor_id)
VALUES ('00000000-0000-4000-a000-000000000001', 'SPONSOR_UUID')
ON CONFLICT (pitch_id, sponsor_id) DO NOTHING;

-- Knowledge base
INSERT INTO knowledge_base (name, type, content, active)
SELECT 'Shark Tank success story', 'text',
  'Scrub Daddy (season 4): A smiley-faced sponge that changes texture with water temperature. Founder Aaron Krause secured a deal with Lori Greiner. Key lesson: Simple, relatable product with a memorable pitch and clear demographic (households) can win over sharks. Company went on to become one of Shark Tank''s most successful products.',
  true
WHERE NOT EXISTS (SELECT 1 FROM knowledge_base WHERE name = 'Shark Tank success story' LIMIT 1);

-- After running: open each demo pitch as the creator and click "Re-run AI Evaluation" to generate ai_feedback for the radar chart.
