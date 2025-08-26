import { Response } from 'express';
import { collections, mongodb } from '../config/mongodb';
import { User } from '../types';
import { AuthRequest } from '../middleware/mongoAuth';
import { ObjectId } from 'mongodb';

// Gaming time exchange rates (from EarnPoints.md)
const EXCHANGE_RATES = {
  normal_games: 5, // 1 point = 5 minutes
  educational_games: 10, // 1 point = 10 minutes (programming/English games)
  free_educational_time: 20, // First 20 minutes free daily for educational games
};

const BASE_GAMING_TIME = 30; // 30 minutes base gaming time daily

export interface GameTimeExchange {
  userId: string;
  date: string; // YYYY-MM-DD
  pointsSpent: number;
  gameType: 'normal' | 'educational';
  minutesGranted: number;
  minutesUsed: number;
  createdAt: Date;
}

export const calculateGameTime = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    // Handle demo users - return mock response
    if (req.user.id === 'demo-user-id') {
      const { pointsToSpend, gameType = 'normal' } = req.body;
      const exchangeRate = gameType === 'educational' ? 2 : 1;
      const minutesGranted = Math.min(pointsToSpend * exchangeRate, 120); // Max 2 hours
      
      return res.status(200).json({
        success: true,
        data: {
          minutesGranted,
          pointsSpent: pointsToSpend,
          remainingPoints: Math.max(0, req.user.points - pointsToSpend),
          isFreeTime: false,
          baseGameTime: 30,
          totalAvailableToday: 30 + minutesGranted,
        },
        message: 'Gaming time purchased successfully! (Demo Mode)',
      });
    }

    const { pointsToSpend, gameType = 'normal', date } = req.body;
    const currentDate = date || new Date().toISOString().split('T')[0];

    // Validate inputs
    if (!pointsToSpend || pointsToSpend <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid points amount',
      });
    }

    if (!['normal', 'educational'].includes(gameType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid game type. Must be "normal" or "educational"',
      });
    }

    // Check if user has enough points
    if (req.user.points < pointsToSpend) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient points',
      });
    }

    // Calculate gaming time based on type and exchange rate
    let minutesGranted = 0;
    const exchangeRate = gameType === 'educational' ? EXCHANGE_RATES.educational_games : EXCHANGE_RATES.normal_games;
    
    // Check if educational games get free time today
    if (gameType === 'educational') {
      const todayExchanges = await collections.gameTimeExchanges.find({
        userId: req.user.id,
        date: currentDate,
        gameType: 'educational',
      }).toArray();
      
      const totalEducationalTimeUsed = todayExchanges.reduce((sum: number, exchange: any) => {
        return sum + exchange.minutesGranted;
      }, 0);
      
      // First 20 minutes are free for educational games
      if (totalEducationalTimeUsed < EXCHANGE_RATES.free_educational_time) {
        const freeMinutesAvailable = EXCHANGE_RATES.free_educational_time - totalEducationalTimeUsed;
        const requestedMinutes = pointsToSpend * exchangeRate;
        
        if (requestedMinutes <= freeMinutesAvailable) {
          minutesGranted = requestedMinutes;
          // Don't deduct points for free time
          const freeExchange: GameTimeExchange = {
            userId: req.user.id,
            date: currentDate,
            pointsSpent: 0,
            gameType: 'educational',
            minutesGranted,
            minutesUsed: 0,
            createdAt: new Date(),
          };
          
          await collections.gameTimeExchanges.insertOne(freeExchange);
          
          return res.status(200).json({
            success: true,
            data: {
              minutesGranted,
              pointsSpent: 0,
              isFreeTime: true,
              baseGameTime: BASE_GAMING_TIME,
              totalAvailableToday: BASE_GAMING_TIME + minutesGranted,
            },
            message: 'Free educational gaming time granted!',
          });
        }
      }
    }

    minutesGranted = pointsToSpend * exchangeRate;

    // Create exchange record
    const exchange: GameTimeExchange = {
      userId: req.user.id,
      date: currentDate,
      pointsSpent: pointsToSpend,
      gameType,
      minutesGranted,
      minutesUsed: 0,
      createdAt: new Date(),
    };

    // Use transaction to ensure atomic operation
    const session = mongodb['client'].startSession();
    try {
      await session.withTransaction(async () => {
        // Insert exchange record
        await collections.gameTimeExchanges.insertOne(exchange, { session });
        
        // Deduct points from user
        await collections.users.updateOne(
          { _id: new ObjectId(req.user!.id) },
          {
            $inc: { points: -pointsToSpend },
            $set: { updatedAt: new Date() }
          },
          { session }
        );
      });
    } finally {
      await session.endSession();
    }

    res.status(200).json({
      success: true,
      data: {
        minutesGranted,
        pointsSpent: pointsToSpend,
        remainingPoints: req.user.points - pointsToSpend,
        isFreeTime: false,
        baseGameTime: BASE_GAMING_TIME,
        totalAvailableToday: BASE_GAMING_TIME + minutesGranted,
      },
      message: 'Gaming time purchased successfully!',
    });
  } catch (error: any) {
    console.error('Calculate game time error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to calculate game time',
    });
  }
};

