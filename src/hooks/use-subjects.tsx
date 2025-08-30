import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

export interface Subject {
  id: string;
  user_id: string;
  name: string;
  teacher: string | null;
  room: string | null;
  color: string;
  current_grade: number | null;
  target_grade: number | null;
  credits: number;
  course_type: 'LK' | 'GK';
  created_at: string;
  updated_at: string;
}

export const useSubjects = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["subjects", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .eq("user_id", user.id)
        .order("name");

      if (error) {
        console.error("Error fetching subjects:", error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user,
  });
};