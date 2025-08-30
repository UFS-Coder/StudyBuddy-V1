import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { GradeBadge } from "@/components/ui/grade-badge";
import { BookOpen, TrendingUp, Calendar, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SubjectCardProps {
  subject: {
    name: string;
    teacher: string;
    type: "LK" | "GK";
    currentGrade: number;
    gradeScale: "1-6" | "0-15";
    syllabusProgress: number;
    nextAssessment?: {
      type: string;
      date: string;
    };
    recentGrades: number[];
  };
  t: any;
}

export function SubjectCard({ subject, t }: SubjectCardProps) {
  const getTrendDirection = () => {
    if (subject.recentGrades.length < 2) return "stable";
    const recent = subject.recentGrades.slice(-2);
    if (subject.gradeScale === "1-6") {
      return recent[1] < recent[0] ? "up" : recent[1] > recent[0] ? "down" : "stable";
    } else {
      return recent[1] > recent[0] ? "up" : recent[1] < recent[0] ? "down" : "stable";
    }
  };

  const trend = getTrendDirection();

  return (
    <Card className="p-6 shadow-card hover:shadow-elevated transition-academic border-l-4 border-l-primary">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-lg text-foreground">{subject.name}</h3>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                subject.type === "LK" 
                  ? "bg-primary/10 text-primary border border-primary/20" 
                  : "bg-muted text-muted-foreground border border-border"
              }`}>
                {subject.type === "LK" ? t.lk : t.gk}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{subject.teacher}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <GradeBadge grade={subject.currentGrade} scale={subject.gradeScale} />
            <div className={`flex items-center gap-1 text-xs ${
              trend === "up" ? "text-success" : trend === "down" ? "text-academic-red" : "text-muted-foreground"
            }`}>
              <TrendingUp className={`w-3 h-3 ${trend === "down" ? "rotate-180" : ""}`} />
              <span className="capitalize">{trend === "stable" ? "Stabil" : trend === "up" ? "Verbessert" : "Verschlechtert"}</span>
            </div>
          </div>
        </div>

        {/* Syllabus Progress */}
        <ProgressBar 
          value={subject.syllabusProgress} 
          label={t.progress} 
          variant="academic"
        />

        {/* Next Assessment */}
        {subject.nextAssessment && (
          <div className="flex items-center gap-2 p-3 bg-accent rounded-lg">
            <Calendar className="w-4 h-4 text-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{subject.nextAssessment.type}</p>
              <p className="text-xs text-muted-foreground">{subject.nextAssessment.date}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1">
            <Plus className="w-4 h-4 mr-2" />
            {t.addGrade}
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            {t.viewDetails}
          </Button>
        </div>
      </div>
    </Card>
  );
}