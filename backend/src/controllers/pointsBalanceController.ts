import { Response } from 'express';
import { AuthRequest } from '../middleware/mongoAuth';
import { PointsLimitService } from '../services/pointsLimitService';
import { collections } from '../config/mongodb';

/**
 * 积分平衡优化控制器
 * Points Balance Optimization Controller
 */

/**
 * 检查积分添加是否符合每日和周累积限制
 */
export const checkPointsLimits = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { date, pointsToAdd, activityType } = req.body;

    if (!date || pointsToAdd === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Date and pointsToAdd are required',
      });
    }

    if (pointsToAdd < 0) {
      return res.status(400).json({
        success: false,
        error: 'Points to add must be non-negative',
      });
    }

    const result = await PointsLimitService.checkAllPointsLimits(
      req.user.id,
      date,
      pointsToAdd,
      activityType
    );

    res.status(200).json({
      success: true,
      data: result,
      message: result.canAdd ? '可以添加积分' : (result.reason || '无法添加积分'),
    });
  } catch (error: any) {
    console.error('检查积分限制失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to check points limits',
    });
  }
};

/**
 * 添加积分并考虑所有限制
 */
export const addPointsWithLimits = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { date, pointsToAdd, activityType, reason, dailyTaskId } = req.body;

    if (!date || pointsToAdd === undefined || !activityType || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Date, pointsToAdd, activityType, and reason are required',
      });
    }

    if (pointsToAdd <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Points to add must be positive',
      });
    }

    const result = await PointsLimitService.addPointsWithLimits(
      req.user.id,
      date,
      pointsToAdd,
      activityType,
      reason,
      dailyTaskId
    );

    res.status(result.success ? 200 : 400).json({
      success: result.success,
      data: {
        pointsAdded: result.pointsAdded,
        newDailyTotal: result.newDailyTotal,
        newWeeklyTotal: result.newWeeklyTotal,
        transactionId: result.transactionId,
        limitInfo: result.limitInfo,
      },
      message: result.message,
    });
  } catch (error: any) {
    console.error('添加积分失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to add points with limits',
    });
  }
};

/**
 * 获取用户积分统计摘要
 */
export const getUserPointsSummary = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { date } = req.query;
    const targetDate = (date as string) || new Date().toISOString().split('T')[0];

    const summary = await PointsLimitService.getUserPointsSummary(
      req.user.id,
      targetDate
    );

    res.status(200).json({
      success: true,
      data: summary,
      message: '积分统计摘要获取成功',
    });
  } catch (error: any) {
    console.error('获取积分摘要失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get points summary',
    });
  }
};

/**
 * 获取用户每日积分限制状态
 */
export const getDailyPointsStatus = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { date, activityType } = req.query;
    const targetDate = (date as string) || new Date().toISOString().split('T')[0];

    const dailyStatus = await PointsLimitService.checkDailyPointsLimit(
      req.user.id,
      targetDate,
      0, // 检查当前状态，不添加积分
      activityType as string
    );

    res.status(200).json({
      success: true,
      data: dailyStatus,
      message: '每日积分状态获取成功',
    });
  } catch (error: any) {
    console.error('获取每日积分状态失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get daily points status',
    });
  }
};

/**
 * 获取用户周累积积分状态
 */
export const getWeeklyPointsStatus = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { date } = req.query;
    const targetDate = date ? new Date(date as string) : new Date();

    const weeklyStatus = await PointsLimitService.checkWeeklyPointsLimit(
      req.user.id,
      targetDate,
      0 // 检查当前状态，不添加积分
    );

    res.status(200).json({
      success: true,
      data: weeklyStatus,
      message: '周积分状态获取成功',
    });
  } catch (error: any) {
    console.error('获取周积分状态失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get weekly points status',
    });
  }
};

/**
 * 管理员端点：重置用户积分限制（仅供调试和管理使用）
 */
export const resetUserPointsLimits = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    // 只有管理员或家长可以重置
    if (req.user.role !== 'parent') {
      return res.status(403).json({
        success: false,
        error: 'Only parents can reset points limits',
      });
    }

    const { targetUserId, date } = req.body;
    const userId = targetUserId || req.user.id;

    if (!date) {
      return res.status(400).json({
        success: false,
        error: 'Date is required',
      });
    }

    // 删除指定日期的积分限制记录
    const deleteResult = await collections.userPointsLimits.deleteOne({
      userId,
      date,
    });

    res.status(200).json({
      success: true,
      data: {
        deletedCount: deleteResult.deletedCount,
        userId,
        date,
      },
      message: deleteResult.deletedCount > 0 
        ? '积分限制记录已重置' 
        : '未找到要重置的积分限制记录',
    });
  } catch (error: any) {
    console.error('重置积分限制失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to reset points limits',
    });
  }
};