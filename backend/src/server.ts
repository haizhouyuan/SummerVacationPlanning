import express from 'express';
// import app from './app';
import { mongodb, initializeCollections } from './config/mongodb';
import { CronScheduler } from './services/cronScheduler';

// 🚨 EMERGENCY: 创建全新的Express应用，绕过app.ts
const app = express();

console.log('🚨 EMERGENCY MODE: Creating fresh Express app');

// 🚨 FIRST: 全局CORS修复 - 必须在所有其他middleware之前
app.use((req, res, next) => {
  console.log('🚨 EMERGENCY CORS: Processing', req.method, req.path, 'from origin:', req.headers.origin);
  
  // 强制设置所有CORS头
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  if (req.method === 'OPTIONS') {
    console.log('🚨 EMERGENCY CORS: OPTIONS preflight for', req.path);
    return res.status(200).end();
  }
  
  console.log('🚨 EMERGENCY CORS: Continuing with', req.method, req.path);
  next();
});

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 测试端点 - both with and without /api prefix
app.get('/health', (req, res) => {
  console.log('🏥 HEALTH ENDPOINT: Request received');
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/api/health', (req, res) => {
  console.log('🏥 API HEALTH ENDPOINT: Request received');
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/api/cors-test', (req, res) => {
  console.log('🧪 CORS TEST ENDPOINT: Success!');
  res.json({
    success: true,
    message: 'CORS fixed with emergency mode!',
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
});

// 🚨 EMERGENCY: 添加必要的API路由
// Import routes
import mongoAuthRoutes from './routes/mongoAuthRoutes';
import taskRoutes from './routes/taskRoutes';
import dailyTaskRoutes from './routes/dailyTaskRoutes';
import redemptionRoutes from './routes/redemptionRoutes';
import rewardsRoutes from './routes/rewardsRoutes';
import pointsConfigRoutes from './routes/pointsConfigRoutes';
import recurringTaskRoutes from './routes/recurringTaskRoutes';
import rewardsCenterRoutes from './routes/rewardsCenterRoutes';
import path from 'path';

// Debug middleware for all API routes
app.use('/api', (req, res, next) => {
  console.log(`🔍 EMERGENCY API Request: ${req.method} ${req.originalUrl}`);
  next();
});

// Add all API routes with /api prefix
app.use('/api/auth', mongoAuthRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/daily-tasks', dailyTaskRoutes);
app.use('/api/redemptions', redemptionRoutes);
app.use('/api/rewards', rewardsRoutes);
app.use('/api/points-config', pointsConfigRoutes);
app.use('/api/recurring-tasks', recurringTaskRoutes);
app.use('/api/rewards-center', rewardsCenterRoutes);

// 🚨 EMERGENCY: Add routes without /api prefix for compatibility
console.log('🚨 EMERGENCY: Adding routes without /api prefix for compatibility');
app.use('/auth', mongoAuthRoutes);
app.use('/tasks', taskRoutes);
app.use('/daily-tasks', dailyTaskRoutes);
app.use('/redemptions', redemptionRoutes);
app.use('/rewards', rewardsRoutes);
app.use('/points-config', pointsConfigRoutes);
app.use('/recurring-tasks', recurringTaskRoutes);
app.use('/rewards-center', rewardsCenterRoutes);

// 静态资源服务，开放 /uploads 目录
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('🚨 EMERGENCY ERROR:', err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error',
  });
});

// 404 handler
app.use((req, res) => {
  console.log('🚨 EMERGENCY 404:', req.method, req.originalUrl);
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found.',
  });
});

const PORT = parseInt(process.env.PORT || '5000', 10);

const startServer = async () => {
  try {
    await mongodb.connect();
    initializeCollections();
    
    // Start the recurring task scheduler
    CronScheduler.startRecurringTaskScheduler();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 Health check: http://localhost:${PORT}/health`);
      console.log(`⚡ Recurring task scheduler started`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  CronScheduler.stopScheduler();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received, shutting down gracefully');
  CronScheduler.stopScheduler();
  process.exit(0);
});