-- Seed data for German Gymnasium grade calculations
-- User: test@kovsies.ufs.ac.za

-- Insert seed data for German Gymnasium components demonstration
DO $$
DECLARE
    test_user_id UUID;
    math_subject_id UUID;
    german_subject_id UUID;
    physics_subject_id UUID;
    history_subject_id UUID;
    biology_subject_id UUID;
BEGIN
    -- Try to find existing user or create a placeholder
    SELECT id INTO test_user_id FROM auth.users WHERE email = 'test@kovsies.ufs.ac.za' LIMIT 1;
    
    -- If user doesn't exist, we'll use a fixed UUID for demonstration
    IF test_user_id IS NULL THEN
        test_user_id := '550e8400-e29b-41d4-a716-446655440000'::UUID;
    END IF;
    
    -- Delete existing data for this user to avoid duplicates
    DELETE FROM grades WHERE subject_id IN (SELECT id FROM subjects WHERE user_id = test_user_id);
    DELETE FROM subjects WHERE user_id = test_user_id;
    
    -- Insert subjects with proper course types
    INSERT INTO subjects (id, user_id, name, teacher, room, course_type, credits, current_grade, target_grade, color)
    VALUES 
        (gen_random_uuid(), test_user_id, 'Mathematik', 'Dr. Schmidt', 'R101', 'LK', 5, 2.3, 1.5, '#3B82F6'),
        (gen_random_uuid(), test_user_id, 'Deutsch', 'Frau Müller', 'R205', 'LK', 5, 2.1, 1.8, '#EF4444'),
        (gen_random_uuid(), test_user_id, 'Physik', 'Herr Weber', 'L301', 'GK', 3, 2.7, 2.0, '#10B981'),
        (gen_random_uuid(), test_user_id, 'Geschichte', 'Frau Klein', 'R150', 'GK', 3, 2.5, 2.2, '#F59E0B'),
        (gen_random_uuid(), test_user_id, 'Biologie', 'Dr. Fischer', 'L201', 'GK', 3, 2.4, 2.0, '#8B5CF6');
    
    -- Get subject IDs
    SELECT id INTO math_subject_id FROM subjects WHERE user_id = test_user_id AND name = 'Mathematik';
    SELECT id INTO german_subject_id FROM subjects WHERE user_id = test_user_id AND name = 'Deutsch';
    SELECT id INTO physics_subject_id FROM subjects WHERE user_id = test_user_id AND name = 'Physik';
    SELECT id INTO history_subject_id FROM subjects WHERE user_id = test_user_id AND name = 'Geschichte';
    SELECT id INTO biology_subject_id FROM subjects WHERE user_id = test_user_id AND name = 'Biologie';
    
    -- Insert grades for all five German Gymnasium components
    
    -- MATHEMATICS (LK) - Written Exams
    INSERT INTO grades (subject_id, user_id, grade, type, weight, description, date)
    VALUES 
        (math_subject_id, test_user_id, 2.0, 'Klassenarbeit', 3.0, 'Integralrechnung', '2024-01-15'),
        (math_subject_id, test_user_id, 2.5, 'Klausur', 4.0, 'Analysis Klausur Q1', '2024-02-20'),
        (math_subject_id, test_user_id, 1.8, 'Test', 2.0, 'Differentialrechnung Test', '2024-01-30');
    
    -- MATHEMATICS - SoMi (Sonstige Mitarbeit)
    INSERT INTO grades (subject_id, user_id, grade, type, weight, description, date)
    VALUES 
        (math_subject_id, test_user_id, 2.2, 'Meldung', 1.0, 'Aktive Teilnahme Januar', '2024-01-25'),
        (math_subject_id, test_user_id, 2.0, 'Hausaufgabe', 1.5, 'Übungsblatt 5', '2024-02-05'),
        (math_subject_id, test_user_id, 2.3, 'Mitarbeit', 2.0, 'Gruppenarbeit Funktionen', '2024-02-10'),
        (math_subject_id, test_user_id, 1.9, 'Mündliche Note', 2.5, 'Tafelleistung Februar', '2024-02-15');
    
    -- MATHEMATICS - Projects/Presentations
    INSERT INTO grades (subject_id, user_id, grade, type, weight, description, date)
    VALUES 
        (math_subject_id, test_user_id, 2.1, 'Referat', 2.5, 'Geschichte der Mathematik', '2024-01-20'),
        (math_subject_id, test_user_id, 2.4, 'Projekt', 3.0, 'Anwendung von Integralen', '2024-02-25');
    
    -- MATHEMATICS - Effort & Progress
    INSERT INTO grades (subject_id, user_id, grade, type, weight, description, date)
    VALUES 
        (math_subject_id, test_user_id, 2.0, 'Anstrengung', 1.0, 'Kontinuierliche Verbesserung', '2024-02-28'),
        (math_subject_id, test_user_id, 1.8, 'Fortschritt', 1.0, 'Deutliche Steigerung', '2024-02-28');
    
    -- GERMAN (LK) - Written Exams
    INSERT INTO grades (subject_id, user_id, grade, type, weight, description, date)
    VALUES 
        (german_subject_id, test_user_id, 2.2, 'Klassenarbeit', 3.0, 'Gedichtanalyse', '2024-01-18'),
        (german_subject_id, test_user_id, 1.9, 'Klausur', 4.0, 'Literaturepoche Romantik', '2024-02-22'),
        (german_subject_id, test_user_id, 2.3, 'Test', 2.0, 'Grammatik und Stil', '2024-02-01');
    
    -- GERMAN - SoMi
    INSERT INTO grades (subject_id, user_id, grade, type, weight, description, date)
    VALUES 
        (german_subject_id, test_user_id, 2.1, 'Meldung', 1.0, 'Diskussionsbeiträge', '2024-01-28'),
        (german_subject_id, test_user_id, 2.0, 'Hausaufgabe', 1.5, 'Textanalyse Goethe', '2024-02-08'),
        (german_subject_id, test_user_id, 2.2, 'Mitarbeit', 2.0, 'Gruppeninterpretation', '2024-02-12'),
        (german_subject_id, test_user_id, 1.8, 'Mündliche Note', 2.5, 'Gedichtvortrag', '2024-02-18');
    
    -- GERMAN - Projects/Presentations
    INSERT INTO grades (subject_id, user_id, grade, type, weight, description, date)
    VALUES 
        (german_subject_id, test_user_id, 2.0, 'Referat', 2.5, 'Heinrich Heine Biographie', '2024-01-25'),
        (german_subject_id, test_user_id, 2.3, 'Facharbeit', 4.0, 'Sprachentwicklung im 19. Jh.', '2024-02-20');
    
    -- PHYSICS (GK) - Written Exams
    INSERT INTO grades (subject_id, user_id, grade, type, weight, description, date)
    VALUES 
        (physics_subject_id, test_user_id, 2.8, 'Klassenarbeit', 3.0, 'Mechanik Grundlagen', '2024-01-22'),
        (physics_subject_id, test_user_id, 2.5, 'Test', 2.0, 'Kräfte und Bewegung', '2024-02-05');
    
    -- PHYSICS - SoMi
    INSERT INTO grades (subject_id, user_id, grade, type, weight, description, date)
    VALUES 
        (physics_subject_id, test_user_id, 2.7, 'Meldung', 1.0, 'Experimentbeschreibung', '2024-02-01'),
        (physics_subject_id, test_user_id, 2.6, 'Hausaufgabe', 1.5, 'Berechnungsaufgaben', '2024-02-10'),
        (physics_subject_id, test_user_id, 2.8, 'Mitarbeit', 2.0, 'Laborprotokoll', '2024-02-15');
    
    -- PHYSICS - Practical Elements
    INSERT INTO grades (subject_id, user_id, grade, type, weight, description, date)
    VALUES 
        (physics_subject_id, test_user_id, 2.4, 'Praktikum', 3.0, 'Pendel-Experiment', '2024-01-30'),
        (physics_subject_id, test_user_id, 2.7, 'Labor', 2.5, 'Geschwindigkeitsmessung', '2024-02-12'),
        (physics_subject_id, test_user_id, 2.5, 'Experiment', 2.0, 'Freier Fall', '2024-02-20');
    
    -- HISTORY (GK) - Written Exams
    INSERT INTO grades (subject_id, user_id, grade, type, weight, description, date)
    VALUES 
        (history_subject_id, test_user_id, 2.6, 'Klassenarbeit', 3.0, 'Weimarer Republik', '2024-01-25'),
        (history_subject_id, test_user_id, 2.4, 'Test', 2.0, 'Industrialisierung', '2024-02-08');
    
    -- HISTORY - SoMi
    INSERT INTO grades (subject_id, user_id, grade, type, weight, description, date)
    VALUES 
        (history_subject_id, test_user_id, 2.5, 'Meldung', 1.0, 'Quellenanalyse', '2024-02-03'),
        (history_subject_id, test_user_id, 2.3, 'Hausaufgabe', 1.5, 'Zeitstrahl erstellen', '2024-02-12'),
        (history_subject_id, test_user_id, 2.7, 'Mitarbeit', 2.0, 'Diskussion Demokratie', '2024-02-18');
    
    -- HISTORY - Projects/Presentations
    INSERT INTO grades (subject_id, user_id, grade, type, weight, description, date)
    VALUES 
        (history_subject_id, test_user_id, 2.3, 'Referat', 2.5, 'Bismarck Politik', '2024-01-28'),
        (history_subject_id, test_user_id, 2.6, 'Projekt', 3.0, 'Lokalgeschichte Forschung', '2024-02-22');
    
    -- BIOLOGY (GK) - Written Exams
    INSERT INTO grades (subject_id, user_id, grade, type, weight, description, date)
    VALUES 
        (biology_subject_id, test_user_id, 2.5, 'Klassenarbeit', 3.0, 'Zellbiologie', '2024-01-28'),
        (biology_subject_id, test_user_id, 2.3, 'Test', 2.0, 'Photosynthese', '2024-02-10');
    
    -- BIOLOGY - SoMi
    INSERT INTO grades (subject_id, user_id, grade, type, weight, description, date)
    VALUES 
        (biology_subject_id, test_user_id, 2.4, 'Meldung', 1.0, 'Ökosystem Erklärung', '2024-02-05'),
        (biology_subject_id, test_user_id, 2.2, 'Hausaufgabe', 1.5, 'Mikroskopie Protokoll', '2024-02-14'),
        (biology_subject_id, test_user_id, 2.6, 'Mitarbeit', 2.0, 'Gruppenexperiment', '2024-02-20');
    
    -- BIOLOGY - Practical Elements
    INSERT INTO grades (subject_id, user_id, grade, type, weight, description, date)
    VALUES 
        (biology_subject_id, test_user_id, 2.3, 'Praktikum', 3.0, 'Zellteilung beobachten', '2024-02-01'),
        (biology_subject_id, test_user_id, 2.5, 'Labor', 2.5, 'DNA Extraktion', '2024-02-15'),
        (biology_subject_id, test_user_id, 2.1, 'Experiment', 2.0, 'Enzymaktivität', '2024-02-25');
    
    -- Additional Effort & Progress grades for all subjects
    INSERT INTO grades (subject_id, user_id, grade, type, weight, description, date)
    VALUES 
        (german_subject_id, test_user_id, 2.1, 'Anstrengung', 1.0, 'Stetige Verbesserung', '2024-02-28'),
        (physics_subject_id, test_user_id, 2.5, 'Fortschritt', 1.0, 'Gute Entwicklung', '2024-02-28'),
        (history_subject_id, test_user_id, 2.4, 'Engagement', 1.0, 'Aktive Teilnahme', '2024-02-28'),
        (biology_subject_id, test_user_id, 2.2, 'Verbesserung', 1.0, 'Deutlicher Fortschritt', '2024-02-28');
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the migration
        RAISE NOTICE 'Error inserting German Gymnasium seed data: %', SQLERRM;
END $$;