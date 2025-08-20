/**
 * 每日任务工作流综合测试
 * 测试学生规划任务、完成任务提交、家长审核等完整流程
 * 对应TODO清单第169-180行的测试要求
 */

import { Request, Response } from 'express';
import { 
  createDailyTask, 
  getDailyTasks, 
  updateDailyTaskStatus, 
  getPendingApprovalTasks, 
  approveTask 
} from '../controllers/dailyTaskController';
import { collections } from '../config/mongodb';
import { AuthRequest } from '../middleware/mongoAuth';

// Mock MongoDB collections
jest.mock('../config/mongodb', () => ({
  collections: {
    dailyTasks: {
      findOne: jest.fn(),
      insertOne: jest.fn(),
      find: jest.fn(),
      updateOne: jest.fn(),
      aggregate: jest.fn(),
    },
    tasks: {
      findOne: jest.fn(),
    },
    users: {
      findOne: jest.fn(),
      updateOne: jest.fn(),
    },
  },
}));

// Mock utilities
jest.mock('../utils/dateUtils', () => ({
  getToday: jest.fn(() => ({
    date: new Date('2024-08-15'),
    dateString: '2024-08-15',
  })),
  formatDate: jest.fn((date: Date) => date.toISOString().split('T')[0]),
}));

describe('每日任务工作流测试', () => {
  const mockCollections = collections as jest.Mocked<typeof collections>;
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockReq = {
      user: {
        id: 'student-user-123',
        email: 'student@test.com',
        role: 'student',
        displayName: '测试学生',
        parentId: 'parent-user-456'
      },
      body: {},
      params: {},
      query: {}
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('学生规划任务流程', () => {
    it('应该成功创建每日任务规划', async () => {
      const taskData = {
        taskId: 'task-123',
        date: '2024-08-15',
        notes: '今天要认真完成这个任务'
      };

      mockReq.body = taskData;

      // Mock查询不存在相同任务
      mockCollections.dailyTasks.findOne.mockResolvedValue(null);
      
      // Mock任务存在
      mockCollections.tasks.findOne.mockResolvedValue({
        _id: 'task-123',
        title: '阅读经典故事',
        points: 10,
        requiresEvidence: true
      });

      // Mock插入成功
      mockCollections.dailyTasks.insertOne.mockResolvedValue({
        insertedId: 'daily-task-123'
      } as any);

      await createDailyTask(mockReq as AuthRequest, mockRes as Response);

      expect(mockCollections.dailyTasks.findOne).toHaveBeenCalledWith({
        userId: 'student-user-123',
        taskId: 'task-123',
        date: '2024-08-15'
      });

      expect(mockCollections.dailyTasks.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'student-user-123',
          taskId: 'task-123',
          date: '2024-08-15',
          status: 'planned',
          notes: '今天要认真完成这个任务'
        })
      );

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: '每日任务创建成功'
        })
      );
    });

    it('应该拒绝重复添加相同任务到同一天', async () => {
      const taskData = {
        taskId: 'task-123',
        date: '2024-08-15'
      };

      mockReq.body = taskData;

      // Mock已存在相同任务
      mockCollections.dailyTasks.findOne.mockResolvedValue({
        _id: 'existing-daily-task-123',
        userId: 'student-user-123',
        taskId: 'task-123',
        date: '2024-08-15'
      });

      await createDailyTask(mockReq as AuthRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('今日已规划此任务')
        })
      );
    });

    it('应该成功查询学生的每日任务列表', async () => {
      mockReq.query = { date: '2024-08-15' };

      const mockDailyTasks = [
        {
          _id: 'daily-task-1',
          userId: 'student-user-123',
          taskId: 'task-1',
          date: '2024-08-15',
          status: 'planned'
        },
        {
          _id: 'daily-task-2',
          userId: 'student-user-123',
          taskId: 'task-2',
          date: '2024-08-15',
          status: 'completed'
        }
      ];

      mockCollections.dailyTasks.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mockDailyTasks)
      } as any);

      await getDailyTasks(mockReq as AuthRequest, mockRes as Response);

      expect(mockCollections.dailyTasks.find).toHaveBeenCalledWith({
        userId: 'student-user-123',
        date: '2024-08-15'
      });

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.arrayContaining(mockDailyTasks)
        })
      );
    });
  });

  describe('学生完成任务提交流程', () => {
    beforeEach(() => {
      mockReq.params = { dailyTaskId: 'daily-task-123' };
    });

    it('应该成功提交任务完成（带证据）', async () => {
      const updateData = {
        status: 'completed',
        evidenceText: '我认真阅读了这个故事，学到了很多道理',
        evidenceMedia: [
          { type: 'photo', url: '/uploads/evidence/photo1.jpg' }
        ]
      };

      mockReq.body = updateData;

      // Mock找到对应的每日任务
      const mockDailyTask = {
        _id: 'daily-task-123',
        userId: 'student-user-123',
        taskId: 'task-123',
        status: 'planned'
      };

      mockCollections.dailyTasks.findOne.mockResolvedValue(mockDailyTask);

      // Mock对应的任务信息
      mockCollections.tasks.findOne.mockResolvedValue({
        _id: 'task-123',
        title: '阅读经典故事',
        points: 10,
        requiresEvidence: true
      });

      // Mock更新成功
      mockCollections.dailyTasks.updateOne.mockResolvedValue({
        modifiedCount: 1
      } as any);

      await updateDailyTaskStatus(mockReq as AuthRequest, mockRes as Response);

      expect(mockCollections.dailyTasks.updateOne).toHaveBeenCalledWith(
        { _id: 'daily-task-123', userId: 'student-user-123' },
        expect.objectContaining({
          $set: expect.objectContaining({
            status: 'completed',
            evidenceText: '我认真阅读了这个故事，学到了很多道理',
            evidenceMedia: updateData.evidenceMedia,
            approvalStatus: 'pending',
            pointsEarned: 10,
            completedAt: expect.any(Date)
          })
        })
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: '任务状态更新成功'
        })
      );
    });

    it('应该处理不需要证据的任务自动审批', async () => {
      const updateData = {
        status: 'completed'
      };

      mockReq.body = updateData;

      // Mock找到对应的每日任务
      const mockDailyTask = {
        _id: 'daily-task-123',
        userId: 'student-user-123',
        taskId: 'task-123',
        status: 'planned'
      };

      mockCollections.dailyTasks.findOne.mockResolvedValue(mockDailyTask);

      // Mock任务不需要证据
      mockCollections.tasks.findOne.mockResolvedValue({
        _id: 'task-123',
        title: '整理房间',
        points: 8,
        requiresEvidence: false
      });

      // Mock用户信息
      mockCollections.users.findOne.mockResolvedValue({
        _id: 'student-user-123',
        points: 50
      });

      // Mock更新成功
      mockCollections.dailyTasks.updateOne.mockResolvedValue({
        modifiedCount: 1
      } as any);

      mockCollections.users.updateOne.mockResolvedValue({
        modifiedCount: 1
      } as any);

      await updateDailyTaskStatus(mockReq as AuthRequest, mockRes as Response);

      // 验证任务状态设为自动审批通过
      expect(mockCollections.dailyTasks.updateOne).toHaveBeenCalledWith(
        { _id: 'daily-task-123', userId: 'student-user-123' },
        expect.objectContaining({
          $set: expect.objectContaining({
            status: 'completed',
            approvalStatus: 'approved',
            pointsEarned: 8
          })
        })
      );

      // 验证积分直接计入用户账户
      expect(mockCollections.users.updateOne).toHaveBeenCalledWith(
        { _id: 'student-user-123' },
        { $inc: { points: 8 } }
      );
    });

    it('应该拒绝非任务所有者的操作', async () => {
      mockReq.body = { status: 'completed' };

      // Mock找到别人的任务
      const mockDailyTask = {
        _id: 'daily-task-123',
        userId: 'other-user-789',
        taskId: 'task-123',
        status: 'planned'
      };

      mockCollections.dailyTasks.findOne.mockResolvedValue(mockDailyTask);

      await updateDailyTaskStatus(mockReq as AuthRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('无权限操作此任务')
        })
      );
    });
  });

  describe('家长审核流程', () => {
    beforeEach(() => {
      // 切换到家长用户
      mockReq.user = {
        id: 'parent-user-456',
        email: 'parent@test.com',
        role: 'parent',
        displayName: '测试家长',
        children: ['student-user-123']
      };
    });

    it('应该成功获取待审批任务列表', async () => {
      const mockPendingTasks = [
        {
          _id: 'daily-task-1',
          userId: 'student-user-123',
          taskId: 'task-1',
          status: 'completed',
          approvalStatus: 'pending',
          evidenceText: '完成了阅读任务',
          completedAt: new Date()
        }
      ];

      mockCollections.dailyTasks.aggregate.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mockPendingTasks)
      } as any);

      await getPendingApprovalTasks(mockReq as AuthRequest, mockRes as Response);

      expect(mockCollections.dailyTasks.aggregate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            $match: {
              userId: { $in: ['student-user-123'] },
              approvalStatus: 'pending'
            }
          })
        ])
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockPendingTasks
        })
      );
    });

    it('应该成功审批通过任务', async () => {
      mockReq.params = { dailyTaskId: 'daily-task-123' };
      mockReq.body = {
        action: 'approve',
        approvalNotes: '完成得很好，继续保持！',
        bonusPoints: 5
      };

      // Mock找到待审批任务
      const mockDailyTask = {
        _id: 'daily-task-123',
        userId: 'student-user-123',
        taskId: 'task-123',
        status: 'completed',
        approvalStatus: 'pending',
        pointsEarned: 10
      };

      mockCollections.dailyTasks.findOne.mockResolvedValue(mockDailyTask);

      // Mock验证孩子关系
      mockCollections.users.findOne.mockResolvedValue({
        _id: 'student-user-123',
        parentId: 'parent-user-456',
        points: 50
      });

      // Mock更新成功
      mockCollections.dailyTasks.updateOne.mockResolvedValue({
        modifiedCount: 1
      } as any);

      mockCollections.users.updateOne.mockResolvedValue({
        modifiedCount: 1
      } as any);

      await approveTask(mockReq as AuthRequest, mockRes as Response);

      // 验证任务审批状态更新
      expect(mockCollections.dailyTasks.updateOne).toHaveBeenCalledWith(
        { _id: 'daily-task-123' },
        expect.objectContaining({
          $set: expect.objectContaining({
            approvalStatus: 'approved',
            approvedBy: 'parent-user-456',
            approvalNotes: '完成得很好，继续保持！',
            bonusPoints: 5,
            approvedAt: expect.any(Date)
          })
        })
      );

      // 验证积分计入（基础积分 + 奖励积分）
      expect(mockCollections.users.updateOne).toHaveBeenCalledWith(
        { _id: 'student-user-123' },
        { $inc: { points: 15 } } // 10 + 5
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: '任务审批成功'
        })
      );
    });

    it('应该成功拒绝任务', async () => {
      mockReq.params = { dailyTaskId: 'daily-task-123' };
      mockReq.body = {
        action: 'reject',
        approvalNotes: '证据不够充分，请重新提交'
      };

      // Mock找到待审批任务
      const mockDailyTask = {
        _id: 'daily-task-123',
        userId: 'student-user-123',
        status: 'completed',
        approvalStatus: 'pending'
      };

      mockCollections.dailyTasks.findOne.mockResolvedValue(mockDailyTask);

      // Mock验证孩子关系
      mockCollections.users.findOne.mockResolvedValue({
        _id: 'student-user-123',
        parentId: 'parent-user-456'
      });

      // Mock更新成功
      mockCollections.dailyTasks.updateOne.mockResolvedValue({
        modifiedCount: 1
      } as any);

      await approveTask(mockReq as AuthRequest, mockRes as Response);

      expect(mockCollections.dailyTasks.updateOne).toHaveBeenCalledWith(
        { _id: 'daily-task-123' },
        expect.objectContaining({
          $set: expect.objectContaining({
            approvalStatus: 'rejected',
            approvedBy: 'parent-user-456',
            approvalNotes: '证据不够充分，请重新提交',
            approvedAt: expect.any(Date)
          })
        })
      );

      // 验证拒绝时不给积分
      expect(mockCollections.users.updateOne).not.toHaveBeenCalled();

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('应该拒绝非家长用户进行审批', async () => {
      // 切换回学生用户
      mockReq.user = {
        id: 'student-user-123',
        role: 'student'
      } as any;

      mockReq.params = { dailyTaskId: 'daily-task-123' };
      mockReq.body = { action: 'approve' };

      await approveTask(mockReq as AuthRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('仅家长可以审批任务')
        })
      );
    });

    it('应该拒绝审批非自己孩子的任务', async () => {
      mockReq.params = { dailyTaskId: 'daily-task-123' };
      mockReq.body = { action: 'approve' };

      // Mock找到别人孩子的任务
      const mockDailyTask = {
        _id: 'daily-task-123',
        userId: 'other-child-789',
        status: 'completed',
        approvalStatus: 'pending'
      };

      mockCollections.dailyTasks.findOne.mockResolvedValue(mockDailyTask);

      // Mock验证不是自己的孩子
      mockCollections.users.findOne.mockResolvedValue({
        _id: 'other-child-789',
        parentId: 'other-parent-999'
      });

      await approveTask(mockReq as AuthRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('无权限审批此任务')
        })
      );
    });

    it('应该拒绝重复审批已审批的任务', async () => {
      mockReq.params = { dailyTaskId: 'daily-task-123' };
      mockReq.body = { action: 'approve' };

      // Mock已审批的任务
      const mockDailyTask = {
        _id: 'daily-task-123',
        userId: 'student-user-123',
        status: 'completed',
        approvalStatus: 'approved'
      };

      mockCollections.dailyTasks.findOne.mockResolvedValue(mockDailyTask);

      await approveTask(mockReq as AuthRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('任务已审批过')
        })
      );
    });
  });

  describe('错误处理和边界情况', () => {
    it('应该处理数据库连接错误', async () => {
      mockCollections.dailyTasks.findOne.mockRejectedValue(new Error('Database connection failed'));

      mockReq.body = { taskId: 'task-123', date: '2024-08-15' };

      await createDailyTask(mockReq as AuthRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('服务器内部错误')
        })
      );
    });

    it('应该处理无效的任务ID', async () => {
      mockReq.body = { taskId: 'invalid-task-id', date: '2024-08-15' };

      // Mock任务不存在
      mockCollections.tasks.findOne.mockResolvedValue(null);

      await createDailyTask(mockReq as AuthRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('任务不存在')
        })
      );
    });

    it('应该处理缺少必要字段的请求', async () => {
      mockReq.body = {}; // 缺少必要字段

      await createDailyTask(mockReq as AuthRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('缺少必要参数')
        })
      );
    });
  });
});