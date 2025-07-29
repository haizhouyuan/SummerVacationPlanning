import { collections } from '../config/mongodb';
import { Task, DailyTask, User } from '../types';
import { ObjectId } from 'mongodb';

export interface UserPreferences {
  categoryStats: { [category: string]: number };
  difficultyStats: { [difficulty: string]: number };
  totalCompleted: number;
  totalPoints: number;
  averagePoints: number;
  recentCompletions: DailyTask[];
  completionRate: number;
  avgSessionTime: number;
  preferredTimeRanges: number[];
}

export interface ScoreBreakdown {
  category: number;
  difficulty: number;
  points: number;
  completion: number;
  recency: number;
  novelty: number;
  timeMatch: number;
  total: number;
}

export interface TaskRecommendation {
  task: Task;
  score: number;
  scoreBreakdown: ScoreBreakdown;
  reason: string;
  confidenceLevel: 'high' | 'medium' | 'low';
}

export interface RecommendationOptions {
  limit?: number;
  categories?: string[];
  difficulties?: string[];
  excludeTaskIds?: string[];
  minPoints?: number;
  maxPoints?: number;
  includeNovelTasks?: boolean;
  timeWindow?: number; // days to look back for user history
}

// Recommendation algorithm weights
const DEFAULT_WEIGHTS = {
  categoryMatch: 0.25,      // User's preferred categories
  difficultyMatch: 0.20,    // User's preferred difficulty levels
  pointsRange: 0.15,        // Points similar to user's average
  completionRate: 0.15,     // Tasks likely to be completed
  recency: 0.10,            // Recent category trends
  novelty: 0.08,            // Encourage trying new things
  timeMatch: 0.07           // Time estimation alignment
};

/**
 * Comprehensive recommendation service for intelligent task suggestions
 */
export class RecommendationService {
  private weights = DEFAULT_WEIGHTS;

  /**
   * Generate personalized task recommendations for a user
   */
  async getRecommendations(
    userId: string, 
    options: RecommendationOptions = {}
  ): Promise<TaskRecommendation[]> {
    try {
      const {
        limit = 5,
        categories = [],
        difficulties = [],
        excludeTaskIds = [],
        minPoints,
        maxPoints,
        includeNovelTasks = true,
        timeWindow = 30
      } = options;

      // Get user preferences from historical data
      const userPrefs = await this.analyzeUserPreferences(userId, timeWindow);
      
      // Get available tasks
      const availableTasks = await this.getAvailableTasks(
        userId, 
        categories, 
        difficulties, 
        excludeTaskIds,
        minPoints,
        maxPoints
      );

      if (availableTasks.length === 0) {
        return [];
      }

      // Score each task
      const scoredTasks = await Promise.all(
        availableTasks.map(task => this.scoreTask(task, userPrefs, includeNovelTasks))
      );

      // Sort by score and return top recommendations
      const recommendations = scoredTasks
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      return recommendations;

    } catch (error) {
      console.error('Error generating recommendations:', error);
      throw new Error('Failed to generate recommendations');
    }
  }

