import { Response } from 'express';
import { collections } from '../config/mongodb';
import { PointsRule, GameTimeConfig, UserPointsLimit, DailyTask, Task } from '../types';
import { AuthRequest } from '../middleware/mongoAuth';
import { ObjectId } from 'mongodb';

/**
 * Create or update a points rule
 */
export const createPointsRule = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    // Only parents can create/modify points rules
    if (req.user.role !== 'parent') {
      return res.status(403).json({
        success: false,
        error: 'Only parents can manage points rules',
      });
    }

    const {
      category,
      activity,
      basePoints,
      bonusRules,
      dailyLimit,
      multipliers,
      isActive = true,
    } = req.body;

    // Validate required fields
    if (!category || !activity || basePoints === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Category, activity, and base points are required',
      });
    }

    const pointsRuleData: Omit<PointsRule, 'id'> = {
      category,
      activity,
      basePoints,
      bonusRules: bonusRules || [],
      dailyLimit,
      multipliers,
      isActive,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collections.pointsRules.insertOne(pointsRuleData);
    const pointsRule = { ...pointsRuleData, id: result.insertedId.toString() };

    res.status(201).json({
      success: true,
      data: { pointsRule },
      message: 'Points rule created successfully',
    });
  } catch (error: any) {
    console.error('Create points rule error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create points rule',
    });
  }
};

/**
 * Get all active points rules
 */
export const getPointsRules = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { category, isActive = 'true' } = req.query;
    
    let query: any = {};
    if (category) {
      query.category = category;
    }
    if (isActive !== 'all') {
      query.isActive = isActive === 'true';
    }

    const pointsRules = await collections.pointsRules
      .find(query)
      .sort({ category: 1, activity: 1 })
      .toArray();

    const rulesWithId = pointsRules.map((rule: any) => ({
      ...rule,
      id: rule._id.toString(),
    }));

    res.status(200).json({
      success: true,
      data: { pointsRules: rulesWithId },
    });
  } catch (error: any) {
    console.error('Get points rules error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get points rules',
    });
  }
};

/**
 * Update a points rule
 */
export const updatePointsRule = async (req: AuthRequest, res: Response) => {
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
        error: 'Only parents can manage points rules',
      });
    }

    const { ruleId } = req.params;
    const updates: any = { updatedAt: new Date() };

    const {
      category,
      activity,
      basePoints,
      bonusRules,
      dailyLimit,
      multipliers,
      isActive,
    } = req.body;

    if (category) updates.category = category;
    if (activity) updates.activity = activity;
    if (basePoints !== undefined) updates.basePoints = basePoints;
    if (bonusRules) updates.bonusRules = bonusRules;
    if (dailyLimit !== undefined) updates.dailyLimit = dailyLimit;
    if (multipliers) updates.multipliers = multipliers;
    if (isActive !== undefined) updates.isActive = isActive;

    await collections.pointsRules.updateOne(
      { _id: new ObjectId(ruleId) },
      { $set: updates }
    );

    const updatedRule = await collections.pointsRules.findOne({ _id: new ObjectId(ruleId) });

    res.status(200).json({
      success: true,
      data: { pointsRule: { ...updatedRule, id: updatedRule._id.toString() } },
      message: 'Points rule updated successfully',
    });
  } catch (error: any) {
    console.error('Update points rule error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update points rule',
    });
  }
};

/**
 * Create or update game time configuration
 */
export const createGameTimeConfig = async (req: AuthRequest, res: Response) => {
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
        error: 'Only parents can manage game time configuration',
      });
    }

    const {
      baseGameTimeMinutes = 30,
      pointsToMinutesRatio = 5,
      educationalGameBonus = 2,
      dailyGameTimeLimit = 120,
      freeEducationalMinutes = 20,
      weeklyAccumulationLimit = 100,
      isActive = true,
    } = req.body;

    // Deactivate existing configurations
    await collections.gameTimeConfigs.updateMany(
      { isActive: true },
      { $set: { isActive: false, updatedAt: new Date() } }
    );

    const gameTimeConfigData: Omit<GameTimeConfig, 'id'> = {
      baseGameTimeMinutes,
      pointsToMinutesRatio,
      educationalGameBonus,
      dailyGameTimeLimit,
      freeEducationalMinutes,
      weeklyAccumulationLimit,
      isActive,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collections.gameTimeConfigs.insertOne(gameTimeConfigData);
    const gameTimeConfig = { ...gameTimeConfigData, id: result.insertedId.toString() };

    res.status(201).json({
      success: true,
      data: { gameTimeConfig },
      message: 'Game time configuration created successfully',
    });
  } catch (error: any) {
    console.error('Create game time config error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create game time configuration',
    });
  }
};

