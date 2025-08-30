-- Seed data for test user: test@kovsies.ufs.ac.za
-- This script creates sample subjects and grades to demonstrate Durchschnittsnote calculation

-- First, let's get the user ID for test@kovsies.ufs.ac.za
-- Note: This assumes the user already exists in auth.users

-- Insert sample subjects with LK/GK designations
INSERT INTO public.subjects (name, teacher, room, color, credits, target_grade, course_type, user_id)
SELECT 
  'Deutsch' as name,
  'Frau Schmidt' as teacher,
  'A101' as room,
  '#ef4444' as color,
  4 as credits,
  2.0 as target_grade,
  'GK' as course_type,
  au.id as user_id
FROM auth.users au 
WHERE au.email = 'test@kovsies.ufs.ac.za'
ON CONFLICT DO NOTHING;

INSERT INTO public.subjects (name, teacher, room, color, credits, target_grade, course_type, user_id)
SELECT 
  'Mathematik' as name,
  'Herr Mueller' as teacher,
  'B205' as room,
  '#3b82f6' as color,
  5 as credits,
  2.5 as target_grade,
  'LK' as course_type,
  au.id as user_id
FROM auth.users au 
WHERE au.email = 'test@kovsies.ufs.ac.za'
ON CONFLICT DO NOTHING;

INSERT INTO public.subjects (name, teacher, room, color, credits, target_grade, course_type, user_id)
SELECT 
  'Englisch' as name,
  'Mrs. Johnson' as teacher,
  'C302' as room,
  '#10b981' as color,
  4 as credits,
  2.0 as target_grade,
  'LK' as course_type,
  au.id as user_id
FROM auth.users au 
WHERE au.email = 'test@kovsies.ufs.ac.za'
ON CONFLICT DO NOTHING;

INSERT INTO public.subjects (name, teacher, room, color, credits, target_grade, course_type, user_id)
SELECT 
  'Biologie' as name,
  'Dr. Weber' as teacher,
  'D104' as room,
  '#8b5cf6' as color,
  3 as credits,
  1.5 as target_grade,
  'GK' as course_type,
  au.id as user_id
FROM auth.users au 
WHERE au.email = 'test@kovsies.ufs.ac.za'
ON CONFLICT DO NOTHING;

INSERT INTO public.subjects (name, teacher, room, color, credits, target_grade, course_type, user_id)
SELECT 
  'Kunst' as name,
  'Frau Fischer' as teacher,
  'E201' as room,
  '#f59e0b' as color,
  2 as credits,
  2.0 as target_grade,
  'GK' as course_type,
  au.id as user_id
FROM auth.users au 
WHERE au.email = 'test@kovsies.ufs.ac.za'
ON CONFLICT DO NOTHING;

-- Insert sample grades for each subject
-- Deutsch (GK) grades
INSERT INTO public.grades (title, grade, weight, type, notes, date_received, subject_id, user_id)
SELECT 
  'Klausur 1' as title,
  2.0 as grade,
  2.0 as weight,
  'exam' as type,
  'Gedichtanalyse' as notes,
  '2024-10-15'::date as date_received,
  s.id as subject_id,
  au.id as user_id
FROM auth.users au, public.subjects s
WHERE au.email = 'test@kovsies.ufs.ac.za' 
  AND s.name = 'Deutsch' 
  AND s.user_id = au.id
ON CONFLICT DO NOTHING;

INSERT INTO public.grades (title, grade, weight, type, notes, date_received, subject_id, user_id)
SELECT 
  'Mündliche Prüfung' as title,
  2.3 as grade,
  1.0 as weight,
  'oral' as type,
  'Buchpräsentation' as notes,
  '2024-11-20'::date as date_received,
  s.id as subject_id,
  au.id as user_id
FROM auth.users au, public.subjects s
WHERE au.email = 'test@kovsies.ufs.ac.za' 
  AND s.name = 'Deutsch' 
  AND s.user_id = au.id
ON CONFLICT DO NOTHING;

-- Mathematik (LK) grades
INSERT INTO public.grades (title, grade, weight, type, notes, date_received, subject_id, user_id)
SELECT 
  'Klausur Analysis' as title,
  3.0 as grade,
  2.0 as weight,
  'exam' as type,
  'Integralrechnung' as notes,
  '2024-10-22'::date as date_received,
  s.id as subject_id,
  au.id as user_id
FROM auth.users au, public.subjects s
WHERE au.email = 'test@kovsies.ufs.ac.za' 
  AND s.name = 'Mathematik' 
  AND s.user_id = au.id
ON CONFLICT DO NOTHING;

INSERT INTO public.grades (title, grade, weight, type, notes, date_received, subject_id, user_id)
SELECT 
  'Test Stochastik' as title,
  2.7 as grade,
  1.0 as weight,
  'test' as type,
  'Wahrscheinlichkeitsrechnung' as notes,
  '2024-11-05'::date as date_received,
  s.id as subject_id,
  au.id as user_id
