import { Response } from 'express';
import { AuthRequest } from '../middleware/mongoAuth';
import { collections } from '../config/mongodb';
import { ObjectId } from 'mongodb';
import { 
  PointsStats, 
  GameTimeStats, 
  TaskCompletionRecord, 
  RedemptionHistoryItem,
  RewardsCenterData 
} from '../types';

/**
 * Get user points statistics
 */
export const getUserPointsStats = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const userId = req.user.id;
    const user = await collections.users.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Calculate date ranges
    const now = new Date();
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get weekly earned points
    const weeklyEarned = await collections.dailyTasks.aggregate([
      {
        $match: {
          userId: userId,
          status: 'completed',
          completedAt: { $gte: weekStart }
        }
      },
      {
        $group: {
          _id: null,
          totalPoints: { $sum: '$pointsEarned' }
        }
      }
    ]).toArray();

    // Get monthly earned points
    const monthlyEarned = await collections.dailyTasks.aggregate([
      {
        $match: {
          userId: userId,
          status: 'completed',
          completedAt: { $gte: monthStart }
        }
      },
      {
        $group: {
          _id: null,
          totalPoints: { $sum: '$pointsEarned' }
        }
      }
    ]).toArray();

    // Get total earned points
    const totalEarned = await collections.dailyTasks.aggregate([
      {
        $match: {
          userId: userId,
          status: 'completed',
          pointsEarned: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: null,
          totalPoints: { $sum: '$pointsEarned' }
        }
      }
    ]).toArray();

    // Get weekly spent points (from game time exchanges and redemptions)
    const weeklySpent = await calculateWeeklySpentPoints(userId, weekStart);
    const monthlySpent = await calculateMonthlySpentPoints(userId, monthStart);
    const totalSpent = await calculateTotalSpentPoints(userId);

    const currentPoints = user.points || 0;
    const level = Math.floor(currentPoints / 100) + 1;
    const nextLevelPoints = level * 100;
    const pointsToNextLevel = Math.max(nextLevelPoints - currentPoints, 0);

    const pointsStats: PointsStats = {
      currentPoints,
      weeklyEarned: weeklyEarned[0]?.totalPoints || 0,
      monthlyEarned: monthlyEarned[0]?.totalPoints || 0,
      totalEarned: totalEarned[0]?.totalPoints || 0,
      weeklySpent,
      monthlySpent,
      totalSpent,
      level,
      nextLevelPoints,
      pointsToNextLevel,
    };

    res.status(200).json({
      success: true,
      data: pointsStats,
    });
  } catch (error: any) {
    console.error('Get user points stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get user points statistics',
    });
  }
};

/**
 * Get game time statistics
 */
export const getGameTimeStats = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    // Get today's game time usage
    const todayUsage = await collections.gameTimeExchanges?.find({
      userId: userId,
      date: today
    }).toArray() || [];

    const dailyUsed = todayUsage.reduce((sum: number, exchange: any) => 
      sum + (exchange.minutesGranted || 0), 0);

    // Get weekly game time usage
    const weeklyUsage = await collections.gameTimeExchanges?.find({
      userId: userId,
      createdAt: { $gte: weekStart }
    }).toArray() || [];

    const weeklyUsed = weeklyUsage.reduce((sum: number, exchange: any) => 
      sum + (exchange.minutesGranted || 0), 0);

    // Get user's accumulated points and game time config
    const gameTimeConfig = await collections.gameTimeConfigs?.findOne({ isActive: true });
    const baseGameTime = gameTimeConfig?.baseGameTimeMinutes || 60;
    const conversionRate = gameTimeConfig?.pointsToMinutesRatio || 10;
    const weeklyLimit = gameTimeConfig?.weeklyAccumulationLimit || 500;

    // Calculate available game time
    const dailyAvailable = baseGameTime;
    const weeklyAvailable = baseGameTime * 7 + Math.min(req.user.points || 0, weeklyLimit) / conversionRate;

    const gameTimeStats: GameTimeStats = {
      dailyUsed,
      dailyAvailable,
      weeklyUsed,
      weeklyAvailable,
      accumulatedPoints: req.user.points || 0,
      conversionRate,
    };

    res.status(200).json({
      success: true,
      data: gameTimeStats,
    });
  } catch (error: any) {
    console.error('Get game time stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get game time statistics',
    });
  }
};

/**
 * Get task completion history
 */
export const getTaskCompletionHistory = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { limit = 20, offset = 0 } = req.query;
    const userId = req.user.id;

    // Get recent completed tasks with task details
    const taskRecords = await collections.dailyTasks.aggregate([
      {
        $match: {
          userId: userId,
          status: 'completed',
          pointsEarned: { $gt: 0 }
        }
      },
      {
        $lookup: {
          from: 'tasks',
          localField: 'taskId',
          foreignField: '_id',
          as: 'taskDetails'
        }
      },
      {
        $unwind: '$taskDetails'
      },
      {
        $sort: { completedAt: -1 }
      },
      {
        $skip: Number(offset)
      },
      {
        $limit: Number(limit)
      },
      {
        $project: {
          _id: 1,
          pointsEarned: 1,
          completedAt: 1,
          approvalStatus: 1,
          evidence: 1,
          'taskDetails.title': 1,
          'taskDetails.category': 1
        }
      }
    ]).toArray();

    const records: TaskCompletionRecord[] = taskRecords.map((record: any) => ({
      id: record._id.toString(),
      taskTitle: record.taskDetails?.title || 'Unknown Task',
      taskCategory: record.taskDetails?.category || 'other',
      pointsEarned: record.pointsEarned || 0,
      completedAt: record.completedAt,
      evidenceProvided: !!(record.evidence && record.evidence.length > 0),
      approvalStatus: record.approvalStatus,
    }));

    res.status(200).json({
      success: true,
      data: { records },
    });
  } catch (error: any) {
    console.error('Get task completion history error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get task completion history',
    });
  }
};

