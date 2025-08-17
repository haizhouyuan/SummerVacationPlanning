/**
 * 统计API单元测试
 * 测试Dashboard统计、积分历史、周统计等核心API功能
 */

import { Request, Response } from 'express';
import { getDashboardStats, getPointsHistory } from '../controllers/mongoAuthController';
import { getWeeklyStats } from '../controllers/dailyTaskController';
import { collections } from '../config/mongodb';
import { AuthRequest } from '../middleware/mongoAuth';

// Mock MongoDB collections
jest.mock('../config/mongodb', () => ({
  collections: {
    users: {
      findOne: jest.fn(),
      updateOne: jest.fn(),
    },
    dailyTasks: {
      find: jest.fn(),
      aggregate: jest.fn(),
    },
    redemptions: {
      find: jest.fn(),
    },
    tasks: {
      find: jest.fn(),
    },
  },
}));

// Mock dateUtils
jest.mock('../utils/dateUtils', () => ({
  getCurrentWeek: jest.fn(() => ({
    monday: new Date('2024-08-12'),
    sunday: new Date('2024-08-18'),
    weekNumber: 33,
    year: 2024,
    weekStart: '2024-08-12',
    weekEnd: '2024-08-18',
  })),
  getToday: jest.fn(() => ({
    date: new Date('2024-08-15'),
    dateString: '2024-08-15',
  })),
  formatDate: jest.fn((date: Date) => date.toISOString().split('T')[0]),
}));

