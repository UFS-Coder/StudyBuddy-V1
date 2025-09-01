-- Migration: Change tasks.due_date from DATE to TIMESTAMP WITH TIME ZONE to preserve time component
-- This will keep existing dates at 00:00:00 and allow saving times going forward.

BEGIN;

ALTER TABLE public.tasks
  ALTER COLUMN due_date TYPE TIMESTAMP WITH TIME ZONE
  USING (
    CASE 
      WHEN due_date IS NULL THEN NULL 
      ELSE (due_date::timestamp AT TIME ZONE 'UTC')
    END
  );

COMMIT;