/**
 * Get redemption history
 */
export const getRedemptionHistory = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { limit = 20, offset = 0 } = req.query;
    const userId = req.user.id;

    // Get game time exchanges
    const gameTimeExchanges = await collections.gameTimeExchanges?.find({
      userId: userId
    })
    .sort({ createdAt: -1 })
    .skip(Number(offset))
    .limit(Number(limit))
    .toArray() || [];

    // Get special reward redemptions
    const redemptions = await collections.redemptions?.find({
      userId: userId
    })
    .sort({ requestedAt: -1 })
    .skip(Number(offset))
    .limit(Number(limit))
    .toArray() || [];

    // Combine and format redemption history
    const history: RedemptionHistoryItem[] = [];

    // Add game time exchanges
    gameTimeExchanges.forEach((exchange: any) => {
      history.push({
        id: exchange._id.toString(),
        type: 'game_time',
        description: `兑换游戏时间: ${exchange.minutesGranted || 0}分钟`,
        pointsCost: exchange.pointsSpent || 0,
        status: 'approved', // Game time exchanges are immediately approved
        requestedAt: exchange.createdAt,
        processedAt: exchange.createdAt,
      });
    });

    // Add special reward redemptions
    redemptions.forEach((redemption: any) => {
      history.push({
        id: redemption._id.toString(),
        type: 'special_reward',
        description: redemption.rewardTitle || 'Special Reward',
        pointsCost: redemption.pointsCost || 0,
        status: redemption.status,
        requestedAt: redemption.requestedAt,
        processedAt: redemption.processedAt,
        processedBy: redemption.processedBy,
        notes: redemption.notes,
      });
    });

    // Sort by request date
    history.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());

    res.status(200).json({
      success: true,
      data: { history: history.slice(0, Number(limit)) },
    });
  } catch (error: any) {
    console.error('Get redemption history error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get redemption history',
    });
  }
};

/**
 * Get complete rewards center data
 */
export const getRewardsCenterData = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Use separate endpoints: /points-stats, /game-time-stats, /task-history, /redemption-history',
      data: {
        endpoints: {
          pointsStats: '/api/rewards-center/points-stats',
          gameTimeStats: '/api/rewards-center/game-time-stats',
          taskHistory: '/api/rewards-center/task-history',
          redemptionHistory: '/api/rewards-center/redemption-history'
        }
      }
    });
  } catch (error: any) {
    console.error('Get rewards center data error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get rewards center data',
    });
  }
};

// Helper functions
async function calculateWeeklySpentPoints(userId: string, weekStart: Date): Promise<number> {
  let totalSpent = 0;

  try {
    // Game time exchanges
    const gameTimeExchanges = await collections.gameTimeExchanges?.find({
      userId: userId,
      createdAt: { $gte: weekStart }
    }).toArray() || [];

    totalSpent += gameTimeExchanges.reduce((sum: number, exchange: any) => 
      sum + (exchange.pointsSpent || 0), 0);

    // Special reward redemptions
    const redemptions = await collections.redemptions?.find({
      userId: userId,
      status: 'approved',
      processedAt: { $gte: weekStart }
    }).toArray() || [];

    totalSpent += redemptions.reduce((sum: number, redemption: any) => 
      sum + (redemption.pointsCost || 0), 0);
  } catch (error) {
    console.error('Error calculating weekly spent points:', error);
  }

  return totalSpent;
}

async function calculateMonthlySpentPoints(userId: string, monthStart: Date): Promise<number> {
  let totalSpent = 0;

  try {
    // Game time exchanges
    const gameTimeExchanges = await collections.gameTimeExchanges?.find({
      userId: userId,
      createdAt: { $gte: monthStart }
    }).toArray() || [];

    totalSpent += gameTimeExchanges.reduce((sum: number, exchange: any) => 
      sum + (exchange.pointsSpent || 0), 0);

    // Special reward redemptions
    const redemptions = await collections.redemptions?.find({
      userId: userId,
      status: 'approved',
      processedAt: { $gte: monthStart }
    }).toArray() || [];

    totalSpent += redemptions.reduce((sum: number, redemption: any) => 
      sum + (redemption.pointsCost || 0), 0);
  } catch (error) {
    console.error('Error calculating monthly spent points:', error);
  }

  return totalSpent;
}

async function calculateTotalSpentPoints(userId: string): Promise<number> {
  let totalSpent = 0;

  try {
    // Game time exchanges
    const gameTimeExchanges = await collections.gameTimeExchanges?.find({
      userId: userId
    }).toArray() || [];

    totalSpent += gameTimeExchanges.reduce((sum: number, exchange: any) => 
      sum + (exchange.pointsSpent || 0), 0);

    // Special reward redemptions
    const redemptions = await collections.redemptions?.find({
      userId: userId,
      status: 'approved'
    }).toArray() || [];

    totalSpent += redemptions.reduce((sum: number, redemption: any) => 
      sum + (redemption.pointsCost || 0), 0);
  } catch (error) {
    console.error('Error calculating total spent points:', error);
  }

  return totalSpent;
}