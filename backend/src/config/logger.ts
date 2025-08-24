import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';

// 创建日志目录
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// 定义日志级别
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// 定义日志颜色
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

// 自定义日志格式
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    if (info.stack) {
      return `${info.timestamp} ${info.level}: ${info.message}\n${info.stack}`;
    }
    return `${info.timestamp} ${info.level}: ${info.message}`;
  }),
);

// 创建不带颜色的格式，用于文件输出
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

// 通用文件传输配置
const createDailyRotateFileTransport = (options: {
  filename: string;
  level?: string;
  maxSize?: string;
  maxFiles?: string;
}) => {
  return new DailyRotateFile({
    filename: path.join(logsDir, options.filename),
    datePattern: 'YYYY-MM-DD',
    level: options.level || 'info',
    format: fileFormat,
    maxSize: options.maxSize || '20m',
    maxFiles: options.maxFiles || '14d', // 保留14天
    auditFile: path.join(logsDir, '.audit.json'),
    zippedArchive: true, // 压缩旧日志
  });
};

// 创建传输器
const transports = [
  // 控制台输出
  new winston.transports.Console({
    format,
    level: process.env.NODE_ENV === 'production' ? 'http' : 'debug',
  }),

  // 组合日志（所有级别）
  createDailyRotateFileTransport({
    filename: 'combined-%DATE%.log',
    maxSize: '50m',
    maxFiles: '30d', // 保留30天的组合日志
  }),

  // 错误日志
  createDailyRotateFileTransport({
    filename: 'error-%DATE%.log',
    level: 'error',
    maxSize: '20m',
    maxFiles: '90d', // 保留90天的错误日志
  }),

  // HTTP请求日志
  createDailyRotateFileTransport({
    filename: 'http-%DATE%.log',
    level: 'http',
    maxSize: '50m',
    maxFiles: '7d', // 保留7天的HTTP日志
  }),

  // 业务操作日志
  createDailyRotateFileTransport({
    filename: 'business-%DATE%.log',
    maxSize: '20m',
    maxFiles: '60d', // 保留60天的业务日志
  }),
];

// 创建logger实例
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  levels,
  format: fileFormat,
  transports,
  exitOnError: false,
});

// 添加未处理异常捕获
logger.exceptions.handle(
  new winston.transports.File({
    filename: path.join(logsDir, 'exceptions.log'),
    maxsize: 50 * 1024 * 1024, // 50MB
    maxFiles: 5,
    format: fileFormat,
  })
);

// 添加未处理的Promise拒绝捕获
logger.rejections.handle(
  new winston.transports.File({
    filename: path.join(logsDir, 'rejections.log'),
    maxsize: 50 * 1024 * 1024, // 50MB
    maxFiles: 5,
    format: fileFormat,
  })
);

// 专用业务日志方法
export const businessLogger = {
  /**
   * 记录用户操作
   */
  userAction: (userId: string, action: string, details?: any) => {
    logger.info('USER_ACTION', {
      type: 'user_action',
      userId,
      action,
      details,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * 记录积分操作
   */
  pointsOperation: (userId: string, operation: string, points: number, details?: any) => {
    logger.info('POINTS_OPERATION', {
      type: 'points_operation',
      userId,
      operation,
      points,
      details,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * 记录任务操作
   */
  taskOperation: (userId: string, taskId: string, operation: string, details?: any) => {
    logger.info('TASK_OPERATION', {
      type: 'task_operation',
      userId,
      taskId,
      operation,
      details,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * 记录兑换操作
   */
  redemptionOperation: (userId: string, redemptionId: string, operation: string, details?: any) => {
    logger.info('REDEMPTION_OPERATION', {
      type: 'redemption_operation',
      userId,
      redemptionId,
      operation,
      details,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * 记录系统操作
   */
  systemOperation: (operation: string, details?: any) => {
    logger.info('SYSTEM_OPERATION', {
      type: 'system_operation',
      operation,
      details,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * 记录安全事件
   */
  securityEvent: (type: string, userId?: string, details?: any) => {
    logger.warn('SECURITY_EVENT', {
      type: 'security_event',
      securityType: type,
      userId,
      details,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * 记录数据库操作
   */
  databaseOperation: (collection: string, operation: string, details?: any) => {
    logger.debug('DB_OPERATION', {
      type: 'database_operation',
      collection,
      operation,
      details,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * 记录API调用
   */
  apiCall: (method: string, endpoint: string, userId?: string, statusCode?: number, duration?: number) => {
    logger.http('API_CALL', {
      type: 'api_call',
      method,
      endpoint,
      userId,
      statusCode,
      duration,
      timestamp: new Date().toISOString(),
    });
  },
};

export default logger;