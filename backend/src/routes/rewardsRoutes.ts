import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  calculateGameTime,
  getTodayGameTime,
  useGameTime,
  getSpecialRewards,
  exchangeGameTime,
  getGameTimeExchanges,
  requestSpecialReward,
  getSpecialRewardRequests,
  approveSpecialRedemption,
  rejectSpecialRedemption,
} from '../controllers/rewardsController';
import { authenticateToken } from '../middleware/mongoAuth';
import { validateRequest } from '../middleware/validation';

const router = Router();

// Game time exchange validation
const gameTimeValidation = [
  body('pointsToSpend').isInt({ min: 1, max: 100 }),
  body('gameType').optional().isIn(['normal', 'educational']),
  body('date').optional().isISO8601().toDate(),
];

const useGameTimeValidation = [
  body('minutesToUse').isInt({ min: 1, max: 300 }), // max 5 hours
  body('gameSession').optional().isLength({ max: 100 }),
];

// Debug middleware
router.use((req, res, next) => {
  console.log(`🔍 Rewards route: ${req.method} ${req.path}`);
  next();
});

// Test route without authentication
router.get('/debug-test', (req, res) => {
  res.json({ message: 'Debug test route works!', path: req.path });
});

// All routes require authentication
router.use(authenticateToken);

// Game time exchange routes (more specific routes first)
router.post('/game-time/exchange', [
  body('gameType').isIn(['normal', 'educational']),
  body('points').isInt({ min: 1, max: 100 }),
], validateRequest, exchangeGameTime);
router.get('/game-time/exchanges', getGameTimeExchanges);

// Game time management routes
router.post('/game-time/calculate', gameTimeValidation, validateRequest, calculateGameTime);
router.get('/game-time/today', getTodayGameTime);
router.post('/game-time/use', useGameTimeValidation, validateRequest, useGameTime);

// Test route
router.get('/test-route', (req, res) => {
  res.json({ message: 'Test route works!' });
});

// Special rewards
router.get('/special', getSpecialRewards);

// Special reward request validation
const specialRewardRequestValidation = [
  body('rewardTitle').isString().isLength({ min: 1, max: 200 }).withMessage('Reward title is required and must be 1-200 characters'),
  body('rewardDescription').optional().isString().isLength({ max: 500 }).withMessage('Reward description must be under 500 characters'),
  body('pointsCost').isInt({ min: 1, max: 1000 }).withMessage('Points cost must be between 1-1000'),
  body('notes').optional().isString().isLength({ max: 200 }).withMessage('Notes must be under 200 characters'),
];

const specialRewardApprovalValidation = [
  param('requestId').isMongoId().withMessage('Invalid request ID'),
  body('approvalNotes').optional().isString().isLength({ max: 300 }).withMessage('Approval notes must be under 300 characters'),
];

const specialRewardRejectionValidation = [
  param('requestId').isMongoId().withMessage('Invalid request ID'),
  body('rejectionReason').isString().isLength({ min: 1, max: 300 }).withMessage('Rejection reason is required and must be 1-300 characters'),
];

// Special reward request routes
router.post('/special/request', specialRewardRequestValidation, validateRequest, requestSpecialReward);
router.get('/special/requests', getSpecialRewardRequests);
router.put('/special/:requestId/approve', specialRewardApprovalValidation, validateRequest, approveSpecialRedemption);
router.put('/special/:requestId/reject', specialRewardRejectionValidation, validateRequest, rejectSpecialRedemption);

export default router;