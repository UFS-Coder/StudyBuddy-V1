import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './use-auth';
import { useTasks, type Task, getTotalOpenTasksCount, getTotalOpenHomeworkCount } from './use-tasks';
import { useSubjects } from './use-subjects';

export interface TaskSnapshot {
  id?: string;
  user_id: string;
  total_tasks: number;
  completed_tasks: number;
  open_tasks: number;
  total_homework: number;
  completed_homework: number;
  open_homework: number;
  completion_rate_tasks: number;
  completion_rate_homework: number;
  overdue_tasks: number;
  overdue_homework: number;
  subject_breakdown: Array<{
    subject_id: string;
    subject_name: string;
    total_tasks: number;
    completed_tasks: number;
    total_homework: number;
    completed_homework: number;
    completion_rate: number;
  }>;
  recorded_at: string;
  created_at?: string;
  updated_at?: string;
}

export interface TaskChange {
  current_open_tasks: number;
  previous_open_tasks: number;
  current_open_homework: number;
  previous_open_homework: number;
  tasks_change: number;
  homework_change: number;
  completion_rate_change: number;
  change_type: 'improvement' | 'decline' | 'stable';
  period_days: number;
}

export const useTaskTracking = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: tasks = [] } = useTasks();
  const { data: subjects = [] } = useSubjects();

  // Calculate current task metrics
  const getCurrentTaskMetrics = () => {
    const now = new Date();
    
    // Separate tasks and homework
    const allTasks = tasks.filter(task => task.type === 'task');
    const allHomework = tasks.filter(task => task.type === 'homework');
    
    // Calculate totals
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(task => task.completed).length;
    const openTasks = getTotalOpenTasksCount(tasks);
    
    const totalHomework = allHomework.length;
    const completedHomework = allHomework.filter(task => task.completed).length;
    const openHomework = getTotalOpenHomeworkCount(tasks);
    
    // Calculate completion rates
    const completionRateTasks = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const completionRateHomework = totalHomework > 0 ? (completedHomework / totalHomework) * 100 : 0;
    
    // Calculate overdue items
    const overdueTasks = allTasks.filter(task => 
      !task.completed && task.due_date && new Date(task.due_date) < now
    ).length;
    
    const overdueHomework = allHomework.filter(task => 
      !task.completed && task.due_date && new Date(task.due_date) < now
    ).length;
    
    // Calculate subject breakdown
    const subjectBreakdown = subjects.map(subject => {
      const subjectTasks = tasks.filter(task => task.subject_id === subject.id);
      const subjectTasksOnly = subjectTasks.filter(task => task.type === 'task');
      const subjectHomework = subjectTasks.filter(task => task.type === 'homework');
      
      const totalSubjectTasks = subjectTasksOnly.length;
      const completedSubjectTasks = subjectTasksOnly.filter(task => task.completed).length;
      const totalSubjectHomework = subjectHomework.length;
      const completedSubjectHomework = subjectHomework.filter(task => task.completed).length;
      
      const totalItems = totalSubjectTasks + totalSubjectHomework;
      const completedItems = completedSubjectTasks + completedSubjectHomework;
      const completionRate = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
      
      return {
        subject_id: subject.id,
        subject_name: subject.name,
        total_tasks: totalSubjectTasks,
        completed_tasks: completedSubjectTasks,
        total_homework: totalSubjectHomework,
        completed_homework: completedSubjectHomework,
        completion_rate: completionRate
      };
    });
    
    return {
      total_tasks: totalTasks,
      completed_tasks: completedTasks,
      open_tasks: openTasks,
      total_homework: totalHomework,
      completed_homework: completedHomework,
      open_homework: openHomework,
      completion_rate_tasks: completionRateTasks,
      completion_rate_homework: completionRateHomework,
      overdue_tasks: overdueTasks,
      overdue_homework: overdueHomework,
      subject_breakdown: subjectBreakdown
    };
  };

  // Create task snapshot from current data
  const createTaskSnapshot = (): TaskSnapshot => {
    const metrics = getCurrentTaskMetrics();
    
    return {
      user_id: user?.id || '',
      ...metrics,
      recorded_at: new Date().toISOString()
    };
  };

  // Record task snapshot (using localStorage for now)
  const recordTaskSnapshot = useMutation({
    mutationFn: async (snapshot?: TaskSnapshot) => {
      if (!user) throw new Error('User not authenticated');
      
      const taskSnapshot = snapshot || createTaskSnapshot();
      
      // Store in localStorage until database migration is applied
      const existingData = JSON.parse(localStorage.getItem('task_history') || '[]');
      const newRecord = {
        ...taskSnapshot,
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      existingData.push(newRecord);
      
      // Keep only last 200 records per user
      const userRecords = existingData.filter((record: TaskSnapshot) => record.user_id === user.id);
      const otherRecords = existingData.filter((record: TaskSnapshot) => record.user_id !== user.id);
      
      if (userRecords.length > 200) {
        userRecords.splice(0, userRecords.length - 200);
      }
      
      const updatedData = [...otherRecords, ...userRecords];
      localStorage.setItem('task_history', JSON.stringify(updatedData));
      
      return newRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-tracking'] });
    }
  });

  // Get historical task data
  const { data: taskHistory = [] } = useQuery({
    queryKey: ['task-tracking', user?.id],
    queryFn: async (): Promise<TaskSnapshot[]> => {
      if (!user) return [];
      
      const existingData = JSON.parse(localStorage.getItem('task_history') || '[]');
      return existingData
        .filter((record: TaskSnapshot) => record.user_id === user.id)
        .sort((a: TaskSnapshot, b: TaskSnapshot) => 
          new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
        );
    },
    enabled: !!user
  });

  // Calculate task change over a period
  const getTaskChange = (days: number = 7): TaskChange | null => {
    if (taskHistory.length < 2) return null;
    
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    
    const currentSnapshot = taskHistory[0];
    const previousSnapshot = taskHistory.find(snapshot => 
      new Date(snapshot.recorded_at) <= cutoffDate
    );
    
    if (!previousSnapshot) return null;
    
    const tasksChange = currentSnapshot.open_tasks - previousSnapshot.open_tasks;
    const homeworkChange = currentSnapshot.open_homework - previousSnapshot.open_homework;
    
    // Calculate overall completion rate change
    const currentOverallRate = (
      (currentSnapshot.completed_tasks + currentSnapshot.completed_homework) /
      (currentSnapshot.total_tasks + currentSnapshot.total_homework)
    ) * 100;
    
    const previousOverallRate = (
      (previousSnapshot.completed_tasks + previousSnapshot.completed_homework) /
      (previousSnapshot.total_tasks + previousSnapshot.total_homework)
    ) * 100;
    
    const completionRateChange = currentOverallRate - previousOverallRate;
    
    // Determine change type (improvement means fewer open items or higher completion rate)
    let changeType: 'improvement' | 'decline' | 'stable';
    if (Math.abs(tasksChange) <= 1 && Math.abs(homeworkChange) <= 1 && Math.abs(completionRateChange) < 1) {
      changeType = 'stable';
    } else if (tasksChange < 0 || homeworkChange < 0 || completionRateChange > 0) {
      changeType = 'improvement';
    } else {
      changeType = 'decline';
    }
    
    return {
      current_open_tasks: currentSnapshot.open_tasks,
      previous_open_tasks: previousSnapshot.open_tasks,
      current_open_homework: currentSnapshot.open_homework,
      previous_open_homework: previousSnapshot.open_homework,
      tasks_change: tasksChange,
      homework_change: homeworkChange,
      completion_rate_change: completionRateChange,
      change_type: changeType,
      period_days: days
    };
  };

  // Get subject-specific task changes
  const getSubjectTaskChanges = (days: number = 7) => {
    if (taskHistory.length < 2) return {};
    
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    
    const currentSnapshot = taskHistory[0];
    const previousSnapshot = taskHistory.find(snapshot => 
      new Date(snapshot.recorded_at) <= cutoffDate
    );
    
    if (!previousSnapshot) return {};
    
    const changes: Record<string, {
      currentRate: number;
      previousRate: number;
      change: number;
      changeType: 'improvement' | 'decline' | 'stable';
      tasksChange: number;
      homeworkChange: number;
    }> = {};
    
    currentSnapshot.subject_breakdown.forEach(currentSubject => {
      const previousSubject = previousSnapshot.subject_breakdown.find(
        s => s.subject_id === currentSubject.subject_id
      );
      
      if (previousSubject) {
        const rateChange = currentSubject.completion_rate - previousSubject.completion_rate;
        const tasksChange = currentSubject.total_tasks - previousSubject.total_tasks;
        const homeworkChange = currentSubject.total_homework - previousSubject.total_homework;
        
        let changeType: 'improvement' | 'decline' | 'stable';
        if (Math.abs(rateChange) < 1) {
          changeType = 'stable';
        } else if (rateChange > 0) {
          changeType = 'improvement';
        } else {
          changeType = 'decline';
        }
        
        changes[currentSubject.subject_id] = {
          currentRate: currentSubject.completion_rate,
          previousRate: previousSubject.completion_rate,
          change: rateChange,
          changeType,
          tasksChange,
          homeworkChange
        };
      }
    });
    
    return changes;
  };

  // Clear historical task data
  const clearHistoricalData = () => {
    if (!user) return;
    
    const existingData = JSON.parse(localStorage.getItem('task_history') || '[]');
    const otherUserData = existingData.filter((record: TaskSnapshot) => record.user_id !== user.id);
    localStorage.setItem('task_history', JSON.stringify(otherUserData));
    
    queryClient.invalidateQueries({ queryKey: ['task-tracking'] });
  };

  // Seed historical task data for proper change calculations
  const seedHistoricalData = () => {
    if (!user) return;
    
    // Clear existing data first
    clearHistoricalData();
    
    const currentMetrics = getCurrentTaskMetrics();
    const now = new Date();
    
    // Create yesterday's snapshot with more tasks/homework to show negative change (improvement)
    const yesterdaySnapshot: TaskSnapshot = {
      user_id: user.id,
      total_tasks: currentMetrics.total_tasks + 2,
      completed_tasks: currentMetrics.completed_tasks,
      open_tasks: currentMetrics.open_tasks + 2,
      total_homework: currentMetrics.total_homework + 1,
      completed_homework: currentMetrics.completed_homework,
      open_homework: currentMetrics.open_homework + 1,
      completion_rate_tasks: currentMetrics.completion_rate_tasks,
      completion_rate_homework: currentMetrics.completion_rate_homework,
      overdue_tasks: Math.max(0, currentMetrics.overdue_tasks - 1),
      overdue_homework: Math.max(0, currentMetrics.overdue_homework),
      subject_breakdown: currentMetrics.subject_breakdown.map(subject => ({
        ...subject,
        total_tasks: Math.max(0, subject.total_tasks - 1),
        total_homework: Math.max(0, subject.total_homework)
      })),
      recorded_at: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      id: `task_${Date.now() - 86400000}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
    };
    
    // Create today's snapshot
    const todaySnapshot: TaskSnapshot = {
      user_id: user.id,
      ...currentMetrics,
      recorded_at: now.toISOString(),
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    };
    
    // Store both snapshots
    const existingData = JSON.parse(localStorage.getItem('task_history') || '[]');
    const newData = [...existingData, yesterdaySnapshot, todaySnapshot];
    localStorage.setItem('task_history', JSON.stringify(newData));
    
    queryClient.invalidateQueries({ queryKey: ['task-tracking'] });
  };

  // Auto-record task snapshots when tasks change (disabled to prevent infinite re-renders)
  // useEffect(() => {
  //   if (user && tasks.length >= 0) { // Allow recording even with 0 tasks
  //     // Debounce to avoid too frequent recordings
  //     const timeoutId = setTimeout(() => {
  //       recordTaskSnapshot.mutate();
  //     }, 100);
  //     
  //     return () => clearTimeout(timeoutId);
  //   }
  // }, [user, tasks, recordTaskSnapshot.mutate]);

  return {
    getCurrentTaskMetrics,
    createTaskSnapshot,
    recordTaskSnapshot,
    taskHistory,
    getTaskChange,
    getSubjectTaskChanges,
    seedHistoricalData,
    clearHistoricalData,
    isRecording: recordTaskSnapshot.isPending,
    hasHistoricalData: taskHistory.length > 1
  };
};

export default useTaskTracking;