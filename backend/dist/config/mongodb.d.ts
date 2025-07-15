import { Collection } from 'mongodb';
import { UserDocument, Task, DailyTask, Redemption } from '../types';
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
declare class MongoDB {
    private client;
    private db;
    constructor();
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    get collections(): {
        users: Collection<UserDocument>;
        tasks: Collection<Task>;
        dailyTasks: Collection<DailyTask>;
        redemptions: Collection<Redemption>;
        gameTimeExchanges: Collection<GameTimeExchange>;
        gameSessions: Collection<GameSession>;
    };
}
export declare const mongodb: MongoDB;
export declare let collections: any;
export declare const initializeCollections: () => void;
export {};
//# sourceMappingURL=mongodb.d.ts.map