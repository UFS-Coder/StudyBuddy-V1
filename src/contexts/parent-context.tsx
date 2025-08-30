import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useParentProfile } from "@/hooks/use-profile";
import { useParentChildren, ChildProfile } from "@/hooks/use-parent-children";
import { useQueryClient } from "@tanstack/react-query";

interface ParentContextType {
  isParentMode: boolean;
  selectedChildId: string | null;
  selectedChild: ChildProfile | null;
  children: ChildProfile[];
  selectChild: (childId: string | null) => void;
  addChild: (email: string) => Promise<any>;
  removeChild: (childId: string) => Promise<void>;
  isAddingChild: boolean;
  isRemovingChild: boolean;
  resetContext: () => void;
}

const ParentContext = createContext<ParentContextType | undefined>(undefined);

export const useParentContext = () => {
  const context = useContext(ParentContext);
  if (context === undefined) {
    throw new Error("useParentContext must be used within a ParentProvider");
  }
  return context;
};

interface ParentProviderProps {
  children: ReactNode;
}

export const ParentProvider = ({ children }: ParentProviderProps) => {
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const { data: parentProfile } = useParentProfile();
  const queryClient = useQueryClient();
  const {
    children: childrenList,
    addChild,
    removeChild,
    isAddingChild,
    isRemovingChild,
  } = useParentChildren();

  const isParentMode = parentProfile?.account_type === "parent";
  const selectedChild = childrenList.find(child => child.child_id === selectedChildId) || null;

  // Auto-select first child when children are loaded and no child is selected
  useEffect(() => {
    if (isParentMode && childrenList.length > 0 && !selectedChildId) {
      const firstChild = childrenList[0];
      if (firstChild?.child_id) {
        selectChild(firstChild.child_id);
      }
    }
  }, [isParentMode, childrenList, selectedChildId]);

  const selectChild = (childId: string | null) => {
    setSelectedChildId(childId);
    
    // Invalidate all queries to ensure fresh data for the selected child
    queryClient.invalidateQueries();
    
    // Dispatch custom event to notify auth context
    window.dispatchEvent(new CustomEvent('parentContextChange', {
      detail: { selectedChildId: childId }
    }));
  };

  const resetContext = () => {
    setSelectedChildId(null);
  };

  const value = {
    isParentMode,
    selectedChildId,
    selectedChild,
    children: childrenList,
    selectChild,
    addChild,
    removeChild,
    isAddingChild,
    isRemovingChild,
    resetContext,
  };

  return (
    <ParentContext.Provider value={value}>
      {children}
    </ParentContext.Provider>
  );
};