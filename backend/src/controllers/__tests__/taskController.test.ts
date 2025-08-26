/**
 * Task Controller Unit Tests
 * 任务控制器单元测试
 */

import request from 'supertest';
import { Express } from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';

import { createTestApp } from '../../test-utils/testApp';
import { User } from '../../models/User';
import { Task } from '../../models/Task';

describe('Task Controller', () => {
  let app: Express;
  let mongoServer: MongoMemoryServer;
  let testUser: any;
  let parentUser: any;
  let childUser: any;
  let authToken: string;
  let parentToken: string;
  
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    app = createTestApp();
  });
  
  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });
  
  beforeEach(async () => {
    // 清理数据库
    await User.deleteMany({});
    await Task.deleteMany({});
    
    // 创建测试用户
    testUser = await User.create({
      username: '测试学生',
      email: 'student@test.com',
      password: 'hashedpassword',
      role: 'student',
      points: 100
    });
    
    // 创建家长和孩子用户
    parentUser = await User.create({
      username: '测试家长',
      email: 'parent@test.com',
      password: 'hashedpassword',
      role: 'parent',
      points: 0
    });
    
    childUser = await User.create({
      username: '测试孩子',
      email: 'child@test.com',
      password: 'hashedpassword',
      role: 'student',
      points: 50,
      parentId: parentUser._id
    });
    
    // 生成认证token
    authToken = jwt.sign(
      { userId: testUser._id.toString(), role: 'student' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
    
    parentToken = jwt.sign(
      { userId: parentUser._id.toString(), role: 'parent' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });
  
  describe('GET /api/tasks', () => {
    beforeEach(async () => {
      // 创建测试任务
      await Task.create([
        {
          userId: testUser._id,
          title: '用户1的任务1',
          description: '描述1',
          category: 'exercise',
          difficulty: 'easy',
          points: 30,
          evidenceRequired: true,
          timeEstimate: 30
        },
        {
          userId: testUser._id,
          title: '用户1的任务2',
          description: '描述2',
          category: 'reading',
          difficulty: 'medium',
          points: 40,
          evidenceRequired: false,
          timeEstimate: 45
        },
        {
          userId: childUser._id,
          title: '其他用户的任务',
          description: '描述3',
          category: 'chores',
          difficulty: 'hard',
          points: 50,
          evidenceRequired: true,
          timeEstimate: 60
        }
      ]);
    });
    
    test('应该获取用户的任务列表', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(2); // 只返回当前用户的任务
      
      expect(response.body[0]).toHaveProperty('title');
      expect(response.body[0]).toHaveProperty('category');
      expect(response.body[0]).toHaveProperty('points');
      expect(response.body[0]).toHaveProperty('userId', testUser._id.toString());
    });
    
    test('应该按类别过滤任务', async () => {
      const response = await request(app)
        .get('/api/tasks?category=exercise')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body).toHaveLength(1);
      expect(response.body[0].category).toBe('exercise');
    });
    
    test('应该按难度过滤任务', async () => {
      const response = await request(app)
        .get('/api/tasks?difficulty=medium')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body).toHaveLength(1);
      expect(response.body[0].difficulty).toBe('medium');
    });
    
    test('应该支持任务分页', async () => {
      // 创建更多任务
      const moreTasks = Array.from({ length: 15 }, (_, i) => ({
        userId: testUser._id,
        title: `任务${i + 3}`,
        description: `描述${i + 3}`,
        category: 'exercise',
        difficulty: 'easy',
        points: 30,
        evidenceRequired: false,
        timeEstimate: 30
      }));
      await Task.create(moreTasks);
      
      // 第一页
      const page1 = await request(app)
        .get('/api/tasks?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(page1.body).toHaveLength(10);
      expect(page1.headers['x-total-count']).toBe('17'); // 2个初始任务 + 15个新任务
      
      // 第二页
      const page2 = await request(app)
        .get('/api/tasks?page=2&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(page2.body).toHaveLength(7); // 剩余7个任务
    });
    
    test('应该拒绝未认证的请求', async () => {
      await request(app)
        .get('/api/tasks')
        .expect(401);
    });
    
    test('家长应该可以查看孩子的任务', async () => {
      const response = await request(app)
        .get(`/api/tasks?childId=${childUser._id}`)
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);
      
      expect(response.body).toHaveLength(1);
      expect(response.body[0].userId).toBe(childUser._id.toString());
    });
    
    test('家长不应该能查看非孩子的任务', async () => {
      await request(app)
        .get(`/api/tasks?childId=${testUser._id}`) // testUser不是parentUser的孩子
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(403);
    });
  });
  
  describe('POST /api/tasks', () => {
    test('应该创建新任务', async () => {
      const taskData = {
        title: '新测试任务',
        description: '这是一个新的测试任务',
        category: 'exercise',
        difficulty: 'medium',
        points: 50,
        evidenceRequired: true,
        timeEstimate: 45
      };
      
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(201);
      
      expect(response.body).toHaveProperty('id');
      expect(response.body).toMatchObject({
        title: taskData.title,
        description: taskData.description,
        category: taskData.category,
        difficulty: taskData.difficulty,
        points: taskData.points,
        evidenceRequired: taskData.evidenceRequired,
        timeEstimate: taskData.timeEstimate,
        userId: testUser._id.toString()
      });
      
      // 验证数据库中的任务
      const dbTask = await Task.findById(response.body.id);
      expect(dbTask).toBeTruthy();
      expect(dbTask?.title).toBe(taskData.title);
    });
    
    test('应该验证必填字段', async () => {
      const incompleteTask = {
        description: '缺少标题的任务',
        category: 'exercise'
      };
      
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(incompleteTask)
        .expect(400);
    });
    
    test('应该验证任务分类', async () => {
      const invalidTask = {
        title: '无效任务',
        description: '描述',
        category: 'invalid_category',
        difficulty: 'easy',
        points: 30
      };
      
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidTask)
        .expect(400);
    });
    
    test('应该验证任务难度', async () => {
      const invalidTask = {
        title: '无效任务',
        description: '描述',
        category: 'exercise',
        difficulty: 'invalid_difficulty',
        points: 30
      };
      
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidTask)
        .expect(400);
    });
    
    test('应该验证积分值', async () => {
      const invalidTask = {
        title: '无效任务',
        description: '描述',
        category: 'exercise',
        difficulty: 'easy',
        points: -10 // 负数积分
      };
      
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidTask)
        .expect(400);
    });
    
    test('应该拒绝未认证的请求', async () => {
      const taskData = {
        title: '测试任务',
        category: 'exercise',
        difficulty: 'easy',
        points: 30
      };
      
      await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(401);
    });
  });
  
  describe('PUT /api/tasks/:id', () => {
    let testTask: any;
    
    beforeEach(async () => {
      testTask = await Task.create({
        userId: testUser._id,
        title: '原始任务',
        description: '原始描述',
        category: 'exercise',
        difficulty: 'easy',
        points: 30,
        evidenceRequired: false,
        timeEstimate: 30
      });
    });
    
    test('应该更新任务', async () => {
      const updateData = {
        title: '更新后的任务',
        description: '更新后的描述',
        points: 50
      };
      
      const response = await request(app)
        .put(`/api/tasks/${testTask._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);
      
      expect(response.body).toMatchObject(updateData);
      
      // 验证数据库更新
      const updatedTask = await Task.findById(testTask._id);
      expect(updatedTask?.title).toBe(updateData.title);
      expect(updatedTask?.points).toBe(updateData.points);
    });
    
    test('应该拒绝更新其他用户的任务', async () => {
      const otherUserTask = await Task.create({
        userId: childUser._id,
        title: '其他用户任务',
        description: '描述',
        category: 'reading',
        difficulty: 'medium',
        points: 40,
        evidenceRequired: false,
        timeEstimate: 45
      });
      
      await request(app)
        .put(`/api/tasks/${otherUserTask._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: '恶意修改' })
        .expect(403);
    });
    
    test('应该拒绝更新不存在的任务', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      await request(app)
        .put(`/api/tasks/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: '更新标题' })
        .expect(404);
    });
  });
  
  describe('DELETE /api/tasks/:id', () => {
    let testTask: any;
    
    beforeEach(async () => {
      testTask = await Task.create({
        userId: testUser._id,
        title: '待删除任务',
        description: '描述',
        category: 'exercise',
        difficulty: 'easy',
        points: 30,
        evidenceRequired: false,
        timeEstimate: 30
      });
    });
    
    test('应该删除任务', async () => {
      await request(app)
        .delete(`/api/tasks/${testTask._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      // 验证任务已从数据库删除
      const deletedTask = await Task.findById(testTask._id);
      expect(deletedTask).toBeNull();
    });
    
    test('应该拒绝删除其他用户的任务', async () => {
      const otherUserTask = await Task.create({
        userId: childUser._id,
        title: '其他用户任务',
        description: '描述',
        category: 'reading',
        difficulty: 'medium',
        points: 40,
        evidenceRequired: false,
        timeEstimate: 45
      });
      
      await request(app)
        .delete(`/api/tasks/${otherUserTask._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });
    
    test('应该拒绝删除不存在的任务', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      await request(app)
        .delete(`/api/tasks/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
  
  describe('权限控制', () => {
    test('学生只能访问自己的任务', async () => {
      await Task.create([
        { userId: testUser._id, title: '我的任务', category: 'exercise', difficulty: 'easy', points: 30 },
        { userId: childUser._id, title: '其他人的任务', category: 'reading', difficulty: 'medium', points: 40 }
      ]);
      
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body).toHaveLength(1);
      expect(response.body[0].title).toBe('我的任务');
    });
    
    test('家长可以访问孩子的任务', async () => {
      await Task.create({
        userId: childUser._id,
        title: '孩子的任务',
        category: 'exercise',
        difficulty: 'easy',
        points: 30
      });
      
      const response = await request(app)
        .get(`/api/tasks?childId=${childUser._id}`)
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);
      
      expect(response.body).toHaveLength(1);
      expect(response.body[0].title).toBe('孩子的任务');
    });
    
    test('家长不能访问非孩子的任务', async () => {
      await request(app)
        .get(`/api/tasks?childId=${testUser._id}`) // testUser不是parentUser的孩子
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(403);
    });
  });
});