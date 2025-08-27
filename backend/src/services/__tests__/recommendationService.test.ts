import { ObjectId } from 'mongodb';
import type { UserPreferences } from '../recommendationService';
import type { Task } from '../../types';

jest.mock('../../config/mongodb', () => {
  const now = new Date();
  const dailyTasks = [
    { taskId: '000000000000000000000001', status: 'completed', pointsEarned: 10, createdAt: now },
    { taskId: '000000000000000000000002', status: 'completed', pointsEarned: 20, createdAt: now },
    { taskId: '000000000000000000000003', status: 'in_progress', pointsEarned: 0, createdAt: now },
  ];
  const analyzeTasks = [
    { _id: new ObjectId('000000000000000000000001'), category: 'reading', difficulty: 'easy', estimatedTime: 30, points: 10 },
    { _id: new ObjectId('000000000000000000000002'), category: 'learning', difficulty: 'medium', estimatedTime: 40, points: 20 },
  ];
  const availableTasks = [
    { _id: new ObjectId('000000000000000000000004'), id: '4', category: 'reading', difficulty: 'easy', estimatedTime: 25, points: 15, isPublic: true },
  ];
  const cursor = (data: any[]) => ({
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    toArray: jest.fn().mockResolvedValue(data),
  });
  return {
    collections: {
      dailyTasks: {
        find: jest.fn().mockReturnValue({ sort: jest.fn().mockReturnThis(), toArray: jest.fn().mockResolvedValue(dailyTasks) }),
      },
      tasks: {
        find: jest.fn((query: any) => {
          if (query && query._id && query._id.$in) {
            return { toArray: jest.fn().mockResolvedValue(analyzeTasks) };
          }
          return cursor(availableTasks);
        }),
      },
    },
  };
});

import { RecommendationService, getTaskRecommendations, getUserInsights } from '../recommendationService';

describe('RecommendationService', () => {
  it('updates weights', () => {
    // Arrange
    const service = new RecommendationService();
    // Act
    service.updateWeights({ novelty: 0.5 });
    // Assert
    expect((service as any).weights.novelty).toBe(0.5);
  });

  it('provides recommendations and insights', async () => {
    // Arrange
    const userId = 'user';
    // Act
    const recs = await getTaskRecommendations(userId);
    const insights = await getUserInsights(userId);
    // Assert
    expect(recs[0].score).toBeGreaterThan(0);
    expect(insights.strongCategories.length).toBeGreaterThan(0);
  });
});

describe('RecommendationService scoring', () => {
  it('applies novelty bonus for new category', async () => {
    // Arrange
    const service = new RecommendationService();
    const task: Task = {
      id: '5',
      title: 'new task',
      description: '',
      category: 'exercise',
      difficulty: 'easy',
      estimatedTime: 10,
      points: 5,
      requiresEvidence: false,
      evidenceTypes: [],
      tags: [],
      isPublic: true,
      createdBy: 'u',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;
    const prefs: UserPreferences = {
      categoryStats: {},
      difficultyStats: {},
      totalCompleted: 0,
      totalPoints: 0,
      averagePoints: 0,
      recentCompletions: [],
      completionRate: 0.5,
      avgSessionTime: 20,
      preferredTimeRanges: [],
    };
    // Act
    const result = await service.scoreTask(task, prefs, true);
    // Assert
    expect(result.scoreBreakdown.novelty).toBeGreaterThan(0);
  });
});
