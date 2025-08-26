import { Router } from 'express';
import { body, query } from 'express-validator';
import {
  checkPointsLimits,
  addPointsWithLimits,
  getUserPointsSummary,
  getDailyPointsStatus,
  getWeeklyPointsStatus,
  resetUserPointsLimits,
} from '../controllers/pointsBalanceController';
import { authenticateToken } from '../middleware/mongoAuth';
import { validateRequest } from '../middleware/validation';

const router = Router();

// 所有路由都需要认证
router.use(authenticateToken);

// 验证规则
const checkPointsLimitsValidation = [
  body('date').isISO8601().toDate().withMessage('有效的日期格式 (YYYY-MM-DD)'),
  body('pointsToAdd').isInt({ min: 0 }).withMessage('积分必须是非负整数'),
  body('activityType').optional().isString().withMessage('活动类型必须是字符串'),
];

const addPointsValidation = [
  body('date').isISO8601().toDate().withMessage('有效的日期格式 (YYYY-MM-DD)'),
  body('pointsToAdd').isInt({ min: 1 }).withMessage('积分必须是正整数'),
  body('activityType').isString().isLength({ min: 1 }).withMessage('活动类型是必需的'),
  body('reason').isString().isLength({ min: 1 }).withMessage('积分获得原因是必需的'),
  body('dailyTaskId').optional().isMongoId().withMessage('无效的任务ID'),
];

const dateQueryValidation = [
  query('date').optional().isISO8601().toDate().withMessage('有效的日期格式 (YYYY-MM-DD)'),
];

const resetPointsValidation = [
  body('date').isISO8601().toDate().withMessage('有效的日期格式 (YYYY-MM-DD)'),
  body('targetUserId').optional().isMongoId().withMessage('无效的用户ID'),
];

// Debug middleware
router.use((req, res, next) => {
  console.log(`🔍 Points Balance route: ${req.method} ${req.path}`);
  next();
});

/**
 * @route POST /api/points-balance/check-limits
 * @description 检查积分添加是否符合每日和周累积限制
 */
router.post('/check-limits', checkPointsLimitsValidation, validateRequest, checkPointsLimits);

/**
 * @route POST /api/points-balance/add-points
 * @description 添加积分并考虑所有限制
 */
router.post('/add-points', addPointsValidation, validateRequest, addPointsWithLimits);

/**
 * @route GET /api/points-balance/summary
 * @description 获取用户积分统计摘要
 */
router.get('/summary', dateQueryValidation, validateRequest, getUserPointsSummary);

/**
 * @route GET /api/points-balance/daily-status
 * @description 获取用户每日积分限制状态
 */
router.get('/daily-status', [
  query('date').optional().isISO8601().toDate().withMessage('有效的日期格式 (YYYY-MM-DD)'),
  query('activityType').optional().isString().withMessage('活动类型必须是字符串'),
], validateRequest, getDailyPointsStatus);

/**
 * @route GET /api/points-balance/weekly-status
 * @description 获取用户周累积积分状态
 */
router.get('/weekly-status', dateQueryValidation, validateRequest, getWeeklyPointsStatus);

/**
 * @route POST /api/points-balance/reset-limits
 * @description 管理员端点：重置用户积分限制（仅供调试和管理使用）
 */
router.post('/reset-limits', resetPointsValidation, validateRequest, resetUserPointsLimits);

// 测试端点
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Points Balance API is working!',
    timestamp: new Date().toISOString(),
    endpoints: [
      'POST /check-limits - 检查积分限制',
      'POST /add-points - 添加积分',
      'GET /summary - 获取积分摘要',
      'GET /daily-status - 获取每日状态',
      'GET /weekly-status - 获取周状态',
      'POST /reset-limits - 重置积分限制 (管理员)',
    ],
  });
});

export default router;