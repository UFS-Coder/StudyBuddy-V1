import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Navbar } from "@/components/dashboard/navbar";
import { BottomNavigation } from "@/components/dashboard/bottom-navigation";
import { useTranslations } from "@/hooks/use-translations";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { useSubjects } from "@/hooks/use-subjects";
import { useToast } from "@/hooks/use-toast";
import { FileText, Plus, Search, Filter, Edit, Trash2, BookOpen, Eye } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useSearchParams } from "react-router-dom";

interface Note {
  id: string;
  title: string;
  content: string;
  time_period: "day" | "week" | "month" | "quarter" | "half_year";
  subject_id: string | null;
  topic_id: string | null;
  subtopic_id: string | null;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

const Notes = () => {
  const { language, setLanguage, t } = useTranslations();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: subjects } = useSubjects();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [viewingNote, setViewingNote] = useState<Note | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    time_period: "week" as "day" | "week" | "month" | "quarter" | "half_year",
    subject_id: "",
    topic_id: "",
    subtopic_id: "",
  });

  const studentName = profile?.display_name || user?.email?.split("@")[0] || "Student";

  // Helper function to format AI notes content
  const formatAiNotesContent = (content: string): string => {
    try {
      const parsed = JSON.parse(content);
      if (parsed.english || parsed.german) {
        // This is AI notes content
        const englishContent = parsed.english || '';
        const germanContent = parsed.german || '';
        const youtubeVideo = parsed.youtube_video || '';
        
        const formatContent = (text: string) => {
          return text
            .replace(/,\s*$/g, '') // Remove trailing commas
            .replace(/"\s*$/g, '') // Remove trailing quotes
            .replace(/^\s*"/g, '') // Remove leading quotes
            .replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: 600; color: #1f2937;">$1</strong>')
            .replace(/\*(.*?)\*/g, '<em style="font-style: italic; color: #4b5563;">$1</em>')
            .replace(/\n\n/g, '</p><p style="margin-bottom: 1rem; line-height: 1.7;">')
            .replace(/\n/g, '<br>')
            .replace(/^/, '<p style="margin-bottom: 1rem; line-height: 1.7;">')
            .replace(/$/, '</p>');
        };
        
        const formatYouTubeVideo = (video: any) => {
          if (!video) return '';
          
          let videoId = null;
          let title = 'Educational Video';
          
          // Handle both old string format and new object format
          if (typeof video === 'string') {
            // Legacy string format: "URL - Title"
            const cleanText = video.replace(/`/g, '').trim();
            const urlMatch = cleanText.match(/https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/);
            videoId = urlMatch ? urlMatch[1] : null;
            
            if (cleanText.includes(' - ')) {
              const parts = cleanText.split(' - ');
              if (parts.length > 1) {
                title = parts.slice(1).join(' - ').trim();
              }
            }
          } else if (video && typeof video === 'object') {
            // New object format: {url: "...", title: "..."}
            const url = video.url || '';
            title = video.title || 'Educational Video';
            
            const urlMatch = url.match(/https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/);
            videoId = urlMatch ? urlMatch[1] : null;
          }
          
          if (videoId) {
            return `
              <div style="margin-top: 2rem; padding: 1.5rem; background: linear-gradient(to right, #fef2f2, #fee2e2); border-radius: 0.5rem; border: 1px solid #fecaca;">
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                  <div style="width: 2rem; height: 2rem; background: #dc2626; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center;">
                    <svg style="width: 1.25rem; height: 1.25rem; color: white;" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 style="font-size: 1.125rem; font-weight: 600; color: #1f2937; margin: 0;">Recommended Video</h3>
                    <p style="font-size: 0.875rem; color: #6b7280; margin: 0;">Watch this video to learn more about this topic</p>
                  </div>
                </div>
                <div style="background: white; border-radius: 0.5rem; padding: 1rem; border: 1px solid #fecaca;">
                  <div style="position: relative; width: 100%; height: 0; padding-bottom: 56.25%; background: #f3f4f6; border-radius: 0.5rem; overflow: hidden;">
                    <iframe
                      src="https://www.youtube.com/embed/${videoId}"
                      title="${title}"
                      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowfullscreen
                    ></iframe>
                  </div>
                  <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 0.75rem;">
                    <p style="font-size: 0.875rem; font-weight: 500; color: #1f2937; margin: 0;">${title}</p>
                    <a
                      href="https://www.youtube.com/watch?v=${videoId}"
                      target="_blank"
                      rel="noopener noreferrer"
                      style="font-size: 0.875rem; color: #dc2626; font-weight: 500; text-decoration: underline; cursor: pointer;"
                      onclick="window.open(this.href, '_blank'); return false;"
                    >
                      Watch on YouTube
                    </a>
                  </div>
                </div>
              </div>
            `;
          } else {
            return `
              <div style="margin-top: 2rem; padding: 1.5rem; background: linear-gradient(to right, #fef2f2, #fee2e2); border-radius: 0.5rem; border: 1px solid #fecaca;">
                <div style="text-align: center; padding: 1rem;">
                  <p style="color: #6b7280; margin-bottom: 0.75rem;">Video recommendation</p>
                  <p style="font-size: 0.875rem; color: #9ca3af; margin: 0;">Video link not available</p>
                </div>
              </div>
            `;
          }
        };
        
        return `
          <div style="margin-bottom: 2rem;">
            <h3 style="font-size: 1.125rem; font-weight: 600; margin: 1rem 0 0.5rem 0; color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem;">English</h3>
            <div style="margin-bottom: 1.5rem;">${formatContent(englishContent)}</div>
          </div>
          <div>
            <h3 style="font-size: 1.125rem; font-weight: 600; margin: 1rem 0 0.5rem 0; color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem;">Deutsch</h3>
            <div>${formatContent(germanContent)}</div>
          </div>
          ${formatYouTubeVideo(youtubeVideo)}
        `;
      }
    } catch (e) {
      // Not JSON or not AI notes format, return as is
    }
    return content;
  };

  // Helper function to format AI notes content for preview (German only, no "AI notes:" prefix)
  const formatAiNotesContentPreview = (content: string): string => {
    try {
      const parsed = JSON.parse(content);
      if (parsed.german) {
        // Only show German content for preview
        const germanContent = parsed.german || '';
        
        // Remove "AI notes:" prefix if it exists
        const cleanedContent = germanContent.replace(/^AI notes:\s*/i, '');
        
        return cleanedContent;
      }
    } catch (error) {
      // Not JSON or not AI notes format, return as is
    }
    return content;
  };



  // Fetch topics based on selected subject
  const { data: topics = [] } = useQuery({
    queryKey: ['syllabus-topics', user?.id, formData.subject_id],
    queryFn: async () => {
      if (!user || !formData.subject_id || formData.subject_id === 'general') {
        // Return general topics for general subject
        return formData.subject_id === 'general' ? [
          { id: 'general-topic', title: 'General - Topic', subject_id: 'general' }
        ] : [];
      }
      const { data, error } = await supabase
        .from('syllabus_topics')
        .select('*')
        .eq('user_id', user.id)
        .eq('subject_id', formData.subject_id)
        .order('order_index');
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!formData.subject_id,
  });

  // Fetch subtopics based on selected topic
  const { data: subtopics = [] } = useQuery({
    queryKey: ['subtopics', user?.id, formData.topic_id],
    queryFn: async () => {
      if (!user || !formData.topic_id) return [];
      
      // Return general subtopic for general topic
      if (formData.topic_id === 'general-topic') {
        return [{ id: 'general-subtopic', title: 'General Sub topic', topic_id: 'general-topic' }];
      }
      
      const { data, error } = await supabase
        .from('subtopics')
        .select('*')
        .eq('user_id', user.id)
        .eq('topic_id', formData.topic_id)
        .order('order_index');
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!formData.topic_id,
  });

  // Fetch notes from database
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
      return data.map(note => ({
          id: note.id,
          title: note.title,
          content: note.content,
          time_period: note.time_period,
          subject_id: note.subject_id,
          topic_id: note.topic_id,
          subtopic_id: (note as any).subtopic_id || null,
          tags: note.tags || [],
          created_at: note.created_at,
          updated_at: note.updated_at
        })) as Note[];
    },
    enabled: !!user,
  });

  // Handle URL parameters for pre-filling form data
  useEffect(() => {
    const subjectId = searchParams.get('subject_id');
    const topicId = searchParams.get('topic_id');
    const subtopicId = searchParams.get('subtopic_id');
    
    if (subjectId || topicId || subtopicId) {
      setFormData(prev => ({
        ...prev,
        subject_id: subjectId || prev.subject_id,
        topic_id: topicId || prev.topic_id,
        subtopic_id: subtopicId || prev.subtopic_id,
      }));
      
      // Set selected subject for filtering
      if (subjectId) {
        setSelectedSubject(subjectId);
      }
    }
  }, [searchParams]);

  // Save note mutation
  const saveNoteMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      if (!user) throw new Error("No user found");
      
      const payload = {
        user_id: user.id,
        title: data.title,
        content: data.content,
        time_period: data.time_period,
        subject_id: data.subject_id === "general" ? null : data.subject_id || null,
        topic_id: data.topic_id || null,
        subtopic_id: data.subtopic_id || null,
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
      setIsCreateDialogOpen(false);
      setEditingNote(null);
      setFormData({
        title: "",
        content: "",
        time_period: "week",
        subject_id: "",
        topic_id: "",
        subtopic_id: "",
      });
      toast({ 
        title: "Erfolg", 
        description: editingNote ? "Notiz erfolgreich aktualisiert" : "Notiz erfolgreich erstellt" 
      });
    },
    onError: (error) => {
      console.error("Error saving note:", error);
      toast({ 
        title: "Fehler", 
        description: "Fehler beim Speichern der Notiz: " + (error instanceof Error ? error.message : "Unbekannter Fehler"),
        variant: "destructive"
      });
    },
  });

  // Delete note mutation
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
      toast({ title: "Erfolg", description: "Notiz erfolgreich gelöscht" });
    },
  });

  const filteredNotes = notes.filter(note => {
    const matchesSearch = !searchTerm || 
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSubject = selectedSubject === "all" || 
      (selectedSubject === "general" && !note.subject_id) || 
      note.subject_id === selectedSubject;
    
    const matchesDate = !selectedDate || 
      new Date(note.created_at).toISOString().split('T')[0] === selectedDate;
    
    return matchesSearch && matchesSubject && matchesDate;
  });

  const handleEdit = (note: Note) => {
    setEditingNote(note);
    setFormData({
      title: note.title,
      content: note.content,
      time_period: note.time_period,
      subject_id: note.subject_id || "",
      topic_id: note.topic_id || "",
      subtopic_id: note.subtopic_id || "",
    });
    setIsCreateDialogOpen(true);
  };

  const handleNewNote = () => {
    setEditingNote(null);
    const urlSubjectId = searchParams.get("subject_id") || "";
    const urlTopicId = searchParams.get("topic_id") || "";
    const urlSubtopicId = searchParams.get("subtopic_id") || "";
    
    setFormData({
      title: "",
      content: "",
      time_period: "week",
      subject_id: urlSubjectId,
      topic_id: urlTopicId,
      subtopic_id: urlSubtopicId,
    });
    setIsCreateDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted with data:", formData);
    console.log("Title:", formData.title);
    console.log("Content:", formData.content);
    console.log("Content length:", formData.content?.length);
    
    // Check if content is meaningful (not just empty HTML tags)
    const contentText = formData.content?.replace(/<[^>]*>/g, '').trim();
    console.log("Content text (stripped):", contentText);
    
    if (formData.title?.trim() && contentText) {
      console.log("Validation passed, calling mutation");
      saveNoteMutation.mutate(editingNote ? { ...formData, id: editingNote.id } : formData);
    } else {
      console.log("Validation failed - missing title or content");
      toast({ 
        title: "Fehler", 
        description: "Bitte füllen Sie Titel und Inhalt aus.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = (noteId: string) => {
    if (confirm("Sind Sie sicher, dass Sie diese Notiz löschen möchten?")) {
      deleteNoteMutation.mutate(noteId);
    }
  };

  const handleView = (note: Note) => {
    setViewingNote(note);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar 
        language={language} 
        onLanguageChange={setLanguage} 
        studentName={studentName}
        t={t} 
      />
      
      <div className="container mx-auto px-4 py-6 pb-20">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6 rounded-lg mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <FileText className="w-6 h-6" />
                Notizen
              </h1>
              <p className="text-primary-foreground/80 mt-1">
                Verwalte deine Lernnotizen, {studentName}
              </p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary" className="gap-2" onClick={handleNewNote}>
                  <Plus className="w-4 h-4" />
                  Neue Notiz
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full overflow-hidden">
                <DialogHeader>
                  <DialogTitle>{editingNote ? "Notiz bearbeiten" : "Neue Notiz erstellen"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 flex flex-col h-full overflow-hidden">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="space-y-2 md:col-span-6">
                      <Label htmlFor="title">Titel *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Notiz-Titel eingeben..."
                        required
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="subject">Fach</Label>
                      <Select value={formData.subject_id} onValueChange={(value) => 
                        setFormData(prev => ({ ...prev, subject_id: value, topic_id: "", subtopic_id: "" }))
                      }>
                        <SelectTrigger>
                          <SelectValue placeholder="Fach auswählen" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">Allgemein</SelectItem>
                          {subjects?.map((subject) => (
                            <SelectItem key={subject.id} value={subject.id}>
                              {subject.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="topic">Thema</Label>
                      <Select 
                        value={formData.topic_id} 
                        onValueChange={(value) => 
                          setFormData(prev => ({ ...prev, topic_id: value, subtopic_id: "" }))
                        }
                        disabled={!formData.subject_id}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Thema auswählen" />
                        </SelectTrigger>
                        <SelectContent>
                          {topics.map((topic) => (
                            <SelectItem key={topic.id} value={topic.id}>
                              {topic.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="subtopic">Unterthema</Label>
                      <Select 
                        value={formData.subtopic_id} 
                        onValueChange={(value) => 
                          setFormData(prev => ({ ...prev, subtopic_id: value }))
                        }
                        disabled={!formData.topic_id}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Unterthema auswählen" />
                        </SelectTrigger>
                        <SelectContent>
                          {subtopics.map((subtopic) => (
                            <SelectItem key={subtopic.id} value={subtopic.id}>
                              {subtopic.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2 flex-1 flex flex-col min-h-0">
                    <Label htmlFor="content">Inhalt *</Label>
                    <div className="flex-1 overflow-hidden">
                      <ReactQuill
                        theme="snow"
                        value={formData.content}
                        onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                        placeholder="Notiz-Inhalt eingeben..."
                        style={{ height: 'calc(100vh - 400px)', maxHeight: '400px' }}
                        modules={{
                          toolbar: [
                            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                            ['bold', 'italic', 'underline', 'strike'],
                            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                            [{ 'script': 'sub'}, { 'script': 'super' }],
                            [{ 'indent': '-1'}, { 'indent': '+1' }],
                            [{ 'direction': 'rtl' }],
                            [{ 'color': [] }, { 'background': [] }],
                            [{ 'align': [] }],
                            ['link', 'image'],
                            ['clean']
                          ],
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4 flex-shrink-0">
                    <Button type="submit" disabled={saveNoteMutation.isPending} className="flex-1">
                      {saveNoteMutation.isPending ? "Speichern..." : (editingNote ? "Aktualisieren" : "Erstellen")}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => {
                      setIsCreateDialogOpen(false);
                      // Reset form data but preserve URL parameters for filtering
                      setFormData({
                        title: "",
                        content: "",
                        time_period: "week",
                        subject_id: searchParams.get('subject_id') || "",
                        topic_id: searchParams.get('topic_id') || "",
                        subtopic_id: searchParams.get('subtopic_id') || "",
                      });
                    }}>
                      Abbrechen
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* View Note Dialog */}
        <Dialog open={!!viewingNote} onOpenChange={() => setViewingNote(null)}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Eye className="w-6 h-6" />
                {viewingNote?.title}
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 flex flex-col min-h-0">
              {viewingNote && (
                <>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground border-b pb-4 mb-6 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      <span className="font-medium">{subjects?.find(s => s.id === viewingNote.subject_id)?.name || "Allgemein"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Erstellt:</span>
                      <span>{new Date(viewingNote.created_at).toLocaleDateString('de-DE')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Aktualisiert:</span>
                      <span>{new Date(viewingNote.updated_at).toLocaleDateString('de-DE')}</span>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <div className="prose prose-lg max-w-none">
                      <div 
                        className="text-base leading-relaxed space-y-4 p-4 bg-gray-50 rounded-lg border"
                        style={{
                          fontFamily: 'system-ui, -apple-system, sans-serif',
                          lineHeight: '1.7',
                          color: '#374151'
                        }}
                        dangerouslySetInnerHTML={{ 
                          __html: formatAiNotesContent(viewingNote.content)
                            .replace(/<p>/g, '<p style="margin-bottom: 1rem; line-height: 1.7;">')
                            .replace(/<h1>/g, '<h1 style="font-size: 1.5rem; font-weight: 600; margin: 1.5rem 0 1rem 0; color: #1f2937;">')
                            .replace(/<h2>/g, '<h2 style="font-size: 1.25rem; font-weight: 600; margin: 1.25rem 0 0.75rem 0; color: #1f2937;">')
                            .replace(/<h3>/g, '<h3 style="font-size: 1.125rem; font-weight: 600; margin: 1rem 0 0.5rem 0; color: #1f2937;">')
                            .replace(/<ul>/g, '<ul style="margin: 1rem 0; padding-left: 1.5rem; list-style-type: disc;">')
                            .replace(/<ol>/g, '<ol style="margin: 1rem 0; padding-left: 1.5rem; list-style-type: decimal;">')
                            .replace(/<li>/g, '<li style="margin-bottom: 0.5rem; line-height: 1.6;">')
                            .replace(/<strong>/g, '<strong style="font-weight: 600; color: #1f2937;">')
                            .replace(/<em>/g, '<em style="font-style: italic; color: #4b5563;">')
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-6 border-t mt-6 flex-shrink-0">
                    <Button 
                      variant="default" 
                      onClick={() => {
                        setViewingNote(null);
                        handleEdit(viewingNote);
                      }}
                      className="gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Bearbeiten
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setViewingNote(null)}
                    >
                      Schließen
                    </Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Search and Filter */}
        <div className="flex gap-4 mb-6 flex-wrap">
          <div className="flex-1 min-w-64 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Notizen durchsuchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Input
              id="date-filter"
              type="date"
              aria-label="Datum"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-40"
            />
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Fächer</SelectItem>
                <SelectItem value="general">Allgemein</SelectItem>
                {subjects?.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Notes Grid */}
        {filteredNotes.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredNotes.map((note) => {
              const subject = subjects?.find(s => s.id === note.subject_id);
              const subjectName = subject?.name || "Allgemein";
              
              return (
                <Card key={note.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleView(note)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-1">
                          {note.title.replace(/^AI notes:\s*/i, '')}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            <BookOpen className="w-3 h-3 mr-1" />
                            {subjectName}
                          </Badge>
                          {note.tags && note.tags.includes('AI notes') && (
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                              AI notes
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {new Date(note.updated_at).toLocaleDateString('de-DE')}
                          </span>
                        </div>

                      </div>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => handleView(note)}
                          title="Ansehen"
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => handleEdit(note)}
                          title="Bearbeiten"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(note.id)}
                          title="Löschen"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div 
                      className="text-sm text-muted-foreground line-clamp-3"
                      dangerouslySetInnerHTML={{ __html: formatAiNotesContentPreview(note.content) }}
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Keine Notizen gefunden</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || selectedSubject !== "all" 
                ? "Keine Notizen entsprechen deinen Suchkriterien."
                : "Du hast noch keine Notizen erstellt."}
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
               <Plus className="w-4 h-4" />
               Erste Notiz erstellen
             </Button>
          </div>
        )}
      </div>

      
      {!(isCreateDialogOpen || editingNote || viewingNote) && <BottomNavigation t={t} />}
    </div>
  );
};

export default Notes;