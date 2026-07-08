-- Create lesson_metadata table for version tracking
CREATE TABLE lesson_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_version integer NOT NULL DEFAULT 1,
  last_updated timestamp with time zone DEFAULT now(),
  total_lessons integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE lesson_metadata ENABLE ROW LEVEL SECURITY;

-- Anyone can read metadata (needed for version checks)
CREATE POLICY "Anyone can read lesson metadata"
  ON lesson_metadata FOR SELECT
  USING (true);

-- Only admins can update metadata
CREATE POLICY "Admins can update lesson metadata"
  ON lesson_metadata FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert initial version based on current lesson count
INSERT INTO lesson_metadata (lesson_version, total_lessons)
SELECT 1, COUNT(*) FROM lessons;

-- Create helper function for version increment
CREATE OR REPLACE FUNCTION increment_lesson_version()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE lesson_metadata
  SET lesson_version = lesson_version + 1,
      last_updated = now(),
      total_lessons = (SELECT COUNT(*) FROM lessons)
  WHERE id = (SELECT id FROM lesson_metadata LIMIT 1);
END;
$$;