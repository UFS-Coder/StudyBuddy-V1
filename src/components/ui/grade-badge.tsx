import { cn } from "@/lib/utils";

interface GradeBadgeProps {
  grade: number;
  scale: "1-6" | "0-15";
  className?: string;
}

export function GradeBadge({ grade, scale, className }: GradeBadgeProps) {
  const getGradeColor = (grade: number, scale: "1-6" | "0-15") => {
    if (scale === "1-6") {
      if (grade <= 2) return "bg-gradient-success text-success-foreground";
      if (grade <= 3) return "bg-success/20 text-success border border-success/30";
      if (grade <= 4) return "bg-warning/20 text-warning border border-warning/30";
      return "bg-academic-red/20 text-academic-red border border-academic-red/30";
    } else {
      if (grade >= 11) return "bg-gradient-success text-success-foreground";
      if (grade >= 8) return "bg-success/20 text-success border border-success/30";
      if (grade >= 5) return "bg-warning/20 text-warning border border-warning/30";
      return "bg-academic-red/20 text-academic-red border border-academic-red/30";
    }
  };

  const getGradeText = (grade: number, scale: "1-6" | "0-15") => {
    if (scale === "1-6") {
      const gradeNames = {
        1: "Sehr gut",
        2: "Gut", 
        3: "Befriedigend",
        4: "Ausreichend",
        5: "Mangelhaft",
        6: "Ungenügend"
      };
      return gradeNames[grade as keyof typeof gradeNames] || grade.toString();
    }
    return `${grade} Punkte`;
  };

  return (
    <div className={cn(
      "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-academic",
      getGradeColor(grade, scale),
      className
    )}>
      {getGradeText(grade, scale)}
    </div>
  );
}