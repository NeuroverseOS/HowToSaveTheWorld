-- ✅ PHASE 1: ECHELON VISIBILITY CONTROL SYSTEM
-- Extends existing tables + creates new visibility infrastructure

-- ========================================
-- 1. EXTEND EXISTING TABLES
-- ========================================

-- Extend lessons table with Stage Engine fields
ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS stage_order jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS stage_type jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS unlock_type text,
ADD COLUMN IF NOT EXISTS unlock_key text,
ADD COLUMN IF NOT EXISTS lesson_modifiers jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS visibility_ruleset text;

-- Extend user_lesson_progress with visibility tracking
ALTER TABLE user_lesson_progress
ADD COLUMN IF NOT EXISTS visibility_snapshot jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS memory_snapshot jsonb DEFAULT '{}';

-- Extend operator_evolution_log with unlock key
ALTER TABLE operator_evolution_log
ADD COLUMN IF NOT EXISTS unlock_key text;

-- ========================================
-- 2. CREATE NEW TABLES
-- ========================================

-- Mission stage history (conversation tracking per stage)
CREATE TABLE IF NOT EXISTS mission_stage_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES user_lesson_progress(id) ON DELETE CASCADE,
  stage text NOT NULL,
  system_prompt text,
  user_message text,
  echelon_response text,
  created_at timestamptz DEFAULT now()
);

-- Visibility rules (ECHELON_VISIBILITY_MAP storage)
CREATE TABLE IF NOT EXISTS visibility_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage text UNIQUE NOT NULL,
  show_identity_tags boolean DEFAULT false,
  show_short_term_memory boolean DEFAULT false,
  show_long_term_memory boolean DEFAULT false,
  allowed_content_fields jsonb DEFAULT '[]',
  forbidden_content_fields jsonb DEFAULT '[]',
  allow_field_guide_narratives boolean DEFAULT false
);

-- Field Guide pages (user-facing narratives)
CREATE TABLE IF NOT EXISTS field_guide_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  trait_tag text NOT NULL,
  page_type text NOT NULL,
  narrative text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ========================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ========================================

ALTER TABLE mission_stage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_guide_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE visibility_rules ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 4. ADD RLS POLICIES
-- ========================================

-- mission_stage_history: Users can view own conversation history
CREATE POLICY "Users can view own stage history" ON mission_stage_history
FOR SELECT USING (
  session_id IN (
    SELECT id FROM user_lesson_progress WHERE user_id = auth.uid()
  )
);

CREATE POLICY "System can insert stage history" ON mission_stage_history
FOR INSERT WITH CHECK (true);

-- field_guide_pages: Users can view/insert own Field Guide pages
CREATE POLICY "Users can view own field guide pages" ON field_guide_pages
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own field guide pages" ON field_guide_pages
FOR INSERT WITH CHECK (user_id = auth.uid());

-- visibility_rules: Everyone can read, only admins can modify
CREATE POLICY "Anyone can read visibility rules" ON visibility_rules
FOR SELECT USING (true);

CREATE POLICY "Admins can manage visibility rules" ON visibility_rules
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- ========================================
-- 5. SEED INITIAL VISIBILITY RULES
-- ========================================

INSERT INTO visibility_rules (stage, show_identity_tags, show_short_term_memory, show_long_term_memory, allowed_content_fields, forbidden_content_fields, allow_field_guide_narratives)
VALUES
('briefing', true, true, false,
 '["briefing", "echelon_opening", "lesson_title", "section_name"]'::jsonb,
 '["drill1_prompt", "drill2_prompt", "head", "practical", "debrief", "final_question"]'::jsonb,
 false),
('drill1', true, false, false,
 '["drill1_prompt"]'::jsonb,
 '["briefing", "drill2_prompt", "video_url", "head", "practical"]'::jsonb,
 false),
('video', false, false, false,
 '["video_url"]'::jsonb,
 '["*"]'::jsonb,
 false),
('hp', true, true, false,
 '["head", "practical"]'::jsonb,
 '["drill1_prompt", "drill2_prompt", "final_question"]'::jsonb,
 false),
('drill2', true, false, false,
 '["drill2_prompt"]'::jsonb,
 '["drill1_prompt", "head", "practical", "final_question"]'::jsonb,
 false),
('debrief', true, true, true,
 '["debrief"]'::jsonb,
 '["drill1_prompt", "drill2_prompt", "final_question"]'::jsonb,
 false),
('final', true, true, true,
 '["final_question"]'::jsonb,
 '["drill1_prompt", "drill2_prompt", "head", "practical"]'::jsonb,
 false),
('complete', true, true, true,
 '["echelon_closing"]'::jsonb,
 '[]'::jsonb,
 true)
ON CONFLICT (stage) DO NOTHING;