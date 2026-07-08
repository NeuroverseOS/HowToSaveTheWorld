-- Add new mission engine fields to lessons table
ALTER TABLE public.lessons
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS briefing TEXT,
ADD COLUMN IF NOT EXISTS drill1_prompt TEXT,
ADD COLUMN IF NOT EXISTS head TEXT,
ADD COLUMN IF NOT EXISTS practical TEXT,
ADD COLUMN IF NOT EXISTS drill2_prompt TEXT,
ADD COLUMN IF NOT EXISTS debrief TEXT,
ADD COLUMN IF NOT EXISTS final_question TEXT;

-- Add helpful comment
COMMENT ON COLUMN public.lessons.video_url IS 'URL for the mission video (stage 3)';
COMMENT ON COLUMN public.lessons.briefing IS 'Mission briefing text delivered by Echelon (stage 1)';
COMMENT ON COLUMN public.lessons.drill1_prompt IS 'First reflection drill question (stage 2)';
COMMENT ON COLUMN public.lessons.head IS 'Head section of H-P integration block (stage 4)';
COMMENT ON COLUMN public.lessons.practical IS 'Practical section of H-P integration block (stage 4)';
COMMENT ON COLUMN public.lessons.drill2_prompt IS 'Second deepening drill question (stage 5)';
COMMENT ON COLUMN public.lessons.debrief IS 'Echelon debrief synthesis (stage 6)';
COMMENT ON COLUMN public.lessons.final_question IS 'Final anchor question (stage 7)';