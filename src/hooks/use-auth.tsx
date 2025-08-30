import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  actualUser: User | null; // The actual logged-in user (parent)
  isViewingAsChild: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [actualUser, setActualUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Handle token refresh errors
        if (event === 'TOKEN_REFRESHED' && !session) {
          // Clear any stored session data and redirect to auth
          setSession(null);
          setActualUser(null);
          setUser(null);
          setLoading(false);
          navigate('/auth');
          return;
        }
        
        // Handle sign out events
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setActualUser(null);
          setUser(null);
          setSelectedChildId(null);
          setLoading(false);
          return;
        }
        
        setSession(session);
        setActualUser(session?.user ?? null);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Get initial session with error handling
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Session error:', error);
        // If there's an error getting the session (like invalid refresh token),
        // clear the state and redirect to auth
        if (error.message.includes('refresh_token_not_found') || 
            error.message.includes('Invalid Refresh Token')) {
          setSession(null);
          setActualUser(null);
          setUser(null);
          setLoading(false);
          navigate('/auth');
          return;
        }
      }
      
      setSession(session);
      setActualUser(session?.user ?? null);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const signOut = async () => {
    try {
      // Always attempt to sign out, regardless of session state
      const { error } = await supabase.auth.signOut();
      
      // Don't treat AuthSessionMissingError as a real error
      if (error && error.message !== "Auth session missing!") {
        console.error("Sign out error:", error);
        toast.error("Failed to sign out: " + error.message);
      } else {
        console.log("Sign out successful, navigating to auth...");
        toast.success("Signed out successfully!");
      }
      
      // Force a page reload to ensure clean state
      window.location.href = "/auth";
    } catch (error) {
      console.error("Sign out failed:", error);
      toast.error("Sign out failed");
      // Force a page reload to ensure clean state
      window.location.href = "/auth";
    }
  };

  // Effect to handle child selection and create virtual child user
  useEffect(() => {
    const handleChildSelection = async () => {
      if (selectedChildId && actualUser) {
        // Create a virtual user object for the selected child
        const childUser = {
          ...actualUser,
          id: selectedChildId,
          user_metadata: {
            ...actualUser.user_metadata,
            account_type: 'student'
          }
        };
        setUser(childUser);
        // Invalidate all queries to refresh data for the selected child
        queryClient.invalidateQueries();
      } else {
        setUser(actualUser);
        // Invalidate all queries to refresh data for the actual user
        queryClient.invalidateQueries();
      }
    };

    handleChildSelection();
  }, [selectedChildId, actualUser]);

  // Listen for parent context changes
  useEffect(() => {
    const handleParentContextChange = (event: CustomEvent) => {
      setSelectedChildId(event.detail.selectedChildId);
    };

    window.addEventListener('parentContextChange', handleParentContextChange as EventListener);
    return () => {
      window.removeEventListener('parentContextChange', handleParentContextChange as EventListener);
    };
  }, []);

  const value = {
    user,
    session,
    loading,
    signOut,
    actualUser,
    isViewingAsChild: !!selectedChildId,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};