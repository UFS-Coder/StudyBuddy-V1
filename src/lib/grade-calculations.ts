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

/**
 * Validates if a grade is within the German 1-6 scale
 */
export function isValidGermanGrade(grade: number): boolean {
  return grade >= 1.0 && grade <= 6.0;
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