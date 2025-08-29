import { User, ApiResponse } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

export const mongoAuthService = {
  // Register user with MongoDB backend
  async register(email: string, password: string, displayName: string, role: 'student' | 'parent', parentEmail?: string): Promise<{ user: User; token: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          displayName,
          role,
          parentEmail,
        }),
      });

      const data: ApiResponse<{ user: User; token: string }> = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Registration failed');
      }

      // Store token in localStorage
      localStorage.setItem('auth_token', data.data!.token);
      
      return data.data!;
    } catch (error) {
      throw error;
    }
  },

  // Login user with MongoDB backend
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data: ApiResponse<{ user: User; token: string }> = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Login failed');
      }

      // Store token in localStorage
      localStorage.setItem('auth_token', data.data!.token);

      return data.data!;
    } catch (error) {
      throw error;
    }
  },

  // Logout user
  async logout(): Promise<void> {
    try {
      localStorage.removeItem('auth_token');
    } catch (error) {
      throw error;
    }
  },

  // Get current user profile
  async getProfile(): Promise<User> {
    try {
      const token = localStorage.getItem('auth_token');
      const isDemo = localStorage.getItem('isDemo') === 'true';
      
      if (!token) {
        throw new Error('No authentication token');
      }

      // Handle demo mode
      if (isDemo && token.startsWith('demo-token')) {
        return this.getDemoUser();
      }

      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data: ApiResponse<{ user: User }> = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to get profile');
      }

      return data.data!.user;
    } catch (error) {
      throw error;
    }
  },

  // Update user profile
  async updateProfile(displayName?: string, avatar?: string): Promise<User> {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ displayName, avatar }),
      });

      const data: ApiResponse<{ user: User }> = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to update profile');
      }

      return data.data!.user;
    } catch (error) {
      throw error;
    }
  },

  // Check if user is authenticated (including demo mode)
  isAuthenticated(): boolean {
    const token = localStorage.getItem('auth_token');
    const isDemo = localStorage.getItem('isDemo') === 'true';
    
    // Support demo mode authentication
    if (isDemo && token && token.startsWith('demo-token')) {
      return true;
    }
    
    // Standard authentication
    return !!token;
  },

  // Get stored token
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  },

  // Get demo user information from localStorage
  getDemoUser(): User {
    const demoUserData = localStorage.getItem('demo_user');
    const userRole = localStorage.getItem('user_role');
    const userEmail = localStorage.getItem('user_email');
    const userDisplayName = localStorage.getItem('user_displayName');

    // Try to parse stored demo user data first
    if (demoUserData) {
      try {
        return JSON.parse(demoUserData) as User;
      } catch (error) {
        console.warn('Failed to parse demo_user data:', error);
      }
    }

    // Fallback to individual localStorage items
    if (userRole && userEmail && userDisplayName) {
      return {
        id: userRole === 'parent' ? 'demo-parent-id' : 'demo-student-id',
        email: userEmail,
        displayName: userDisplayName,
        role: userRole as 'student' | 'parent',
        points: userRole === 'student' ? 100 : 0,
        currentStreak: 0,
        medals: {
          bronze: false,
          silver: false,
          gold: false,
          diamond: false
        },
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userDisplayName}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }

    // Default fallback demo user
    return {
      id: 'demo-student-id',
      email: 'demo@example.com',
      displayName: '演示用户',
      role: 'student',
      points: 100,
      currentStreak: 0,
      medals: {
        bronze: false,
        silver: false,
        gold: false,
        diamond: false
      },
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  },

  // Setup demo mode authentication
  setupDemoAuth(userType: 'parent' | 'student'): User {
    const demoUser: User = {
      id: userType === 'parent' ? 'demo-parent-id' : 'demo-student-id',
      email: `demo-${userType}@example.com`,
      displayName: userType === 'parent' ? '演示家长' : '演示学生',
      role: userType,
      points: userType === 'student' ? 100 : 0,
      currentStreak: 0,
      medals: {
        bronze: false,
        silver: false,
        gold: false,
        diamond: false
      },
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userType}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Set demo mode in localStorage
    localStorage.setItem('isDemo', 'true');
    localStorage.setItem('auth_token', `demo-token-${userType}-123`);
    localStorage.setItem('user_role', userType);
    localStorage.setItem('user_email', demoUser.email);
    localStorage.setItem('user_displayName', demoUser.displayName);
    localStorage.setItem('demo_user', JSON.stringify(demoUser));

    return demoUser;
  },
};
