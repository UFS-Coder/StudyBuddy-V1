/**
 * Grade calculation utilities for German Gymnasium/Abitur system
 * Implements weighted average calculation for LK (Leistungskurs) and GK (Grundkurs)
 */

export interface Grade {
  id: string;
  grade: number;
  weight: number;
  subject_id: string;
  type?: string;
}

export interface Subject {
  id: string;
  name: string;
  course_type: 'LK' | 'GK';
  current_grade?: number;
  credits?: number;
}

export interface SubjectWithGrades extends Subject {
  grades: Grade[];
}

export interface GradeCalculationResult {
  overallAverage: number;
  lkAverage: number | null;
  gkAverage: number | null;
  totalWeightedPoints: number;
  totalWeight: number;
  subjectAverages: Array<{
    subjectId: string;
    subjectName: string;
    courseType: 'LK' | 'GK';
    average: number | null;
    weight: number;
  }>;
}

export interface GermanGymnasiumAnalytics {
  overallAverage: number;
  componentBreakdown: {
    writtenExams: { average: number | null; count: number; weight: number };
    somi: { average: number | null; count: number; weight: number };
    projects: { average: number | null; count: number; weight: number };
    practical: { average: number | null; count: number; weight: number };
    effortProgress: { average: number | null; count: number; weight: number };
  };
  subjectAnalytics: Array<{
    subjectId: string;
    subjectName: string;
    courseType: 'LK' | 'GK';
    overallAverage: number | null;
    componentBreakdown: {
      writtenExams: number | null;
      somi: number | null;
      projects: number | null;
      practical: number | null;
      effortProgress: number | null;
    };
  }>;
}

/**
 * Validates if a grade is within the German 1-6 scale
 */
export function isValidGermanGrade(grade: number): boolean {
  return grade >= 1.0 && grade <= 6.0;
}

/**
 * Calculates SoMi (Sonstige Mitarbeit) average from relevant grade types
 */
export function calculateSoMiAverage(grades: Grade[]): number | null {
  const somiTypes = ['Meldung', 'Hausaufgabe', 'Mitarbeit', 'Mündliche Note'];
  const somiGrades = grades.filter(g => 
    somiTypes.includes(g.type || '') && 
    isValidGermanGrade(g.grade) && 
    g.weight > 0
  );
  
  if (somiGrades.length === 0) return null;
  
  const totalWeightedPoints = somiGrades.reduce(
    (sum, grade) => sum + (grade.grade * grade.weight), 
    0
  );
  const totalWeight = somiGrades.reduce(
    (sum, grade) => sum + grade.weight, 
    0
  );
  
  return totalWeight > 0 ? totalWeightedPoints / totalWeight : null;
}

/**
 * Calculates weighted average for a single subject's grades
 */
export function calculateSubjectAverage(grades: Grade[]): number | null {
  if (!grades || grades.length === 0) return null;
  
  const validGrades = grades.filter(g => 
    isValidGermanGrade(g.grade) && g.weight > 0
  );
  
  if (validGrades.length === 0) return null;
  
  const totalWeightedPoints = validGrades.reduce(
    (sum, grade) => sum + (grade.grade * grade.weight), 
    0
  );
  const totalWeight = validGrades.reduce(
    (sum, grade) => sum + grade.weight, 
    0
  );
  
  return totalWeight > 0 ? totalWeightedPoints / totalWeight : null;
}

/**
 * Gets the weight multiplier for course type (LK = 2, GK = 1)
 */
export function getCourseTypeWeight(courseType: 'LK' | 'GK'): number {
  return courseType === 'LK' ? 2 : 1;
}

/**
 * Gets the default weight for German Gymnasium grade components
 */
export function getGermanGymnasiumWeight(gradeType: string): number {
  // 1. Written exams (highest weight)
  if (['Klausur', 'Klassenarbeit'].includes(gradeType)) {
    return 3.0;
  }
  if (gradeType === 'Test') {
    return 2.0;
  }
  
  // 2. SoMi (Sonstige Mitarbeit) - medium weight
  if (['Meldung', 'Mündliche Note', 'Mitarbeit'].includes(gradeType)) {
    return 1.0;
  }
  if (gradeType === 'Hausaufgabe') {
    return 0.5;
  }
  
  // 3. Projects, presentations, Facharbeit - high weight
  if (['Facharbeit', 'Projekt'].includes(gradeType)) {
    return 2.5;
  }
  if (['Referat', 'Präsentation'].includes(gradeType)) {
    return 1.5;
  }
  
  // 4. Special/practical subject elements - medium weight
  if (['Praktikum', 'Laborarbeit', 'Experiment', 'Exkursion'].includes(gradeType)) {
    return 1.5;
  }
  
  // 5. Effort & progress - lower weight (qualitative)
  if (['Lernfortschritt', 'Anstrengungsbereitschaft'].includes(gradeType)) {
    return 0.5;
  }
  
  // Default weight for other types
  return 1.0;
}

