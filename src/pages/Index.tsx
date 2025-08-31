import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/dashboard/navbar";
import { WelcomeBanner } from "@/components/dashboard/welcome-banner";
import { MetricCard } from "@/components/dashboard/metric-card";
import { SubjectProgressItem } from "@/components/dashboard/subject-progress-item";
import { FeatureSuggestions } from "@/components/dashboard/feature-suggestions";
import { BottomNavigation } from "@/components/dashboard/bottom-navigation";
import { DurchschnittDashboard } from "@/components/grades/durchschnitt-dashboard";
import { TasksModal } from "@/components/dashboard/tasks-modal";
import { HomeworkModal } from "@/components/dashboard/homework-modal";
import { SubjectsModal } from "@/components/dashboard/subjects-modal";
import { FactsOverlay } from "@/components/facts/facts-overlay";
import { useDailyFacts } from "@/hooks/use-daily-facts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "@/hooks/use-translations";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { useSubjects } from "@/hooks/use-subjects";
import { useGradesBySubject } from "@/hooks/use-grades";
import { useTasks } from "@/hooks/use-tasks";
import { getOpenTasksCount, getTotalOpenHomeworkCount, getOpenHomeworkCount } from "@/hooks/use-tasks";
import { useTodayMeldungen } from "@/hooks/use-meldungen";
import { MeldungenModal } from "@/components/dashboard/meldungen-modal";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMetricsTracking } from "@/hooks/use-metrics-tracking";
import { useGradeTracking } from "@/hooks/use-grade-tracking";
import { useTaskTracking } from "@/hooks/use-task-tracking";
import TimeSelector, { TimePeriod } from "@/components/TimeSelector";


