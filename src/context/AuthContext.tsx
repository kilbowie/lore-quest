
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthState } from '../types';
import { getCurrentUser, loginUser, logoutUser, createUser } from '../utils/authUtils';
import { toast } from '@/components/ui/sonner';

interface AuthContextType extends AuthState {
  login: (usernameOrEmail: string, password: string) => Promise<boolean>;
  logout: () => void;
  signup: (name: string, email: string, username: string, password: string) => Promise<boolean>;
  updateCurrentUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true
  });

  useEffect(() => {
    // Check if user is already logged in on mount
    const user = getCurrentUser();
    setAuthState({
      isAuthenticated: !!user,
      user,
      isLoading: false
    });
  }, []);

  const login = async (usernameOrEmail: string, password: string): Promise<boolean> => {
    try {
      const user = loginUser(usernameOrEmail, password);
      
      if (user) {
        setAuthState({
          isAuthenticated: true,
          user,
          isLoading: false
        });
        toast.success(`Welcome back, ${user.name}!`);
        return true;
      } else {
        toast.error('Invalid username/email or password');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please try again.');
      return false;
    }
  };

  const logout = () => {
    logoutUser();
    setAuthState({
      isAuthenticated: false,
      user: null,
      isLoading: false
    });
    toast.info('Logged out successfully');
  };

  const signup = async (name: string, email: string, username: string, password: string): Promise<boolean> => {
    try {
      const user = createUser(name, email, username, password);
      
      if (user) {
        setAuthState({
          isAuthenticated: true,
          user,
          isLoading: false
        });
        toast.success(`Welcome to Lore Quest, ${user.name}!`);
        return true;
      } else {
        toast.error('Failed to create account');
        return false;
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast.error('Signup failed. Please try again.');
      return false;
    }
  };

  const updateCurrentUser = (updatedUser: User) => {
    setAuthState(prev => ({
      ...prev,
      user: updatedUser
    }));
  };

  const value = {
    ...authState,
    login,
    logout,
    signup,
    updateCurrentUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