/**
 * Calculates Durchschnittsnote with proper LK/GK weighting
 */
export function calculateDurchschnittsnote(
  subjectsWithGrades: SubjectWithGrades[]
): GradeCalculationResult {
  const result: GradeCalculationResult = {
    overallAverage: 0,
    lkAverage: null,
    gkAverage: null,
    totalWeightedPoints: 0,
    totalWeight: 0,
    subjectAverages: []
  };
  
  const lkSubjects: Array<{ average: number; weight: number }> = [];
  const gkSubjects: Array<{ average: number; weight: number }> = [];
  
  let overallWeightedPoints = 0;
  let overallWeight = 0;
  
  // Calculate average for each subject
  for (const subject of subjectsWithGrades) {
    const subjectAverage = calculateSubjectAverage(subject.grades);
    
    if (subjectAverage !== null) {
      const courseWeight = getCourseTypeWeight(subject.course_type);
      const weightedPoints = subjectAverage * courseWeight;
      
      // Add to overall calculation
      overallWeightedPoints += weightedPoints;
      overallWeight += courseWeight;
      
      // Group by course type for separate averages
      if (subject.course_type === 'LK') {
        lkSubjects.push({ average: subjectAverage, weight: courseWeight });
      } else {
        gkSubjects.push({ average: subjectAverage, weight: courseWeight });
      }
      
      // Store subject average info
      result.subjectAverages.push({
        subjectId: subject.id,
        subjectName: subject.name,
        courseType: subject.course_type,
        average: subjectAverage,
        weight: courseWeight
      });
    }
  }
  
  // Calculate overall average
  result.overallAverage = overallWeight > 0 
    ? Math.round((overallWeightedPoints / overallWeight) * 100) / 100
    : 0;
  
  result.totalWeightedPoints = overallWeightedPoints;
  result.totalWeight = overallWeight;
  
  // Calculate LK average (simple average of LK subjects)
  if (lkSubjects.length > 0) {
    const lkSum = lkSubjects.reduce((sum, subject) => sum + subject.average, 0);
    result.lkAverage = Math.round((lkSum / lkSubjects.length) * 100) / 100;
  }
  
  // Calculate GK average (simple average of GK subjects)
  if (gkSubjects.length > 0) {
    const gkSum = gkSubjects.reduce((sum, subject) => sum + subject.average, 0);
    result.gkAverage = Math.round((gkSum / gkSubjects.length) * 100) / 100;
  }
  
  return result;
}

/**
 * Calculates comprehensive German Gymnasium analytics by components
 */
