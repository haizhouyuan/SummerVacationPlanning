import { Router } from 'express';
import { body } from 'express-validator';
import {
  createDailyTask,
  getDailyTasks,
  updateDailyTaskStatus,
  deleteDailyTask,
  getWeeklyStats,
} from '../controllers/dailyTaskController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';

const router = Router();

// Daily task validation
const dailyTaskValidation = [
  body('taskId').isString().isLength({ min: 1 }),
  body('date').isISO8601().toDate(),
  body('plannedTime').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('notes').optional().isLength({ max: 200 }),
];

const dailyTaskUpdateValidation = [
  body('status').optional().isIn(['planned', 'in_progress', 'completed', 'skipped']),
  body('evidence').optional().isArray(),
  body('notes').optional().isLength({ max: 200 }),
];

// All routes require authentication
router.use(authenticateToken);

// Daily task routes
router.post('/', dailyTaskValidation, validateRequest, createDailyTask);
router.get('/', getDailyTasks);
router.put('/:dailyTaskId', dailyTaskUpdateValidation, validateRequest, updateDailyTaskStatus);
router.delete('/:dailyTaskId', deleteDailyTask);
router.get('/stats/weekly', getWeeklyStats);

export default router;