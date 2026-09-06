import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole, UserPermissions } from '../types';
import { getSupabase } from '../lib/supabase';
import { INITIAL_USERS, MASTER_PERMISSIONS } from '../lib/mockData';
import { loadCollection, saveCollection, STORES } from '../lib/indexedDb';

interface AuthContextType {
  currentUser: UserProfile | null;
  isAuthenticated: boolean;
  allUsers: UserProfile[];
  role: UserRole;
  permissions: UserPermissions;
  isCloudConnected: boolean;
  login: (identifier: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  createUser: (userData: {
    username: string;
    email: string;
    password: string;
    full_name: string;
    role: UserRole;
    avatar_color?: string;
    permissions: UserPermissions;
  }) => Promise<{ success: boolean; error?: string }>;
  updateUser: (userId: string, updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  deleteUser: (userId: string) => Promise<{ success: boolean; error?: string }>;
  syncUsersWithCloud: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'ruhit_crm_auth_user_id';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allUsers, setAllUsers] = useState<UserProfile[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Initialize users from IndexedDB and Cloud
  useEffect(() => {
    const initUsers = async () => {
      try {
        // 1. Try loading from IndexedDB
        const cachedUsers = await loadCollection<UserProfile>(STORES.USERS);
        let activeRoster = INITIAL_USERS;

        if (cachedUsers && cachedUsers.length > 0) {
          // Ensure ruhit111 master user always exists
          const hasOwner = cachedUsers.some(
            (u) => u.username?.toLowerCase() === 'ruhit111' || u.id === 'usr-ruhit-owner'
          );
          if (!hasOwner) {
            activeRoster = [...INITIAL_USERS, ...cachedUsers];
          } else {
            activeRoster = cachedUsers;
          }
        } else {
          // First time initialization: save INITIAL_USERS to IndexedDB
          await saveCollection(STORES.USERS, INITIAL_USERS);
        }

        setAllUsers(activeRoster);

        // 2. Check if a valid session is saved
        const savedUserId = localStorage.getItem(AUTH_STORAGE_KEY);
        if (savedUserId) {
          const match = activeRoster.find((u) => u.id === savedUserId);
          if (match) {
            setCurrentUser(match);
          }
        }

        // 3. Connect to Supabase and sync cloud users
        const supabase = getSupabase();
        if (supabase) {
          setIsCloudConnected(true);
          try {
            const { data: cloudUsers, error } = await supabase
              .from('app_users')
              .select('*');

            if (!error && cloudUsers && cloudUsers.length > 0) {
              // Merge cloud users with local roster
              const mergedMap = new Map<string, UserProfile>();
              activeRoster.forEach((u) => mergedMap.set(u.id, u));
              cloudUsers.forEach((cu: any) => {
                mergedMap.set(cu.id, {
                  id: cu.id,
                  username: cu.username || cu.email.split('@')[0],
                  email: cu.email,
                  password: cu.password || 'Babor@123',
                  full_name: cu.full_name || cu.name,
                  role: cu.role || 'team_member',
                  avatar_color: cu.avatar_color || '#00C2FF',
                  permissions: cu.permissions || MASTER_PERMISSIONS,
                  created_at: cu.created_at,
                });
              });

              const updatedList = Array.from(mergedMap.values());
              setAllUsers(updatedList);
              await saveCollection(STORES.USERS, updatedList);

              if (savedUserId && mergedMap.has(savedUserId)) {
                setCurrentUser(mergedMap.get(savedUserId)!);
              }
            } else if (!error && (!cloudUsers || cloudUsers.length === 0)) {
              // Seed owner into Supabase if empty
              await supabase.from('app_users').insert([
                {
                  id: 'usr-ruhit-owner',
                  username: 'ruhit111',
                  email: 'ruhit111@ros.com',
                  password: 'Babor@123',
                  full_name: 'Ruhit (Owner)',
                  role: 'admin',
                  permissions: MASTER_PERMISSIONS,
                },
              ]);
            }
          } catch (cloudErr) {
            console.warn('[AuthContext] Cloud app_users sync notice:', cloudErr);
          }
        }
      } catch (err) {
        console.error('[AuthContext] Initialization error:', err);
      } finally {
        setIsInitialized(true);
      }
    };

    initUsers();
  }, []);

  const login = async (identifier: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = pass.trim();

    // 1. Search in local and IndexedDB roster
    let user = allUsers.find(
      (u) =>
        (u.username && u.username.toLowerCase() === cleanId) ||
        (u.email && u.email.toLowerCase() === cleanId)
    );

    // If ruhit111 master credentials matched directly
    if (!user && (cleanId === 'ruhit111' || cleanId === 'ruhit111@ros.com')) {
      user = INITIAL_USERS[0];
    }

    // 2. Try Supabase cloud lookup if not found locally
    const supabase = getSupabase();
    if (!user && supabase) {
      try {
        const { data, error } = await supabase
          .from('app_users')
          .select('*')
          .or(`username.ilike.${cleanId},email.ilike.${cleanId}`)
          .maybeSingle();

        if (!error && data) {
          user = {
            id: data.id,
            username: data.username,
            email: data.email,
            password: data.password,
            full_name: data.full_name,
            role: data.role,
            avatar_color: data.avatar_color || '#00C2FF',
            permissions: data.permissions || MASTER_PERMISSIONS,
            created_at: data.created_at,
          };
          // Add to local state
          setAllUsers((prev) => [...prev, user!]);
          await saveCollection(STORES.USERS, [...allUsers, user]);
        }
      } catch (err) {
        console.warn('Cloud login lookup notice:', err);
      }
    }

    if (!user) {
      return { success: false, error: 'Invalid username or email. Please check your credentials.' };
    }

    // Check password
    if (user.password !== cleanPass) {
      return { success: false, error: 'Incorrect password. Please try again.' };
    }

    setCurrentUser(user);
    localStorage.setItem(AUTH_STORAGE_KEY, user.id);
    return { success: true };
  };

  const logout = async (): Promise<void> => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setCurrentUser(null);
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        // ignore
      }
    }
  };

  const createUser = async (userData: {
    username: string;
    email: string;
    password: string;
    full_name: string;
    role: UserRole;
    avatar_color?: string;
    permissions: UserPermissions;
  }): Promise<{ success: boolean; error?: string }> => {
    const cleanUsername = userData.username.trim();
    const cleanEmail = userData.email.trim().toLowerCase();

    // Check duplicate username or email
    const exists = allUsers.some(
      (u) =>
        u.username?.toLowerCase() === cleanUsername.toLowerCase() ||
        u.email?.toLowerCase() === cleanEmail
    );

    if (exists) {
      return { success: false, error: 'A user with this username or email already exists.' };
    }

    const newUser: UserProfile = {
      id: 'usr-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      username: cleanUsername,
      email: cleanEmail,
      password: userData.password,
      full_name: userData.full_name,
      role: userData.role,
      avatar_color: userData.avatar_color || '#00E5A0',
      permissions: userData.permissions,
      created_at: new Date().toISOString(),
    };

    const updated = [...allUsers, newUser];
    setAllUsers(updated);
    await saveCollection(STORES.USERS, updated);

    // Sync to Supabase
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('app_users').insert([newUser]);
      } catch (err) {
        console.warn('Failed to sync new user to Supabase:', err);
      }
    }

    return { success: true };
  };

  const updateUser = async (
    userId: string,
    updates: Partial<UserProfile>
  ): Promise<{ success: boolean; error?: string }> => {
    const updated = allUsers.map((u) => (u.id === userId ? { ...u, ...updates } : u));
    setAllUsers(updated);
    await saveCollection(STORES.USERS, updated);

    if (currentUser?.id === userId) {
      setCurrentUser((prev) => (prev ? { ...prev, ...updates } : null));
    }

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('app_users').update(updates).eq('id', userId);
      } catch (err) {
        console.warn('Failed to update user in Supabase:', err);
      }
    }

    return { success: true };
  };

  const deleteUser = async (userId: string): Promise<{ success: boolean; error?: string }> => {
    const target = allUsers.find((u) => u.id === userId);
    if (!target) return { success: false, error: 'User not found.' };

    if (target.username?.toLowerCase() === 'ruhit111' || target.id === 'usr-ruhit-owner') {
      return { success: false, error: 'The Master Owner account (ruhit111) cannot be deleted.' };
    }

    const updated = allUsers.filter((u) => u.id !== userId);
    setAllUsers(updated);
    await saveCollection(STORES.USERS, updated);

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('app_users').delete().eq('id', userId);
      } catch (err) {
        console.warn('Failed to delete user in Supabase:', err);
      }
    }

    return { success: true };
  };

  const syncUsersWithCloud = async (): Promise<void> => {
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      const { data, error } = await supabase.from('app_users').select('*');
      if (!error && data && data.length > 0) {
        const mergedMap = new Map<string, UserProfile>();
        allUsers.forEach((u) => mergedMap.set(u.id, u));
        data.forEach((cu: any) => {
          mergedMap.set(cu.id, {
            id: cu.id,
            username: cu.username || cu.email.split('@')[0],
            email: cu.email,
            password: cu.password || 'Babor@123',
            full_name: cu.full_name || cu.name,
            role: cu.role || 'team_member',
            avatar_color: cu.avatar_color || '#00C2FF',
            permissions: cu.permissions || MASTER_PERMISSIONS,
            created_at: cu.created_at,
          });
        });
        const updated = Array.from(mergedMap.values());
        setAllUsers(updated);
        await saveCollection(STORES.USERS, updated);
      }
    } catch (err) {
      console.warn('Manual cloud user sync error:', err);
    }
  };

  const effectivePermissions: UserPermissions = currentUser?.permissions || MASTER_PERMISSIONS;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        allUsers,
        role: currentUser?.role || 'team_member',
        permissions: effectivePermissions,
        isCloudConnected,
        login,
        logout,
        createUser,
        updateUser,
        deleteUser,
        syncUsersWithCloud,
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
