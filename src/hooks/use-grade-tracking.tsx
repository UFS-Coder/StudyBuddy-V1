import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './use-auth';
import { useGradesBySubject } from './use-grades';
import { useSubjects } from './use-subjects';
import { calculateDurchschnittsnote, type SubjectWithGrades, type GradeCalculationResult } from '@/lib/grade-calculations';

export interface GradeSnapshot {
  id?: string;
  user_id: string;
  overall_average: number;
  lk_average: number | null;
  gk_average: number | null;
  total_weighted_points: number;
  total_weight: number;
  subject_averages: Array<{
    subject_id: string;
    subject_name: string;
    course_type: 'LK' | 'GK';
    average: number | null;
    weight: number;
  }>;
  recorded_at: string;
  created_at?: string;
  updated_at?: string;
}

export interface GradeChange {
  current_average: number;
  previous_average: number;
  change_points: number;
  change_percentage: number;
  change_type: 'improvement' | 'decline' | 'stable';
  period_days: number;
}

export const useGradeTracking = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: gradesBySubject = {} } = useGradesBySubject();
  const { data: subjects = [] } = useSubjects();

  // Calculate current grade metrics
  const getCurrentGradeMetrics = (): GradeCalculationResult => {
    const subjectsWithGrades: SubjectWithGrades[] = subjects.map(subject => ({
      ...subject,
      course_type: (subject.course_type as 'LK' | 'GK') || 'GK',
      grades: gradesBySubject[subject.id] || []
    }));

    return calculateDurchschnittsnote(subjectsWithGrades);
  };

  // Create grade snapshot from current data
  const createGradeSnapshot = (): GradeSnapshot => {
    const metrics = getCurrentGradeMetrics();
    
    return {
      user_id: user?.id || '',
      overall_average: metrics.overallAverage,
      lk_average: metrics.lkAverage,
      gk_average: metrics.gkAverage,
      total_weighted_points: metrics.totalWeightedPoints,
      total_weight: metrics.totalWeight,
      subject_averages: metrics.subjectAverages.map(avg => ({
        subject_id: avg.subjectId,
        subject_name: avg.subjectName,
        course_type: avg.courseType,
        average: avg.average,
        weight: avg.weight
      })),
      recorded_at: new Date().toISOString()
    };
  };

  // Record grade snapshot (using localStorage for now)
  const recordGradeSnapshot = useMutation({
    mutationFn: async (snapshot?: GradeSnapshot) => {
      if (!user) throw new Error('User not authenticated');
      
      const gradeSnapshot = snapshot || createGradeSnapshot();
      
      // Store in localStorage until database migration is applied
      const existingData = JSON.parse(localStorage.getItem('grade_history') || '[]');
      const newRecord = {
        ...gradeSnapshot,
        id: `grade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      existingData.push(newRecord);
      
      // Keep only last 200 records per user
      const userRecords = existingData.filter((record: GradeSnapshot) => record.user_id === user.id);
      const otherRecords = existingData.filter((record: GradeSnapshot) => record.user_id !== user.id);
      
      if (userRecords.length > 200) {
        userRecords.splice(0, userRecords.length - 200);
      }
      
      const updatedData = [...otherRecords, ...userRecords];
      localStorage.setItem('grade_history', JSON.stringify(updatedData));
      
      return newRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grade-tracking'] });
    }
  });

  // Get historical grade data
  const { data: gradeHistory = [] } = useQuery({
    queryKey: ['grade-tracking', user?.id],
    queryFn: async (): Promise<GradeSnapshot[]> => {
      if (!user) return [];
      
      const existingData = JSON.parse(localStorage.getItem('grade_history') || '[]');
      return existingData
        .filter((record: GradeSnapshot) => record.user_id === user.id)
        .sort((a: GradeSnapshot, b: GradeSnapshot) => 
          new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
        );
    },
    enabled: !!user
  });

  // Calculate grade change over a period
  const getGradeChange = (days: number = 7): GradeChange | null => {
    if (gradeHistory.length < 2) return null;
    
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    
    const currentSnapshot = gradeHistory[0];
    const previousSnapshot = gradeHistory.find(snapshot => 
      new Date(snapshot.recorded_at) <= cutoffDate
    );
    
    if (!previousSnapshot) return null;
    
    const currentAverage = currentSnapshot.overall_average;
    const previousAverage = previousSnapshot.overall_average;
    const changePoints = currentAverage - previousAverage;
    const changePercentage = previousAverage > 0 ? (changePoints / previousAverage) * 100 : 0;
    
    let changeType: 'improvement' | 'decline' | 'stable';
    if (Math.abs(changePoints) < 0.01) {
      changeType = 'stable';
    } else if (changePoints > 0) {
      changeType = 'improvement';
    } else {
      changeType = 'decline';
    }
    
    return {
      current_average: currentAverage,
      previous_average: previousAverage,
      change_points: changePoints,
      change_percentage: changePercentage,
      change_type: changeType,
      period_days: days
    };
  };

  // Get subject-specific grade changes
  const getSubjectGradeChanges = (days: number = 7) => {
    if (gradeHistory.length < 2) return {};
    
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    
    const currentSnapshot = gradeHistory[0];
    const previousSnapshot = gradeHistory.find(snapshot => 
      new Date(snapshot.recorded_at) <= cutoffDate
    );
    
    if (!previousSnapshot) return {};
    
    const changes: Record<string, {
      current: number | null;
      previous: number | null;
      change: number;
      changeType: 'improvement' | 'decline' | 'stable';
    }> = {};
    
    currentSnapshot.subject_averages.forEach(currentSubject => {
      const previousSubject = previousSnapshot.subject_averages.find(
        s => s.subject_id === currentSubject.subject_id
      );
      
      if (previousSubject && currentSubject.average !== null && previousSubject.average !== null) {
        const change = currentSubject.average - previousSubject.average;
        let changeType: 'improvement' | 'decline' | 'stable';
        
        if (Math.abs(change) < 0.01) {
          changeType = 'stable';
        } else if (change > 0) {
          changeType = 'improvement';
        } else {
          changeType = 'decline';
        }
        
        changes[currentSubject.subject_id] = {
          current: currentSubject.average,
          previous: previousSubject.average,
          change,
          changeType
        };
      }
    });
    
    return changes;
  };

  // Auto-record grade snapshots when grades change (disabled to prevent infinite re-renders)
  // useEffect(() => {
  //   if (user && subjects.length > 0 && Object.keys(gradesBySubject).length > 0) {
  //     // Only record if there's actual grade data
  //     const hasGrades = Object.values(gradesBySubject).some(grades => grades.length > 0);
  //     if (hasGrades) {
  //       // Debounce to avoid too frequent recordings
  //       const timeoutId = setTimeout(() => {
  //         recordGradeSnapshot.mutate();
  //       }, 100);
  //       
  //       return () => clearTimeout(timeoutId);
  //     }
  //   }
  // }, [user, subjects, gradesBySubject, recordGradeSnapshot]);

  return {
    getCurrentGradeMetrics,
    createGradeSnapshot,
    recordGradeSnapshot,
    gradeHistory,
    getGradeChange,
    getSubjectGradeChanges,
    isRecording: recordGradeSnapshot.isPending,
    hasHistoricalData: gradeHistory.length > 1
  };
};

export default useGradeTracking;