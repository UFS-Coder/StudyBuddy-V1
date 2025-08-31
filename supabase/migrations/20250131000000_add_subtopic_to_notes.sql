-- Add subtopic_id column to notes table
ALTER TABLE public.notes ADD COLUMN subtopic_id UUID REFERENCES public.subtopics(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX idx_notes_subtopic_id ON public.notes(subtopic_id);