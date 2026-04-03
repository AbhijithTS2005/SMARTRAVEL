'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, type AuthResponse } from '@/services/auth';
import { storage } from '@/utils/storage';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, passwordConfirmation: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check for existing auth on mount
  useEffect(() => {
    const token = storage.getToken();
    const storedUser = storage.getUser();

    if (token && storedUser && storedUser.id) {
      setUser(storedUser);
    }

    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response: AuthResponse = await authService.login({ email, password });
      
      authService.storeAuthData(response.token, response.user);
      setUser(response.user);
      
      router.push('/dashboard');
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      throw new Error(message || 'Login failed');
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    passwordConfirmation: string
  ) => {
    try {
      const response: AuthResponse = await authService.register({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });

      authService.storeAuthData(response.token, response.user);
      setUser(response.user);

      router.push('/preferences');
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      throw new Error(message || 'Registration failed');
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      router.push('/auth/login');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
