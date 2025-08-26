import { collections } from '../config/mongodb';
import { UserPointsLimit, PointsTransaction } from '../types';
import { ObjectId } from 'mongodb';

/**
 * Points Balance Optimization Service
 * 积分机制平衡优化服务 - 每日上限和周累积限制
 */
export class PointsLimitService {
  
  /**
   * 获取用户周开始时间 (周一00:00:00)
   */
  private static getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const weekStart = new Date(d.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  }

  /**
   * 获取用户周结束时间 (周日23:59:59)
   */
  private static getWeekEnd(date: Date): Date {
    const weekStart = this.getWeekStart(date);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    return weekEnd;
  }

  /**
   * 获取周日期范围
   */
  private static getWeekDateRange(date: Date): { start: string; end: string } {
    const weekStart = this.getWeekStart(date);
    const weekEnd = this.getWeekEnd(date);
    
    return {
      start: weekStart.toISOString().split('T')[0],
      end: weekEnd.toISOString().split('T')[0],
    };
  }

  /**
   * 检查用户每日积分限制
   * @param userId 用户ID
   * @param date 日期 YYYY-MM-DD
   * @param pointsToAdd 要添加的积分
   * @param activityType 活动类型
   */
  static async checkDailyPointsLimit(
    userId: string,
    date: string,
    pointsToAdd: number,
    activityType?: string
  ): Promise<{
    canAdd: boolean;
    maxCanAdd: number;
    currentDailyTotal: number;
    dailyLimit: number;
    activityLimit?: number;
    currentActivityTotal?: number;
    reason?: string;
  }> {
    try {
      // 全局每日积分上限
      const GLOBAL_DAILY_LIMIT = 20;
      
      // 获取或创建用户当日积分记录
      let userLimit = await collections.userPointsLimits.findOne({
        userId,
        date,
      });

      if (!userLimit) {
        // 创建新的每日积分记录
        const gameTimeConfig = await collections.gameTimeConfigs.findOne({ isActive: true });
        const baseGameTime = gameTimeConfig?.baseGameTimeMinutes || 30;

        userLimit = {
          userId,
          date,
          activityPoints: {},
          totalDailyPoints: 0,
          gameTimeUsed: 0,
          gameTimeAvailable: baseGameTime,
          accumulatedPoints: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as UserPointsLimit;

        const result = await collections.userPointsLimits.insertOne(userLimit);
        userLimit.id = result.insertedId.toString();
      }

      const currentDailyTotal = userLimit.totalDailyPoints || 0;
      
      // 检查全局每日限制
      if (currentDailyTotal >= GLOBAL_DAILY_LIMIT) {
        return {
          canAdd: false,
          maxCanAdd: 0,
          currentDailyTotal,
          dailyLimit: GLOBAL_DAILY_LIMIT,
          reason: '已达到全局每日积分上限',
        };
      }

      const globalRemainingPoints = GLOBAL_DAILY_LIMIT - currentDailyTotal;
      let maxCanAdd = Math.min(pointsToAdd, globalRemainingPoints);

      // 检查活动特定的每日限制
      if (activityType) {
        const pointsRule = await collections.pointsRules.findOne({
          activity: activityType,
          isActive: true,
        });

        if (pointsRule && pointsRule.dailyLimit) {
          const currentActivityTotal = userLimit.activityPoints[activityType] || 0;
          
          if (currentActivityTotal >= pointsRule.dailyLimit) {
            return {
              canAdd: false,
              maxCanAdd: 0,
              currentDailyTotal,
              dailyLimit: GLOBAL_DAILY_LIMIT,
              activityLimit: pointsRule.dailyLimit,
              currentActivityTotal,
              reason: `活动 "${activityType}" 已达到每日积分上限`,
            };
          }

          const activityRemainingPoints = pointsRule.dailyLimit - currentActivityTotal;
          maxCanAdd = Math.min(maxCanAdd, activityRemainingPoints);

          return {
            canAdd: maxCanAdd > 0,
            maxCanAdd,
            currentDailyTotal,
            dailyLimit: GLOBAL_DAILY_LIMIT,
            activityLimit: pointsRule.dailyLimit,
            currentActivityTotal,
          };
        }
      }

      return {
        canAdd: maxCanAdd > 0,
        maxCanAdd,
        currentDailyTotal,
        dailyLimit: GLOBAL_DAILY_LIMIT,
      };
    } catch (error) {
      console.error('检查每日积分限制失败:', error);
      return {
        canAdd: false,
        maxCanAdd: 0,
        currentDailyTotal: 0,
        dailyLimit: 20,
        reason: '系统错误',
      };
    }
  }

  /**
   * 检查用户周累积积分限制
   * @param userId 用户ID
   * @param currentDate 当前日期
   * @param pointsToAdd 要添加的积分
   */
  static async checkWeeklyPointsLimit(
    userId: string,
    currentDate: Date,
    pointsToAdd: number
  ): Promise<{
    canAdd: boolean;
    maxCanAdd: number;
    currentWeeklyTotal: number;
    weeklyLimit: number;
    weekStartDate: string;
    weekEndDate: string;
    reason?: string;
  }> {
    try {
      // 获取活跃的游戏时间配置
      const gameTimeConfig = await collections.gameTimeConfigs.findOne({ isActive: true });
      const weeklyLimit = gameTimeConfig?.weeklyAccumulationLimit || 100;

      const dateRange = this.getWeekDateRange(currentDate);

      // 计算本周已获得的总积分
      const weeklyLimits = await collections.userPointsLimits
        .find({
          userId,
          date: {
            $gte: dateRange.start,
            $lte: dateRange.end,
          },
        })
        .toArray();

      const currentWeeklyTotal = weeklyLimits.reduce(
        (total: number, limit: any) => total + (limit.totalDailyPoints || 0),
        0
      );

      if (currentWeeklyTotal >= weeklyLimit) {
        return {
          canAdd: false,
          maxCanAdd: 0,
          currentWeeklyTotal,
          weeklyLimit,
          weekStartDate: dateRange.start,
          weekEndDate: dateRange.end,
          reason: '已达到周累积积分上限',
        };
      }

      const weeklyRemainingPoints = weeklyLimit - currentWeeklyTotal;
      const maxCanAdd = Math.min(pointsToAdd, weeklyRemainingPoints);

      return {
        canAdd: maxCanAdd > 0,
        maxCanAdd,
        currentWeeklyTotal,
        weeklyLimit,
        weekStartDate: dateRange.start,
        weekEndDate: dateRange.end,
      };
    } catch (error) {
      console.error('检查周积分限制失败:', error);
      return {
        canAdd: false,
        maxCanAdd: 0,
        currentWeeklyTotal: 0,
        weeklyLimit: 100,
        weekStartDate: '',
        weekEndDate: '',
        reason: '系统错误',
      };
    }
  }

  /**
   * 综合检查每日和周累积限制
   * @param userId 用户ID
   * @param date 日期 YYYY-MM-DD
   * @param pointsToAdd 要添加的积分
   * @param activityType 活动类型
   */
  static async checkAllPointsLimits(
    userId: string,
    date: string,
    pointsToAdd: number,
    activityType?: string
  ): Promise<{
    canAdd: boolean;
    maxCanAdd: number;
    dailyCheck: any;
    weeklyCheck: any;
    limitedBy: 'daily' | 'weekly' | 'activity' | 'none';
    reason?: string;
  }> {
    try {
      const currentDate = new Date(date);
      
      const [dailyCheck, weeklyCheck] = await Promise.all([
        this.checkDailyPointsLimit(userId, date, pointsToAdd, activityType),
        this.checkWeeklyPointsLimit(userId, currentDate, pointsToAdd),
      ]);

      // 取最严格的限制
      const maxCanAddDaily = dailyCheck.maxCanAdd;
      const maxCanAddWeekly = weeklyCheck.maxCanAdd;
      const maxCanAdd = Math.min(maxCanAddDaily, maxCanAddWeekly);

      let limitedBy: 'daily' | 'weekly' | 'activity' | 'none' = 'none';
      let reason: string | undefined;

      if (maxCanAdd === 0) {
        if (!dailyCheck.canAdd) {
          if (dailyCheck.activityLimit && dailyCheck.currentActivityTotal && 
              dailyCheck.currentActivityTotal >= dailyCheck.activityLimit) {
            limitedBy = 'activity';
            reason = dailyCheck.reason;
          } else {
            limitedBy = 'daily';
            reason = dailyCheck.reason;
          }
        } else if (!weeklyCheck.canAdd) {
          limitedBy = 'weekly';
          reason = weeklyCheck.reason;
        }
      } else if (maxCanAdd < pointsToAdd) {
        if (maxCanAddDaily < maxCanAddWeekly) {
          limitedBy = 'daily';
          reason = `受每日积分限制影响，最多可获得 ${maxCanAdd} 积分`;
        } else {
          limitedBy = 'weekly';
          reason = `受周累积限制影响，最多可获得 ${maxCanAdd} 积分`;
        }
      }

      return {
        canAdd: maxCanAdd > 0,
        maxCanAdd,
        dailyCheck,
        weeklyCheck,
        limitedBy,
        reason,
      };
    } catch (error) {
      console.error('综合积分限制检查失败:', error);
      
      return {
        canAdd: false,
        maxCanAdd: 0,
        dailyCheck: {
          canAdd: false,
          maxCanAdd: 0,
          currentDailyTotal: 0,
          dailyLimit: 20,
          reason: '系统错误',
        },
        weeklyCheck: {
          canAdd: false,
          maxCanAdd: 0,
          currentWeeklyTotal: 0,
          weeklyLimit: 100,
          weekStartDate: '',
          weekEndDate: '',
          reason: '系统错误',
        },
        limitedBy: 'daily',
        reason: '系统错误',
      };
    }
  }

  /**
   * 添加积分并更新限制记录
   * @param userId 用户ID
   * @param date 日期 YYYY-MM-DD
   * @param pointsToAdd 要添加的积分
   * @param activityType 活动类型
   * @param transactionReason 交易原因
   */
  static async addPointsWithLimits(
    userId: string,
    date: string,
    pointsToAdd: number,
    activityType: string,
    transactionReason: string,
    dailyTaskId?: string
  ): Promise<{
    success: boolean;
    pointsAdded: number;
    newDailyTotal: number;
    newWeeklyTotal: number;
    transactionId?: string;
    limitInfo: any;
    message: string;
  }> {
    try {
      // 先检查所有限制
      const limitCheck = await this.checkAllPointsLimits(userId, date, pointsToAdd, activityType);
      
      if (!limitCheck.canAdd) {
        return {
          success: false,
          pointsAdded: 0,
          newDailyTotal: limitCheck.dailyCheck.currentDailyTotal,
          newWeeklyTotal: limitCheck.weeklyCheck.currentWeeklyTotal,
          limitInfo: limitCheck,
          message: limitCheck.reason || '无法添加积分',
        };
      }

      const actualPointsToAdd = limitCheck.maxCanAdd;

      // 更新用户总积分
      const user = await collections.users.findOne({ _id: new ObjectId(userId) });
      if (!user) {
        throw new Error('用户不存在');
      }

      const previousTotal = user.points || 0;
      const newTotal = previousTotal + actualPointsToAdd;

      await collections.users.updateOne(
        { _id: new ObjectId(userId) },
        { 
          $set: { 
            points: newTotal,
            updatedAt: new Date(),
          } 
        }
      );

      // 更新或创建用户每日限制记录
      const updateResult = await collections.userPointsLimits.updateOne(
        { userId, date },
        {
          $inc: {
            totalDailyPoints: actualPointsToAdd,
            [`activityPoints.${activityType}`]: actualPointsToAdd,
          },
          $set: {
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );

      // 创建积分交易记录
      const transaction: Omit<PointsTransaction, 'id'> = {
        userId,
        dailyTaskId,
        type: 'earn',
        amount: actualPointsToAdd,
        reason: transactionReason,
        previousTotal,
        newTotal,
        metadata: {
          activityType,
          originalPoints: pointsToAdd,
        },
        createdAt: new Date(),
      };

      const transactionResult = await collections.pointsTransactions.insertOne(transaction);

      // 重新计算当前状态
      const updatedLimitCheck = await this.checkAllPointsLimits(userId, date, 0, activityType);

      return {
        success: true,
        pointsAdded: actualPointsToAdd,
        newDailyTotal: updatedLimitCheck.dailyCheck.currentDailyTotal,
        newWeeklyTotal: updatedLimitCheck.weeklyCheck.currentWeeklyTotal,
        transactionId: transactionResult.insertedId.toString(),
        limitInfo: limitCheck,
        message: actualPointsToAdd < pointsToAdd 
          ? `受限制影响，实际获得 ${actualPointsToAdd} 积分 (请求: ${pointsToAdd})`
          : `成功获得 ${actualPointsToAdd} 积分`,
      };
    } catch (error) {
      console.error('添加积分失败:', error);
      throw new Error(`添加积分失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取用户积分统计摘要
   * @param userId 用户ID
   * @param date 当前日期
   */
  static async getUserPointsSummary(
    userId: string,
    date: string
  ): Promise<{
    dailyStats: {
      totalToday: number;
      dailyLimit: number;
      dailyRemaining: number;
      activitiesBreakdown: { [activity: string]: { current: number; limit?: number } };
    };
    weeklyStats: {
      totalThisWeek: number;
      weeklyLimit: number;
      weeklyRemaining: number;
      weekStartDate: string;
      weekEndDate: string;
    };
    userTotalPoints: number;
  }> {
    try {
      const currentDate = new Date(date);
      const dateRange = this.getWeekDateRange(currentDate);

      // 获取用户总积分
      const user = await collections.users.findOne({ _id: new ObjectId(userId) });
      const userTotalPoints = user?.points || 0;

      // 获取每日数据
      const dailyLimit = await collections.userPointsLimits.findOne({
        userId,
        date,
      });

      const totalToday = dailyLimit?.totalDailyPoints || 0;
      const activityPoints = dailyLimit?.activityPoints || {};

      // 获取活动规则以显示限制
      const pointsRules = await collections.pointsRules.find({ isActive: true }).toArray();
      const activitiesBreakdown: { [activity: string]: { current: number; limit?: number } } = {};

      for (const [activity, points] of Object.entries(activityPoints)) {
        const rule = pointsRules.find((r: any) => r.activity === activity);
        activitiesBreakdown[activity] = {
          current: points as number,
          limit: rule?.dailyLimit,
        };
      }

      // 获取周数据
      const weeklyLimits = await collections.userPointsLimits
        .find({
          userId,
          date: {
            $gte: dateRange.start,
            $lte: dateRange.end,
          },
        })
        .toArray();

      const totalThisWeek = weeklyLimits.reduce(
        (total: number, limit: any) => total + (limit.totalDailyPoints || 0),
        0
      );

      const gameTimeConfig = await collections.gameTimeConfigs.findOne({ isActive: true });
      const weeklyLimit = gameTimeConfig?.weeklyAccumulationLimit || 100;

      return {
        dailyStats: {
          totalToday,
          dailyLimit: 20,
          dailyRemaining: Math.max(0, 20 - totalToday),
          activitiesBreakdown,
        },
        weeklyStats: {
          totalThisWeek,
          weeklyLimit,
          weeklyRemaining: Math.max(0, weeklyLimit - totalThisWeek),
          weekStartDate: dateRange.start,
          weekEndDate: dateRange.end,
        },
        userTotalPoints,
      };
    } catch (error) {
      console.error('获取积分摘要失败:', error);
      throw new Error(`获取积分摘要失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}