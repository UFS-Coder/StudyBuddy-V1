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
  Clock
} from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { CurriculumDashboard } from '@/components/curriculum/curriculum-dashboard';
import { GradeInput } from '@/components/grades/grade-input';
import { useAuth } from '@/hooks/use-auth';
import { useGrades } from '@/hooks/use-grades';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatGrade, getGradeColorClass, getGermanGradeName } from '@/lib/grade-calculations';
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
    <div className="space-y-6">
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
  time_period: "day" | "week" | "month" | "quarter" | "half_year";
  subject_id: string | null;
}

interface AssignmentManagementProps {
  subject: Subject;
}

function AssignmentManagement({ subject }: AssignmentManagementProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [taskFormData, setTaskFormData] = useState<{
    title: string;
    description: string;
    due_date: string;
    priority: "low" | "medium" | "high";
    time_period: "day" | "week" | "month" | "quarter" | "half_year";
  }>({
    title: "",
    description: "",
    due_date: "",
    priority: "medium",
    time_period: "week",
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
      return data as Task[];
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
        time_period: "week",
      });
      toast({ title: "Success", description: "Task created successfully" });
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

  return (
    <div className="space-y-6">
      {/* Create Task Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Assignments & Tasks
            </CardTitle>
            <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Task
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Task - {subject.name}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Task Title *</Label>
                    <Input
                      id="title"
                      value={taskFormData.title}
                      onChange={(e) => setTaskFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter task title"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={taskFormData.description}
                      onChange={(e) => setTaskFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter task description"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
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
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="time_period">Time Period</Label>
                    <Select value={taskFormData.time_period} onValueChange={(value: "day" | "week" | "month" | "quarter" | "half_year") => 
                      setTaskFormData(prev => ({ ...prev, time_period: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select time period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">Daily</SelectItem>
                        <SelectItem value="week">Weekly</SelectItem>
                        <SelectItem value="month">Monthly</SelectItem>
                        <SelectItem value="quarter">Quarterly</SelectItem>
                        <SelectItem value="half_year">Half Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" disabled={createTaskMutation.isPending} className="flex-1">
                      {createTaskMutation.isPending ? "Creating..." : "Create Task"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsTaskDialogOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {tasks.length > 0 ? (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-4 rounded-lg border ${task.completed ? 'bg-muted/50' : 'bg-background'}`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={(e) => toggleTaskMutation.mutate({
                        id: task.id,
                        completed: e.target.checked
                      })}
                      className="mt-1 rounded"
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </h4>
                        <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                        <Badge variant="outline" className="text-xs">
                          {task.priority}
                        </Badge>
                      </div>
                      
                      {task.description && (
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs">
                          {task.time_period}
                        </Badge>
                        {task.due_date && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Due: {format(new Date(task.due_date), "MMM dd, yyyy")}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Tasks Yet</h3>
              <p className="mb-4">Create and track assignments for this subject</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function SubjectDetail({ subject, onBack, t }: SubjectDetailProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isGradeDialogOpen, setIsGradeDialogOpen] = useState(false);

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Please log in to view subject details.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Subjects
        </Button>
      </div>

      {/* Subject Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">{subject.name}</CardTitle>
                <div className="flex items-center gap-3 mt-2">
                  <Badge variant="secondary">
                    {subject.credits} Credits
                  </Badge>
                  {subject.teacher && (
                    <span className="text-muted-foreground">
                      Teacher: {subject.teacher}
                    </span>
                  )}
                  {subject.room && (
                    <span className="text-muted-foreground">
                      Room: {subject.room}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Current Grade */}
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className={`text-2xl font-bold ${subject.current_grade ? getGradeColorClass(subject.current_grade).split(' ')[0] : 'text-blue-700'}`}>
                {subject.current_grade ? formatGrade(subject.current_grade) : 'N/A'}
              </div>
              <div className="text-sm text-blue-600">Aktuelle Note</div>
              {subject.current_grade && (
                <div className="text-xs text-blue-500 mt-1">
                  {getGermanGradeName(subject.current_grade)}
                </div>
              )}
            </div>
            
            {/* Target Grade */}
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className={`text-2xl font-bold ${subject.target_grade ? getGradeColorClass(subject.target_grade).split(' ')[0] : 'text-green-700'}`}>
                {subject.target_grade ? formatGrade(subject.target_grade) : 'N/A'}
              </div>
              <div className="text-sm text-green-600">Zielnote</div>
              {subject.target_grade && (
                <div className="text-xs text-green-500 mt-1">
                  {getGermanGradeName(subject.target_grade)}
                </div>
              )}
            </div>
            
            {/* Progress */}
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-700">
                {subject.current_grade && subject.target_grade 
                  ? Math.round(Math.max(0, Math.min(100, ((6 - subject.current_grade) / (6 - subject.target_grade)) * 100)))
                  : 0}%
              </div>
              <div className="text-sm text-purple-600">Fortschritt zum Ziel</div>
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="curriculum" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Curriculum</span>
          </TabsTrigger>
          <TabsTrigger value="grades" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Grades</span>
          </TabsTrigger>
          <TabsTrigger value="assignments" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Tasks</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Assignments</span>
                  <Badge variant="outline">0</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Completed Tasks</span>
                  <Badge variant="outline">0</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Upcoming Deadlines</span>
                  <Badge variant="outline">0</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Grade Entries</span>
                  <Badge variant="outline">0</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No recent activity</p>
                  <p className="text-sm">Start adding grades and assignments to see activity here</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Dialog open={isGradeDialogOpen} onOpenChange={setIsGradeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="h-20 flex-col gap-2">
                      <Plus className="h-6 w-6" />
                      <span className="text-sm">Add Grade</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Grade - {subject.name}</DialogTitle>
                    </DialogHeader>
                    <GradeInput 
                      subjectId={subject.id}
                      subjectName={subject.name}
                      onGradeAdded={() => setIsGradeDialogOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2"
                  onClick={() => setActiveTab('assignments')}
                >
                  <FileText className="h-6 w-6" />
                  <span className="text-sm">New Assignment</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2"
                  onClick={() => setActiveTab('assignments')}
                >
                  <Calendar className="h-6 w-6" />
                  <span className="text-sm">Schedule Test</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2"
                  onClick={() => setActiveTab('grades')}
                >
                  <Users className="h-6 w-6" />
                  <span className="text-sm">Log Participation</span>
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

        <TabsContent value="assignments" className="space-y-6">
          <AssignmentManagement subject={subject} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Analytics Coming Soon</h3>
                <p className="mb-4">Detailed performance analytics and insights</p>
                <p className="text-sm">Add more grades and assignments to see analytics</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}