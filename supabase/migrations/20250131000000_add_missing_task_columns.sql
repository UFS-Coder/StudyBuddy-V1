-- Add missing columns to tasks table that were removed in later migration

-- Add type field to tasks table
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'task' CHECK (type IN ('task', 'homework'));

-- Update existing tasks to have type 'task'
UPDATE public.tasks SET type = 'task' WHERE type IS NULL;

-- Make type field NOT NULL after setting defaults
ALTER TABLE public.tasks ALTER COLUMN type SET NOT NULL;

-- Add submitted_at field to tasks table
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE;