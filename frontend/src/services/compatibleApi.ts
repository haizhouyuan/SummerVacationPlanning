import { apiService } from './api';

// Mock data for demonstration in network-restricted environments
// This structure exactly matches the backend getDashboardStats response
const mockDashboardStats = {
  user: {
    id: 'demo-user-123',
    name: '演示学生',
    email: 'demo@example.com',
    points: 240,
    level: 3, // Math.floor(240 / 100) + 1
    currentStreak: 3,
    medals: {
      bronze: false,
      silver: false,
      gold: false,
      diamond: false
    }
  },
  weeklyStats: {
    completed: 8,
    planned: 3,
    inProgress: 2,
    skipped: 2,
    total: 15,
    totalPointsEarned: 160,
    completionRate: 53, // Math.round((8/15) * 100)
    averagePointsPerTask: 20, // Math.round(160/8)
  },
  todayStats: {
    total: 3,
    completed: 2,
    planned: 1,
    inProgress: 0,
    pointsEarned: 35,
  },
  achievements: [
    {
      type: 'streak',
      level: 1,
      title: '连续达人',
      description: '连续3天完成任务',
      isUnlocked: true,
      progress: 3,
      maxProgress: 7,
    },
    {
      type: 'points',
      level: 3,
      title: '积分收集者',
      description: '累计获得240积分',
      isUnlocked: true,
      progress: 40, // 240 % 100
      maxProgress: 100,
    },
    {
      type: 'tasks',
      level: 2,
      title: '任务完成者',
      description: '本周完成8个任务',
      isUnlocked: true,
      progress: 3, // 8 % 5
      maxProgress: 5,
    },
    {
      type: 'diversity',
      level: 4,
      title: '全能发展',
      description: '完成4种不同类型的任务',
      isUnlocked: true,
      progress: 4,
      maxProgress: 6,
    }
  ],
  weeklyGoal: 7,
  performance: {
    thisWeekCompletion: 53,
    pointsPerTask: 20,
    streakProgress: 3,
    nextLevelPoints: 60, // 400 - 240
  }
};

