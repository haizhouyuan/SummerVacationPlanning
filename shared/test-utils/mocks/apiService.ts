/**
 * API Service Mocks for Testing
 * API服务Mock - 用于测试
 */

export const mockApiService = {
  // 认证相关
  login: jest.fn(),
  register: jest.fn(),
  refreshToken: jest.fn(),
  logout: jest.fn(),
  
  // 用户相关
  getCurrentUser: jest.fn(),
  updateProfile: jest.fn(),
  
  // 任务相关
  getTasks: jest.fn(),
  createTask: jest.fn(),
  updateTask: jest.fn(),
  deleteTask: jest.fn(),
  
  // 每日任务
  getDailyTasks: jest.fn(),
  startTask: jest.fn(),
  completeTask: jest.fn(),
  uploadEvidence: jest.fn(),
  
  // 积分相关
  getPointsBalance: jest.fn(),
  exchangeGameTime: jest.fn(),
  getPointsHistory: jest.fn(),
  
  // 兑换相关
  createRedemption: jest.fn(),
  getRedemptions: jest.fn(),
  approveRedemption: jest.fn(),
  
  // 统计相关
  getWeeklyStats: jest.fn(),
  getMonthlyStats: jest.fn()
};

// 默认响应数据
export const mockResponses = {
  user: {
    id: 'mock-user-id',
    username: '测试用户',
    email: 'test@test.com',
    role: 'student',
    points: 150,
    createdAt: '2024-01-01T00:00:00Z'
  },
  
  tasks: [
    {
      id: 'task-1',
      title: '跑步30分钟',
      category: 'exercise',
      difficulty: 'medium',
      points: 50,
      evidenceRequired: true,
      timeEstimate: 30
    },
    {
      id: 'task-2',
      title: '阅读1小时',
      category: 'reading',
      difficulty: 'easy',
      points: 40,
      evidenceRequired: false,
      timeEstimate: 60
    },
    {
      id: 'task-3',
      title: '整理房间',
      category: 'chores',
      difficulty: 'medium',
      points: 45,
      evidenceRequired: true,
      timeEstimate: 45
    }
  ],
  
  dailyTasks: [
    {
      id: 'daily-1',
      taskId: 'task-1',
      date: '2024-08-26',
      status: 'planned',
      scheduledTime: '2024-08-26T09:00:00Z'
    },
    {
      id: 'daily-2',
      taskId: 'task-2',
      date: '2024-08-26',
      status: 'completed',
      scheduledTime: '2024-08-26T10:00:00Z',
      completedAt: '2024-08-26T11:00:00Z',
      pointsEarned: 40
    }
  ],
  
  pointsHistory: [
    {
      id: 'points-1',
      type: 'earned',
      points: 50,
      reason: '完成跑步任务',
      timestamp: '2024-08-26T10:00:00Z'
    },
    {
      id: 'points-2',
      type: 'spent',
      points: -30,
      reason: '兑换游戏时间',
      timestamp: '2024-08-26T15:00:00Z'
    }
  ],
  
  redemptions: [
    {
      id: 'redemption-1',
      userId: 'mock-user-id',
      type: 'game_time',
      points: 30,
      details: { minutes: 30, gameType: 'normal' },
      status: 'approved',
      createdAt: '2024-08-26T15:00:00Z'
    }
  ],
  
  stats: {
    weekly: {
      totalTasks: 15,
      completedTasks: 12,
      totalPoints: 450,
      averageCompletion: 0.8
    },
    monthly: {
      totalTasks: 60,
      completedTasks: 48,
      totalPoints: 1800,
      averageCompletion: 0.8
    }
  }
};

// 设置Mock响应的工具函数
export const setupApiMocks = () => {
  // 认证相关
  mockApiService.login.mockResolvedValue({
    token: 'mock-jwt-token',
    user: mockResponses.user
  });
  
  mockApiService.register.mockResolvedValue({
    token: 'mock-jwt-token',
    user: mockResponses.user
  });
  
  mockApiService.getCurrentUser.mockResolvedValue(mockResponses.user);
  
  // 任务相关
  mockApiService.getTasks.mockResolvedValue(mockResponses.tasks);
  mockApiService.getDailyTasks.mockResolvedValue(mockResponses.dailyTasks);
  mockApiService.getPointsHistory.mockResolvedValue(mockResponses.pointsHistory);
  
  // 模拟成功的操作
  mockApiService.createTask.mockImplementation((taskData) => 
    Promise.resolve({ id: 'new-task-id', ...taskData })
  );
  
  mockApiService.exchangeGameTime.mockResolvedValue({
    success: true,
    remainingPoints: 100,
    gameTimeMinutes: 30
  });
  
  mockApiService.startTask.mockImplementation((dailyTaskId) =>
    Promise.resolve({
      id: dailyTaskId,
      status: 'in_progress',
      startedAt: new Date().toISOString()
    })
  );
  
  mockApiService.completeTask.mockImplementation((dailyTaskId, data) =>
    Promise.resolve({
      id: dailyTaskId,
      status: data.evidenceUrl ? 'pending_approval' : 'completed',
      completedAt: new Date().toISOString(),
      pointsEarned: 50
    })
  );
  
  mockApiService.uploadEvidence.mockResolvedValue({
    url: 'mock-evidence-url.jpg',
    size: 1024,
    type: 'image/jpeg'
  });
  
  // 统计相关
  mockApiService.getWeeklyStats.mockResolvedValue(mockResponses.stats.weekly);
  mockApiService.getMonthlyStats.mockResolvedValue(mockResponses.stats.monthly);
};

// 设置API错误响应
export const setupApiErrors = () => {
  mockApiService.login.mockRejectedValue(new Error('用户名或密码错误'));
  mockApiService.getTasks.mockRejectedValue(new Error('网络错误'));
  mockApiService.exchangeGameTime.mockRejectedValue(new Error('积分不足'));
};

// 重置所有Mock
export const resetApiMocks = () => {
  Object.values(mockApiService).forEach(mockFn => {
    if (typeof mockFn === 'function' && 'mockReset' in mockFn) {
      mockFn.mockReset();
    }
  });
};