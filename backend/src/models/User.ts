/**
 * User Model Wrapper for Testing
 * 用户模型包装器（测试用）
 */

import { Collection, ObjectId } from 'mongodb';
import { User as UserType, UserDocument } from '../types';
import { collections } from '../config/mongodb';

export class UserModel {
  private static collection(): Collection<UserDocument> {
    if (!collections?.users) {
      throw new Error('Database not connected. Please ensure MongoDB is initialized.');
    }
    return collections.users;
  }

  static async create(userData: Partial<UserDocument> & { password: string }): Promise<UserType> {
    const now = new Date();
    const userDoc: UserDocument = {
      email: userData.email!,
      displayName: userData.displayName || 'User',
      password: userData.password,
      role: userData.role || 'student',
      points: userData.points || 0,
      parentId: userData.parentId,
      children: userData.children || [],
      avatar: userData.avatar,
      createdAt: now,
      updatedAt: now
    };

    const result = await this.collection().insertOne(userDoc);
    
    return {
      id: result.insertedId.toString(),
      ...userDoc
    };
  }

  static async findById(id: string): Promise<UserType | null> {
    const doc = await this.collection().findOne({ _id: new ObjectId(id) });
    if (!doc) return null;
    
    return {
      id: doc._id.toString(),
      ...doc
    };
  }

  static async findByEmail(email: string): Promise<UserType | null> {
    const doc = await this.collection().findOne({ email });
    if (!doc) return null;
    
    return {
      id: doc._id.toString(),
      ...doc
    };
  }

  static async updateById(id: string, updates: Partial<UserDocument>): Promise<UserType | null> {
    const result = await this.collection().findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...updates, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    
    if (!result) return null;
    
    return {
      id: result._id.toString(),
      ...result
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

  static async findMany(filter: any = {}, limit?: number): Promise<UserType[]> {
    const cursor = this.collection().find(filter);
    if (limit) cursor.limit(limit);
    
    const docs = await cursor.toArray();
    return docs.map(doc => ({
      id: doc._id.toString(),
      ...doc
    }));
  }

  // 测试辅助方法
  static async countDocuments(filter: any = {}): Promise<number> {
    return this.collection().countDocuments(filter);
  }

  // 获取原始文档（包含密码字段，仅用于测试）
  static async findRawDocument(filter: any): Promise<UserDocument | null> {
    return this.collection().findOne(filter);
  }
}

// 导出为默认的User，兼容现有测试
export const User = UserModel;