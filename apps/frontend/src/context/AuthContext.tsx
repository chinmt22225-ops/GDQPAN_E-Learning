import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../api/client.js';
import { UserSessionData } from '@elearning/shared';

interface AuthContextType {
  user: UserSessionData | null;
  loading: boolean;
  login: (identifier: string, pass: string) => Promise<UserSessionData>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSessionData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const res = await apiRequest<{ user: UserSessionData }>('/api/auth/me');
      if (res.success && res.data?.user) {
        setUser(res.data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (identifier: string, password: string): Promise<UserSessionData> => {
    const res = await apiRequest<{ user: UserSessionData }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });

    if (res.success && res.data?.user) {
      setUser(res.data.user);
      return res.data.user;
    }
    throw new Error(res.message || 'Đăng nhập không thành công.');
  };

  const logout = async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
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
