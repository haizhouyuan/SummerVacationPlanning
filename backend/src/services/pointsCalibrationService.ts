import { collections } from '../config/mongodb';
import { PointsRule, DailyTask, User } from '../types';
import { ObjectId } from 'mongodb';

/**
 * 积分算法校准服务
 * Points Algorithm Calibration Service - 难度系数和奖励平衡
 */
export class PointsCalibrationService {

  /**
   * 难度系数配置
   */
  private static readonly DIFFICULTY_COEFFICIENTS = {
    easy: 1.0,     // 简单任务基础系数
    medium: 1.2,   // 中等任务 +20%
    hard: 1.5,     // 困难任务 +50%
    expert: 2.0,   // 专家级任务 +100%
  };

  /**
   * 质量系数配置
   */
  private static readonly QUALITY_COEFFICIENTS = {
    poor: 0.7,      // 较差质量 -30%
    average: 1.0,   // 平均质量基础系数
    good: 1.3,      // 良好质量 +30%
    excellent: 1.6, // 优秀质量 +60%
  };

  /**
   * 年龄调整系数
   */
  private static readonly AGE_ADJUSTMENT = {
    '6-8': 1.2,   // 低年级学生 +20%
    '9-11': 1.0,  // 中年级学生基础
    '12-14': 0.9, // 高年级学生 -10%
    '15+': 0.8,   // 青少年 -20%
  };

  /**
   * 连续完成奖励系数
   */
  private static readonly STREAK_BONUS = {
    3: 1.1,   // 连续3天 +10%
    7: 1.2,   // 连续7天 +20%
    14: 1.3,  // 连续14天 +30%
    30: 1.5,  // 连续30天 +50%
  };

  /**
   * 获取用户年龄组
   */
  private static getUserAgeGroup(birthDate?: Date): keyof typeof PointsCalibrationService.AGE_ADJUSTMENT {
    if (!birthDate) return '9-11'; // 默认中年级
    
    const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    
    if (age <= 8) return '6-8';
    if (age <= 11) return '9-11';
    if (age <= 14) return '12-14';
    return '15+';
  }

  /**
   * 获取用户连续完成天数
   */
  private static async getUserStreakDays(userId: string, activityType: string): Promise<number> {
    try {
      const today = new Date();
      let streakDays = 0;
      
      // 从今天开始往前查找连续完成的天数
      for (let i = 0; i < 90; i++) { // 最多查找90天
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        const dateStr = checkDate.toISOString().split('T')[0];
        
        const dailyTask = await collections.dailyTasks.findOne({
          userId,
          date: dateStr,
          status: 'completed',
          // 可选：指定活动类型
          ...(activityType && { 'metadata.activityType': activityType }),
        });
        
        if (dailyTask) {
          streakDays++;
        } else {
          break; // 中断连续记录
        }
      }
      
      return streakDays;
    } catch (error) {
      console.error('获取连续完成天数失败:', error);
      return 0;
    }
  }

