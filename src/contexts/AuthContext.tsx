
import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  id: string;
  email: string | null;
  role: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  session: Session | null;
  isAuthenticated: boolean;
  loading: boolean;
  showRoleSelection: boolean;
  login: (email: string, password: string) => Promise<{ error: any }>;
  signup: (email: string, password: string) => Promise<{ error: any }>;
  logout: () => Promise<void>;
  onRoleSelected: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching user profile:", error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (currentUser) {
      const profile = await fetchUserProfile(currentUser.id);
      setUserProfile(profile);
      
      if (profile?.role) {
        setShowRoleSelection(false);
      }
    }
  };

  const handleAuthStateChange = async (event: string, session: Session | null) => {
    try {
      setSession(session);
      setCurrentUser(session?.user ?? null);
      
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        setUserProfile(profile);
        
        const needsRoleSelection = !profile?.role;
        setShowRoleSelection(needsRoleSelection);
      } else {
        setUserProfile(null);
        setShowRoleSelection(false);
      }
    } catch (error) {
      console.error("Error in auth state change:", error);
    } finally {
      // Always set loading to false, regardless of success or failure
      setLoading(false);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Error getting session:", error);
          setLoading(false);
          return;
        }
        
        await handleAuthStateChange('INITIAL_SESSION', session);
      } catch (error) {
        console.error("Error initializing auth:", error);
        setLoading(false);
      }
    };

    // Fast timeout for better performance - force stop loading after 2 seconds
    const timeout = setTimeout(() => {
      console.log("Auth timeout reached, forcing loading to false");
      setLoading(false);
    }, 2000); // Reduced to 2 seconds for faster response

    initializeAuth().finally(() => {
      clearTimeout(timeout);
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error("Login failed:", error);
        return { error };
      }
      
      return { error: null };
    } catch (error) {
      console.error("Login failed:", error);
      return { error };
    }
  };
  
  const signup = async (email: string, password: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });
      
      if (error) {
        console.error("Signup failed:", error);
        return { error };
      }
      
      return { error: null };
    } catch (error) {
      console.error("Signup failed:", error);
      return { error };
    }
  };
  
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Logout failed:", error);
        throw error;
      }
      setShowRoleSelection(false);
      setUserProfile(null);
    } catch (error) {
      console.error("Logout failed:", error);
      throw error;
    }
  };

  const onRoleSelected = () => {
    setShowRoleSelection(false);
  };
  
  const shouldShowLoading = loading && !showRoleSelection;
  
  const value = useMemo(() => ({
    currentUser,
    userProfile,
    session,
    isAuthenticated: !!currentUser,
    loading: shouldShowLoading,
    showRoleSelection,
    login,
    signup,
    logout,
    onRoleSelected,
    refreshProfile
  }), [currentUser, userProfile, session, shouldShowLoading, showRoleSelection]);
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
