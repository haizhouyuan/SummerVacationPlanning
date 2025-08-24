import { Response } from 'express';
import { collections, mongodb } from '../config/mongodb';
import { DailyTask, Task, PointsTransaction } from '../types';
import { AuthRequest } from '../middleware/mongoAuth';
import { ObjectId } from 'mongodb';
import { calculateConfigurablePoints } from './pointsConfigController';
import { getCurrentWeek } from '../utils/dateUtils';
import { businessLogger } from '../config/logger';
import { logBusinessOperation } from '../middleware/loggerMiddleware';

export const createDailyTask = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { 
      taskId, 
      date, 
      plannedTime, 
      plannedEndTime,
      reminderTime,
      priority = 'medium',
      timePreference,
      isRecurring = false,
      recurringPattern,
      notes,
      planningNotes
    } = req.body;

    // Validate required fields
    if (!taskId || !date) {
      return res.status(400).json({
        success: false,
        error: 'Task ID and date are required',
      });
    }

    // Handle demo mode - return success without database operations
    if (req.user.id === 'demo-user-id') {
      return res.status(201).json({
        success: true,
        data: {
          _id: 'demo-daily-task-' + Date.now(),
          taskId,
          userId: 'demo-user-id',
          date,
          plannedTime,
          plannedEndTime,
          priority,
          status: 'planned',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      });
    }

    // Check if task exists (only for real users)
    let task;
    try {
      task = await collections.tasks.findOne({ _id: new ObjectId(taskId) });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid task ID format',
      });
    }
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }

    // Check if daily task already exists for this date
    const existingDailyTask = await collections.dailyTasks.findOne({
      userId: req.user.id,
      taskId: taskId,
      date: date,
    });

    if (existingDailyTask) {
      return res.status(400).json({
        success: false,
        error: 'Daily task already exists for this date',
      });
    }

    const dailyTaskData: Omit<DailyTask, 'id'> = {
      userId: req.user.id,
      taskId,
      date,
      status: 'planned',
      plannedTime,
      plannedEndTime,
      reminderTime,
      priority,
      timePreference,
      isRecurring,
      recurringPattern,
      notes,
      planningNotes,
      pointsEarned: 0,
      approvalStatus: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collections.dailyTasks.insertOne(dailyTaskData);
    const dailyTask = { ...dailyTaskData, id: result.insertedId.toString() };

    res.status(201).json({
      success: true,
      data: { dailyTask },
      message: 'Daily task planned successfully',
    });
  } catch (error: any) {
    console.error('Create daily task error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create daily task',
    });
  }
};

export const getDailyTasks = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { date, status, userId } = req.query;
    const targetUserId = (userId as string) || req.user.id;

    // Check if user can access the requested user's data
    if (targetUserId !== req.user.id) {
      if (req.user.role !== 'parent' || !req.user.children?.includes(targetUserId)) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
        });
      }
    }

    let query: any = { userId: targetUserId };

    if (date) {
      query.date = date;
    }
    if (status) {
      query.status = status;
    }

    const dailyTasks = await collections.dailyTasks
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    // Get task details for each daily task
    const tasksWithDetails = await Promise.all(
      dailyTasks.map(async (dailyTask: any) => {
        const task = await collections.tasks.findOne({ _id: new ObjectId(dailyTask.taskId) });
        return {
          ...dailyTask,
          id: dailyTask._id.toString(),
          task: task ? { ...task, id: task._id.toString() } : null,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: { dailyTasks: tasksWithDetails },
    });
  } catch (error: any) {
    console.error('Get daily tasks error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get daily tasks',
    });
  }
};

