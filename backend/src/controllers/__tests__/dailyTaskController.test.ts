import { Request, Response } from 'express';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, ObjectId } from 'mongodb';
import { createDailyTask, getDailyTasks, updateDailyTaskStatus, approveTask, getPendingApprovalTasks } from '../dailyTaskController';
import { collections, mongodb } from '../../config/mongodb';
import { AuthRequest } from '../../middleware/mongoAuth';

describe('DailyTask Controller', () => {
  let mongoServer: MongoMemoryServer;
  let client: MongoClient;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    client = new MongoClient(uri);
    await client.connect();
    
    // Initialize collections
    const db = client.db('summer-vacation-planning-test');
    (collections as any).users = db.collection('users');
    (collections as any).tasks = db.collection('tasks');
    (collections as any).dailyTasks = db.collection('dailyTasks');
    (collections as any).pointsRules = db.collection('pointsRules');
    (collections as any).userPointsLimits = db.collection('userPointsLimits');
    (collections as any).gameTimeConfigs = db.collection('gameTimeConfigs');
    
    // Mock mongodb client for transactions
    (mongodb as any).client = client;
  });

  afterAll(async () => {
    await client.close();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await collections.users.deleteMany({});
    await collections.tasks.deleteMany({});
    await collections.dailyTasks.deleteMany({});
    await collections.pointsRules.deleteMany({});
    await collections.userPointsLimits.deleteMany({});
    await collections.gameTimeConfigs.deleteMany({});
  });

  describe('createDailyTask', () => {
    it('should create a daily task successfully', async () => {
      // Insert test data
      const userId = new ObjectId();
      const taskId = new ObjectId();
      
      await collections.users.insertOne({
        _id: userId,
        email: 'student@test.com',
        displayName: 'Test Student',
        role: 'student',
        points: 0,
        currentStreak: 0,
        medals: { bronze: false, silver: false, gold: false, diamond: false },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await collections.tasks.insertOne({
        _id: taskId,
        title: '数学练习',
        description: '完成数学作业',
        category: 'learning',
        difficulty: 'medium',
        estimatedTime: 30,
        points: 10,
        requiresEvidence: true,
        evidenceTypes: ['text'],
        tags: [],
        createdBy: userId.toString(),
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const req = {
        user: {
          id: userId.toString(),
          email: 'student@test.com',
          role: 'student',
        },
        body: {
          taskId: taskId.toString(),
          date: '2023-12-01',
          plannedTime: '09:00',
          priority: 'medium',
          notes: 'Morning study session'
        }
      } as AuthRequest;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await createDailyTask(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          dailyTask: expect.objectContaining({
            userId: userId.toString(),
            taskId: taskId.toString(),
            date: '2023-12-01',
            status: 'planned',
            plannedTime: '09:00',
            priority: 'medium',
            notes: 'Morning study session'
          })
        }),
        message: 'Daily task planned successfully',
      });
    });

    it('should prevent duplicate daily tasks', async () => {
      const userId = new ObjectId();
      const taskId = new ObjectId();
      
      await collections.users.insertOne({
        _id: userId,
        email: 'student@test.com',
        displayName: 'Test Student',
        role: 'student',
        points: 0,
        currentStreak: 0,
        medals: { bronze: false, silver: false, gold: false, diamond: false },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await collections.tasks.insertOne({
        _id: taskId,
        title: '数学练习',
        description: '完成数学作业',
        category: 'learning',
        difficulty: 'medium',
        estimatedTime: 30,
        points: 10,
        requiresEvidence: false,
        evidenceTypes: [],
        tags: [],
        createdBy: userId.toString(),
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Create existing daily task
      await collections.dailyTasks.insertOne({
        userId: userId.toString(),
        taskId: taskId.toString(),
        date: '2023-12-01',
        status: 'planned',
        pointsEarned: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const req = {
        user: {
          id: userId.toString(),
          email: 'student@test.com',
          role: 'student',
        },
        body: {
          taskId: taskId.toString(),
          date: '2023-12-01',
        }
      } as AuthRequest;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await createDailyTask(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Daily task already exists for this date',
      });
    });
  });

  describe('updateDailyTaskStatus', () => {
    it('should update task status to completed and calculate points', async () => {
      const userId = new ObjectId();
      const taskId = new ObjectId();
      const dailyTaskId = new ObjectId();
      
      await collections.users.insertOne({
        _id: userId,
        email: 'student@test.com',
        displayName: 'Test Student',
        role: 'student',
        points: 0,
        currentStreak: 0,
        medals: { bronze: false, silver: false, gold: false, diamond: false },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await collections.tasks.insertOne({
        _id: taskId,
        title: '数学练习',
        description: '完成数学作业',
        category: 'learning',
        difficulty: 'medium',
        estimatedTime: 30,
        points: 10,
        requiresEvidence: true,
        evidenceTypes: ['text'],
        tags: [],
        createdBy: userId.toString(),
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await collections.dailyTasks.insertOne({
        _id: dailyTaskId,
        userId: userId.toString(),
        taskId: taskId.toString(),
        date: '2023-12-01',
        status: 'in_progress',
        pointsEarned: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const req = {
        user: {
          id: userId.toString(),
          email: 'student@test.com',
          role: 'student',
          medals: { bronze: false, silver: false, gold: false, diamond: false }
        },
        params: {
          dailyTaskId: dailyTaskId.toString()
        },
        body: {
          status: 'completed',
          evidenceText: '我完成了所有数学题目'
        }
      } as AuthRequest;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await updateDailyTaskStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            dailyTask: expect.objectContaining({
              status: 'completed',
              evidenceText: '我完成了所有数学题目'
            })
          })
        })
      );
    });
  });

  describe('getPendingApprovalTasks', () => {
    it('should return pending approval tasks for parent', async () => {
      const parentId = new ObjectId();
      const childId = new ObjectId();
      const taskId = new ObjectId();
      const dailyTaskId = new ObjectId();

      await collections.users.insertOne({
        _id: parentId,
        email: 'parent@test.com',
        displayName: 'Test Parent',
        role: 'parent',
        children: [childId.toString()],
        points: 0,
        currentStreak: 0,
        medals: { bronze: false, silver: false, gold: false, diamond: false },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await collections.users.insertOne({
        _id: childId,
        email: 'child@test.com',
        displayName: 'Test Child',
        role: 'student',
        parentId: parentId.toString(),
        points: 0,
        currentStreak: 0,
        medals: { bronze: false, silver: false, gold: false, diamond: false },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await collections.tasks.insertOne({
        _id: taskId,
        title: '英语阅读',
        description: '阅读英语故事书',
        category: 'reading',
        difficulty: 'easy',
        estimatedTime: 30,
        points: 8,
        requiresEvidence: true,
        evidenceTypes: ['text'],
        tags: [],
        createdBy: childId.toString(),
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await collections.dailyTasks.insertOne({
        _id: dailyTaskId,
        userId: childId.toString(),
        taskId: taskId.toString(),
        date: '2023-12-01',
        status: 'completed',
        evidenceText: '我读了小红帽的故事',
        pointsEarned: 8,
        approvalStatus: 'pending',
        completedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const req = {
        user: {
          id: parentId.toString(),
          email: 'parent@test.com',
          role: 'parent',
          children: [childId.toString()]
        }
      } as AuthRequest;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await getPendingApprovalTasks(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          tasks: expect.arrayContaining([
            expect.objectContaining({
              id: dailyTaskId.toString(),
              studentId: childId.toString(),
              studentName: 'Test Child',
              task: expect.objectContaining({
                title: '英语阅读',
                points: 8
              }),
              evidenceText: '我读了小红帽的故事',
              status: 'pending',
              pointsEarned: 8
            })
          ])
        }
      });
    });
  });

  describe('approveTask', () => {
    it('should approve a task and add bonus points', async () => {
      const parentId = new ObjectId();
      const childId = new ObjectId();
      const dailyTaskId = new ObjectId();

      await collections.users.insertOne({
        _id: parentId,
        email: 'parent@test.com',
        displayName: 'Test Parent',
        role: 'parent',
        children: [childId.toString()],
        points: 0,
        currentStreak: 0,
        medals: { bronze: false, silver: false, gold: false, diamond: false },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await collections.users.insertOne({
        _id: childId,
        email: 'child@test.com',
        displayName: 'Test Child',
        role: 'student',
        parentId: parentId.toString(),
        points: 10,
        currentStreak: 0,
        medals: { bronze: false, silver: false, gold: false, diamond: false },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await collections.dailyTasks.insertOne({
        _id: dailyTaskId,
        userId: childId.toString(),
        taskId: new ObjectId().toString(),
        date: '2023-12-01',
        status: 'completed',
        evidenceText: '我完成了任务',
        pointsEarned: 10,
        approvalStatus: 'pending',
        completedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const req = {
        user: {
          id: parentId.toString(),
          email: 'parent@test.com',
          role: 'parent',
          children: [childId.toString()]
        },
        params: {
          dailyTaskId: dailyTaskId.toString()
        },
        body: {
          action: 'approve',
          approvalNotes: '做得很好！',
          bonusPoints: 5
        }
      } as AuthRequest;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await approveTask(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          task: expect.objectContaining({
            approvalStatus: 'approved',
            approvalNotes: '做得很好！',
            pointsEarned: 15 // 10 + 5 bonus
          })
        },
        message: 'Task approved successfully'
      });

      // Check that user's points were updated
      const updatedUser = await collections.users.findOne({ _id: childId });
      expect(updatedUser?.points).toBe(15); // 10 + 5 bonus
    });

    it('should reject a task', async () => {
      const parentId = new ObjectId();
      const childId = new ObjectId();
      const dailyTaskId = new ObjectId();

      await collections.users.insertOne({
        _id: parentId,
        email: 'parent@test.com',
        displayName: 'Test Parent',
        role: 'parent',
        children: [childId.toString()],
        points: 0,
        currentStreak: 0,
        medals: { bronze: false, silver: false, gold: false, diamond: false },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await collections.dailyTasks.insertOne({
        _id: dailyTaskId,
        userId: childId.toString(),
        taskId: new ObjectId().toString(),
        date: '2023-12-01',
        status: 'completed',
        evidenceText: '我完成了任务',
        pointsEarned: 10,
        approvalStatus: 'pending',
        completedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const req = {
        user: {
          id: parentId.toString(),
          email: 'parent@test.com',
          role: 'parent',
          children: [childId.toString()]
        },
        params: {
          dailyTaskId: dailyTaskId.toString()
        },
        body: {
          action: 'reject',
          approvalNotes: '证据不够充分'
        }
      } as AuthRequest;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await approveTask(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          task: expect.objectContaining({
            approvalStatus: 'rejected',
            approvalNotes: '证据不够充分',
            status: 'in_progress' // Task status reverted
          })
        },
        message: 'Task rejected successfully'
      });
    });
  });
});