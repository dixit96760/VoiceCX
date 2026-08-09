import React, { createContext, useState, useEffect } from 'react';
import { getAuthToken, loginUser, logoutUser, getMe } from '../services/api';

export interface UserProfile {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  restaurantName?: string;
  phone?: string;
}

export interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = getAuthToken();
      if (token) {
        const u = await getMe();
        if (u) {
          setUser(u);
        } else {
          setUser({
            name: 'Chef Sarah Jenkins',
            email: 'owner@y6bistro.com',
            restaurantName: 'Y6 Gourmet Bistro',
            phone: '+1 (555) 234-5678',
          });
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    const res = await loginUser(email, password);
    if (res.success && res.user) {
      setUser(res.user);
      setLoading(false);
      return { success: true };
    }
    setLoading(false);
    return { success: false, message: res.message || 'Invalid credentials' };
  };

  const logout = () => {
    logoutUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
