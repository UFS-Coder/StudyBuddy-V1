import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, CheckSquare, Clock, Calendar, FileText, Filter, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useSubjects } from "@/hooks/use-subjects";
import { useAuth } from "@/hooks/use-auth";
import { useCanEdit } from "@/hooks/use-parent-permissions";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

interface Task {
  id: string;
  title: string;
  description: string;
  due_date: string | null;
  completed: boolean;
  priority: "low" | "medium" | "high";
  time_period: "day" | "week" | "month" | "quarter" | "half_year" | "one_time";
  subject_id: string | null;
  topic_id: string | null;
  type: "task" | "homework";
  submitted_at: string | null;
}

const TIME_PERIODS = [
  { value: "day", label: "Daily" },
  { value: "week", label: "Weekly" },
  { value: "month", label: "Monthly" },
  { value: "quarter", label: "Quarterly" },
  { value: "half_year", label: "Half Year" },
  { value: "one_time", label: "One-Time" },
];

const PRIORITIES = [
  { value: "low", label: "Low", color: "bg-green-500" },
  { value: "medium", label: "Medium", color: "bg-yellow-500" },
  { value: "high", label: "High", color: "bg-red-500" },
];

const TASK_TYPES = [
  { value: "task", label: "Task" },
  { value: "homework", label: "Homework" },
];

