import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Navbar } from "@/components/dashboard/navbar";
import { BottomNavigation } from "@/components/dashboard/bottom-navigation";
import { useTranslations } from "@/hooks/use-translations";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { useSubjects } from "@/hooks/use-subjects";
import { FileText, Plus, Search, Filter, Edit, Trash2, BookOpen } from "lucide-react";

const Notes = () => {
  const { language, setLanguage, t } = useTranslations();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: subjects } = useSubjects();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newNote, setNewNote] = useState({ title: "", content: "", subject_id: "" });

  const studentName = profile?.display_name || user?.email?.split("@")[0] || "Student";

  // Mock notes data - in real app this would come from a hook
  const mockNotes = [
    {
      id: "1",
      title: "Quadratische Funktionen",
      content: "Grundlagen der quadratischen Funktionen und Parabeln...",
      subject_id: "math",
      subject_name: "Mathematik",
      created_at: "2024-01-15",
      updated_at: "2024-01-15"
    },
    {
      id: "2",
      title: "Französische Revolution",
      content: "Ursachen und Verlauf der Französischen Revolution 1789...",
      subject_id: "history",
      subject_name: "Geschichte",
      created_at: "2024-01-14",
      updated_at: "2024-01-14"
    },
    {
      id: "3",
      title: "Photosynthese",
      content: "Der Prozess der Photosynthese in Pflanzen...",
      subject_id: "biology",
      subject_name: "Biologie",
      created_at: "2024-01-13",
      updated_at: "2024-01-13"
    }
  ];

  const filteredNotes = mockNotes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedSubject === "all" || note.subject_id === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  const handleCreateNote = () => {
    // In real app, this would create a note via API
    console.log("Creating note:", newNote);
    setNewNote({ title: "", content: "", subject_id: "" });
    setIsCreateDialogOpen(false);
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
                <Button variant="secondary" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Neue Notiz
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Neue Notiz erstellen</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Titel</label>
                    <Input
                      value={newNote.title}
                      onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                      placeholder="Notiz-Titel eingeben..."
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Fach</label>
                    <Select value={newNote.subject_id} onValueChange={(value) => setNewNote({ ...newNote, subject_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Fach auswählen" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects?.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Inhalt</label>
                    <Textarea
                      value={newNote.content}
                      onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                      placeholder="Notiz-Inhalt eingeben..."
                      rows={6}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Abbrechen
                    </Button>
                    <Button onClick={handleCreateNote}>
                      Erstellen
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Notizen durchsuchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Fächer</SelectItem>
              {subjects?.map((subject) => (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Notes Grid */}
        {filteredNotes.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredNotes.map((note) => (
              <Card key={note.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-1">{note.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          <BookOpen className="w-3 h-3 mr-1" />
                          {note.subject_name}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(note.updated_at).toLocaleDateString('de-DE')}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {note.content}
                  </p>
                </CardContent>
              </Card>
            ))}
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
      
      <BottomNavigation t={t} />
    </div>
  );
};

export default Notes;