export const updateDailyTaskStatus = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { dailyTaskId } = req.params;
    const { status, evidence, notes, evidenceText, evidenceMedia, isPublic } = req.body;

    const dailyTask = await collections.dailyTasks.findOne({ _id: new ObjectId(dailyTaskId) });
    if (!dailyTask) {
      return res.status(404).json({
        success: false,
        error: 'Daily task not found',
      });
    }

    // Check if user can update this daily task
    if (dailyTask.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'You can only update your own daily tasks',
      });
    }

    const updates: any = { updatedAt: new Date() };

    if (status) {
      updates.status = status;
      
      // If completing task, calculate points using configurable system
      if (status === 'completed') {
        const task = await collections.tasks.findOne({ _id: new ObjectId(dailyTask.taskId) });
        if (task) {
          // Prepare data for configurable points calculation
          const baseData = {
            duration: task.estimatedTime,
            wordCount: evidenceText ? evidenceText.length : undefined,
            quality: 'normal', // Could be determined from evidence or user input
            difficulty: task.difficulty,
          };

          // Use configurable points calculation with task.activity
          const pointsResult = await calculateConfigurablePoints(
            task.category,
            task.activity || 'general', // Use the standardized activity field
            baseData,
            req.user.medals
          );
          
          updates.pointsEarned = pointsResult.totalPoints;
          updates.completedAt = new Date();
          
          // For tasks requiring evidence/approval, set status as pending approval
          if (task.requiresEvidence) {
            updates.approvalStatus = 'pending';
          }
          
          // Check daily limits before adding points
          const today = new Date().toISOString().split('T')[0];
          
          // Get configurable daily points limit
          const gameTimeConfig = await collections.gameTimeConfigs.findOne({ isActive: true });
          const GLOBAL_DAILY_POINTS_LIMIT = gameTimeConfig?.dailyPointsLimit || 20;
          
          let userPointsLimit = await collections.userPointsLimits.findOne({
            userId: req.user.id,
            date: today,
          });

          if (!userPointsLimit) {
            const gameTimeConfig = await collections.gameTimeConfigs.findOne({ isActive: true });
            const baseGameTime = gameTimeConfig?.baseGameTimeMinutes || 30;

            userPointsLimit = {
              userId: req.user.id,
              date: today,
              activityPoints: {},
              totalDailyPoints: 0,
              gameTimeUsed: 0,
              gameTimeAvailable: baseGameTime,
              accumulatedPoints: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            const result = await collections.userPointsLimits.insertOne(userPointsLimit);
            userPointsLimit.id = result.insertedId.toString();
          }

          // Apply global daily points limit
          const currentTotalPoints = userPointsLimit.totalDailyPoints || 0;
          let actualPointsAwarded = pointsResult.totalPoints;
          let isLimitReached = false;
          let isPointsTruncated = false;

          if (currentTotalPoints >= GLOBAL_DAILY_POINTS_LIMIT) {
            // Already at limit, no points awarded
            actualPointsAwarded = 0;
            isLimitReached = true;
          } else if (currentTotalPoints + pointsResult.totalPoints > GLOBAL_DAILY_POINTS_LIMIT) {
            // Truncate points to not exceed limit
            actualPointsAwarded = GLOBAL_DAILY_POINTS_LIMIT - currentTotalPoints;
            isPointsTruncated = true;
          }

          // Check activity daily limit if applicable
          const activity = task.activity || 'general';

          const pointsRule = await collections.pointsRules.findOne({
            activity,
            isActive: true,
          });

          if (pointsRule && pointsRule.dailyLimit) {
            const currentActivityPoints = userPointsLimit.activityPoints[activity] || 0;
            const activityRemainingPoints = pointsRule.dailyLimit - currentActivityPoints;
            
            if (activityRemainingPoints <= 0) {
              actualPointsAwarded = 0;
              isLimitReached = true;
            } else if (actualPointsAwarded > activityRemainingPoints) {
              actualPointsAwarded = activityRemainingPoints;
              isPointsTruncated = true;
            }
          }

          // Update points tracking and award points only if task doesn't require approval or is already approved
          if (actualPointsAwarded > 0 && (!task.requiresEvidence || dailyTask.approvalStatus === 'approved')) {
            // Log the points operation
            businessLogger.pointsOperation(req.user.id, 'TASK_COMPLETION', actualPointsAwarded, {
              taskId: dailyTask.taskId,
              dailyTaskId: dailyTask._id.toString(),
              taskCategory: task.category,
              taskActivity: task.activity,
              originalPoints: pointsResult.totalPoints,
              limitApplied: isPointsTruncated || isLimitReached
            });

            // Use transaction to ensure atomic operations
            const session = mongodb['client'].startSession();
            try {
              await session.withTransaction(async () => {
                const currentActivityPoints = userPointsLimit.activityPoints[activity] || 0;
                
                // Update user points limit
                await collections.userPointsLimits.updateOne(
                  { userId: req.user!.id, date: today },
                  {
                    $set: {
                      [`activityPoints.${activity}`]: currentActivityPoints + actualPointsAwarded,
                      totalDailyPoints: (userPointsLimit.totalDailyPoints || 0) + actualPointsAwarded,
                      updatedAt: new Date(),
                    }
                  },
                  { session }
                );
                
                // Update user's total points
                await collections.users.updateOne(
                  { _id: new ObjectId(req.user!.id) },
                  { 
                    $inc: { points: actualPointsAwarded },
                    $set: { updatedAt: new Date() }
                  },
                  { session }
                );
              });
            } finally {
              await session.endSession();
            }
          } else if (task.requiresEvidence && actualPointsAwarded > 0) {
            // For approval-required tasks, store points but don't award them yet
            actualPointsAwarded = 0; // Don't award points until approved
          }

          // Update the points earned in the task record
          updates.pointsEarned = actualPointsAwarded;
          
          // Add limit information to response
          updates.pointsLimitInfo = {
            originalPoints: pointsResult.totalPoints,
            actualPointsAwarded,
            isLimitReached,
            isPointsTruncated,
            currentTotalPoints: currentTotalPoints + actualPointsAwarded,
            globalDailyLimit: GLOBAL_DAILY_POINTS_LIMIT,
          };
          
          // Check if this completion triggers a streak update
          await checkAndUpdateStreak(req.user.id, dailyTask.date);
        }
      }
    }

    if (evidenceText !== undefined) {
      updates.evidenceText = evidenceText;
    }
    if (evidenceMedia !== undefined) {
      updates.evidenceMedia = evidenceMedia;
    }
    if (isPublic !== undefined) {
      updates.isPublic = isPublic;
    }

    if (notes) {
      updates.notes = notes;
    }

    await collections.dailyTasks.updateOne(
      { _id: new ObjectId(dailyTaskId) },
      { $set: updates }
    );

    // Get updated daily task
    const updatedDailyTask = await collections.dailyTasks.findOne({ _id: new ObjectId(dailyTaskId) });
    
    // Prepare response with limit information if applicable
    let responseMessage = 'Daily task updated successfully';
    let responseData: any = { dailyTask: { ...updatedDailyTask, id: updatedDailyTask._id.toString() } };

    if (updates.pointsLimitInfo) {
      const limitInfo = updates.pointsLimitInfo;
      responseData.pointsLimitInfo = limitInfo;
      
      if (limitInfo.isLimitReached && limitInfo.actualPointsAwarded === 0) {
        responseMessage = 'Task completed but daily points limit reached - no points awarded';
      } else if (limitInfo.isPointsTruncated) {
        responseMessage = `Task completed with ${limitInfo.actualPointsAwarded} points (truncated from ${limitInfo.originalPoints} due to daily limit)`;
      } else {
        responseMessage = `Task completed successfully! Earned ${limitInfo.actualPointsAwarded} points`;
      }
    }
    
    res.status(200).json({
      success: true,
      data: responseData,
      message: responseMessage,
    });
  } catch (error: any) {
    console.error('Update daily task status error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update daily task status',
    });
  }
};