export const UnifiedTaskManager = () => {
  const { user } = useAuth();
  const { data: subjects = [] } = useSubjects();
  const canEdit = useCanEdit();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterType, setFilterType] = useState<"all" | "task" | "homework">("all");
  const [newTask, setNewTask] = useState<{
    title: string;
    description: string;
    due_date: string;
    priority: "low" | "medium" | "high";
    time_period: "day" | "week" | "month" | "quarter" | "half_year" | "one_time";
    subject_id: string;
    type: "task" | "homework";
  }>({
    title: "",
    description: "",
    due_date: "",
    priority: "medium",
    time_period: "day",
    subject_id: "",
    type: "task"
  });

  // Fetch tasks
  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data.map(task => ({
        ...task,
        type: "task" as const,
        submitted_at: null,
        priority: task.priority as "low" | "medium" | "high",
        time_period: task.time_period as "day" | "week" | "month" | "quarter" | "half_year" | "one_time"
      })) as Task[];
    },
    enabled: !!user?.id,
  });

  // Fetch homework from tasks table (homework table was unified into tasks)
  const { data: homework = [] } = useQuery({
    queryKey: ["homework", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .eq("type", "homework")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data.map(hw => ({
        ...hw,
        type: "homework" as const,
        priority: hw.priority || "medium" as const,
        topic_id: hw.topic_id || null,
        time_period: hw.time_period as "day" | "week" | "month" | "quarter" | "half_year" | "one_time" || "week",
        submitted_at: null // Will be added when database migration runs
      })) as Task[];
    },
    enabled: !!user?.id,
  });

  // Combine tasks and homework
  const allTasks = [...tasks, ...homework];
  
  // Filter tasks based on type
  const filteredTasks = filterType === "all" ? allTasks : allTasks.filter(task => task.type === filterType);

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: typeof newTask) => {
      if (!user?.id) throw new Error("User not authenticated");
      
      // Always use tasks table since homework table was unified into tasks
      const { data, error } = await supabase
        .from("tasks")
        .insert([{
          ...taskData,
          user_id: user.id,
          completed: false,
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["homework"] });
      setIsDialogOpen(false);
      setNewTask({
        title: "",
        description: "",
        due_date: "",
        priority: "medium",
        time_period: "day",
        subject_id: "",
        type: "task"
      });
      toast({ title: "Success", description: `${newTask.type === "task" ? "Task" : "Homework"} created successfully` });
    },
    onError: (error) => {
      toast({ title: "Error", description: `Failed to create ${newTask.type}`, variant: "destructive" });
    },
  });

  // Toggle task completion
  const toggleTaskMutation = useMutation({
    mutationFn: async ({ id, completed, type }: { id: string; completed: boolean; type: "task" | "homework" }) => {
      // Always use tasks table since homework table was unified into tasks
      const { error } = await supabase
        .from("tasks")
        .update({ completed })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["homework"] });
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      // Only use tasks table since homework table was unified into tasks
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["homework"] });
      toast({ title: "Success", description: "Item deleted successfully" });
    },
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async (taskData: Task) => {
      // Always use tasks table since homework table was unified into tasks
      const { error } = await supabase
        .from("tasks")
        .update(taskData)
        .eq("id", taskData.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["homework"] });
      setIsEditDialogOpen(false);
      setEditingTask(null);
      toast({ title: "Success", description: "Item updated successfully" });
    },
  });

  const getPriorityColor = (priority: string) => {
    const priorityObj = PRIORITIES.find(p => p.value === priority);
    return priorityObj?.color || "bg-gray-500";
  };

  const getTypeColor = (type: string) => {
    return type === "task" ? "text-blue-600" : "text-purple-600";
  };

  const getSubjectName = (subjectId: string | null) => {
    if (!subjectId) return "No Subject";
    const subject = subjects.find(s => s.id === subjectId);
    return subject?.name || "Unknown Subject";
  };

  const getSubjectColor = (subjectId: string | null) => {
    if (!subjectId) return "#gray";
    const subject = subjects.find(s => s.id === subjectId);
    return subject?.color || "#gray";
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const getEmptyStateMessage = () => {
    if (filterType === "task") return "No tasks yet";
    if (filterType === "homework") return "No homework yet";
    return "No items yet";
  };

  const getEmptyStateDescription = () => {
    if (filterType === "task") return "Create your first task to stay organized";
    if (filterType === "homework") return "Add homework assignments to track your progress";
    return "Create tasks or add homework to get started";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTaskMutation.mutate(newTask);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTask) {
      updateTaskMutation.mutate(editingTask);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Task & Homework Manager</h2>
          <p className="text-muted-foreground">Organize your tasks and homework assignments</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={filterType} onValueChange={(value: "all" | "task" | "homework") => setFilterType(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Items</SelectItem>
              <SelectItem value="task">Tasks Only</SelectItem>
              <SelectItem value="homework">Homework Only</SelectItem>
            </SelectContent>
          </Select>
          {canEdit && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add New
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New {newTask.type === "task" ? "Task" : "Homework"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select value={newTask.type} onValueChange={(value) => setNewTask({ ...newTask, type: value as "task" | "homework" })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TASK_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      placeholder="Enter title"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                      placeholder="Enter description"
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="due_date">Due Date</Label>
                      <Input
                        id="due_date"
                        type="date"
                        value={newTask.due_date}
                        onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="time_period">Frequency</Label>
                      <Select value={newTask.time_period} onValueChange={(value: any) => setNewTask({ ...newTask, time_period: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_PERIODS.map((period) => (
                            <SelectItem key={period.value} value={period.value}>
                              {period.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {newTask.type === "task" && (
                      <div className="space-y-2">
                        <Label htmlFor="priority">Priority</Label>
                        <Select value={newTask.priority} onValueChange={(value: any) => setNewTask({ ...newTask, priority: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PRIORITIES.map((priority) => (
                              <SelectItem key={priority.value} value={priority.value}>
                                {priority.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Select value={newTask.subject_id} onValueChange={(value) => setNewTask({ ...newTask, subject_id: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map((subject) => (
                            <SelectItem key={subject.id} value={subject.id}>
                              {subject.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button type="submit" disabled={createTaskMutation.isPending}>
                      {createTaskMutation.isPending ? "Creating..." : `Create ${newTask.type === "task" ? "Task" : "Homework"}`}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            All Tasks & Homework
            <Badge variant="secondary">{filteredTasks.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredTasks.map((task) => {
            const timePeriod = TIME_PERIODS.find(p => p.value === task.time_period);
            return (
              <div
                key={task.id}
                className={`p-3 rounded-lg border ${task.completed ? 'bg-muted/50' : 'bg-background'}`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={(e) => toggleTaskMutation.mutate({
                      id: task.id,
                      completed: e.target.checked,
                      type: task.type
                    })}
                    className="mt-1 rounded"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        {timePeriod?.label || 'Unknown'}
                      </Badge>
                      <Badge className={getTypeColor(task.type)} variant="secondary">
                        {task.type === 'task' ? 'Task' : 'Homework'}
                      </Badge>
                      {task.type === 'task' && (
                        <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                      )}
                    </div>
                    
                    {task.description && (
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                    )}
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge 
                        variant="outline" 
                        className="text-xs"
                        style={{ borderColor: getSubjectColor(task.subject_id) }}
                      >
                        {getSubjectName(task.subject_id)}
                      </Badge>
                      {task.due_date && (
                        <div className={`flex items-center gap-1 ${
                          isOverdue(task.due_date) && !task.completed ? 'text-red-500' : ''
                        }`}>
                          <Clock className="h-3 w-3" />
                          {format(new Date(task.due_date), "MMM dd")}
                        </div>
                      )}
                    </div>

                    {task.submitted_at && (
                      <div className="text-xs text-green-600">
                        Submitted: {format(new Date(task.submitted_at), "MMM dd, yyyy")}
                      </div>
                    )}
                  </div>
                  
                  {canEdit && (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                        setEditingTask(task as Task);
                        setIsEditDialogOpen(true);
                      }}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteTaskMutation.mutate(task.id)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          
          {filteredTasks.length === 0 && (
            <p className="text-muted-foreground text-center py-8 text-sm">
              {getEmptyStateMessage()}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Edit Task Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit {editingTask?.type === "task" ? "Task" : "Homework"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-type">Type</Label>
              <Select value={editingTask?.type || "task"} onValueChange={(value) => setEditingTask(prev => prev ? {...prev, type: value as "task" | "homework"} : null)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editingTask?.title || ""}
                onChange={(e) => setEditingTask(prev => prev ? {...prev, title: e.target.value} : null)}
                placeholder="Enter title"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editingTask?.description || ""}
                onChange={(e) => setEditingTask(prev => prev ? {...prev, description: e.target.value} : null)}
                placeholder="Enter description"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-due-date">Due Date</Label>
                <Input
                  id="edit-due-date"
                  type="date"
                  value={editingTask?.due_date ? editingTask.due_date.split('T')[0] : ""}
                  onChange={(e) => setEditingTask(prev => prev ? {...prev, due_date: e.target.value} : null)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-time-period">Frequency</Label>
                <Select value={editingTask?.time_period || "day"} onValueChange={(value: any) => setEditingTask(prev => prev ? {...prev, time_period: value} : null)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_PERIODS.map((period) => (
                      <SelectItem key={period.value} value={period.value}>
                        {period.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {editingTask?.type === "task" && (
                <div className="space-y-2">
                  <Label htmlFor="edit-priority">Priority</Label>
                  <Select value={editingTask?.priority || "medium"} onValueChange={(value: any) => setEditingTask(prev => prev ? {...prev, priority: value} : null)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="edit-subject">Subject</Label>
                <Select value={editingTask?.subject_id || ""} onValueChange={(value) => setEditingTask(prev => prev ? {...prev, subject_id: value} : null)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button type="submit" disabled={updateTaskMutation.isPending}>
                {updateTaskMutation.isPending ? "Updating..." : "Update"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
   );
 };