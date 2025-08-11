/**
 * 积分计算系统单元测试
 * 测试可配置积分计算逻辑、奖励规则、乘数效果等
 */

import { calculateConfigurablePoints } from '../controllers/pointsConfigController';
import { collections } from '../config/mongodb';

// Mock MongoDB collections
jest.mock('../config/mongodb', () => ({
  collections: {
    pointsRules: {
      findOne: jest.fn(),
    },
  },
}));

describe('积分计算系统测试', () => {
  const mockCollections = collections as jest.Mocked<typeof collections>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateConfigurablePoints 基础功能', () => {
    it('当找不到积分规则时，应该返回默认积分', async () => {
      mockCollections.pointsRules.findOne.mockResolvedValue(null);

      const result = await calculateConfigurablePoints(
        'reading',
        'general',
        { duration: 30 }
      );

      expect(result).toEqual({
        basePoints: 1,
        bonusPoints: 0,
        totalPoints: 1,
      });
    });

    it('应该正确返回基础积分', async () => {
      const mockRule = {
        category: 'reading',
        activity: 'general',
        basePoints: 10,
        bonusRules: [],
        isActive: true,
      };

      mockCollections.pointsRules.findOne.mockResolvedValue(mockRule);

      const result = await calculateConfigurablePoints(
        'reading',
        'general',
        { duration: 30 }
      );

      expect(result).toEqual({
        basePoints: 10,
        bonusPoints: 0,
        totalPoints: 10,
      });
    });

    it('应该正确应用字数奖励规则', async () => {
      const mockRule = {
        category: 'reading',
        activity: 'diary',
        basePoints: 5,
        bonusRules: [
          {
            type: 'word_count',
            threshold: 100,
            bonusPoints: 2,
            maxBonus: 10,
          }
        ],
        isActive: true,
      };

      mockCollections.pointsRules.findOne.mockResolvedValue(mockRule);

      const result = await calculateConfigurablePoints(
        'reading',
        'diary',
        { wordCount: 250 } // 250字应该获得4分奖励 (2 * 2)
      );

      expect(result).toEqual({
        basePoints: 5,
        bonusPoints: 4, // floor(250/100) * 2 = 2 * 2 = 4
        totalPoints: 9,
      });
    });

    it('应该正确应用时长奖励规则', async () => {
      const mockRule = {
        category: 'exercise',
        activity: 'general_exercise',
        basePoints: 8,
        bonusRules: [
          {
            type: 'duration',
            threshold: 15,
            bonusPoints: 1,
            maxBonus: 5,
          }
        ],
        isActive: true,
      };

      mockCollections.pointsRules.findOne.mockResolvedValue(mockRule);

      const result = await calculateConfigurablePoints(
        'exercise',
        'general_exercise',
        { duration: 45 } // 45分钟应该获得3分奖励 (floor(45/15) * 1)
      );

      expect(result).toEqual({
        basePoints: 8,
        bonusPoints: 3,
        totalPoints: 11,
      });
    });

    it('应该限制奖励积分的最大值', async () => {
      const mockRule = {
        category: 'reading',
        activity: 'diary',
        basePoints: 5,
        bonusRules: [
          {
            type: 'word_count',
            threshold: 50,
            bonusPoints: 2,
            maxBonus: 6, // 最大6分奖励
          }
        ],
        isActive: true,
      };

      mockCollections.pointsRules.findOne.mockResolvedValue(mockRule);

      const result = await calculateConfigurablePoints(
        'reading',
        'diary',
        { wordCount: 500 } // 应该获得20分奖励，但被限制为6分
      );

      expect(result).toEqual({
        basePoints: 5,
        bonusPoints: 6, // 被限制在maxBonus
        totalPoints: 11,
      });
    });

    it('应该应用质量奖励', async () => {
      const mockRule = {
        category: 'learning',
        activity: 'math_video',
        basePoints: 6,
        bonusRules: [
          {
            type: 'quality',
            threshold: 1,
            bonusPoints: 3,
          }
        ],
        isActive: true,
      };

      mockCollections.pointsRules.findOne.mockResolvedValue(mockRule);

      const result = await calculateConfigurablePoints(
        'learning',
        'math_video',
        { quality: 'excellent' }
      );

      expect(result).toEqual({
        basePoints: 6,
        bonusPoints: 3,
        totalPoints: 9,
      });
    });
  });

  describe('乘数效果测试', () => {
    it('应该应用难度乘数', async () => {
      const mockRule = {
        category: 'learning',
        activity: 'olympiad_problem',
        basePoints: 10,
        bonusRules: [],
        multipliers: {
          difficulty: {
            easy: 1.0,
            medium: 1.2,
            hard: 1.5,
          }
        },
        isActive: true,
      };

      mockCollections.pointsRules.findOne.mockResolvedValue(mockRule);

      const result = await calculateConfigurablePoints(
        'learning',
        'olympiad_problem',
        { difficulty: 'hard' }
      );

      expect(result).toEqual({
        basePoints: 10,
        bonusPoints: 0,
        totalPoints: 15, // 10 * 1.5 = 15
      });
    });

    it('应该应用质量乘数', async () => {
      const mockRule = {
        category: 'creativity',
        activity: 'music_practice',
        basePoints: 8,
        bonusRules: [],
        multipliers: {
          quality: {
            normal: 1.0,
            good: 1.1,
            excellent: 1.3,
          }
        },
        isActive: true,
      };

      mockCollections.pointsRules.findOne.mockResolvedValue(mockRule);

      const result = await calculateConfigurablePoints(
        'creativity',
        'music_practice',
        { quality: 'excellent' }
      );

      expect(result).toEqual({
        basePoints: 8,
        bonusPoints: 0,
        totalPoints: 10, // Math.round(8 * 1.3) = 10
      });
    });

    it('应该应用奖章乘数', async () => {
      const mockRule = {
        category: 'exercise',
        activity: 'general_exercise',
        basePoints: 10,
        bonusRules: [],
        multipliers: {
          medal: {
            bronze: 1.1,
            silver: 1.2,
            gold: 1.3,
            diamond: 1.4,
          }
        },
        isActive: true,
      };

      mockCollections.pointsRules.findOne.mockResolvedValue(mockRule);

      const userMedals = {
        bronze: true,
        silver: true,
        gold: false,
        diamond: false,
      };

      const result = await calculateConfigurablePoints(
        'exercise',
        'general_exercise',
        { duration: 30 },
        userMedals
      );

      expect(result).toEqual({
        basePoints: 10,
        bonusPoints: 0,
        totalPoints: 13, // Math.round(10 * 1.1 * 1.2) = 13
      });
    });

    it('应该应用多个乘数的组合效果', async () => {
      const mockRule = {
        category: 'reading',
        activity: 'diary',
        basePoints: 5,
        bonusRules: [
          {
            type: 'word_count',
            threshold: 100,
            bonusPoints: 2,
          }
        ],
        multipliers: {
          difficulty: {
            medium: 1.2,
          },
          quality: {
            excellent: 1.3,
          },
          medal: {
            gold: 1.3,
          }
        },
        isActive: true,
      };

      mockCollections.pointsRules.findOne.mockResolvedValue(mockRule);

      const userMedals = {
        bronze: false,
        silver: false,
        gold: true,
        diamond: false,
      };

      const result = await calculateConfigurablePoints(
        'reading',
        'diary',
        {
          wordCount: 200, // +4 bonus points
          difficulty: 'medium', // 1.2x
          quality: 'excellent' // 1.3x
        },
        userMedals // 1.3x gold medal
      );

      // 计算过程：
      // base + bonus = 5 + 4 = 9
      // 应用乘数: 9 * 1.2 * 1.3 * 1.3 = 18.252 -> Math.round = 18
      expect(result.totalPoints).toBe(18);
    });
  });

  describe('错误处理测试', () => {
    it('当数据库查询失败时，应该返回默认积分', async () => {
      mockCollections.pointsRules.findOne.mockRejectedValue(new Error('Database error'));

      const result = await calculateConfigurablePoints(
        'reading',
        'general',
        { duration: 30 }
      );

      expect(result).toEqual({
        basePoints: 1,
        bonusPoints: 0,
        totalPoints: 1,
      });
    });

    it('应该处理无效的乘数数据', async () => {
      const mockRule = {
        category: 'learning',
        activity: 'math_video',
        basePoints: 10,
        bonusRules: [],
        multipliers: {
          difficulty: {
            // missing 'easy' difficulty
          }
        },
        isActive: true,
      };

      mockCollections.pointsRules.findOne.mockResolvedValue(mockRule);

      const result = await calculateConfigurablePoints(
        'learning',
        'math_video',
        { difficulty: 'easy' } // 不存在的难度，应该默认为1
      );

      expect(result).toEqual({
        basePoints: 10,
        bonusPoints: 0,
        totalPoints: 10, // 10 * 1 = 10
      });
    });

    it('应该处理空的奖励规则', async () => {
      const mockRule = {
        category: 'reading',
        activity: 'general',
        basePoints: 8,
        bonusRules: null,
        isActive: true,
      };

      mockCollections.pointsRules.findOne.mockResolvedValue(mockRule);

      const result = await calculateConfigurablePoints(
        'reading',
        'general',
        { wordCount: 200 }
      );

      expect(result).toEqual({
        basePoints: 8,
        bonusPoints: 0,
        totalPoints: 8,
      });
    });
  });

  describe('边界情况测试', () => {
    it('应该处理零基础积分', async () => {
      const mockRule = {
        category: 'other',
        activity: 'general',
        basePoints: 0,
        bonusRules: [
          {
            type: 'duration',
            threshold: 10,
            bonusPoints: 1,
          }
        ],
        isActive: true,
      };

      mockCollections.pointsRules.findOne.mockResolvedValue(mockRule);

      const result = await calculateConfigurablePoints(
        'other',
        'general',
        { duration: 25 }
      );

      expect(result).toEqual({
        basePoints: 0,
        bonusPoints: 2, // floor(25/10) = 2
        totalPoints: 2,
      });
    });

    it('应该正确处理刚好达到阈值的情况', async () => {
      const mockRule = {
        category: 'reading',
        activity: 'diary',
        basePoints: 5,
        bonusRules: [
          {
            type: 'word_count',
            threshold: 100,
            bonusPoints: 3,
          }
        ],
        isActive: true,
      };

      mockCollections.pointsRules.findOne.mockResolvedValue(mockRule);

      const result = await calculateConfigurablePoints(
        'reading',
        'diary',
        { wordCount: 100 } // 刚好100字
      );

      expect(result).toEqual({
        basePoints: 5,
        bonusPoints: 3, // floor(100/100) * 3 = 3
        totalPoints: 8,
      });
    });

    it('应该处理超大数值的输入', async () => {
      const mockRule = {
        category: 'exercise',
        activity: 'general_exercise',
        basePoints: 5,
        bonusRules: [
          {
            type: 'duration',
            threshold: 10,
            bonusPoints: 1,
            maxBonus: 20, // 最大奖励20分
          }
        ],
        isActive: true,
      };

      mockCollections.pointsRules.findOne.mockResolvedValue(mockRule);

      const result = await calculateConfigurablePoints(
        'exercise',
        'general_exercise',
        { duration: 10000 } // 10000分钟
      );

      expect(result).toEqual({
        basePoints: 5,
        bonusPoints: 20, // 被限制在maxBonus
        totalPoints: 25,
      });
    });
  });
});