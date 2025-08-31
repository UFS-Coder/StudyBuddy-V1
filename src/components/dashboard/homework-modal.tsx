import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckSquare, Clock, AlertTriangle, BookOpen, Filter } from "lucide-react";
import { format } from "date-fns";
import { useUpdateTask } from "@/hooks/use-tasks";

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
  const updateTaskMutation = useUpdateTask();
  const [filter, setFilter] = useState<'all' | 'open' | 'completed'>('all');
  
  const handleToggleComplete = (homeworkId: string, completed: boolean) => {
    updateTaskMutation.mutate({ id: homeworkId, completed: !completed });
  };
  
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

  const openHomework = homework.filter(hw => !hw.completed);
  const completedHomework = homework.filter(hw => hw.completed);
  
  const getFilteredHomework = () => {
    let filteredHomework;
    switch (filter) {
      case 'open':
        filteredHomework = openHomework;
        break;
      case 'completed':
        filteredHomework = completedHomework;
        break;
      default:
        filteredHomework = homework;
        break;
    }
    
    // Sort so completed homework appears at the bottom
    return filteredHomework.sort((a, b) => {
      if (a.completed === b.completed) return 0;
      return a.completed ? 1 : -1;
    });
  };
  
  const filteredHomework = getFilteredHomework();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {title} ({openHomework.length} open, {completedHomework.length} completed)
          </DialogTitle>
          <div className="flex gap-2 mt-4">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              All ({homework.length})
            </Button>
            <Button
              variant={filter === 'open' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('open')}
              className="flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              Open ({openHomework.length})
            </Button>
            <Button
              variant={filter === 'completed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('completed')}
              className="flex items-center gap-2"
            >
              <CheckSquare className="h-4 w-4" />
              Completed ({completedHomework.length})
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          {filteredHomework.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {filter === 'all' ? 'No homework found' :
                 filter === 'open' ? 'No open homework' :
                 'No completed homework'}
              </p>
            </div>
          ) : (
            <>
              {filteredHomework.map((hw) => (
              <Card key={hw.id} className={`${hw.completed ? 'opacity-60' : ''} ${isOverdue(hw.due_date) ? 'border-red-200' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={hw.completed}
                      onChange={() => handleToggleComplete(hw.id, hw.completed)}
                      className="mt-1 rounded cursor-pointer"
                      disabled={updateTaskMutation.isPending}
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
                        <p className={`text-sm text-muted-foreground ${hw.completed ? 'line-through' : ''}`}>
                          {hw.description}
                        </p>
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
              ))}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}