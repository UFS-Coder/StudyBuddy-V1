import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, Clock, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { useUpdateTask } from "@/hooks/use-tasks";
import { useState } from "react";

interface Task {
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

interface TasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  title: string;
}

export function TasksModal({ isOpen, onClose, tasks, title }: TasksModalProps) {
  const updateTaskMutation = useUpdateTask();
  const [filter, setFilter] = useState<'all' | 'open' | 'completed'>('all');
  
  const handleToggleComplete = (taskId: string, completed: boolean) => {
    updateTaskMutation.mutate({ id: taskId, completed: !completed });
  };
  
  const openTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);
  
  const getFilteredTasks = () => {
    let filteredTasks;
    switch (filter) {
      case 'open':
        filteredTasks = openTasks;
        break;
      case 'completed':
        filteredTasks = completedTasks;
        break;
      default:
        filteredTasks = tasks;
        break;
    }
    
    // Sort so completed tasks appear at the bottom
    return filteredTasks.sort((a, b) => {
      if (a.completed === b.completed) return 0;
      return a.completed ? 1 : -1;
    });
  };
  
  const filteredTasks = getFilteredTasks();
  
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
    return new Date(dueDate) < new Date() && !tasks.find(t => t.due_date === dueDate)?.completed;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            {title}
          </DialogTitle>
          <div className="flex items-center gap-2 mt-2">
            <Badge 
              variant={filter === 'all' ? 'default' : 'outline'}
              className="cursor-pointer hover:bg-primary/80"
              onClick={() => setFilter('all')}
            >
              All ({tasks.length})
            </Badge>
            <Badge 
              variant={filter === 'open' ? 'default' : 'outline'}
              className="cursor-pointer hover:bg-primary/80"
              onClick={() => setFilter('open')}
            >
              Open ({openTasks.length})
            </Badge>
            {completedTasks.length > 0 && (
              <Badge 
                variant={filter === 'completed' ? 'default' : 'outline'}
                className="cursor-pointer hover:bg-primary/80"
                onClick={() => setFilter('completed')}
              >
                Completed ({completedTasks.length})
              </Badge>
            )}
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-8">
              <CheckSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {filter === 'open' ? 'No open tasks' : 
                 filter === 'completed' ? 'No completed tasks' : 
                 'No tasks found'}
              </p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <Card key={task.id} className={`${isOverdue(task.due_date) ? 'border-red-200' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => handleToggleComplete(task.id, task.completed)}
                      className="mt-1 rounded cursor-pointer"
                      disabled={updateTaskMutation.isPending}
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getPriorityColor(task.priority)}`}
                          >
                            {getPriorityIcon(task.priority)}
                            <span className="ml-1 capitalize">{task.priority}</span>
                          </Badge>
                          {isOverdue(task.due_date) && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Overdue
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {task.description && (
                        <p className={`text-sm text-muted-foreground ${task.completed ? 'line-through' : ''}`}>
                          {task.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {task.subject && (
                            <Badge 
                              variant="outline" 
                              className="text-xs"
                              style={{ borderColor: task.subject.color || '#3b82f6' }}
                            >
                              {task.subject.name}
                            </Badge>
                          )}
                        </div>
                        {task.due_date && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Due: {format(new Date(task.due_date), 'MMM dd, yyyy')}
                          </span>
                        )}
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