/**
 * Get active game time configuration
 */
export const getGameTimeConfig = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const gameTimeConfig = await collections.gameTimeConfigs.findOne({ isActive: true });

    if (!gameTimeConfig) {
      return res.status(404).json({
        success: false,
        error: 'No active game time configuration found',
      });
    }

    res.status(200).json({
      success: true,
      data: { gameTimeConfig: { ...gameTimeConfig, id: gameTimeConfig._id.toString() } },
    });
  } catch (error: any) {
    console.error('Get game time config error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get game time configuration',
    });
  }
};

/**
 * Calculate points for a task based on configurable rules
 */
export const calculateConfigurablePoints = async (
  category: string,
  activity: string,
  baseData: {
    duration?: number;
    wordCount?: number;
    quality?: string;
    difficulty?: string;
  },
  userMedals?: { bronze: boolean; silver: boolean; gold: boolean; diamond: boolean }
): Promise<{ basePoints: number; bonusPoints: number; totalPoints: number }> => {
  try {
    // Find the matching points rule
    const pointsRule = await collections.pointsRules.findOne({
      category,
      activity,
      isActive: true,
    });

    if (!pointsRule) {
      // Fallback to default calculation if no rule found
      return {
        basePoints: 1,
        bonusPoints: 0,
        totalPoints: 1,
      };
    }

    let basePoints = pointsRule.basePoints;
    let bonusPoints = 0;

    // Apply bonus rules
    if (pointsRule.bonusRules) {
      for (const bonusRule of pointsRule.bonusRules) {
        switch (bonusRule.type) {
          case 'word_count':
            if (baseData.wordCount && baseData.wordCount >= bonusRule.threshold) {
              const bonus = Math.floor(baseData.wordCount / bonusRule.threshold) * bonusRule.bonusPoints;
              bonusPoints += bonusRule.maxBonus ? Math.min(bonus, bonusRule.maxBonus) : bonus;
            }
            break;
          case 'duration':
            if (baseData.duration && baseData.duration >= bonusRule.threshold) {
              const bonus = Math.floor(baseData.duration / bonusRule.threshold) * bonusRule.bonusPoints;
              bonusPoints += bonusRule.maxBonus ? Math.min(bonus, bonusRule.maxBonus) : bonus;
            }
            break;
          case 'quality':
            if (baseData.quality && bonusRule.threshold <= 1) {
              bonusPoints += bonusRule.bonusPoints;
            }
            break;
        }
      }
    }

    // Apply multipliers
    let totalPoints = basePoints + bonusPoints;

    if (pointsRule.multipliers) {
      // Difficulty multiplier
      if (pointsRule.multipliers.difficulty && baseData.difficulty) {
        const multiplier = pointsRule.multipliers.difficulty[baseData.difficulty] || 1;
        totalPoints = Math.round(totalPoints * multiplier);
      }

      // Quality multiplier
      if (pointsRule.multipliers.quality && baseData.quality) {
        const multiplier = pointsRule.multipliers.quality[baseData.quality] || 1;
        totalPoints = Math.round(totalPoints * multiplier);
      }

      // Medal multiplier
      if (pointsRule.multipliers.medal && userMedals) {
        let medalMultiplier = 1;
        if (userMedals.bronze) medalMultiplier *= pointsRule.multipliers.medal.bronze || 1.1;
        if (userMedals.silver) medalMultiplier *= pointsRule.multipliers.medal.silver || 1.2;
        if (userMedals.gold) medalMultiplier *= pointsRule.multipliers.medal.gold || 1.3;
        if (userMedals.diamond) medalMultiplier *= pointsRule.multipliers.medal.diamond || 1.4;
        totalPoints = Math.round(totalPoints * medalMultiplier);
      }
    }

    return {
      basePoints,
      bonusPoints,
      totalPoints,
    };
  } catch (error) {
    console.error('Calculate configurable points error:', error);
    return {
      basePoints: 1,
      bonusPoints: 0,
      totalPoints: 1,
    };
  }
};

/**
 * Check and update user daily points limit
 */