describe('统计API测试', () => {
  const mockCollections = collections as jest.Mocked<typeof collections>;
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockReq = {
      user: {
        id: 'user123',
        email: 'test@example.com',
        displayName: '测试用户',
        role: 'student',
        points: 150,
        currentStreak: 5,
        medals: {
          bronze: true,
          silver: false,
          gold: false,
          diamond: false,
        },
      },
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe('getDashboardStats', () => {
    it('应该返回正确的用户仪表板统计信息', async () => {
      // Mock用户数据
      const mockUser = {
        _id: 'user123',
        displayName: '测试用户',
        email: 'test@example.com',
        points: 150,
        currentStreak: 5,
        medals: {
          bronze: true,
          silver: false,
          gold: false,
          diamond: false,
        },
      };

      // Mock本周任务数据
      const mockWeeklyTasks = [
        { status: 'completed', pointsEarned: 15 },
        { status: 'completed', pointsEarned: 20 },
        { status: 'completed', pointsEarned: 10 },
        { status: 'planned', pointsEarned: 0 },
        { status: 'in_progress', pointsEarned: 0 },
        { status: 'skipped', pointsEarned: 0 },
      ];

      mockCollections.users.findOne.mockResolvedValue(mockUser);
      mockCollections.dailyTasks.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mockWeeklyTasks),
      } as any);

      await getDashboardStats(mockReq as AuthRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          stats: expect.objectContaining({
            user: expect.objectContaining({
              id: 'user123',
              name: '测试用户',
              points: 150,
              level: 2, // Math.floor(150/100) + 1
              currentStreak: 5,
            }),
            weeklyStats: expect.objectContaining({
              completed: 3,
              planned: 1,
              inProgress: 1,
              skipped: 1,
              total: 6,
              totalPointsEarned: 45,
              completionRate: 50, // Math.round((3/6) * 100)
              averagePointsPerTask: 8, // Math.round(45/6)
            }),
            achievements: expect.any(Array),
          }),
        },
      });
    });

    it('应该处理用户未找到的情况', async () => {
      mockCollections.users.findOne.mockResolvedValue(null);

      await getDashboardStats(mockReq as AuthRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not found',
      });
    });

    it('应该处理未认证用户', async () => {
      mockReq.user = undefined;

      await getDashboardStats(mockReq as AuthRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not authenticated',
      });
    });

    it('应该正确计算成就信息', async () => {
      const mockUser = {
        _id: 'user123',
        displayName: '测试用户',
        points: 250, // 高积分用户
        currentStreak: 15, // 长连续天数
        medals: {
          bronze: true,
          silver: true,
          gold: false,
          diamond: false,
        },
      };

      const mockWeeklyTasks = Array(12).fill(null).map((_, index) => ({
        status: 'completed',
        pointsEarned: 20,
      }));

      mockCollections.users.findOne.mockResolvedValue(mockUser);
      mockCollections.dailyTasks.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mockWeeklyTasks),
      } as any);

      await getDashboardStats(mockReq as AuthRequest, mockRes as Response);

      const callArgs = (mockRes.json as jest.Mock).mock.calls[0][0];
      const achievements = callArgs.data.stats.achievements;

      // 检查连续天数成就
      const streakAchievement = achievements.find((a: any) => a.type === 'streak');
      expect(streakAchievement).toEqual(expect.objectContaining({
        type: 'streak',
        level: 3, // 15天应该是level 3
        title: '连续达人',
        isUnlocked: true,
        progress: 15,
      }));

      // 检查积分成就
      const pointsAchievement = achievements.find((a: any) => a.type === 'points');
      expect(pointsAchievement).toEqual(expect.objectContaining({
        type: 'points',
        level: 3, // Math.floor(250/100) + 1 = 3
        title: '积分收集者',
        isUnlocked: true,
        progress: 50, // 250 % 100 = 50
      }));
    });

    it('应该处理数据库错误', async () => {
      mockCollections.users.findOne.mockRejectedValue(new Error('Database error'));

      await getDashboardStats(mockReq as AuthRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to get dashboard statistics',
      });
    });
  });

  describe('getPointsHistory', () => {
    it('应该返回用户的积分历史记录', async () => {
      const mockPointsHistory = [
        {
          _id: 'history1',
          userId: 'user123',
          type: 'earn',
          amount: 15,
          source: 'task_completion',
          description: '完成阅读任务',
          createdAt: new Date('2024-08-15'),
        },
        {
          _id: 'history2',
          userId: 'user123',
          type: 'spend',
          amount: 10,
          source: 'game_time_exchange',
          description: '兑换游戏时间',
          createdAt: new Date('2024-08-14'),
        },
      ];

      mockCollections.dailyTasks.aggregate.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mockPointsHistory),
      } as any);

      mockCollections.dailyTasks.aggregate.mockReturnValueOnce({
        toArray: jest.fn().mockResolvedValue([{ totalCount: 2 }]),
      } as any);

      mockReq.query = {};

      await getPointsHistory(mockReq as AuthRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          pointsHistory: expect.any(Array),
          summary: expect.objectContaining({
            totalTransactions: 2,
            totalEarned: 15,
            totalSpent: 10,
            netGain: 5,
          }),
          pagination: expect.any(Object),
        }),
      });
    });

    it('应该支持日期范围过滤', async () => {
      mockReq.query = {
        startDate: '2024-08-01',
        endDate: '2024-08-31',
      };

      mockCollections.dailyTasks.aggregate
        .mockReturnValueOnce({
          toArray: jest.fn().mockResolvedValue([{ totalCount: 0 }]),
        } as any)
        .mockReturnValue({
          toArray: jest.fn().mockResolvedValue([]),
        } as any);

      await getPointsHistory(mockReq as AuthRequest, mockRes as Response);

      expect(mockCollections.dailyTasks.aggregate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            $match: expect.objectContaining({
              createdAt: expect.objectContaining({
                $gte: expect.any(Date),
                $lte: expect.any(Date),
              }),
            }),
          }),
        ])
      );
    });

    it('应该支持类型过滤', async () => {
      mockReq.query = {
        type: 'earn',
      };

      mockCollections.dailyTasks.aggregate
        .mockReturnValueOnce({
          toArray: jest.fn().mockResolvedValue([{ totalCount: 0 }]),
        } as any)
        .mockReturnValue({
          toArray: jest.fn().mockResolvedValue([]),
        } as any);

      await getPointsHistory(mockReq as AuthRequest, mockRes as Response);

      // 验证过滤条件包含type
      const aggregateCall = mockCollections.dailyTasks.aggregate.mock.calls[1][0];
      const matchStage = aggregateCall.find((stage: any) => stage.$match);
      expect(matchStage.$match).toEqual(expect.objectContaining({
        type: 'earn',
      }));
    });
  });

  describe('getWeeklyStats', () => {
    beforeEach(() => {
      mockReq.params = {};
      mockReq.query = {};
    });

    it('应该返回当前周的统计信息', async () => {
      const mockWeeklyTasks = [
        { status: 'completed', pointsEarned: 15 },
        { status: 'completed', pointsEarned: 20 },
        { status: 'planned', pointsEarned: 0 },
        { status: 'in_progress', pointsEarned: 0 },
      ];

      mockCollections.dailyTasks.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mockWeeklyTasks),
      } as any);

      await getWeeklyStats(mockReq as AuthRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          stats: expect.objectContaining({
            totalPlannedTasks: 4,
            totalCompletedTasks: 2,
            totalPointsEarned: 35,
            completionRate: 50, // (2/4) * 100
          }),
        },
      });
    });

    it('应该处理空数据的情况', async () => {
      mockCollections.dailyTasks.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([]),
      } as any);

      await getWeeklyStats(mockReq as AuthRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          stats: expect.objectContaining({
            totalPlannedTasks: 0,
            totalCompletedTasks: 0,
            totalPointsEarned: 0,
            completionRate: 0,
          }),
        },
      });
    });

    it('应该处理数据库查询错误', async () => {
      mockCollections.dailyTasks.find.mockReturnValue({
        toArray: jest.fn().mockRejectedValue(new Error('Database error')),
      } as any);

      await getWeeklyStats(mockReq as AuthRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to get weekly stats',
      });
    });
  });

  describe('边界情况和性能测试', () => {
    it('应该处理大量数据的统计计算', async () => {
      const largeTaskArray = Array(1000).fill(null).map((_, index) => ({
        status: index % 3 === 0 ? 'completed' : index % 3 === 1 ? 'planned' : 'in_progress',
        pointsEarned: index % 3 === 0 ? 15 : 0,
      }));

      const mockUser = {
        _id: 'user123',
        displayName: '测试用户',
        points: 5000,
        currentStreak: 100,
        medals: { bronze: true, silver: true, gold: true, diamond: true },
      };

      mockCollections.users.findOne.mockResolvedValue(mockUser);
      mockCollections.dailyTasks.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(largeTaskArray),
      } as any);

      const startTime = Date.now();
      await getDashboardStats(mockReq as AuthRequest, mockRes as Response);
      const endTime = Date.now();

      // 应该在合理时间内完成（假设小于1秒）
      expect(endTime - startTime).toBeLessThan(1000);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('应该正确处理零积分和零任务的情况', async () => {
      const mockUser = {
        _id: 'newuser',
        displayName: '新用户',
        points: 0,
        currentStreak: 0,
        medals: { bronze: false, silver: false, gold: false, diamond: false },
      };

      mockCollections.users.findOne.mockResolvedValue(mockUser);
      mockCollections.dailyTasks.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([]),
      } as any);

      await getDashboardStats(mockReq as AuthRequest, mockRes as Response);

      const callArgs = (mockRes.json as jest.Mock).mock.calls[0][0];
      expect(callArgs.data.stats.weeklyStats.completionRate).toBe(0);
      expect(callArgs.data.stats.weeklyStats.averagePointsPerTask).toBe(0);
      expect(callArgs.data.stats.user.level).toBe(1);
    });
  });
});