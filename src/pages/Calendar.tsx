import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BottomNavigation } from "@/components/dashboard/bottom-navigation";
import { useTranslations } from "@/hooks/use-translations";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { useSubjects } from "@/hooks/use-subjects";
import { Calendar as CalendarIcon, Plus, Clock, BookOpen, AlertCircle, CheckCircle } from "lucide-react";

const Calendar = () => {
  const { t } = useTranslations();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: subjects } = useSubjects();
  const [selectedView, setSelectedView] = useState("month");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({ 
    title: "", 
    description: "", 
    subject_id: "", 
    date: "", 
    time: "", 
    type: "exam" 
  });

  const studentName = profile?.display_name || user?.email?.split("@")[0] || "Student";

  // Mock calendar events - in real app this would come from a hook
  const mockEvents = [
    {
      id: "1",
      title: "Mathematik Klausur",
      description: "Quadratische Funktionen und Parabeln",
      subject_id: "math",
      subject_name: "Mathematik",
      date: "2024-01-25",
      time: "08:00",
      type: "exam",
      status: "upcoming"
    },
    {
      id: "2",
      title: "Geschichte Hausarbeit",
      description: "Essay über die Französische Revolution",
      subject_id: "history",
      subject_name: "Geschichte",
      date: "2024-01-30",
      time: "23:59",
      type: "assignment",
      status: "upcoming"
    },
    {
      id: "3",
      title: "Biologie Test",
      description: "Photosynthese und Zellatmung",
      subject_id: "biology",
      subject_name: "Biologie",
      date: "2024-01-20",
      time: "10:00",
      type: "test",
      status: "completed"
    },
    {
      id: "4",
      title: "Physik Laborarbeit",
      description: "Experiment zu Schwingungen",
      subject_id: "physics",
      subject_name: "Physik",
      date: "2024-02-05",
      time: "14:00",
      type: "assignment",
      status: "upcoming"
    }
  ];

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case "exam":
        return <AlertCircle className="w-4 h-4" />;
      case "test":
        return <Clock className="w-4 h-4" />;
      case "assignment":
        return <BookOpen className="w-4 h-4" />;
      default:
        return <CalendarIcon className="w-4 h-4" />;
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "exam":
        return "destructive";
      case "test":
        return "secondary";
      case "assignment":
        return "default";
      default:
        return "outline";
    }
  };

  const getStatusIcon = (status: string) => {
    return status === "completed" ? (
      <CheckCircle className="w-4 h-4 text-green-600" />
    ) : (
      <Clock className="w-4 h-4 text-orange-600" />
    );
  };

  const upcomingEvents = mockEvents.filter(event => event.status === "upcoming")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const handleCreateEvent = () => {
    // In real app, this would create an event via API
    console.log("Creating event:", newEvent);
    setNewEvent({ title: "", description: "", subject_id: "", date: "", time: "", type: "exam" });
    setIsCreateDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <CalendarIcon className="w-6 h-6" />
                Kalender
              </h1>
              <p className="text-primary-foreground/80 mt-1">
                Verwalte deine Termine und Deadlines, {studentName}
              </p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Neuer Termin
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Neuen Termin erstellen</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Titel</label>
                    <Input
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                      placeholder="Termin-Titel eingeben..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Typ</label>
                      <Select value={newEvent.type} onValueChange={(value) => setNewEvent({ ...newEvent, type: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="exam">Klausur</SelectItem>
                          <SelectItem value="test">Test</SelectItem>
                          <SelectItem value="assignment">Hausarbeit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Fach</label>
                      <Select value={newEvent.subject_id} onValueChange={(value) => setNewEvent({ ...newEvent, subject_id: value })}>
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
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Datum</label>
                      <Input
                        type="date"
                        value={newEvent.date}
                        onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Uhrzeit</label>
                      <Input
                        type="time"
                        value={newEvent.time}
                        onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Beschreibung</label>
                    <Textarea
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                      placeholder="Zusätzliche Informationen..."
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Abbrechen
                    </Button>
                    <Button onClick={handleCreateEvent}>
                      Erstellen
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Anstehende Klausuren</p>
                  <p className="text-2xl font-bold">
                    {mockEvents.filter(e => e.type === "exam" && e.status === "upcoming").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Offene Hausarbeiten</p>
                  <p className="text-2xl font-bold">
                    {mockEvents.filter(e => e.type === "assignment" && e.status === "upcoming").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Abgeschlossen</p>
                  <p className="text-2xl font-bold">
                    {mockEvents.filter(e => e.status === "completed").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Anstehende Termine
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length > 0 ? (
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-2">
                      {getEventTypeIcon(event.type)}
                      {getStatusIcon(event.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{event.title}</h3>
                        <Badge variant={getEventTypeColor(event.type) as any}>
                          {event.type === "exam" ? "Klausur" : 
                           event.type === "test" ? "Test" : "Hausarbeit"}
                        </Badge>
                        <Badge variant="outline">
                          {event.subject_name}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="w-3 h-3" />
                          {new Date(event.date).toLocaleDateString('de-DE')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {event.time}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {Math.ceil((new Date(event.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} Tage
                      </p>
                      <p className="text-xs text-muted-foreground">verbleibend</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Keine anstehenden Termine</h3>
                <p className="text-muted-foreground mb-4">
                  Du hast aktuell keine anstehenden Termine.
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Ersten Termin erstellen
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom padding for navigation */}
      <div className="h-20" />
      
      <BottomNavigation t={t} />
    </div>
  );
};

export default Calendar;