const mockTasks = [
  {
    id: '1',
    title: '阅读30分钟',
    description: '选择一本你喜欢的书，专心阅读30分钟',
    category: 'reading',
    difficulty: 'easy',
    points: 15,
    estimatedTime: 30,
    requiresEvidence: true,
    evidenceTypes: ['text', 'photo'],
    tags: ['阅读', '学习'],
    isPublic: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    title: '跑步锻炼',
    description: '进行30分钟的跑步锻炼',
    category: 'exercise',
    difficulty: 'medium',
    points: 20,
    estimatedTime: 30,
    requiresEvidence: true,
    evidenceTypes: ['photo', 'video'],
    tags: ['运动', '健康'],
    isPublic: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    title: '测试拖拽任务',
    description: '这是一个用于测试拖拽功能的任务',
    category: 'other',
    difficulty: 'easy',
    points: 10,
    estimatedTime: 20,
    requiresEvidence: false,
    evidenceTypes: ['text'],
    tags: ['测试'],
    isPublic: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const getMockDailyTasks = () => {
  const today = new Date();
  const tasks = [];
  
  // Generate some completed tasks for the past few days
  for (let i = 0; i < 10; i++) {
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - i);
    const dateStr = pastDate.toISOString().split('T')[0];
    
    // Add 1-3 completed tasks per day
    const dailyTaskCount = Math.floor(Math.random() * 3) + 1;
    for (let j = 0; j < dailyTaskCount; j++) {
      const taskIndex = Math.floor(Math.random() * mockTasks.length);
      const baseTask = mockTasks[taskIndex];
      
      tasks.push({
        id: `${i * 10 + j + 1}`,
        taskId: baseTask.id,
        userId: 'demo-user',
        date: dateStr,
        status: 'completed',
        plannedTime: `${8 + j * 2}:00`,
        pointsEarned: baseTask.points,
        evidenceText: `完成了${baseTask.title}`,
        completedAt: new Date(pastDate.getTime() + (8 + j * 2) * 60 * 60 * 1000),
        createdAt: new Date(pastDate),
        updatedAt: new Date(pastDate),
        task: baseTask
      });
    }
  }
  
  // Add today's planned tasks
  tasks.push({
    id: 'today-1',
    taskId: '1',
    userId: 'demo-user',
    date: today.toISOString().split('T')[0],
    status: 'planned',
    plannedTime: '09:00',
    pointsEarned: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    task: mockTasks[0]
  });
  
  return tasks;
};

const mockDailyTasks = getMockDailyTasks();

// 网络兼容的API服务
export const compatibleApiService = {
  // Authentication methods
  async login(credentials: { username?: string; email?: string; password?: string; role?: string }) {
    console.log('Compatible API: Demo login with credentials:', credentials);
    
    // Simulate login delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const role = credentials.role || 'student';
    const mockUser = {
      id: role === 'student' ? 'demo-user-123' : 'demo-parent-456',
      username: role === 'student' ? 'demo_student' : 'demo_parent',
      email: role === 'student' ? 'student@demo.com' : 'parent@demo.com',
      role: role,
      displayName: role === 'student' ? '演示学生' : '演示家长',
      points: role === 'student' ? 240 : 0,
      level: role === 'student' ? 3 : 1,
      currentStreak: role === 'student' ? 3 : 0,
      medals: {
        bronze: role === 'student',
        silver: false,
        gold: false,
        diamond: false
      },
      children: role === 'parent' ? ['demo-user-123'] : undefined,
      avatar: '',
      settings: {
        language: 'zh-CN',
        notifications: true,
        theme: 'light'
      },
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date()
    };

    const token = `demo_jwt_token_${role}_${Date.now()}`;
    
    return Promise.resolve({
      success: true,
      data: {
        user: mockUser,
        token: token,
        tokenType: 'Bearer',
        expiresIn: 86400 // 24 hours
      },
      message: `${role === 'student' ? '学生' : '家长'}演示登录成功`
    });
  },

  async register(userData: any) {
    console.log('Compatible API: Demo register with data:', userData);
    
    // Simulate registration delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const newUser = {
      id: `demo-user-${Date.now()}`,
      username: userData.username || 'demo_user',
      email: userData.email || 'demo@example.com',
      role: userData.role || 'student',
      displayName: userData.displayName || '演示用户',
      points: 0,
      level: 1,
      currentStreak: 0,
      medals: { bronze: false, silver: false, gold: false, diamond: false },
      settings: {
        language: 'zh-CN',
        notifications: true,
        theme: 'light'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const token = `demo_jwt_token_${newUser.role}_${Date.now()}`;
    
    return Promise.resolve({
      success: true,
      data: {
        user: newUser,
        token: token,
        tokenType: 'Bearer',
        expiresIn: 86400
      },
      message: '演示账户注册成功'
    });
  },

  async logout() {
    console.log('Compatible API: Demo logout');
    
    // Simulate logout delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return Promise.resolve({
      success: true,
      data: {},
      message: '演示账户已登出'
    });
  },

  async refreshToken(oldToken: string) {
    console.log('Compatible API: Demo token refresh');
    
    const newToken = `demo_jwt_token_refreshed_${Date.now()}`;
    
    return Promise.resolve({
      success: true,
      data: {
        token: newToken,
        tokenType: 'Bearer',
        expiresIn: 86400
      },
      message: '演示令牌刷新成功'
    });
  },

  async validateToken(token: string) {
    console.log('Compatible API: Demo token validation');
    
    // Always validate demo tokens as valid
    if (token.includes('demo_jwt_token')) {
      return Promise.resolve({
        success: true,
        data: { valid: true },
        message: '演示令牌有效'
      });
    }
    
    return Promise.resolve({
      success: false,
      data: { valid: false },
      message: '演示令牌无效'
    });
  },

  // Dashboard statistics
  async getDashboardStats() {
    // 获取当前用户信息以提供角色相关的数据
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const userRole = localStorage.getItem('user_role') || 'student';
    
    console.log('🔄 Compatible API: Getting dashboard stats for role:', userRole);
    
    // 根据角色调整数据
    const roleBasedStats = {
      ...mockDashboardStats,
      user: {
        ...mockDashboardStats.user,
        id: currentUser.id || (userRole === 'student' ? 'demo-user-123' : 'demo-parent-456'),
        name: currentUser.displayName || (userRole === 'student' ? '演示学生' : '演示家长'),
        email: currentUser.email || (userRole === 'student' ? 'student@demo.com' : 'parent@demo.com'),
        points: currentUser.points || (userRole === 'student' ? 240 : 0),
        level: currentUser.level || (userRole === 'student' ? 3 : 1),
        currentStreak: currentUser.currentStreak || (userRole === 'student' ? 3 : 0),
      }
    };
    
    return Promise.resolve({
      success: true,
      data: { stats: roleBasedStats }
    });
  },

  // Task management
  async getTasks(filters?: any) {
    return Promise.resolve({
      success: true,
      data: { tasks: mockTasks }
    });
  },

  async getTaskById(taskId: string) {
    const task = mockTasks.find(t => t.id === taskId);
    return Promise.resolve({
      success: true,
      data: { task }
    });
  },

  async createTask(taskData: any) {
    const newTask = {
      id: Date.now().toString(),
      ...taskData,
      isPublic: taskData.isPublic || false,
      evidenceTypes: taskData.evidenceTypes || [],
      tags: taskData.tags || [],
      points: taskData.points || Math.max(5, Math.floor(taskData.estimatedTime / 6)),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    mockTasks.push(newTask);
    
    return Promise.resolve({
      success: true,
      data: { task: newTask }
    });
  },

  // Daily task management
  async getDailyTasks(params?: { 
    date?: string; 
    startDate?: string; 
    endDate?: string; 
    status?: string; 
    limit?: number;
    category?: string;
  }) {
    console.log('Compatible API: Getting daily tasks with params:', params);
    
    let filteredTasks = [...mockDailyTasks];
    
    // Apply date filtering
    if (params?.date) {
      filteredTasks = filteredTasks.filter(task => 
        task.date === params.date
      );
    }
    
    // Apply date range filtering
    if (params?.startDate && params?.endDate) {
      filteredTasks = filteredTasks.filter(task => {
        let taskDate: string;
        const completedAt = (task as any).completedAt;
        if (completedAt) {
          if (completedAt instanceof Date) {
            taskDate = completedAt.toISOString().split('T')[0];
          } else if (typeof completedAt === 'string') {
            taskDate = completedAt.split('T')[0];
          } else {
            taskDate = task.date;
          }
        } else {
          taskDate = task.date;
        }
        return taskDate >= params.startDate! && taskDate <= params.endDate!;
      });
    }
    
    // Apply status filtering
    if (params?.status) {
      filteredTasks = filteredTasks.filter(task => task.status === params.status);
    }
    
    // Apply category filtering
    if (params?.category) {
      filteredTasks = filteredTasks.filter(task => 
        task.task?.category === params.category
      );
    }
    
    // Apply limit
    if (params?.limit) {
      filteredTasks = filteredTasks.slice(0, params.limit);
    }
    
    return Promise.resolve({
      success: true,
      data: { dailyTasks: filteredTasks }
    });
  },

  async createDailyTask(taskData: any) {
    // Find the associated task
    const associatedTask = mockTasks.find(t => t.id === taskData.taskId);
    
    const newDailyTask = {
      id: Date.now().toString(),
      userId: 'demo-user',
      ...taskData,
      status: 'planned',
      pointsEarned: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      task: associatedTask // Include the full task object
    };
    
    mockDailyTasks.push(newDailyTask);
    
    return Promise.resolve({
      success: true,
      data: { dailyTask: newDailyTask }
    });
  },

  async updateDailyTaskStatus(taskId: string, updateData: any) {
    const taskIndex = mockDailyTasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) {
      throw new Error('任务未找到');
    }

    const updatedTask = {
      ...mockDailyTasks[taskIndex],
      ...updateData,
      updatedAt: new Date()
    };

    if (updateData.status === 'completed') {
      updatedTask.completedAt = new Date();
      updatedTask.pointsEarned = updatedTask.task?.points || 15;
    }

    mockDailyTasks[taskIndex] = updatedTask;

    return Promise.resolve({
      success: true,
      data: { dailyTask: updatedTask }
    });
  },

  async updateDailyTask(taskId: string, updateData: any) {
    const taskIndex = mockDailyTasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) {
      throw new Error('任务未找到');
    }

    const updatedTask = {
      ...mockDailyTasks[taskIndex],
      ...updateData,
      updatedAt: new Date()
    };

    if (updateData.status === 'completed') {
      updatedTask.completedAt = new Date();
      updatedTask.pointsEarned = updatedTask.task?.points || 15;
    }

    mockDailyTasks[taskIndex] = updatedTask;

    return Promise.resolve({
      success: true,
      data: { dailyTask: updatedTask }
    });
  },

  async checkSchedulingConflicts(params: { 
    date: string; 
    plannedTime: string; 
    estimatedTime: string; 
    excludeTaskId?: string; 
  }) {
    // Simple mock conflict checking
    console.log('Compatible API: Checking scheduling conflicts with params:', params);
    
    const conflictingTasks = mockDailyTasks.filter(task => {
      if (params.excludeTaskId && task.id === params.excludeTaskId) {
        return false;
      }
      
      if (task.date !== params.date || !task.plannedTime) {
        return false;
      }
      
      // Simple overlap check
      const taskStartTime = new Date(`${params.date}T${task.plannedTime}:00`);
      const taskDuration = (task as any).task?.estimatedTime || 30;
      const taskEndTime = new Date(taskStartTime.getTime() + taskDuration * 60000);
      const newStartTime = new Date(`${params.date}T${params.plannedTime}:00`);
      const newEndTime = new Date(newStartTime.getTime() + parseInt(params.estimatedTime) * 60000);
      
      return (newStartTime < taskEndTime && newEndTime > taskStartTime);
    });

    const hasConflicts = conflictingTasks.length > 0;
    
    return Promise.resolve({
      success: true,
      data: {
        hasConflicts,
        conflict: hasConflicts ? {
          timeSlot: params.plannedTime,
          conflictingTasks: conflictingTasks.map(task => ({
            taskId: task.id,
            title: task.task?.title || 'Unknown Task',
            plannedTime: task.plannedTime,
            estimatedTime: task.task?.estimatedTime || 30
          }))
        } : null
      }
    });
  },

  // User profile
  async updateUserProfile(updates: any) {
    return Promise.resolve({
      success: true,
      data: { user: { ...updates, updatedAt: new Date() } }
    });
  },

  // Points and rewards
  async getPointsHistory(filters?: { startDate?: string; endDate?: string; type?: string; limit?: number; offset?: number }) {
    const mockHistory = [
      {
        id: 'task-1',
        type: 'earn',
        amount: 20,
        source: 'task_completion',
        description: '完成任务: 跑步锻炼',
        date: new Date(),
        details: {
          taskTitle: '跑步锻炼',
          taskCategory: 'exercise',
          difficulty: 'medium',
          originalPoints: 20,
        }
      },
      {
        id: 'task-2',
        type: 'earn',
        amount: 15,
        source: 'task_completion',  
        description: '完成任务: 阅读30分钟',
        date: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        details: {
          taskTitle: '阅读30分钟',
          taskCategory: 'reading',
          difficulty: 'easy',
          originalPoints: 15,
        }
      },
      {
        id: 'exchange-1',
        type: 'spend',
        amount: 10,
        source: 'game_time_exchange',
        description: '兑换游戏时间: 30分钟普通游戏',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        details: {
          gameType: 'normal',
          minutesGranted: 30,
        }
      }
    ];

    // Apply filters
    let filteredHistory = mockHistory;
    if (filters?.type && filters.type !== 'all') {
      filteredHistory = mockHistory.filter(entry => entry.type === filters.type);
    }

    const summary = {
      totalTransactions: filteredHistory.length,
      totalEarned: mockHistory.filter(entry => entry.type === 'earn').reduce((sum, entry) => sum + entry.amount, 0),
      totalSpent: mockHistory.filter(entry => entry.type === 'spend').reduce((sum, entry) => sum + entry.amount, 0),
      netGain: 0,
      periodStart: filters?.startDate || null,
      periodEnd: filters?.endDate || null,
    };
    summary.netGain = summary.totalEarned - summary.totalSpent;

    return Promise.resolve({
      success: true,
      data: {
        history: filteredHistory,
        summary,
        pagination: {
          total: filteredHistory.length,
          limit: filters?.limit || 50,
          offset: filters?.offset || 0,
          hasMore: false,
        }
      }
    });
  },

  // Add getPublicDailyTasks method for compatibility
  async getPublicDailyTasks(params?: any) {
    console.log('Compatible API: Using getPublicDailyTasks with mock data', params);
    
    // Return mock data similar to getDailyTasks format
    return Promise.resolve({
      success: true,
      data: {
        dailyTasks: mockDailyTasks.slice(0, params?.limit || 10),
        pagination: {
          total: mockDailyTasks.length,
          limit: params?.limit || 10,
          offset: params?.offset || 0,
          hasMore: false,
        }
      }
    });
  },

  // Add getWeeklyStats method for compatibility
  async getWeeklyStats(params?: any) {
    console.log('Compatible API: Using getWeeklyStats with mock data', params);
    
    return Promise.resolve({
      success: true,
      data: {
        userId: 'demo-user-123',
        weekStart: params?.weekStart || new Date().toISOString().split('T')[0],
        tasks: mockDailyTasks.slice(0, 5),
        totalPlannedTasks: 5,
        totalCompletedTasks: 3,
        totalPointsEarned: 60,
        completionRate: 60
      }
    });
  },

  // Add getRecommendedTasks method for compatibility
  async getRecommendedTasks(params?: any) {
    console.log('Compatible API: Using getRecommendedTasks with mock data', params);
    
    const mockRecommendations = [
      {
        task: mockTasks[0],
        score: 0.95,
        reason: '根据您的阅读习惯，这个任务非常适合您'
      },
      {
        task: mockTasks[1],
        score: 0.87,
        reason: '数学练习有助于提升逻辑思维能力'
      },
      {
        task: mockTasks[2],
        score: 0.78,
        reason: '适量运动有助于身体健康和学习效率'
      }
    ];
    
    return Promise.resolve({
      success: true,
      data: {
        recommendations: mockRecommendations.slice(0, params?.limit || 3)
      }
    });
  },

  // Game time management methods
  async getTodayGameTime() {
    console.log('Compatible API: Getting today game time');
    
    const mockGameTimeStats = {
      baseGameTime: 60,
      bonusTimeEarned: 30,
      totalAvailable: 90,
      totalUsed: 20,
      remainingTime: 70
    };
    
    return Promise.resolve({
      success: true,
      data: { gameTimeStats: mockGameTimeStats }
    });
  },

  async calculateGameTime(params: { pointsToSpend: number; gameType: string }) {
    console.log('Compatible API: Calculating game time', params);
    
    const rate = params.gameType === 'educational' ? 10 : 5;
    const minutesGranted = params.pointsToSpend * rate;
    const isFreeTime = params.gameType === 'educational' && minutesGranted <= 20;
    
    return Promise.resolve({
      success: true,
      data: {
        minutesGranted,
        pointsSpent: isFreeTime ? 0 : params.pointsToSpend,
        isFreeTime
      }
    });
  },

  async getSpecialRewards() {
    console.log('Compatible API: Getting special rewards');
    
    const mockSpecialRewards = [
      {
        id: '1',
        title: '游戏机时间',
        description: '获得2小时Switch游戏时间',
        pointsCost: 100,
        category: 'game',
        available: true
      },
      {
        id: '2',
        title: '户外活动',
        description: '去游乐园玩一天',
        pointsCost: 200,
        category: 'experience',
        available: false
      },
      {
        id: '3',
        title: '家庭电影夜',
        description: '全家一起看电影+爆米花',
        pointsCost: 50,
        category: 'family',
        available: true
      }
    ];
    
    return Promise.resolve({
      success: true,
      data: { specialRewards: mockSpecialRewards }
    });
  },

  async createRedemption(params: { rewardTitle: string; rewardDescription: string; pointsCost: number }) {
    console.log('Compatible API: Creating redemption', params);
    
    return Promise.resolve({
      success: true,
      data: {
        id: Date.now().toString(),
        ...params,
        status: 'pending',
        createdAt: new Date()
      },
      message: '兑换请求已提交'
    });
  },

  // Fallback method for any other API calls
  async makeRequest(endpoint: string, options: any = {}) {
    console.log(`Compatible API: Making request to ${endpoint}`, options);
    
    // Return mock success response for any unhandled requests
    return Promise.resolve({
      success: true,
      data: {},
      message: '网络兼容模式 - 模拟请求成功'
    });
  }
};

