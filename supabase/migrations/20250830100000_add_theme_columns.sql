-- Add theme support to syllabus_topics table
ALTER TABLE public.syllabus_topics ADD COLUMN IF NOT EXISTS is_theme BOOLEAN DEFAULT FALSE;
ALTER TABLE public.syllabus_topics ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#3B82F6';