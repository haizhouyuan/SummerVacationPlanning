import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, getProfile, updateProfile } from '../controllers/mongoAuthController';
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

// Login validation
const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

// Profile update validation
const updateProfileValidation = [
  body('displayName').optional().isLength({ min: 2, max: 50 }),
  body('avatar').optional().isURL(),
];

// Public routes
router.post('/register', registerValidation, validateRequest, register);
router.post('/login', loginValidation, validateRequest, login);

// Protected routes
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfileValidation, validateRequest, updateProfile);

export default router; 