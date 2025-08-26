import { ClientSession } from 'mongodb';
import { collections, mongodb } from '../config/mongodb';
import { ObjectId } from 'mongodb';

/**
 * 事务工具函数
 * 提供安全的事务操作包装器
 */

export interface TransactionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * 安全执行事务操作
 * @param operation 要执行的事务操作函数
 * @param retryAttempts 重试次数，默认3次
 * @returns 事务执行结果
 */
export async function withSafeTransaction<T>(
  operation: (session: ClientSession) => Promise<T>,
  retryAttempts: number = 3
): Promise<TransactionResult<T>> {
  let lastError: any = null;
  
  for (let attempt = 1; attempt <= retryAttempts; attempt++) {
    const session = mongodb['client'].startSession();
    
    try {
      let result: T;
      
      await session.withTransaction(async () => {
        result = await operation(session);
      });
      
      return { success: true, data: result! };
    } catch (error: any) {
      lastError = error;
      
      // 如果是事务冲突，可以重试
      if (error.code === 112 || error.code === 251 || error.errorLabels?.includes('TransientTransactionError')) {
        console.warn(`事务重试 ${attempt}/${retryAttempts}: ${error.message}`);
        if (attempt < retryAttempts) {
          // 指数退避重试
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
          continue;
        }
      }
      
      // 其他错误不重试
      break;
    } finally {
      await session.endSession();
    }
  }
  
  return { 
    success: false, 
    error: lastError?.message || 'Transaction failed after all retry attempts' 
  };
}

/**
 * 积分操作事务包装器
 * 专门用于处理积分相关的原子操作
 */
export async function executePointsTransaction(
  operations: Array<{
    userId: string;
    pointsDelta: number;
    metadata?: any;
    validationFn?: (session: ClientSession) => Promise<boolean>;
  }>
): Promise<TransactionResult<{ 
  updatedUsers: any[];
  totalPointsChanged: number; 
}>> {
  return withSafeTransaction(async (session) => {
    const updatedUsers = [];
    let totalPointsChanged = 0;
    
    for (const op of operations) {
      // 验证操作前的条件
      if (op.validationFn) {
        const isValid = await op.validationFn(session);
        if (!isValid) {
          throw new Error(`Points operation validation failed for user ${op.userId}`);
        }
      }
      
      // 获取当前用户信息
      const currentUser = await collections.users.findOne(
        { _id: new ObjectId(op.userId) },
        { session }
      );
      
      if (!currentUser) {
        throw new Error(`User not found: ${op.userId}`);
      }
      
      const currentPoints = currentUser.points || 0;
      const newPoints = currentPoints + op.pointsDelta;
      
      // 确保积分不会变为负数（除非明确允许）
      if (newPoints < 0 && !op.metadata?.allowNegative) {
        throw new Error(`Insufficient points: user ${op.userId} has ${currentPoints}, trying to deduct ${Math.abs(op.pointsDelta)}`);
      }
      
      // 更新用户积分
      const updateResult = await collections.users.updateOne(
        { _id: new ObjectId(op.userId) },
        { 
          $inc: { points: op.pointsDelta },
          $set: { updatedAt: new Date() }
        },
        { session }
      );
      
      if (updateResult.matchedCount === 0) {
        throw new Error(`Failed to update points for user ${op.userId}`);
      }
      
      // 记录积分变化
      totalPointsChanged += op.pointsDelta;
      updatedUsers.push({
        userId: op.userId,
        previousPoints: currentPoints,
        newPoints,
        pointsDelta: op.pointsDelta
      });
      
      // 如果有元数据，创建积分交易记录
      if (op.metadata?.createTransaction) {
        const transactionRecord = {
          userId: op.userId,
          type: op.pointsDelta > 0 ? 'earn' : 'spend',
          amount: Math.abs(op.pointsDelta),
          reason: op.metadata.reason || 'Points operation',
          previousTotal: currentPoints,
          newTotal: newPoints,
          metadata: op.metadata,
          createdAt: new Date()
        };
        
        if (collections.pointsTransactions) {
          await collections.pointsTransactions.insertOne(transactionRecord, { session });
        }
      }
    }
    
    return { updatedUsers, totalPointsChanged };
  });
}

/**
 * 游戏时间兑换事务
 * 原子性地处理积分扣除和游戏时间授予
 */
export async function executeGameTimeExchangeTransaction(
  userId: string,
  pointsToSpend: number,
  gameType: 'normal' | 'educational',
  minutesGranted: number,
  date: string
): Promise<TransactionResult<{ exchange: any; updatedUser: any }>> {
  return withSafeTransaction(async (session) => {
    // 验证用户有足够积分
    const user = await collections.users.findOne(
      { _id: new ObjectId(userId) },
      { session }
    );
    
    if (!user) {
      throw new Error('User not found');
    }
    
    if (user.points < pointsToSpend) {
      throw new Error(`Insufficient points: has ${user.points}, needs ${pointsToSpend}`);
    }
    
    // 创建游戏时间兑换记录
    const exchange = {
      userId,
      date,
      pointsSpent: pointsToSpend,
      gameType,
      minutesGranted,
      minutesUsed: 0,
      createdAt: new Date(),
    };
    
    const insertResult = await collections.gameTimeExchanges.insertOne(exchange, { session });
    (exchange as any)._id = insertResult.insertedId;
    
    // 扣除积分
    const updateResult = await collections.users.updateOne(
      { _id: new ObjectId(userId) },
      {
        $inc: { points: -pointsToSpend },
        $set: { updatedAt: new Date() }
      },
      { session }
    );
    
    if (updateResult.matchedCount === 0) {
      throw new Error('Failed to update user points');
    }
    
    // 获取更新后的用户信息
    const updatedUser = await collections.users.findOne(
      { _id: new ObjectId(userId) },
      { session }
    );
    
    return { exchange, updatedUser };
  });
}