FROM auth.users au, public.subjects s
WHERE au.email = 'test@kovsies.ufs.ac.za' 
  AND s.name = 'Mathematik' 
  AND s.user_id = au.id
ON CONFLICT DO NOTHING;

-- Englisch (LK) grades
INSERT INTO public.grades (title, grade, weight, type, notes, date_received, subject_id, user_id)
SELECT 
  'Essay Writing' as title,
  2.0 as grade,
  2.0 as weight,
  'exam' as type,
  'Shakespeare Analysis' as notes,
  '2024-10-30'::date as date_received,
  s.id as subject_id,
  au.id as user_id
FROM auth.users au, public.subjects s
WHERE au.email = 'test@kovsies.ufs.ac.za' 
  AND s.name = 'Englisch' 
  AND s.user_id = au.id
ON CONFLICT DO NOTHING;

INSERT INTO public.grades (title, grade, weight, type, notes, date_received, subject_id, user_id)
SELECT 
  'Listening Comprehension' as title,
  2.3 as grade,
  1.0 as weight,
  'test' as type,
  'BBC News Analysis' as notes,
  '2024-11-12'::date as date_received,
  s.id as subject_id,
  au.id as user_id
FROM auth.users au, public.subjects s
WHERE au.email = 'test@kovsies.ufs.ac.za' 
  AND s.name = 'Englisch' 
  AND s.user_id = au.id
ON CONFLICT DO NOTHING;

-- Biologie (GK) grades
INSERT INTO public.grades (title, grade, weight, type, notes, date_received, subject_id, user_id)
SELECT 
  'Klausur Genetik' as title,
  1.0 as grade,
  2.0 as weight,
  'exam' as type,
  'Vererbungslehre' as notes,
  '2024-11-08'::date as date_received,
  s.id as subject_id,
  au.id as user_id
FROM auth.users au, public.subjects s
WHERE au.email = 'test@kovsies.ufs.ac.za' 
  AND s.name = 'Biologie' 
  AND s.user_id = au.id
ON CONFLICT DO NOTHING;

INSERT INTO public.grades (title, grade, weight, type, notes, date_received, subject_id, user_id)
SELECT 
  'Laborarbeit' as title,
  1.3 as grade,
  1.0 as weight,
  'practical' as type,
  'Mikroskopie' as notes,
  '2024-11-25'::date as date_received,
  s.id as subject_id,
  au.id as user_id
FROM auth.users au, public.subjects s
WHERE au.email = 'test@kovsies.ufs.ac.za' 
  AND s.name = 'Biologie' 
  AND s.user_id = au.id
ON CONFLICT DO NOTHING;

-- Kunst (GK) grades
INSERT INTO public.grades (title, grade, weight, type, notes, date_received, subject_id, user_id)
SELECT 
  'Praktische Arbeit' as title,
  2.0 as grade,
  1.5 as weight,
  'practical' as type,
  'Ölmalerei Landschaft' as notes,
  '2024-10-18'::date as date_received,
  s.id as subject_id,
  au.id as user_id
FROM auth.users au, public.subjects s
WHERE au.email = 'test@kovsies.ufs.ac.za' 
  AND s.name = 'Kunst' 
  AND s.user_id = au.id
ON CONFLICT DO NOTHING;

INSERT INTO public.grades (title, grade, weight, type, notes, date_received, subject_id, user_id)
SELECT 
  'Kunstgeschichte Test' as title,
  2.3 as grade,
  1.0 as weight,
  'test' as type,
  'Renaissance Künstler' as notes,
  '2024-11-15'::date as date_received,
  s.id as subject_id,
  au.id as user_id
FROM auth.users au, public.subjects s
WHERE au.email = 'test@kovsies.ufs.ac.za' 
  AND s.name = 'Kunst' 
  AND s.user_id = au.id
ON CONFLICT DO NOTHING;

-- Expected Durchschnittsnote calculation:
-- Deutsch (GK): (2.0*2 + 2.3*1) / (2+1) = 6.3/3 = 2.1
-- Mathematik (LK): (3.0*2 + 2.7*1) / (2+1) = 8.7/3 = 2.9
-- Englisch (LK): (2.0*2 + 2.3*1) / (2+1) = 6.3/3 = 2.1
-- Biologie (GK): (1.0*2 + 1.3*1) / (2+1) = 3.3/3 = 1.1
-- Kunst (GK): (2.0*1.5 + 2.3*1) / (1.5+1) = 5.3/2.5 = 2.12
--
-- LK Average: (2.9*2 + 2.1*2) / (2+2) = 10.0/4 = 2.5
-- GK Average: (2.1*1 + 1.1*1 + 2.12*1) / (1+1+1) = 5.32/3 = 1.77
-- Overall Durchschnittsnote: (2.5*2 + 1.77*3) / (2+3) = 10.31/5 = 2.06