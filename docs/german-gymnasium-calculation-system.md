# German Gymnasium Grade Calculation System Documentation

## Overview

This document explains how the StudyBuddy application implements the German Gymnasium grading system with its five core components and how grades are calculated at different levels.

## The Five German Gymnasium Components

### 1. Written Exams (Schriftliche Arbeiten)
**Purpose**: Formal written assessments that test comprehensive understanding

**Grade Types Mapped**:
- `Klausur` - Major written exam (typically 2-4 hours)
- `Klassenarbeit` - Class test (typically 1-2 hours)
- `Test` - Short written assessment

**Typical Weight Range**: 2.0 - 4.0 (higher for major exams)

### 2. SoMi - Sonstige Mitarbeit (Other Participation)
**Purpose**: Ongoing assessment of student participation and engagement

**Grade Types Mapped**:
- `Meldung` - Oral contributions/participation
- `Hausaufgabe` - Homework assignments
- `Mitarbeit` - General class participation
- `Mündliche Note` - Oral grades/presentations

**Typical Weight Range**: 1.0 - 2.5

### 3. Projects/Presentations (Projekte/Präsentationen)
**Purpose**: Extended work demonstrating research and presentation skills

**Grade Types Mapped**:
- `Referat` - Oral presentation
- `Präsentation` - Formal presentation
- `Projekt` - Project work
- `Facharbeit` - Extended research paper (Abitur level)

**Typical Weight Range**: 2.5 - 4.0 (Facharbeit has highest weight)

### 4. Practical Elements (Praktische Elemente)
**Purpose**: Hands-on learning and laboratory work

**Grade Types Mapped**:
- `Praktikum` - Laboratory practicum
- `Laborarbeit` - Laboratory work
- `Experiment` - Experimental work
- `Exkursion` - Field trip/excursion work
- `Labor` - General lab work

**Typical Weight Range**: 2.0 - 3.0

### 5. Effort & Progress (Anstrengung & Fortschritt)
**Purpose**: Assessment of student effort, improvement, and learning progress

**Grade Types Mapped**:
- `Lernfortschritt` - Learning progress
- `Anstrengungsbereitschaft` - Willingness to make effort
- `Anstrengung` - Effort shown
- `Fortschritt` - Progress made
- `Engagement` - Student engagement
- `Verbesserung` - Improvement shown

**Typical Weight Range**: 1.0 - 1.5 (lower weight, qualitative assessment)

## Calculation System

### Individual Grade Validation

Before any calculations, grades must pass validation:
```typescript
function isValidGermanGrade(grade: number): boolean {
  return grade >= 1.0 && grade <= 6.0;
}
```

### Subject-Level Calculation

For each subject, the average is calculated using weighted arithmetic mean:

```typescript
function calculateSubjectAverage(grades: Grade[]): number | null {
  const validGrades = grades.filter(g => 
    isValidGermanGrade(g.grade) && g.weight > 0
  );
  
  if (validGrades.length === 0) return null;
  
  const totalWeightedPoints = validGrades.reduce(
    (sum, grade) => sum + (grade.grade * grade.weight), 0
  );
  const totalWeight = validGrades.reduce(
    (sum, grade) => sum + grade.weight, 0
  );
  
  return Math.round((totalWeightedPoints / totalWeight) * 100) / 100;
}
```

**Formula**: `Subject Average = Σ(Grade × Weight) / Σ(Weight)`

### Component-Level Calculation

For each of the five components across all subjects:

1. **Collect all grades** of the component type from all subjects
2. **Apply the same weighted average formula** as subject calculation
3. **Count total grades** and **sum total weights** for the component

### Course Type Weighting

Subjects are weighted differently based on their course type:

```typescript
function getCourseTypeWeight(courseType: 'LK' | 'GK'): number {
  return courseType === 'LK' ? 2.0 : 1.0; // LK = Leistungskurs, GK = Grundkurs
}
```

- **LK (Leistungskurs)**: Weight = 2.0 (Advanced courses)
- **GK (Grundkurs)**: Weight = 1.0 (Basic courses)

### Durchschnittsnote (Overall Average) Calculation

The final overall average considers course type weighting:

```typescript
function calculateDurchschnittsnote(subjectsWithGrades: SubjectWithGrades[]): number {
  let totalWeightedPoints = 0;
  let totalWeight = 0;
  
  for (const subject of subjectsWithGrades) {
    const subjectAverage = calculateSubjectAverage(subject.grades);
    
    if (subjectAverage !== null) {
      const courseWeight = getCourseTypeWeight(subject.course_type);
      totalWeightedPoints += subjectAverage * courseWeight;
      totalWeight += courseWeight;
    }
  }
  
  return totalWeight > 0 
    ? Math.round((totalWeightedPoints / totalWeight) * 100) / 100
    : 0;
}
```

**Formula**: `Durchschnittsnote = Σ(Subject Average × Course Weight) / Σ(Course Weight)`

## Complete Calculation Flow

### Step 1: Grade Input and Validation
- Each grade must be between 1.0 and 6.0
- Each grade must have a positive weight
- Each grade must have a valid type mapping

### Step 2: Component Classification
- Grades are automatically classified into one of the five components based on their `type` field
- The mapping is defined in the `componentTypes` object

### Step 3: Subject-Level Calculations
- For each subject: Calculate weighted average of all grades
- For each subject: Calculate component breakdowns (5 separate averages)

### Step 4: Overall Component Calculations
- For each component: Collect all grades across all subjects
- For each component: Calculate weighted average
- Track total count and weight for each component

### Step 5: Final Durchschnittsnote
- Weight each subject's average by its course type (LK vs GK)
- Calculate final weighted average across all subjects

## Example Calculation

### Sample Data
**Mathematics (LK)**:
- Klausur: 2.0 (weight: 4.0)
- Test: 1.8 (weight: 2.0)
- Meldung: 2.2 (weight: 1.0)
- Anstrengung: 2.0 (weight: 1.0)

**German (GK)**:
- Klassenarbeit: 2.2 (weight: 3.0)
- Facharbeit: 2.3 (weight: 4.0)
- Mitarbeit: 2.1 (weight: 2.0)

### Calculations

**Mathematics Average**:
```
(2.0×4.0 + 1.8×2.0 + 2.2×1.0 + 2.0×1.0) / (4.0+2.0+1.0+1.0)
= (8.0 + 3.6 + 2.2 + 2.0) / 8.0
= 15.8 / 8.0 = 1.975 ≈ 1.98
```

**German Average**:
```
(2.2×3.0 + 2.3×4.0 + 2.1×2.0) / (3.0+4.0+2.0)
= (6.6 + 9.2 + 4.2) / 9.0
= 20.0 / 9.0 = 2.222 ≈ 2.22
```

**Durchschnittsnote**:
```
(1.98×2.0 + 2.22×1.0) / (2.0+1.0)  // LK weight=2.0, GK weight=1.0
= (3.96 + 2.22) / 3.0
= 6.18 / 3.0 = 2.06
```

## Component Breakdown Example

**Written Exams Component**:
- Mathematics Klausur: 2.0 (weight: 4.0)
- Mathematics Test: 1.8 (weight: 2.0)
- German Klassenarbeit: 2.2 (weight: 3.0)
- **Average**: (2.0×4.0 + 1.8×2.0 + 2.2×3.0) / (4.0+2.0+3.0) = 2.0

**Projects Component**:
- German Facharbeit: 2.3 (weight: 4.0)
- **Average**: 2.3

**SoMi Component**:
- Mathematics Meldung: 2.2 (weight: 1.0)
- German Mitarbeit: 2.1 (weight: 2.0)
- **Average**: (2.2×1.0 + 2.1×2.0) / (1.0+2.0) = 2.13

**Effort & Progress Component**:
- Mathematics Anstrengung: 2.0 (weight: 1.0)
- **Average**: 2.0

## Implementation Notes

### Grade Type Flexibility
The system is designed to be flexible with grade type names. New grade types can be easily added to the component mappings without changing the calculation logic.

### Null Handling
If a component has no grades, its average is `null` rather than 0, which prevents it from affecting calculations.

### Precision
All calculations are rounded to 2 decimal places to match German grading precision standards.

### Validation
The system validates that:
- Grades are within the valid range (1.0-6.0)
- Weights are positive numbers
- At least one valid grade exists before calculating averages

## File Locations

- **Main calculation logic**: `src/lib/grade-calculations.ts`
- **Component mappings**: Lines 264-270 in `grade-calculations.ts`
- **Analytics implementation**: `calculateGermanGymnasiumAnalytics()` function
- **UI display**: `src/pages/Analysis.tsx`

This system provides a comprehensive and accurate implementation of the German Gymnasium grading system while maintaining flexibility for different grade types and weighting schemes.