export const deleteDailyTask = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { dailyTaskId } = req.params;
    const dailyTask = await collections.dailyTasks.findOne({ _id: new ObjectId(dailyTaskId) });

    if (!dailyTask) {
      return res.status(404).json({
        success: false,
        error: 'Daily task not found',
      });
    }

    // Check if user can delete this daily task
    if (dailyTask.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'You can only delete your own daily tasks',
      });
    }

    await collections.dailyTasks.deleteOne({ _id: new ObjectId(dailyTaskId) });

    res.status(200).json({
      success: true,
      message: 'Daily task deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete daily task error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete daily task',
    });
  }
};

export const getWeeklyStats = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { userId, startDate, endDate } = req.query;
    const targetUserId = (userId as string) || req.user.id;

    // Check if user can access the requested user's data
    if (targetUserId !== req.user.id) {
      if (req.user.role !== 'parent' || !req.user.children?.includes(targetUserId)) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
        });
      }
    }

    let query: any = { userId: targetUserId };

    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      query.date = { $gte: startDate };
    } else if (endDate) {
      query.date = { $lte: endDate };
    }

    const dailyTasks = await collections.dailyTasks.find(query).toArray();

    const stats = {
      totalTasks: dailyTasks.length,
      completedTasks: dailyTasks.filter((task: any) => task.status === 'completed').length,
      inProgressTasks: dailyTasks.filter((task: any) => task.status === 'in_progress').length,
      plannedTasks: dailyTasks.filter((task: any) => task.status === 'planned').length,
      skippedTasks: dailyTasks.filter((task: any) => task.status === 'skipped').length,
      totalPointsEarned: dailyTasks.reduce((sum: number, task: any) => sum + task.pointsEarned, 0),
      completionRate: dailyTasks.length > 0 ? 
        (dailyTasks.filter((task: any) => task.status === 'completed').length / dailyTasks.length) * 100 : 0,
    };

    res.status(200).json({
      success: true,
      data: { stats },
    });
  } catch (error: any) {
    console.error('Get weekly stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get weekly stats',
    });
  }
};

export const getPublicDailyTasks = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 20, sort = 'createdAt' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const query: any = { isPublic: true };
    const total = await collections.dailyTasks.countDocuments(query);
    const tasks = await collections.dailyTasks
      .find(query)
      .sort({ [sort as string]: -1 })
      .skip(skip)
      .limit(Number(limit))
      .toArray();
    // 可选：附带用户信息
    res.status(200).json({
      success: true,
      data: {
        total,
        page: Number(page),
        limit: Number(limit),
        tasks: tasks.map((t: any) => ({ ...t, id: t._id?.toString() })),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to get public daily tasks' });
  }
};

// Helper function to calculate bonus points based on evidence
function calculateBonusPoints(task: Task, evidence: any[], evidenceText?: string, evidenceMedia?: any[]): number {
  let bonusPoints = 0;
  
  // 文字证据加分
  if (task.category === 'reading' && task.title.includes('日记')) {
    if (evidenceText) {
      const wordCount = evidenceText.length;
      bonusPoints += Math.floor(wordCount / 50);
    } else if (evidence) {
      for (const item of evidence) {
        if (item.type === 'text' && item.content) {
          const wordCount = item.content.length;
          bonusPoints += Math.floor(wordCount / 50);
        }
      }
    }
  }
  
  // 媒体证据加分
  if (evidenceMedia && evidenceMedia.length > 0) {
    // 每个媒体文件额外加1分
    bonusPoints += evidenceMedia.length;
    
    // 视频文件额外加分（因为制作视频更费时间）
    const videoCount = evidenceMedia.filter(media => media.type === 'video').length;
    bonusPoints += videoCount * 2;
  }
  
  return bonusPoints;
}

// Get pending tasks for parent approval
export const getPendingApprovalTasks = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    // Only parents can get pending approval tasks
    if (req.user.role !== 'parent') {
      return res.status(403).json({
        success: false,
        error: 'Only parents can access pending approval tasks',
      });
    }

    // Get all children IDs for this parent
    const childrenIds = req.user.children || [];
    
    if (childrenIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: { tasks: [] },
      });
    }

    // Find daily tasks that are completed but need approval
    // Tasks need approval if they have evidence and are from children
    const pendingTasks = await collections.dailyTasks.find({
      userId: { $in: childrenIds },
      status: 'completed',
      $and: [
        {
          $or: [
            { evidenceText: { $exists: true, $ne: '' } },
            { evidenceMedia: { $exists: true, $not: { $size: 0 } } }
          ]
        },
        {
          $or: [
            { approvalStatus: { $exists: false } },
            { approvalStatus: 'pending' }
          ]
        }
      ]
    }).toArray();

    // Get task details and user details for each pending task
    const tasksWithDetails = await Promise.all(
      pendingTasks.map(async (dailyTask: any) => {
        const task = await collections.tasks.findOne({ _id: new ObjectId(dailyTask.taskId) });
        const student = await collections.users.findOne({ _id: new ObjectId(dailyTask.userId) });
        
        return {
          id: dailyTask._id.toString(),
          studentId: dailyTask.userId,
          studentName: student?.displayName || 'Unknown Student',
          task: task ? {
            id: task._id.toString(),
            title: task.title,
            description: task.description,
            category: task.category,
            points: task.points,
          } : null,
          evidenceText: dailyTask.evidenceText,
          evidenceMedia: dailyTask.evidenceMedia || [],
          notes: dailyTask.notes || '',
          submittedAt: dailyTask.completedAt || dailyTask.updatedAt,
          status: dailyTask.approvalStatus || 'pending',
          pointsEarned: dailyTask.pointsEarned || 0,
        };
      })
    );

    // Filter out tasks without valid task details
    const validTasks = tasksWithDetails.filter(task => task.task !== null);

    res.status(200).json({
      success: true,
      data: { tasks: validTasks },
    });
  } catch (error: any) {
    console.error('Get pending approval tasks error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get pending approval tasks',
    });
  }
};

