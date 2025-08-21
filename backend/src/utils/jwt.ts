import * as jwt from 'jsonwebtoken';
import { User } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export const generateToken = (user: User): string => {
  const payload = { 
    id: user.id, 
    email: user.email, 
    role: user.role 
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
};

export const verifyToken = (token: string): any => {
  try {
    // Handle demo tokens for development/demo mode
    if (token.startsWith('demo-token-')) {
      console.log('🔄 Demo token detected, returning mock user');
      return {
        id: 'demo-user-id',
        email: 'demo@example.com',
        role: 'student'
      };
    }
    
    // Verify real JWT tokens
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
}; 