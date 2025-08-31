import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';
import { useSubjects } from './use-subjects';
import { useTasks } from './use-tasks';
import { useGradesBySubject } from './use-grades';
import { useTodayMeldungen } from './use-meldungen';
import { calculateDurchschnittsnote } from '@/lib/grade-calculations';
import { getOpenTasksCount, getTotalOpenHomeworkCount } from './use-tasks';

export type MetricType = 'curriculum_progress' | 'open_tasks' | 'open_homework' | 'active_subjects' | 'meldungen' | 'grade_average' | 'lk_average' | 'gk_average';

export type TimePeriod = 'day' | 'week' | 'month';

export interface MetricChange {
  current_value: number;
  previous_value: number;
  change_percentage: number;
  change_type: 'positive' | 'negative' | 'neutral';
}

export interface MetricTrackingData {
  id: string;
  user_id: string;
  metric_type: MetricType;
  metric_value: number;
  additional_data?: Record<string, any>;
  recorded_at: string;
  created_at: string;
  updated_at: string;
}

export interface MetricSnapshot {
  curriculum_progress: number;
  open_tasks: number;
  open_homework: number;
  active_subjects: number;
  meldungen: number;
  grade_average: number;
  lk_average: number;
  gk_average: number;
}

export const useMetricsTracking = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: subjects = [] } = useSubjects();
  const { data: tasks = [] } = useTasks();
  const { data: gradesBySubject = {} } = useGradesBySubject();
  const { data: todayMeldungen = [] } = useTodayMeldungen();

  // Calculate current metrics snapshot
  const getCurrentMetrics = (): MetricSnapshot => {
    // Curriculum progress calculation
    const calculateSubjectStats = (subjectId: string) => {
      const subjectTopics = topics.filter(topic => topic.subject_id === subjectId);
      const totalTopics = subjectTopics.length;
      const completedTopics = 0; // Will be implemented when completion tracking is added
      
      const allSubtopics = subjectTopics.flatMap(topic => topic.subtopics || []);
      const totalSubtopics = allSubtopics.length;
      const completedSubtopics = 0; // Will be implemented when completion tracking is added
      
      return {
        totalTopics,
        completedTopics,
        totalSubtopics,
        completedSubtopics,
        progress: totalSubtopics > 0 ? (completedSubtopics / totalSubtopics) * 100 : 0
      };
    };

    const overallCurriculumProgress = subjects.length > 0
      ? subjects.reduce((sum, subject) => {
          const stats = calculateSubjectStats(subject.id);
          return sum + stats.progress;
        }, 0) / subjects.length
      : 0;

    // Tasks and homework
    const totalOpenTasks = tasks.filter(task => 
      !task.completed &&
      (!task.due_date || new Date(task.due_date) >= new Date())
    ).length;
    
    const totalOpenHomework = getTotalOpenHomeworkCount(tasks);
    
    // Meldungen
    const totalMeldungenToday = todayMeldungen.reduce((sum, meldung) => sum + meldung.count, 0);
    
    // Grade averages
    const subjectsWithGrades = subjects.map(subject => ({
      ...subject,
      course_type: subject.course_type as 'LK' | 'GK',
      grades: gradesBySubject[subject.id] || []
    }));
    
    const gradeResult = calculateDurchschnittsnote(subjectsWithGrades);
    
    return {
      curriculum_progress: Math.round(overallCurriculumProgress * 100) / 100,
      open_tasks: totalOpenTasks,
      open_homework: totalOpenHomework,
      active_subjects: subjects.length,
      meldungen: totalMeldungenToday,
      grade_average: gradeResult.overallAverage || 0,
      lk_average: gradeResult.lkAverage || 0,
      gk_average: gradeResult.gkAverage || 0
    };
  };

  // Fetch topics for curriculum progress calculation
  const { data: topics = [] } = useQuery({
    queryKey: ['syllabus-topics', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('syllabus_topics')
        .select(`
          *,
          subtopics:syllabus_subtopics(*)
        `)
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  // Record metrics snapshot (placeholder for now)
  const recordMetricsSnapshot = useMutation({
    mutationFn: async (metrics: MetricSnapshot) => {
      if (!user) throw new Error('User not authenticated');
      
      // For now, just store in localStorage until database migration is applied
      const timestamp = new Date().toISOString();
      const existingData = JSON.parse(localStorage.getItem('metrics_history') || '[]');
      const newRecord = {
        user_id: user.id,
        metrics,
        recorded_at: timestamp
      };
      
      existingData.push(newRecord);
      // Keep only last 100 records
      if (existingData.length > 100) {
        existingData.splice(0, existingData.length - 100);
      }
      
      localStorage.setItem('metrics_history', JSON.stringify(existingData));
      return newRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metrics-tracking'] });
    }
  });

  // Get metric change for a specific period (using localStorage for now)
  const getMetricChange = async (metricType: MetricType, period: TimePeriod = 'week'): Promise<MetricChange> => {
    if (!user) throw new Error('User not authenticated');
    
    const existingData = JSON.parse(localStorage.getItem('metrics_history') || '[]');
    const userRecords = existingData.filter((record: any) => record.user_id === user.id);
    
    if (userRecords.length < 2) {
      return {
        current_value: 0,
        previous_value: 0,
        change_percentage: 0,
        change_type: 'neutral'
      };
    }
    
    const currentRecord = userRecords[userRecords.length - 1];
    const previousRecord = userRecords[userRecords.length - 2];
    
    const currentValue = currentRecord.metrics[metricType] || 0;
    const previousValue = previousRecord.metrics[metricType] || 0;
    const change = currentValue - previousValue;
    
    return {
      current_value: currentValue,
      previous_value: previousValue,
      change_percentage: change,
      change_type: change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral'
    };
  };

  // Get historical metrics data (from localStorage for now)
   const { data: historicalMetrics = [] } = useQuery({
     queryKey: ['metrics-tracking', user?.id],
     queryFn: async () => {
       if (!user) return [];
       
       const existingData = JSON.parse(localStorage.getItem('metrics_history') || '[]');
       return existingData.filter((record: any) => record.user_id === user.id);
     },
     enabled: !!user
   });
 
   // Get metrics changes for all metric types
  const getMetricsChanges = async (period: TimePeriod = 'week') => {
    const metricTypes: MetricType[] = [
      'curriculum_progress',
      'open_tasks', 
      'open_homework',
      'active_subjects',
      'meldungen',
      'grade_average',
      'lk_average',
      'gk_average'
    ];
    
    const changes: Record<MetricType, MetricChange> = {} as Record<MetricType, MetricChange>;
    
    for (const metricType of metricTypes) {
      try {
        changes[metricType] = await getMetricChange(metricType, period);
      } catch (error) {
        console.error(`Error getting change for ${metricType}:`, error);
        changes[metricType] = {
          current_value: 0,
          previous_value: 0,
          change_percentage: 0,
          change_type: 'neutral'
        };
      }
    }
    
    return changes;
  };

  // Auto-record metrics when data changes (disabled to prevent infinite re-renders)
  // useEffect(() => {
  //   if (user && subjects.length > 0) {
  //     const currentMetrics = getCurrentMetrics();
  //     recordMetricsSnapshot.mutate(currentMetrics);
  //   }
  // }, [user, subjects, tasks, gradesBySubject, todayMeldungen, topics]);

  return {
    getCurrentMetrics,
    recordMetricsSnapshot,
    getMetricChange,
    getMetricsChanges,
    historicalMetrics,
    isRecording: recordMetricsSnapshot.isPending
  };
};

export default useMetricsTracking;