// Approve or reject a task
export const approveTask = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    // Only parents can approve tasks
    if (req.user.role !== 'parent') {
      return res.status(403).json({
        success: false,
        error: 'Only parents can approve tasks',
      });
    }

    const { dailyTaskId } = req.params;
    const { action, approvalNotes, bonusPoints } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Action must be either approve or reject',
      });
    }

    const dailyTask = await collections.dailyTasks.findOne({ _id: new ObjectId(dailyTaskId) });
    if (!dailyTask) {
      return res.status(404).json({
        success: false,
        error: 'Daily task not found',
      });
    }

    // Verify this task belongs to one of the parent's children
    if (!req.user.children?.includes(dailyTask.userId)) {
      return res.status(403).json({
        success: false,
        error: 'You can only approve tasks from your children',
      });
    }

    // Fetch task details for both approval and rejection flows
    const task = await collections.tasks.findOne({ _id: new ObjectId(dailyTask.taskId) });
    
    const updates: any = {
      approvalStatus: action === 'approve' ? 'approved' : 'rejected',
      approvedBy: req.user.id,
      approvedAt: new Date(),
      approvalNotes: approvalNotes || '',
      updatedAt: new Date(),
    };

    // If approving, award the original points plus any bonus points
    if (action === 'approve') {
      if (task) {
        const basePoints = dailyTask.pointsEarned || 0;
        const bonusPointsValue = bonusPoints ? parseInt(bonusPoints) : 0;
        const totalPointsToAward = basePoints + bonusPointsValue;
        
        if (totalPointsToAward > 0) {
          // Check daily limits again when approving
          const today = new Date().toISOString().split('T')[0];
          const gameTimeConfig = await collections.gameTimeConfigs.findOne({ isActive: true });
          const GLOBAL_DAILY_POINTS_LIMIT = gameTimeConfig?.dailyPointsLimit || 20;
          
          let userPointsLimit = await collections.userPointsLimits.findOne({
            userId: dailyTask.userId,
            date: today,
          });

          if (!userPointsLimit) {
            const baseGameTime = gameTimeConfig?.baseGameTimeMinutes || 30;
            userPointsLimit = {
              userId: dailyTask.userId,
              date: today,
              activityPoints: {},
              totalDailyPoints: 0,
              gameTimeUsed: 0,
              gameTimeAvailable: baseGameTime,
              accumulatedPoints: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            const result = await collections.userPointsLimits.insertOne(userPointsLimit);
            userPointsLimit.id = result.insertedId.toString();
          }

          const activity = task.activity || 'general';
          const currentTotalPoints = userPointsLimit.totalDailyPoints || 0;
          let actualPointsAwarded = totalPointsToAward;

          // Apply global daily limit
          if (currentTotalPoints >= GLOBAL_DAILY_POINTS_LIMIT) {
            actualPointsAwarded = 0;
          } else if (currentTotalPoints + totalPointsToAward > GLOBAL_DAILY_POINTS_LIMIT) {
            actualPointsAwarded = GLOBAL_DAILY_POINTS_LIMIT - currentTotalPoints;
          }

          // Check activity daily limit
          const pointsRule = await collections.pointsRules.findOne({
            activity,
            isActive: true,
          });

          if (pointsRule && pointsRule.dailyLimit) {
            const currentActivityPoints = userPointsLimit.activityPoints[activity] || 0;
            const activityRemainingPoints = pointsRule.dailyLimit - currentActivityPoints;
            
            if (activityRemainingPoints <= 0) {
              actualPointsAwarded = 0;
            } else if (actualPointsAwarded > activityRemainingPoints) {
              actualPointsAwarded = activityRemainingPoints;
            }
          }

          if (actualPointsAwarded > 0) {
            // Log the task approval and points operation
            businessLogger.taskOperation(dailyTask.userId, dailyTask._id.toString(), 'APPROVED_WITH_POINTS', {
              approvedBy: req.user.id,
              basePoints,
              bonusPoints: bonusPointsValue,
              totalPointsToAward,
              actualPointsAwarded,
              approvalNotes,
              taskCategory: task.category,
              taskActivity: task.activity
            });

            businessLogger.pointsOperation(dailyTask.userId, 'TASK_APPROVAL', actualPointsAwarded, {
              approvedBy: req.user.id,
              taskId: dailyTask.taskId,
              dailyTaskId: dailyTask._id.toString(),
              basePoints,
              bonusPoints: bonusPointsValue
            });

            // Use transaction to ensure atomic operations
            const session = mongodb['client'].startSession();
            try {
              await session.withTransaction(async () => {
                const currentActivityPoints = userPointsLimit.activityPoints[activity] || 0;
                
                // Update user points limit
                await collections.userPointsLimits.updateOne(
                  { userId: dailyTask.userId, date: today },
                  {
                    $set: {
                      [`activityPoints.${activity}`]: currentActivityPoints + actualPointsAwarded,
                      totalDailyPoints: (userPointsLimit.totalDailyPoints || 0) + actualPointsAwarded,
                      updatedAt: new Date(),
                    }
                  },
                  { session }
                );
                
                // Update user's total points
                await collections.users.updateOne(
                  { _id: new ObjectId(dailyTask.userId) },
                  { 
                    $inc: { points: actualPointsAwarded },
                    $set: { updatedAt: new Date() }
                  },
                  { session }
                );
              });
            } finally {
              await session.endSession();
            }
          }

          updates.pointsEarned = actualPointsAwarded;
          if (bonusPointsValue > 0) {
            updates.bonusPoints = bonusPointsValue;
          }
          
          // Create transaction records for approved points
          if (actualPointsAwarded > 0) {
            await createPointsTransaction(
              dailyTask.userId,
              'earn',
              actualPointsAwarded,
              `Points earned from approved task: ${task?.title || 'Unknown Task'}`,
              {
                dailyTaskId,
                approvedBy: req.user.id,
                activityType: task?.activity || 'general',
                originalPoints: actualPointsAwarded,
                taskTitle: task?.title,
                approvalNotes: approvalNotes || 'Task approved by parent'
              }
            );
          }
          
          // Create separate transaction for bonus points if any
          if (bonusPointsValue > 0) {
            await createPointsTransaction(
              dailyTask.userId,
              'bonus',
              bonusPointsValue,
              `Bonus points awarded for task: ${task?.title || 'Unknown Task'}`,
              {
                dailyTaskId,
                approvedBy: req.user.id,
                activityType: task?.activity || 'general',
                originalPoints: basePoints,
                taskTitle: task?.title,
                approvalNotes: approvalNotes || 'Bonus points awarded by parent'
              }
            );
          }
        }
      }
    }

    // If rejecting, handle points clawback and task status
    if (action === 'reject') {
      // Log task rejection
      businessLogger.taskOperation(dailyTask.userId, dailyTask._id.toString(), 'REJECTED', {
        rejectedBy: req.user.id,
        approvalNotes,
        taskCategory: task?.category,
        taskActivity: task?.activity
      });

      // Clawback points if they were already awarded
      const currentPointsEarned = dailyTask.pointsEarned || 0;
      
      if (currentPointsEarned > 0) {
        // Log points clawback
        businessLogger.pointsOperation(dailyTask.userId, 'POINTS_CLAWBACK', -currentPointsEarned, {
          rejectedBy: req.user.id,
          taskId: dailyTask.taskId,
          dailyTaskId: dailyTask._id.toString(),
          reason: 'Task rejected by parent',
          approvalNotes
        });
        // Use transaction to ensure atomic operations for clawback
        const session = mongodb['client'].startSession();
        try {
          await session.withTransaction(async () => {
            const task = await collections.tasks.findOne({ _id: new ObjectId(dailyTask.taskId) });
            const activity = task?.activity || 'general';
            const today = new Date().toISOString().split('T')[0];
            
            // Get user points limit record
            const userPointsLimit = await collections.userPointsLimits.findOne({
              userId: dailyTask.userId,
              date: today,
            });

            if (userPointsLimit) {
              const currentActivityPoints = userPointsLimit.activityPoints[activity] || 0;
              const newActivityPoints = Math.max(0, currentActivityPoints - currentPointsEarned);
              const newTotalDailyPoints = Math.max(0, (userPointsLimit.totalDailyPoints || 0) - currentPointsEarned);

              // Update user points limit
              await collections.userPointsLimits.updateOne(
                { userId: dailyTask.userId, date: today },
                {
                  $set: {
                    [`activityPoints.${activity}`]: newActivityPoints,
                    totalDailyPoints: newTotalDailyPoints,
                    updatedAt: new Date(),
                  }
                },
                { session }
              );
            }
            
            // Deduct points from user's total
            await collections.users.updateOne(
              { _id: new ObjectId(dailyTask.userId) },
              { 
                $inc: { points: -currentPointsEarned },
                $set: { updatedAt: new Date() }
              },
              { session }
            );
          });
        } finally {
          await session.endSession();
        }
        
        // Record the clawback in updates
        updates.pointsClawback = currentPointsEarned;
        updates.pointsEarned = 0; // Reset points to 0 after clawback
        
        // Create transaction record for clawback
        const task = await collections.tasks.findOne({ _id: new ObjectId(dailyTask.taskId) });
        await createPointsTransaction(
          dailyTask.userId,
          'clawback',
          currentPointsEarned,
          `Points clawed back due to task rejection: ${task?.title || 'Unknown Task'}`,
          {
            dailyTaskId,
            approvedBy: req.user.id,
            activityType: task?.activity || 'general',
            originalPoints: currentPointsEarned,
            taskTitle: task?.title,
            approvalNotes: approvalNotes || 'Task rejected by parent'
          }
        );
      }
      
      // Revert the task status to allow re-submission
      updates.status = 'in_progress';
    }

    await collections.dailyTasks.updateOne(
      { _id: new ObjectId(dailyTaskId) },
      { $set: updates }
    );

    // Get updated task for response
    const updatedTask = await collections.dailyTasks.findOne({ _id: new ObjectId(dailyTaskId) });

    res.status(200).json({
      success: true,
      data: { 
        task: { 
          ...updatedTask, 
          id: updatedTask._id.toString() 
        } 
      },
      message: `Task ${action}d successfully`,
    });
  } catch (error: any) {
    console.error('Approve task error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to approve task',
    });
  }
};

