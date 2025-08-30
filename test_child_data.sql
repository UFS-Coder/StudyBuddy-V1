-- Test data for child users to verify parent-child functionality
-- This creates sample data for the children shown in the debug info

-- Insert sample subjects for Siddharth (ed676226-2e07-459c-a8e2-e75a26b2b462)
INSERT INTO public.subjects (name, teacher, room, color, credits, target_grade, course_type, user_id)
VALUES 
  ('Mathematics', 'Mr. Smith', 'Room 101', '#3b82f6', 5, 2.0, 'LK', 'ed676226-2e07-459c-a8e2-e75a26b2b462'),
  ('English', 'Ms. Johnson', 'Room 102', '#10b981', 4, 2.5, 'GK', 'ed676226-2e07-459c-a8e2-e75a26b2b462'),
  ('Science', 'Dr. Brown', 'Lab 201', '#8b5cf6', 3, 1.8, 'GK', 'ed676226-2e07-459c-a8e2-e75a26b2b462')
ON CONFLICT DO NOTHING;

-- Insert sample grades for Siddharth
INSERT INTO public.grades (title, grade, weight, type, notes, date_received, subject_id, user_id)
SELECT 
  'Test 1' as title,
  2.0 as grade,
  1.0 as weight,
  'test' as type,
  'First test' as notes,
  '2024-01-15' as date_received,
  s.id as subject_id,
  'ed676226-2e07-459c-a8e2-e75a26b2b462' as user_id
FROM public.subjects s 
WHERE s.user_id = 'ed676226-2e07-459c-a8e2-e75a26b2b462' AND s.name = 'Mathematics'
ON CONFLICT DO NOTHING;

INSERT INTO public.grades (title, grade, weight, type, notes, date_received, subject_id, user_id)
SELECT 
  'Essay 1' as title,
  1.7 as grade,
  2.0 as weight,
  'exam' as type,
  'Creative writing' as notes,
  '2024-01-20' as date_received,
  s.id as subject_id,
  'ed676226-2e07-459c-a8e2-e75a26b2b462' as user_id
FROM public.subjects s 
WHERE s.user_id = 'ed676226-2e07-459c-a8e2-e75a26b2b462' AND s.name = 'English'
ON CONFLICT DO NOTHING;

-- Insert sample tasks for Siddharth
INSERT INTO public.tasks (title, description, due_date, priority, status, subject_id, user_id)
SELECT 
  'Math Homework Chapter 5' as title,
  'Complete exercises 1-20' as description,
  '2024-01-25' as due_date,
  'medium' as priority,
  'pending' as status,
  s.id as subject_id,
  'ed676226-2e07-459c-a8e2-e75a26b2b462' as user_id
FROM public.subjects s 
WHERE s.user_id = 'ed676226-2e07-459c-a8e2-e75a26b2b462' AND s.name = 'Mathematics'
ON CONFLICT DO NOTHING;

INSERT INTO public.tasks (title, description, due_date, priority, status, subject_id, user_id)
SELECT 
  'Science Project' as title,
  'Research on renewable energy' as description,
  '2024-02-01' as due_date,
  'high' as priority,
  'in_progress' as status,
  s.id as subject_id,
  'ed676226-2e07-459c-a8e2-e75a26b2b462' as user_id
FROM public.subjects s 
WHERE s.user_id = 'ed676226-2e07-459c-a8e2-e75a26b2b462' AND s.name = 'Science'
ON CONFLICT DO NOTHING;