const Index = () => {
  const { user, loading } = useAuth();
  const { data: profile } = useProfile();
  const { data: subjects = [] } = useSubjects();
  const { data: gradesBySubject = {} } = useGradesBySubject();
  const { data: tasks = [] } = useTasks();
  const { data: todayMeldungen = [] } = useTodayMeldungen();
  const { language, setLanguage, t } = useTranslations();
  const navigate = useNavigate();
  const [isMeldungenModalOpen, setIsMeldungenModalOpen] = useState(false);
  const [isTasksModalOpen, setIsTasksModalOpen] = useState(false);
  const [isHomeworkModalOpen, setIsHomeworkModalOpen] = useState(false);
  const [isSubjectsModalOpen, setIsSubjectsModalOpen] = useState(false);
  const [isFactsOverlayOpen, setIsFactsOverlayOpen] = useState(false);

  // Facts functionality
  const {
    currentFact,
    isLoading: isFactsLoading,
    isNextFactLoading,
    initializeFacts,
    getNextFact,
    tellMeMore,
    shouldShowFactsToday,
    markFactsAsShown
  } = useDailyFacts();

  // Initialize tracking hooks
  const { getMetricsChanges } = useMetricsTracking();
  const { getGradeChange } = useGradeTracking();
  const { getTaskChange } = useTaskTracking();

  // State for tracking changes
  const [curriculumChange, setCurriculumChange] = useState<string | undefined>(undefined);
  const [curriculumChangeType, setCurriculumChangeType] = useState<'positive' | 'negative' | 'neutral'>('neutral');
  const [tasksChange, setTasksChange] = useState<string | undefined>(undefined);
  const [tasksChangeType, setTasksChangeType] = useState<'positive' | 'negative' | 'neutral'>('neutral');
  const [homeworkChange, setHomeworkChange] = useState<string | undefined>(undefined);
  const [homeworkChangeType, setHomeworkChangeType] = useState<'positive' | 'negative' | 'neutral'>('neutral');
  const [subjectsChange, setSubjectsChange] = useState<string | undefined>(undefined);
  const [subjectsChangeType, setSubjectsChangeType] = useState<'positive' | 'negative' | 'neutral'>('neutral');
  const [meldungenChange, setMeldungenChange] = useState<string | undefined>(undefined);
  const [meldungenChangeType, setMeldungenChangeType] = useState<'positive' | 'negative' | 'neutral'>('neutral');
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<TimePeriod>('week');

  // Fetch change data
  useEffect(() => {
    const fetchChanges = async () => {
      try {
        // Get task changes
        const taskChanges = await getTaskChange(
          selectedTimePeriod === 'day' ? 1 : 
          selectedTimePeriod === 'week' ? 7 : 30
        );
        if (taskChanges) {
          const tasksChangeValue = taskChanges.tasks_change;
          const homeworkChangeValue = taskChanges.homework_change;
          
          // Format task changes
          if (tasksChangeValue !== 0) {
            setTasksChange(tasksChangeValue > 0 ? `+${tasksChangeValue}` : `${tasksChangeValue}`);
            setTasksChangeType(tasksChangeValue > 0 ? 'negative' : 'positive'); // More tasks = negative, fewer = positive
          } else {
            setTasksChange('+0');
            setTasksChangeType('neutral');
          }
          
          // Format homework changes
          if (homeworkChangeValue !== 0) {
            setHomeworkChange(homeworkChangeValue > 0 ? `+${homeworkChangeValue}` : `${homeworkChangeValue}`);
            setHomeworkChangeType(homeworkChangeValue > 0 ? 'negative' : 'positive'); // More homework = negative, fewer = positive
          } else {
            setHomeworkChange('+0');
            setHomeworkChangeType('neutral');
          }
        } else {
          // Set default values if no task changes data
          setTasksChange('+0');
          setTasksChangeType('neutral');
          setHomeworkChange('+0');
          setHomeworkChangeType('neutral');
        }
        
        // Get metrics changes for all metrics
        const metricsChanges = await getMetricsChanges(selectedTimePeriod);
        if (metricsChanges) {
          // Curriculum progress
          if (metricsChanges?.curriculum_progress !== null && metricsChanges?.curriculum_progress !== undefined) {
            const change = metricsChanges.curriculum_progress.change_percentage;
            if (change !== null && change !== undefined && !isNaN(change) && Math.abs(change) >= 0.1) {
              setCurriculumChange(change > 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`);
              setCurriculumChangeType(change > 0 ? 'positive' : 'negative');
            } else {
              setCurriculumChange('+0.0%');
              setCurriculumChangeType('neutral');
            }
          } else {
            setCurriculumChange('+0.0%');
            setCurriculumChangeType('neutral');
          }
          
          // Active subjects
          if (metricsChanges.active_subjects) {
            const subjectsChangeValue = metricsChanges.active_subjects.change_percentage;
            if (Math.abs(subjectsChangeValue) >= 1) {
              setSubjectsChange(`${subjectsChangeValue > 0 ? '+' : ''}${Math.round(subjectsChangeValue)}`);
              setSubjectsChangeType(metricsChanges.active_subjects.change_type === 'positive' ? 'positive' : 
                                   metricsChanges.active_subjects.change_type === 'negative' ? 'negative' : 'neutral');
            } else {
              setSubjectsChange('+0');
              setSubjectsChangeType('neutral');
            }
          } else {
            setSubjectsChange('+0');
            setSubjectsChangeType('neutral');
          }
          
          // Meldungen
          if (metricsChanges.meldungen) {
            const meldungenChangeValue = metricsChanges.meldungen.change_percentage;
            if (Math.abs(meldungenChangeValue) >= 1) {
              setMeldungenChange(`${meldungenChangeValue > 0 ? '+' : ''}${Math.round(meldungenChangeValue)}`);
              setMeldungenChangeType(metricsChanges.meldungen.change_type === 'positive' ? 'positive' : 
                                    metricsChanges.meldungen.change_type === 'negative' ? 'negative' : 'neutral');
            } else {
              setMeldungenChange('+0');
              setMeldungenChangeType('neutral');
            }
          } else {
            setMeldungenChange('+0');
            setMeldungenChangeType('neutral');
          }
        } else {
          setCurriculumChange('+0.0%');
          setCurriculumChangeType('neutral');
          setSubjectsChange('+0');
          setSubjectsChangeType('neutral');
          setMeldungenChange('+0');
          setMeldungenChangeType('neutral');
        }
      } catch (error) {
        console.error('Error fetching changes:', error);
        // Set default values on error
        setCurriculumChange('+0.0%');
        setCurriculumChangeType('neutral');
        setTasksChange('+0');
        setTasksChangeType('neutral');
        setHomeworkChange('+0');
        setHomeworkChangeType('neutral');
        setSubjectsChange('+0');
        setSubjectsChangeType('neutral');
        setMeldungenChange('+0');
        setMeldungenChangeType('neutral');
      }
    };
    
    if (user?.id) {
      fetchChanges();
    }
  }, [user?.id, selectedTimePeriod]);

  // Initialize facts and show overlay on first visit
  useEffect(() => {
    const initFacts = async () => {
      if (user?.id && !loading) {
        await initializeFacts();
        
        // Show facts overlay if it's the first visit today
        if (shouldShowFactsToday()) {
          setIsFactsOverlayOpen(true);
        }
      }
    };
    
    initFacts();
  }, [user?.id, loading, initializeFacts, shouldShowFactsToday]);

  // Handle facts overlay close
  const handleFactsClose = () => {
    setIsFactsOverlayOpen(false);
    markFactsAsShown();
  };

  // Handle manual facts open
  const handleFactsOpen = () => {
    setIsFactsOverlayOpen(true);
  };

  // Handle next fact
  const handleNextFact = async () => {
    await getNextFact();
  };

  // Handle tell me more
  const handleTellMeMore = () => {
    tellMeMore();
  };

  // Fetch topics for all subjects
  const { data: topics = [] } = useQuery({
    queryKey: ['syllabus-topics', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('syllabus_topics')
        .select('*')
        .eq('user_id', user.id)
        .order('order_index');
      if (error || !Array.isArray(data)) return [];
      // Defensive: filter out null/undefined/invalid topics
      return (data || []).filter(
        t => t && typeof t === 'object' && t.id && t.subject_id
      );
    },
    enabled: !!user,
  });

  // Fetch subtopics for all topics
  const { data: subtopics = [] } = useQuery({
    queryKey: ['subtopics', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('subtopics')
        .select('*')
        .eq('user_id', user.id)
        .order('order_index');
      if (error || !Array.isArray(data)) return [];
      // Defensive: filter out null/undefined/invalid subtopics
      return (data || []).filter(
        s => s && typeof s === 'object' && s.id && s.topic_id
      );
    },
    enabled: !!user,
  });

  // Calculate topic and subtopic statistics for each subject
  const calculateSubjectStats = (subjectId: string) => {
    const subjectTopics = (topics || []).filter(
      topic => topic && topic.subject_id === subjectId
    );
    const subjectSubtopics = (subtopics || []).filter(
      subtopic =>
        subtopic &&
        subjectTopics.some(topic => topic && topic.id === subtopic.topic_id)
    );
    const completedSubtopics = subjectSubtopics.filter(
      subtopic => subtopic && subtopic.completed
    ).length;
    const progress = subjectSubtopics.length > 0 ? (completedSubtopics / subjectSubtopics.length) * 100 : 0;
    return {
      totalTopics: subjectTopics.length,
      completedTopics: subjectTopics.filter(topic => {
        const topicSubtopics = (subtopics || []).filter(
          s => s && s.topic_id === topic.id
        );
        return (
          topicSubtopics.length > 0 &&
          topicSubtopics.every(s => s && s.completed)
        );
      }).length,
      totalSubtopics: subjectSubtopics.length,
      completedSubtopics,
      progress: isNaN(progress) ? 0 : Math.round(progress)
    };
  };

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Welcome to AbiTrackr</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Please sign in to access your academic dashboard
            </p>
            <Button onClick={() => navigate("/auth")} className="w-full">
              <LogIn className="mr-2 h-4 w-4" />
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const studentName = profile?.display_name || user.email?.split('@')[0] || "Student";
  
  // Calculate metrics from real data
  const totalSubjects = subjects.length;
  const subjectsWithGrades = subjects.filter(s => s.current_grade);
  const averageGrade = subjectsWithGrades.length > 0 
    ? subjectsWithGrades.reduce((sum, subject) => sum + (subject.current_grade || 0), 0) / subjectsWithGrades.length
    : 0;
  // Calculate overall curriculum progress based on subtopic completion
  const overallCurriculumProgress = subjects.length > 0 
    ? subjects.reduce((totalProgress, subject) => {
        const stats = calculateSubjectStats(subject.id);
        return totalProgress + stats.progress;
      }, 0) / subjects.length
    : 0;

  // Calculate total open tasks, homework and oral contributions from real data
  const totalOpenTasks = tasks.filter(task => 
    !task.completed &&
    (!task.due_date || new Date(task.due_date) >= new Date())
  ).length;
  
  const totalOpenHomework = getTotalOpenHomeworkCount(tasks);
  
  // Calculate total Meldungen for today
  const totalMeldungenToday = todayMeldungen.reduce((sum, meldung) => sum + meldung.count, 0);

  // Use real subjects data for progress display
  const subjectProgress = subjects.map(subject => ({
    name: subject.name,
    teacher: subject.teacher || "TBA",
    progress: subject.current_grade ? Math.round(Math.max(0, Math.min(100, ((6 - subject.current_grade) / 5) * 100))) : 0,
    openTasks: getOpenTasksCount(tasks, subject.id),
    openHomework: getOpenHomeworkCount(tasks, subject.id),
    color: subject.color
  }));

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar 
        language={language} 
        onLanguageChange={setLanguage} 
        studentName={studentName}
        t={t}
        onFactsClick={handleFactsOpen}
      />
      
      <div className="container mx-auto px-4 py-6 space-y-6">

        {/* Welcome Banner */}
        <WelcomeBanner studentName={studentName} t={t} />
        
        {/* Time Period Selector */}
        {(subjects.length > 0 || tasks.length > 0) && (
          <TimeSelector
            selectedPeriod={selectedTimePeriod}
            onPeriodChange={setSelectedTimePeriod}
          />
        )}
        
        {/* Metrics Grid - only show if there's data */}
        {(subjects.length > 0 || tasks.length > 0) && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <MetricCard
              title={t.curriculumProgress}
              value={subjects.length > 0 ? `${Math.round(overallCurriculumProgress)}%` : "0%"}
              change={curriculumChange}
              changeType={curriculumChangeType}
              icon={<span className="h-4 w-4">🎯</span>}
              iconColor="text-primary"
              onClick={() => setIsSubjectsModalOpen(true)}
            />
            <MetricCard
              title="Open Tasks"
              value={totalOpenTasks.toString()}
              change={tasksChange}
              changeType={tasksChangeType}
              icon={<span className="h-4 w-4">📋</span>}
              iconColor="text-warning"
              onClick={() => setIsTasksModalOpen(true)}
            />
            <MetricCard
              title="Open Homework"
              value={totalOpenHomework.toString()}
              change={homeworkChange}
              changeType={homeworkChangeType}
              icon={<span className="h-4 w-4">📝</span>}
              iconColor="text-blue-600"
              onClick={() => setIsHomeworkModalOpen(true)}
            />
            <MetricCard
              title={t.activeSubjects}
              value={totalSubjects.toString()}
              change={subjectsChange}
              changeType={subjectsChangeType}
              icon={<span className="h-4 w-4">📚</span>}
              iconColor="text-primary"
              onClick={() => navigate('/subjects')}
            />
            <MetricCard
              title="Meldungen heute"
              value={totalMeldungenToday.toString()}
              change={meldungenChange}
              changeType={meldungenChangeType}
              icon={<span className="h-4 w-4">🙋</span>}
              iconColor="text-green-600"
              onClick={() => setIsMeldungenModalOpen(true)}
            />
          </div>
        )}
        
        {/* Durchschnittsnote Dashboard */}
        <DurchschnittDashboard 
          subjectsWithGrades={subjects.map(subject => ({
            ...subject,
            course_type: subject.course_type as 'LK' | 'GK',
            grades: gradesBySubject[subject.id] || []
          }))}
        />
        

        {/* Subject Progress */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">
            {t.subjectProgress}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjectProgress.length > 0 ? (
              subjectProgress.map((subject, index) => (
                <SubjectProgressItem key={index} subject={subject} t={t} />
              ))
            ) : (
              <Card className="col-span-full">
                <CardContent className="text-center py-12">
                  <div className="space-y-4">
                    <div className="text-6xl opacity-20">📚</div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-foreground">No subjects added yet</h3>
                      <p className="text-muted-foreground">Add your subjects to start tracking your academic progress!</p>
                    </div>
                    <Button onClick={() => navigate('/subjects')} className="mt-4">
                      Add Your First Subject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        
        {/* Feature Suggestions - only show if user has some data */}
        {(subjects.length > 0 || tasks.length > 0) && (
          <FeatureSuggestions t={t} />
        )}
      </div>
      
      {/* Bottom Navigation */}
      <BottomNavigation t={t} />
      
      {/* Meldungen Modal */}
      <MeldungenModal 
        isOpen={isMeldungenModalOpen}
        onClose={() => setIsMeldungenModalOpen(false)}
      />
      
      {/* Tasks Modal */}
      <TasksModal 
        isOpen={isTasksModalOpen}
        onClose={() => setIsTasksModalOpen(false)}
        tasks={tasks.filter(task => !task.completed && task.type === 'task').map(task => ({
          ...task,
          subject: subjects.find(s => s.id === task.subject_id)
        }))}
        title="Open Tasks"
      />
      
      {/* Homework Modal */}
      <HomeworkModal 
        isOpen={isHomeworkModalOpen}
        onClose={() => setIsHomeworkModalOpen(false)}
        homework={tasks.filter(task => !task.completed && task.type === 'homework').map(task => ({
          ...task,
          subject: subjects.find(s => s.id === task.subject_id)
        }))}
        title="Open Homework"
      />
      
      {/* Subjects Modal */}
      <SubjectsModal 
        isOpen={isSubjectsModalOpen}
        onClose={() => setIsSubjectsModalOpen(false)}
        subjects={subjects.map(subject => {
          const stats = calculateSubjectStats(subject.id);
          return {
            ...subject,
            course_type: subject.course_type as 'LK' | 'GK',
            openTasks: getOpenTasksCount(tasks, subject.id),
            openHomework: getOpenHomeworkCount(tasks, subject.id),
            progress: stats.progress,
            totalTopics: stats.totalTopics,
            completedTopics: stats.completedTopics,
            totalSubtopics: stats.totalSubtopics,
            completedSubtopics: stats.completedSubtopics
          };
        })}
        title="All Subjects"
      />
      
      {/* Facts Overlay */}
      <FactsOverlay
        isOpen={isFactsOverlayOpen}
        onClose={handleFactsClose}
        fact={currentFact}
        isLoading={isNextFactLoading}
        onTellMeMore={handleTellMeMore}
        onNextFact={handleNextFact}
      />
    </div>
  );
};

export default Index;