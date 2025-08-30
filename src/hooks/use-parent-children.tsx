import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { Profile } from "./use-profile";

export interface ChildProfile {
  child_id: string;
  child_email: string;
  child_display_name: string;
  child_grade_level: string;
  child_school: string;
}

export interface ParentChildContext {
  isParentMode: boolean;
  selectedChildId: string | null;
  children: ChildProfile[];
  selectChild: (childId: string | null) => void;
  addChild: (email: string) => Promise<{ success: boolean; error?: string }>;
  removeChild: (childId: string) => Promise<void>;
}

export const useParentChildren = () => {
  const { actualUser } = useAuth();
  const queryClient = useQueryClient();

  // Fetch children for parent
  const { data: children = [], isLoading } = useQuery({
    queryKey: ["parent-children", actualUser?.id],
    queryFn: async () => {
      if (!actualUser) return [];

      try {
        // Use the database function instead of direct table query
        const { data, error } = await supabase.rpc('get_parent_children', {
          parent_user_id: actualUser.id
        });

        if (error) {
          console.error('Error fetching children:', error);
          // Return empty array instead of throwing for type mismatch errors
          if (error.code === '42804' || error.message.includes('type')) {
            console.warn('Database type mismatch detected, returning empty children list');
            return [];
          }
          throw error;
        }

        // Transform the data to match ChildProfile interface
        // Handle potential type mismatches by explicitly converting to strings
        const childProfiles: ChildProfile[] = data?.map((item: any) => ({
          child_id: item.child_id,
          child_email: String(item.child_email || ""),
          child_display_name: String(item.child_display_name || ""),
          child_grade_level: String(item.child_grade_level || ""),
          child_school: String(item.child_school || ""),
        })) || [];

        console.log('Fetched children:', childProfiles);
        return childProfiles;
      } catch (error) {
        console.error('Error in parent-children query:', error);
        return [];
      }
    },
    enabled: !!actualUser,
    retry: false, // Don't retry on type mismatch errors
  });

  // Add child mutation
  const addChildMutation = useMutation({
    mutationFn: async (email: string) => {
      if (!actualUser) throw new Error("User not authenticated");

      console.log('Attempting to add child with email:', email);
      
      // Use the database function to link child
      const { data, error } = await supabase.rpc('link_child_to_parent', {
        parent_user_id: actualUser.id,
        child_email: email
      });

      console.log('Database response:', { data, error });

      if (error) {
        console.error("Error linking child:", error);
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      console.log('Add child mutation successful:', data);
      queryClient.invalidateQueries({ queryKey: ["parent-children", actualUser?.id] });
    },
    onError: (error) => {
      console.error('Add child mutation failed:', error);
    },
  });

  // Remove child mutation
  const removeChildMutation = useMutation({
    mutationFn: async (childId: string) => {
      if (!actualUser) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("parent_child_relationships")
        .delete()
        .eq("parent_id", actualUser.id)
        .eq("child_id", childId);

      if (error) {
        console.error("Error removing child:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parent-children", actualUser?.id] });
    },
  });

  const addChild = async (email: string) => {
    try {
      const result = await addChildMutation.mutateAsync(email);
      
      // Check if the database function returned an error
      if (result && typeof result === 'object' && 'success' in result && !result.success) {
        const errorMsg = 'error' in result ? String(result.error) : "Failed to add child";
        throw new Error(errorMsg);
      }
      
      return result;
    } catch (error: any) {
      console.error('Error adding child:', error);
      throw new Error(error.message || "Failed to add child");
    }
  };

  const removeChild = async (childId: string) => {
    await removeChildMutation.mutateAsync(childId);
  };

  return {
    children,
    isLoading,
    addChild,
    removeChild,
    isAddingChild: addChildMutation.isPending,
    isRemovingChild: removeChildMutation.isPending,
  };
};

// Hook for getting child profile data when parent is viewing child's account
export const useChildProfile = (childId: string | null) => {
  return useQuery({
    queryKey: ["child-profile", childId],
    queryFn: async () => {
      if (!childId) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", childId)
        .single();

      if (error) {
        console.error("Error fetching child profile:", error);
        throw error;
      }

      return data as Profile;
    },
    enabled: !!childId,
  });
};