// Helper function to calculate medal multiplier
function calculateMedalMultiplier(medals: { bronze: boolean; silver: boolean; gold: boolean; diamond: boolean }): number {
  let multiplier = 1;
  
  // Stack multipliers (multiply together)
  if (medals.bronze) multiplier *= 1.1;
  if (medals.silver) multiplier *= 1.2;
  if (medals.gold) multiplier *= 1.3;
  if (medals.diamond) multiplier *= 1.4;
  
  return multiplier;
}

// Helper function to check and update user streak
async function checkAndUpdateStreak(userId: string, date: string): Promise<void> {
  try {
    // Get all daily tasks for the user on this date
    const dailyTasks = await collections.dailyTasks.find({
      userId: userId,
      date: date,
    }).toArray();

    // Check if all tasks are completed (no tasks with status 'planned', 'in_progress', or 'skipped')
    const allCompleted = dailyTasks.length > 0 && dailyTasks.every((task: any) => task.status === 'completed');
    
    const user = await collections.users.findOne({ _id: new ObjectId(userId) });
    if (!user) return;

    if (allCompleted) {
      // Increment streak
      const newStreak = (user.currentStreak || 0) + 1;
      
      // Check for medal unlocks
      const medals = user.medals || { bronze: false, silver: false, gold: false, diamond: false };
      let newMedals = { ...medals };
      
      // Check medal conditions
      if (newStreak >= 60 && !medals.diamond) {
        newMedals.diamond = true;
      }
      if (newStreak >= 30 && !medals.gold) {
        newMedals.gold = true;
      }
      if (newStreak >= 14 && !medals.silver) {
        newMedals.silver = true;
      }
      if (newStreak >= 7 && !medals.bronze) {
        newMedals.bronze = true;
      }
      
      // Update user with new streak and medals
      await collections.users.updateOne(
        { _id: new ObjectId(userId) },
        {
          $set: {
            currentStreak: newStreak,
            medals: newMedals,
            updatedAt: new Date(),
          }
        }
      );
      
      console.log(`User ${userId} streak updated to ${newStreak} for date ${date}`);
    } else {
      // Reset streak if not all tasks completed
      await collections.users.updateOne(
        { _id: new ObjectId(userId) },
        {
          $set: {
            currentStreak: 0,
            updatedAt: new Date(),
          }
        }
      );
      
      console.log(`User ${userId} streak reset to 0 for date ${date}`);
    }
  } catch (error) {
    console.error('Error updating streak:', error);
  }
}

