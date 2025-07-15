import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export interface GameTimeExchange {
    userId: string;
    date: string;
    pointsSpent: number;
    gameType: 'normal' | 'educational';
    minutesGranted: number;
    minutesUsed: number;
    createdAt: Date;
}
export declare const calculateGameTime: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getTodayGameTime: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const useGameTime: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getSpecialRewards: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=rewardsController.d.ts.map