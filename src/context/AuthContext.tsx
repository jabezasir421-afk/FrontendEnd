import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole } from '../types';
import { api, setToken, removeToken } from '../services/api';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  token?: string;
}

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  isBackendOnline: boolean;
  refreshBackendStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('bluecollar_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    // Default initial user for instant usability
    return {
      id: 'cust-1',
      email: 'hans.gugelot@standard.ch',
      fullName: 'Hans Gugelot',
      role: 'CUSTOMER',
    };
  });

  const [isBackendOnline, setIsBackendOnline] = useState<boolean>(false);

  const refreshBackendStatus = async () => {
    const online = await api.checkLive();
    setIsBackendOnline(online);
  };

  useEffect(() => {
    refreshBackendStatus();
    const interval = setInterval(refreshBackendStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    setUser(res.user);
  };

  const logout = () => {
    removeToken();
    setUser(null);
  };

  const switchRole = (newRole: UserRole) => {
    let mockUser: User;
    if (newRole === 'ADMIN') {
      mockUser = {
        id: 'admin-1',
        email: 'admin@bluecollar.in',
        fullName: 'Platform Overseer',
        role: 'ADMIN',
      };
    } else if (newRole === 'WORKER') {
      mockUser = {
        id: 'w-101',
        email: 'dieter.ramsen@trade.ch',
        fullName: 'Dieter Ramsen',
        role: 'WORKER',
      };
    } else {
      mockUser = {
        id: 'cust-1',
        email: 'hans.gugelot@standard.ch',
        fullName: 'Hans Gugelot',
        role: 'CUSTOMER',
      };
    }
    const token = `token-${newRole.toLowerCase()}-session`;
    setToken(token);
    setUser(mockUser);
    localStorage.setItem('bluecollar_user', JSON.stringify(mockUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user ? user.role : 'CUSTOMER',
        isAuthenticated: !!user,
        login,
        logout,
        switchRole,
        isBackendOnline,
        refreshBackendStatus,
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
