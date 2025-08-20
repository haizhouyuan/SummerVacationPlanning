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
  const [isDemo, setIsDemo] = useState<boolean | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if we're in demo mode from localStorage
        const isDemoMode = localStorage.getItem('isDemo') === 'true';
        
        if (isDemoMode) {
          // Create demo user from localStorage data
          const role = localStorage.getItem('user_role') || 'student';
          const email = localStorage.getItem('user_email') || `${role}@example.com`;
          const displayName = localStorage.getItem('user_display_name') || (role === 'student' ? '演示学生' : '演示家长');
          
          const demoUser: User = {
            id: `demo-${role}-id`,
            email: email,
            displayName: displayName,
            role: role as 'student' | 'parent',
            avatar: '',
            points: 150,
            currentStreak: 3,
            medals: {
              bronze: true,
              silver: false,
              gold: false,
              diamond: false
            },
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          setUser(demoUser);
          setIsDemo(true);
          console.log('✅ Initialized demo user from localStorage:', demoUser);
          
          // Hide the static homepage content when user is authenticated
          const homepageElement = document.getElementById('homepage');
          if (homepageElement) {
            homepageElement.style.display = 'none';
          }
          
        } else if (compatibleAuthService.isAuthenticated()) {
          const userProfile = await compatibleAuthService.getProfile();
          setUser(userProfile);
          setIsDemo(false);
          
          // Hide the static homepage content when user is authenticated
          const homepageElement = document.getElementById('homepage');
          if (homepageElement) {
            homepageElement.style.display = 'none';
          }
        } else {
          setUser(null);
          setIsDemo(null);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setUser(null);
        setIsDemo(null);
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
      setIsDemo(false);
      
      // Hide the static homepage content when user logs in
      const homepageElement = document.getElementById('homepage');
      if (homepageElement) {
        homepageElement.style.display = 'none';
      }
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
      setIsDemo(false);
      
      // Hide the static homepage content when user registers
      const homepageElement = document.getElementById('homepage');
      if (homepageElement) {
        homepageElement.style.display = 'none';
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await compatibleAuthService.logout();
      setUser(null);
      setIsDemo(null);
      localStorage.removeItem('isDemo');
      
      // Show the static homepage content when user logs out
      const homepageElement = document.getElementById('homepage');
      if (homepageElement) {
        homepageElement.style.display = 'block';
      }
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
  const quickLogin = async (role: 'student' | 'parent') => {
    try {
      console.log('🔄 Global quickLogin called for role:', role);
      
      // Use demo credentials that match the existing login system
      const demoCredentials = {
        student: { email: 'student@example.com', password: 'testpass123' },
        parent: { email: 'parent@example.com', password: 'testpass123' }
      };

      const credentials = demoCredentials[role];
      
      try {
        // 尝试正常登录
        const result = await compatibleAuthService.login(credentials.email, credentials.password);
        setUser(result.user);
        setIsDemo(true);
        
        // Set localStorage for demo mode detection
        localStorage.setItem('isDemo', 'true');
        
        // Hide the static homepage content when user does demo login
        const homepageElement = document.getElementById('homepage');
        if (homepageElement) {
          homepageElement.style.display = 'none';
        }
        
        console.log('✅ Global quickLogin successful for role:', role);
        
        // Wait for state to update before continuing
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (loginError: any) {
        console.warn('⚠️ Normal login failed, using fallback mode:', loginError.message);
        
        // 失败时使用降级模式：直接设置用户信息
        const fallbackUser: User = {
          id: `demo-${role}-id`,
          email: credentials.email,
          displayName: role === 'student' ? '演示学生' : '演示家长',
          role: role,
          avatar: '',
          points: 150,
          currentStreak: 3,
          medals: {
            bronze: true,
            silver: false,
            gold: false,
            diamond: false
          },
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        const fallbackToken = `demo-token-${role}-${Date.now()}`;
        
        // 直接设置localStorage
        localStorage.setItem('auth_token', fallbackToken);
        localStorage.setItem('user_email', credentials.email);
        localStorage.setItem('user_role', role);
        localStorage.setItem('user_display_name', fallbackUser.displayName);
        localStorage.setItem('isDemo', 'true');
        
        // 更新用户状态
        setUser(fallbackUser);
        setIsDemo(true);
        
        // Hide the static homepage content when user does fallback login
        const homepageElement = document.getElementById('homepage');
        if (homepageElement) {
          homepageElement.style.display = 'none';
        }
        
        // Wait for state to update
        await new Promise(resolve => setTimeout(resolve, 100));
        
        console.log('✅ Fallback login successful for role:', role);
      }
      
    } catch (error: any) {
      console.error('❌ Global quickLogin completely failed:', error);
      // 最后的降级：重新加载页面
      window.location.reload();
    }
  };

  useEffect(() => {
    // Expose quickLogin to window object
    (window as any).quickLogin = quickLogin;
    
    // Cleanup function
    return () => {
      try {
        if ((window as any).quickLogin) {
          (window as any).quickLogin = undefined;
        }
      } catch (error) {
        // Ignore cleanup errors
        console.warn('Failed to cleanup quickLogin:', error);
      }
    };
  }, [quickLogin]);

  const value: AuthContextType = {
    user,
    currentUser: user,
    loading,
    isDemo,
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