  /**
   * 计算校准后的积分
   * @param userId 用户ID
   * @param activityType 活动类型
   * @param basePoints 基础积分
   * @param taskData 任务数据
   */
  static async calculateCalibratedPoints(
    userId: string,
    activityType: string,
    basePoints: number,
    taskData: {
      difficulty?: 'easy' | 'medium' | 'hard' | 'expert';
      quality?: 'poor' | 'average' | 'good' | 'excellent';
      duration?: number; // 完成时间（分钟）
      wordCount?: number; // 字数（用于写作任务）
      accuracy?: number; // 准确率（用于练习任务）
      completedAheadOfSchedule?: boolean; // 是否提前完成
      extraEffort?: boolean; // 是否付出额外努力
    }
  ): Promise<{
    basePoints: number;
    difficultyBonus: number;
    qualityBonus: number;
    ageAdjustment: number;
    streakBonus: number;
    performanceBonus: number;
    totalPoints: number;
    breakdown: {
      difficulty: number;
      quality: number;
      age: number;
      streak: number;
      performance: number;
    };
  }> {
    try {
      // 获取用户信息
      const user = await collections.users.findOne({ _id: new ObjectId(userId) }) as User;
      if (!user) {
        throw new Error('用户不存在');
      }

      let totalPoints = basePoints;
      let difficultyBonus = 0;
      let qualityBonus = 0;
      let ageAdjustment = 0;
      let streakBonus = 0;
      let performanceBonus = 0;

      // 1. 难度系数调整
      if (taskData.difficulty) {
        const difficultyCoeff = this.DIFFICULTY_COEFFICIENTS[taskData.difficulty];
        const bonus = Math.round(basePoints * (difficultyCoeff - 1));
        difficultyBonus = bonus;
        totalPoints += bonus;
      }

      // 2. 质量系数调整
      if (taskData.quality) {
        const qualityCoeff = this.QUALITY_COEFFICIENTS[taskData.quality];
        const bonus = Math.round(basePoints * (qualityCoeff - 1));
        qualityBonus = bonus;
        totalPoints += bonus;
      }

      // 3. 年龄调整
      const ageGroup = this.getUserAgeGroup(user.profile?.birthDate);
      const ageCoeff = this.AGE_ADJUSTMENT[ageGroup];
      if (ageCoeff !== 1.0) {
        const adjustment = Math.round(basePoints * (ageCoeff - 1));
        ageAdjustment = adjustment;
        totalPoints += adjustment;
      }

      // 4. 连续完成奖励
      const streakDays = await this.getUserStreakDays(userId, activityType);
      let streakMultiplier = 1.0;
      
      for (const [days, multiplier] of Object.entries(this.STREAK_BONUS).reverse()) {
        if (streakDays >= parseInt(days)) {
          streakMultiplier = multiplier;
          break;
        }
      }
      
      if (streakMultiplier > 1.0) {
        const bonus = Math.round(basePoints * (streakMultiplier - 1));
        streakBonus = bonus;
        totalPoints += bonus;
      }

      // 5. 表现奖励
      let performanceMultiplier = 1.0;
      
      // 准确率奖励
      if (taskData.accuracy !== undefined) {
        if (taskData.accuracy >= 0.95) {
          performanceMultiplier += 0.3; // 95%以上准确率 +30%
        } else if (taskData.accuracy >= 0.85) {
          performanceMultiplier += 0.2; // 85%以上准确率 +20%
        } else if (taskData.accuracy >= 0.75) {
          performanceMultiplier += 0.1; // 75%以上准确率 +10%
        }
      }

      // 提前完成奖励
      if (taskData.completedAheadOfSchedule) {
        performanceMultiplier += 0.2; // 提前完成 +20%
      }

      // 额外努力奖励
      if (taskData.extraEffort) {
        performanceMultiplier += 0.15; // 额外努力 +15%
      }

      // 超长时间投入奖励（对于学习类任务）
      if (taskData.duration && taskData.duration >= 60) {
        performanceMultiplier += 0.1; // 超过1小时投入 +10%
      }

      // 字数奖励（对于写作类任务）
      if (taskData.wordCount) {
        if (taskData.wordCount >= 500) {
          performanceMultiplier += 0.2; // 500字以上 +20%
        } else if (taskData.wordCount >= 200) {
          performanceMultiplier += 0.1; // 200字以上 +10%
        }
      }

      if (performanceMultiplier > 1.0) {
        const bonus = Math.round(basePoints * (performanceMultiplier - 1));
        performanceBonus = bonus;
        totalPoints += bonus;
      }

      // 确保最终积分不为负数
      totalPoints = Math.max(0, totalPoints);

      return {
        basePoints,
        difficultyBonus,
        qualityBonus,
        ageAdjustment,
        streakBonus,
        performanceBonus,
        totalPoints,
        breakdown: {
          difficulty: difficultyBonus,
          quality: qualityBonus,
          age: ageAdjustment,
          streak: streakBonus,
          performance: performanceBonus,
        },
      };
    } catch (error) {
      console.error('积分校准计算失败:', error);
      // 返回基础积分作为后备
      return {
        basePoints,
        difficultyBonus: 0,
        qualityBonus: 0,
        ageAdjustment: 0,
        streakBonus: 0,
        performanceBonus: 0,
        totalPoints: basePoints,
        breakdown: {
          difficulty: 0,
          quality: 0,
          age: 0,
          streak: 0,
          performance: 0,
        },
      };
    }
  }

