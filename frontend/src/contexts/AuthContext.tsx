import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthContextType } from '../types';
import { compatibleAuthService } from '../services/compatibleAuth';

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
        if (compatibleAuthService.isAuthenticated()) {
          const userProfile = await compatibleAuthService.getProfile();
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
      const result = await compatibleAuthService.login(email, password);
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
      const result = await compatibleAuthService.register(email, password, displayName, role, parentEmail);
      setUser(result.user);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await compatibleAuthService.logout();
      setUser(null);
    } catch (error) {
      throw error;
    }
  };

  const updateProfile = async (displayName?: string, avatar?: string) => {
    try {
      const updatedUser = await compatibleAuthService.updateProfile(displayName, avatar);
      setUser(updatedUser);
    } catch (error) {
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      if (compatibleAuthService.isAuthenticated()) {
        const userProfile = await compatibleAuthService.getProfile();
        setUser(userProfile);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  // Add global quickLogin function for backward compatibility
  useEffect(() => {
    const quickLogin = async (role: 'student' | 'parent') => {
      try {
        console.log('🔄 Global quickLogin called for role:', role);
        
        // Use demo credentials that match the existing login system
        const demoCredentials = {
          student: { email: 'student@example.com', password: 'testpass123' },
          parent: { email: 'parent@example.com', password: 'testpass123' }
        };

        const credentials = demoCredentials[role];
        await login(credentials.email, credentials.password);
        
        console.log('✅ Global quickLogin successful for role:', role);
      } catch (error: any) {
        console.error('❌ Global quickLogin failed:', error);
        // Fallback: try to manually navigate to dashboard
        window.location.href = '/login';
      }
    };

    // Expose quickLogin to window object
    (window as any).quickLogin = quickLogin;
    
    // Cleanup function
    return () => {
      delete (window as any).quickLogin;
    };
  }, [login]);

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