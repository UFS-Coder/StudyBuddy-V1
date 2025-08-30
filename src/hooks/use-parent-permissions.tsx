import { useParentContext } from "@/contexts/parent-context";

/**
 * Hook to check if the current user has permission to edit data
 * Returns false when in parent mode (viewing child data)
 * Returns true for normal user mode
 */
export const useCanEdit = () => {
  const { isParentMode } = useParentContext();
  
  // Parents can only view child data, not edit it
  return !isParentMode;
};

/**
 * Hook to get appropriate user ID for data operations
 * Returns selected child ID when in parent mode
 * Returns current user ID in normal mode
 */
export const useDataUserId = () => {
  const { isParentMode, selectedChildId } = useParentContext();
  
  if (isParentMode && selectedChildId) {
    return selectedChildId;
  }
  
  return null; // Will use current user from useAuth
};