import { Router } from 'express';
import { body } from 'express-validator';
import {
  createRedemption,
  getRedemptions,
  updateRedemptionStatus,
  deleteRedemption,
  getRedemptionStats,
} from '../controllers/redemptionController';
import { authenticateToken } from '../middleware/mongoAuth';
import { validateRequest } from '../middleware/validation';

const router = Router();

// Redemption validation
const redemptionValidation = [
  body('rewardTitle').isLength({ min: 1, max: 100 }),
  body('rewardDescription').optional().isLength({ max: 300 }),
  body('pointsCost').isInt({ min: 1, max: 1000 }),
  body('notes').optional().isLength({ max: 200 }),
];

const redemptionUpdateValidation = [
  body('status').isIn(['pending', 'approved', 'rejected']),
  body('notes').optional().isLength({ max: 200 }),
];

// All routes require authentication
router.use(authenticateToken);

// Redemption routes
router.post('/', redemptionValidation, validateRequest, createRedemption);
router.get('/', getRedemptions);
router.put('/:redemptionId', redemptionUpdateValidation, validateRequest, updateRedemptionStatus);
router.delete('/:redemptionId', deleteRedemption);
router.get('/stats', getRedemptionStats);

export default router;