import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { User, AuthContextType } from '../types';
import { authService } from '../services/auth';

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
    const unsubscribe = authService.onAuthStateChanged(async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const userProfile = await authService.getProfile();
          setUser(userProfile);
        } catch (error) {
          console.error('Error getting user profile:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const userProfile = await authService.login(email, password);
      setUser(userProfile);
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
      const userProfile = await authService.register(email, password, displayName, role, parentEmail);
      setUser(userProfile);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
    } catch (error) {
      throw error;
    }
  };

  const updateProfile = async (displayName?: string, avatar?: string) => {
    try {
      const updatedUser = await authService.updateProfile(displayName, avatar);
      setUser(updatedUser);
    } catch (error) {
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};