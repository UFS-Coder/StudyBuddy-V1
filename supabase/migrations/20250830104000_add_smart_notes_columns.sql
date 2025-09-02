-- Add smart_notes and smart_notes_outdated columns to notes table
ALTER TABLE public.notes ADD COLUMN smart_notes TEXT;
ALTER TABLE public.notes ADD COLUMN smart_notes_outdated BOOLEAN DEFAULT false;

-- Create index for better performance on smart_notes_outdated queries
CREATE INDEX idx_notes_smart_notes_outdated ON public.notes(smart_notes_outdated);