// Enhanced Task Planning Functions

/**
 * Get weekly schedule for a user
 */
export const getWeeklySchedule = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { weekStart } = req.query;
    let startDateStr: string;
    let endDateStr: string;
    
    if (weekStart) {
      // Use provided week start and calculate end
      const providedStart = new Date(weekStart as string);
      const weekInfo = getCurrentWeek(providedStart);
      startDateStr = weekInfo.weekStart;
      endDateStr = weekInfo.weekEnd;
    } else {
      // Use unified current week calculation
      const weekInfo = getCurrentWeek();
      startDateStr = weekInfo.weekStart;
      endDateStr = weekInfo.weekEnd;
    }

    // Get all daily tasks for the week
    const dailyTasks = await collections.dailyTasks
      .find({
        userId: req.user.id,
        date: { $gte: startDateStr, $lte: endDateStr }
      })
      .sort({ date: 1, plannedTime: 1 })
      .toArray();

    // Calculate statistics
    const totalPlannedTasks = dailyTasks.length;
    const totalCompletedTasks = dailyTasks.filter((task: any) => task.status === 'completed').length;
    const totalPointsEarned = dailyTasks.reduce((sum: number, task: any) => sum + (task.pointsEarned || 0), 0);
    const completionRate = totalPlannedTasks > 0 ? totalCompletedTasks / totalPlannedTasks : 0;

    const weeklySchedule = {
      userId: req.user.id,
      weekStart: startDateStr,
      tasks: dailyTasks.map((task: any) => ({ ...task, id: task._id.toString() })),
      totalPlannedTasks,
      totalCompletedTasks,
      totalPointsEarned,
      completionRate
    };

    res.status(200).json({
      success: true,
      data: { weeklySchedule },
    });
  } catch (error: any) {
    console.error('Get weekly schedule error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get weekly schedule',
    });
  }
};

/**
 * Check for scheduling conflicts when planning tasks
 */
