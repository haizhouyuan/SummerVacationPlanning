import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();

// 🚨 URGENT: Fix CORS immediately - MUST be first middleware
app.use((req, res, next) => {
  console.log('🚨 CORS FIX: Processing request:', req.method, req.path, 'Origin:', req.headers.origin);
  
  // Set CORS headers for ALL requests
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Max-Age', '86400');
  
  // Handle preflight OPTIONS requests immediately
  if (req.method === 'OPTIONS') {
    console.log('🚨 CORS FIX: Handling OPTIONS preflight for:', req.path);
    return res.status(200).end();
  }
  
  console.log('🚨 CORS FIX: Headers set, continuing...');
  next();
});

// Security middleware - disabled for HTTP development
// app.use(helmet());
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001', 
  'http://localhost:3002',
  'http://localhost:3003',
  process.env.CORS_ORIGIN
].filter(Boolean);

console.log('🌐 CORS allowed origins:', allowedOrigins);

// CORS middleware - MUST be first!
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  console.log(`🌐 CORS REQUEST: ${req.method} ${req.path} from origin: ${origin}`);
  
  // Always set CORS headers for development
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    console.log(`✅ PREFLIGHT: ${req.path} - Responding with CORS headers`);
    return res.status(204).end();
  }
  
  console.log(`➡️ CONTINUING: ${req.method} ${req.path}`);
  next();
});

// Set trust proxy for rate limiting (needed for ECS/reverse proxy)
app.set('trust proxy', 1);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Logging - disabled for CORS debugging
// if (process.env.NODE_ENV !== 'test') {
//   app.use(morgan('combined'));
// }

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint with explicit CORS
app.get('/health', (req, res) => {
  console.log('🏥 HEALTH CHECK REQUEST from origin:', req.headers.origin);
  console.log('🔧 Headers before setting:', Object.keys(res.getHeaders()));
  
  // Set CORS headers explicitly for testing
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('X-Debug-CORS', 'manually-set');
  
  console.log('🔧 Headers after setting:', Object.keys(res.getHeaders()));
  console.log('🎯 CORS Origin header value:', res.getHeader('Access-Control-Allow-Origin'));
  
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    origin: req.headers.origin,
  });
});

// Root endpoint for quick sanity check
app.get('/', (req, res) => {
  res.type('text/plain').send('Summer Vacation API is running. See /health');
});

// CORS test endpoint
app.get('/cors-test', (req, res) => {
  console.log('🧪 CORS TEST REQUEST from origin:', req.headers.origin);
  
  // Set CORS headers manually
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || 'http://localhost:3003');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('X-CORS-Test', 'working');
  
  console.log('🧪 Response headers:', res.getHeaders());
  
  res.json({
    message: 'CORS test endpoint',
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
});

// MongoDB connection handled in server.ts

// API routes
import mongoAuthRoutes from './routes/mongoAuthRoutes';
import taskRoutes from './routes/taskRoutes';
import dailyTaskRoutes from './routes/dailyTaskRoutes';
import redemptionRoutes from './routes/redemptionRoutes';
import rewardsRoutes from './routes/rewardsRoutes';
import pointsConfigRoutes from './routes/pointsConfigRoutes';
import recurringTaskRoutes from './routes/recurringTaskRoutes';

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
app.use('/api/recurring-tasks', recurringTaskRoutes);

// 静态资源服务，开放 /uploads 目录
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
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
