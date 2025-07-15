import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { User, ApiResponse } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const authService = {
  // Register user with backend
  async register(email: string, password: string, displayName: string, role: 'student' | 'parent', parentEmail?: string): Promise<User> {
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

      return data.data!.user;
    } catch (error) {
      throw error;
    }
  },

  // Login user with Firebase
  async login(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      const data: ApiResponse<{ user: User }> = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Login failed');
      }

      return data.data!.user;
    } catch (error) {
      throw error;
    }
  },

  // Logout user
  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      throw error;
    }
  },

  // Get current user profile
  async getProfile(): Promise<User> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user');
      }

      const idToken = await currentUser.getIdToken();

      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${idToken}`,
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
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user');
      }

      const idToken = await currentUser.getIdToken();

      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${idToken}`,
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

  // Listen to auth state changes
  onAuthStateChanged(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback);
  },
};