export const getTodayGameTime = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    // Handle demo users - return mock response
    if (req.user.id === 'demo-user-id') {
      return res.status(200).json({
        success: true,
        data: {
          baseGameTime: 30,
          earnedGameTime: 45,
          totalAvailableToday: 75,
          totalUsedToday: 20,
          remainingToday: 55,
          exchanges: [
            {
              id: 'demo-exchange-1',
              pointsSpent: 15,
              minutesGranted: 30,
              gameType: 'educational',
              createdAt: new Date().toISOString(),
            },
            {
              id: 'demo-exchange-2', 
              pointsSpent: 10,
              minutesGranted: 15,
              gameType: 'normal',
              createdAt: new Date().toISOString(),
            }
          ]
        },
        message: 'Today\'s gaming time retrieved successfully (Demo Mode)',
      });
    }

    const { userId, date } = req.query;
    const targetUserId = (userId as string) || req.user.id;
    const currentDate = (date as string) || new Date().toISOString().split('T')[0];

    // Check access permissions
    if (targetUserId !== req.user.id) {
      if (req.user.role !== 'parent' || !req.user.children?.includes(targetUserId)) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
        });
      }
    }

    // Get today's exchanges
    const exchanges = await collections.gameTimeExchanges.find({
      userId: targetUserId,
      date: currentDate,
    }).toArray();

    const totalMinutesGranted = exchanges.reduce((sum: number, exchange: any) => sum + exchange.minutesGranted, 0);
    const totalMinutesUsed = exchanges.reduce((sum: number, exchange: any) => sum + exchange.minutesUsed, 0);
    const totalPointsSpent = exchanges.reduce((sum: number, exchange: any) => sum + exchange.pointsSpent, 0);

    const gameTimeStats = {
      baseGameTime: BASE_GAMING_TIME,
      bonusTimeEarned: totalMinutesGranted,
      totalAvailable: BASE_GAMING_TIME + totalMinutesGranted,
      totalUsed: totalMinutesUsed,
      remainingTime: BASE_GAMING_TIME + totalMinutesGranted - totalMinutesUsed,
      pointsSpentToday: totalPointsSpent,
      exchanges: exchanges.map((exchange: any) => ({
        ...exchange,
        id: exchange._id?.toString(),
      })),
    };

    res.status(200).json({
      success: true,
      data: { gameTimeStats },
    });
  } catch (error: any) {
    console.error('Get today game time error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get game time stats',
    });
  }
};

export const useGameTime = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { minutesToUse, gameSession } = req.body;
    const currentDate = new Date().toISOString().split('T')[0];

    if (!minutesToUse || minutesToUse <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid minutes to use',
      });
    }

    // Get today's available time
    const exchanges = await collections.gameTimeExchanges.find({
      userId: req.user.id,
      date: currentDate,
    }).toArray();

    const totalMinutesGranted = exchanges.reduce((sum: number, exchange: any) => sum + exchange.minutesGranted, 0);
    const totalMinutesUsed = exchanges.reduce((sum: number, exchange: any) => sum + exchange.minutesUsed, 0);
    const availableTime = BASE_GAMING_TIME + totalMinutesGranted - totalMinutesUsed;

    if (minutesToUse > availableTime) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient gaming time available',
        data: {
          requested: minutesToUse,
          available: availableTime,
        },
      });
    }

    // Record game session
    const gameSessionData = {
      userId: req.user.id,
      date: currentDate,
      minutesUsed: minutesToUse,
      gameSession: gameSession || 'General gaming',
      startTime: new Date(),
      endTime: new Date(Date.now() + minutesToUse * 60000),
    };

    await collections.gameSessions.insertOne(gameSessionData);

    // Update exchange records (mark minutes as used)
    let remainingToUse = minutesToUse;
    
    // First use base time, then bonus time
    if (remainingToUse > 0) {
      const baseTimeUsed = Math.min(remainingToUse, BASE_GAMING_TIME - Math.min(totalMinutesUsed, BASE_GAMING_TIME));
      remainingToUse -= baseTimeUsed;
    }

    // Use bonus time from exchanges
    for (const exchange of exchanges) {
      if (remainingToUse <= 0) break;
      
      const unusedInExchange = exchange.minutesGranted - exchange.minutesUsed;
      const toUseFromExchange = Math.min(remainingToUse, unusedInExchange);
      
      if (toUseFromExchange > 0) {
        await collections.gameTimeExchanges.updateOne(
          { _id: exchange._id },
          {
            $inc: { minutesUsed: toUseFromExchange }
          }
        );
        remainingToUse -= toUseFromExchange;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        minutesUsed: minutesToUse,
        remainingTime: availableTime - minutesToUse,
        sessionStart: gameSessionData.startTime,
        sessionEnd: gameSessionData.endTime,
      },
      message: 'Game session started successfully!',
    });
  } catch (error: any) {
    console.error('Use game time error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to use game time',
    });
  }
};

