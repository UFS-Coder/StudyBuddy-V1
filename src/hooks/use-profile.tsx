import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  grade_level: string | null;
  school: string | null;
  account_type: 'student' | 'parent';
  created_at: string;
  updated_at: string;
}

export const useProfile = () => {
  const { user, actualUser, isViewingAsChild } = useAuth();

  return useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        throw error;
      }

      return data as Profile;
    },
    enabled: !!user,
  });
};

// Hook to get the actual parent's profile (not the child's)
export const useParentProfile = () => {
  const { actualUser } = useAuth();

  return useQuery({
    queryKey: ["parent-profile", actualUser?.id],
    queryFn: async () => {
      if (!actualUser) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", actualUser.id)
        .single();

      if (error) {
        console.error("Error fetching parent profile:", error);
        throw error;
      }

      return data as Profile;
    },
    enabled: !!actualUser,
  });
};