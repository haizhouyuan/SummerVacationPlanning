import { Router } from 'express';
import { body } from 'express-validator';
import {
  calculateGameTime,
  getTodayGameTime,
  useGameTime,
  getSpecialRewards,
  exchangeGameTime,
  getGameTimeExchanges,
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

export default router;