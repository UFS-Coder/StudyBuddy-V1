import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/dashboard/navbar";
import { WelcomeBanner } from "@/components/dashboard/welcome-banner";
import { MetricCard } from "@/components/dashboard/metric-card";
import { SubjectProgressItem } from "@/components/dashboard/subject-progress-item";
import { FeatureSuggestions } from "@/components/dashboard/feature-suggestions";
import { BottomNavigation } from "@/components/dashboard/bottom-navigation";
import { DurchschnittDashboard } from "@/components/grades/durchschnitt-dashboard";

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
  const progress = subjects.length > 0 
    ? (subjects.filter(s => s.current_grade && s.current_grade <= 3.0).length / subjects.length) * 100
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
      />
      
      <div className="container mx-auto px-4 py-6 space-y-6">

        {/* Welcome Banner */}
        <WelcomeBanner studentName={studentName} t={t} />
        
        {/* Metrics Grid - only show if there's data */}
        {(subjects.length > 0 || tasks.length > 0) && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <MetricCard
              title={t.curriculumProgress}
              value={subjects.length > 0 ? `${Math.round(progress)}%` : "0%"}
              change={subjects.length > 0 ? "+5%" : "0%"}
              changeType={subjects.length > 0 ? "positive" : "neutral"}
              icon={<span className="h-4 w-4">🎯</span>}
              iconColor="text-primary"
            />
            <MetricCard
              title="Open Tasks"
              value={totalOpenTasks.toString()}
              change="0"
              changeType="neutral"
              icon={<span className="h-4 w-4">📋</span>}
              iconColor="text-warning"
            />
            <MetricCard
              title="Open Homework"
              value={totalOpenHomework.toString()}
              change="0"
              changeType="neutral"
              icon={<span className="h-4 w-4">📝</span>}
              iconColor="text-blue-600"
            />
            <MetricCard
              title={t.activeSubjects}
              value={totalSubjects.toString()}
              change="0"
              changeType="neutral"
              icon={<span className="h-4 w-4">📚</span>}
              iconColor="text-primary"
            />
            <MetricCard
              title="Meldungen heute"
              value={totalMeldungenToday.toString()}
              change="0"
              changeType="neutral"
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
    </div>
  );
};

export default Index;