export function calculateGermanGymnasiumAnalytics(
  subjectsWithGrades: SubjectWithGrades[]
): GermanGymnasiumAnalytics {
  const result: GermanGymnasiumAnalytics = {
    overallAverage: 0,
    componentBreakdown: {
      writtenExams: { average: null, count: 0, weight: 0 },
      somi: { average: null, count: 0, weight: 0 },
      projects: { average: null, count: 0, weight: 0 },
      practical: { average: null, count: 0, weight: 0 },
      effortProgress: { average: null, count: 0, weight: 0 }
    },
    subjectAnalytics: []
  };

  // Component type mappings
  const componentTypes = {
    writtenExams: ['Klausur', 'Klassenarbeit', 'Test'],
    somi: ['Meldung', 'Hausaufgabe', 'Mitarbeit', 'Mündliche Note'],
    projects: ['Referat', 'Präsentation', 'Projekt', 'Facharbeit'],
    practical: ['Praktikum', 'Laborarbeit', 'Experiment', 'Exkursion', 'Labor'],
    effortProgress: ['Lernfortschritt', 'Anstrengungsbereitschaft', 'Anstrengung', 'Fortschritt', 'Engagement', 'Verbesserung']
  };

  // Collect all grades by component type
  const allGradesByComponent: Record<string, Grade[]> = {
    writtenExams: [],
    somi: [],
    projects: [],
    practical: [],
    effortProgress: []
  };

  let totalWeightedPoints = 0;
  let totalWeight = 0;

  // Process each subject
  for (const subject of subjectsWithGrades) {
    const subjectAnalytic = {
      subjectId: subject.id,
      subjectName: subject.name,
      courseType: subject.course_type,
      overallAverage: calculateSubjectAverage(subject.grades),
      componentBreakdown: {
        writtenExams: null as number | null,
        somi: null as number | null,
        projects: null as number | null,
        practical: null as number | null,
        effortProgress: null as number | null
      }
    };

    // Calculate component averages for this subject
    Object.entries(componentTypes).forEach(([component, types]) => {
      const componentGrades = subject.grades.filter(g => 
        types.includes(g.type || '') && 
        isValidGermanGrade(g.grade) && 
        g.weight > 0
      );
      
      if (componentGrades.length > 0) {
        const componentAverage = calculateSubjectAverage(componentGrades);
        subjectAnalytic.componentBreakdown[component as keyof typeof subjectAnalytic.componentBreakdown] = componentAverage;
        
        // Add to overall component collection
        allGradesByComponent[component].push(...componentGrades);
      }
    });

    result.subjectAnalytics.push(subjectAnalytic);

    // Add to overall calculation if subject has grades
    if (subjectAnalytic.overallAverage !== null) {
      const courseWeight = getCourseTypeWeight(subject.course_type);
      totalWeightedPoints += subjectAnalytic.overallAverage * courseWeight;
      totalWeight += courseWeight;
    }
  }

  // Calculate overall component averages
  Object.entries(allGradesByComponent).forEach(([component, grades]) => {
    if (grades.length > 0) {
      const componentAverage = calculateSubjectAverage(grades);
      const totalComponentWeight = grades.reduce((sum, g) => sum + g.weight, 0);
      
      result.componentBreakdown[component as keyof typeof result.componentBreakdown] = {
        average: componentAverage,
        count: grades.length,
        weight: totalComponentWeight
      };
    }
  });

  // Calculate overall average
  result.overallAverage = totalWeight > 0 
    ? Math.round((totalWeightedPoints / totalWeight) * 100) / 100
    : 0;

  return result;
}

/**
 * Checks if student is in "Abitur safe zone" (average ≤ 4.0)
 */
export function isAbiturSafe(average: number): boolean {
  return average <= 4.0;
}

/**
 * Gets grade color classification for UI
 */
export function getGradeColorClass(grade: number): string {
  if (grade <= 1.5) return 'text-green-600 bg-green-50';
  if (grade <= 2.5) return 'text-blue-600 bg-blue-50';
  if (grade <= 3.5) return 'text-yellow-600 bg-yellow-50';
  if (grade <= 4.0) return 'text-orange-600 bg-orange-50';
  return 'text-red-600 bg-red-50';
}

/**
 * Gets German grade name
 */
export function getGermanGradeName(grade: number): string {
  if (grade <= 1.5) return 'Sehr gut';
  if (grade <= 2.5) return 'Gut';
  if (grade <= 3.5) return 'Befriedigend';
  if (grade <= 4.0) return 'Ausreichend';
  if (grade <= 5.0) return 'Mangelhaft';
  return 'Ungenügend';
}

/**
 * Formats grade for display (2 decimal places)
 */
export function formatGrade(grade: number): string {
  return grade.toFixed(2);
}

/**
 * Calculates what grade is needed in remaining subjects to reach target average
 */
export function calculateRequiredGrade(
  currentAverage: number,
  currentWeight: number,
  targetAverage: number,
  additionalWeight: number
): number | null {
  if (additionalWeight <= 0) return null;
  
  const currentWeightedPoints = currentAverage * currentWeight;
  const targetWeightedPoints = targetAverage * (currentWeight + additionalWeight);
  const requiredWeightedPoints = targetWeightedPoints - currentWeightedPoints;
  
  const requiredGrade = requiredWeightedPoints / additionalWeight;
  
  // Return null if impossible (grade would be outside 1-6 range)
  if (requiredGrade < 1.0 || requiredGrade > 6.0) return null;
  
  return Math.round(requiredGrade * 100) / 100;
}