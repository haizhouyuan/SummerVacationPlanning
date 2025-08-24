import { Request, Response, NextFunction } from 'express';
import logger, { businessLogger } from '../config/logger';
import { AuthRequest } from './mongoAuth';

// 扩展Request接口以包含日志信息
declare global {
  namespace Express {
    interface Request {
      startTime?: number;
      logInfo?: any;
    }
  }
}

/**
 * HTTP请求日志中间件
 * 记录所有HTTP请求的详细信息
 */
export const httpLogger = (req: Request, res: Response, next: NextFunction) => {
  // 记录请求开始时间
  req.startTime = Date.now();
  
  // 获取客户端IP
  const clientIp = req.headers['x-forwarded-for'] || 
                   req.headers['x-real-ip'] || 
                   req.connection.remoteAddress || 
                   req.socket.remoteAddress ||
                   'unknown';

  // 初始化请求日志信息
  req.logInfo = {
    method: req.method,
    url: req.originalUrl,
    clientIp,
    userAgent: req.headers['user-agent'],
    timestamp: new Date().toISOString(),
  };

  // 监听响应完成事件
  const originalSend = res.send;
  res.send = function (data) {
    res.send = originalSend;

    const duration = Date.now() - (req.startTime || 0);
    const logData = {
      ...req.logInfo,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      responseSize: data ? Buffer.byteLength(data) : 0,
    };

    // 根据状态码决定日志级别
    if (res.statusCode >= 500) {
      logger.error('HTTP_REQUEST_ERROR', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('HTTP_REQUEST_CLIENT_ERROR', logData);
    } else {
      logger.http('HTTP_REQUEST', logData);
    }

    // 记录API调用到业务日志
    if (req as AuthRequest) {
      const authReq = req as AuthRequest;
      businessLogger.apiCall(
        req.method,
        req.originalUrl,
        authReq.user?.id,
        res.statusCode,
        duration
      );
    }

    return originalSend.call(this, data);
  };

  next();
};

/**
 * 错误日志中间件
 * 捕获和记录所有未处理的错误
 */
export const errorLogger = (err: any, req: Request, res: Response, next: NextFunction) => {
  const duration = Date.now() - (req.startTime || 0);
  
  const errorInfo = {
    ...req.logInfo,
    error: {
      message: err.message,
      stack: err.stack,
      code: err.code,
      status: err.status || err.statusCode,
    },
    duration: `${duration}ms`,
    timestamp: new Date().toISOString(),
  };

  logger.error('UNHANDLED_REQUEST_ERROR', errorInfo);

  // 记录安全事件（如果是认证/授权错误）
  if (err.status === 401 || err.status === 403) {
    const authReq = req as AuthRequest;
    businessLogger.securityEvent(
      err.status === 401 ? 'UNAUTHORIZED_ACCESS' : 'FORBIDDEN_ACCESS',
      authReq.user?.id,
      {
        endpoint: req.originalUrl,
        method: req.method,
        error: err.message,
      }
    );
  }

  next(err);
};

/**
 * 业务操作日志装饰器
 * 用于包装控制器方法，自动记录业务操作
 */
export const logBusinessOperation = (operationType: string) => {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const req = args[0] as AuthRequest;
      const res = args[1] as Response;
      
      const startTime = Date.now();
      const operationId = `${operationType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      try {
        logger.info(`BUSINESS_OPERATION_START: ${operationType}`, {
          operationId,
          userId: req.user?.id,
          endpoint: req.originalUrl,
          method: req.method,
          startTime: new Date().toISOString(),
        });

        const result = await method.apply(this, args);
        
        const duration = Date.now() - startTime;
        logger.info(`BUSINESS_OPERATION_SUCCESS: ${operationType}`, {
          operationId,
          userId: req.user?.id,
          duration: `${duration}ms`,
          statusCode: res.statusCode,
          endTime: new Date().toISOString(),
        });

        return result;
      } catch (error: any) {
        const duration = Date.now() - startTime;
        logger.error(`BUSINESS_OPERATION_ERROR: ${operationType}`, {
          operationId,
          userId: req.user?.id,
          duration: `${duration}ms`,
          error: {
            message: error.message,
            stack: error.stack,
          },
          endTime: new Date().toISOString(),
        });

        throw error;
      }
    };

    return descriptor;
  };
};

/**
 * 慢查询日志中间件
 * 记录执行时间超过阈值的请求
 */
export const slowQueryLogger = (threshold: number = 1000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    res.send = function (data) {
      res.send = originalSend;
      
      const duration = Date.now() - (req.startTime || 0);
      if (duration > threshold) {
        logger.warn('SLOW_REQUEST', {
          ...req.logInfo,
          duration: `${duration}ms`,
          threshold: `${threshold}ms`,
          statusCode: res.statusCode,
          timestamp: new Date().toISOString(),
        });
      }

      return originalSend.call(this, data);
    };

    next();
  };
};

/**
 * 安全日志中间件
 * 记录潜在的安全威胁
 */
export const securityLogger = (req: Request, res: Response, next: NextFunction) => {
  // 检查可疑的请求头
  const suspiciousHeaders = ['x-forwarded-host', 'x-original-host', 'x-rewrite-url'];
  const hasSuspiciousHeaders = suspiciousHeaders.some(header => req.headers[header]);

  if (hasSuspiciousHeaders) {
    businessLogger.securityEvent('SUSPICIOUS_HEADERS', undefined, {
      headers: req.headers,
      url: req.originalUrl,
      clientIp: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    });
  }

  // 检查SQL注入尝试
  const sqlInjectionPattern = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)|(\b(OR|AND)\s+\d+\s*=\s*\d+)/i;
  const queryString = JSON.stringify(req.query) + JSON.stringify(req.body);
  
  if (sqlInjectionPattern.test(queryString)) {
    businessLogger.securityEvent('SQL_INJECTION_ATTEMPT', undefined, {
      query: req.query,
      body: req.body,
      url: req.originalUrl,
      clientIp: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    });
  }

  next();
};

/**
 * 审计日志辅助函数
 * 记录需要审计的重要操作
 */
export const auditLog = {
  /**
   * 记录数据修改操作
   */
  dataModification: (userId: string, collection: string, operation: string, documentId: string, changes?: any) => {
    logger.warn('AUDIT_DATA_MODIFICATION', {
      type: 'audit',
      subType: 'data_modification',
      userId,
      collection,
      operation,
      documentId,
      changes,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * 记录权限变更
   */
  permissionChange: (adminUserId: string, targetUserId: string, oldRole: string, newRole: string) => {
    logger.warn('AUDIT_PERMISSION_CHANGE', {
      type: 'audit',
      subType: 'permission_change',
      adminUserId,
      targetUserId,
      oldRole,
      newRole,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * 记录登录事件
   */
  loginEvent: (userId: string, success: boolean, clientIp?: string, reason?: string) => {
    logger.info('AUDIT_LOGIN_EVENT', {
      type: 'audit',
      subType: 'login_event',
      userId,
      success,
      clientIp,
      reason,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * 记录配置更改
   */
  configurationChange: (adminUserId: string, configKey: string, oldValue: any, newValue: any) => {
    logger.warn('AUDIT_CONFIG_CHANGE', {
      type: 'audit',
      subType: 'configuration_change',
      adminUserId,
      configKey,
      oldValue,
      newValue,
      timestamp: new Date().toISOString(),
    });
  },
};

export default {
  httpLogger,
  errorLogger,
  logBusinessOperation,
  slowQueryLogger,
  securityLogger,
  auditLog,
};