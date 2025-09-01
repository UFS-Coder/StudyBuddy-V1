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
import { useSubjects } from "@/hooks/use-subjects";
import { useAuth } from "@/hooks/use-auth";
import { useCanEdit } from "@/hooks/use-parent-permissions";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

interface Homework {
  id: string;
  title: string;
  description: string;
  due_date: string;
  completed: boolean;
  submitted_at: string | null;
  time_period: "day" | "week" | "month" | "quarter" | "half_year" | "one_time";
  subject_id: string;
}

const TIME_PERIODS = [
  { value: "day", label: "Daily" },
  { value: "week", label: "Weekly" },
  { value: "month", label: "Monthly" },
  { value: "quarter", label: "Quarterly" },
  { value: "half_year", label: "Half Year" },
  { value: "one_time", label: "One Time" },
];

export const HomeworkManager = () => {
  const { user } = useAuth();
  const canEdit = useCanEdit();
  const { data: subjects = [] } = useSubjects();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    due_date: "",
    time_period: "one_time" as const,
    subject_id: "",
  });

  // Fetch homework
  const { data: homework = [] } = useQuery({
    queryKey: ["homework", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("homework")
        .select("*")
        .eq("user_id", user.id)
        .order("due_date");
      
      if (error) throw error;
      return data as Homework[];
    },
    enabled: !!user,
  });

  const createHomeworkMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!user) throw new Error("No user found");
      
      const { error } = await supabase
        .from("homework")
        .insert([{
          user_id: user.id,
          title: data.title,
          description: data.description,
          due_date: data.due_date,
          time_period: data.time_period,
          subject_id: data.subject_id,
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homework", user?.id] });
      setIsDialogOpen(false);
      setFormData({
        title: "",
        description: "",
        due_date: "",
        time_period: "one_time",
        subject_id: "",
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
      queryClient.invalidateQueries({ queryKey: ["homework", user?.id] });
    },
  });

  const getSubjectName = (subjectId: string) => {
    return subjects.find(s => s.id === subjectId)?.name || "Unknown Subject";
  };

  const getSubjectColor = (subjectId: string) => {
    return subjects.find(s => s.id === subjectId)?.color || "#3B82F6";
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

  // Group homework by time period
  const groupedHomework = TIME_PERIODS.reduce((acc, period) => {
    acc[period.value] = homework.filter(hw => hw.time_period === period.value);
    return acc;
  }, {} as Record<string, Homework[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Homework Management</h3>
        {canEdit && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Homework
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Homework</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (formData.title && formData.subject_id && formData.due_date) {
                createHomeworkMutation.mutate(formData);
              }
            }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Homework Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter homework title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Select value={formData.subject_id} onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, subject_id: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(subject => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
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
                    value={formData.due_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time_period">Time Period</Label>
                  <Select value={formData.time_period} onValueChange={(value: any) => 
                    setFormData(prev => ({ ...prev, time_period: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
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
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {TIME_PERIODS.map((period) => (
          <Card key={period.value}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {period.label}
                <Badge variant="secondary">{groupedHomework[period.value]?.length || 0}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {groupedHomework[period.value]?.map((hw) => (
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
                        {getStatusIcon(hw)}
                      </div>
                      
                      {hw.description && (
                        <p className="text-sm text-muted-foreground">{hw.description}</p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <Badge 
                          variant="outline" 
                          className="text-xs"
                          style={{ borderColor: getSubjectColor(hw.subject_id) }}
                        >
                          {getSubjectName(hw.subject_id)}
                        </Badge>
                        <div className={`text-xs ${getStatusColor(hw)}`}>
                          Due: {format(new Date(hw.due_date), "MMM dd, yyyy")}
                        </div>
                      </div>

                      {hw.submitted_at && (
                        <div className="text-xs text-green-600">
                          Submitted: {format(new Date(hw.submitted_at), "MMM dd, yyyy")}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {(!groupedHomework[period.value] || groupedHomework[period.value].length === 0) && (
                <p className="text-muted-foreground text-center py-8 text-sm">
                  No {period.label.toLowerCase()} homework yet
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {homework.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No homework yet</h3>
            <p className="text-muted-foreground">Add homework assignments to track your progress</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};