// Enhanced network detection and API service selection
let networkStatusCache: { isOnline: boolean; lastChecked: number; apiWorking: boolean } = {
  isOnline: navigator.onLine,
  lastChecked: 0,
  apiWorking: false
};

// Cache duration for network status (5 minutes)
const NETWORK_CACHE_DURATION = 5 * 60 * 1000;

/**
 * Test API connectivity with proper timeout and error handling
 */
const testApiConnection = async (timeout: number = 5000): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Try to connect to the actual API endpoint
    const testUrl = process.env.REACT_APP_API_URL 
      ? `${process.env.REACT_APP_API_URL}/health`
      : 'http://localhost:5001/health';

    const response = await fetch(testUrl, {
      method: 'GET',
      mode: 'cors',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error: any) {
    console.warn('API connectivity test failed:', error.message);
    
    // Check specific error types for better handling
    if (error.name === 'AbortError') {
      console.warn('API request timed out - using compatible mode');
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.warn('Network error detected - using compatible mode');
    }
    
    return false;
  }
};

/**
 * Check various indicators for network/API availability
 */
const checkNetworkStatus = async (): Promise<{ isOnline: boolean; apiWorking: boolean }> => {
  // Check basic connectivity
  const isOnline = navigator.onLine;
  
  if (!isOnline) {
    return { isOnline: false, apiWorking: false };
  }

  // Test API connectivity
  let apiWorking = false;
  try {
    apiWorking = await testApiConnection(3000);
  } catch (error) {
    console.warn('Network status check failed:', error);
    apiWorking = false;
  }

  return { isOnline, apiWorking };
};

