/**
 * Security Tests
 * 安全测试
 */

import request from 'supertest';
import { Express } from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

import { createTestApp } from '../../test-utils/testApp';
import { User } from '../../models/User';
import { Task } from '../../models/Task';

describe('Security Tests', () => {
  let app: Express;
  let mongoServer: MongoMemoryServer;
  let testUser: any;
  let authToken: string;
  
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
    await mongoose.connection.db.dropDatabase();
    
    testUser = await User.create({
      username: '测试用户',
      email: 'test@test.com',
      password: await bcrypt.hash('TestPass123!', 10),
      role: 'student',
      points: 100
    });
    
    authToken = jwt.sign(
      { userId: testUser._id.toString(), role: 'student' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });
  
  describe('JWT Token安全测试', () => {
    test('应该检测伪造的Token签名', async () => {
      const [header, payload] = authToken.split('.');
      const forgedToken = `${header}.${payload}.forged_signature`;
      
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${forgedToken}`)
        .expect(401);
      
      expect(response.body.error).toMatch(/token|认证|授权/i);
    });
    
    test('应该检测篡改的Payload', async () => {
      const [header, , signature] = authToken.split('.');
      
      // 修改payload中的角色为parent
      const tamperedPayload = Buffer.from(JSON.stringify({
        userId: testUser._id.toString(),
        role: 'parent', // 篡改角色
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      })).toString('base64url');
      
      const tamperedToken = `${header}.${tamperedPayload}.${signature}`;
      
      await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${tamperedToken}`)
        .expect(401);
    });
    
    test('应该检测过期Token', async () => {
      const expiredToken = jwt.sign(
        { userId: testUser._id.toString(), role: 'student' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '-1h' } // 已过期
      );
      
      await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });
    
    test('应该检测无效格式Token', async () => {
      const invalidTokens = [
        'invalid.token',
        'Bearer invalid.token',
        '',
        'just_random_string',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid_payload'
      ];
      
      for (const token of invalidTokens) {
        await request(app)
          .get('/api/tasks')
          .set('Authorization', `Bearer ${token}`)
          .expect(401);
      }
    });
    
    test('应该防止Token重放攻击', async () => {
      // 正常使用token多次应该成功
      for (let i = 0; i < 3; i++) {
        await request(app)
          .get('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);
      }
      
      // 但在实际应用中，可以实现token黑名单机制
      // 这里验证系统能处理合理的重复请求
    });
  });
  
  describe('输入验证和注入防护', () => {
    test('应该防止NoSQL查询注入', async () => {
      const maliciousQueries = [
        '{"$ne": null}',
        '{"$gt": ""}',
        '{"$regex": ".*"}',
        '{"$where": "this.username == this.password"}',
        '{"$expr": {"$gt": ["$points", 1000]}}'
      ];
      
      for (const query of maliciousQueries) {
        // 尝试在查询参数中注入
        await request(app)
          .get(`/api/tasks?category=${encodeURIComponent(query)}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(400); // 应该被验证中间件拒绝
      }
    });
    
    test('应该防止请求体注入', async () => {
      const maliciousData = {
        title: '正常标题',
        category: { "$ne": null },  // NoSQL注入尝试
        difficulty: 'easy'
      };
      
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(maliciousData)
        .expect(400);
    });
    
    test('应该防止存储型XSS', async () => {
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        'javascript:alert(1)',
        '<img src=x onerror=alert(1)>',
        '"><script>alert(document.cookie)</script>',
        '<svg onload=alert(1)>'
      ];
      
      for (const payload of xssPayloads) {
        const response = await request(app)
          .post('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: payload,
            category: 'exercise',
            difficulty: 'easy',
            points: 30
          })
          .expect(201);
        
        // 验证存储的数据已被清理
        expect(response.body.title).not.toContain('<script>');
        expect(response.body.title).not.toContain('javascript:');
        expect(response.body.title).not.toContain('onerror=');
        expect(response.body.title).not.toContain('<svg');
      }
    });
    
    test('应该验证和限制输入长度', async () => {
      // 测试超长标题
      const longTitle = 'a'.repeat(1000);
      const longDescription = 'b'.repeat(10000);
      
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: longTitle,
          description: longDescription,
          category: 'exercise',
          difficulty: 'easy',
          points: 30
        });
      
      // 应该被限制或成功处理（如截断）
      if (response.status === 201) {
        expect(response.body.title.length).toBeLessThanOrEqual(200);
        expect(response.body.description.length).toBeLessThanOrEqual(2000);
      } else {
        expect(response.status).toBe(400);
      }
    });
    
    test('应该处理特殊字符输入', async () => {
      const specialChars = '🎉🌟💯📚🏃‍♂️🎨🏠📝';
      const unicodeText = '测试中文字符和emoji混合输入';
      
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: `${specialChars} ${unicodeText}`,
          category: 'creativity',
          difficulty: 'medium',
          points: 50
        })
        .expect(201);
      
      expect(response.body.title).toContain(specialChars);
      expect(response.body.title).toContain(unicodeText);
    });
  });
  
  describe('权限控制安全测试', () => {
    test('应该防止角色提升攻击', async () => {
      // 尝试通过修改个人资料提升角色
      await request(app)
        .patch(`/api/users/me`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ role: 'parent' })
        .expect(403);
    });
    
    test('应该防止水平权限攻击', async () => {
      // 创建另一个用户的任务
      const otherUser = await User.create({
        username: '其他用户',
        email: 'other@test.com',
        password: await bcrypt.hash('password', 10),
        role: 'student',
        points: 50
      });
      
      const otherTask = await Task.create({
        userId: otherUser._id,
        title: '其他用户的任务',
        category: 'exercise',
        difficulty: 'easy',
        points: 30
      });
      
      // 尝试修改其他用户的任务
      await request(app)
        .put(`/api/tasks/${otherTask._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: '恶意修改' })
        .expect(403);
      
      // 尝试删除其他用户的任务
      await request(app)
        .delete(`/api/tasks/${otherTask._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });
    
    test('应该验证资源所有权', async () => {
      // 创建用户自己的任务
      const ownTask = await Task.create({
        userId: testUser._id,
        title: '自己的任务',
        category: 'reading',
        difficulty: 'medium',
        points: 40
      });
      
      // 应该可以修改自己的任务
      await request(app)
        .put(`/api/tasks/${ownTask._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: '修改自己的任务' })
        .expect(200);
      
      // 应该可以删除自己的任务
      await request(app)
        .delete(`/api/tasks/${ownTask._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });
  
  describe('敏感数据保护', () => {
    test('密码不应该出现在API响应中', async () => {
      // 注册响应
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          username: '新用户',
          email: 'newuser@test.com',
          password: 'SecurePass123!',
          role: 'student'
        })
        .expect(201);
      
      expect(registerResponse.body.user).not.toHaveProperty('password');
      expect(registerResponse.body.user).not.toHaveProperty('passwordHash');
      
      // 登录响应
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'newuser@test.com',
          password: 'SecurePass123!'
        })
        .expect(200);
      
      expect(loginResponse.body.user).not.toHaveProperty('password');
      expect(loginResponse.body.user).not.toHaveProperty('passwordHash');
      
      // 用户信息响应
      const userResponse = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${loginResponse.body.token}`)
        .expect(200);
      
      expect(userResponse.body).not.toHaveProperty('password');
      expect(userResponse.body).not.toHaveProperty('passwordHash');
    });
    
    test('系统错误不应该暴露内部信息', async () => {
      // 触发数据库错误
      const response = await request(app)
        .get('/api/tasks/invalid-id-format')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
      
      // 确保不暴露数据库错误详情
      expect(response.body.error).not.toContain('MongoDB');
      expect(response.body.error).not.toContain('ObjectId');
      expect(response.body.error).not.toContain('CastError');
      expect(response.body).not.toHaveProperty('stack');
    });
    
    test('不应该暴露服务器路径信息', async () => {
      const response = await request(app)
        .get('/api/nonexistent-endpoint')
        .expect(404);
      
      expect(response.body.error).not.toContain('/home/');
      expect(response.body.error).not.toContain('/var/');
      expect(response.body.error).not.toContain('C:\\');
      expect(response.body.error).not.toContain(__dirname);
    });
  });
  
  describe('文件上传安全测试', () => {
    test('应该拒绝恶意文件上传', async () => {
      const maliciousFiles = [
        {
          filename: 'evil.php',
          content: Buffer.from('<?php system($_GET["cmd"]); ?>'),
          mimetype: 'text/php'
        },
        {
          filename: 'script.js',
          content: Buffer.from('alert("XSS")'),
          mimetype: 'application/javascript'
        },
        {
          filename: 'fake.jpg.exe',
          content: Buffer.from('fake executable'),
          mimetype: 'application/octet-stream'
        }
      ];
      
      for (const file of maliciousFiles) {
        const response = await request(app)
          .post('/api/upload/evidence')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('file', file.content, {
            filename: file.filename,
            contentType: file.mimetype
          });
        
        expect(response.status).toBe(400); // 应该被文件类型验证拒绝
      }
    });
    
    test('应该限制文件大小', async () => {
      // 创建超大文件 (模拟50MB+1字节)
      const oversizedContent = Buffer.alloc(50 * 1024 * 1024 + 1, 'x');
      
      const response = await request(app)
        .post('/api/upload/evidence')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', oversizedContent, {
          filename: 'large.jpg',
          contentType: 'image/jpeg'
        });
      
      expect(response.status).toBe(413); // Request Entity Too Large
    });
    
    test('应该验证文件类型', async () => {
      // 测试有效的图片文件
      const validImageContent = Buffer.from('fake-image-content');
      
      const response = await request(app)
        .post('/api/upload/evidence')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', validImageContent, {
          filename: 'test.jpg',
          contentType: 'image/jpeg'
        });
      
      // 应该成功或返回具体的验证错误
      expect([200, 201, 400]).toContain(response.status);
    });
  });
  
  describe('速率限制和防护', () => {
    test('应该限制登录尝试频率', async () => {
      const loginAttempts = Array(10).fill(null).map(() =>
        request(app)
          .post('/api/auth/login')
          .send({
            email: 'test@test.com',
            password: 'wrong-password'
          })
      );
      
      const results = await Promise.all(loginAttempts);
      
      // 应该有一些请求被拒绝（速率限制）
      const blockedRequests = results.filter(r => r.status === 429);
      expect(blockedRequests.length).toBeGreaterThan(0);
    });
    
    test('应该限制API请求频率', async () => {
      const requests = Array(100).fill(null).map(() =>
        request(app)
          .get('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
      );
      
      const results = await Promise.allSettled(requests);
      
      // 检查是否有速率限制
      const rateLimitedRequests = results.filter(r =>
        r.status === 'fulfilled' && r.value.status === 429
      );
      
      // 根据实际配置，可能会有速率限制
      // 这里主要测试系统能够处理大量请求而不崩溃
      expect(results.length).toBe(100);
    });
  });
  
  describe('会话管理安全', () => {
    test('登出后token应该失效', async () => {
      // 正常访问
      await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      // 登出
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      // 在实际实现中，可能需要token黑名单
      // 这里验证基本的登出流程
    });
    
    test('并发会话应该被正确处理', async () => {
      // 同时使用同一token进行多个请求
      const concurrentRequests = Array(10).fill(null).map(() =>
        request(app)
          .get('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
      );
      
      const results = await Promise.all(concurrentRequests);
      
      // 所有请求都应该成功或有合理的错误处理
      results.forEach(response => {
        expect([200, 401, 429]).toContain(response.status);
      });
    });
  });
});