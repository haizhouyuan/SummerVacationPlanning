import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import logger from './config/logger';
import { 
  httpLogger, 
  errorLogger, 
  slowQueryLogger, 
  securityLogger 
} from './middleware/loggerMiddleware';

dotenv.config();

const app = express();

// Security middleware - disabled for HTTP development
// app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:8081', 'http://127.0.0.1:8081', 'file://', 'null'],
  credentials: true,
}));

// Set trust proxy for rate limiting (needed for ECS/reverse proxy)
app.set('trust proxy', 1);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Winston logging setup
app.use(httpLogger);
app.use(securityLogger);
app.use(slowQueryLogger(1000)); // 1秒慢查询阈值

// Morgan HTTP logging (只在非测试环境)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: {
      write: (message: string) => logger.http(message.trim())
    }
  }));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Root endpoint for quick sanity check
app.get('/', (req, res) => {
  res.type('text/plain').send('Summer Vacation API is running. See /health');
});

// MongoDB connection handled in server.ts

// API routes
import mongoAuthRoutes from './routes/mongoAuthRoutes';
import taskRoutes from './routes/taskRoutes';
import dailyTaskRoutes from './routes/dailyTaskRoutes';
import redemptionRoutes from './routes/redemptionRoutes';
import rewardsRoutes from './routes/rewardsRoutes';
import pointsConfigRoutes from './routes/pointsConfigRoutes';
import rewardsCenterRoutes from './routes/rewardsCenterRoutes';

// Debug middleware for all API routes
app.use('/api', (req, res, next) => {
  console.log(`🔍 API Request: ${req.method} ${req.originalUrl}`);
  next();
});

app.use('/api/auth', mongoAuthRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/daily-tasks', dailyTaskRoutes);
app.use('/api/redemptions', redemptionRoutes);
app.use('/api/rewards', rewardsRoutes);
app.use('/api/points-config', pointsConfigRoutes);
app.use('/api/rewards-center', rewardsCenterRoutes);

// 静态资源服务，开放 /uploads 目录
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Error handling middleware (must be after all routes)
app.use(errorLogger);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  // 错误已经在errorLogger中记录了，这里只处理响应
  res.status(err.status || 500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found.',
  });
});

export default app;
