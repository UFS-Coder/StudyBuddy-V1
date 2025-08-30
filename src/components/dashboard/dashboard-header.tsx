import { Card } from "@/components/ui/card";
import { GradeBadge } from "@/components/ui/grade-badge";
import { Calendar, TrendingUp, BookOpen, Users } from "lucide-react";

interface DashboardHeaderProps {
  studentName: string;
  currentTerm: string;
  overallAverage: number;
  gradeScale: "1-6" | "0-15";
  stats: {
    totalSubjects: number;
    completedAssignments: number;
    upcomingAssessments: number;
    oralParticipations: number;
  };
  t: any;
}

export function DashboardHeader({ 
  studentName, 
  currentTerm, 
  overallAverage, 
  gradeScale,
  stats,
  t 
}: DashboardHeaderProps) {
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-academic rounded-xl p-6 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">{t.dashboard}</h1>
            <p className="text-primary-foreground/80 text-lg">{currentTerm}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-primary-foreground/80 mb-1">{t.averageGrade}</p>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
              <span className="text-2xl font-bold">
                {gradeScale === "1-6" ? overallAverage.toFixed(1) : Math.round(overallAverage)}
              </span>
              <span className="text-sm ml-1">
                {gradeScale === "1-6" ? "" : "Punkte"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.totalSubjects}</p>
              <p className="text-sm text-muted-foreground">{t.subjects}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.completedAssignments}</p>
              <p className="text-sm text-muted-foreground">{t.completedTopics}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-warning/10 rounded-lg">
              <Calendar className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.upcomingAssessments}</p>
              <p className="text-sm text-muted-foreground">{t.upcomingTests}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/30 rounded-lg">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.oralParticipations}</p>
              <p className="text-sm text-muted-foreground">{t.muendlich}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}