/**
 * Get cached network status or perform fresh check
 */
const getCachedNetworkStatus = async (forceRefresh: boolean = false): Promise<{ isOnline: boolean; apiWorking: boolean }> => {
  const now = Date.now();
  
  // Use cached result if it's still valid and not forcing refresh
  if (!forceRefresh && (now - networkStatusCache.lastChecked) < NETWORK_CACHE_DURATION) {
    return {
      isOnline: networkStatusCache.isOnline,
      apiWorking: networkStatusCache.apiWorking
    };
  }

  // Perform fresh network check
  const status = await checkNetworkStatus();
  
  // Update cache
  networkStatusCache = {
    ...status,
    lastChecked: now
  };

  return status;
};

/**
 * Enhanced API service detection with multiple fallback strategies
 */
export const detectNetworkAndGetApiService = async (options: {
  forceRefresh?: boolean;
  timeout?: number;
} = {}) => {
  const { forceRefresh = false } = options;

  try {
    // 检查演示模式的多种方式
    const isDemoMode = 
      localStorage.getItem('isDemo') === 'true' ||
      localStorage.getItem('currentUser')?.includes('demo') ||
      localStorage.getItem('user_email')?.includes('demo') ||
      localStorage.getItem('auth_token')?.includes('demo_jwt_token');

    const forceCompatibleMode = 
      process.env.REACT_APP_USE_COMPATIBLE_API === 'true' || 
      localStorage.getItem('use_compatible_api') === 'true' ||
      localStorage.getItem('api_mode') === 'compatible' ||
      isDemoMode; // 演示模式强制使用兼容API

    if (forceCompatibleMode) {
      const reason = isDemoMode ? 'demo mode' : 'configuration';
      console.log(`🔄 Using compatible API service (forced by ${reason})`);
      return compatibleApiService;
    }

    // Check network status
    const networkStatus = await getCachedNetworkStatus(forceRefresh);
    
    if (!networkStatus.isOnline) {
      console.log('🔄 Using compatible API service (offline)');
      return compatibleApiService;
    }

    if (!networkStatus.apiWorking) {
      console.log('🔄 Using compatible API service (API unreachable)');
      
      // Store preference for subsequent requests
      localStorage.setItem('api_mode', 'compatible');
      return compatibleApiService;
    }

    // API is working, use real service
    console.log('✅ Using real API service');
    localStorage.removeItem('api_mode'); // Clear any cached compatible mode preference
    return apiService;

  } catch (error) {
    console.warn('🔄 API service detection failed, falling back to compatible mode:', error);
    return compatibleApiService;
  }
};

