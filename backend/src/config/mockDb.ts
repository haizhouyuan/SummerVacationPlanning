import { User, UserDocument, Task, DailyTask, Redemption } from '../types';

// Mock database collections for testing
export class MockCollections {
  users: UserDocument[] = [
    {
      email: 'student@test.com',
      displayName: 'Test Student',
      role: 'student',
      parentId: 'parent-1',
      points: 50,
      currentStreak: 3,
      medals: { bronze: true, silver: false, gold: false, diamond: false },
      createdAt: new Date(),
      updatedAt: new Date(),
      password: '$2b$10$hashedpassword'
    },
    {
      email: 'parent@test.com', 
      displayName: 'Test Parent',
      role: 'parent',
      children: ['student-1'],
      points: 0,
      currentStreak: 0,
      medals: { bronze: false, silver: false, gold: false, diamond: false },
      createdAt: new Date(),
      updatedAt: new Date(),
      password: '$2b$10$hashedpassword'
    }
  ];

  tasks: Task[] = [
    {
      id: 'task-1',
      title: '数学作业',
      description: '完成数学练习册第10页',
      category: 'learning',
      activity: 'math_video',
      difficulty: 'medium',
      estimatedTime: 30,
      points: 15,
      requiresEvidence: true,
      evidenceTypes: ['text', 'photo'],
      tags: ['homework', 'math'],
      createdBy: 'teacher-1',
      isPublic: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'task-2',
      title: '英语阅读',
      description: '阅读英语故事书15分钟',
      category: 'reading',
      activity: 'reading_general',
      difficulty: 'easy',
      estimatedTime: 15,
      points: 10,
      requiresEvidence: true,
      evidenceTypes: ['text'],
      tags: ['reading', 'english'],
      createdBy: 'teacher-1',
      isPublic: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  dailyTasks: DailyTask[] = [
    {
      id: 'daily-task-1',
      userId: 'student-1',
      taskId: 'task-1',
      date: new Date().toISOString().split('T')[0],
      status: 'completed',
      priority: 'medium',
      pointsEarned: 15,
      evidence: [{
        type: 'text',
        content: '我完成了所有数学题目',
        timestamp: new Date()
      }],
      approvalStatus: 'pending',
      completedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  redemptions: Redemption[] = [];

  // Mock methods
  insertOne(data: any) {
    return { insertedId: Math.random().toString() };
  }

  findOne(query: any) {
    // Simple mock implementation
    return this.users[0] || null;
  }

  find(query: any) {
    return {
      toArray: () => this.dailyTasks,
      sort: () => ({ toArray: () => this.dailyTasks }),
      limit: () => ({ toArray: () => this.dailyTasks })
    };
  }

  updateOne(query: any, update: any) {
    return { modifiedCount: 1 };
  }

  deleteOne(query: any) {
    return { deletedCount: 1 };
  }

  countDocuments(query: any) {
    return this.dailyTasks.length;
  }
}

export const mockCollections = new MockCollections();