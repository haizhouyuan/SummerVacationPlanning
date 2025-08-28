/**
 * DailyTask Model Wrapper for Testing
 * 每日任务模型包装器（测试用）
 */

import { Collection, ObjectId } from 'mongodb';
import { DailyTask as DailyTaskType } from '../types';
import { collections } from '../config/mongodb';

export class DailyTaskModel {
  private static collection(): Collection<DailyTaskType> {
    if (!collections?.dailyTasks) {
      throw new Error('Database not connected. Please ensure MongoDB is initialized.');
    }
    return collections.dailyTasks;
  }

  static async create(taskData: Partial<DailyTaskType>): Promise<DailyTaskType> {
    const now = new Date();
    const dailyTaskDoc: DailyTaskType = {
      id: '', // Will be set after insert
      userId: taskData.userId!,
      taskId: taskData.taskId!,
      date: taskData.date!,
      status: taskData.status || 'planned',
      plannedTime: taskData.plannedTime,
      plannedEndTime: taskData.plannedEndTime,
      reminderTime: taskData.reminderTime,
      priority: taskData.priority || 'medium',
      timePreference: taskData.timePreference || 'flexible',
      isRecurring: taskData.isRecurring || false,
      recurringPattern: taskData.recurringPattern,
      completedAt: taskData.completedAt,
      isPublic: taskData.isPublic || false,
      evidence: taskData.evidence || [],
      notes: taskData.notes,
      planningNotes: taskData.planningNotes,
      pointsEarned: taskData.pointsEarned || 0,
      pendingPoints: taskData.pendingPoints,
      approvalStatus: taskData.approvalStatus,
      approvedBy: taskData.approvedBy,
      approvedAt: taskData.approvedAt,
      approvalNotes: taskData.approvalNotes,
      bonusPoints: taskData.bonusPoints,
      createdAt: now,
      updatedAt: now,
      ...taskData
    };

    const result = await this.collection().insertOne(dailyTaskDoc);
    
    return {
      ...dailyTaskDoc,
      id: result.insertedId.toString()
    };
  }

  static async findById(id: string): Promise<DailyTaskType | null> {
    const doc = await this.collection().findOne({ _id: new ObjectId(id) });
    if (!doc) return null;
    
    return {
      ...doc,
      id: doc._id?.toString() || id
    };
  }

  static async findByUserId(userId: string): Promise<DailyTaskType[]> {
    const docs = await this.collection().find({ userId }).toArray();
    return docs.map(doc => ({
      ...doc,
      id: doc._id?.toString() || doc.id
    }));
  }

  static async findByUserAndDate(userId: string, date: string): Promise<DailyTaskType[]> {
    const docs = await this.collection().find({ userId, date }).toArray();
    return docs.map(doc => ({
      ...doc,
      id: doc._id?.toString() || doc.id
    }));
  }

  static async findByStatus(status: DailyTaskType['status']): Promise<DailyTaskType[]> {
    const docs = await this.collection().find({ status }).toArray();
    return docs.map(doc => ({
      ...doc,
      id: doc._id?.toString() || doc.id
    }));
  }

  static async updateById(id: string, updates: Partial<DailyTaskType>): Promise<DailyTaskType | null> {
    const result = await this.collection().findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...updates, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    
    if (!result) return null;
    
    return {
      ...result,
      id: result._id.toString()
    };
  }

  static async deleteById(id: string): Promise<boolean> {
    const result = await this.collection().deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }

  static async deleteMany(filter: any = {}): Promise<number> {
    const result = await this.collection().deleteMany(filter);
    return result.deletedCount;
  }

  static async findMany(filter: any = {}, limit?: number): Promise<DailyTaskType[]> {
    const cursor = this.collection().find(filter);
    if (limit) cursor.limit(limit);
    
    const docs = await cursor.toArray();
    return docs.map(doc => ({
      ...doc,
      id: doc._id?.toString() || doc.id
    }));
  }

  static async findPendingApproval(parentId: string): Promise<DailyTaskType[]> {
    // 这里需要根据实际的家长-孩子关系查询逻辑来实现
    // 暂时返回所有待审核的任务
    return this.findMany({ 
      approvalStatus: 'pending',
      status: 'completed'
    });
  }

  // 测试辅助方法
  static async countDocuments(filter: any = {}): Promise<number> {
    return this.collection().countDocuments(filter);
  }
}

// Export the DailyTaskModel class (remove conflicting DailyTask export)