  /**
   * 自动调整积分规则基于历史数据分析
   * @param activityType 活动类型
   */
  static async autoAdjustPointsRule(activityType: string): Promise<{
    originalRule: PointsRule | null;
    suggestedChanges: {
      basePoints?: number;
      dailyLimit?: number;
      multipliers?: any;
      reason: string;
    };
    statistics: {
      totalCompletions: number;
      avgPointsPerCompletion: number;
      completionRate: number;
      userEngagement: 'low' | 'medium' | 'high';
    };
  }> {
    try {
      // 获取当前规则
      const currentRule = await collections.pointsRules.findOne({
        activity: activityType,
        isActive: true,
      });

      // 分析过去30天的数据
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

      const completedTasks = await collections.dailyTasks.find({
        'metadata.activityType': activityType,
        status: 'completed',
        date: { $gte: thirtyDaysAgoStr },
      }).toArray();

      const totalCompletions = completedTasks.length;
      const avgPointsPerCompletion = totalCompletions > 0 
        ? completedTasks.reduce((sum, task) => sum + (task.pointsEarned || 0), 0) / totalCompletions
        : 0;

      // 计算完成率（相对于计划的任务）
      const plannedTasks = await collections.dailyTasks.find({
        'metadata.activityType': activityType,
        date: { $gte: thirtyDaysAgoStr },
      }).toArray();
      
      const completionRate = plannedTasks.length > 0 
        ? (totalCompletions / plannedTasks.length) * 100
        : 0;

      // 评估用户参与度
      let userEngagement: 'low' | 'medium' | 'high' = 'medium';
      if (completionRate < 40) {
        userEngagement = 'low';
      } else if (completionRate > 70) {
        userEngagement = 'high';
      }

      // 生成调整建议
      const suggestedChanges: any = {
        reason: '',
      };

      if (userEngagement === 'low') {
        // 参与度低：增加基础积分或降低难度
        if (currentRule) {
          suggestedChanges.basePoints = Math.ceil(currentRule.basePoints * 1.2);
          suggestedChanges.reason = '参与度较低，建议增加基础积分20%以提高激励效果';
        }
      } else if (userEngagement === 'high' && avgPointsPerCompletion > 10) {
        // 参与度高但积分过多：适度降低积分或增加挑战
        if (currentRule) {
          suggestedChanges.basePoints = Math.max(1, Math.floor(currentRule.basePoints * 0.9));
          suggestedChanges.reason = '参与度高且积分充足，建议减少基础积分10%并增加挑战性';
        }
      }

      // 根据完成率调整每日限制
      if (completionRate > 90 && currentRule?.dailyLimit) {
        suggestedChanges.dailyLimit = Math.ceil(currentRule.dailyLimit * 1.1);
        suggestedChanges.reason += (suggestedChanges.reason ? '；' : '') + '完成率很高，建议增加每日限制10%';
      } else if (completionRate < 30 && currentRule?.dailyLimit && currentRule.dailyLimit > 1) {
        suggestedChanges.dailyLimit = Math.max(1, Math.floor(currentRule.dailyLimit * 0.8));
        suggestedChanges.reason += (suggestedChanges.reason ? '；' : '') + '完成率较低，建议降低每日限制20%';
      }

      if (!suggestedChanges.reason) {
        suggestedChanges.reason = '当前积分规则表现良好，无需调整';
      }

      return {
        originalRule: currentRule,
        suggestedChanges,
        statistics: {
          totalCompletions,
          avgPointsPerCompletion: Math.round(avgPointsPerCompletion * 10) / 10,
          completionRate: Math.round(completionRate * 10) / 10,
          userEngagement,
        },
      };
    } catch (error) {
      console.error('自动调整积分规则失败:', error);
      throw new Error(`自动调整积分规则失败: ${error.message}`);
    }
  }

