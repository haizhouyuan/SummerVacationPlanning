import express from 'express';
import { authenticateToken } from '../middleware/mongoAuth';
import {
  getUserPointsStats,
  getGameTimeStats,
  getTaskCompletionHistory,
  getRedemptionHistory,
  getRewardsCenterData,
} from '../controllers/rewardsCenterController';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * @route GET /api/rewards-center/points-stats
 * @desc Get user points statistics
 * @access Private
 */
router.get('/points-stats', getUserPointsStats);

/**
 * @route GET /api/rewards-center/game-time-stats
 * @desc Get game time statistics
 * @access Private
 */
router.get('/game-time-stats', getGameTimeStats);

/**
 * @route GET /api/rewards-center/task-history
 * @desc Get task completion history
 * @access Private
 * @query limit - Number of records to return (default: 20)
 * @query offset - Number of records to skip (default: 0)
 */
router.get('/task-history', getTaskCompletionHistory);

/**
 * @route GET /api/rewards-center/redemption-history
 * @desc Get redemption history (game time + special rewards)
 * @access Private
 * @query limit - Number of records to return (default: 20)
 * @query offset - Number of records to skip (default: 0)
 */
router.get('/redemption-history', getRedemptionHistory);

/**
 * @route GET /api/rewards-center/dashboard
 * @desc Get complete rewards center dashboard data
 * @access Private
 */
router.get('/dashboard', getRewardsCenterData);

export default router;