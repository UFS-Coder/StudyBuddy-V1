import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  completed: boolean;
  priority: "low" | "medium" | "high";
  time_period: "day" | "week" | "month" | "quarter" | "half_year";
  subject_id: string | null;
  type: "task" | "homework";
  created_at: string;
  updated_at: string;
}

export const useTasks = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["tasks", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .order("due_date", { nullsFirst: false });

      if (error) {
        console.error("Error fetching tasks:", error);
        throw error;
      }

      return data as Task[];
    },
    enabled: !!user,
  });
};

export const useTasksBySubject = (subjectId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["tasks", user?.id, subjectId],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .eq("subject_id", subjectId)
        .order("due_date", { nullsFirst: false });

      if (error) {
        console.error("Error fetching tasks:", error);
        throw error;
      }

      return data as Task[];
    },
    enabled: !!user,
  });
};

// Helper function to get open tasks count for a subject
export const getOpenTasksCount = (tasks: Task[], subjectId: string): number => {
  return tasks.filter(task => 
    task.subject_id === subjectId && 
    !task.completed &&
    (!task.due_date || new Date(task.due_date) >= new Date())
  ).length;
};

// Helper function to get total open tasks count
export const getTotalOpenTasksCount = (tasks: Task[]): number => {
  return tasks.filter(task => 
    !task.completed &&
    (!task.due_date || new Date(task.due_date) >= new Date())
  ).length;
};

// Helper function to get open homework count for a subject
export const getOpenHomeworkCount = (tasks: Task[], subjectId: string): number => {
  return tasks.filter(task => 
    task.subject_id === subjectId && 
    task.type === "homework" &&
    !task.completed &&
    (!task.due_date || new Date(task.due_date) >= new Date())
  ).length;
};

// Helper function to get total open homework count
export const getTotalOpenHomeworkCount = (tasks: Task[]): number => {
  return tasks.filter(task => 
    task.type === "homework" &&
    !task.completed &&
    (!task.due_date || new Date(task.due_date) >= new Date())
  ).length;
};