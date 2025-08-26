import { Request, Response, NextFunction } from 'express';
import { ObjectId } from 'mongodb';
import { collections } from '../config/mongodb';
import { User } from '../types';
import { verifyToken } from '../utils/jwt';

export interface AuthRequest extends Request {
  user?: User;
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token is required',
      });
    }

    // Verify JWT token
    const decoded = verifyToken(token);
    const userId = decoded.id;

    // Handle demo users
    if (userId === 'demo-user-id') {
      console.log('🔄 Demo user detected, using mock user data');
      req.user = {
        id: 'demo-user-id',
        email: 'demo@example.com',
        displayName: '演示学生',
        role: 'student',
        points: 150,
        createdAt: new Date(),
        updatedAt: new Date()
      } as User;
      return next();
    }

    // Get user data from MongoDB for real users
    const user = await collections.users.findOne({ _id: new ObjectId(userId) });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Convert MongoDB _id to id for consistency
    const { _id, ...userWithoutId } = user;
    const userWithId = { ...userWithoutId, id: _id.toString() };
    
    req.user = userWithId as User;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(403).json({
      success: false,
      error: 'Invalid or expired token',
    });
  }
};

export const requireRole = (allowedRoles: ('student' | 'parent' | 'admin')[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
      });
    }

    next();
  };
};

export const requireParentOrSelf = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'User not authenticated',
    });
  }

  const targetUserId = req.params.userId || req.body.userId;
  
  // Allow if user is accessing their own data
  if (req.user.id === targetUserId) {
    return next();
  }

  // Allow if user is a parent accessing their child's data
  if (req.user.role === 'parent' && req.user.children?.includes(targetUserId)) {
    return next();
  }

  return res.status(403).json({
    success: false,
    error: 'Access denied',
  });
}; 