import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { getSupabase } from '../lib/supabase';
import { INITIAL_USERS } from '../lib/mockData';

interface AuthContextType {
  currentUser: UserProfile;
  allUsers: UserProfile[];
  role: UserRole;
  switchUser: (userId: string) => void;
  updateCurrentUserProfile: (profile: Partial<UserProfile>) => void;
  isCloudAuth: boolean;
  signOut: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allUsers, setAllUsers] = useState<UserProfile[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<UserProfile>(INITIAL_USERS[0]);
  const [isCloudAuth, setIsCloudAuth] = useState<boolean>(false);

  useEffect(() => {
    // Check if Supabase client is available
    const supabase = getSupabase();
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setIsCloudAuth(true);
          // fetch user profile from profiles table
          supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
            .then(({ data }) => {
              if (data) {
                setCurrentUser(data);
              }
            });
        }
      });
    }
  }, []);

  const switchUser = (userId: string) => {
    const found = allUsers.find((u) => u.id === userId);
    if (found) {
      setCurrentUser(found);
    }
  };

  const updateCurrentUserProfile = (profile: Partial<UserProfile>) => {
    setCurrentUser((prev) => ({ ...prev, ...profile }));
    setAllUsers((prev) =>
      prev.map((u) => (u.id === currentUser.id ? { ...u, ...profile } : u))
    );
  };

  const signInWithEmail = async (email: string, pass: string) => {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) return { success: false, error: error.message };
        setIsCloudAuth(true);
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    } else {
      // Local demo sign in
      const user = allUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (user) {
        setCurrentUser(user);
        return { success: true };
      }
      return { success: false, error: 'User not found in local roster. Add user in Settings.' };
    }
  };

  const signOut = async () => {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setIsCloudAuth(false);
    setCurrentUser(INITIAL_USERS[0]);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allUsers,
        role: currentUser.role,
        switchUser,
        updateCurrentUserProfile,
        isCloudAuth,
        signOut,
        signInWithEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
