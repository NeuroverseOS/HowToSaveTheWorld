-- Create lessons table
CREATE TABLE public.lessons (
  id BIGSERIAL PRIMARY KEY,
  phase TEXT NOT NULL,
  section_id INTEGER NOT NULL,
  section_name TEXT NOT NULL,
  lesson_number INTEGER NOT NULL UNIQUE,
  lesson_title TEXT NOT NULL,
  tone TEXT,
  lesson_summary TEXT,
  read_block TEXT NOT NULL,
  systems_lesson TEXT,
  mini_framework TEXT,
  think_prompts TEXT,
  think_reflection TEXT,
  mission_drill TEXT,
  echelon_opening TEXT,
  echelon_closing TEXT,
  fog_level INTEGER DEFAULT 0 CHECK (fog_level >= 0 AND fog_level <= 5),
  story_beat TEXT,
  mission_badge_description TEXT,
  field_guide_prompt TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for fast lesson lookups
CREATE INDEX idx_lessons_lesson_number ON public.lessons(lesson_number);
CREATE INDEX idx_lessons_section_id ON public.lessons(section_id);

-- Enable RLS
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read lessons (they're educational content)
CREATE POLICY "Anyone can read lessons"
  ON public.lessons
  FOR SELECT
  USING (true);

-- Create user_reflections table
CREATE TABLE public.user_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  lesson_id BIGINT NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  reflection_content TEXT NOT NULL,
  mission_choice TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for user reflections
CREATE INDEX idx_user_reflections_user_id ON public.user_reflections(user_id);
CREATE INDEX idx_user_reflections_lesson_id ON public.user_reflections(lesson_id);

-- Enable RLS
ALTER TABLE public.user_reflections ENABLE ROW LEVEL SECURITY;

-- Users can only see their own reflections
CREATE POLICY "Users can view own reflections"
  ON public.user_reflections
  FOR SELECT
  USING (user_id = auth.uid()::text);

-- Users can insert their own reflections
CREATE POLICY "Users can create own reflections"
  ON public.user_reflections
  FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

-- Create echelon_conversations table
CREATE TABLE public.echelon_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  lesson_id BIGINT NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  is_summary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for conversations
CREATE INDEX idx_echelon_conversations_user_lesson ON public.echelon_conversations(user_id, lesson_id);
CREATE INDEX idx_echelon_conversations_created ON public.echelon_conversations(created_at);

-- Enable RLS
ALTER TABLE public.echelon_conversations ENABLE ROW LEVEL SECURITY;

-- Users can view their own conversations
CREATE POLICY "Users can view own conversations"
  ON public.echelon_conversations
  FOR SELECT
  USING (user_id = auth.uid()::text);

-- Users can create their own conversation messages
CREATE POLICY "Users can create own messages"
  ON public.echelon_conversations
  FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

-- Insert first lesson as example (more lessons will be imported next)
INSERT INTO public.lessons (
  phase, section_id, section_name, lesson_number, lesson_title,
  read_block, think_prompts, mission_drill, echelon_opening, echelon_closing,
  fog_level
) VALUES (
  'Design',
  1,
  'Prime Upload',
  1,
  'Initialization',
  'Every system has an operating system. Your mind is no different. For years, you''ve been running on default settings—patterns you didn''t choose, inherited from culture, context, and conditioning. NeuroVerse OS is about upgrading that system. This isn''t about learning new information. It''s about rebuilding how you process, decide, and lead.',
  'What patterns are currently running your decisions? When was the last time you questioned the operating system you''re using to lead?',
  'Take 5 minutes. Write down three decisions you made this week. For each one, identify: What mental model did I use? Did I choose it consciously?',
  'Initialization sequence complete. Welcome to the NeuroVerse.',
  'The system is live. Your first upgrade begins now.',
  1
);