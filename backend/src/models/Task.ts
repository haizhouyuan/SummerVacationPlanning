/**
 * Task Model Wrapper for Testing
 * 任务模型包装器（测试用）
 */

import { Collection, ObjectId } from 'mongodb';
import { Task as TaskType } from '../types';
import { collections } from '../config/mongodb';

export class TaskModel {
  private static collection(): Collection<TaskType> {
    if (!collections?.tasks) {
      throw new Error('Database not connected. Please ensure MongoDB is initialized.');
    }
    return collections.tasks;
  }

  static async create(taskData: Partial<TaskType>): Promise<TaskType> {
    const now = new Date();
    const taskDoc: TaskType = {
      id: '', // Will be set after insert
      title: taskData.title!,
      description: taskData.description || '',
      category: taskData.category || 'other',
      activity: taskData.activity || taskData.title!,
      difficulty: taskData.difficulty || 'medium',
      estimatedTime: taskData.estimatedTime || 30,
      points: taskData.points || 10,
      requiresEvidence: taskData.requiresEvidence || false,
      evidenceTypes: taskData.evidenceTypes || ['text'],
      tags: taskData.tags || [],
      createdBy: taskData.createdBy!,
      isPublic: taskData.isPublic || false,
      priority: taskData.priority || 'medium',
      timePreference: taskData.timePreference || 'flexible',
      isRecurring: taskData.isRecurring || false,
      recurringPattern: taskData.recurringPattern,
      createdAt: now,
      updatedAt: now,
      ...taskData
    };

    const result = await this.collection().insertOne(taskDoc);
    
    return {
      ...taskDoc,
      id: result.insertedId.toString()
    };
  }

  static async findById(id: string): Promise<TaskType | null> {
    const doc = await this.collection().findOne({ _id: new ObjectId(id) });
    if (!doc) return null;
    
    return {
      ...doc,
      id: doc._id?.toString() || id
    };
  }

  static async findByUserId(userId: string): Promise<TaskType[]> {
    const docs = await this.collection().find({ createdBy: userId }).toArray();
    return docs.map(doc => ({
      ...doc,
      id: doc._id?.toString() || doc.id
    }));
  }

  static async updateById(id: string, updates: Partial<TaskType>): Promise<TaskType | null> {
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

  static async findMany(filter: any = {}, limit?: number): Promise<TaskType[]> {
    const cursor = this.collection().find(filter);
    if (limit) cursor.limit(limit);
    
    const docs = await cursor.toArray();
    return docs.map(doc => ({
      ...doc,
      id: doc._id?.toString() || doc.id
    }));
  }

  static async findByCategory(category: TaskType['category']): Promise<TaskType[]> {
    return this.findMany({ category });
  }

  static async findPublicTasks(): Promise<TaskType[]> {
    return this.findMany({ isPublic: true });
  }

  // 测试辅助方法
  static async countDocuments(filter: any = {}): Promise<number> {
    return this.collection().countDocuments(filter);
  }
}

// 导出为默认的Task，兼容现有测试
export const Task = TaskModel;