export const checkSchedulingConflicts = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { date, plannedTime, estimatedTime, excludeTaskId } = req.query;

    if (!date || !plannedTime || !estimatedTime) {
      return res.status(400).json({
        success: false,
        error: 'Date, planned time, and estimated time are required',
      });
    }

    const [hours, minutes] = (plannedTime as string).split(':').map(Number);
    const startTime = new Date();
    startTime.setHours(hours, minutes, 0, 0);
    
    const endTime = new Date(startTime);
    endTime.setMinutes(startTime.getMinutes() + parseInt(estimatedTime as string));

    // Find conflicting tasks
    const query: any = {
      userId: req.user.id,
      date: date as string,
      plannedTime: { $exists: true },
      status: { $ne: 'skipped' }
    };

    if (excludeTaskId) {
      query._id = { $ne: new ObjectId(excludeTaskId as string) };
    }

    const existingTasks = await collections.dailyTasks.find(query).toArray();
    
    const conflicts: any[] = [];
    
    for (const existingTask of existingTasks) {
      if (!existingTask.plannedTime) continue;
      
      const [existingHours, existingMinutes] = existingTask.plannedTime.split(':').map(Number);
      const existingStart = new Date();
      existingStart.setHours(existingHours, existingMinutes, 0, 0);
      
      // Get task details for estimated time
      const taskDetails = await collections.tasks.findOne({ _id: new ObjectId(existingTask.taskId) });
      const existingEnd = new Date(existingStart);
      existingEnd.setMinutes(existingStart.getMinutes() + (taskDetails?.estimatedTime || 30));
      
      // Check for overlap
      if (startTime < existingEnd && endTime > existingStart) {
        conflicts.push({
          taskId: existingTask.taskId,
          title: taskDetails?.title || 'Unknown Task',
          plannedTime: existingTask.plannedTime,
          estimatedTime: taskDetails?.estimatedTime || 30
        });
      }
    }

    const suggestions = conflicts.length > 0 ? [
      {
        action: 'reschedule',
        details: 'Consider scheduling this task for a different time slot'
      },
      {
        action: 'adjust_time',
        details: 'Reduce the estimated time or split into shorter sessions'
      },
      {
        action: 'change_date',
        details: 'Move one of the conflicting tasks to another day'
      }
    ] : [];

    res.status(200).json({
      success: true,
      data: {
        hasConflicts: conflicts.length > 0,
        conflict: conflicts.length > 0 ? {
          date: date as string,
          timeSlot: `${plannedTime}-${endTime.getHours()}:${endTime.getMinutes().toString().padStart(2, '0')}`,
          conflictingTasks: conflicts,
          suggestions
        } : null
      },
    });
  } catch (error: any) {
    console.error('Check scheduling conflicts error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to check scheduling conflicts',
    });
  }
};

/**
 * Batch approve/reject multiple tasks
 */
export const batchApproveTask = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    if (req.user.role !== 'parent') {
      return res.status(403).json({
        success: false,
        error: 'Only parents can approve tasks',
      });
    }

    const { dailyTaskIds, action, approvalNotes, bonusPoints } = req.body;

    if (!dailyTaskIds || !Array.isArray(dailyTaskIds) || dailyTaskIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Daily task IDs array is required',
      });
    }

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Action must be either approve or reject',
      });
    }

    const results = [];
    
    for (const dailyTaskId of dailyTaskIds) {
      try {
        const dailyTask = await collections.dailyTasks.findOne({ _id: new ObjectId(dailyTaskId) });
        
        if (!dailyTask) {
          results.push({ dailyTaskId, success: false, error: 'Task not found' });
          continue;
        }

        // Verify this task belongs to one of the parent's children
        if (!req.user.children?.includes(dailyTask.userId)) {
          results.push({ dailyTaskId, success: false, error: 'Unauthorized' });
          continue;
        }

        const updates: any = {
          approvalStatus: action === 'approve' ? 'approved' : 'rejected',
          approvedBy: req.user.id,
          approvedAt: new Date(),
          approvalNotes: approvalNotes || '',
          updatedAt: new Date(),
        };

        // Apply bonus points if approving
        if (action === 'approve' && bonusPoints && bonusPoints[dailyTaskId]) {
          const bonus = parseInt(bonusPoints[dailyTaskId]);
          if (bonus > 0) {
            const currentPoints = dailyTask.pointsEarned || 0;
            updates.pointsEarned = currentPoints + bonus;
            updates.bonusPoints = bonus;
            
            // Add bonus points to user's total
            await collections.users.updateOne(
              { _id: new ObjectId(dailyTask.userId) },
              { 
                $inc: { points: bonus },
                $set: { updatedAt: new Date() }
              }
            );
          }
        }

        // If rejecting, handle points clawback and task status
        if (action === 'reject') {
          // Clawback points if they were already awarded
          const currentPointsEarned = dailyTask.pointsEarned || 0;
          
          if (currentPointsEarned > 0) {
            // Use transaction to ensure atomic operations for clawback
            const session = mongodb['client'].startSession();
            try {
              await session.withTransaction(async () => {
                const task = await collections.tasks.findOne({ _id: new ObjectId(dailyTask.taskId) });
                const activity = task?.activity || 'general';
                const today = new Date().toISOString().split('T')[0];
                
                // Get user points limit record
                const userPointsLimit = await collections.userPointsLimits.findOne({
                  userId: dailyTask.userId,
                  date: today,
                });

                if (userPointsLimit) {
                  const currentActivityPoints = userPointsLimit.activityPoints[activity] || 0;
                  const newActivityPoints = Math.max(0, currentActivityPoints - currentPointsEarned);
                  const newTotalDailyPoints = Math.max(0, (userPointsLimit.totalDailyPoints || 0) - currentPointsEarned);

                  // Update user points limit
                  await collections.userPointsLimits.updateOne(
                    { userId: dailyTask.userId, date: today },
                    {
                      $set: {
                        [`activityPoints.${activity}`]: newActivityPoints,
                        totalDailyPoints: newTotalDailyPoints,
                        updatedAt: new Date(),
                      }
                    },
                    { session }
                  );
                }
                
                // Deduct points from user's total
                await collections.users.updateOne(
                  { _id: new ObjectId(dailyTask.userId) },
                  { 
                    $inc: { points: -currentPointsEarned },
                    $set: { updatedAt: new Date() }
                  },
                  { session }
                );
              });
            } finally {
              await session.endSession();
            }
            
            // Record the clawback in updates
            updates.pointsClawback = currentPointsEarned;
            updates.pointsEarned = 0; // Reset points to 0 after clawback
            
            // Create transaction record for clawback
            const task = await collections.tasks.findOne({ _id: new ObjectId(dailyTask.taskId) });
            await createPointsTransaction(
              dailyTask.userId,
              'clawback',
              currentPointsEarned,
              `Points clawed back due to task rejection: ${task?.title || 'Unknown Task'}`,
              {
                dailyTaskId,
                approvedBy: req.user.id,
                activityType: task?.activity || 'general',
                originalPoints: currentPointsEarned,
                taskTitle: task?.title,
                approvalNotes: approvalNotes || 'Task rejected by parent'
              }
            );
          }
          
          // Revert the task status to allow re-submission
          updates.status = 'in_progress';
        }

        await collections.dailyTasks.updateOne(
          { _id: new ObjectId(dailyTaskId) },
          { $set: updates }
        );

        results.push({ dailyTaskId, success: true });
      } catch (error: any) {
        results.push({ dailyTaskId, success: false, error: error.message });
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    res.status(200).json({
      success: true,
      data: {
        results,
        summary: {
          total: dailyTaskIds.length,
          successful,
          failed,
          action
        }
      },
      message: `Batch ${action}: ${successful} successful, ${failed} failed`,
    });
  } catch (error: any) {
    console.error('Batch approve task error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to batch approve tasks',
    });
  }
};

