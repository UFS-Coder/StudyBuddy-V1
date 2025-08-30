import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Users, Calendar, CheckSquare, FileText, PenTool, Target } from "lucide-react";
import { SubjectManager } from "./admin/subject-manager";
import { SyllabusManager } from "./admin/syllabus-manager";
import { TaskManager } from "./admin/task-manager";
import { HomeworkManager } from "./admin/homework-manager";
import { NotesManager } from "./admin/notes-manager";

export const AdminConsole = () => {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Admin Console</h2>
        <p className="text-muted-foreground">
          Manage your subjects, syllabus, tasks, and academic content
        </p>
      </div>

      <Tabs defaultValue="subjects" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="subjects" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Subjects</span>
          </TabsTrigger>
          <TabsTrigger value="syllabus" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Syllabus</span>
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Tasks</span>
          </TabsTrigger>
          <TabsTrigger value="homework" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Homework</span>
          </TabsTrigger>
          <TabsTrigger value="notes" className="flex items-center gap-2">
            <PenTool className="h-4 w-4" />
            <span className="hidden sm:inline">Notes</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="subjects">
          <SubjectManager />
        </TabsContent>

        <TabsContent value="syllabus">
          <SyllabusManager />
        </TabsContent>

        <TabsContent value="tasks">
          <TaskManager />
        </TabsContent>

        <TabsContent value="homework">
          <HomeworkManager />
        </TabsContent>

        <TabsContent value="notes">
          <NotesManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};