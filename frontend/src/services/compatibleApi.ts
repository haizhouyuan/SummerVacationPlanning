import { apiService } from './api';

// Mock data for demonstration in network-restricted environments
const mockDashboardStats = {
  totalTasks: 15,
  completedTasks: 8,
  pointsEarned: 240,
  currentStreak: 3,
  weeklyProgress: 75,
  todayTasks: 5,
  completedToday: 3,
  pendingApproval: 2,
  recentAchievements: [
    { id: '1', title: '阅读达人', description: '连续阅读7天', earnedAt: new Date() },
    { id: '2', title: '运动小将', description: '完成10次运动任务', earnedAt: new Date() }
  ],
  categoryStats: {
    reading: { completed: 3, total: 5 },
    exercise: { completed: 2, total: 3 },
    learning: { completed: 2, total: 4 },
    creativity: { completed: 1, total: 2 },
    chores: { completed: 0, total: 1 }
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
      data: mockDashboardStats
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
  async getPointsHistory() {
    return Promise.resolve({
      success: true,
      data: {
        history: [
          { date: new Date(), points: 20, reason: '完成跑步任务', taskTitle: '跑步锻炼' },
          { date: new Date(), points: 15, reason: '完成阅读任务', taskTitle: '阅读30分钟' }
        ]
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

// 检测网络环境并选择合适的API服务
export const detectNetworkAndGetApiService = () => {
  // 检测是否支持fetch和CORS
  const supportsFetch = typeof fetch !== 'undefined';
  
  if (supportsFetch) {
    // 尝试检测网络限制
    const testApiConnection = async () => {
      try {
        // 尝试一个简单的API请求
        const response = await fetch('http://47.120.74.212/api/health', {
          method: 'GET',
          mode: 'cors',
          timeout: 3000
        } as any);
        return response.ok;
      } catch (error) {
        console.log('检测到网络限制，使用兼容API模式');
        return false;
      }
    };

    // 异步检测，如果失败则后续使用兼容模式
    testApiConnection().then(success => {
      if (!success) {
        console.log('网络连接受限，建议使用兼容模式');
      }
    });
  }

  // 检查环境变量或用户设置决定使用哪个服务
  const useCompatibleMode = process.env.REACT_APP_USE_COMPATIBLE_API === 'true' || 
                           localStorage.getItem('use_compatible_api') === 'true';

  if (useCompatibleMode) {
    console.log('使用网络兼容API服务');
    return compatibleApiService;
  }

  // 默认尝试使用正常的API服务
  return apiService;
};

// 导出默认的API服务检测结果
export const detectedApiService = detectNetworkAndGetApiService();