/**
 * Synchronous version for cases where async detection isn't possible
 */
export const detectNetworkAndGetApiServiceSync = () => {
  // 检查演示模式的多种方式
  const isDemoMode = 
    localStorage.getItem('isDemo') === 'true' ||
    localStorage.getItem('currentUser')?.includes('demo') ||
    localStorage.getItem('user_email')?.includes('demo') ||
    localStorage.getItem('auth_token')?.includes('demo_jwt_token');

  const forceCompatibleMode = 
    process.env.REACT_APP_USE_COMPATIBLE_API === 'true' || 
    localStorage.getItem('use_compatible_api') === 'true' ||
    localStorage.getItem('api_mode') === 'compatible' ||
    isDemoMode; // 演示模式强制使用兼容API

  if (forceCompatibleMode) {
    const reason = isDemoMode ? 'demo mode' : 'configuration';
    console.log(`🔄 Using compatible API service (sync - forced by ${reason})`);
    console.log('📋 Demo mode indicators:', {
      isDemo: localStorage.getItem('isDemo'),
      currentUser: localStorage.getItem('currentUser')?.slice(0, 50),
      userEmail: localStorage.getItem('user_email'),
      authToken: localStorage.getItem('auth_token')?.slice(0, 30)
    });
    return compatibleApiService;
  }

  // Check basic connectivity
  if (!navigator.onLine) {
    console.log('🔄 Using compatible API service (sync - offline)');
    return compatibleApiService;
  }

  // Use cached network status if available
  const now = Date.now();
  if ((now - networkStatusCache.lastChecked) < NETWORK_CACHE_DURATION) {
    if (!networkStatusCache.apiWorking) {
      console.log('🔄 Using compatible API service (sync - cached API failure)');
      return compatibleApiService;
    }
  }

  // Default to real API service for sync calls
  console.log('✅ Using real API service (sync)');
  return apiService;
};

/**
 * Reset network status cache (useful for retry scenarios)
 */
export const resetNetworkCache = () => {
  networkStatusCache = {
    isOnline: navigator.onLine,
    lastChecked: 0,
    apiWorking: false
  };
  localStorage.removeItem('api_mode');
  console.log('🔄 Network cache reset');
};

/**
 * Listen for network status changes
 */
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('🌐 Network came online');
    resetNetworkCache();
  });

  window.addEventListener('offline', () => {
    console.log('🔌 Network went offline');
    networkStatusCache.isOnline = false;
    networkStatusCache.apiWorking = false;
  });
}

// 导出默认的API服务检测结果
export const detectedApiService = detectNetworkAndGetApiService();