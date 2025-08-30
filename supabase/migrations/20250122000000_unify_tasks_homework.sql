-- Migration to unify tasks and homework into a single tasks table with type field

-- Add type field to tasks table
ALTER TABLE public.tasks ADD COLUMN type TEXT DEFAULT 'task' CHECK (type IN ('task', 'homework'));

-- Update existing tasks to have type 'task'
UPDATE public.tasks SET type = 'task' WHERE type IS NULL;

-- Make type field NOT NULL after setting defaults
ALTER TABLE public.tasks ALTER COLUMN type SET NOT NULL;

-- Add submitted_at field to tasks table (from homework table)
ALTER TABLE public.tasks ADD COLUMN submitted_at TIMESTAMP WITH TIME ZONE;

-- Migrate homework data to tasks table
INSERT INTO public.tasks (
  user_id,
  subject_id,
  title,
  description,
  due_date,
  completed,
  time_period,
  type,
  submitted_at,
  created_at,
  updated_at
)
SELECT 
  user_id,
  subject_id,
  title,
  description,
  due_date,
  completed,
  time_period,
  'homework' as type,
  submitted_at,
  created_at,
  updated_at
FROM public.homework;

-- Drop the homework table after migration
DROP TABLE public.homework;