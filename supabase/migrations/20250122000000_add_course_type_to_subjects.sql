-- Add course_type field to subjects table for LK/GK classification
-- This migration supports the Durchschnittsnote calculation feature

-- Add course_type column to subjects table
ALTER TABLE public.subjects 
ADD COLUMN course_type TEXT DEFAULT 'GK' CHECK (course_type IN ('LK', 'GK'));

-- Add comment for documentation
COMMENT ON COLUMN public.subjects.course_type IS 'Course type: LK (Leistungskurs) or GK (Grundkurs) for German Gymnasium grading';

-- Update existing subjects to have default GK course type
UPDATE public.subjects 
SET course_type = 'GK' 
WHERE course_type IS NULL;

-- Make course_type NOT NULL after setting defaults
ALTER TABLE public.subjects 
ALTER COLUMN course_type SET NOT NULL;

-- Add index for performance on course_type queries
CREATE INDEX idx_subjects_course_type ON public.subjects(course_type);
CREATE INDEX idx_subjects_user_course_type ON public.subjects(user_id, course_type);

-- Add constraint to ensure valid grade ranges for German system
ALTER TABLE public.grades 
ADD CONSTRAINT check_german_grade_range 
CHECK (grade >= 1.0 AND grade <= 6.0);

-- Add comment for grades table
COMMENT ON COLUMN public.grades.grade IS 'Grade value on German 1-6 scale (1.0 = Sehr gut, 6.0 = Ungenügend)';
COMMENT ON COLUMN public.grades.weight IS 'Weight factor for grade calculation (default 1.0)';