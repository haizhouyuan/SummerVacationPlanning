/**
 * API Endpoints Integration Tests
 * API端点集成测试
 */

import request from 'supertest';
import { Express } from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';

import { createTestApp } from '../../test-utils/testApp';
import { UserFactory } from '../../../../shared/test-utils/factories/userFactory';
import { TaskFactory } from '../../../../shared/test-utils/factories/taskFactory';

describe('API Endpoints Integration Tests', () => {
  let app: Express;
  let mongoServer: MongoMemoryServer;
  let testUser: any;
  let parentUser: any;
  let childUser: any;
  let studentToken: string;
  let parentToken: string;
  
  beforeAll(async () => {
    // 启动内存MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    
    // 创建测试应用
    app = createTestApp();
  });
  
  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });
  
  beforeEach(async () => {
    // 清理数据库
    await mongoose.connection.db.dropDatabase();
    
    // 创建测试数据
    testUser = await UserFactory.createStudent({
      username: '测试学生',
      email: 'student@test.com',
      points: 100
    });
    
    const family = await UserFactory.createFamily();
    parentUser = family.parent;
    childUser = family.children[0];
    
    // 生成认证token
    studentToken = jwt.sign(
      { userId: testUser.id, role: 'student' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
    
    parentToken = jwt.sign(
      { userId: parentUser.id, role: 'parent' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });
  
  describe('认证流程集成测试', () => {
    test('完整的用户注册登录流程', async () => {
      // 1. 注册新用户
      const registerData = {
        username: '新用户',
        email: 'newuser@test.com',
        password: 'SecurePass123!',
        role: 'student'
      };
      
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(registerData)
        .expect(201);
      
      expect(registerResponse.body).toHaveProperty('token');
      expect(registerResponse.body).toHaveProperty('user');
      expect(registerResponse.body.user).toBeValidUser();
      
      const { token, user } = registerResponse.body;
      
      // 2. 使用注册时的token获取用户信息
      const userInfoResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(userInfoResponse.body.id).toBe(user.id);
      
      // 3. 登出
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      // 4. 重新登录
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: registerData.email,
          password: registerData.password
        })
        .expect(200);
      
      expect(loginResponse.body).toHaveProperty('token');
      expect(loginResponse.body.token).not.toBe(token); // 新的token
    });
    
    test('Token刷新流程', async () => {
      // 1. 获取初始token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'student@test.com',
          password: 'TestPass123!'
        });
      
      const initialToken = loginResponse.body.token;
      
      // 2. 刷新token
      const refreshResponse = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', `Bearer ${initialToken}`)
        .expect(200);
      
      expect(refreshResponse.body.token).toBeTruthy();
      expect(refreshResponse.body.token).not.toBe(initialToken);
      
      // 3. 使用新token访问受保护的接口
      await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${refreshResponse.body.token}`)
        .expect(200);
    });
  });
  
  describe('任务管理流程集成测试', () => {
    test('任务的完整CRUD流程', async () => {
      // 1. 创建任务
      const taskData = {
        title: '集成测试任务',
        description: '用于集成测试的任务',
        category: 'exercise',
        difficulty: 'medium',
        points: 50,
        evidenceRequired: true,
        timeEstimate: 45
      };
      
      const createResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(taskData)
        .expect(201);
      
      const taskId = createResponse.body.id;
      expect(createResponse.body).toBeValidTask();
      
      // 2. 获取任务列表
      const listResponse = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);
      
      expect(listResponse.body).toContainEqual(
        expect.objectContaining({ id: taskId })
      );
      
      // 3. 更新任务
      const updateData = {
        title: '更新后的任务',
        points: 60
      };
      
      const updateResponse = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send(updateData)
        .expect(200);
      
      expect(updateResponse.body.title).toBe(updateData.title);
      expect(updateResponse.body.points).toBe(updateData.points);
      
      // 4. 删除任务
      await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);
      
      // 5. 验证任务已删除
      const finalListResponse = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);
      
      expect(finalListResponse.body).not.toContainEqual(
        expect.objectContaining({ id: taskId })
      );
    });
    
    test('每日任务执行流程', async () => {
      // 1. 创建基础任务
      const task = await TaskFactory.create({ 
        userId: testUser.id,
        evidenceRequired: false
      });
      
      // 2. 创建每日任务
      const dailyTaskResponse = await request(app)
        .post('/api/daily-tasks')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          taskId: task.id,
          date: '2024-08-26',
          scheduledTime: '2024-08-26T09:00:00Z'
        })
        .expect(201);
      
      const dailyTaskId = dailyTaskResponse.body.id;
      
      // 3. 开始任务
      const startResponse = await request(app)
        .post(`/api/daily-tasks/${dailyTaskId}/start`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);
      
      expect(startResponse.body.status).toBe('in_progress');
      expect(startResponse.body.startedAt).toBeTruthy();
      
      // 4. 完成任务（无需证据）
      const completeResponse = await request(app)
        .post(`/api/daily-tasks/${dailyTaskId}/complete`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ notes: '任务完成' })
        .expect(200);
      
      expect(completeResponse.body.status).toBe('completed');
      expect(completeResponse.body.pointsEarned).toBeGreaterThan(0);
      
      // 5. 验证用户积分增加
      const userResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);
      
      expect(userResponse.body.points).toBeGreaterThan(testUser.points);
    });
  });
  
  describe('积分和兑换流程集成测试', () => {
    test('积分兑换游戏时间流程', async () => {
      // 确保用户有足够积分
      await request(app)
        .patch('/api/users/me')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ points: 100 });
      
      // 1. 检查积分余额
      const balanceResponse = await request(app)
        .get('/api/points/balance')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);
      
      const initialPoints = balanceResponse.body.points;
      expect(initialPoints).toBeGreaterThanOrEqual(100);
      
      // 2. 兑换游戏时间
      const exchangeResponse = await request(app)
        .post('/api/points/exchange/game-time')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          gameType: 'normal',
          minutes: 30
        })
        .expect(200);
      
      expect(exchangeResponse.body.success).toBe(true);
      expect(exchangeResponse.body.remainingPoints).toBeLessThan(initialPoints);
      
      // 3. 检查积分历史记录
      const historyResponse = await request(app)
        .get('/api/points/history')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);
      
      expect(historyResponse.body).toContainEqual(
        expect.objectContaining({
          type: 'spent',
          reason: expect.stringContaining('游戏时间')
        })
      );
    });
    
    test('特殊奖励申请审批流程', async () => {
      // 1. 学生申请特殊奖励
      const redemptionResponse = await request(app)
        .post('/api/redemptions')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          type: 'special_reward',
          points: 100,
          details: {
            rewardName: '特殊玩具',
            reason: '表现优秀'
          }
        })
        .expect(201);
      
      const redemptionId = redemptionResponse.body.id;
      expect(redemptionResponse.body.status).toBe('pending');
      
      // 2. 家长查看待审批请求
      const pendingResponse = await request(app)
        .get(`/api/redemptions?childId=${testUser.id}`)
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);
      
      expect(pendingResponse.body).toContainEqual(
        expect.objectContaining({ id: redemptionId })
      );
      
      // 3. 家长审批通过
      const approvalResponse = await request(app)
        .post(`/api/redemptions/${redemptionId}/approve`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          approved: true,
          comment: '奖励批准'
        })
        .expect(200);
      
      expect(approvalResponse.body.status).toBe('approved');
      
      // 4. 验证学生积分扣除
      const finalBalanceResponse = await request(app)
        .get('/api/points/balance')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);
      
      expect(finalBalanceResponse.body.points).toBeLessThan(testUser.points);
    });
  });
  
  describe('权限控制集成测试', () => {
    test('家长访问孩子数据的权限控制', async () => {
      // 创建孩子的任务
      const childTask = await TaskFactory.create({ 
        userId: childUser.id 
      });
      
      // 1. 家长可以查看孩子的任务
      const childTasksResponse = await request(app)
        .get(`/api/tasks?childId=${childUser.id}`)
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);
      
      expect(childTasksResponse.body).toContainEqual(
        expect.objectContaining({ id: childTask.id })
      );
      
      // 2. 家长不能查看非孩子的任务
      await request(app)
        .get(`/api/tasks?childId=${testUser.id}`)
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(403);
      
      // 3. 学生不能使用家长功能
      await request(app)
        .get(`/api/tasks?childId=${childUser.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });
    
    test('跨用户数据访问防护', async () => {
      const otherUserTask = await TaskFactory.create({ 
        userId: childUser.id 
      });
      
      // 1. 用户不能修改其他用户的任务
      await request(app)
        .put(`/api/tasks/${otherUserTask.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ title: '恶意修改' })
        .expect(403);
      
      // 2. 用户不能删除其他用户的任务
      await request(app)
        .delete(`/api/tasks/${otherUserTask.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
      
      // 3. 用户不能访问其他用户的积分信息
      await request(app)
        .get(`/api/points/balance?userId=${childUser.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });
  });
  
  describe('错误处理集成测试', () => {
    test('无效token的处理', async () => {
      // 1. 完全无效的token
      await request(app)
        .get('/api/tasks')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
      
      // 2. 过期的token
      const expiredToken = jwt.sign(
        { userId: testUser.id, role: 'student' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '-1h' }
      );
      
      await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
      
      // 3. 缺少token
      await request(app)
        .get('/api/tasks')
        .expect(401);
    });
    
    test('数据验证错误处理', async () => {
      // 1. 创建任务时的验证错误
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          // 缺少必填字段
          description: '只有描述',
          category: 'invalid_category'
        })
        .expect(400);
      
      // 2. 积分兑换时的验证错误
      await request(app)
        .post('/api/points/exchange/game-time')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          gameType: 'invalid_type',
          minutes: -10
        })
        .expect(400);
    });
    
    test('资源不存在的错误处理', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      // 1. 访问不存在的任务
      await request(app)
        .get(`/api/tasks/${nonExistentId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(404);
      
      // 2. 更新不存在的任务
      await request(app)
        .put(`/api/tasks/${nonExistentId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ title: '更新' })
        .expect(404);
      
      // 3. 删除不存在的任务
      await request(app)
        .delete(`/api/tasks/${nonExistentId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(404);
    });
  });
  
  describe('并发操作测试', () => {
    test('并发积分操作的数据一致性', async () => {
      // 设置用户初始积分
      const initialPoints = 100;
      await request(app)
        .patch('/api/users/me')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ points: initialPoints });
      
      // 同时执行多个积分扣除操作
      const promises = Array(5).fill(null).map(() =>
        request(app)
          .post('/api/points/exchange/game-time')
          .set('Authorization', `Bearer ${studentToken}`)
          .send({ gameType: 'normal', minutes: 10 })
      );
      
      const results = await Promise.allSettled(promises);
      
      // 检查结果 - 应该只有一个或几个成功，确保不会重复扣除
      const successCount = results.filter(r => 
        r.status === 'fulfilled' && r.value.status === 200
      ).length;
      
      expect(successCount).toBeGreaterThan(0);
      expect(successCount).toBeLessThanOrEqual(5);
      
      // 验证最终积分是正确的
      const finalBalanceResponse = await request(app)
        .get('/api/points/balance')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);
      
      expect(finalBalanceResponse.body.points).toBeGreaterThanOrEqual(0);
      expect(finalBalanceResponse.body.points).toBeLessThanOrEqual(initialPoints);
    });
  });
});