/**
 * 任务完成奖励事务
 * 原子性地处理任务状态更新、积分奖励和限制检查
 */
export async function executeTaskCompletionRewardTransaction(
  userId: string,
  taskId: string,
  pointsToAward: number,
  metadata?: any
): Promise<TransactionResult<{ 
  updatedTask: any; 
  updatedUser: any; 
  pointsAwarded: number;
}>> {
  return withSafeTransaction(async (session) => {
    // 获取今日积分限制
    const today = new Date().toISOString().split('T')[0];
    let userPointsLimit = await collections.userPointsLimits.findOne({
      userId,
      date: today,
    }, { session });

    if (!userPointsLimit) {
      // 创建新的积分限制记录
      const gameTimeConfig = await collections.gameTimeConfigs.findOne({ isActive: true }, { session });
      const baseGameTime = gameTimeConfig?.baseGameTimeMinutes || 30;

      userPointsLimit = {
        userId,
        date: today,
        activityPoints: {},
        totalDailyPoints: 0,
        gameTimeUsed: 0,
        gameTimeAvailable: baseGameTime,
        accumulatedPoints: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await collections.userPointsLimits.insertOne(userPointsLimit, { session });
      userPointsLimit._id = result.insertedId;
    }

    // 检查每日积分限制
    const GLOBAL_DAILY_POINTS_LIMIT = 100; // 可配置
    const currentTotalPoints = userPointsLimit.totalDailyPoints || 0;
    let actualPointsAwarded = pointsToAward;

    if (currentTotalPoints >= GLOBAL_DAILY_POINTS_LIMIT) {
      actualPointsAwarded = 0;
    } else if (currentTotalPoints + pointsToAward > GLOBAL_DAILY_POINTS_LIMIT) {
      actualPointsAwarded = GLOBAL_DAILY_POINTS_LIMIT - currentTotalPoints;
    }

    if (actualPointsAwarded > 0) {
      // 更新用户积分
      await collections.users.updateOne(
        { _id: new ObjectId(userId) },
        { 
          $inc: { points: actualPointsAwarded },
          $set: { updatedAt: new Date() }
        },
        { session }
      );

      // 更新积分限制记录
      await collections.userPointsLimits.updateOne(
        { userId, date: today },
        {
          $inc: { totalDailyPoints: actualPointsAwarded },
          $set: { updatedAt: new Date() }
        },
        { session }
      );
    }

    // 更新任务状态
    const updatedTask = await collections.dailyTasks.findOneAndUpdate(
      { _id: new ObjectId(taskId) },
      { 
        $set: { 
          status: 'completed',
          pointsEarned: actualPointsAwarded,
          completedAt: new Date(),
          updatedAt: new Date()
        }
      },
      { session, returnDocument: 'after' }
    );

    if (!updatedTask.value) {
      throw new Error('Task not found or failed to update');
    }

    // 获取更新后的用户信息
    const updatedUser = await collections.users.findOne(
      { _id: new ObjectId(userId) },
      { session }
    );

    return { 
      updatedTask: updatedTask.value, 
      updatedUser, 
      pointsAwarded: actualPointsAwarded 
    };
  });
}

/**
 * 兑换审批事务
 * 原子性地处理兑换状态更新和积分处理
 */
export async function executeRedemptionApprovalTransaction(
  redemptionId: string,
  action: 'approve' | 'reject',
  approvedBy: string,
  notes?: string
): Promise<TransactionResult<{ 
  updatedRedemption: any; 
  updatedUser?: any;
  pointsAffected: number;
}>> {
  return withSafeTransaction(async (session) => {
    // 获取兑换记录
    const redemption = await collections.redemptions.findOne(
      { _id: new ObjectId(redemptionId) },
      { session }
    );
    
    if (!redemption) {
      throw new Error('Redemption not found');
    }

    let pointsAffected = 0;
    let updatedUser = null;

    // 根据操作处理积分
    if (action === 'reject' && redemption.status === 'pending') {
      // 退还冻结的积分
      await collections.users.updateOne(
        { _id: new ObjectId(redemption.userId) },
        { 
          $inc: { points: redemption.pointsCost },
          $set: { updatedAt: new Date() }
        },
        { session }
      );
      pointsAffected = redemption.pointsCost;
    }

    // 更新兑换状态
    const updateResult = await collections.redemptions.findOneAndUpdate(
      { _id: new ObjectId(redemptionId) },
      { 
        $set: {
          status: action === 'approve' ? 'approved' : 'rejected',
          processedAt: new Date(),
          processedBy: approvedBy,
          notes: notes || '',
          updatedAt: new Date()
        }
      },
      { session, returnDocument: 'after' }
    );

    if (!updateResult.value) {
      throw new Error('Failed to update redemption status');
    }

    // 获取更新后的用户信息
    updatedUser = await collections.users.findOne(
      { _id: new ObjectId(redemption.userId) },
      { session }
    );

    return { 
      updatedRedemption: updateResult.value, 
      updatedUser,
      pointsAffected
    };
  });
}
