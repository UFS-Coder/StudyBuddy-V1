-- Fix time_period CHECK constraint to include 'one_time'

-- Drop the existing CHECK constraint
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_time_period_check;

-- Add the updated CHECK constraint that includes 'one_time'
ALTER TABLE public.tasks ADD CONSTRAINT tasks_time_period_check 
CHECK (time_period IN ('day', 'week', 'month', 'quarter', 'half_year', 'one_time'));