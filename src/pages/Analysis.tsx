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
  const { data: subjects } = useSubjects();
  const [selectedPeriod, setSelectedPeriod] = useState("month");

  const studentName = profile?.display_name || user?.email?.split('@')[0] || 'Student';

  // Mock analytics data
  const mockAnalytics = {
    overallGPA: 2.3,
    trend: "up",
    completedCredits: 45,
    totalCredits: 180,
    completedAssignments: 23,
    totalAssignments: 28,
    upcomingDeadlines: 5,
    monthlyProgress: [
      { month: "Sep", gpa: 2.1 },
      { month: "Okt", gpa: 2.2 },
      { month: "Nov", gpa: 2.4 },
      { month: "Dez", gpa: 2.3 },
    ],
    subjectPerformance: [
      {
        id: 1,
        name: "Mathematik",
        currentGrade: 2.0,
        targetGrade: 1.7,
        progress: 75,
        status: "on_track",
        assignments: 8,
        completedAssignments: 6
      },
      {
        id: 2,
        name: "Physik",
        currentGrade: 2.7,
        targetGrade: 2.3,
        progress: 60,
        status: "behind",
        assignments: 6,
        completedAssignments: 3
      },
      {
        id: 3,
        name: "Informatik",
        currentGrade: 1.8,
        targetGrade: 1.5,
        progress: 90,
        status: "ahead",
        assignments: 10,
        completedAssignments: 9
      }
    ]
  };

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
                    <p className={`text-2xl font-bold ${getGradeColor(mockAnalytics.overallGPA)}`}>
                      {mockAnalytics.overallGPA.toFixed(1)}
                    </p>
                    {getTrendIcon(mockAnalytics.trend)}
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
                    {mockAnalytics.completedCredits}/{mockAnalytics.totalCredits}
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
                    {mockAnalytics.completedAssignments}/{mockAnalytics.totalAssignments}
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
                  <p className="text-2xl font-bold">{mockAnalytics.upcomingDeadlines}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Grade Trend Chart */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Notenentwicklung
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                <span>Schlechter</span>
                <span>Besser</span>
              </div>
              {mockAnalytics.monthlyProgress.map((month, index) => (
                <div key={month.month} className="flex items-center gap-4">
                  <span className="w-12 text-sm font-medium">{month.month}</span>
                  <div className="flex-1 relative">
                    <div className="h-8 bg-gradient-to-r from-red-200 via-yellow-200 to-green-200 rounded-lg" />
                    <div 
                      className="absolute top-1 h-6 w-2 bg-primary rounded-sm shadow-sm"
                      style={{ left: `${100 - (month.gpa - 1) * 20}%` }}
                    />
                  </div>
                  <span className={`w-12 text-sm font-bold ${getGradeColor(month.gpa)}`}>
                    {month.gpa.toFixed(1)}
                  </span>
                </div>
              ))}
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
              {mockAnalytics.subjectPerformance.map((subject) => (
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
                      <p className={`text-lg font-bold ${getGradeColor(subject.currentGrade)}`}>
                        {subject.currentGrade.toFixed(1)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Ziel-Note</p>
                      <p className="text-lg font-bold text-primary">
                        {subject.targetGrade.toFixed(1)}
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