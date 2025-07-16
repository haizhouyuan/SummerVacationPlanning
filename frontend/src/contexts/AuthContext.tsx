import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthContextType } from '../types';
import { mongoAuthService } from '../services/mongoAuth';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (mongoAuthService.isAuthenticated()) {
          const userProfile = await mongoAuthService.getProfile();
          setUser(userProfile);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setUser(null);
        // Remove invalid token
        localStorage.removeItem('auth_token');
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const result = await mongoAuthService.login(email, password);
      setUser(result.user);
    } catch (error) {
      throw error;
    }
  };

  const register = async (
    email: string,
    password: string,
    displayName: string,
    role: 'student' | 'parent',
    parentEmail?: string
  ) => {
    try {
      const result = await mongoAuthService.register(email, password, displayName, role, parentEmail);
      setUser(result.user);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await mongoAuthService.logout();
      setUser(null);
    } catch (error) {
      throw error;
    }
  };

  const updateProfile = async (displayName?: string, avatar?: string) => {
    try {
      const updatedUser = await mongoAuthService.updateProfile(displayName, avatar);
      setUser(updatedUser);
    } catch (error) {
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      if (mongoAuthService.isAuthenticated()) {
        const userProfile = await mongoAuthService.getProfile();
        setUser(userProfile);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};