-- Add sample data for child user 0865abc8-f5d4-45dd-80a6-708076d664d6 (Siddharth)
-- This will allow testing of parent view functionality

-- Insert sample subjects for the child
INSERT INTO subjects (user_id, name, teacher, room, grade_scale, color) VALUES
('0865abc8-f5d4-45dd-80a6-708076d664d6', 'Mathematics', 'Mr. Smith', 'Room 101', '1-6', '#3B82F6'),
('0865abc8-f5d4-45dd-80a6-708076d664d6', 'English', 'Ms. Johnson', 'Room 205', '1-6', '#10B981'),
('0865abc8-f5d4-45dd-80a6-708076d664d6', 'Science', 'Dr. Brown', 'Lab 3', '1-6', '#8B5CF6'),
('0865abc8-f5d4-45dd-80a6-708076d664d6', 'History', 'Mrs. Davis', 'Room 150', '1-6', '#F59E0B');

-- Get the subject IDs for grades and tasks
-- Note: In a real scenario, you'd need to get the actual subject IDs after insertion
-- For this example, we'll assume the subjects were created and use a subquery

-- Insert sample grades for the child
INSERT INTO grades (user_id, subject_id, grade_value, grade_type, description, date_recorded)
SELECT 
    '0865abc8-f5d4-45dd-80a6-708076d664d6',
    s.id,
    CASE 
        WHEN s.name = 'Mathematics' THEN 2.5
        WHEN s.name = 'English' THEN 1.8
        WHEN s.name = 'Science' THEN 2.2
        WHEN s.name = 'History' THEN 2.0
    END,
    'written',
    CASE 
        WHEN s.name = 'Mathematics' THEN 'Algebra Test'
        WHEN s.name = 'English' THEN 'Essay Assignment'
        WHEN s.name = 'Science' THEN 'Chemistry Lab Report'
        WHEN s.name = 'History' THEN 'World War II Essay'
    END,
    CURRENT_DATE - INTERVAL '7 days'
FROM subjects s 
WHERE s.user_id = '0865abc8-f5d4-45dd-80a6-708076d664d6';

-- Insert more recent grades
INSERT INTO grades (user_id, subject_id, grade_value, grade_type, description, date_recorded)
SELECT 
    '0865abc8-f5d4-45dd-80a6-708076d664d6',
    s.id,
    CASE 
        WHEN s.name = 'Mathematics' THEN 1.5
        WHEN s.name = 'English' THEN 2.3
        WHEN s.name = 'Science' THEN 1.8
        WHEN s.name = 'History' THEN 2.5
    END,
    'oral',
    CASE 
        WHEN s.name = 'Mathematics' THEN 'Class Participation'
        WHEN s.name = 'English' THEN 'Reading Comprehension'
        WHEN s.name = 'Science' THEN 'Lab Discussion'
        WHEN s.name = 'History' THEN 'Presentation'
    END,
    CURRENT_DATE - INTERVAL '2 days'
FROM subjects s 
WHERE s.user_id = '0865abc8-f5d4-45dd-80a6-708076d664d6';

-- Insert sample tasks/homework for the child
INSERT INTO tasks (user_id, subject_id, title, description, due_date, priority, status, task_type)
SELECT 
    '0865abc8-f5d4-45dd-80a6-708076d664d6',
    s.id,
    CASE 
        WHEN s.name = 'Mathematics' THEN 'Quadratic Equations Homework'
        WHEN s.name = 'English' THEN 'Read Chapter 5-7'
        WHEN s.name = 'Science' THEN 'Chemistry Lab Report'
        WHEN s.name = 'History' THEN 'Research Ancient Rome'
    END,
    CASE 
        WHEN s.name = 'Mathematics' THEN 'Complete exercises 1-20 on page 145'
        WHEN s.name = 'English' THEN 'Read chapters and prepare summary'
        WHEN s.name = 'Science' THEN 'Write lab report on acid-base reactions'
        WHEN s.name = 'History' THEN 'Research and write 2-page essay on Roman Empire'
    END,
    CURRENT_DATE + INTERVAL '3 days',
    'medium',
    'pending',
    'homework'
FROM subjects s 
WHERE s.user_id = '0865abc8-f5d4-45dd-80a6-708076d664d6';

-- Insert some completed tasks
INSERT INTO tasks (user_id, subject_id, title, description, due_date, priority, status, task_type)
SELECT 
    '0865abc8-f5d4-45dd-80a6-708076d664d6',
    s.id,
    CASE 
        WHEN s.name = 'Mathematics' THEN 'Linear Equations Practice'
        WHEN s.name = 'English' THEN 'Grammar Exercises'
        WHEN s.name = 'Science' THEN 'Physics Problem Set'
        WHEN s.name = 'History' THEN 'Timeline Assignment'
    END,
    CASE 
        WHEN s.name = 'Mathematics' THEN 'Practice problems from textbook'
        WHEN s.name = 'English' THEN 'Complete grammar worksheet'
        WHEN s.name = 'Science' THEN 'Solve physics problems 1-15'
        WHEN s.name = 'History' THEN 'Create timeline of major events'
    END,
    CURRENT_DATE - INTERVAL '1 day',
    'low',
    'completed',
    'homework'
FROM subjects s 
WHERE s.user_id = '0865abc8-f5d4-45dd-80a6-708076d664d6';

-- Verify the data was inserted
SELECT 'Subjects' as table_name, COUNT(*) as count FROM subjects WHERE user_id = '0865abc8-f5d4-45dd-80a6-708076d664d6'
UNION ALL
SELECT 'Grades' as table_name, COUNT(*) as count FROM grades WHERE user_id = '0865abc8-f5d4-45dd-80a6-708076d664d6'
UNION ALL
SELECT 'Tasks' as table_name, COUNT(*) as count FROM tasks WHERE user_id = '0865abc8-f5d4-45dd-80a6-708076d664d6';