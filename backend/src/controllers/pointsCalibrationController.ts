import { Response } from 'express';
import { AuthRequest } from '../middleware/mongoAuth';
import { PointsCalibrationService } from '../services/pointsCalibrationService';
import { collections } from '../config/mongodb';

/**
 * 积分算法校准控制器
 * Points Algorithm Calibration Controller - 难度系数和奖励平衡
 */

/**
 * 计算校准后的积分
 */
export const calculateCalibratedPoints = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const {
      activityType,
      basePoints,
      difficulty,
      quality,
      duration,
      wordCount,
      accuracy,
      completedAheadOfSchedule,
      extraEffort,
    } = req.body;

    if (!activityType || basePoints === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Activity type and base points are required',
      });
    }

    if (basePoints < 0) {
      return res.status(400).json({
        success: false,
        error: 'Base points must be non-negative',
      });
    }

    const result = await PointsCalibrationService.calculateCalibratedPoints(
      req.user.id,
      activityType,
      basePoints,
      {
        difficulty,
        quality,
        duration,
        wordCount,
        accuracy,
        completedAheadOfSchedule,
        extraEffort,
      }
    );

    res.status(200).json({
      success: true,
      data: result,
      message: '积分校准计算成功',
    });
  } catch (error: any) {
    console.error('积分校准计算失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to calculate calibrated points',
    });
  }
};

/**
 * 自动调整积分规则
 */
export const autoAdjustPointsRule = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    // 只有家长可以调整积分规则
    if (req.user.role !== 'parent') {
      return res.status(403).json({
        success: false,
        error: 'Only parents can adjust points rules',
      });
    }

    const { activityType } = req.body;

    if (!activityType) {
      return res.status(400).json({
        success: false,
        error: 'Activity type is required',
      });
    }

    const result = await PointsCalibrationService.autoAdjustPointsRule(activityType);

    res.status(200).json({
      success: true,
      data: result,
      message: '积分规则自动调整分析完成',
    });
  } catch (error: any) {
    console.error('自动调整积分规则失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to auto-adjust points rule',
    });
  }
};

/**
 * 应用建议的积分规则调整
 */
export const applySuggestedAdjustments = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    if (req.user.role !== 'parent') {
      return res.status(403).json({
        success: false,
        error: 'Only parents can apply points rule adjustments',
      });
    }

    const { activityType, adjustments } = req.body;

    if (!activityType || !adjustments) {
      return res.status(400).json({
        success: false,
        error: 'Activity type and adjustments are required',
      });
    }

    // 获取当前规则
    const currentRule = await collections.pointsRules.findOne({
      activity: activityType,
      isActive: true,
    });

    if (!currentRule) {
      return res.status(404).json({
        success: false,
        error: 'Points rule not found for this activity',
      });
    }

    // 准备更新数据
    const updates: any = {
      updatedAt: new Date(),
    };

    if (adjustments.basePoints !== undefined) {
      updates.basePoints = Math.max(0, adjustments.basePoints);
    }

    if (adjustments.dailyLimit !== undefined) {
      updates.dailyLimit = Math.max(1, adjustments.dailyLimit);
    }

    if (adjustments.multipliers) {
      updates.multipliers = {
        ...currentRule.multipliers,
        ...adjustments.multipliers,
      };
    }

    // 更新规则
    const result = await collections.pointsRules.updateOne(
      { _id: currentRule._id },
      { $set: updates }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({
        success: false,
        error: 'No changes were made to the points rule',
      });
    }

    // 获取更新后的规则
    const updatedRule = await collections.pointsRules.findOne({ _id: currentRule._id });

    res.status(200).json({
      success: true,
      data: {
        originalRule: currentRule,
        updatedRule,
        appliedAdjustments: adjustments,
      },
      message: '积分规则调整已成功应用',
    });
  } catch (error: any) {
    console.error('应用积分规则调整失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to apply suggested adjustments',
    });
  }
};

/**
 * 获取积分系统整体平衡分析
 */
export const getPointsSystemBalance = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    // 只有家长可以查看系统平衡分析
    if (req.user.role !== 'parent') {
      return res.status(403).json({
        success: false,
        error: 'Only parents can view points system balance',
      });
    }

    const result = await PointsCalibrationService.getPointsSystemBalance();

    res.status(200).json({
      success: true,
      data: result,
      message: '积分系统平衡分析获取成功',
    });
  } catch (error: any) {
    console.error('获取积分系统平衡分析失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get points system balance',
    });
  }
};