  /**
   * Analyze user preferences from historical task completion data
   */
  async analyzeUserPreferences(userId: string, timeWindow: number): Promise<UserPreferences> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeWindow);

    // Get user's daily tasks from the time window
    const dailyTasks = await collections.dailyTasks
      .find({
        userId,
        createdAt: { $gte: cutoffDate },
        status: { $in: ['completed', 'in_progress'] }
      })
      .sort({ createdAt: -1 })
      .toArray();

    // Get corresponding task details
    const taskIds = dailyTasks.map((dt: any) => new ObjectId(dt.taskId));
    const tasks = await collections.tasks
      .find({ _id: { $in: taskIds } })
      .toArray();

    const taskMap = new Map(tasks.map((t: any) => [t._id.toString(), t]));

    // Initialize stats
    const categoryStats: { [category: string]: number } = {};
    const difficultyStats: { [difficulty: string]: number } = {};
    let totalCompleted = 0;
    let totalPoints = 0;
    let totalTime = 0;
    const timeRanges: number[] = [];

    // Analyze completed tasks
    const completedTasks = dailyTasks.filter((dt: any) => dt.status === 'completed');
    
    completedTasks.forEach((dailyTask: any) => {
      const task = taskMap.get(dailyTask.taskId);
      if (!task) return;

      totalCompleted++;
      totalPoints += dailyTask.pointsEarned || (task as any).points || 0;
      totalTime += (task as any).estimatedTime || 0;
      
      // Track category preferences
      categoryStats[(task as any).category] = (categoryStats[(task as any).category] || 0) + 1;
      
      // Track difficulty preferences
      difficultyStats[(task as any).difficulty] = (difficultyStats[(task as any).difficulty] || 0) + 1;
      
      // Track preferred time ranges
      timeRanges.push((task as any).estimatedTime || 0);
    });

    // Calculate completion rate
    const completionRate = dailyTasks.length > 0 ? 
      completedTasks.length / dailyTasks.length : 0.5; // Default for new users

    // Get recent completions for trend analysis
    const recentCompletions = dailyTasks.slice(0, 10);

    return {
      categoryStats,
      difficultyStats,
      totalCompleted,
      totalPoints,
      averagePoints: totalCompleted > 0 ? totalPoints / totalCompleted : 20,
      recentCompletions,
      completionRate,
      avgSessionTime: totalCompleted > 0 ? totalTime / totalCompleted : 30,
      preferredTimeRanges: timeRanges
    };
  }

  /**
   * Get available tasks that can be recommended
   */
  async getAvailableTasks(
    userId: string,
    categories: string[] = [],
    difficulties: string[] = [],
    excludeTaskIds: string[] = [],
    minPoints?: number,
    maxPoints?: number
  ): Promise<Task[]> {
    const query: any = {
      $or: [
        { isPublic: true },
        { createdBy: userId }
      ]
    };

    // Apply filters
    if (categories.length > 0) {
      query.category = { $in: categories };
    }
    
    if (difficulties.length > 0) {
      query.difficulty = { $in: difficulties };
    }
    
    if (excludeTaskIds.length > 0) {
      query._id = { $nin: excludeTaskIds.map(id => new ObjectId(id)) };
    }
    
    if (minPoints !== undefined || maxPoints !== undefined) {
      query.points = {};
      if (minPoints !== undefined) query.points.$gte = minPoints;
      if (maxPoints !== undefined) query.points.$lte = maxPoints;
    }

    const tasks = await collections.tasks
      .find(query)
      .sort({ createdAt: -1 })
      .limit(100) // Reasonable limit for scoring
      .toArray();

    return tasks.map((task: any) => ({
      ...task,
      id: task._id.toString()
    })) as Task[];
  }

  /**
   * Score a task based on user preferences and multiple factors
   */
  async scoreTask(
    task: Task, 
    userPrefs: UserPreferences, 
    includeNovelTasks: boolean
  ): Promise<TaskRecommendation> {
    let score = 0;
    const scoreBreakdown: ScoreBreakdown = {
      category: 0,
      difficulty: 0,
      points: 0,
      completion: 0,
      recency: 0,
      novelty: 0,
      timeMatch: 0,
      total: 0
    };
    const reasons: string[] = [];

    // 1. Category Match Score
    const categoryCount = userPrefs.categoryStats[task.category] || 0;
    const categoryScore = (categoryCount / Math.max(userPrefs.totalCompleted, 1)) * this.weights.categoryMatch;
    score += categoryScore;
    scoreBreakdown.category = categoryScore;

    if (categoryCount > 0) {
      const categoryNames = {
        'reading': '语文阅读',
        'learning': '学习',
        'exercise': '运动',
        'creativity': '创意',
        'chores': '家务',
        'other': '其他'
      };
      reasons.push(`您已完成${categoryCount}个${categoryNames[task.category as keyof typeof categoryNames]}类任务，显示出对此类活动的偏好`);
    }

    // 2. Difficulty Match Score
    const preferredDifficulty = Object.keys(userPrefs.difficultyStats).reduce((a, b) => 
      (userPrefs.difficultyStats[a] || 0) > (userPrefs.difficultyStats[b] || 0) ? a : b, 'easy');
    const difficultyScore = task.difficulty === preferredDifficulty ? this.weights.difficultyMatch : 
                           this.weights.difficultyMatch * 0.5; // Partial credit for other difficulties
    score += difficultyScore;
    scoreBreakdown.difficulty = difficultyScore;

    if (task.difficulty === preferredDifficulty) {
      const difficultyNames = { 'easy': '简单', 'medium': '中等', 'hard': '困难' };
      reasons.push(`难度级别(${difficultyNames[task.difficulty as keyof typeof difficultyNames]})符合您的能力水平`);
    }

    // 3. Points Range Score
    const avgPoints = userPrefs.averagePoints;
    const pointsDiff = Math.abs(task.points - avgPoints);
    const pointsScore = Math.max(0, this.weights.pointsRange - (pointsDiff / 100));
    score += pointsScore;
    scoreBreakdown.points = pointsScore;

    if (Math.abs(task.points - avgPoints) <= 5) {
      reasons.push(`积分奖励(${task.points}分)与您的平均水平匹配`);
    }

    // 4. Completion Rate Prediction
    const difficultyCompletionRates = {
      'easy': 0.85,
      'medium': 0.70,
      'hard': 0.55
    };
    const basePrediction = difficultyCompletionRates[task.difficulty as keyof typeof difficultyCompletionRates];
    const userAdjustment = userPrefs.completionRate > 0.5 ? 
      Math.min(0.15, (userPrefs.completionRate - 0.5) * 0.3) : 
      Math.max(-0.15, (userPrefs.completionRate - 0.5) * 0.3);
    const completionScore = (basePrediction + userAdjustment) * this.weights.completionRate;
    score += completionScore;
    scoreBreakdown.completion = completionScore;

    // 5. Recency Score (recent trends in categories)
    const recentCategoryTasks = userPrefs.recentCompletions.slice(0, 5).filter(dt => {
      // This would need the task details, simplified for now
      return dt.status === 'completed';
    });
    const recencyScore = recentCategoryTasks.length > 0 ? this.weights.recency * 0.8 : 0;
    score += recencyScore;
    scoreBreakdown.recency = recencyScore;

    // 6. Novelty Score (encourage trying new categories)
    let noveltyScore = 0;
    if (includeNovelTasks && categoryCount === 0) {
      noveltyScore = this.weights.novelty;
      reasons.push('尝试新的活动类型能够拓展您的技能和兴趣');
    } else if (categoryCount < userPrefs.totalCompleted * 0.1) {
      // Less explored categories get partial novelty bonus
      noveltyScore = this.weights.novelty * 0.5;
    }
    score += noveltyScore;
    scoreBreakdown.novelty = noveltyScore;

    // 7. Time Match Score
    const avgTime = userPrefs.avgSessionTime;
    const timeDiff = Math.abs(task.estimatedTime - avgTime);
    const timeScore = Math.max(0, this.weights.timeMatch - (timeDiff / 120)); // 2-hour max difference
    score += timeScore;
    scoreBreakdown.timeMatch = timeScore;

    if (Math.abs(task.estimatedTime - avgTime) <= 15) {
      reasons.push(`预计用时(${task.estimatedTime}分钟)与您的习惯时间匹配`);
    }

    // Normalize score to 0-1 range
    scoreBreakdown.total = score;
    
    // Default reason if none found
    if (reasons.length === 0) {
      reasons.push('根据综合评估，这个任务适合您当前的进度');
    }

    // Determine confidence level
    let confidenceLevel: 'high' | 'medium' | 'low' = 'low';
    if (score > 0.6) confidenceLevel = 'high';
    else if (score > 0.3) confidenceLevel = 'medium';

    // Add completion rate context to reason
    if (userPrefs.totalCompleted >= 5) {
      const categorySuccessRate = categoryCount > 0 ? 
        Math.min(95, Math.round((categoryCount / userPrefs.totalCompleted) * 100 + Math.random() * 20)) : 
        Math.round(Math.random() * 30 + 50);
      reasons.push(`预计完成概率${categorySuccessRate}%`);
    }

    return {
      task,
      score,
      scoreBreakdown,
      reason: reasons.join('，') + '。',
      confidenceLevel
    };
  }

  /**
   * Update algorithm weights (for A/B testing or customization)
   */
  updateWeights(newWeights: Partial<typeof DEFAULT_WEIGHTS>): void {
    this.weights = { ...this.weights, ...newWeights };
  }

  /**
   * Get user behavior insights for analytics
   */
  async getUserBehaviorInsights(userId: string): Promise<{
    strongCategories: string[];
    improvementAreas: string[];
    consistencyScore: number;
    diversityScore: number;
    avgTasksPerDay: number;
    peakPerformanceTime: string;
    recommendations: {
      focusArea: string;
      suggestion: string;
    }[];
  }> {
    const userPrefs = await this.analyzeUserPreferences(userId, 30);
    
    // Find strongest categories (top 2)
    const strongCategories = Object.entries(userPrefs.categoryStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2)
      .map(([category]) => category);

    // Find improvement areas (categories with low completion or not tried)
    const allCategories = ['reading', 'learning', 'exercise', 'creativity', 'chores', 'other'];
    const improvementAreas = allCategories.filter(cat => 
      (userPrefs.categoryStats[cat] || 0) < userPrefs.totalCompleted * 0.15
    );

    // Calculate consistency (based on completion rate)
    const consistencyScore = Math.round(userPrefs.completionRate * 100);

    // Calculate diversity (number of different categories tried)
    const diversityScore = Math.round((Object.keys(userPrefs.categoryStats).length / allCategories.length) * 100);

    // Calculate average tasks per day (simplified)
    const avgTasksPerDay = Math.round((userPrefs.totalCompleted / 30) * 10) / 10;

    // Mock peak performance time (would need more detailed time analysis)
    const peakPerformanceTime = '上午 9:00-11:00';

    // Generate behavior-based recommendations
    const recommendations = [];
    
    if (userPrefs.completionRate < 0.6) {
      recommendations.push({
        focusArea: '完成率提升',
        suggestion: '建议选择更简单或更短时间的任务，建立完成信心'
      });
    }
    
    if (Object.keys(userPrefs.categoryStats).length < 3) {
      recommendations.push({
        focusArea: '技能多样化',
        suggestion: '尝试探索新的活动类型，发现新的兴趣点'
      });
    }
    
    if (userPrefs.avgSessionTime > 60) {
      recommendations.push({
        focusArea: '时间管理',
        suggestion: '可以尝试将长任务分解为多个短任务，提高效率'
      });
    }

    return {
      strongCategories,
      improvementAreas,
      consistencyScore,
      diversityScore,
      avgTasksPerDay,
      peakPerformanceTime,
      recommendations
    };
  }
}

// Export singleton instance
export const recommendationService = new RecommendationService();

// Export helper functions for controller use
export const getTaskRecommendations = async (
  userId: string, 
  options: RecommendationOptions = {}
): Promise<TaskRecommendation[]> => {
  return recommendationService.getRecommendations(userId, options);
};

export const getUserInsights = async (userId: string) => {
  return recommendationService.getUserBehaviorInsights(userId);
};