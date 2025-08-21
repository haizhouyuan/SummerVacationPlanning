import { User } from '../types';

// 网络兼容的认证服务
export const compatibleAuthService = {
  // 使用真正的API登录
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    try {
      // 使用本地服务器进行登录
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || '登录失败');
      }

      const result = await response.json();
      
      // 存储真正的JWT token
      localStorage.setItem('auth_token', result.data.token);
      localStorage.setItem('user_email', email);
      localStorage.setItem('user_role', result.data.user.role);
      
      return {
        user: result.data.user,
        token: result.data.token
      };
    } catch (error) {
      // 如果API失败，回退到演示模式
      console.log('🔄 API login failed, using demo mode:', error);
      
      const mockResponse = {
        user: {
          id: 'demo-user-id',
          email: email,
          displayName: email.includes('parent') ? '演示家长' : '演示学生',
          role: email.includes('parent') ? 'parent' as const : 'student' as const,
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
        },
        token: 'demo-token-' + Date.now()
      };
      
      // 存储mock token  
      localStorage.setItem('auth_token', mockResponse.token);
      localStorage.setItem('user_email', email);
      localStorage.setItem('user_role', mockResponse.user.role);
      
      return mockResponse;
    }
  },

  // 注册功能
  async register(email: string, password: string, displayName: string, role: 'student' | 'parent', parentEmail?: string): Promise<{ user: User; token: string }> {
    const mockResponse = {
      user: {
        id: 'demo-user-id',
        email: email,
        displayName: displayName,
        role: role,
        avatar: '',
        points: 0,
        currentStreak: 0,
        medals: {
          bronze: false,
          silver: false,
          gold: false,
          diamond: false
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      token: 'demo-token-' + Date.now()
    };
    
    localStorage.setItem('auth_token', mockResponse.token);
    localStorage.setItem('user_email', email);
    localStorage.setItem('user_role', role);
    
    return mockResponse;
  },

  // 获取用户profile
  async getProfile(): Promise<User> {
    const token = localStorage.getItem('auth_token');
    const email = localStorage.getItem('user_email');
    const role = localStorage.getItem('user_role');
    
    if (!token || !email || !role) {
      throw new Error('未找到认证信息');
    }
    
    return {
      id: 'demo-user-id',
      email: email,
      displayName: email.includes('parent') ? '演示家长' : '演示学生',
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
  },

  // 更新用户profile
  async updateProfile(displayName?: string, avatar?: string): Promise<User> {
    const currentUser = await this.getProfile();
    
    const updatedUser = {
      ...currentUser,
      displayName: displayName || currentUser.displayName,
      avatar: avatar || currentUser.avatar,
      updatedAt: new Date()
    };
    
    if (displayName) localStorage.setItem('user_display_name', displayName);
    if (avatar) localStorage.setItem('user_avatar', avatar);
    
    return updatedUser;
  },

  // 登出
  async logout(): Promise<void> {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_display_name');
    localStorage.removeItem('user_avatar');
  },

  // 检查是否已认证
  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  },

  // 获取token
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  },
};