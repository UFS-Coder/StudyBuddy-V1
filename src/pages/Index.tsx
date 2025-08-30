import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/dashboard/navbar";
import { WelcomeBanner } from "@/components/dashboard/welcome-banner";
import { MetricCard } from "@/components/dashboard/metric-card";
import { SubjectProgressItem } from "@/components/dashboard/subject-progress-item";
import { FeatureSuggestions } from "@/components/dashboard/feature-suggestions";
import { BottomNavigation } from "@/components/dashboard/bottom-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "@/hooks/use-translations";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { useSubjects } from "@/hooks/use-subjects";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();
  const { data: profile } = useProfile();
  const { data: subjects = [] } = useSubjects();
  const { language, setLanguage, t } = useTranslations();
  const navigate = useNavigate();

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
  const averageGrade = subjects.length > 0 
    ? subjects.reduce((sum, subject) => sum + (subject.current_grade || 0), 0) / subjects.filter(s => s.current_grade).length
    : 0;
  const progress = subjects.length > 0 
    ? (subjects.filter(s => s.current_grade && s.current_grade >= 50).length / subjects.length) * 100
    : 0;

  // Use real subjects data for progress display
  const subjectProgress = subjects.map(subject => ({
    name: subject.name,
    teacher: subject.teacher || "TBA",
    progress: subject.current_grade || 0,
    openTasks: Math.floor(Math.random() * 3) // Mock data for now
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
        
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            title={t.averageGradeFull}
            value={averageGrade ? `${averageGrade.toFixed(1)}%` : "N/A"}
            change="+2.3%"
            changeType="positive"
            icon={<span className="h-4 w-4">📊</span>}
            iconColor="text-success"
          />
          <MetricCard
            title={t.curriculumProgress}
            value={`${Math.round(progress)}%`}
            change="+5%"
            changeType="positive"
            icon={<span className="h-4 w-4">🎯</span>}
            iconColor="text-primary"
          />
          <MetricCard
            title={t.oralContributions}
            value="15"
            change="-1"
            changeType="negative"
            icon={<span className="h-4 w-4">💬</span>}
            iconColor="text-warning"
          />
          <MetricCard
            title={t.activeSubjects}
            value={totalSubjects.toString()}
            change="0"
            changeType="neutral"
            icon={<span className="h-4 w-4">📚</span>}
            iconColor="text-primary"
          />
        </div>
        
        {/* Subject Progress */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">
            {t.subjectProgress}
          </h2>
          <div className="space-y-3">
            {subjectProgress.length > 0 ? (
              subjectProgress.map((subject, index) => (
                <SubjectProgressItem key={index} subject={subject} t={t} />
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">No subjects added yet.</p>
                  <p className="text-sm mt-2">Add your subjects to start tracking your progress!</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        
        {/* Feature Suggestions */}
        <FeatureSuggestions t={t} />
      </div>
      
      {/* Bottom Navigation */}
      <BottomNavigation t={t} />
    </div>
  );
};

export default Index;