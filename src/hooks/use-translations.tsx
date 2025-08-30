import { useState } from 'react';

export type Language = 'de' | 'en';

export const translations = {
  de: {
    // App
    appName: "StudyBuddy",
    hello: "Hallo",
    welcomeName: (name: string) => `Hallo, ${name}!`,
    
    // Welcome banner
    welcomeBack: (name: string) => `Willkommen zurück, ${name}!`,
    welcomeMessage: "Du machst großartige Fortschritte. Hier ist dein aktueller Stand.",
    
    // Dashboard
    dashboard: "Dashboard",
    overview: "Übersicht",
    subjects: "Fächer",
    upcomingAssessments: "Anstehende Prüfungen",
    recentGrades: "Aktuelle Noten",
    
    // Subject types
    lk: "LK",
    gk: "GK",
    
    // Noten
    average: "Durchschnitt",
    progress: "Fortschritt",
    
    // Assessment types
    klausur: "Klausur",
    test: "Test",
    muendlich: "Mündlich",
    
    // Time
    thisWeek: "Diese Woche",
    nextWeek: "Nächste Woche",
    today: "Heute",
    tomorrow: "Morgen",
    
    // Actions
    viewDetails: "Details anzeigen",
    addGrade: "Note hinzufügen",
    
    // Stats
    totalSubjects: "Fächer gesamt",
    averageGrade: "Durchschnittsnote",
    completedTopics: "Abgeschlossene Themen",
    upcomingTests: "Anstehende Tests",
    
    // New metrics
    averageGradeFull: "Durchschnittsnote",
    curriculumProgress: "Lehrplan Fortschritt",
    oralContributions: "Mündliche Beiträge",
    activeSubjects: "Aktive Fächer",
    subjectProgress: "Fächer Fortschritt",
    openTasks: "offene Aufgabe",
    openTasksPlural: "offene Aufgaben",
    
    // Weekly changes
    thisWeekShort: "diese Woche",
    
    // Bottom navigation
    notes: "Noten",
    calendar: "Kalender",
    analysis: "Analyse",
    profile: "Profil"
  },
  en: {
    // App
    appName: "StudyBuddy",
    hello: "Hello",
    welcomeName: (name: string) => `Hello, ${name}!`,
    
    // Welcome banner
    welcomeBack: (name: string) => `Welcome back, ${name}!`,
    welcomeMessage: "You're making great progress. Here's your current status.",
    
    // Dashboard
    dashboard: "Dashboard",
    overview: "Overview",
    subjects: "Subjects",
    upcomingAssessments: "Upcoming Assessments",
    recentGrades: "Recent Noten",
    
    // Subject types
    lk: "Advanced",
    gk: "Basic",
    
    // Noten
    average: "Average",
    progress: "Progress",
    
    // Assessment types
    klausur: "Exam",
    test: "Test",
    muendlich: "Oral",
    
    // Time
    thisWeek: "This Week",
    nextWeek: "Next Week",
    today: "Today",
    tomorrow: "Tomorrow",
    
    // Actions
    viewDetails: "View Details",
    addGrade: "Add Grade",
    
    // Stats
    totalSubjects: "Total Subjects",
    averageGrade: "Average Grade",
    completedTopics: "Completed Topics",
    upcomingTests: "Upcoming Tests",
    
    // New metrics
    averageGradeFull: "Average Grade",
    curriculumProgress: "Curriculum Progress",
    oralContributions: "Oral Contributions",
    activeSubjects: "Active Subjects",
    subjectProgress: "Subject Progress",
    openTasks: "open task",
    openTasksPlural: "open tasks",
    
    // Weekly changes
    thisWeekShort: "this week",
    
    // Bottom navigation
    notes: "Noten",
    calendar: "Calendar",
    analysis: "Analysis",
    profile: "Profile"
  }
};

export const useTranslations = () => {
  const [language, setLanguage] = useState<Language>('de');
  
  const t = translations[language];
  
  return {
    language,
    setLanguage,
    t
  };
};