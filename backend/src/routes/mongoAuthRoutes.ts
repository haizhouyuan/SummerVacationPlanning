import { Router, Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { register, login, getProfile, updateProfile, getChildren, getChildStats, getDashboardStats, getFamilyLeaderboard, getPointsHistory } from '../controllers/mongoAuthController';
import { authenticateToken } from '../middleware/mongoAuth';
import { validateRequest } from '../middleware/validation';

const router = Router();

// Registration validation
const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('displayName').isLength({ min: 2, max: 50 }),
  body('role').isIn(['student', 'parent']),
  body('parentEmail').optional().isEmail().normalizeEmail(),
];

// Login validation removed - supporting preset accounts with empty passwords

// Profile update validation
const updateProfileValidation = [
  body('displayName').optional().isLength({ min: 2, max: 50 }),
  body('avatar').optional().isURL(),
];

// Public routes
router.post('/register', registerValidation, validateRequest, register);

// Test route without any validation
router.post('/login-test', (req: Request, res: Response) => {
  console.log('🧪 TEST LOGIN route hit:', req.body);
  res.json({ success: true, message: 'Test login route works', body: req.body });
});

// Another test route to isolate the issue
router.post('/debug-login', (req: Request, res: Response) => {
  console.log('🐛 DEBUG LOGIN route hit:', req.body);
  res.json({ 
    success: true, 
    message: 'Debug route working', 
    receivedData: req.body,
    timestamp: new Date().toISOString()
  });
});

// Debug collections initialization
router.get('/debug-collections', async (req: Request, res: Response) => {
  console.log('🐛 DEBUG COLLECTIONS route hit');
  try {
    const { collections } = await import('../config/mongodb');
    console.log('Collections available:', Object.keys(collections || {}));
    
    if (!collections) {
      return res.json({
        success: false,
        error: 'Collections object is null/undefined',
        timestamp: new Date().toISOString()
      });
    }
    
    if (!collections.users) {
      return res.json({
        success: false,
        error: 'collections.users is not available',
        collectionsKeys: Object.keys(collections || {}),
        timestamp: new Date().toISOString()
      });
    }
    
    // Try to find the demo user
    const user = await collections.users.findOne({ displayName: '袁绍宸' });
    
    res.json({
      success: true,
      message: 'Collections are working',
      collectionsKeys: Object.keys(collections || {}),
      userFound: !!user,
      userData: user ? {
        displayName: user.displayName,
        email: user.email,
        role: user.role,
        hasPassword: !!user.password
      } : null,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('🚨 DEBUG COLLECTIONS ERROR:', error);
    res.json({
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
});

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  console.log('🚀 Login route hit:', req.body);
  console.log('🔍 Route handler: About to call login function');
  try {
    // TEMPORARY: Call login function directly without any validation
    await login(req, res);
    console.log('✅ Route handler: Login function completed successfully');
  } catch (error) {
    console.error('❌ Route handler: Login function failed:', error);
    res.status(500).json({ success: false, error: 'Login failed', details: error });
  }
});

// Protected routes
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfileValidation, validateRequest, updateProfile);

// Dashboard statistics
router.get('/dashboard-stats', authenticateToken, getDashboardStats);

// Points history
router.get('/points-history', authenticateToken, getPointsHistory);

// Family management routes (parent only)
router.get('/children', authenticateToken, getChildren);
router.get('/children/:childId/stats', authenticateToken, getChildStats);
router.get('/family-leaderboard', authenticateToken, getFamilyLeaderboard);

export default router; 