import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { AuthContext } from '../../contexts/AuthContext';
import { useAuth } from '../../contexts/AuthContext';

// Mock Firebase Auth
jest.mock('../../config/firebase', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    updateProfile: jest.fn(),
  },
}));

const mockUser = {
  id: 'user123',
  email: 'test@example.com',
  displayName: 'Test User',
  role: 'student' as const,
  points: 100,
};

const createWrapper = (user: any = null, loading = false) => {
  const contextValue = {
    user,
    loading,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    updateUser: jest.fn(),
  };

  return ({ children }: { children: React.ReactNode }) => (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

describe('useAuth', () => {
  test('returns null user when not authenticated', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  test('returns user when authenticated', () => {
    const wrapper = createWrapper(mockUser);
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.loading).toBe(false);
  });

  test('returns loading state correctly', () => {
    const wrapper = createWrapper(null, true);
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(true);
  });

  test('provides auth functions', () => {
    const wrapper = createWrapper(mockUser);
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(typeof result.current.login).toBe('function');
    expect(typeof result.current.register).toBe('function');
    expect(typeof result.current.logout).toBe('function');
    expect(typeof result.current.updateUser).toBe('function');
  });

  test('login function can be called', async () => {
    const mockLogin = jest.fn().mockResolvedValue(mockUser);
    const contextValue = {
      user: null,
      loading: false,
      login: mockLogin,
      register: jest.fn(),
      logout: jest.fn(),
      updateUser: jest.fn(),
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthContext.Provider value={contextValue}>
        {children}
      </AuthContext.Provider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });

    expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password');
  });

  test('register function can be called', async () => {
    const mockRegister = jest.fn().mockResolvedValue(mockUser);
    const contextValue = {
      user: null,
      loading: false,
      login: jest.fn(),
      register: mockRegister,
      logout: jest.fn(),
      updateUser: jest.fn(),
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthContext.Provider value={contextValue}>
        {children}
      </AuthContext.Provider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.register(
        'test@example.com',
        'password',
        'Test User',
        'student'
      );
    });

    expect(mockRegister).toHaveBeenCalledWith(
      'test@example.com',
      'password',
      'Test User',
      'student'
    );
  });

  test('logout function can be called', async () => {
    const mockLogout = jest.fn().mockResolvedValue(void 0);
    const contextValue = {
      user: mockUser,
      loading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: mockLogout,
      updateUser: jest.fn(),
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthContext.Provider value={contextValue}>
        {children}
      </AuthContext.Provider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.logout();
    });

    expect(mockLogout).toHaveBeenCalled();
  });

  test('throws error when used outside AuthProvider', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = jest.fn();

    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within an AuthProvider');

    console.error = originalError;
  });
});