export const getSpecialRewards = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    // Define special rewards based on accumulated points
    const specialRewards = [
      {
        id: 'new_game',
        title: '购买新游戏',
        description: '选择一款心仪的新游戏',
        pointsCost: 100,
        category: 'game',
        available: req.user.points >= 100,
      },
      {
        id: 'racing_experience',
        title: '赛车馆体验',
        description: '真实赛车馆驾驶体验一次',
        pointsCost: 150,
        category: 'experience',
        available: req.user.points >= 150,
      },
      {
        id: 'family_trip',
        title: '全家短途游',
        description: '全家一起的短途旅行',
        pointsCost: 200,
        category: 'family',
        available: req.user.points >= 200,
      },
      {
        id: 'diy_kit',
        title: '高级DIY套件',
        description: '更复杂的遥控车或机器人套件',
        pointsCost: 80,
        category: 'education',
        available: req.user.points >= 80,
      },
      {
        id: 'gaming_setup',
        title: '游戏设备升级',
        description: '新手柄、键盘或其他游戏配件',
        pointsCost: 120,
        category: 'game',
        available: req.user.points >= 120,
      },
    ];

    res.status(200).json({
      success: true,
      data: {
        specialRewards,
        userPoints: req.user.points,
      },
    });
  } catch (error: any) {
    console.error('Get special rewards error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get special rewards',
    });
  }
};

export const exchangeGameTime = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { gameType, points } = req.body;
    const currentDate = new Date().toISOString().split('T')[0];

    // Validate inputs
    if (!gameType || !['normal', 'educational'].includes(gameType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid game type. Must be "normal" or "educational"',
      });
    }

    if (!points || points <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid points amount',
      });
    }

    // Check if user has enough points
    if (req.user.points < points) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient points',
      });
    }

    // Calculate minutes granted
    const exchangeRate = gameType === 'normal' ? EXCHANGE_RATES.normal_games : EXCHANGE_RATES.educational_games;
    const minutesGranted = points * exchangeRate;

    // Create exchange record
    const exchange: GameTimeExchange = {
      userId: req.user.id,
      date: currentDate,
      pointsSpent: points,
      gameType,
      minutesGranted,
      minutesUsed: 0,
      createdAt: new Date(),
    };

    // Use transaction to ensure atomic operation
    const session = mongodb['client'].startSession();
    let result;
    try {
      await session.withTransaction(async () => {
        // Insert exchange record
        const insertResult = await collections.gameTimeExchanges.insertOne(exchange, { session });
        result = insertResult;
        
        // Update user points
        await collections.users.updateOne(
          { _id: new ObjectId(req.user!.id) },
          { $inc: { points: -points } },
          { session }
        );
      });
    } finally {
      await session.endSession();
    }

    res.status(200).json({
      success: true,
      data: {
        exchange: {
          ...exchange,
          id: result!.insertedId.toString(),
        },
        pointsSpent: points,
        minutesGranted,
        newPointsBalance: req.user.points - points,
      },
    });
  } catch (error: any) {
    console.error('Exchange game time error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to exchange game time',
    });
  }
};

export const getGameTimeExchanges = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { userId, date, limit = 10 } = req.query;
    const targetUserId = (userId as string) || req.user.id;

    // Check access permissions
    if (targetUserId !== req.user.id) {
      if (req.user.role !== 'parent' || !req.user.children?.includes(targetUserId)) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
        });
      }
    }

    // Build query
    const query: any = { userId: targetUserId };
    if (date) {
      query.date = date;
    }

    // Get exchanges
    const exchanges = await collections.gameTimeExchanges
      .find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .toArray();

    res.status(200).json({
      success: true,
      data: {
        exchanges: exchanges.map((exchange: any) => ({
          ...exchange,
          id: exchange._id?.toString(),
        })),
      },
    });
  } catch (error: any) {
    console.error('Get game time exchanges error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get game time exchanges',
    });
  }
};