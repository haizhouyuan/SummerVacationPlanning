import { MongoClient, Db, Collection } from 'mongodb';
import { User, UserDocument, Task, DailyTask, Redemption, PointsRule, GameTimeConfig, UserPointsLimit, PointsTransaction } from '../types';

interface GameTimeExchange {
  userId: string;
  date: string;
  pointsSpent: number;
  gameType: 'normal' | 'educational';
  minutesGranted: number;
  minutesUsed: number;
  createdAt: Date;
}

interface GameSession {
  userId: string;
  date: string;
  minutesUsed: number;
  gameSession: string;
  startTime: Date;
  endTime: Date;
}

class MongoDB {
  private client: MongoClient;
  private db!: Db;
  
  constructor() {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/summer_app';
    this.client = new MongoClient(mongoUri);
  }

  async connect() {
    try {
      await this.client.connect();
      this.db = this.client.db();
      console.log('✅ Connected to MongoDB');
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      throw error;
    }
  }

  async disconnect() {
    await this.client.close();
  }

  get collections() {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return {
      users: this.db.collection<UserDocument>('users'),
      tasks: this.db.collection<Task>('tasks'),
      dailyTasks: this.db.collection<DailyTask>('dailyTasks'),
      redemptions: this.db.collection<Redemption>('redemptions'),
      gameTimeExchanges: this.db.collection<GameTimeExchange>('gameTimeExchanges'),
      gameSessions: this.db.collection<GameSession>('gameSessions'),
      pointsRules: this.db.collection<PointsRule>('pointsRules'),
      gameTimeConfigs: this.db.collection<GameTimeConfig>('gameTimeConfigs'),
      userPointsLimits: this.db.collection<UserPointsLimit>('userPointsLimits'),
      pointsTransactions: this.db.collection<PointsTransaction>('pointsTransactions'),
    };
  }
}

export const mongodb = new MongoDB();

// Collections will be available after connecting
export let collections: any;

export const initializeCollections = () => {
  collections = mongodb.collections;
}; 