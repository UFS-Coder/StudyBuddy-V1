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
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, Task } from "@/hooks/use-tasks";
import { useIsMobile } from "@/hooks/use-mobile";
import { Calendar as CalendarIcon, Plus, Clock, BookOpen, AlertCircle, CheckCircle, List, Grid3X3, ChevronLeft, ChevronRight, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

const Calendar = () => {
  const { language, setLanguage, t } = useTranslations();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: subjects } = useSubjects();
  const { data: tasks = [] } = useTasks();
  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<"list" | "calendar">("calendar");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newEvent, setNewEvent] = useState({ 
    title: "", 
    description: "", 
    subject_id: "", 
    due_date: "", 
    priority: "medium" as "low" | "medium" | "high",
    type: "task" as "task" | "homework",
    time_period: "week" as "day" | "week" | "month" | "quarter" | "half_year"
  });

  const studentName = profile?.display_name || user?.email?.split("@")[0] || "Student";

  // Helper function to format date consistently in local timezone
  const formatDateLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper function to format date for datetime-local input
  const formatDateTimeLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // State for selected date in list view (default to today)
  const [selectedListDate, setSelectedListDate] = useState<string>(formatDateLocal(new Date()));

  // Convert tasks to calendar events format
  const calendarEvents = tasks.map(task => {
    const subject = subjects?.find(s => s.id === task.subject_id);
    const dueDate = task.due_date ? new Date(task.due_date) : null;
    
    // Determine if the due_date has a time component (anything other than 00:00)
    const hasTime = !!dueDate && (dueDate.getHours() !== 0 || dueDate.getMinutes() !== 0);
    
    // For date-only or midnight values, show as all-day event; otherwise, show the actual time
    let timeDisplay = "";
    if (dueDate) {
      if (!hasTime) {
        timeDisplay = "Ganztägig";
      } else {
        timeDisplay = dueDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
      }
    }
    
    return {
      id: task.id,
      title: task.title,
      description: task.description || "",
      subject_id: task.subject_id,
      subject_name: subject?.name || "Allgemein",
      date: dueDate ? formatDateLocal(dueDate) : "",
      time: timeDisplay,
      fullDate: dueDate,
      type: task.type,
      status: task.completed ? "completed" : "upcoming",
      priority: task.priority,
      task: task // Keep reference to original task
    };
  });

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case "homework":
        return <BookOpen className="w-4 h-4" />;
      case "task":
        return <Clock className="w-4 h-4" />;
      default:
        return <CalendarIcon className="w-4 h-4" />;
    }
  };

  const getEventTypeColor = (type: string, priority?: string) => {
    if (priority === "high") {
      return "destructive";
    } else if (priority === "medium") {
      return "secondary";
    } else if (priority === "low") {
      return "default";
    }
    
    switch (type) {
      case "homework":
        return "default";
      case "task":
        return "secondary";
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

  const upcomingEvents = calendarEvents.filter(event => event.status === "upcoming")
    .sort((a, b) => {
      if (!a.fullDate || !b.fullDate) return 0;
      return a.fullDate.getTime() - b.fullDate.getTime();
    });

  // All events for list view (including completed ones)
  const allEventsForList = calendarEvents
    .sort((a, b) => {
      if (!a.fullDate || !b.fullDate) return 0;
      return a.fullDate.getTime() - b.fullDate.getTime();
    });

  // Filter events for selected date in list view
  const eventsForSelectedDate = allEventsForList.filter(event => event.date === selectedListDate);

  // Get unique dates that have events for the dropdown
  const availableDates = [...new Set(allEventsForList.map(event => event.date).filter(Boolean))]
    .sort()
    .map(dateStr => {
      const date = new Date(dateStr + 'T00:00:00');
      const today = new Date();
      const tomorrow = new Date(today.getTime() + 86400000);
      
      let label = date.toLocaleDateString('de-DE', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      if (dateStr === formatDateLocal(today)) {
        label = `Heute, ${label}`;
      } else if (dateStr === formatDateLocal(tomorrow)) {
        label = `Morgen, ${label}`;
      }
      
      return { value: dateStr, label };
    });

  // If no events exist, add today as an option
  if (availableDates.length === 0) {
    const today = new Date();
    const todayStr = formatDateLocal(today);
    const todayLabel = `Heute, ${today.toLocaleDateString('de-DE', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}`;
    availableDates.push({ value: todayStr, label: todayLabel });
  }

  // Group events by date for list view (keeping for potential future use)
  const groupedEvents = allEventsForList.reduce((groups, event) => {
    const dateKey = event.date || 'no-date';
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(event);
    return groups;
  }, {} as Record<string, typeof allEventsForList>);

  // Sort events within each day by time
  Object.keys(groupedEvents).forEach(dateKey => {
    groupedEvents[dateKey].sort((a, b) => {
      if (!a.fullDate || !b.fullDate) return 0;
      return a.fullDate.getTime() - b.fullDate.getTime();
    });
  });

  // Form validation
  const validateForm = () => {
    const errors: string[] = [];
    
    if (!newEvent.title.trim()) {
      errors.push("Titel ist erforderlich");
    }
    
    if (!newEvent.due_date) {
      errors.push("Fälligkeitsdatum ist erforderlich");
    } else {
      const dueDate = new Date(newEvent.due_date);
      const now = new Date();
      if (dueDate < now) {
        errors.push("Fälligkeitsdatum muss in der Zukunft liegen");
      }
    }
    
    if (newEvent.title.length > 100) {
      errors.push("Titel darf maximal 100 Zeichen lang sein");
    }
    
    if (newEvent.description.length > 500) {
      errors.push("Beschreibung darf maximal 500 Zeichen lang sein");
    }
    
    return errors;
  };

  // Handle creating new event
  const handleCreateEvent = () => {
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      alert(validationErrors.join("\n"));
      return;
    }

    // Convert datetime-local format to ISO string for database
    let formattedDueDate = newEvent.due_date;
    if (newEvent.due_date) {
      const date = new Date(newEvent.due_date);
      if (!isNaN(date.getTime())) {
        // Store absolute time in ISO (UTC)
        formattedDueDate = date.toISOString();
      }
    }

    const taskData = {
      title: newEvent.title.trim(),
      description: newEvent.description.trim(),
      subject_id: newEvent.subject_id || null,
      due_date: formattedDueDate,
      priority: newEvent.priority,
      type: newEvent.type,
      time_period: newEvent.time_period,
      completed: false
    };

    createTaskMutation.mutate(taskData, {
      onSuccess: () => {
        setIsCreateDialogOpen(false);
        setNewEvent({ 
          title: "", 
          description: "", 
          subject_id: "", 
          due_date: "", 
          priority: "medium",
          type: "task",
          time_period: "week"
        });
      }
    });
  };

  // Handle editing event
  const handleEditEvent = (event: any) => {
    const task = event.task;
    setEditingTask(task);
    
    // Convert due_date to datetime-local format in local time
    let formattedDueDate = "";
    if (task.due_date) {
      const date = new Date(task.due_date);
      if (!isNaN(date.getTime())) {
        // Format to YYYY-MM-DDTHH:MM for datetime-local input using local timezone
        formattedDueDate = formatDateTimeLocal(date);
      }
    }
    
    setNewEvent({
      title: task.title,
      description: task.description || "",
      subject_id: task.subject_id || "",
      due_date: formattedDueDate,
      priority: task.priority,
      type: task.type,
      time_period: task.time_period
    });
    setIsEditDialogOpen(true);
  };

  // Handle updating event
  const handleUpdateEvent = () => {
    if (!editingTask) {
      return;
    }
    
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      alert(validationErrors.join("\n"));
      return;
    }

    // Convert datetime-local format to ISO string for database
    let formattedDueDate = newEvent.due_date;
    if (newEvent.due_date) {
      const date = new Date(newEvent.due_date);
      if (!isNaN(date.getTime())) {
        // Store absolute time in ISO (UTC)
        formattedDueDate = date.toISOString();
      }
    }

    const updates = {
      id: editingTask.id,
      title: newEvent.title.trim(),
      description: newEvent.description.trim(),
      subject_id: newEvent.subject_id || null,
      due_date: formattedDueDate,
      priority: newEvent.priority,
      type: newEvent.type,
      time_period: newEvent.time_period
    };

    updateTaskMutation.mutate(updates, {
      onSuccess: () => {
        setIsEditDialogOpen(false);
        setEditingTask(null);
        setNewEvent({ 
          title: "", 
          description: "", 
          subject_id: "", 
          due_date: "", 
          priority: "medium",
          type: "task",
          time_period: "week"
        });
      }
    });
  };

  // Handle deleting event
  const handleDeleteEvent = (event: any) => {
    if (window.confirm("Möchten Sie diese Aufgabe wirklich löschen?")) {
      deleteTaskMutation.mutate(event.task.id);
    }
  };

  // Handle toggling task completion
  const handleToggleComplete = (event: any) => {
    updateTaskMutation.mutate({
      id: event.task.id,
      completed: !event.task.completed
    });
  };

  // Calendar grid helper functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return firstDay === 0 ? 6 : firstDay - 1; // Convert Sunday (0) to be last (6), Monday (1) to be first (0)
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = formatDateLocal(date);
    return calendarEvents.filter(event => event.date === dateStr);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  // Handle clicking on a calendar day
  const handleDayClick = (cellDate: Date, eventsForDay: any[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    cellDate.setHours(0, 0, 0, 0);
    
    // Only allow interaction with current date or future dates
    if (cellDate >= today) {
      if (eventsForDay.length === 0) {
        // No events, open new event dialog with pre-filled date and default time
        const defaultDate = new Date(cellDate);
        defaultDate.setHours(12, 0, 0, 0); // Set default time to 12:00
        setNewEvent({
          title: "",
          description: "",
          subject_id: "",
          due_date: formatDateTimeLocal(defaultDate),
          priority: "medium",
          type: "task",
          time_period: "week"
        });
        setIsEditDialogOpen(false);
        setIsCreateDialogOpen(true);
      }
      // If there are events, clicking on individual events will handle editing
    }
  };

  // Handle adding new event to a day that already has events
  const handleAddEventToDay = (cellDate: Date, e: React.MouseEvent) => {
    e.stopPropagation();
    const defaultDate = new Date(cellDate);
    defaultDate.setHours(12, 0, 0, 0); // Set default time to 12:00
    setNewEvent({
      title: "",
      description: "",
      subject_id: "",
      due_date: formatDateTimeLocal(defaultDate),
      priority: "medium",
      type: "task",
      time_period: "week"
    });
    setIsEditDialogOpen(false);
    setIsCreateDialogOpen(true);
  };

  const renderCalendarGrid = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];
    const today = new Date();
    const monthNames = [
      'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
      'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
    ];
    const dayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
    const shortDayNames = ['M', 'D', 'M', 'D', 'F', 'S', 'S']; // Shorter day names for mobile

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className={`${isMobile ? 'h-12' : 'h-16 md:h-24'} border border-border/50`}></div>
      );
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const eventsForDay = getEventsForDate(cellDate);
      const isToday = cellDate.toDateString() === today.toDateString();
      const isPast = cellDate < today && !isToday;
      const isFutureOrToday = cellDate >= today || isToday;

      days.push(
        <div
          key={day}
          className={`${isMobile ? 'h-12' : 'h-16 md:h-24'} border border-border/50 ${isMobile ? 'p-0.5' : 'p-1'} overflow-hidden ${
            isToday ? 'bg-primary/10 border-primary' : isPast ? 'bg-muted/30' : 'hover:bg-accent/50'
          } transition-colors ${isFutureOrToday ? 'cursor-pointer' : ''}`}
          onClick={() => handleDayClick(cellDate, eventsForDay)}
        >
          <div className={`${isMobile ? 'text-[10px]' : 'text-xs md:text-sm'} font-medium ${isMobile ? 'mb-0.5' : 'mb-1'} ${
            isToday ? 'text-primary font-bold' : isPast ? 'text-muted-foreground' : ''
          }`}>
            {day}
          </div>
          <div className={isMobile ? 'space-y-0.5' : 'space-y-1'}>
            {eventsForDay.slice(0, isMobile ? 1 : 2).map((event, index) => (
              <div
                key={event.id}
                className={`${isMobile ? 'text-[8px] p-0.5' : 'text-xs p-1'} rounded group relative ${
                  event.priority === 'high' ? 'bg-red-100 text-red-800' :
                  event.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}
                title={event.title}
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditEvent(event);
                }}
              >
                <div className="truncate pr-6 text-[10px] md:text-xs">{event.title}</div>
                <div className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditEvent(event);
                    }}
                    className="w-3 h-3 flex items-center justify-center hover:bg-white/20 rounded"
                  >
                    <Edit className="w-2 h-2" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteEvent(event);
                    }}
                    className="w-3 h-3 flex items-center justify-center hover:bg-white/20 rounded text-red-600"
                  >
                    <Trash2 className="w-2 h-2" />
                  </button>
                </div>
              </div>
            ))}
            {eventsForDay.length > 1 && (
              <div className="text-[10px] md:text-xs text-muted-foreground font-medium">
                +{eventsForDay.length - 1} mehr
              </div>
            )}
            {/* Add + icon for adding new events when there are existing events and it's not a past date */}
            {eventsForDay.length > 0 && isFutureOrToday && (
              <button
                onClick={(e) => handleAddEventToDay(cellDate, e)}
                className="w-full text-[10px] md:text-xs text-muted-foreground hover:text-primary flex items-center justify-center gap-1 py-1 hover:bg-accent/50 rounded transition-colors"
                title="Neuen Termin hinzufügen"
              >
                <Plus className="w-3 h-3" />
                <span className="hidden md:inline">Hinzufügen</span>
              </button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Calendar Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg md:text-xl font-semibold">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex"
              onClick={() => setCurrentDate(new Date())}
            >
              Heute
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Day Names Header */}
        <div className="grid grid-cols-7 gap-0">
          {dayNames.map((day, index) => (
            <div key={day} className="h-8 border border-border/50 bg-muted/50 flex items-center justify-center text-xs md:text-sm font-medium">
              <span className="hidden md:inline">{day}</span>
              <span className="md:hidden">{shortDayNames[index]}</span>
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-0 border border-border/50">
          {days}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar 
        language={language} 
        onLanguageChange={setLanguage} 
        studentName={studentName}
        t={t} 
      />
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 pb-20">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6 rounded-lg mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                <CalendarIcon className="w-6 h-6" />
                Kalender
              </h1>
              <p className="text-sm sm:text-base text-primary-foreground/80 mt-1">
                Verwalte deine Termine und Deadlines, {studentName}
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
              {/* View Toggle */}
              <div className="flex items-center bg-primary-foreground/20 rounded-lg p-0.5 sm:p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className={`gap-1.5 sm:gap-2 hover:text-primary ${
                    viewMode === "list" 
                      ? "bg-orange-500 text-white hover:bg-orange-600 hover:text-white" 
                      : "text-primary-foreground"
                  }`}
                >
                  <List className="w-4 h-4" />
                  <span className="hidden sm:inline">Liste</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("calendar")}
                  className={`gap-1.5 sm:gap-2 hover:text-primary ${
                    viewMode === "calendar" 
                      ? "bg-orange-500 text-white hover:bg-orange-600 hover:text-white" 
                      : "text-primary-foreground"
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Kalender</span>
                </Button>
              </div>
              {/* Edit Dialog */}
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className={`${isMobile ? 'max-w-[95vw] max-h-[90vh] overflow-y-auto' : ''}`}>
                  <DialogHeader>
                    <DialogTitle className={isMobile ? 'text-lg' : ''}>Termin bearbeiten</DialogTitle>
                  </DialogHeader>
                  <div className={`${isMobile ? 'space-y-3' : 'space-y-4'}`}>
                    <div>
                      <label className="text-sm font-medium">Titel *</label>
                      <Input
                        value={newEvent.title}
                        onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                        placeholder="Aufgaben-Titel eingeben..."
                        className={newEvent.title.length > 100 ? "border-red-500" : ""}
                      />
                      <div className="text-xs text-muted-foreground mt-1">
                        {newEvent.title.length}/100 Zeichen
                      </div>
                    </div>
                    <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-2 gap-4'}`}>
                      <div>
                        <label className="text-sm font-medium">Typ</label>
                        <Select value={newEvent.type} onValueChange={(value) => setNewEvent({ ...newEvent, type: value as "task" | "homework" })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="task">Aufgabe</SelectItem>
                            <SelectItem value="homework">Hausaufgabe</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Priorität</label>
                        <Select value={newEvent.priority} onValueChange={(value) => setNewEvent({ ...newEvent, priority: value as "low" | "medium" | "high" })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Niedrig</SelectItem>
                            <SelectItem value="medium">Mittel</SelectItem>
                            <SelectItem value="high">Hoch</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Fach</label>
                      <Select value={newEvent.subject_id} onValueChange={(value) => setNewEvent({ ...newEvent, subject_id: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Fach auswählen (optional)" />
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
                      <label className="text-sm font-medium">Fälligkeitsdatum *</label>
                      <Input
                        type="datetime-local"
                        value={newEvent.due_date}
                        onChange={(e) => setNewEvent({ ...newEvent, due_date: e.target.value })}
                        min={new Date().toISOString().slice(0, 16)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Zeitraum</label>
                      <Select value={newEvent.time_period} onValueChange={(value) => setNewEvent({ ...newEvent, time_period: value as "day" | "week" | "month" | "quarter" | "half_year" })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="day">Tag</SelectItem>
                          <SelectItem value="week">Woche</SelectItem>
                          <SelectItem value="month">Monat</SelectItem>
                          <SelectItem value="quarter">Quartal</SelectItem>
                          <SelectItem value="half_year">Halbjahr</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Beschreibung</label>
                      <Textarea
                        value={newEvent.description}
                        onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                        placeholder="Aufgaben-Beschreibung (optional)..."
                        rows={3}
                        className={newEvent.description.length > 500 ? "border-red-500" : ""}
                      />
                      <div className="text-xs text-muted-foreground mt-1">
                        {newEvent.description.length}/500 Zeichen
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                        Abbrechen
                      </Button>
                      <Button onClick={handleUpdateEvent} disabled={updateTaskMutation.isPending}>
                        {updateTaskMutation.isPending ? "Aktualisiere..." : "Aktualisieren"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="secondary" className="gap-1.5 sm:gap-2">
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Neuer Termin</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className={`${isMobile ? 'max-w-[95vw] max-h-[90vh] overflow-y-auto' : ''}`}>
                  <DialogHeader>
                    <DialogTitle className={isMobile ? 'text-lg' : ''}>Neuen Termin erstellen</DialogTitle>
                  </DialogHeader>
                  <div className={`${isMobile ? 'space-y-3' : 'space-y-4'}`}>
                    <div>
                       <label className="text-sm font-medium">Titel *</label>
                       <Input
                         value={newEvent.title}
                         onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                         placeholder="Aufgaben-Titel eingeben..."
                         className={newEvent.title.length > 100 ? "border-red-500" : ""}
                       />
                       <div className="text-xs text-muted-foreground mt-1">
                         {newEvent.title.length}/100 Zeichen
                       </div>
                     </div>
                    <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-2 gap-4'}`}>
                      <div>
                        <label className="text-sm font-medium">Typ</label>
                        <Select value={newEvent.type} onValueChange={(value) => setNewEvent({ ...newEvent, type: value as "task" | "homework" })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="task">Aufgabe</SelectItem>
                            <SelectItem value="homework">Hausaufgabe</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Priorität</label>
                        <Select value={newEvent.priority} onValueChange={(value) => setNewEvent({ ...newEvent, priority: value as "low" | "medium" | "high" })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Niedrig</SelectItem>
                            <SelectItem value="medium">Mittel</SelectItem>
                            <SelectItem value="high">Hoch</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Fach</label>
                      <Select value={newEvent.subject_id} onValueChange={(value) => setNewEvent({ ...newEvent, subject_id: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Fach auswählen (optional)" />
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
                       <label className="text-sm font-medium">Fälligkeitsdatum *</label>
                       <Input
                         type="datetime-local"
                         value={newEvent.due_date}
                         onChange={(e) => setNewEvent({ ...newEvent, due_date: e.target.value })}
                         min={new Date().toISOString().slice(0, 16)}
                       />
                     </div>
                    <div>
                      <label className="text-sm font-medium">Zeitraum</label>
                      <Select value={newEvent.time_period} onValueChange={(value) => setNewEvent({ ...newEvent, time_period: value as "day" | "week" | "month" | "quarter" | "half_year" })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="day">Tag</SelectItem>
                          <SelectItem value="week">Woche</SelectItem>
                          <SelectItem value="month">Monat</SelectItem>
                          <SelectItem value="quarter">Quartal</SelectItem>
                          <SelectItem value="half_year">Halbjahr</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                       <label className="text-sm font-medium">Beschreibung</label>
                       <Textarea
                         value={newEvent.description}
                         onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                         placeholder="Aufgaben-Beschreibung (optional)..."
                         rows={3}
                         className={newEvent.description.length > 500 ? "border-red-500" : ""}
                       />
                       <div className="text-xs text-muted-foreground mt-1">
                         {newEvent.description.length}/500 Zeichen
                       </div>
                     </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Abbrechen
                      </Button>
                      <Button onClick={handleCreateEvent} disabled={createTaskMutation.isPending}>
                        {createTaskMutation.isPending ? "Erstelle..." : "Erstellen"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Quick Stats - Only show in list view */}
        {viewMode === "list" && (
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
                      {calendarEvents.filter(e => e.priority === "high" && e.status === "upcoming").length}
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
                      {calendarEvents.filter(e => e.type === "homework" && e.status === "upcoming").length}
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
                      {calendarEvents.filter(e => e.status === "completed").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Content based on view mode */}
        {viewMode === "list" ? (
          /* List View - Events for Selected Date */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Termine
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Date Selector */}
              <div className="flex items-center gap-4 mb-6 p-4 bg-muted/30 rounded-lg">
                <label htmlFor="date-select" className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                  Datum auswählen:
                </label>
                <select
                  id="date-select"
                  value={selectedListDate}
                  onChange={(e) => setSelectedListDate(e.target.value)}
                  className="flex-1 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                >
                  {availableDates.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Events for Selected Date */}
               {eventsForSelectedDate.length > 0 ? (
                 <div className={`${isMobile ? 'space-y-2' : 'space-y-3'}`}>
                    {eventsForSelectedDate.map((event) => (
                      <div key={event.id} className={`${isMobile ? 'flex flex-col gap-2 p-3' : 'flex items-center gap-4 p-3'} border rounded-lg hover:bg-accent/50 transition-colors ${event.status === 'completed' ? 'opacity-70 bg-muted/30' : ''}`}>
                              {isMobile ? (
                                /* Mobile Layout - Stacked */
                                <>
                                  {/* Top Row: Time and Icons */}
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded">
                                        {event.time || 'Ganztägig'}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        {getEventTypeIcon(event.type)}
                                        {getStatusIcon(event.status)}
                                      </div>
                                    </div>
                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-0.5">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleToggleComplete(event)}
                                        className="h-6 w-6 p-0"
                                        title="Als erledigt markieren"
                                      >
                                        <CheckCircle className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEditEvent(event)}
                                        className="h-6 w-6 p-0"
                                        title="Bearbeiten"
                                      >
                                        <Edit className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteEvent(event)}
                                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                        title="Löschen"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                  
                                  {/* Title */}
                                  <h4 className={`text-sm font-medium text-foreground ${event.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>{event.title}</h4>
                                  
                                  {/* Badges */}
                                  <div className="flex items-center gap-1 flex-wrap">
                                    <Badge variant={getEventTypeColor(event.type, event.priority) as any} className="text-xs px-1.5 py-0.5">
                                      {event.type === "homework" ? "Hausaufgabe" : "Aufgabe"}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                                      {event.subject_name}
                                    </Badge>
                                  </div>
                                  
                                  {/* Description */}
                                  {event.description && (
                                    <p className="text-xs text-muted-foreground line-clamp-2">{event.description}</p>
                                  )}
                                </>
                              ) : (
                                /* Desktop Layout - Horizontal */
                                <>
                                  {/* Time Display */}
                                  <div className="flex-shrink-0 text-center min-w-[60px]">
                                    <div className="text-sm font-semibold text-primary">
                                      {event.time || 'Ganztägig'}
                                    </div>
                                  </div>
                                  
                                  {/* Event Type Icons */}
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    {getEventTypeIcon(event.type)}
                                    {getStatusIcon(event.status)}
                                  </div>
                                  
                                  {/* Event Details */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                      <h4 className={`font-medium text-foreground truncate ${event.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>{event.title}</h4>
                                      <Badge variant={getEventTypeColor(event.type, event.priority) as any} className="flex-shrink-0">
                                        {event.type === "homework" ? "Hausaufgabe" : "Aufgabe"}
                                      </Badge>
                                      <Badge variant="outline" className="flex-shrink-0">
                                        {event.subject_name}
                                      </Badge>
                                    </div>
                                    {event.description && (
                                      <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                                    )}
                                  </div>
                                  
                                  {/* Action Buttons */}
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleToggleComplete(event)}
                                      className="h-8 w-8 p-0"
                                      title="Als erledigt markieren"
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEditEvent(event)}
                                      className="h-8 w-8 p-0"
                                      title="Bearbeiten"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteEvent(event)}
                                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                      title="Löschen"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </>
                              )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Keine Termine für dieses Datum</h3>
                      <p className="text-muted-foreground mb-4">
                        Für das ausgewählte Datum sind keine Termine vorhanden.
                      </p>
                      <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
                        <Plus className="w-4 h-4" />
                        Termin erstellen
                      </Button>
                    </div>
                  )}
            </CardContent>
          </Card>
        ) : (
          /* Calendar View */
          <Card>
            <CardContent className="p-6">
              {renderCalendarGrid()}
            </CardContent>
          </Card>
        )}
      </div>
      
      <BottomNavigation t={t} />
    </div>
  );
};

export default Calendar;