-- Add course_type column to existing subjects table
ALTER TABLE public.subjects 
ADD COLUMN IF NOT EXISTS course_type TEXT DEFAULT 'GK';

-- Update existing subjects to have GK as default
UPDATE public.subjects 
SET course_type = 'GK' 
WHERE course_type IS NULL;

-- Make the column NOT NULL after setting defaults
ALTER TABLE public.subjects 
ALTER COLUMN course_type SET NOT NULL;

-- Add check constraint to ensure only LK or GK values
ALTER TABLE public.subjects 
ADD CONSTRAINT subjects_course_type_check 
CHECK (course_type IN ('LK', 'GK'));

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_subjects_course_type 
ON public.subjects(course_type);

-- Add grade range constraint to grades table if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'grades_grade_range_check' 
        AND table_name = 'grades'
    ) THEN
        ALTER TABLE public.grades 
        ADD CONSTRAINT grades_grade_range_check 
        CHECK (grade >= 1.0 AND grade <= 6.0);
    END IF;
END $$;