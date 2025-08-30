import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, FileText, Clock, CheckCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useCanEdit } from "@/hooks/use-parent-permissions";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

interface Subject {
  id: string;
  name: string;
  teacher?: string;
  color?: string;
  credits?: number;
}

interface Homework {
  id: string;
  title: string;
  description: string;
  due_date: string;
  completed: boolean;
  submitted_at: string | null;
  time_period: "day" | "week" | "month" | "quarter" | "half_year";
  subject_id: string;
}

interface HomeworkManagementProps {
  subject: Subject;
}

const TIME_PERIODS = [
  { value: "day", label: "Daily" },
  { value: "week", label: "Weekly" },
  { value: "month", label: "Monthly" },
  { value: "quarter", label: "Quarterly" },
  { value: "half_year", label: "Half Year" },
];

export function HomeworkManagement({ subject }: HomeworkManagementProps) {
  const { user } = useAuth();
  const canEdit = useCanEdit();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isHomeworkDialogOpen, setIsHomeworkDialogOpen] = useState(false);
  const [homeworkFormData, setHomeworkFormData] = useState<{
    title: string;
    description: string;
    due_date: string;
    time_period: "day" | "week" | "month" | "quarter" | "half_year";
  }>({
    title: "",
    description: "",
    due_date: "",
    time_period: "week",
  });

  // Fetch homework for this subject
  const { data: homework = [] } = useQuery({
    queryKey: ["homework", user?.id, subject.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("homework")
        .select("*")
        .eq("user_id", user.id)
        .eq("subject_id", subject.id)
        .order("due_date");
      
      if (error) throw error;
      return data as Homework[];
    },
    enabled: !!user,
  });

  const createHomeworkMutation = useMutation({
    mutationFn: async (data: typeof homeworkFormData) => {
      if (!user) throw new Error("No user found");
      
      const { error } = await supabase
        .from("homework")
        .insert([{
          user_id: user.id,
          subject_id: subject.id,
          title: data.title,
          description: data.description,
          due_date: data.due_date,
          time_period: data.time_period,
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homework", user?.id, subject.id] });
      queryClient.invalidateQueries({ queryKey: ["homework", user?.id] });
      setIsHomeworkDialogOpen(false);
      setHomeworkFormData({
        title: "",
        description: "",
        due_date: "",
        time_period: "week",
      });
      toast({ title: "Success", description: "Homework created successfully" });
    },
  });

  const toggleHomeworkMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase
        .from("homework")
        .update({ 
          completed,
          submitted_at: completed ? new Date().toISOString() : null
        })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homework", user?.id, subject.id] });
      queryClient.invalidateQueries({ queryKey: ["homework", user?.id] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (homeworkFormData.title && homeworkFormData.due_date) {
      createHomeworkMutation.mutate(homeworkFormData);
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const getStatusColor = (homework: Homework) => {
    if (homework.completed) return "text-green-600";
    if (isOverdue(homework.due_date)) return "text-red-600";
    return "text-yellow-600";
  };

  const getStatusIcon = (homework: Homework) => {
    if (homework.completed) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (isOverdue(homework.due_date)) return <Clock className="h-4 w-4 text-red-600" />;
    return <Clock className="h-4 w-4 text-yellow-600" />;
  };

  const getPriorityColor = (timePeriod: string) => {
    switch (timePeriod) {
      case "day": return "bg-red-500";
      case "week": return "bg-orange-500";
      case "month": return "bg-yellow-500";
      case "quarter": return "bg-blue-500";
      case "half_year": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Homework Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Homework
            </CardTitle>
            {canEdit && (
              <Dialog open={isHomeworkDialogOpen} onOpenChange={setIsHomeworkDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Homework
                  </Button>
                </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Homework - {subject.name}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Homework Title *</Label>
                    <Input
                      id="title"
                      value={homeworkFormData.title}
                      onChange={(e) => setHomeworkFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter homework title"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={homeworkFormData.description}
                      onChange={(e) => setHomeworkFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter homework description"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="due_date">Due Date *</Label>
                      <Input
                        id="due_date"
                        type="date"
                        value={homeworkFormData.due_date}
                        onChange={(e) => setHomeworkFormData(prev => ({ ...prev, due_date: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="time_period">Time Period</Label>
                      <Select value={homeworkFormData.time_period} onValueChange={(value: "day" | "week" | "month" | "quarter" | "half_year") => 
                        setHomeworkFormData(prev => ({ ...prev, time_period: value }))
                      }>
                        <SelectTrigger>
                          <SelectValue placeholder="Select time period" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_PERIODS.map(period => (
                            <SelectItem key={period.value} value={period.value}>
                              {period.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" disabled={createHomeworkMutation.isPending} className="flex-1">
                      {createHomeworkMutation.isPending ? "Creating..." : "Create Homework"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsHomeworkDialogOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {homework.length > 0 ? (
            <div className="space-y-4">
              {homework.map((hw) => (
                <div
                  key={hw.id}
                  className={`p-4 rounded-lg border ${hw.completed ? 'bg-muted/50' : 'bg-background'}`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={hw.completed}
                      onChange={(e) => toggleHomeworkMutation.mutate({
                        id: hw.id,
                        completed: e.target.checked
                      })}
                      className="mt-1 rounded"
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className={`font-medium ${hw.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {hw.title}
                        </h4>
                        <div className={`w-2 h-2 rounded-full ${getPriorityColor(hw.time_period)}`} />
                        <Badge variant="outline" className="text-xs">
                          {TIME_PERIODS.find(p => p.value === hw.time_period)?.label}
                        </Badge>
                        {getStatusIcon(hw)}
                      </div>
                      
                      {hw.description && (
                        <p className="text-sm text-muted-foreground">{hw.description}</p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className={`text-xs ${getStatusColor(hw)}`}>
                          Due: {format(new Date(hw.due_date), "MMM dd, yyyy")}
                        </div>
                        {hw.submitted_at && (
                          <div className="text-xs text-green-600">
                            Submitted: {format(new Date(hw.submitted_at), "MMM dd, yyyy")}
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
              <h3 className="text-lg font-semibold mb-2">No Homework Yet</h3>
              <p className="mb-4">Create and track homework assignments for this subject</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}