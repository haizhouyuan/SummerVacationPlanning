import { Router } from 'express';
import { body } from 'express-validator';
import {
  createPointsRule,
  getPointsRules,
  updatePointsRule,
  createGameTimeConfig,
  getGameTimeConfig,
  checkDailyPointsLimit,
  initializeDefaultPointsRules,
} from '../controllers/pointsConfigController';
import { authenticateToken } from '../middleware/mongoAuth';
import { validateRequest } from '../middleware/validation';

const router = Router();

// Points rule validation
const pointsRuleValidation = [
  body('category').isIn(['exercise', 'reading', 'chores', 'learning', 'creativity', 'other']),
  body('activity').isString().isLength({ min: 1, max: 100 }),
  body('basePoints').isInt({ min: 0, max: 100 }),
  body('bonusRules').optional().isArray(),
  body('bonusRules.*.type').optional().isIn(['word_count', 'duration', 'quality', 'completion']),
  body('bonusRules.*.threshold').optional().isNumeric(),
  body('bonusRules.*.bonusPoints').optional().isInt({ min: 0, max: 50 }),
  body('bonusRules.*.maxBonus').optional().isInt({ min: 0, max: 100 }),
  body('dailyLimit').optional().isInt({ min: 1, max: 50 }),
  body('isActive').optional().isBoolean(),
];

const pointsRuleUpdateValidation = [
  body('category').optional().isIn(['exercise', 'reading', 'chores', 'learning', 'creativity', 'other']),
  body('activity').optional().isString().isLength({ min: 1, max: 100 }),
  body('basePoints').optional().isInt({ min: 0, max: 100 }),
  body('bonusRules').optional().isArray(),
  body('dailyLimit').optional().isInt({ min: 1, max: 50 }),
  body('isActive').optional().isBoolean(),
];

// Game time configuration validation
const gameTimeConfigValidation = [
  body('baseGameTimeMinutes').optional().isInt({ min: 0, max: 120 }),
  body('pointsToMinutesRatio').optional().isInt({ min: 1, max: 20 }),
  body('educationalGameBonus').optional().isNumeric(),
  body('dailyGameTimeLimit').optional().isInt({ min: 30, max: 480 }),
  body('freeEducationalMinutes').optional().isInt({ min: 0, max: 60 }),
  body('weeklyAccumulationLimit').optional().isInt({ min: 0, max: 500 }),
];

// Daily points limit check validation
const dailyPointsLimitValidation = [
  body('date').isISO8601().toDate(),
  body('activity').isString().isLength({ min: 1 }),
  body('pointsToAdd').isInt({ min: 1, max: 100 }),
];

// All routes require authentication
router.use(authenticateToken);

// Points rules routes
router.post('/rules', pointsRuleValidation, validateRequest, createPointsRule);
router.get('/rules', getPointsRules);
router.put('/rules/:ruleId', pointsRuleUpdateValidation, validateRequest, updatePointsRule);

// Game time configuration routes
router.post('/game-time-config', gameTimeConfigValidation, validateRequest, createGameTimeConfig);
router.get('/game-time-config', getGameTimeConfig);

// Daily points limit routes
router.post('/check-daily-limit', dailyPointsLimitValidation, validateRequest, checkDailyPointsLimit);

// Initialize default configuration route
router.post('/initialize-defaults', initializeDefaultPointsRules);

export default router;