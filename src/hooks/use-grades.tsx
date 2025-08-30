import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

export interface Grade {
  id: string;
  user_id: string;
  subject_id: string;
  title: string;
  grade: number;
  weight: number;
  date_received: string;
  type: string;
  notes: string | null;
  created_at: string;
}

export const useGrades = (subjectId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["grades", user?.id, subjectId],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from("grades")
        .select("*")
        .eq("user_id", user.id)
        .order("date_received", { ascending: false });

      if (subjectId) {
        query = query.eq("subject_id", subjectId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching grades:", error);
        throw error;
      }

      return data as Grade[];
    },
    enabled: !!user,
  });
};

// Hook to get all grades grouped by subject
export const useGradesBySubject = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["grades-by-subject", user?.id],
    queryFn: async () => {
      if (!user) return {};

      const { data, error } = await supabase
        .from("grades")
        .select("*")
        .eq("user_id", user.id)
        .order("date_received", { ascending: false });

      if (error) {
        console.error("Error fetching grades by subject:", error);
        throw error;
      }

      // Group grades by subject_id
      const gradesBySubject: Record<string, Grade[]> = {};
      data.forEach((grade) => {
        if (!gradesBySubject[grade.subject_id]) {
          gradesBySubject[grade.subject_id] = [];
        }
        gradesBySubject[grade.subject_id].push(grade as Grade);
      });

      return gradesBySubject;
    },
    enabled: !!user,
  });
};