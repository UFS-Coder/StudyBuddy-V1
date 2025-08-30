import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit2, Trash2, BookOpen } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSubjects } from "@/hooks/use-subjects";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const COLORS = [
  "#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6",
  "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#6366F1"
];

export const SubjectManager = () => {
  const { user } = useAuth();
  const { data: subjects = [] } = useSubjects();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    teacher: "",
    room: "",
    color: COLORS[0],
    credits: 3,
    target_grade: 80,
  });

  const subjectMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      if (!user) throw new Error("No user found");

      const payload = {
        user_id: user.id,
        name: data.name,
        teacher: data.teacher || null,
        room: data.room || null,
        color: data.color,
        credits: data.credits,
        target_grade: data.target_grade,
      };

      if (data.id) {
        const { error } = await supabase
          .from("subjects")
          .update(payload)
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("subjects")
          .insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects", user?.id] });
      setIsDialogOpen(false);
      setEditingSubject(null);
      resetForm();
      toast({
        title: "Success",
        description: editingSubject ? "Subject updated successfully" : "Subject created successfully",
      });
    },
    onError: (error) => {
      console.error("Error saving subject:", error);
      toast({
        title: "Error",
        description: "Failed to save subject. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteSubjectMutation = useMutation({
    mutationFn: async (subjectId: string) => {
      const { error } = await supabase
        .from("subjects")
        .delete()
        .eq("id", subjectId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects", user?.id] });
      toast({
        title: "Success",
        description: "Subject deleted successfully",
      });
    },
    onError: (error) => {
      console.error("Error deleting subject:", error);
      toast({
        title: "Error",
        description: "Failed to delete subject. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      teacher: "",
      room: "",
      color: COLORS[0],
      credits: 3,
      target_grade: 80,
    });
  };

  const handleEdit = (subject: any) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      teacher: subject.teacher || "",
      room: subject.room || "",
      color: subject.color,
      credits: subject.credits,
      target_grade: subject.target_grade || 80,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    
    subjectMutation.mutate(editingSubject ? { ...formData, id: editingSubject.id } : formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Subject Management</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Subject
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSubject ? "Edit Subject" : "Add New Subject"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Subject Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Mathematics, Science, etc."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="teacher">Teacher</Label>
                  <Input
                    id="teacher"
                    value={formData.teacher}
                    onChange={(e) => setFormData(prev => ({ ...prev, teacher: e.target.value }))}
                    placeholder="Teacher name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="room">Room</Label>
                  <Input
                    id="room"
                    value={formData.room}
                    onChange={(e) => setFormData(prev => ({ ...prev, room: e.target.value }))}
                    placeholder="Room number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="credits">Credits</Label>
                  <Input
                    id="credits"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.credits}
                    onChange={(e) => setFormData(prev => ({ ...prev, credits: parseInt(e.target.value) || 3 }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target_grade">Target Grade</Label>
                  <Input
                    id="target_grade"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.target_grade}
                    onChange={(e) => setFormData(prev => ({ ...prev, target_grade: parseInt(e.target.value) || 80 }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 ${
                        formData.color === color ? "border-foreground" : "border-muted-foreground"
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={subjectMutation.isPending} className="flex-1">
                  {subjectMutation.isPending ? "Saving..." : (editingSubject ? "Update" : "Create")}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map((subject) => (
          <Card key={subject.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: subject.color }}
                />
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(subject)}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteSubjectMutation.mutate(subject.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <CardTitle className="text-lg">{subject.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {subject.teacher && (
                <p className="text-sm text-muted-foreground">Teacher: {subject.teacher}</p>
              )}
              {subject.room && (
                <p className="text-sm text-muted-foreground">Room: {subject.room}</p>
              )}
              <div className="flex justify-between text-sm">
                <span>Credits: {subject.credits}</span>
                {subject.target_grade && (
                  <span>Target: {subject.target_grade}%</span>
                )}
              </div>
              {subject.current_grade && (
                <div className="text-sm">
                  Current: <span className="font-medium">{subject.current_grade}%</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {subjects.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No subjects yet</h3>
            <p className="text-muted-foreground">Create your first subject to get started</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};