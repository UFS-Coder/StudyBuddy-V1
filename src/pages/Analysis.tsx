import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
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
  const { t } = useTranslations();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: subjects } = useSubjects();
  const [selectedPeriod, setSelectedPeriod] = useState("semester");
  const [selectedSubject, setSelectedSubject] = useState("all");

  const studentName = profile?.display_name || user?.email?.split("@")[0] || "Student";

  // Mock analytics data - in real app this would come from a hook
  const mockAnalytics = {
    overallGPA: 2.3,
    trend: "up",
    trendPercentage: 8.5,
    totalCredits: 32,
    completedCredits: 24,
    subjectPerformance: [
      {
        id: "math",
        name: "Mathematik",
        currentGrade: 2.1,
        targetGrade: 1.8,
        trend: "up",
        progress: 75,
        credits: 5,
        status: "on_track"
      },
      {
        id: "physics",
        name: "Physik",
        currentGrade: 2.8,
        targetGrade: 2.0,
        trend: "down",
        progress: 60,
        credits: 5,
        status: "needs_attention"
      },
      {
        id: "chemistry",
        name: "Chemie",
        currentGrade: 1.9,
        targetGrade: 2.0,
        trend: "stable",
        progress: 85,
        credits: 4,
        status: "excellent"
      },
      {
        id: "biology",
        name: "Biologie",
        currentGrade: 2.5,
        targetGrade: 2.2,
        trend: "up",
        progress: 70,
        credits: 4,
        status: "on_track"
      }
    ],
    monthlyProgress: [
      { month: "Sep", gpa: 2.8 },
      { month: "Okt", gpa: 2.6 },
      { month: "Nov", gpa: 2.4 },
      { month: "Dez", gpa: 2.3 },
      { month: "Jan", gpa: 2.3 }
    ],
    upcomingDeadlines: 3,
    completedAssignments: 18,
    totalAssignments: 22
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case "down":
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <div className="w-4 h-4 bg-gray-400 rounded-full" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "text-green-600";
      case "on_track":
        return "text-blue-600";
      case "needs_attention":
        return "text-orange-600";
      case "critical":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "excellent":
        return <Award className="w-4 h-4 text-green-600" />;
      case "on_track":
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case "needs_attention":
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case "critical":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <div className="w-4 h-4 bg-gray-400 rounded-full" />;
    }
  };

  const getGradeColor = (grade: number) => {
    if (grade <= 2.0) return "text-green-600";
    if (grade <= 3.0) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6">
        <div className="container mx-auto">
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
      </div>

      <div className="container mx-auto p-6">
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
                      <h3 className="font-medium">{subject.name}</h3>
                      <Badge variant="outline">{subject.credits} Credits</Badge>
                      {getStatusIcon(subject.status)}
                    </div>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(subject.trend)}
                      <span className={`text-sm font-medium ${getStatusColor(subject.status)}`}>
                        {subject.status === "excellent" ? "Ausgezeichnet" :
                         subject.status === "on_track" ? "Auf Kurs" :
                         subject.status === "needs_attention" ? "Aufmerksamkeit" : "Kritisch"}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      {/* Bottom padding for navigation */}
      <div className="h-20" />
      
      <BottomNavigation t={t} />
    </div>
  );
};

export default Analysis;