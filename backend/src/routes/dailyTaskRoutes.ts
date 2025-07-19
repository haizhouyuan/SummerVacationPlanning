import { Router } from 'express';
import { body } from 'express-validator';
import {
  createDailyTask,
  getDailyTasks,
  updateDailyTaskStatus,
  deleteDailyTask,
  getWeeklyStats,
  getPublicDailyTasks,
  getPendingApprovalTasks,
  approveTask,
} from '../controllers/dailyTaskController';
import { upload, uploadEvidence } from '../controllers/evidenceController';
import { authenticateToken } from '../middleware/mongoAuth';
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
  body('evidenceText').optional().isString().isLength({ max: 2000 }),
  body('evidenceMedia').optional().isArray(),
  body('isPublic').optional().isBoolean(),
  body('notes').optional().isLength({ max: 200 }),
];

const approvalValidation = [
  body('action').isIn(['approve', 'reject']),
  body('approvalNotes').optional().isString().isLength({ max: 500 }),
  body('bonusPoints').optional().isInt({ min: 0, max: 20 }),
];

// All routes require authentication
router.use(authenticateToken);

// Daily task routes
router.post('/', dailyTaskValidation, validateRequest, createDailyTask);
router.get('/', getDailyTasks);
router.put('/:dailyTaskId', dailyTaskUpdateValidation, validateRequest, updateDailyTaskStatus);
router.delete('/:dailyTaskId', deleteDailyTask);
router.get('/stats/weekly', getWeeklyStats);

// 公开打卡内容接口
router.get('/public', getPublicDailyTasks);

// 文件证据上传接口
router.post('/evidence/upload', upload.single('file'), uploadEvidence);

// 任务审批接口 (仅家长)
router.get('/pending-approval', getPendingApprovalTasks);
router.put('/:dailyTaskId/approve', approvalValidation, validateRequest, approveTask);

export default router;