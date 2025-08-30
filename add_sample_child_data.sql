-- Add sample data for child user 0865abc8-f5d4-45dd-80a6-708076d664d6
-- This will help test parent view functionality

-- Insert sample subjects
INSERT INTO public.subjects (user_id, name, description, color, course_type) VALUES
('0865abc8-f5d4-45dd-80a6-708076d664d6', 'Mathematics', 'Advanced Mathematics Course', '#3B82F6', 'core'),
('0865abc8-f5d4-45dd-80a6-708076d664d6', 'Science', 'General Science Studies', '#10B981', 'core'),
('0865abc8-f5d4-45dd-80a6-708076d664d6', 'English', 'English Language Arts', '#F59E0B', 'core');

-- Get subject IDs for grades and tasks
-- Note: In a real scenario, you'd need to get the actual UUIDs after insertion
-- For now, we'll create some sample grades and tasks

-- Insert sample grades (you'll need to replace subject_id with actual UUIDs)
-- This is a template - actual execution would require getting the subject IDs first
/*
INSERT INTO public.grades (user_id, subject_id, title, grade, weight, date_received, type) VALUES
('0865abc8-f5d4-45dd-80a6-708076d664d6', '[MATH_SUBJECT_ID]', 'Quiz 1', 85.5, 1.0, CURRENT_DATE - INTERVAL '5 days', 'quiz'),
('0865abc8-f5d4-45dd-80a6-708076d664d6', '[SCIENCE_SUBJECT_ID]', 'Lab Report', 92.0, 1.5, CURRENT_DATE - INTERVAL '3 days', 'assignment'),
('0865abc8-f5d4-45dd-80a6-708076d664d6', '[ENGLISH_SUBJECT_ID]', 'Essay', 88.0, 2.0, CURRENT_DATE - INTERVAL '1 day', 'assignment');
*/

-- Insert sample tasks
INSERT INTO public.tasks (user_id, title, description, due_date, priority, status, type) VALUES
('0865abc8-f5d4-45dd-80a6-708076d664d6', 'Math Homework Chapter 5', 'Complete exercises 1-20', CURRENT_DATE + INTERVAL '2 days', 'medium', 'pending', 'homework'),
('0865abc8-f5d4-45dd-80a6-708076d664d6', 'Science Project', 'Prepare volcano model', CURRENT_DATE + INTERVAL '1 week', 'high', 'in_progress', 'project'),
('0865abc8-f5d4-45dd-80a6-708076d664d6', 'English Reading', 'Read chapters 3-4', CURRENT_DATE + INTERVAL '3 days', 'low', 'pending', 'reading');

-- Verify the data was inserted
SELECT 'Subjects' as table_name, COUNT(*) as count FROM public.subjects WHERE user_id = '0865abc8-f5d4-45dd-80a6-708076d664d6'
UNION ALL
SELECT 'Tasks' as table_name, COUNT(*) as count FROM public.tasks WHERE user_id = '0865abc8-f5d4-45dd-80a6-708076d664d6';