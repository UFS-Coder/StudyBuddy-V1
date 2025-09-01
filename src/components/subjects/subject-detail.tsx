import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  BookOpen, 
  Target, 
  TrendingUp, 
  Calendar,
  Plus,
  BarChart3,
  FileText,
  Users,
  Settings,
  CheckSquare,
  Clock,
  Filter,
  Edit,
  Trash2,
  Award,
  AlertTriangle,
  Activity
} from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { CurriculumDashboard } from '@/components/curriculum/curriculum-dashboard';
import { GradeInput } from '@/components/grades/grade-input';

import { useAuth } from '@/hooks/use-auth';
import { useGrades } from '@/hooks/use-grades';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatGrade, getGradeColorClass, getGermanGradeName, calculateSubjectAverage } from '@/lib/grade-calculations';
import { format } from 'date-fns';

type Subject = Tables<'subjects'>;

interface SubjectDetailProps {
  subject: Subject;
  onBack: () => void;
  t: any;
}

interface GradeManagementProps {
  subject: Subject;
}

function GradeManagement({ subject }: GradeManagementProps) {
  const { data: grades = [], refetch } = useGrades(subject.id);

  return (
    <div className="space-y-6 mt-4 md:mt-6">
      {/* Add Grade Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Note hinzufügen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <GradeInput 
            subjectId={subject.id}
            subjectName={subject.name}
            onGradeAdded={() => refetch()}
          />
        </CardContent>
      </Card>

      {/* Grades List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Notenverwaltung
          </CardTitle>
        </CardHeader>
        <CardContent>
          {grades.length > 0 ? (
            <div className="space-y-3">
              {grades.map((grade) => (
                <div key={grade.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{grade.title}</h4>
                      <Badge variant="outline">{grade.type}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(grade.date_received).toLocaleDateString('de-DE')} • Gewichtung: {grade.weight}
                    </p>
                    {grade.notes && (
                      <p className="text-sm text-muted-foreground mt-1">{grade.notes}</p>
                    )}
                  </div>
                  <div className={`text-lg font-bold px-3 py-1 rounded ${getGradeColorClass(grade.grade)}`}>
                    {formatGrade(grade.grade)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Noch keine Noten</h3>
              <p>Füge deine erste Note hinzu, um deine Leistung zu verfolgen!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface Task {
  id: string;
  title: string;
  description: string;
  due_date: string | null;
  completed: boolean;
  priority: "low" | "medium" | "high";
  time_period: "day" | "week" | "month" | "quarter" | "half_year" | "one_time";
  subject_id: string | null;
  type: "task" | "homework";
  created_at: string;
  updated_at: string;
  user_id: string;
  topic_id: string | null;
}

interface TaskManagementProps {
  subject: Subject;
  onBack: () => void;
}

function TaskManagement({ subject, onBack }: TaskManagementProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterType, setFilterType] = useState<"all" | "task" | "homework">("all");
  const [taskFormData, setTaskFormData] = useState<{
    title: string;
    description: string;
    due_date: string;
    priority: "low" | "medium" | "high";
    time_period: "day" | "week" | "month" | "quarter" | "half_year" | "one_time";
    type: "task" | "homework";
  }>({
    title: "",
    description: "",
    due_date: "",
    priority: "medium",
    time_period: "one_time",
    type: "task",
  });

  // Fetch tasks for this subject
  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks", user?.id, subject.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .eq("subject_id", subject.id)
        .order("due_date", { nullsFirst: false });
      
      if (error) throw error;
      return data.map(task => ({
        ...task,
        submitted_at: null
      })) as Task[];
    },
    enabled: !!user,
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: typeof taskFormData) => {
      if (!user) throw new Error("No user found");
      
      const { error } = await supabase
        .from("tasks")
        .insert([{
          user_id: user.id,
          title: data.title,
          description: data.description,
          due_date: data.due_date || null,
          priority: data.priority,
          time_period: data.time_period,
          subject_id: subject.id,
          type: data.type,
          submitted_at: null,
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", user?.id, subject.id] });
      setIsTaskDialogOpen(false);
      setTaskFormData({
        title: "",
        description: "",
        due_date: "",
        priority: "medium",
        time_period: "one_time",
        type: "task",
      });
      toast({ title: "Success", description: "Task created successfully" });
    },
    onError: (error) => {
      console.error("Error creating task:", error);
      toast({ 
        title: "Error", 
        description: "Failed to create task. Please try again.",
        variant: "destructive"
      });
    },
  });

  const toggleTaskMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase
        .from("tasks")
        .update({ completed })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", user?.id, subject.id] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", user?.id, subject.id] });
      toast({ title: "Success", description: "Task deleted successfully" });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async (task: Task) => {
      const { error } = await supabase
        .from("tasks")
        .update({
          title: task.title,
          description: task.description,
          due_date: task.due_date,
          priority: task.priority,
          time_period: task.time_period,
          type: task.type,
        })
        .eq("id", task.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", user?.id, subject.id] });
      setIsEditDialogOpen(false);
      setEditingTask(null);
      toast({ title: "Success", description: "Task updated successfully" });
    },
    onError: (error) => {
      console.error("Error updating task:", error);
      toast({ 
        title: "Error", 
        description: "Failed to update task. Please try again.",
        variant: "destructive"
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (taskFormData.title) {
      createTaskMutation.mutate(taskFormData);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "task": return "bg-blue-100 text-blue-800";
      case "homework": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Filter tasks based on selected type
  const filteredTasks = tasks.filter(task => {
    if (filterType === "all") return true;
    return task.type === filterType;
  });

  return (
    <div className="space-y-6">
      {/* Create Task Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center sm:gap-4 gap-2">
            <Button variant="ghost" size="sm" onClick={onBack} className="px-2 sm:px-3">
              <ArrowLeft className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Back to Subjects</span>
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                Task Management
              </CardTitle>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex items-center gap-1 border rounded-lg p-1">
                  <Button
                    variant={filterType === "all" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setFilterType("all")}
                    className="text-xs sm:text-sm px-2 sm:px-3"
                  >
                    All
                  </Button>
                  <Button
                    variant={filterType === "task" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setFilterType("task")}
                    className="text-xs sm:text-sm px-2 sm:px-3"
                  >
                    Tasks
                  </Button>
                  <Button
                    variant={filterType === "homework" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setFilterType("homework")}
                    className="text-xs sm:text-sm px-2 sm:px-3"
                  >
                    <span className="hidden sm:inline">Homework</span>
                    <span className="sm:hidden">HW</span>
                  </Button>
                </div>
                <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full sm:w-auto">
                      <Plus className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Create Task</span>
                      <span className="sm:hidden">Create</span>
                    </Button>
                  </DialogTrigger>
                <DialogContent className="w-[95vw] sm:w-full max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-base sm:text-lg">Create New Task - {subject.name}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Type *</Label>
                    <Select value={taskFormData.type} onValueChange={(value: "task" | "homework") => 
                      setTaskFormData(prev => ({ ...prev, type: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="task">Task</SelectItem>
                        <SelectItem value="homework">Homework</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={taskFormData.title}
                      onChange={(e) => setTaskFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter title"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={taskFormData.description}
                      onChange={(e) => setTaskFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter description"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="due_date">Due Date</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={taskFormData.due_date}
                      onChange={(e) => setTaskFormData(prev => ({ ...prev, due_date: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="time_period">Frequency</Label>
                    <Select value={taskFormData.time_period} onValueChange={(value: "day" | "week" | "month" | "quarter" | "half_year" | "one_time") => 
                      setTaskFormData(prev => ({ ...prev, time_period: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">Daily</SelectItem>
                        <SelectItem value="week">Weekly</SelectItem>
                        <SelectItem value="month">Monthly</SelectItem>
                        <SelectItem value="quarter">Quarterly</SelectItem>
                        <SelectItem value="half_year">Half Year</SelectItem>
                        <SelectItem value="one_time">One Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {taskFormData.type === "task" && (
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select value={taskFormData.priority} onValueChange={(value: "low" | "medium" | "high") => 
                        setTaskFormData(prev => ({ ...prev, priority: value }))
                      }>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={subject.name}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 pt-4">
                    <Button type="submit" disabled={createTaskMutation.isPending} className="flex-1">
                      {createTaskMutation.isPending ? "Creating..." : "Create Task"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsTaskDialogOpen(false)} className="sm:w-auto">
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            
            {/* Edit Task Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="w-[95vw] sm:w-full max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-base sm:text-lg">Edit Task - {subject.name}</DialogTitle>
                </DialogHeader>
                {editingTask && (
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (editingTask.title) {
                      updateTaskMutation.mutate(editingTask);
                    }
                  }} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-type">Type *</Label>
                      <Select value={editingTask.type} onValueChange={(value: "task" | "homework") => setEditingTask(prev => prev ? { ...prev, type: value } : null)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="task">Task</SelectItem>
                          <SelectItem value="homework">Homework</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-title">Title *</Label>
                      <Input
                        id="edit-title"
                        value={editingTask.title}
                        onChange={(e) => setEditingTask(prev => prev ? { ...prev, title: e.target.value } : null)}
                        placeholder="Enter title"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-description">Description</Label>
                      <Textarea
                        id="edit-description"
                        value={editingTask.description}
                        onChange={(e) => setEditingTask(prev => prev ? { ...prev, description: e.target.value } : null)}
                        placeholder="Enter description"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-due-date">Due Date</Label>
                      <Input
                        id="edit-due-date"
                        type="date"
                        value={editingTask.due_date || ""}
                        onChange={(e) => setEditingTask(prev => prev ? { ...prev, due_date: e.target.value } : null)}
                      />
                    </div>

                    <div className="space-y-2">
                       <Label htmlFor="edit-time-period">Frequency</Label>
                       <Select value={editingTask.time_period} onValueChange={(value: "day" | "week" | "month" | "quarter" | "half_year" | "one_time") => setEditingTask(prev => prev ? { ...prev, time_period: value } : null)}>
                         <SelectTrigger>
                           <SelectValue />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="day">Daily</SelectItem>
                           <SelectItem value="week">Weekly</SelectItem>
                           <SelectItem value="month">Monthly</SelectItem>
                           <SelectItem value="quarter">Quarterly</SelectItem>
                           <SelectItem value="half_year">Half Year</SelectItem>
                           <SelectItem value="one_time">One Time</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>

                    {editingTask.type === "task" && (
                      <div className="space-y-2">
                        <Label htmlFor="edit-priority">Priority</Label>
                        <Select value={editingTask.priority} onValueChange={(value: "low" | "medium" | "high") => setEditingTask(prev => prev ? { ...prev, priority: value } : null)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="edit-subject">Subject</Label>
                      <Input
                        id="edit-subject"
                        value={subject.name}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 pt-4">
                      <Button type="submit" disabled={updateTaskMutation.isPending} className="flex-1">
                        {updateTaskMutation.isPending ? "Updating..." : "Update Task"}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} className="sm:w-auto">
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </DialogContent>
            </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTasks.length > 0 ? (
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-3 sm:p-4 rounded-lg border ${task.completed ? 'bg-muted/50' : 'bg-background'}`}
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={(e) => toggleTaskMutation.mutate({
                        id: task.id,
                        completed: e.target.checked
                      })}
                      className="mt-1 rounded"
                    />
                    <div className="flex-1 space-y-1 sm:space-y-2 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <h4 className={`font-medium text-sm sm:text-base truncate ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </h4>
                        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                          <Badge className={`text-xs ${getTypeColor(task.type)}`}>
                            {task.type === 'task' ? 'Task' : 'HW'}
                          </Badge>
                          <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                          <Badge variant="outline" className="text-xs hidden sm:inline-flex">
                            {task.priority}
                          </Badge>
                          <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
                            {task.time_period === 'one_time' ? 'One Time' : task.time_period}
                          </Badge>
                        </div>
                      </div>
                      
                      {task.description && (
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{task.description}</p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div></div>
                        {task.due_date && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span className="hidden sm:inline">Due: </span>
                            {format(new Date(task.due_date), "MMM dd")}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingTask(task);
                          setIsEditDialogOpen(true);
                        }}
                        className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteTaskMutation.mutate(task.id)}
                        className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">
                {filterType === "all" ? "No Tasks Yet" : 
                 filterType === "task" ? "No Tasks" : "No Homework"}
              </h3>
              <p className="mb-4">
                {filterType === "all" ? "Create and track tasks and homework for this subject" :
                 filterType === "task" ? "No tasks found. Create a new task or change the filter." :
                 "No homework found. Create new homework or change the filter."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function SubjectDetail({ subject, onBack, t }: SubjectDetailProps) {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('overview');
  const [isGradeDialogOpen, setIsGradeDialogOpen] = useState(false);

  // Fetch tasks for this subject
  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks", user?.id, subject.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          id,
          title,
          description,
          due_date,
          completed,
          priority,
          time_period,
          subject_id,
          type,
          created_at,
          updated_at,
          user_id,
          topic_id
        `)
        .eq("subject_id", subject.id)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Task[];
    },
    enabled: !!user,
  });

  // Fetch grades for this subject
  const { data: grades = [] } = useGrades(subject.id);

  // Calculate statistics
  const totalAssignments = tasks.length;
  const completedTasks = tasks.filter(task => task.completed).length;
  const upcomingDeadlines = tasks.filter(task => {
    if (!task.due_date) return false;
    const dueDate = new Date(task.due_date);
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return dueDate >= now && dueDate <= oneWeekFromNow;
  }).length;
  const gradeEntries = grades.length;

  // Get recent activity (last 5 items)
  const recentActivity = [
    ...tasks.slice(0, 3).map(task => ({
      id: task.id,
      type: 'task' as const,
      title: task.title,
      date: task.created_at,
      status: task.completed ? 'completed' : 'pending'
    })),
    ...grades.slice(0, 2).map(grade => ({
      id: grade.id,
      type: 'grade' as const,
      title: grade.title,
      date: grade.date_received,
      status: 'added'
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Please log in to view subject details.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-4 md:mt-6">
      {/* Header */}
      <div className="flex items-center justify-between sm:gap-4 gap-2">
        <Button variant="ghost" size="sm" onClick={onBack} className="px-2 sm:px-3">
          <ArrowLeft className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Back to Subjects</span>
        </Button>
        {isMobile && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsGradeDialogOpen(true)}
            className="px-2"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Subject Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full">
              <div className="p-3 bg-primary/10 rounded-lg">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                {isMobile ? (
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl md:text-2xl truncate">{subject.name}</CardTitle>
                    {subject.room && (
                      <span className="text-sm text-muted-foreground truncate">
                        Room: {subject.room}
                      </span>
                    )}
                  </div>
                ) : (
                  <CardTitle className="text-xl md:text-2xl truncate">{subject.name}</CardTitle>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge variant="secondary">
                    {subject.credits} Credits
                  </Badge>
                  {subject.teacher && (
                    <span className="text-sm text-muted-foreground truncate">
                      Teacher: {subject.teacher}
                    </span>
                  )}
                  {!isMobile && subject.room && (
                    <span className="text-sm text-muted-foreground truncate">
                      Room: {subject.room}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {!isMobile && (
              <Button variant="outline" size="sm" className="w-full md:w-auto justify-center">
                <Settings className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Settings</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
            {/* Current Grade */}
            <div className="text-center p-3 md:p-4 bg-blue-50 rounded-lg">
              <div className={`text-lg md:text-2xl font-bold ${subject.current_grade ? getGradeColorClass(subject.current_grade).split(' ')[0] : 'text-blue-700'}`}>
                {subject.current_grade ? formatGrade(subject.current_grade) : 'N/A'}
              </div>
              <div className="text-xs md:text-sm text-blue-600">Aktuelle Note</div>
              {subject.current_grade && (
                <div className="text-xs text-blue-500 mt-1">
                  {getGermanGradeName(subject.current_grade)}
                </div>
              )}
            </div>
            
            {/* Target Grade */}
            <div className="text-center p-3 md:p-4 bg-green-50 rounded-lg">
              <div className={`text-lg md:text-2xl font-bold ${subject.target_grade ? getGradeColorClass(subject.target_grade).split(' ')[0] : 'text-green-700'}`}>
                {subject.target_grade ? formatGrade(subject.target_grade) : 'N/A'}
              </div>
              <div className="text-xs md:text-sm text-green-600">Zielnote</div>
              {subject.target_grade && (
                <div className="text-xs text-green-500 mt-1">
                  {getGermanGradeName(subject.target_grade)}
                </div>
              )}
            </div>
            
            {/* Progress */}
            <div className="text-center p-3 md:p-4 bg-purple-50 rounded-lg">
              <div className="text-lg md:text-2xl font-bold text-purple-700">
                {subject.current_grade && subject.target_grade 
                  ? Math.round(Math.max(0, Math.min(100, ((6 - subject.current_grade) / (6 - subject.target_grade)) * 100)))
                  : 0}%
              </div>
              <div className="text-xs md:text-sm text-purple-600">Fortschritt zum Ziel</div>
              {subject.current_grade && subject.target_grade && (
                <div className="text-xs text-purple-500 mt-1">
                  {subject.current_grade <= subject.target_grade ? 'Ziel erreicht!' : 'Verbesserung nötig'}
                </div>
              )}
            </div>
          </div>
          

        </CardContent>
      </Card>

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className={`${isMobile ? 'overflow-x-auto' : ''}`}>
          <TabsList className={`${isMobile ? 'flex w-max min-w-full' : 'grid w-full grid-cols-3 md:grid-cols-5'}`}>
            <TabsTrigger value="overview" className={`flex items-center gap-1 md:gap-2 px-2 md:px-3 ${isMobile ? 'flex-shrink-0' : ''}`}>
              <BarChart3 className="h-4 w-4" />
              <span className={`${isMobile ? 'text-xs' : 'hidden sm:inline text-xs md:text-sm'}`}>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="curriculum" className={`flex items-center gap-1 md:gap-2 px-2 md:px-3 ${isMobile ? 'flex-shrink-0' : ''}`}>
              <Target className="h-4 w-4" />
              <span className={`${isMobile ? 'text-xs' : 'hidden sm:inline text-xs md:text-sm'}`}>Curriculum</span>
            </TabsTrigger>
            <TabsTrigger value="grades" className={`flex items-center gap-1 md:gap-2 px-2 md:px-3 ${isMobile ? 'flex-shrink-0' : ''}`}>
              <TrendingUp className="h-4 w-4" />
              <span className={`${isMobile ? 'text-xs' : 'hidden sm:inline text-xs md:text-sm'}`}>Noten</span>
            </TabsTrigger>
            <TabsTrigger value="tasks" className={`flex items-center gap-1 md:gap-2 px-2 md:px-3 ${isMobile ? 'flex-shrink-0' : ''}`}>
              <FileText className="h-4 w-4" />
              <span className={`${isMobile ? 'text-xs' : 'hidden sm:inline text-xs md:text-sm'}`}>Tasks</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className={`flex items-center gap-1 md:gap-2 px-2 md:px-3 ${isMobile ? 'flex-shrink-0' : ''}`}>
              <BarChart3 className="h-4 w-4" />
              <span className={`${isMobile ? 'text-xs' : 'hidden sm:inline text-xs md:text-sm'}`}>Analytics</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Quick Stats */}
            <Card className="mt-4 md:mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Assignments</span>
                  <Badge variant="outline">{totalAssignments}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Completed Tasks</span>
                  <Badge variant="outline">{completedTasks}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Upcoming Deadlines</span>
                  <Badge variant="outline">{upcomingDeadlines}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Noten Einträge</span>
                  <Badge variant="outline">{gradeEntries}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="mt-4 md:mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentActivity.length > 0 ? (
                  <div className="space-y-3">
                    {recentActivity.map((activity) => (
                      <div key={`${activity.type}-${activity.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                        <div className={`p-1.5 rounded-full ${
                          activity.type === 'task' 
                            ? activity.status === 'completed' 
                              ? 'bg-green-100 text-green-600' 
                              : 'bg-blue-100 text-blue-600'
                            : 'bg-purple-100 text-purple-600'
                        }`}>
                          {activity.type === 'task' ? (
                            activity.status === 'completed' ? (
                              <CheckSquare className="h-3 w-3" />
                            ) : (
                              <FileText className="h-3 w-3" />
                            )
                          ) : (
                            <TrendingUp className="h-3 w-3" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{activity.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {activity.type === 'task' 
                              ? activity.status === 'completed' 
                                ? 'Task completed' 
                                : 'Task created'
                              : 'Note hinzugefügt'
                            } • {format(new Date(activity.date), "MMM dd")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No recent activity</p>
                    <p className="text-sm">Fügen Sie Noten und Aufgaben hinzu, um hier Aktivitäten zu sehen</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-3'}`}>
                <Button 
                  variant="outline" 
                  className={`${isMobile ? 'h-12 flex-row justify-start gap-3' : 'h-16 md:h-20 flex-col gap-2'}`}
                  onClick={() => setActiveTab('tasks')}
                >
                  <CheckSquare className="h-5 w-5" />
                  <span className="text-sm">Add Task</span>
                </Button>
                <Button 
                  variant="outline" 
                  className={`${isMobile ? 'h-12 flex-row justify-start gap-3' : 'h-16 md:h-20 flex-col gap-2'}`}
                  onClick={() => setActiveTab('grades')}
                >
                  <BarChart3 className="h-5 w-5" />
                  <span className="text-sm">Note hinzufügen</span>
                </Button>
                <Button 
                  variant="outline" 
                  className={`${isMobile ? 'h-12 flex-row justify-start gap-3' : 'h-16 md:h-20 flex-col gap-2'}`}
                  onClick={() => setActiveTab('curriculum')}
                >
                  <BookOpen className="h-5 w-5" />
                  <span className="text-sm">View Curriculum</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="curriculum" className="space-y-6">
          <CurriculumDashboard 
            subjectId={subject.id} 
            userId={user.id}
          />
        </TabsContent>

        <TabsContent value="grades" className="space-y-6">
          <GradeManagement subject={subject} />
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          <TaskManagement subject={subject} onBack={onBack} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Performance Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Award className="h-4 w-4" />
                  Current Average
                </CardTitle>
              </CardHeader>
              <CardContent>
                {grades.length > 0 ? (
                  <div className="space-y-2">
                    <div className={`text-2xl font-bold ${getGradeColorClass(calculateSubjectAverage(grades) || 0)}`}>
                      {calculateSubjectAverage(grades) ? formatGrade(calculateSubjectAverage(grades)!) : 'N/A'}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {calculateSubjectAverage(grades) ? getGermanGradeName(calculateSubjectAverage(grades)!) : 'Noch keine Noten'}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">Keine Noten verfügbar</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4" />
                  Noten Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                {grades.length >= 2 ? (
                  <div className="space-y-2">
                    {(() => {
                      const sortedGrades = [...grades].sort((a, b) => new Date(a.date_received).getTime() - new Date(b.date_received).getTime());
                      const firstGrade = sortedGrades[0]?.grade || 0;
                      const lastGrade = sortedGrades[sortedGrades.length - 1]?.grade || 0;
                      const trend = lastGrade < firstGrade ? 'improving' : lastGrade > firstGrade ? 'declining' : 'stable';
                      const trendColor = trend === 'improving' ? 'text-green-600' : trend === 'declining' ? 'text-red-600' : 'text-blue-600';
                      const trendIcon = trend === 'improving' ? '↗️' : trend === 'declining' ? '↘️' : '→';
                      
                      return (
                        <div className={`text-lg font-semibold ${trendColor}`}>
                          {trendIcon} {trend === 'improving' ? 'Improving' : trend === 'declining' ? 'Declining' : 'Stable'}
                        </div>
                      );
                    })()}
                    <p className="text-sm text-muted-foreground">
                      Basierend auf {grades.length} Noten
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">Benötigt 2+ Noten für Trend</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Activity className="h-4 w-4" />
                  Performance Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {grades.length > 0 ? (
                  <div className="space-y-2">
                    {(() => {
                      const average = calculateSubjectAverage(grades) || 0;
                      const status = average <= 2.0 ? 'excellent' : average <= 3.0 ? 'good' : average <= 4.0 ? 'satisfactory' : 'needs_improvement';
                      const statusColor = status === 'excellent' ? 'text-green-600' : status === 'good' ? 'text-blue-600' : status === 'satisfactory' ? 'text-yellow-600' : 'text-red-600';
                      const statusText = status === 'excellent' ? 'Excellent' : status === 'good' ? 'Good' : status === 'satisfactory' ? 'Satisfactory' : 'Needs Improvement';
                      
                      return (
                        <div className={`text-lg font-semibold ${statusColor}`}>
                          {statusText}
                        </div>
                      );
                    })()}
                    <p className="text-sm text-muted-foreground">
                      Keep up the good work!
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">No data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Grade Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Noten Verteilung
              </CardTitle>
            </CardHeader>
            <CardContent>
              {grades.length > 0 ? (
                <div className="space-y-4">
                  {(() => {
                    const gradeRanges = {
                      'Sehr gut (1.0-1.5)': grades.filter(g => g.grade >= 1.0 && g.grade <= 1.5).length,
                      'Gut (1.6-2.5)': grades.filter(g => g.grade >= 1.6 && g.grade <= 2.5).length,
                      'Befriedigend (2.6-3.5)': grades.filter(g => g.grade >= 2.6 && g.grade <= 3.5).length,
                      'Ausreichend (3.6-4.0)': grades.filter(g => g.grade >= 3.6 && g.grade <= 4.0).length,
                      'Mangelhaft (4.1-5.0)': grades.filter(g => g.grade >= 4.1 && g.grade <= 5.0).length,
                      'Ungenügend (5.1-6.0)': grades.filter(g => g.grade >= 5.1 && g.grade <= 6.0).length
                    } as Record<string, number>;
                    
                    return Object.entries(gradeRanges).map(([range, count]) => (
                      <div key={range} className={`${isMobile ? 'space-y-2' : 'flex items-center justify-between'}`}>
                        <span className="text-sm font-medium">{range}</span>
                        <div className={`flex items-center gap-2 ${isMobile ? 'justify-between' : ''}`}>
                          <div className={`${isMobile ? 'flex-1' : 'w-32'} bg-gray-200 rounded-full h-2`}>
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${grades.length > 0 ? (count / grades.length) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground w-8">{count}</span>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Keine Noten für Verteilungsanalyse verfügbar</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Aktuelle Leistung (Letzte 5 Noten)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {grades.length > 0 ? (
                <div className="space-y-3">
                  {grades
                    .sort((a, b) => new Date(b.date_received).getTime() - new Date(a.date_received).getTime())
                    .slice(0, 5)
                    .map((grade, index) => (
                      <div key={grade.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 border rounded-lg">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium">{grade.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(grade.date_received).toLocaleDateString('de-DE')} • {grade.type}
                          </p>
                        </div>
                        <div className={`text-lg font-bold px-3 py-1 rounded ${getGradeColorClass(grade.grade)} sm:mt-0 mt-1`}>
                          {formatGrade(grade.grade)}
                        </div>
                      </div>
                    ))
                  }
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Keine aktuellen Noten anzuzeigen</p>
                  <p className="text-sm">Fügen Sie Noten hinzu, um die Leistungshistorie zu sehen</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Performance Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              {grades.length > 0 ? (
                <div className="space-y-4">
                  {(() => {
                    const average = calculateSubjectAverage(grades) || 0;
                    const bestGrade = Math.min(...grades.map(g => g.grade));
                    const worstGrade = Math.max(...grades.map(g => g.grade));
                    const gradeRange = worstGrade - bestGrade;
                    
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h4 className="font-semibold text-green-600">Strengths</h4>
                          <ul className="text-sm space-y-1">
                            <li>• Best grade: {formatGrade(bestGrade)} ({getGermanGradeName(bestGrade)})</li>
                            {average <= 2.5 && <li>• Consistently good performance</li>}
                            {gradeRange <= 1.0 && <li>• Stable performance across assessments</li>}
                            <li>• {grades.length} assessment{grades.length > 1 ? 's' : ''} completed</li>
                          </ul>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-semibold text-blue-600">Areas for Improvement</h4>
                          <ul className="text-sm space-y-1">
                            {average > 3.0 && <li>• Focus on improving overall average</li>}
                            {gradeRange > 2.0 && <li>• Work on consistency across assessments</li>}
                            {worstGrade > 4.0 && <li>• Address challenging topics (worst: {formatGrade(worstGrade)})</li>}
                            <li>• Continue regular study habits</li>
                          </ul>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No performance data available</p>
                  <p className="text-sm">Fügen Sie Noten hinzu, um personalisierte Einblicke zu erhalten</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}