/**
 * 获取活动积分效果分析
 */
export const getActivityEffectivenessAnalysis = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    if (req.user.role !== 'parent') {
      return res.status(403).json({
        success: false,
        error: 'Only parents can view activity analysis',
      });
    }

    // 获取所有活跃的积分规则
    const pointsRules = await collections.pointsRules.find({ isActive: true }).toArray();
    
    const analysisResults = [];

    // 为每个活动生成分析
    for (const rule of pointsRules) {
      try {
        const analysis = await PointsCalibrationService.autoAdjustPointsRule(rule.activity);
        analysisResults.push({
          activityType: rule.activity,
          currentRule: rule,
          analysis,
        });
      } catch (error) {
        console.error(`分析活动 ${rule.activity} 失败:`, error);
        // 继续处理其他活动
      }
    }

    res.status(200).json({
      success: true,
      data: {
        activities: analysisResults,
        totalActivities: pointsRules.length,
        analyzedActivities: analysisResults.length,
      },
      message: '活动效果分析完成',
    });
  } catch (error: any) {
    console.error('获取活动效果分析失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get activity effectiveness analysis',
    });
  }
};

/**
 * 批量调整积分规则
 */
export const batchAdjustPointsRules = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    if (req.user.role !== 'parent') {
      return res.status(403).json({
        success: false,
        error: 'Only parents can batch adjust points rules',
      });
    }

    const { adjustmentType, adjustmentValue } = req.body;

    if (!adjustmentType || adjustmentValue === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Adjustment type and value are required',
      });
    }

    const validAdjustmentTypes = ['basePoints', 'dailyLimit', 'difficulty'];
    if (!validAdjustmentTypes.includes(adjustmentType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid adjustment type. Must be one of: ${validAdjustmentTypes.join(', ')}`,
      });
    }

    // 获取所有活跃的积分规则
    const pointsRules = await collections.pointsRules.find({ isActive: true }).toArray();

    const updateOperations = [];
    const updateResults = [];

    for (const rule of pointsRules) {
      const updates: any = { updatedAt: new Date() };
      
      switch (adjustmentType) {
        case 'basePoints':
          if (typeof adjustmentValue === 'number') {
            updates.basePoints = Math.max(0, rule.basePoints + adjustmentValue);
          } else if (typeof adjustmentValue === 'object' && adjustmentValue.multiplier) {
            updates.basePoints = Math.max(0, Math.round(rule.basePoints * adjustmentValue.multiplier));
          }
          break;
        
        case 'dailyLimit':
          if (rule.dailyLimit) {
            if (typeof adjustmentValue === 'number') {
              updates.dailyLimit = Math.max(1, rule.dailyLimit + adjustmentValue);
            } else if (typeof adjustmentValue === 'object' && adjustmentValue.multiplier) {
              updates.dailyLimit = Math.max(1, Math.round(rule.dailyLimit * adjustmentValue.multiplier));
            }
          }
          break;
        
        case 'difficulty':
          if (adjustmentValue.difficulty && rule.multipliers?.difficulty) {
            updates['multipliers.difficulty'] = {
              ...rule.multipliers.difficulty,
              ...adjustmentValue.difficulty,
            };
          }
          break;
      }

      if (Object.keys(updates).length > 1) { // 除了 updatedAt
        updateOperations.push({
          updateOne: {
            filter: { _id: rule._id },
            update: { $set: updates },
          }
        });
        
        updateResults.push({
          activityType: rule.activity,
          originalValue: rule[adjustmentType as keyof typeof rule],
          newValue: updates[adjustmentType] || updates[`multipliers.${adjustmentType}`],
        });
      }
    }

    // 执行批量更新
    let bulkResult = null;
    if (updateOperations.length > 0) {
      bulkResult = await collections.pointsRules.bulkWrite(updateOperations);
    }

    res.status(200).json({
      success: true,
      data: {
        adjustmentType,
        adjustmentValue,
        rulesUpdated: bulkResult?.modifiedCount || 0,
        totalRules: pointsRules.length,
        updateResults,
      },
      message: `成功批量调整 ${bulkResult?.modifiedCount || 0} 条积分规则`,
    });
  } catch (error: any) {
    console.error('批量调整积分规则失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to batch adjust points rules',
    });
  }
};