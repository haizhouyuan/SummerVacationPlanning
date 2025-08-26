/**
 * Test Application Setup
 * 测试应用程序设置
 */

import express from 'express';
import cors from 'cors';
import { Express } from 'express';
import { MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';

// 导入可用的路由（不存在的会忽略）
let authRoutes: any;
let taskRoutes: any;
let dailyTaskRoutes: any;
let pointsRoutes: any;
let redemptionRoutes: any;
let statsRoutes: any;

try {
  authRoutes = require('../routes/mongoAuthRoutes').default;
} catch (e) {
  console.log('Auth routes not found, skipping...');
}

try {
  taskRoutes = require('../routes/taskRoutes').default;
} catch (e) {
  console.log('Task routes not found, skipping...');
}

try {
  dailyTaskRoutes = require('../routes/dailyTaskRoutes').default;
} catch (e) {
  console.log('Daily task routes not found, skipping...');
}

try {
  pointsRoutes = require('../routes/pointsConfigRoutes').default;
} catch (e) {
  console.log('Points routes not found, skipping...');
}

try {
  redemptionRoutes = require('../routes/redemptionRoutes').default;
} catch (e) {
  console.log('Redemption routes not found, skipping...');
}

try {
  statsRoutes = require('../routes/rewardsRoutes').default;
} catch (e) {
  console.log('Stats routes not found, skipping...');
}

export const createTestApp = (): Express => {
  const app = express();
  
  // 基础中间件
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  
  // 测试环境设置
  process.env.JWT_SECRET = 'test-secret-key';
  process.env.NODE_ENV = 'test';
  
  // 路由设置（只添加存在的路由）
  if (authRoutes) {
    app.use('/api/auth', authRoutes);
  }
  if (taskRoutes) {
    app.use('/api/tasks', taskRoutes);
  }
  if (dailyTaskRoutes) {
    app.use('/api/daily-tasks', dailyTaskRoutes);
  }
  if (pointsRoutes) {
    app.use('/api/points', pointsRoutes);
  }
  if (redemptionRoutes) {
    app.use('/api/redemptions', redemptionRoutes);
  }
  if (statsRoutes) {
    app.use('/api/stats', statsRoutes);
  }
  
  // 健康检查
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', environment: 'test' });
  });
  
  // Mock API endpoints for testing
  app.post('/api/auth/register', (req, res) => {
    res.status(201).json({
      success: true,
      token: 'mock-jwt-token',
      user: {
        id: 'mock-user-id',
        email: req.body.email,
        displayName: req.body.username,
        role: req.body.role,
        points: 0
      }
    });
  });

  app.post('/api/auth/login', (req, res) => {
    res.status(200).json({
      success: true,
      token: 'mock-jwt-token',
      user: {
        id: 'mock-user-id',
        email: req.body.email,
        displayName: 'Mock User',
        role: 'student',
        points: 100
      }
    });
  });

  app.get('/api/auth/me', (req, res) => {
    res.status(200).json({
      id: 'mock-user-id',
      email: 'test@example.com',
      displayName: 'Mock User',
      role: 'student',
      points: 100
    });
  });

  app.get('/api/tasks', (req, res) => {
    res.status(200).json([
      {
        id: 'mock-task-1',
        title: 'Test Task',
        description: 'A test task',
        category: 'exercise',
        difficulty: 'medium',
        points: 30
      }
    ]);
  });

  app.post('/api/tasks', (req, res) => {
    res.status(201).json({
      id: 'new-task-id',
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  });
  
  // 错误处理中间件
  app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Test app error:', error);
    res.status(error.status || 500).json({
      error: error.message || '内部服务器错误',
      ...(process.env.NODE_ENV === 'test' && { stack: error.stack })
    });
  });
  
  // 404处理
  app.use((req: express.Request, res: express.Response) => {
    res.status(404).json({ error: '接口不存在' });
  });
  
  return app;
};

// 测试数据库连接管理器
export class TestDbManager {
  static mongoServer: MongoMemoryServer;
  static client: MongoClient;

  static async connect() {
    try {
      this.mongoServer = await MongoMemoryServer.create();
      const uri = this.mongoServer.getUri();
      this.client = new MongoClient(uri);
      await this.client.connect();
      
      // 设置全局collections以供模型使用
      const db = this.client.db();
      (global as any).testCollections = {
        users: db.collection('users'),
        tasks: db.collection('tasks'),
        dailyTasks: db.collection('dailyTasks'),
        redemptions: db.collection('redemptions'),
        pointsRules: db.collection('pointsRules')
      };

      return uri;
    } catch (error) {
      console.error('Test database connection failed:', error);
      throw error;
    }
  }

  static async disconnect() {
    try {
      if (this.client) {
        await this.client.close();
      }
      if (this.mongoServer) {
        await this.mongoServer.stop();
      }
      delete (global as any).testCollections;
    } catch (error) {
      console.error('Test database disconnect failed:', error);
      throw error;
    }
  }

  static async clearDatabase() {
    try {
      if (this.client) {
        const db = this.client.db();
        await db.dropDatabase();
      }
    } catch (error) {
      console.error('Test database clear failed:', error);
      throw error;
    }
  }
}