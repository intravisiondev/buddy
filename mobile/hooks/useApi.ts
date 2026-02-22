import { useState, useEffect } from 'react';
import { authService } from '../services/auth.service';
import { storage } from '../utils/storage';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  age?: number;
  xp?: number;
  level?: number;
  gems?: number;
  tokens?: number;
  avatar?: string;
  badges?: string[];
  created_at?: string;
}

export function useApiAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await storage.getToken();
      if (token) {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      await storage.clearAll();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await authService.login(email, password);
    await storage.setToken(response.token);
    await storage.setUser(response.user);
    await storage.setRole(response.user.role);
    setUser(response.user);
    return response;
  };

  const signup = async (email: string, password: string, name: string, age: number, role: string) => {
    const response = await authService.signup(email, password, name, age, role);
    await storage.setToken(response.token);
    await storage.setUser(response.user);
    await storage.setRole(response.user.role);
    setUser(response.user);
    return response;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await storage.clearAll();
      setUser(null);
    }
  };

  return {
    user,
    loading,
    login,
    signup,
    logout,
  };
}
