-- Simple seed data for test@kovsies.ufs.ac.za
-- Copy and paste this into Supabase SQL Editor

-- Insert sample subjects with LK/GK designations
INSERT INTO public.subjects (name, teacher, room, color, credits, target_grade, course_type, user_id)
VALUES 
  ('Deutsch', 'Frau Schmidt', 'A101', '#ef4444', 4, 2.0, 'GK', (SELECT id FROM auth.users WHERE email = 'test@kovsies.ufs.ac.za' LIMIT 1)),
  ('Mathematik', 'Herr Mueller', 'B205', '#3b82f6', 5, 2.5, 'LK', (SELECT id FROM auth.users WHERE email = 'test@kovsies.ufs.ac.za' LIMIT 1)),
  ('Englisch', 'Mrs. Johnson', 'C302', '#10b981', 4, 2.0, 'LK', (SELECT id FROM auth.users WHERE email = 'test@kovsies.ufs.ac.za' LIMIT 1)),
  ('Biologie', 'Dr. Weber', 'D104', '#8b5cf6', 3, 1.5, 'GK', (SELECT id FROM auth.users WHERE email = 'test@kovsies.ufs.ac.za' LIMIT 1)),
  ('Kunst', 'Frau Fischer', 'E201', '#f59e0b', 2, 2.0, 'GK', (SELECT id FROM auth.users WHERE email = 'test@kovsies.ufs.ac.za' LIMIT 1))
ON CONFLICT DO NOTHING;

-- Insert sample grades
-- Deutsch grades
INSERT INTO public.grades (title, grade, weight, type, notes, date_received, subject_id, user_id)
VALUES 
  ('Klausur 1', 2.0, 2.0, 'exam', 'Gedichtanalyse', '2024-10-15', 
   (SELECT s.id FROM public.subjects s JOIN auth.users u ON s.user_id = u.id WHERE u.email = 'test@kovsies.ufs.ac.za' AND s.name = 'Deutsch' LIMIT 1),
   (SELECT id FROM auth.users WHERE email = 'test@kovsies.ufs.ac.za' LIMIT 1)),
  ('Mündliche Prüfung', 2.3, 1.0, 'oral', 'Buchpräsentation', '2024-11-20',
   (SELECT s.id FROM public.subjects s JOIN auth.users u ON s.user_id = u.id WHERE u.email = 'test@kovsies.ufs.ac.za' AND s.name = 'Deutsch' LIMIT 1),
   (SELECT id FROM auth.users WHERE email = 'test@kovsies.ufs.ac.za' LIMIT 1))
ON CONFLICT DO NOTHING;

-- Mathematik grades
INSERT INTO public.grades (title, grade, weight, type, notes, date_received, subject_id, user_id)
VALUES 
  ('Klausur Analysis', 3.0, 2.0, 'exam', 'Integralrechnung', '2024-10-22',
   (SELECT s.id FROM public.subjects s JOIN auth.users u ON s.user_id = u.id WHERE u.email = 'test@kovsies.ufs.ac.za' AND s.name = 'Mathematik' LIMIT 1),
   (SELECT id FROM auth.users WHERE email = 'test@kovsies.ufs.ac.za' LIMIT 1)),
  ('Test Stochastik', 2.7, 1.0, 'test', 'Wahrscheinlichkeitsrechnung', '2024-11-05',
   (SELECT s.id FROM public.subjects s JOIN auth.users u ON s.user_id = u.id WHERE u.email = 'test@kovsies.ufs.ac.za' AND s.name = 'Mathematik' LIMIT 1),
   (SELECT id FROM auth.users WHERE email = 'test@kovsies.ufs.ac.za' LIMIT 1))
ON CONFLICT DO NOTHING;

-- Englisch grades
INSERT INTO public.grades (title, grade, weight, type, notes, date_received, subject_id, user_id)
VALUES 
  ('Essay Writing', 2.0, 2.0, 'exam', 'Shakespeare Analysis', '2024-10-30',
   (SELECT s.id FROM public.subjects s JOIN auth.users u ON s.user_id = u.id WHERE u.email = 'test@kovsies.ufs.ac.za' AND s.name = 'Englisch' LIMIT 1),
   (SELECT id FROM auth.users WHERE email = 'test@kovsies.ufs.ac.za' LIMIT 1)),
  ('Listening Comprehension', 2.3, 1.0, 'test', 'BBC News Analysis', '2024-11-12',
   (SELECT s.id FROM public.subjects s JOIN auth.users u ON s.user_id = u.id WHERE u.email = 'test@kovsies.ufs.ac.za' AND s.name = 'Englisch' LIMIT 1),
   (SELECT id FROM auth.users WHERE email = 'test@kovsies.ufs.ac.za' LIMIT 1))
ON CONFLICT DO NOTHING;

-- Biologie grades
INSERT INTO public.grades (title, grade, weight, type, notes, date_received, subject_id, user_id)
VALUES 
  ('Klausur Genetik', 1.0, 2.0, 'exam', 'Vererbungslehre', '2024-11-08',
   (SELECT s.id FROM public.subjects s JOIN auth.users u ON s.user_id = u.id WHERE u.email = 'test@kovsies.ufs.ac.za' AND s.name = 'Biologie' LIMIT 1),
   (SELECT id FROM auth.users WHERE email = 'test@kovsies.ufs.ac.za' LIMIT 1)),
  ('Laborarbeit', 1.3, 1.0, 'practical', 'Mikroskopie', '2024-11-25',
   (SELECT s.id FROM public.subjects s JOIN auth.users u ON s.user_id = u.id WHERE u.email = 'test@kovsies.ufs.ac.za' AND s.name = 'Biologie' LIMIT 1),
   (SELECT id FROM auth.users WHERE email = 'test@kovsies.ufs.ac.za' LIMIT 1))
ON CONFLICT DO NOTHING;

-- Kunst grades
INSERT INTO public.grades (title, grade, weight, type, notes, date_received, subject_id, user_id)
VALUES 
  ('Praktische Arbeit', 2.0, 1.5, 'practical', 'Ölmalerei Landschaft', '2024-10-18',
   (SELECT s.id FROM public.subjects s JOIN auth.users u ON s.user_id = u.id WHERE u.email = 'test@kovsies.ufs.ac.za' AND s.name = 'Kunst' LIMIT 1),
   (SELECT id FROM auth.users WHERE email = 'test@kovsies.ufs.ac.za' LIMIT 1)),
  ('Kunstgeschichte Test', 2.3, 1.0, 'test', 'Renaissance Künstler', '2024-11-15',
   (SELECT s.id FROM public.subjects s JOIN auth.users u ON s.user_id = u.id WHERE u.email = 'test@kovsies.ufs.ac.za' AND s.name = 'Kunst' LIMIT 1),
   (SELECT id FROM auth.users WHERE email = 'test@kovsies.ufs.ac.za' LIMIT 1))
ON CONFLICT DO NOTHING;

-- Expected calculations:
-- LK Average: 2.5, GK Average: 1.77, Overall: 2.06