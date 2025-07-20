import { User, ApiResponse } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api` : 'http://localhost:3000/api';

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
      if (!token) {
        throw new Error('No authentication token');
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

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  },

  // Get stored token
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  },
};