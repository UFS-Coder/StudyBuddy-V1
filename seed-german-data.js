// Seed script for German Gymnasium data
// This script creates sample data that can be viewed when logged in as test@kovsies.ufs.ac.za
// Run with: node seed-german-data.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedGermanGymnasiumData() {
  try {
    console.log('Starting German Gymnasium data seeding...');
    console.log('Note: You need to be logged in as test@kovsies.ufs.ac.za to see this data.');
    
    // First, let's try to sign in as the test user
    console.log('Attempting to sign in as test user...');
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test@kovsies.ufs.ac.za',
      password: 'testpassword123' // You may need to adjust this
    });
    
    if (authError) {
      console.log('Could not sign in as test user. Creating data for manual import...');
      console.log('Auth error:', authError.message);
      
      // Create a JSON file with the data that can be manually imported
      const sampleData = {
        subjects: [
          {
            name: 'Mathematik',
            teacher: 'Dr. Schmidt',
            room: 'R101',
            course_type: 'LK',
            credits: 5,
            current_grade: 2.3,
            target_grade: 1.5,
            color: '#3B82F6'
          },
          {
            name: 'Deutsch',
            teacher: 'Frau Müller',
            room: 'R205',
            course_type: 'LK',
            credits: 5,
            current_grade: 2.1,
            target_grade: 1.8,
            color: '#EF4444'
          },
          {
            name: 'Physik',
            teacher: 'Herr Weber',
            room: 'L301',
            course_type: 'GK',
            credits: 3,
            current_grade: 2.7,
            target_grade: 2.0,
            color: '#10B981'
          },
          {
            name: 'Geschichte',
            teacher: 'Frau Klein',
            room: 'R150',
            course_type: 'GK',
            credits: 3,
            current_grade: 2.5,
            target_grade: 2.2,
            color: '#F59E0B'
          },
          {
            name: 'Biologie',
            teacher: 'Dr. Fischer',
            room: 'L201',
            course_type: 'GK',
            credits: 3,
            current_grade: 2.4,
            target_grade: 2.0,
            color: '#8B5CF6'
          }
        ],
        gradeTemplates: {
          mathematics: [
            // Written Exams
            { grade: 2.0, type: 'Klassenarbeit', weight: 3.0, notes: 'Integralrechnung', date: '2024-01-15' },
            { grade: 2.5, type: 'Klausur', weight: 4.0, notes: 'Analysis Klausur Q1', date: '2024-02-20' },
            { grade: 1.8, type: 'Test', weight: 2.0, notes: 'Differentialrechnung Test', date: '2024-01-30' },
            // SoMi
            { grade: 2.2, type: 'Meldung', weight: 1.0, notes: 'Aktive Teilnahme Januar', date: '2024-01-25' },
            { grade: 2.0, type: 'Hausaufgabe', weight: 1.5, notes: 'Übungsblatt 5', date: '2024-02-05' },
            { grade: 2.3, type: 'Mitarbeit', weight: 2.0, notes: 'Gruppenarbeit Funktionen', date: '2024-02-10' },
            { grade: 1.9, type: 'Mündliche Note', weight: 2.5, notes: 'Tafelleistung Februar', date: '2024-02-15' },
            // Projects
            { grade: 2.1, type: 'Referat', weight: 2.5, notes: 'Geschichte der Mathematik', date: '2024-01-20' },
            { grade: 2.4, type: 'Projekt', weight: 3.0, notes: 'Anwendung von Integralen', date: '2024-02-25' },
            // Effort & Progress
            { grade: 2.0, type: 'Anstrengung', weight: 1.0, notes: 'Kontinuierliche Verbesserung', date: '2024-02-28' },
            { grade: 1.8, type: 'Fortschritt', weight: 1.0, notes: 'Deutliche Steigerung', date: '2024-02-28' }
          ]
        }
      };
      
      console.log('\n=== SAMPLE DATA FOR MANUAL IMPORT ===');
      console.log('To test the German Gymnasium features:');
      console.log('1. Create an account with email: test@kovsies.ufs.ac.za');
      console.log('2. Add the following subjects manually in the app:');
      console.log(JSON.stringify(sampleData.subjects, null, 2));
      console.log('\n3. Add grades for each subject using the grade templates provided.');
      console.log('\nThis will demonstrate all 5 German Gymnasium components:');
      console.log('- Written Exams (Klassenarbeit, Klausur, Test)');
      console.log('- SoMi - Sonstige Mitarbeit (Meldung, Hausaufgabe, Mitarbeit, Mündliche Note)');
      console.log('- Projects/Presentations (Referat, Projekt, Facharbeit)');
      console.log('- Practical Elements (Praktikum, Labor, Experiment)');
      console.log('- Effort & Progress (Anstrengung, Fortschritt, Engagement, Verbesserung)');
      
      return;
    }
    
    console.log('Successfully signed in as test user!');
    const userId = authData.user.id;
    
    // Clean existing data
    console.log('Cleaning existing data...');
    const { data: existingSubjects } = await supabase
      .from('subjects')
      .select('id')
      .eq('user_id', userId);
    
    if (existingSubjects && existingSubjects.length > 0) {
      const subjectIds = existingSubjects.map(s => s.id);
      await supabase.from('grades').delete().in('subject_id', subjectIds);
      await supabase.from('subjects').delete().eq('user_id', userId);
    }
    
    // Insert subjects
    console.log('Inserting subjects...');
    const { data: subjects, error: subjectsError } = await supabase
      .from('subjects')
      .insert([
        {
          user_id: userId,
          name: 'Mathematik',
          teacher: 'Dr. Schmidt',
          room: 'R101',
          course_type: 'LK',
          credits: 5,
          current_grade: 2.3,
          target_grade: 1.5,
          color: '#3B82F6'
        },
        {
          user_id: userId,
          name: 'Deutsch',
          teacher: 'Frau Müller',
          room: 'R205',
          course_type: 'LK',
          credits: 5,
          current_grade: 2.1,
          target_grade: 1.8,
          color: '#EF4444'
        },
        {
          user_id: userId,
          name: 'Physik',
          teacher: 'Herr Weber',
          room: 'L301',
          course_type: 'GK',
          credits: 3,
          current_grade: 2.7,
          target_grade: 2.0,
          color: '#10B981'
        },
        {
          user_id: userId,
          name: 'Geschichte',
          teacher: 'Frau Klein',
          room: 'R150',
          course_type: 'GK',
          credits: 3,
          current_grade: 2.5,
          target_grade: 2.2,
          color: '#F59E0B'
        },
        {
          user_id: userId,
          name: 'Biologie',
          teacher: 'Dr. Fischer',
          room: 'L201',
          course_type: 'GK',
          credits: 3,
          current_grade: 2.4,
          target_grade: 2.0,
          color: '#8B5CF6'
        }
      ])
      .select();
    
    if (subjectsError) {
      throw subjectsError;
    }
    
    console.log('Subjects inserted:', subjects.length);
    
    // Get subject IDs
    const mathId = subjects.find(s => s.name === 'Mathematik')?.id;
    const germanId = subjects.find(s => s.name === 'Deutsch')?.id;
    const physicsId = subjects.find(s => s.name === 'Physik')?.id;
    const historyId = subjects.find(s => s.name === 'Geschichte')?.id;
    const biologyId = subjects.find(s => s.name === 'Biologie')?.id;
    
    // Insert comprehensive grades for all components
    console.log('Inserting grades for all German Gymnasium components...');
    const grades = [
      // MATHEMATICS - All 5 components
      { subject_id: mathId, user_id: userId, title: 'Klassenarbeit Analysis', grade: 2.0, type: 'Klassenarbeit', weight: 3.0, notes: 'Integralrechnung', date_received: '2024-01-15' },
      { subject_id: mathId, user_id: userId, title: 'Klausur Q1', grade: 2.5, type: 'Klausur', weight: 4.0, notes: 'Analysis Klausur Q1', date_received: '2024-02-20' },
      { subject_id: mathId, user_id: userId, title: 'Test Differentialrechnung', grade: 1.8, type: 'Test', weight: 2.0, notes: 'Differentialrechnung Test', date_received: '2024-01-30' },
      { subject_id: mathId, user_id: userId, title: 'Meldung Januar', grade: 2.2, type: 'Meldung', weight: 1.0, notes: 'Aktive Teilnahme Januar', date_received: '2024-01-25' },
      { subject_id: mathId, user_id: userId, title: 'Hausaufgaben', grade: 2.0, type: 'Hausaufgabe', weight: 1.5, notes: 'Übungsblatt 5', date_received: '2024-02-05' },
      { subject_id: mathId, user_id: userId, title: 'Mitarbeit Funktionen', grade: 2.3, type: 'Mitarbeit', weight: 2.0, notes: 'Gruppenarbeit Funktionen', date_received: '2024-02-10' },
      { subject_id: mathId, user_id: userId, title: 'Mündliche Note', grade: 1.9, type: 'Mündliche Note', weight: 2.5, notes: 'Tafelleistung Februar', date_received: '2024-02-15' },
      { subject_id: mathId, user_id: userId, title: 'Referat Geschichte', grade: 2.1, type: 'Referat', weight: 2.5, notes: 'Geschichte der Mathematik', date_received: '2024-01-20' },
      { subject_id: mathId, user_id: userId, title: 'Projekt Integrale', grade: 2.4, type: 'Projekt', weight: 3.0, notes: 'Anwendung von Integralen', date_received: '2024-02-25' },
      { subject_id: mathId, user_id: userId, title: 'Anstrengung', grade: 2.0, type: 'Anstrengung', weight: 1.0, notes: 'Kontinuierliche Verbesserung', date_received: '2024-02-28' },
      { subject_id: mathId, user_id: userId, title: 'Fortschritt', grade: 1.8, type: 'Fortschritt', weight: 1.0, notes: 'Deutliche Steigerung', date_received: '2024-02-28' },
      
      // PHYSICS - Including practical elements
      { subject_id: physicsId, user_id: userId, title: 'Klassenarbeit Mechanik', grade: 2.8, type: 'Klassenarbeit', weight: 3.0, notes: 'Mechanik Grundlagen', date_received: '2024-01-22' },
      { subject_id: physicsId, user_id: userId, title: 'Test Kräfte', grade: 2.5, type: 'Test', weight: 2.0, notes: 'Kräfte und Bewegung', date_received: '2024-02-05' },
      { subject_id: physicsId, user_id: userId, title: 'Meldung Experiment', grade: 2.7, type: 'Meldung', weight: 1.0, notes: 'Experimentbeschreibung', date_received: '2024-02-01' },
      { subject_id: physicsId, user_id: userId, title: 'Hausaufgaben', grade: 2.6, type: 'Hausaufgabe', weight: 1.5, notes: 'Berechnungsaufgaben', date_received: '2024-02-10' },
      { subject_id: physicsId, user_id: userId, title: 'Mitarbeit Labor', grade: 2.8, type: 'Mitarbeit', weight: 2.0, notes: 'Laborprotokoll', date_received: '2024-02-15' },
      { subject_id: physicsId, user_id: userId, title: 'Praktikum Pendel', grade: 2.4, type: 'Praktikum', weight: 3.0, notes: 'Pendel-Experiment', date_received: '2024-01-30' },
      { subject_id: physicsId, user_id: userId, title: 'Labor Geschwindigkeit', grade: 2.7, type: 'Labor', weight: 2.5, notes: 'Geschwindigkeitsmessung', date_received: '2024-02-12' },
      { subject_id: physicsId, user_id: userId, title: 'Experiment Fall', grade: 2.5, type: 'Experiment', weight: 2.0, notes: 'Freier Fall', date_received: '2024-02-20' },
      { subject_id: physicsId, user_id: userId, title: 'Fortschritt', grade: 2.5, type: 'Fortschritt', weight: 1.0, notes: 'Gute Entwicklung', date_received: '2024-02-28' },
      
      // GERMAN - Including Facharbeit
      { subject_id: germanId, user_id: userId, title: 'Klassenarbeit Gedichte', grade: 2.2, type: 'Klassenarbeit', weight: 3.0, notes: 'Gedichtanalyse', date_received: '2024-01-18' },
      { subject_id: germanId, user_id: userId, title: 'Klausur Romantik', grade: 1.9, type: 'Klausur', weight: 4.0, notes: 'Literaturepoche Romantik', date_received: '2024-02-22' },
      { subject_id: germanId, user_id: userId, title: 'Test Grammatik', grade: 2.3, type: 'Test', weight: 2.0, notes: 'Grammatik und Stil', date_received: '2024-02-01' },
      { subject_id: germanId, user_id: userId, title: 'Meldung Diskussion', grade: 2.1, type: 'Meldung', weight: 1.0, notes: 'Diskussionsbeiträge', date_received: '2024-01-28' },
      { subject_id: germanId, user_id: userId, title: 'Hausaufgaben Goethe', grade: 2.0, type: 'Hausaufgabe', weight: 1.5, notes: 'Textanalyse Goethe', date_received: '2024-02-08' },
      { subject_id: germanId, user_id: userId, title: 'Mitarbeit Interpretation', grade: 2.2, type: 'Mitarbeit', weight: 2.0, notes: 'Gruppeninterpretation', date_received: '2024-02-12' },
      { subject_id: germanId, user_id: userId, title: 'Mündliche Note', grade: 1.8, type: 'Mündliche Note', weight: 2.5, notes: 'Gedichtvortrag', date_received: '2024-02-18' },
      { subject_id: germanId, user_id: userId, title: 'Referat Heine', grade: 2.0, type: 'Referat', weight: 2.5, notes: 'Heinrich Heine Biographie', date_received: '2024-01-25' },
      { subject_id: germanId, user_id: userId, title: 'Facharbeit Sprache', grade: 2.3, type: 'Facharbeit', weight: 4.0, notes: 'Sprachentwicklung im 19. Jh.', date_received: '2024-02-20' },
      { subject_id: germanId, user_id: userId, title: 'Anstrengung', grade: 2.1, type: 'Anstrengung', weight: 1.0, notes: 'Stetige Verbesserung', date_received: '2024-02-28' },
      
      // HISTORY
      { subject_id: historyId, user_id: userId, title: 'Klassenarbeit Weimar', grade: 2.6, type: 'Klassenarbeit', weight: 3.0, notes: 'Weimarer Republik', date_received: '2024-01-25' },
      { subject_id: historyId, user_id: userId, title: 'Test Industrialisierung', grade: 2.4, type: 'Test', weight: 2.0, notes: 'Industrialisierung', date_received: '2024-02-08' },
      { subject_id: historyId, user_id: userId, title: 'Meldung Quellen', grade: 2.5, type: 'Meldung', weight: 1.0, notes: 'Quellenanalyse', date_received: '2024-02-03' },
      { subject_id: historyId, user_id: userId, title: 'Hausaufgaben Zeitstrahl', grade: 2.3, type: 'Hausaufgabe', weight: 1.5, notes: 'Zeitstrahl erstellen', date_received: '2024-02-12' },
      { subject_id: historyId, user_id: userId, title: 'Mitarbeit Demokratie', grade: 2.7, type: 'Mitarbeit', weight: 2.0, notes: 'Diskussion Demokratie', date_received: '2024-02-18' },
      { subject_id: historyId, user_id: userId, title: 'Referat Bismarck', grade: 2.3, type: 'Referat', weight: 2.5, notes: 'Bismarck Politik', date_received: '2024-01-28' },
      { subject_id: historyId, user_id: userId, title: 'Projekt Lokalgeschichte', grade: 2.6, type: 'Projekt', weight: 3.0, notes: 'Lokalgeschichte Forschung', date_received: '2024-02-22' },
      { subject_id: historyId, user_id: userId, title: 'Engagement', grade: 2.4, type: 'Engagement', weight: 1.0, notes: 'Aktive Teilnahme', date_received: '2024-02-28' },
      
      // BIOLOGY
      { subject_id: biologyId, user_id: userId, title: 'Klassenarbeit Zellen', grade: 2.5, type: 'Klassenarbeit', weight: 3.0, notes: 'Zellbiologie', date_received: '2024-01-28' },
      { subject_id: biologyId, user_id: userId, title: 'Test Photosynthese', grade: 2.3, type: 'Test', weight: 2.0, notes: 'Photosynthese', date_received: '2024-02-10' },
      { subject_id: biologyId, user_id: userId, title: 'Meldung Ökosystem', grade: 2.4, type: 'Meldung', weight: 1.0, notes: 'Ökosystem Erklärung', date_received: '2024-02-05' },
      { subject_id: biologyId, user_id: userId, title: 'Hausaufgaben Mikroskopie', grade: 2.2, type: 'Hausaufgabe', weight: 1.5, notes: 'Mikroskopie Protokoll', date_received: '2024-02-14' },
      { subject_id: biologyId, user_id: userId, title: 'Mitarbeit Experiment', grade: 2.6, type: 'Mitarbeit', weight: 2.0, notes: 'Gruppenexperiment', date_received: '2024-02-20' },
      { subject_id: biologyId, user_id: userId, title: 'Praktikum Zellteilung', grade: 2.3, type: 'Praktikum', weight: 3.0, notes: 'Zellteilung beobachten', date_received: '2024-02-01' },
      { subject_id: biologyId, user_id: userId, title: 'Labor DNA', grade: 2.5, type: 'Labor', weight: 2.5, notes: 'DNA Extraktion', date_received: '2024-02-15' },
      { subject_id: biologyId, user_id: userId, title: 'Experiment Enzyme', grade: 2.1, type: 'Experiment', weight: 2.0, notes: 'Enzymaktivität', date_received: '2024-02-25' },
      { subject_id: biologyId, user_id: userId, title: 'Verbesserung', grade: 2.2, type: 'Verbesserung', weight: 1.0, notes: 'Deutlicher Fortschritt', date_received: '2024-02-28' }
    ];
    
    const { error: gradesError } = await supabase
      .from('grades')
      .insert(grades);
    
    if (gradesError) {
      throw gradesError;
    }
    
    console.log('Grades inserted:', grades.length);
    console.log('\n=== SUCCESS! ===');
    console.log('German Gymnasium data seeding completed successfully!');
    console.log('User ID:', userId);
    console.log('\nThe following components are now available for analysis:');
    console.log('✓ Written Exams (Klassenarbeit, Klausur, Test)');
    console.log('✓ SoMi - Sonstige Mitarbeit (Meldung, Hausaufgabe, Mitarbeit, Mündliche Note)');
    console.log('✓ Projects/Presentations (Referat, Projekt, Facharbeit)');
    console.log('✓ Practical Elements (Praktikum, Labor, Experiment)');
    console.log('✓ Effort & Progress (Anstrengung, Fortschritt, Engagement, Verbesserung)');
    console.log('\nLogin as test@kovsies.ufs.ac.za to view the analysis!');
    
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedGermanGymnasiumData();