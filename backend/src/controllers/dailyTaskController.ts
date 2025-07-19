import { Response } from 'express';
import { collections } from '../config/mongodb';
import { DailyTask, Task } from '../types';
import { AuthRequest } from '../middleware/mongoAuth';
import { ObjectId } from 'mongodb';

export const createDailyTask = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { taskId, date, plannedTime, notes } = req.body;

    // Validate required fields
    if (!taskId || !date) {
      return res.status(400).json({
        success: false,
        error: 'Task ID and date are required',
      });
    }

    // Check if task exists
    const task = await collections.tasks.findOne({ _id: new ObjectId(taskId) });
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
      notes,
      pointsEarned: 0,
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
      
      // If completing task, calculate points
      if (status === 'completed') {
        const task = await collections.tasks.findOne({ _id: new ObjectId(dailyTask.taskId) });
        if (task) {
          const basePoints = task.points;
          
          // Calculate bonus points for extra content (e.g., diary word count)
          let bonusPoints = 0;
          if (evidence || evidenceText || evidenceMedia) {
            bonusPoints = calculateBonusPoints(task, evidence, evidenceText, evidenceMedia);
          }
          
          // Apply medal multipliers
          const multiplier = calculateMedalMultiplier(req.user.medals || { bronze: false, silver: false, gold: false, diamond: false });
          const totalPoints = Math.round((basePoints + bonusPoints) * multiplier);
          updates.pointsEarned = totalPoints;
          updates.completedAt = new Date();
          
          // Update user's total points
          await collections.users.updateOne(
            { _id: new ObjectId(req.user.id) },
            { 
              $inc: { points: totalPoints },
              $set: { updatedAt: new Date() }
            }
          );
          
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
    
    res.status(200).json({
      success: true,
      data: { dailyTask: { ...updatedDailyTask, id: updatedDailyTask._id.toString() } },
      message: 'Daily task updated successfully',
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

    const updates: any = {
      approvalStatus: action === 'approve' ? 'approved' : 'rejected',
      approvedBy: req.user.id,
      approvedAt: new Date(),
      approvalNotes: approvalNotes || '',
      updatedAt: new Date(),
    };

    // If approving and bonus points are provided, add them
    if (action === 'approve' && bonusPoints && bonusPoints > 0) {
      const currentPoints = dailyTask.pointsEarned || 0;
      updates.pointsEarned = currentPoints + parseInt(bonusPoints);
      
      // Add bonus points to user's total
      await collections.users.updateOne(
        { _id: new ObjectId(dailyTask.userId) },
        { 
          $inc: { points: parseInt(bonusPoints) },
          $set: { updatedAt: new Date() }
        }
      );
    }

    // If rejecting, we might want to deduct points or mark task as incomplete
    if (action === 'reject') {
      // Optionally revert the task status
      updates.status = 'in_progress'; // or keep as completed but rejected
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