/**
 * Helper function to create a points transaction record
 */
async function createPointsTransaction(
  userId: string,
  type: 'earn' | 'clawback' | 'bonus' | 'redemption',
  amount: number,
  reason: string,
  metadata?: {
    dailyTaskId?: string;
    approvedBy?: string;
    activityType?: string;
    originalPoints?: number;
    taskTitle?: string;
    approvalNotes?: string;
  }
): Promise<string> {
  try {
    // Get current user points for transaction record
    const user = await collections.users.findOne({ _id: new ObjectId(userId) });
    const previousTotal = user?.points || 0;
    const newTotal = previousTotal + (type === 'clawback' ? -amount : amount);

    const transactionData: Omit<PointsTransaction, 'id'> = {
      userId,
      dailyTaskId: metadata?.dailyTaskId,
      type,
      amount: type === 'clawback' ? -amount : amount,
      reason,
      approvedBy: metadata?.approvedBy,
      previousTotal,
      newTotal,
      metadata,
      createdAt: new Date(),
    };

    const result = await collections.pointsTransactions.insertOne(transactionData);
    return result.insertedId.toString();
  } catch (error) {
    console.error('Error creating points transaction:', error);
    throw error;
  }
}

/**
 * Get points transaction history for a user
 */
export const getPointsTransactionHistory = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { userId, type, startDate, endDate, limit = 50, offset = 0 } = req.query;
    const targetUserId = (userId as string) || req.user.id;

    // Check if user can access the requested user's data
    if (targetUserId !== req.user.id) {
      if (req.user.role !== 'parent' || !req.user.children?.includes(targetUserId)) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
        });
      }
    }

    let query: any = { userId: targetUserId };

    // Apply filters
    if (type && type !== 'all') {
      query.type = type;
    }
    if (startDate && endDate) {
      query.createdAt = { 
        $gte: new Date(startDate as string), 
        $lte: new Date(endDate as string) 
      };
    } else if (startDate) {
      query.createdAt = { $gte: new Date(startDate as string) };
    } else if (endDate) {
      query.createdAt = { $lte: new Date(endDate as string) };
    }

    const transactions = await collections.pointsTransactions
      .find(query)
      .sort({ createdAt: -1 })
      .skip(parseInt(offset as string))
      .limit(parseInt(limit as string))
      .toArray();

    const total = await collections.pointsTransactions.countDocuments(query);

    // Calculate summary statistics
    const allTransactions = await collections.pointsTransactions.find({ userId: targetUserId }).toArray();
    
    const earnedTransactions = allTransactions.filter((t: any) => t.type === 'earn');
    const bonusTransactions = allTransactions.filter((t: any) => t.type === 'bonus');
    const clawbackTransactions = allTransactions.filter((t: any) => t.type === 'clawback');
    const redemptionTransactions = allTransactions.filter((t: any) => t.type === 'redemption');
    
    const summary = {
      totalTransactions: allTransactions.length,
      totalEarned: earnedTransactions.reduce((sum: number, t: any) => sum + t.amount, 0),
      totalBonus: bonusTransactions.reduce((sum: number, t: any) => sum + t.amount, 0),
      totalClawback: Math.abs(clawbackTransactions.reduce((sum: number, t: any) => sum + t.amount, 0)),
      totalRedemption: Math.abs(redemptionTransactions.reduce((sum: number, t: any) => sum + t.amount, 0)),
    };

    const transactionsWithId = transactions.map((transaction: any) => ({
      ...transaction,
      id: transaction._id.toString(),
    }));

    res.status(200).json({
      success: true,
      data: {
        transactions: transactionsWithId,
        summary,
        pagination: {
          total,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          hasMore: (parseInt(offset as string) + parseInt(limit as string)) < total,
        }
      },
    });
  } catch (error: any) {
    console.error('Get points transaction history error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get points transaction history',
    });
  }
};