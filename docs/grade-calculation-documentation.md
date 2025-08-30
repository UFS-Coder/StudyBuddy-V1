# Durchschnittsnote (Average Grade) Calculation Documentation

## Overview

This document outlines the logic and implementation strategy for calculating average grades (Durchschnittsnote) in the StudyBuddy application. The system supports both German grading scales and provides weighted average calculations.

## Current System Analysis

### Database Schema

#### Subjects Table
```sql
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  teacher TEXT,
  room TEXT,
  color TEXT DEFAULT '#3B82F6',
  current_grade DECIMAL(3,1),     -- Current calculated average for the subject
  target_grade DECIMAL(3,1),      -- Student's target grade
  credits INTEGER DEFAULT 3,      -- Credit points for weighted GPA calculation
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### Grades Table
```sql
CREATE TABLE public.grades (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  subject_id UUID REFERENCES public.subjects(id),
  title TEXT NOT NULL,
  grade DECIMAL(3,1) NOT NULL,     -- Individual grade value
  weight DECIMAL(3,2) DEFAULT 1.0, -- Weight factor for this grade
  date_received DATE DEFAULT CURRENT_DATE,
  type TEXT DEFAULT 'assignment',  -- 'assignment', 'exam', 'oral', etc.
  notes TEXT,
  created_at TIMESTAMP
);
```

### Supported Grading Scales

#### German Scale (1-6)
- **1.0**: Sehr gut (Excellent)
- **2.0**: Gut (Good)
- **3.0**: Befriedigend (Satisfactory)
- **4.0**: Ausreichend (Sufficient)
- **5.0**: Mangelhaft (Poor)
- **6.0**: Ungenügend (Insufficient)

#### Points Scale (0-15)
- **15-13**: Sehr gut (1.0-1.3)
- **12-10**: Gut (1.7-2.3)
- **9-7**: Befriedigend (2.7-3.3)
- **6-4**: Ausreichend (3.7-4.3)
- **3-1**: Mangelhaft (4.7-5.3)
- **0**: Ungenügend (6.0)

## Calculation Logic

### 1. Individual Subject Average

#### Weighted Average Formula
```
Subject Average = Σ(grade_i × weight_i) / Σ(weight_i)
```

Where:
- `grade_i` = individual grade value
- `weight_i` = weight factor for that grade
- `Σ` = sum of all grades for the subject

#### Implementation Rules
- Only include grades with `weight > 0`
- Handle missing or null grades gracefully
- Round to one decimal place for German scale
- Round to nearest integer for points scale

### 2. Overall GPA (Grade Point Average)

#### Credit-Weighted GPA
```
Overall GPA = Σ(subject_average_i × credits_i) / Σ(credits_i)
```

Where:
- `subject_average_i` = calculated average for subject i
- `credits_i` = credit points for subject i
- Only include subjects with valid current_grade

#### Simple Average (Alternative)
```
Simple Average = Σ(subject_average_i) / count(subjects_with_grades)
```

### 3. Grade Type Weighting

Different assessment types should have different default weights:

- **Klausur (Exam)**: 2.0
- **Test**: 1.0
- **Mündlich (Oral)**: 0.5
- **Hausaufgabe (Homework)**: 0.3
- **Mitarbeit (Participation)**: 0.5

## Implementation Strategy

### Phase 1: Core Calculation Functions

1. **Subject Average Calculator**
   - Function: `calculateSubjectAverage(grades: Grade[]): number`
   - Handles weighted averaging
   - Validates input data
   - Returns null for insufficient data

2. **Overall GPA Calculator**
   - Function: `calculateOverallGPA(subjects: Subject[]): number`
   - Supports both credit-weighted and simple averaging
   - Configurable calculation method

3. **Grade Converter**
   - Function: `convertGradeScale(grade: number, fromScale: string, toScale: string): number`
   - Converts between 1-6 and 0-15 scales
   - Maintains precision where possible

### Phase 2: Real-time Updates

1. **Automatic Recalculation**
   - Trigger on grade insert/update/delete
   - Update subject.current_grade automatically
   - Refresh dashboard displays

2. **Database Triggers** (Optional)
   ```sql
   CREATE OR REPLACE FUNCTION update_subject_average()
   RETURNS TRIGGER AS $$
   BEGIN
     UPDATE subjects 
     SET current_grade = (
       SELECT SUM(grade * weight) / SUM(weight)
       FROM grades 
       WHERE subject_id = NEW.subject_id
       AND weight > 0
     )
     WHERE id = NEW.subject_id;
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;
   ```

### Phase 3: Advanced Features

1. **Trend Analysis**
   - Calculate grade trends over time
   - Predict future performance
   - Identify improvement/decline patterns

2. **Goal Tracking**
   - Compare current vs target grades
   - Calculate required grades for goals
   - Progress indicators

3. **Semester/Term Averages**
   - Time-based grade grouping
   - Historical performance tracking
   - Semester comparison

## Error Handling

### Edge Cases

1. **No Grades**: Return null or 0 with appropriate UI indication
2. **All Zero Weights**: Use equal weighting (weight = 1.0)
3. **Invalid Grade Values**: Skip invalid entries, log warnings
4. **Division by Zero**: Return null when no valid grades exist
5. **Scale Mismatches**: Validate grade values against expected scale

### Validation Rules

- German scale: 1.0 ≤ grade ≤ 6.0
- Points scale: 0 ≤ grade ≤ 15
- Weight: 0 ≤ weight ≤ 10.0
- Credits: 1 ≤ credits ≤ 20

## UI/UX Considerations

### Display Format

- **German Scale**: "2.3" (one decimal)
- **Points Scale**: "12" (integer)
- **Trend Indicators**: ↗️ ↘️ ➡️
- **Color Coding**: Green (good), Yellow (average), Red (poor)

### Real-time Updates

- Immediate recalculation on grade entry
- Smooth animations for value changes
- Loading states during calculations
- Optimistic updates with rollback on error

## Performance Considerations

### Optimization Strategies

1. **Caching**: Store calculated averages in database
2. **Batch Updates**: Group multiple grade changes
3. **Lazy Loading**: Calculate on-demand for large datasets
4. **Indexing**: Add indexes on subject_id and user_id in grades table

### Monitoring

- Track calculation performance
- Monitor for calculation errors
- Log grade change events
- Alert on unusual grade patterns

## Testing Strategy

### Unit Tests

- Test calculation functions with various inputs
- Validate edge cases and error conditions
- Test scale conversions
- Verify rounding behavior

### Integration Tests

- Test database triggers
- Verify UI updates
- Test real-time synchronization
- Validate cross-component communication

### Test Data

```javascript
const testGrades = [
  { grade: 2.0, weight: 2.0, type: 'exam' },
  { grade: 1.7, weight: 1.0, type: 'test' },
  { grade: 2.3, weight: 0.5, type: 'oral' }
];
// Expected average: (2.0*2.0 + 1.7*1.0 + 2.3*0.5) / (2.0+1.0+0.5) = 1.91
```

## Migration Plan

### Existing Data

1. **Audit Current Data**: Check for inconsistent grades
2. **Recalculate All**: Run batch calculation for existing subjects
3. **Validate Results**: Compare with manual calculations
4. **Update UI**: Ensure all displays use new calculation logic

### Rollback Strategy

- Maintain backup of original current_grade values
- Implement feature flag for new calculation logic
- Provide manual override capability
- Monitor for calculation discrepancies

## Future Enhancements

### Advanced Analytics

- Machine learning grade predictions
- Comparative analysis with peer groups
- Personalized study recommendations
- Integration with calendar for exam scheduling

### External Integrations

- Import grades from school systems
- Export to transcript formats
- Parent/teacher dashboard access
- Integration with learning management systems

---

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Author**: StudyBuddy Development Team  
**Review Date**: March 2025