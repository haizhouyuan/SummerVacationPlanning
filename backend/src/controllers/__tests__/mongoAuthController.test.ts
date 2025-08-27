/**
 * MongoAuth Controller Unit Tests
 * MongoDB认证控制器单元测试
 */

import request from 'supertest';
import { Express } from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { createTestApp } from '../../test-utils/testApp';
import { User, UserModel } from '../../models/User';

describe('MongoAuth Controller', () => {
  let app: Express;
  let mongoServer: MongoMemoryServer;
  
  beforeAll(async () => {
    // 断开现有连接
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
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
    await User.deleteMany({});
  });
  
  describe('POST /api/auth/register', () => {
    test('应该成功注册新学生用户', async () => {
      const userData = {
        displayName: '测试学生',
        email: 'student@test.com',
        password: 'SecurePass123!',
        role: 'student'
      };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);
      
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toMatchObject({
        displayName: userData.displayName,
        email: userData.email,
        role: 'student',
        points: 0
      });
      expect(response.body.user).not.toHaveProperty('password');
      
      // 验证数据库中的用户
      const dbUser = await User.findById(response.body.user.id);
      expect(dbUser).toBeTruthy();
      expect(dbUser?.displayName).toBe(userData.displayName);
    });
    
    test('应该成功注册新家长用户', async () => {
      const userData = {
        displayName: '测试家长',
        email: 'parent@test.com',
        password: 'SecurePass123!',
        role: 'parent'
      };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);
      
      expect(response.body.user.role).toBe('parent');
      expect(response.body.user.points).toBe(0); // 家长也有积分字段
    });
    
    test('应该拒绝重复邮箱注册', async () => {
      // 先注册一个用户
      const existingUser = {
        displayName: '已存在用户',
        email: 'existing@test.com',
        password: await bcrypt.hash('password123', 10),
        role: 'student' as const,
        points: 0
      };
      await User.create(existingUser);
      
      // 尝试用相同邮箱注册
      const userData = {
        displayName: '另一个用户',
        email: 'existing@test.com',
        password: 'AnotherPass123!',
        role: 'student'
      };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);
      
      expect(response.body.error).toContain('邮箱已存在');
    });
    
    test('应该验证密码强度要求', async () => {
      const weakPasswords = [
        { password: '123456', name: '太短' },
        { password: 'password', name: '无数字无特殊字符' },
        { password: 'Password', name: '无数字无特殊字符' },
        { password: 'Password123', name: '无特殊字符' }
      ];
      
      for (const { password, name } of weakPasswords) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            displayName: '测试用户',
            email: `test_${Date.now()}@test.com`,
            password,
            role: 'student'
          })
          .expect(400);
        
        expect(response.body.error).toMatch(/密码/);
      }
    });
    
    test('应该验证必填字段', async () => {
      const incompleteData = [
        { email: 'test@test.com', password: 'Pass123!', role: 'student' }, // 缺displayName
        { displayName: '用户', password: 'Pass123!', role: 'student' }, // 缺邮箱
        { displayName: '用户', email: 'test@test.com', role: 'student' }, // 缺密码
        { displayName: '用户', email: 'test@test.com', password: 'Pass123!' } // 缺角色
      ];
      
      for (const data of incompleteData) {
        await request(app)
          .post('/api/auth/register')
          .send(data)
          .expect(400);
      }
    });
    
    test('应该验证邮箱格式', async () => {
      const invalidEmails = ['invalid-email', '@test.com', 'test@', 'test.com'];
      
      for (const email of invalidEmails) {
        await request(app)
          .post('/api/auth/register')
          .send({
            displayName: '测试用户',
            email,
            password: 'ValidPass123!',
            role: 'student'
          })
          .expect(400);
      }
    });
    
    test('应该验证角色值', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          displayName: '测试用户',
          email: 'test@test.com',
          password: 'ValidPass123!',
          role: 'invalid_role'
        })
        .expect(400);
    });
  });
  
  describe('POST /api/auth/login', () => {
    let testUser: any;
    
    beforeEach(async () => {
      // 创建测试用户
      testUser = await User.create({
        displayName: '测试用户',
        email: 'testuser@test.com',
        password: await bcrypt.hash('TestPass123!', 10),
        role: 'student',
        points: 100
      });
    });
    
    test('应该成功登录有效用户', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testuser@test.com',
          password: 'TestPass123!'
        })
        .expect(200);
      
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toMatchObject({
        id: testUser._id.toString(),
        displayName: '测试用户',
        email: 'testuser@test.com',
        role: 'student',
        points: 100
      });
      expect(response.body.user).not.toHaveProperty('password');
      
      // 验证JWT token
      const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET || 'test-secret') as any;
      expect(decoded.userId).toBe(testUser._id.toString());
      expect(decoded.role).toBe('student');
    });
    
    test('应该拒绝错误密码', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testuser@test.com',
          password: 'WrongPassword123!'
        })
        .expect(401);
      
      expect(response.body.error).toMatch(/密码错误/);
    });
    
    test('应该拒绝不存在的邮箱', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'TestPass123!'
        })
        .expect(401);
      
      expect(response.body.error).toMatch(/用户不存在/);
    });
    
    test('应该验证登录参数', async () => {
      // 缺少邮箱
      await request(app)
        .post('/api/auth/login')
        .send({ password: 'TestPass123!' })
        .expect(400);
      
      // 缺少密码
      await request(app)
        .post('/api/auth/login')
        .send({ email: 'testuser@test.com' })
        .expect(400);
    });
  });
  
  describe('POST /api/auth/refresh', () => {
    let testUser: any;
    let validToken: string;
    
    beforeEach(async () => {
      testUser = await User.create({
        displayName: '测试用户',
        email: 'testuser@test.com',
        password: await bcrypt.hash('TestPass123!', 10),
        role: 'student',
        points: 100
      });
      
      validToken = jwt.sign(
        { userId: testUser._id.toString(), role: 'student' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );
    });
    
    test('应该成功刷新有效token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('token');
      expect(response.body.token).not.toBe(validToken);
      
      // 验证新token
      const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET || 'test-secret') as any;
      expect(decoded.userId).toBe(testUser._id.toString());
      expect(decoded.role).toBe('student');
    });
    
    test('应该拒绝无效token', async () => {
      await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
    
    test('应该拒绝过期token', async () => {
      const expiredToken = jwt.sign(
        { userId: testUser._id.toString(), role: 'student' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '-1h' } // 已过期
      );
      
      await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });
    
    test('应该拒绝缺少Authorization头', async () => {
      await request(app)
        .post('/api/auth/refresh')
        .expect(401);
    });
  });
  
  describe('POST /api/auth/logout', () => {
    let testUser: any;
    let validToken: string;
    
    beforeEach(async () => {
      testUser = await User.create({
        displayName: '测试用户',
        email: 'testuser@test.com',
        password: await bcrypt.hash('TestPass123!', 10),
        role: 'student',
        points: 100
      });
      
      validToken = jwt.sign(
        { userId: testUser._id.toString(), role: 'student' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );
    });
    
    test('应该成功登出', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
      
      expect(response.body.message).toMatch(/登出成功/);
    });
    
    test('应该拒绝无效token', async () => {
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
  
  describe('密码安全', () => {
    test('密码应该被正确哈希', async () => {
      const password = 'TestPassword123!';
      const userData = {
        displayName: '安全测试',
        email: 'security@test.com',
        password,
        role: 'student'
      };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);
      
      // 从数据库获取原始文档（包含密码字段）
      const dbUserDoc = await UserModel.findRawDocument({ _id: new ObjectId(response.body.user.id) });
      
      // 密码不应该是明文
      expect(dbUserDoc?.password).not.toBe(password);
      
      // 应该能用bcrypt验证
      const isValidPassword = await bcrypt.compare(password, dbUserDoc?.password || '');
      expect(isValidPassword).toBe(true);
    });
    
    test('响应中不应包含密码', async () => {
      const userData = {
        displayName: '安全测试',
        email: 'security@test.com',
        password: 'TestPassword123!',
        role: 'student'
      };
      
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);
      
      expect(registerResponse.body.user).not.toHaveProperty('password');
      
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);
      
      expect(loginResponse.body.user).not.toHaveProperty('password');
    });
  });
});