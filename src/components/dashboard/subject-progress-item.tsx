import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, Clock } from "lucide-react";

interface SubjectProgressItemProps {
  subject: {
    name: string;
    teacher: string;
    progress: number;
    openTasks: number;
  };
  t: any;
}

export function SubjectProgressItem({ subject, t }: SubjectProgressItemProps) {
  const getTaskText = (count: number) => {
    if (count === 0) return "";
    if (count === 1) return `1 ${t.openTasks}`;
    return `${count} ${t.openTasksPlural}`;
  };

  return (
    <Card className="p-4 shadow-card hover:shadow-elevated transition-all duration-200 cursor-pointer">
      <div className="flex items-center justify-between">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-primary"></div>
            <div>
              <h3 className="font-medium text-foreground">{subject.name}</h3>
              <p className="text-sm text-muted-foreground">{subject.teacher}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Fortschritt</span>
              <span className="font-medium">{subject.progress}%</span>
            </div>
            <Progress value={subject.progress} className="h-2" />
            
            {subject.openTasks > 0 && (
              <div className="flex items-center gap-1 text-sm text-warning">
                <Clock className="h-3 w-3" />
                <span>{getTaskText(subject.openTasks)}</span>
              </div>
            )}
          </div>
        </div>
        
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </div>
    </Card>
  );
}