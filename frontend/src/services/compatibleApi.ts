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
  }
];

const mockDailyTasks = [
  {
    id: '1',
    taskId: '1',
    userId: 'demo-user',
    date: new Date().toISOString().split('T')[0],
    status: 'planned',
    plannedTime: '09:00',
    pointsEarned: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    task: mockTasks[0]
  },
  {
    id: '2',
    taskId: '2',
    userId: 'demo-user',
    date: new Date().toISOString().split('T')[0],
    status: 'completed',
    plannedTime: '16:00',
    pointsEarned: 20,
    evidenceText: '完成了30分钟跑步，感觉很棒！',
    completedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    task: mockTasks[1]
  }
];

// 网络兼容的API服务
export const compatibleApiService = {
  // Dashboard statistics
  async getDashboardStats() {
    return Promise.resolve({
      success: true,
      data: { stats: mockDashboardStats }
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
  async getDailyTasks(params?: { date?: string }) {
    return Promise.resolve({
      success: true,
      data: { dailyTasks: mockDailyTasks }
    });
  },

  async createDailyTask(taskData: any) {
    const newDailyTask = {
      id: Date.now().toString(),
      userId: 'demo-user',
      ...taskData,
      status: 'planned',
      pointsEarned: 0,
      createdAt: new Date(),
      updatedAt: new Date()
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
      ? `${process.env.REACT_APP_API_URL}/api/health`
      : 'http://localhost:3000/api/health';

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
  const { forceRefresh = false, timeout = 3000 } = options;

  try {
    // Check for explicit configuration
    const forceCompatibleMode = 
      process.env.REACT_APP_USE_COMPATIBLE_API === 'true' || 
      localStorage.getItem('use_compatible_api') === 'true' ||
      localStorage.getItem('api_mode') === 'compatible';

    if (forceCompatibleMode) {
      console.log('🔄 Using compatible API service (forced by configuration)');
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
  // Check for explicit configuration first
  const forceCompatibleMode = 
    process.env.REACT_APP_USE_COMPATIBLE_API === 'true' || 
    localStorage.getItem('use_compatible_api') === 'true' ||
    localStorage.getItem('api_mode') === 'compatible';

  if (forceCompatibleMode) {
    console.log('🔄 Using compatible API service (sync - forced by configuration)');
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