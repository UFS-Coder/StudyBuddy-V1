import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, Clock, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SubjectProgressItemProps {
  subject: {
    name: string;
    teacher: string;
    progress: number;
    openTasks: number;
    openHomework: number;
    color?: string;
  };
  t: any;
}

export function SubjectProgressItem({ subject, t }: SubjectProgressItemProps) {
  const navigate = useNavigate();
  
  const getTaskText = (count: number) => {
    if (count === 0) return "";
    if (count === 1) return `1 ${t.openTasks}`;
    return `${count} ${t.openTasksPlural}`;
  };
  
  const getHomeworkText = (count: number) => {
    if (count === 0) return "";
    if (count === 1) return "1 offene Aufgabe";
    return `${count} offene Aufgaben`;
  };
  
  const handleCardClick = () => {
    navigate(`/subjects?subject=${encodeURIComponent(subject.name)}`);
  };
  
  const handleTaskClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/profile?tab=admin&section=tasks');
  };
  
  const handleHomeworkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/profile?tab=admin&section=tasks');
  };

  return (
    <Card className="p-4 shadow-card hover:shadow-elevated transition-all duration-200 cursor-pointer" onClick={handleCardClick}>
      <div className="flex items-center justify-between">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: subject.color || '#3b82f6' }}
            ></div>
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
            
            <div className="flex flex-col gap-1">
              {subject.openTasks > 0 && (
                <div className="flex items-center gap-1 text-sm text-warning cursor-pointer hover:text-warning/80" onClick={handleTaskClick}>
                  <Clock className="h-3 w-3" />
                  <span>{getTaskText(subject.openTasks)}</span>
                </div>
              )}
              {subject.openHomework > 0 && (
                 <div className="flex items-center gap-1 text-sm text-blue-600 cursor-pointer hover:text-blue-600/80" onClick={handleHomeworkClick}>
                   <FileText className="h-3 w-3" />
                   <span>{getHomeworkText(subject.openHomework)}</span>
                 </div>
               )}
            </div>
          </div>
        </div>
        
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </div>
    </Card>
  );
}