  /**
   * 获取积分系统整体平衡分析
   */
  static async getPointsSystemBalance(): Promise<{
    overallBalance: 'undervalued' | 'balanced' | 'overvalued';
    recommendations: string[];
    statistics: {
      totalActiveUsers: number;
      avgDailyPointsPerUser: number;
      topActivities: { activity: string; completions: number; avgPoints: number }[];
      engagementTrends: { week: string; completions: number; avgPoints: number }[];
    };
  }> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

      // 获取活跃用户数
      const activeUserIds = await collections.dailyTasks.distinct('userId', {
        date: { $gte: thirtyDaysAgoStr },
        status: 'completed',
      });

      const totalActiveUsers = activeUserIds.length;

      // 计算平均每日积分
      const userPointsLimits = await collections.userPointsLimits.find({
        date: { $gte: thirtyDaysAgoStr },
      }).toArray();

      const avgDailyPointsPerUser = userPointsLimits.length > 0
        ? userPointsLimits.reduce((sum, limit) => sum + (limit.totalDailyPoints || 0), 0) / userPointsLimits.length
        : 0;

      // 获取热门活动统计
      const activityStats = await collections.dailyTasks.aggregate([
        {
          $match: {
            date: { $gte: thirtyDaysAgoStr },
            status: 'completed',
            'metadata.activityType': { $exists: true },
          }
        },
        {
          $group: {
            _id: '$metadata.activityType',
            completions: { $sum: 1 },
            totalPoints: { $sum: '$pointsEarned' },
            avgPoints: { $avg: '$pointsEarned' },
          }
        },
        {
          $sort: { completions: -1 }
        },
        {
          $limit: 5
        }
      ]).toArray();

      const topActivities = activityStats.map(stat => ({
        activity: stat._id,
        completions: stat.completions,
        avgPoints: Math.round(stat.avgPoints * 10) / 10,
      }));

      // 获取每周趋势
      const engagementTrends: { week: string; completions: number; avgPoints: number }[] = [];
      for (let i = 4; i >= 0; i--) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (i * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        const weekStartStr = weekStart.toISOString().split('T')[0];
        const weekEndStr = weekEnd.toISOString().split('T')[0];
        
        const weekTasks = await collections.dailyTasks.find({
          date: { $gte: weekStartStr, $lte: weekEndStr },
          status: 'completed',
        }).toArray();
        
        const weekCompletions = weekTasks.length;
        const weekAvgPoints = weekTasks.length > 0
          ? weekTasks.reduce((sum, task) => sum + (task.pointsEarned || 0), 0) / weekTasks.length
          : 0;
        
        engagementTrends.push({
          week: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
          completions: weekCompletions,
          avgPoints: Math.round(weekAvgPoints * 10) / 10,
        });
      }

      // 分析整体平衡
      let overallBalance: 'undervalued' | 'balanced' | 'overvalued' = 'balanced';
      const recommendations: string[] = [];

      if (avgDailyPointsPerUser < 3) {
        overallBalance = 'undervalued';
        recommendations.push('积分奖励偏低，建议增加基础积分或奖励频率');
        recommendations.push('考虑增加更多简单易完成的任务');
      } else if (avgDailyPointsPerUser > 15) {
        overallBalance = 'overvalued';
        recommendations.push('积分奖励偏高，建议适度降低积分或增加任务难度');
        recommendations.push('考虑增加积分消费渠道');
      }

      if (totalActiveUsers < 5) {
        recommendations.push('用户参与度较低，建议优化任务设计和奖励机制');
      }

      // 检查活动平衡
      const topActivity = topActivities[0];
      if (topActivity && topActivity.completions > totalActiveUsers * 5) {
        recommendations.push(`"${topActivity.activity}"活动过于热门，建议平衡其他活动的吸引力`);
      }

      if (recommendations.length === 0) {
        recommendations.push('积分系统整体平衡良好，继续保持当前配置');
      }

      return {
        overallBalance,
        recommendations,
        statistics: {
          totalActiveUsers,
          avgDailyPointsPerUser: Math.round(avgDailyPointsPerUser * 10) / 10,
          topActivities,
          engagementTrends,
        },
      };
    } catch (error) {
      console.error('获取积分系统平衡分析失败:', error);
      throw new Error(`获取积分系统平衡分析失败: ${error.message}`);
    }
  }
}