export const checkDailyPointsLimit = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { date, activity, pointsToAdd } = req.body;

    if (!date || !activity || pointsToAdd === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Date, activity, and points to add are required',
      });
    }

    const today = date || new Date().toISOString().split('T')[0];

    // Get or create user points limit for today
    let userPointsLimit = await collections.userPointsLimits.findOne({
      userId: req.user.id,
      date: today,
    });

    if (!userPointsLimit) {
      const gameTimeConfig = await collections.gameTimeConfigs.findOne({ isActive: true });
      const baseGameTime = gameTimeConfig?.baseGameTimeMinutes || 30;

      userPointsLimit = {
        userId: req.user.id,
        date: today,
        activityPoints: {},
        totalDailyPoints: 0,
        gameTimeUsed: 0,
        gameTimeAvailable: baseGameTime,
        accumulatedPoints: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await collections.userPointsLimits.insertOne(userPointsLimit);
      userPointsLimit.id = result.insertedId.toString();
    }

    // Check activity daily limit
    const pointsRule = await collections.pointsRules.findOne({
      activity,
      isActive: true,
    });

    if (pointsRule && pointsRule.dailyLimit) {
      const currentActivityPoints = userPointsLimit.activityPoints[activity] || 0;
      if (currentActivityPoints + pointsToAdd > pointsRule.dailyLimit) {
        return res.status(400).json({
          success: false,
          error: `Daily limit exceeded for ${activity}. Maximum: ${pointsRule.dailyLimit}, Current: ${currentActivityPoints}`,
          data: {
            canAdd: Math.max(0, pointsRule.dailyLimit - currentActivityPoints),
            dailyLimit: pointsRule.dailyLimit,
            current: currentActivityPoints,
          },
        });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        canAddPoints: true,
        remainingLimit: pointsRule?.dailyLimit ? pointsRule.dailyLimit - (userPointsLimit.activityPoints[activity] || 0) : null,
        currentPoints: userPointsLimit.activityPoints[activity] || 0,
      },
    });
  } catch (error: any) {
    console.error('Check daily points limit error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to check daily points limit',
    });
  }
};

/**
 * Initialize default points rules based on EarnPoints.md
 */
export const initializeDefaultPointsRules = async (req: AuthRequest, res: Response) => {
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
        error: 'Only parents can initialize points rules',
      });
    }

    // Check if rules already exist
    const existingRules = await collections.pointsRules.countDocuments();
    if (existingRules > 0) {
      return res.status(400).json({
        success: false,
        error: 'Points rules already exist. Use update endpoints to modify them.',
      });
    }

    // Default rules based on EarnPoints.md
    const defaultRules: Omit<PointsRule, 'id'>[] = [
      {
        category: 'reading',
        activity: 'diary',
        basePoints: 2,
        bonusRules: [
          {
            type: 'word_count',
            threshold: 50,
            bonusPoints: 1,
            maxBonus: 10,
          },
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        category: 'learning',
        activity: 'math_video',
        basePoints: 2,
        bonusRules: [
          {
            type: 'completion',
            threshold: 1,
            bonusPoints: 5, // Bonus for completing ahead of grade level
          },
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        category: 'learning',
        activity: 'olympiad_problem',
        basePoints: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        category: 'exercise',
        activity: 'general_exercise',
        basePoints: 0,
        bonusRules: [
          {
            type: 'duration',
            threshold: 10,
            bonusPoints: 1,
          },
        ],
        dailyLimit: 3,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        category: 'creativity',
        activity: 'programming_game',
        basePoints: 2,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        category: 'creativity',
        activity: 'diy_project_milestone',
        basePoints: 10,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        category: 'creativity',
        activity: 'diy_project_complete',
        basePoints: 50,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        category: 'other',
        activity: 'music_practice',
        basePoints: 0,
        bonusRules: [
          {
            type: 'duration',
            threshold: 15,
            bonusPoints: 1,
          },
          {
            type: 'quality',
            threshold: 1, // For excellent quality
            bonusPoints: 2,
          },
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        category: 'other',
        activity: 'chores',
        basePoints: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Insert default rules
    await collections.pointsRules.insertMany(defaultRules);

    // Create default game time configuration
    const defaultGameTimeConfig: Omit<GameTimeConfig, 'id'> = {
      baseGameTimeMinutes: 30,
      pointsToMinutesRatio: 5, // 1 point = 5 minutes
      educationalGameBonus: 2, // Educational games: 1 point = 10 minutes
      dailyGameTimeLimit: 120,
      freeEducationalMinutes: 20,
      weeklyAccumulationLimit: 100,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await collections.gameTimeConfigs.insertOne(defaultGameTimeConfig);

    res.status(201).json({
      success: true,
      message: 'Default points rules and game time configuration initialized successfully',
      data: {
        rulesCount: defaultRules.length,
        gameTimeConfig: defaultGameTimeConfig,
      },
    });
  } catch (error: any) {
    console.error('Initialize default points rules error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to initialize default points rules',
    });
  }
};