import { useState, useEffect, createContext, useContext } from 'react';
import { User } from "@shared/schema";

export interface AuthUser {
  id: number;
  email: string;
  role: string;
}

class AuthService {
  private user: AuthUser | null = null;
  private listeners: Array<(user: AuthUser | null) => void> = [];

  constructor() {
    // Try to load user from localStorage on initialization
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem('authUser');
      if (stored) {
        this.user = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load user from storage:', error);
    }
  }

  private saveToStorage(user: AuthUser | null) {
    try {
      if (user) {
        localStorage.setItem('authUser', JSON.stringify(user));
      } else {
        localStorage.removeItem('authUser');
      }
    } catch (error) {
      console.error('Failed to save user to storage:', error);
    }
  }

  getCurrentUser(): AuthUser | null {
    return this.user;
  }

  setCurrentUser(user: AuthUser | null) {
    this.user = user;
    this.saveToStorage(user);
    this.listeners.forEach(listener => listener(user));
  }

  isAuthenticated(): boolean {
    return this.user !== null;
  }

  isSupplier(): boolean {
    return this.user?.role === 'supplier';
  }

  isBuyer(): boolean {
    return this.user?.role === 'buyer';
  }

  logout() {
    this.user = null;
    this.saveToStorage(null);
    this.listeners.forEach(listener => listener(null));
  }

  subscribe(listener: (user: AuthUser | null) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
}

export const authService = new AuthService();

export const getAuthHeaders = (): Record<string, string> => {
  const user = authService.getCurrentUser();
  return user ? { 'user-id': user.id.toString() } : {};
};

// Hook for using auth in components
export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(authService.getCurrentUser());

  useEffect(() => {
    const unsubscribe = authService.subscribe(setUser);
    return unsubscribe;
  }, []);

  return {
    user,
    login: (user: AuthUser) => authService.setCurrentUser(user),
    logout: () => authService.logout(),
    isAuthenticated: () => authService.isAuthenticated(),
    isSupplier: () => authService.isSupplier(),
    isBuyer: () => authService.isBuyer(),
  };
};
