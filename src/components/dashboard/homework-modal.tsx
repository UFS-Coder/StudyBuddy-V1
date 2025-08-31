import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, AlertTriangle, CheckSquare } from "lucide-react";
import { format } from "date-fns";

interface Homework {
  id: string;
  title: string;
  description?: string;
  due_date: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  subject_id: string;
  subject?: {
    name: string;
    color?: string;
  };
}

interface HomeworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  homework: Homework[];
  title: string;
}

export function HomeworkModal({ isOpen, onClose, homework, title }: HomeworkModalProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-green-600 bg-green-50';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="h-3 w-3" />;
      case 'medium':
        return <Clock className="h-3 w-3" />;
      default:
        return <CheckSquare className="h-3 w-3" />;
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && !homework.find(hw => hw.due_date === dueDate)?.completed;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {title}
            <Badge variant="secondary">{homework.length}</Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {homework.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No homework found</p>
            </div>
          ) : (
            homework.map((hw) => (
              <Card key={hw.id} className={`${hw.completed ? 'opacity-60' : ''} ${isOverdue(hw.due_date) ? 'border-red-200' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={hw.completed}
                      readOnly
                      className="mt-1 rounded"
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className={`font-medium ${hw.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {hw.title}
                        </h4>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getPriorityColor(hw.priority)}`}
                          >
                            {getPriorityIcon(hw.priority)}
                            <span className="ml-1 capitalize">{hw.priority}</span>
                          </Badge>
                          {isOverdue(hw.due_date) && (
                            <Badge variant="destructive" className="text-xs">
                              Overdue
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {hw.description && (
                        <p className="text-sm text-muted-foreground">{hw.description}</p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {hw.subject && (
                            <Badge 
                              variant="outline" 
                              className="text-xs"
                              style={{ borderColor: hw.subject.color || '#3b82f6' }}
                            >
                              {hw.subject.name}
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Due: {format(new Date(hw.due_date), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}