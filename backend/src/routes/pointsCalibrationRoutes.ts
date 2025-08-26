import { Router } from 'express';
import { body, query } from 'express-validator';
import {
  calculateCalibratedPoints,
  autoAdjustPointsRule,
  applySuggestedAdjustments,
  getPointsSystemBalance,
  getActivityEffectivenessAnalysis,
  batchAdjustPointsRules,
} from '../controllers/pointsCalibrationController';
import { authenticateToken } from '../middleware/mongoAuth';
import { validateRequest } from '../middleware/validation';

const router = Router();

// 所有路由都需要认证
router.use(authenticateToken);

// 验证规则
const calculateCalibratedPointsValidation = [
  body('activityType').isString().isLength({ min: 1 }).withMessage('活动类型是必需的'),
  body('basePoints').isInt({ min: 0 }).withMessage('基础积分必须是非负整数'),
  body('difficulty').optional().isIn(['easy', 'medium', 'hard', 'expert']).withMessage('难度必须是有效值'),
  body('quality').optional().isIn(['poor', 'average', 'good', 'excellent']).withMessage('质量必须是有效值'),
  body('duration').optional().isInt({ min: 0 }).withMessage('持续时间必须是非负整数'),
  body('wordCount').optional().isInt({ min: 0 }).withMessage('字数必须是非负整数'),
  body('accuracy').optional().isFloat({ min: 0, max: 1 }).withMessage('准确率必须是0-1之间的数值'),
  body('completedAheadOfSchedule').optional().isBoolean().withMessage('提前完成标志必须是布尔值'),
  body('extraEffort').optional().isBoolean().withMessage('额外努力标志必须是布尔值'),
];

const autoAdjustValidation = [
  body('activityType').isString().isLength({ min: 1 }).withMessage('活动类型是必需的'),
];

const applyAdjustmentsValidation = [
  body('activityType').isString().isLength({ min: 1 }).withMessage('活动类型是必需的'),
  body('adjustments').isObject().withMessage('调整参数必须是对象'),
  body('adjustments.basePoints').optional().isInt({ min: 0 }).withMessage('基础积分必须是非负整数'),
  body('adjustments.dailyLimit').optional().isInt({ min: 1 }).withMessage('每日限制必须是正整数'),
];

const batchAdjustValidation = [
  body('adjustmentType').isIn(['basePoints', 'dailyLimit', 'difficulty']).withMessage('调整类型必须是有效值'),
  body('adjustmentValue').custom((value) => {
    if (typeof value === 'number' || (typeof value === 'object' && value !== null)) {
      return true;
    }
    throw new Error('调整值必须是数字或对象');
  }),
];

// Debug middleware
router.use((req, res, next) => {
  console.log(`🔍 Points Calibration route: ${req.method} ${req.path}`);
  next();
});

/**
 * @route POST /api/points-calibration/calculate
 * @description 计算校准后的积分
 */
router.post('/calculate', calculateCalibratedPointsValidation, validateRequest, calculateCalibratedPoints);

/**
 * @route POST /api/points-calibration/auto-adjust
 * @description 自动分析并建议积分规则调整
 */
router.post('/auto-adjust', autoAdjustValidation, validateRequest, autoAdjustPointsRule);

/**
 * @route POST /api/points-calibration/apply-adjustments
 * @description 应用建议的积分规则调整
 */
router.post('/apply-adjustments', applyAdjustmentsValidation, validateRequest, applySuggestedAdjustments);

/**
 * @route GET /api/points-calibration/system-balance
 * @description 获取积分系统整体平衡分析
 */
router.get('/system-balance', getPointsSystemBalance);

/**
 * @route GET /api/points-calibration/activity-analysis
 * @description 获取所有活动的效果分析
 */
router.get('/activity-analysis', getActivityEffectivenessAnalysis);

/**
 * @route POST /api/points-calibration/batch-adjust
 * @description 批量调整积分规则
 */
router.post('/batch-adjust', batchAdjustValidation, validateRequest, batchAdjustPointsRules);

// 测试端点
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Points Calibration API is working!',
    timestamp: new Date().toISOString(),
    endpoints: [
      'POST /calculate - 计算校准后的积分',
      'POST /auto-adjust - 自动分析积分规则',
      'POST /apply-adjustments - 应用规则调整',
      'GET /system-balance - 系统平衡分析',
      'GET /activity-analysis - 活动效果分析',
      'POST /batch-adjust - 批量调整规则',
    ],
    calibrationFeatures: [
      '难度系数调整 (easy: 1.0, medium: 1.2, hard: 1.5, expert: 2.0)',
      '质量系数调整 (poor: 0.7, average: 1.0, good: 1.3, excellent: 1.6)',
      '年龄适应性调整 (6-8岁: +20%, 9-11岁: 基准, 12-14岁: -10%, 15+: -20%)',
      '连续完成奖励 (3天: +10%, 7天: +20%, 14天: +30%, 30天: +50%)',
      '表现奖励 (准确率、提前完成、额外努力、时间投入、字数等)',
      '自动规则优化建议基于历史数据分析',
      '系统整体平衡监控和调整建议',
    ],
  });
});

export default router;