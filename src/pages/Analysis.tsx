import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Navbar } from "@/components/dashboard/navbar";
import { BottomNavigation } from "@/components/dashboard/bottom-navigation";
import { useTranslations } from "@/hooks/use-translations";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { useSubjects } from "@/hooks/use-subjects";
import { useGrades } from "@/hooks/use-grades";
import { calculateGermanGymnasiumAnalytics, formatGrade, getGermanGradeName, getGradeColorClass } from "@/lib/grade-calculations";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Award, 
  Calendar,
  BookOpen,
  AlertTriangle,
  CheckCircle
} from "lucide-react";

const Analysis = () => {
  const { t, language, setLanguage } = useTranslations();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: subjects = [] } = useSubjects();
  const { data: grades = [] } = useGrades();
  const [selectedPeriod, setSelectedPeriod] = useState("month");

  const studentName = profile?.display_name || user?.email?.split('@')[0] || 'Student';

  // Filter grades based on selected period
  const getFilteredGrades = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Get the most recent year with data if current year has no grades
    const gradeYears = grades.map(g => new Date(g.date_received || g.created_at).getFullYear());
    const latestDataYear = Math.max(...gradeYears);
    const targetYear = gradeYears.includes(currentYear) ? currentYear : latestDataYear;
    
    return grades.filter(grade => {
      const gradeDate = new Date(grade.date_received || grade.created_at);
      const gradeYear = gradeDate.getFullYear();
      const gradeMonth = gradeDate.getMonth();
      
      switch (selectedPeriod) {
        case 'month':
          // Show current month of target year, or latest month if no current month data
          if (gradeYear === targetYear) {
            const monthsWithData = grades
              .filter(g => new Date(g.date_received || g.created_at).getFullYear() === targetYear)
              .map(g => new Date(g.date_received || g.created_at).getMonth());
            const targetMonth = monthsWithData.includes(currentMonth) ? currentMonth : Math.max(...monthsWithData);
            return gradeMonth === targetMonth;
          }
          return false;
        case 'semester':
          // German school year: 1st semester (Aug-Jan), 2nd semester (Feb-Jul)
          const currentSemester = currentMonth >= 7 || currentMonth <= 0 ? 1 : 2;
          const gradeSemester = gradeMonth >= 7 || gradeMonth <= 0 ? 1 : 2;
          return gradeYear === targetYear && gradeSemester === currentSemester;
        case 'year':
          return gradeYear === targetYear;
        default:
          return true;
      }
    });
  };

  const filteredGrades = getFilteredGrades();

  // Calculate real analytics using German Gymnasium system with filtered grades
  const subjectsWithGrades = subjects.map(subject => ({
    ...subject,
    grades: filteredGrades.filter(grade => grade.subject_id === subject.id),
    course_type: (subject.course_type === 'LK' || subject.course_type === 'GK') ? subject.course_type as 'LK' | 'GK' : 'GK' as 'GK'
  }));

  const analytics = calculateGermanGymnasiumAnalytics(subjectsWithGrades);

  // Calculate additional metrics using filtered grades
  const totalGrades = filteredGrades.length;
  const recentGrades = filteredGrades.filter(g => {
    const gradeDate = new Date(g.date_received || g.created_at);
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    return gradeDate >= oneMonthAgo;
  }).length;

  const subjectPerformance = analytics.subjectAnalytics.map(subject => {
    const subjectGrades = filteredGrades.filter(g => g.subject_id === subject.subjectId);
    const targetGrade = subjects.find(s => s.id === subject.subjectId)?.target_grade;
    
    let status = "on_track";
    if (subject.overallAverage && targetGrade) {
      if (subject.overallAverage <= targetGrade - 0.3) status = "ahead";
      else if (subject.overallAverage >= targetGrade + 0.3) status = "behind";
    }
    
    const progress = subject.overallAverage && targetGrade 
      ? Math.max(0, Math.min(100, ((6 - subject.overallAverage) / (6 - targetGrade)) * 100))
      : 0;
    
    return {
      id: subject.subjectId,
      name: subject.subjectName,
      currentGrade: subject.overallAverage,
      targetGrade,
      progress: Math.round(progress),
      status,
      assignments: subjectGrades.length,
      completedAssignments: subjectGrades.length
    };
  });

  const getTrendIcon = (trend: string) => {
    if (trend === "up") {
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    } else if (trend === "down") {
      return <TrendingDown className="w-4 h-4 text-red-600" />;
    }
    return null;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ahead":
        return "text-green-600";
      case "on_track":
        return "text-blue-600";
      case "behind":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ahead":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "on_track":
        return <Target className="w-4 h-4 text-blue-600" />;
      case "behind":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getGradeColor = (grade: number) => {
    if (grade <= 1.5) return "text-green-600";
    if (grade <= 2.5) return "text-blue-600";
    if (grade <= 3.5) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar 
        language={language} 
        onLanguageChange={setLanguage} 
        studentName={studentName}
        t={t} 
      />
      
      <div className="container mx-auto px-4 py-6 pb-20">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6 rounded-lg mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <BarChart3 className="w-6 h-6" />
                Analyse
              </h1>
              <p className="text-primary-foreground/80 mt-1">
                Verfolge deine Leistungsentwicklung, {studentName}
              </p>
            </div>
            <div className="flex gap-2">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-32 bg-primary-foreground text-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Monat</SelectItem>
                  <SelectItem value="semester">Semester</SelectItem>
                  <SelectItem value="year">Jahr</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gesamt-GPA</p>
                  <div className="flex items-center gap-2">
                    <p className={`text-2xl font-bold ${analytics.overallAverage > 0 ? getGradeColor(analytics.overallAverage) : 'text-gray-500'}`}>
                      {analytics.overallAverage > 0 ? formatGrade(analytics.overallAverage) : 'N/A'}
                    </p>
                    {analytics.overallAverage > 0 && analytics.overallAverage <= 2.5 && getTrendIcon('up')}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Target className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Credits</p>
                  <p className="text-2xl font-bold">
                    {subjects.reduce((sum, s) => sum + (s.credits || 3), 0)}/180
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Aufgaben</p>
                  <p className="text-2xl font-bold">
                    {recentGrades}/{totalGrades}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Anstehend</p>
                  <p className="text-2xl font-bold">{subjects.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* German Gymnasium Component Breakdown */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Bewertungskomponenten (Deutsches Gymnasium)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Written Exams */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <h4 className="font-semibold">Schriftliche Prüfungen</h4>
                </div>
                <p className={`text-2xl font-bold ${analytics.componentBreakdown.writtenExams.average ? getGradeColor(analytics.componentBreakdown.writtenExams.average) : 'text-gray-500'}`}>
                  {analytics.componentBreakdown.writtenExams.average ? formatGrade(analytics.componentBreakdown.writtenExams.average) : 'N/A'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {analytics.componentBreakdown.writtenExams.count} Bewertungen
                </p>
              </div>

              {/* SoMi */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <h4 className="font-semibold">SoMi (Sonstige Mitarbeit)</h4>
                </div>
                <p className={`text-2xl font-bold ${analytics.componentBreakdown.somi.average ? getGradeColor(analytics.componentBreakdown.somi.average) : 'text-gray-500'}`}>
                  {analytics.componentBreakdown.somi.average ? formatGrade(analytics.componentBreakdown.somi.average) : 'N/A'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {analytics.componentBreakdown.somi.count} Bewertungen
                </p>
              </div>

              {/* Projects */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <h4 className="font-semibold">Projekte & Präsentationen</h4>
                </div>
                <p className={`text-2xl font-bold ${analytics.componentBreakdown.projects.average ? getGradeColor(analytics.componentBreakdown.projects.average) : 'text-gray-500'}`}>
                  {analytics.componentBreakdown.projects.average ? formatGrade(analytics.componentBreakdown.projects.average) : 'N/A'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {analytics.componentBreakdown.projects.count} Bewertungen
                </p>
              </div>

              {/* Practical */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <h4 className="font-semibold">Praktische Elemente</h4>
                </div>
                <p className={`text-2xl font-bold ${analytics.componentBreakdown.practical.average ? getGradeColor(analytics.componentBreakdown.practical.average) : 'text-gray-500'}`}>
                  {analytics.componentBreakdown.practical.average ? formatGrade(analytics.componentBreakdown.practical.average) : 'N/A'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {analytics.componentBreakdown.practical.count} Bewertungen
                </p>
              </div>

              {/* Effort & Progress */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <h4 className="font-semibold">Anstrengung & Fortschritt</h4>
                </div>
                <p className={`text-2xl font-bold ${analytics.componentBreakdown.effortProgress.average ? getGradeColor(analytics.componentBreakdown.effortProgress.average) : 'text-gray-500'}`}>
                  {analytics.componentBreakdown.effortProgress.average ? formatGrade(analytics.componentBreakdown.effortProgress.average) : 'N/A'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {analytics.componentBreakdown.effortProgress.count} Bewertungen
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subject Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Fach-Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subjectPerformance.map((subject) => (
                <div key={subject.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{subject.name}</h3>
                      <Badge variant="outline" className={getStatusColor(subject.status)}>
                        {getStatusIcon(subject.status)}
                        <span className="ml-1">
                          {subject.status === "ahead" && "Voraus"}
                          {subject.status === "on_track" && "Im Plan"}
                          {subject.status === "behind" && "Rückstand"}
                        </span>
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {subject.completedAssignments}/{subject.assignments} Aufgaben
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Aktuelle Note</p>
                      <p className={`text-lg font-bold ${subject.currentGrade ? getGradeColor(subject.currentGrade) : 'text-gray-500'}`}>
                        {subject.currentGrade ? subject.currentGrade.toFixed(1) : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Ziel-Note</p>
                      <p className="text-lg font-bold text-primary">
                        {subject.targetGrade ? subject.targetGrade.toFixed(1) : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Fortschritt</p>
                      <div className="flex items-center gap-2">
                        <Progress value={subject.progress} className="flex-1" />
                        <span className="text-sm font-medium">{subject.progress}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <BottomNavigation t={t} />
    </div>
  );
};

export default Analysis;