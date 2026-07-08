-- Create operator identity tables

-- Operator traits table (stores unlocked traits per user)
CREATE TABLE IF NOT EXISTS public.operator_traits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  trait_tag text NOT NULL,
  unlocked boolean DEFAULT false,
  unlocked_at timestamp with time zone,
  subskills_unlocked jsonb DEFAULT '[]'::jsonb,
  shadow_revealed boolean DEFAULT false,
  superpower_revealed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, trait_tag)
);

-- Operator evolution log (tracks trait/subskill unlock events)
CREATE TABLE IF NOT EXISTS public.operator_evolution_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lesson_id bigint,
  trait_tag text,
  subskill_unlocked text,
  insight_type text CHECK (insight_type IN ('shadow', 'superpower', 'subskill', 'trait_unlock')),
  insight_text text,
  unlocked_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Operator identity notes (personal observations)
CREATE TABLE IF NOT EXISTS public.operator_identity_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  note_type text CHECK (note_type IN ('strength', 'pattern', 'weakness')),
  note_content text CHECK (char_length(note_content) <= 200),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on all identity tables
ALTER TABLE public.operator_traits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_evolution_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_identity_notes ENABLE ROW LEVEL SECURITY;

-- RLS policies for operator_traits
CREATE POLICY "Users can view own traits"
  ON public.operator_traits FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own traits"
  ON public.operator_traits FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own traits"
  ON public.operator_traits FOR UPDATE
  USING (user_id = auth.uid());

-- RLS policies for operator_evolution_log
CREATE POLICY "Users can view own evolution"
  ON public.operator_evolution_log FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own evolution"
  ON public.operator_evolution_log FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- RLS policies for operator_identity_notes
CREATE POLICY "Users can view own notes"
  ON public.operator_identity_notes FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own notes"
  ON public.operator_identity_notes FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own notes"
  ON public.operator_identity_notes FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own notes"
  ON public.operator_identity_notes FOR DELETE
  USING (user_id = auth.uid());

-- Create indexes for better query performance
CREATE INDEX idx_operator_traits_user_id ON public.operator_traits(user_id);
CREATE INDEX idx_operator_traits_unlocked ON public.operator_traits(user_id, unlocked);
CREATE INDEX idx_evolution_log_user_id ON public.operator_evolution_log(user_id);
CREATE INDEX idx_evolution_log_lesson ON public.operator_evolution_log(lesson_id);
CREATE INDEX idx_identity_notes_user_id ON public.operator_identity_notes(user_id);