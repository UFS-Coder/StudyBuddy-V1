import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, PenTool, Tag, Search, Filter } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useSubjects } from "@/hooks/use-subjects";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  time_period: "day" | "week" | "month" | "quarter" | "half_year";
  subject_id: string | null;
  topic_id: string | null;
  created_at: string;
  updated_at: string;
}

const TIME_PERIODS = [
  { value: "day", label: "Daily" },
  { value: "week", label: "Weekly" },
  { value: "month", label: "Monthly" },
  { value: "quarter", label: "Quarterly" },
  { value: "half_year", label: "Half Year" },
];

export const NotesManager = () => {
  const { user } = useAuth();
  const { data: subjects = [] } = useSubjects();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    tags: "",
    time_period: "week" as "day" | "week" | "month" | "quarter" | "half_year",
    subject_id: "",
  });

  // Fetch notes
  const { data: notes = [] } = useQuery({
    queryKey: ["notes", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });
      
      if (error) throw error;
      return data as Note[];
    },
    enabled: !!user,
  });

  const saveNoteMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      if (!user) throw new Error("No user found");
      
      const payload = {
        user_id: user.id,
        title: data.title,
        content: data.content,
        tags: data.tags ? data.tags.split(",").map(tag => tag.trim()).filter(Boolean) : [],
        time_period: data.time_period,
        subject_id: data.subject_id || null,
      };

      if (data.id) {
        const { error } = await supabase
          .from("notes")
          .update(payload)
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("notes")
          .insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", user?.id] });
      setIsDialogOpen(false);
      setEditingNote(null);
      setFormData({
        title: "",
        content: "",
        tags: "",
        time_period: "week",
        subject_id: "",
      });
      toast({ 
        title: "Success", 
        description: editingNote ? "Note updated successfully" : "Note created successfully" 
      });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase
        .from("notes")
        .delete()
        .eq("id", noteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", user?.id] });
      toast({ title: "Success", description: "Note deleted successfully" });
    },
  });

  const getSubjectName = (subjectId: string | null) => {
    if (!subjectId) return "General";
    return subjects.find(s => s.id === subjectId)?.name || "Unknown Subject";
  };

  const getSubjectColor = (subjectId: string | null) => {
    if (!subjectId) return "#6B7280";
    return subjects.find(s => s.id === subjectId)?.color || "#3B82F6";
  };

  const handleEdit = (note: Note) => {
    setEditingNote(note);
    setFormData({
      title: note.title,
      content: note.content,
      tags: note.tags.join(", "),
      time_period: note.time_period,
      subject_id: note.subject_id || "",
    });
    setIsDialogOpen(true);
  };

  const handleNewNote = () => {
    setEditingNote(null);
    setFormData({
      title: "",
      content: "",
      tags: "",
      time_period: "week",
      subject_id: "",
    });
    setIsDialogOpen(true);
  };

  // Filter notes based on search and filters
  const filteredNotes = notes.filter(note => {
    const matchesSearch = !searchQuery || 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesPeriod = !selectedPeriod || note.time_period === selectedPeriod;
    const matchesSubject = !selectedSubject || note.subject_id === selectedSubject;
    
    return matchesSearch && matchesPeriod && matchesSubject;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Notes Management</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewNote}>
              <Plus className="h-4 w-4 mr-2" />
              Add Note
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingNote ? "Edit Note" : "Create New Note"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (formData.title && formData.content) {
                saveNoteMutation.mutate(editingNote ? { ...formData, id: editingNote.id } : formData);
              }
            }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Note Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter note title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter note content"
                  rows={8}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Select value={formData.subject_id} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, subject_id: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">General</SelectItem>
                      {subjects.map(subject => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="tag1, tag2, tag3"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={saveNoteMutation.isPending} className="flex-1">
                  {saveNoteMutation.isPending ? "Saving..." : (editingNote ? "Update Note" : "Create Note")}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All periods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All periods</SelectItem>
                {TIME_PERIODS.map(period => (
                  <SelectItem key={period.value} value={period.value}>
                    {period.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All subjects</SelectItem>
                <SelectItem value="general">General</SelectItem>
                {subjects.map(subject => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredNotes.map((note) => (
          <Card key={note.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg line-clamp-2">{note.title}</CardTitle>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(note)}
                  >
                    <PenTool className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteNoteMutation.mutate(note.id)}
                  >
                    <Tag className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground line-clamp-3">
                {note.content}
              </p>
              
              <div className="flex items-center gap-2 flex-wrap">
                <Badge 
                  variant="outline" 
                  className="text-xs"
                  style={{ borderColor: getSubjectColor(note.subject_id) }}
                >
                  {getSubjectName(note.subject_id)}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {TIME_PERIODS.find(p => p.value === note.time_period)?.label}
                </Badge>
              </div>

              {note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {note.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                {format(new Date(note.updated_at), "MMM dd, yyyy")}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredNotes.length === 0 && notes.length > 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No notes found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </CardContent>
        </Card>
      )}

      {notes.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <PenTool className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No notes yet</h3>
            <p className="text-muted-foreground">Create your first note to capture important information</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};