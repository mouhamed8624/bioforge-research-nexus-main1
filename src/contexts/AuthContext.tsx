
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
  const [roleSelectionDismissed, setRoleSelectionDismissed] = useState(false);
  
  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      // Use faster query with minimal data and race condition for timeout
      const profilePromise = supabase
        .from("profiles")
        .select("id, email, role, created_at, updated_at")
        .eq("id", userId)
        .maybeSingle();
      
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Profile fetch timeout')), 1000)
      );
      
      const { data, error } = await Promise.race([profilePromise, timeoutPromise]);
      
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
      
      // If user now has a role, hide role selection permanently
      if (profile?.role) {
        setShowRoleSelection(false);
        setRoleSelectionDismissed(true);
        // Cache the role selection state to prevent showing again
        localStorage.setItem(`roleSelected_${currentUser.id}`, 'true');
      }
    }
  };

  const handleAuthStateChange = async (event: string, session: Session | null) => {
    try {
      setSession(session);
      setCurrentUser(session?.user ?? null);
      
      if (session?.user) {
        // Check if user has already selected a role (cached)
        const hasSelectedRole = localStorage.getItem(`roleSelected_${session.user.id}`) === 'true';
        
        if (hasSelectedRole) {
          // User has already selected a role before, don't show dialog
          setRoleSelectionDismissed(true);
          setShowRoleSelection(false);
        } else {
          // Reset dismissal state for new user
          setRoleSelectionDismissed(false);
        }
        
        // Fetch profile with faster timeout
        const profile = await fetchUserProfile(session.user.id);
        setUserProfile(profile);
        
        // Only show role selection if:
        // 1. User doesn't have a role AND
        // 2. Haven't already dismissed it AND 
        // 3. Haven't cached a previous selection
        const needsRoleSelection = !profile?.role && !roleSelectionDismissed && !hasSelectedRole;
        setShowRoleSelection(needsRoleSelection);
        
        // If user has a role, cache that they've completed role selection
        if (profile?.role && !hasSelectedRole) {
          localStorage.setItem(`roleSelected_${session.user.id}`, 'true');
        }
      } else {
        setUserProfile(null);
        setShowRoleSelection(false);
        setRoleSelectionDismissed(false);
      }
    } catch (error) {
      console.error("Error in auth state change:", error);
    } finally {
      // Immediately set loading to false for faster UI response
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    const initializeAuth = async () => {
      try {
        // Get session with timeout for faster response
        const { data: { session }, error } = await Promise.race([
          supabase.auth.getSession(),
          new Promise<{ data: { session: Session | null }, error: any }>((_, reject) =>
            setTimeout(() => reject(new Error('Session timeout')), 800)
          )
        ]);
        
        if (!mounted) return;
        
        if (error) {
          console.error("Error getting session:", error);
          setLoading(false);
          return;
        }
        
        await handleAuthStateChange('INITIAL_SESSION', session);
      } catch (error) {
        console.error("Error initializing auth:", error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Aggressive timeout for ultra-fast loading - force stop after 1 second
    const timeout = setTimeout(() => {
      if (mounted) {
        console.log("Fast auth timeout reached, forcing loading to false");
        setLoading(false);
      }
    }, 1000);

    initializeAuth().finally(() => {
      if (mounted) {
        clearTimeout(timeout);
      }
    });

    return () => {
      mounted = false;
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
      // Clean up role selection cache on logout
      if (currentUser) {
        localStorage.removeItem(`roleSelected_${currentUser.id}`);
      }
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Logout failed:", error);
        throw error;
      }
      setShowRoleSelection(false);
      setRoleSelectionDismissed(false);
      setUserProfile(null);
    } catch (error) {
      console.error("Logout failed:", error);
      throw error;
    }
  };

  const onRoleSelected = () => {
    setShowRoleSelection(false);
    setRoleSelectionDismissed(true);
    
    // Cache that the user has completed role selection
    if (currentUser) {
      localStorage.setItem(`roleSelected_${currentUser.id}`, 'true');
    }
  };
  
  // Show loading only for the first 1 second, then force show app
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
