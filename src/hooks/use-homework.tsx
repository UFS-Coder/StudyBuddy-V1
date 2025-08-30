import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export interface Homework {
  id: string;
  title: string;
  description: string;
  due_date: string;
  completed: boolean;
  submitted_at: string | null;
  time_period: "day" | "week" | "month" | "quarter" | "half_year";
  subject_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export const useHomework = () => {
  const { user } = useAuth();
  
  return useQuery({
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
};

export const useHomeworkBySubject = (subjectId: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["homework", user?.id, subjectId],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("homework")
        .select("*")
        .eq("user_id", user.id)
        .eq("subject_id", subjectId)
        .order("due_date");
      
      if (error) throw error;
      return data as Homework[];
    },
    enabled: !!user && !!subjectId,
  });
};

// Helper function to check if homework is overdue
export const isHomeworkOverdue = (dueDate: string): boolean => {
  return new Date(dueDate) < new Date();
};

// Helper function to get open homework count for a specific subject
export const getOpenHomeworkCount = (homework: Homework[], subjectId: string): number => {
  return homework.filter(hw => 
    hw.subject_id === subjectId && 
    !hw.completed && 
    !isHomeworkOverdue(hw.due_date)
  ).length;
};

// Helper function to get total open homework count
export const getTotalOpenHomeworkCount = (homework: Homework[]): number => {
  return homework.filter(hw => 
    !hw.completed && 
    !isHomeworkOverdue(hw.due_date)
  ).length;
};

// Helper function to get overdue homework count
export const getOverdueHomeworkCount = (homework: Homework[]): number => {
  return homework.filter(hw => 
    !hw.completed && 
    isHomeworkOverdue(hw.due_date)
  ).length;
};