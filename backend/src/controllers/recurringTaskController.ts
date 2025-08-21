import { Request, Response } from 'express';
import { RecurringTaskService } from '../services/recurringTaskService';
import { AuthRequest } from '../middleware/mongoAuth';

/**
 * Generate recurring tasks (can be called manually or by cron job)
 */
export const generateRecurringTasks = async (req: Request, res: Response) => {
  try {
    const { daysAhead = 7 } = req.query;
    
    await RecurringTaskService.generateRecurringTasks(Number(daysAhead));
    
    res.status(200).json({
      success: true,
      message: `Successfully generated recurring tasks for the next ${daysAhead} days`,
    });
  } catch (error: any) {
    console.error('Generate recurring tasks error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate recurring tasks',
    });
  }
};

/**
 * Clean up old recurring tasks
 */
export const cleanupRecurringTasks = async (req: Request, res: Response) => {
  try {
    const { keepDays = 30 } = req.query;
    
    await RecurringTaskService.cleanupOldRecurringTasks(Number(keepDays));
    
    res.status(200).json({
      success: true,
      message: `Successfully cleaned up recurring tasks older than ${keepDays} days`,
    });
  } catch (error: any) {
    console.error('Cleanup recurring tasks error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to cleanup recurring tasks',
    });
  }
};

/**
 * Update a recurring task pattern
 */
export const updateRecurringPattern = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { taskId } = req.params;
    const { updates, applyToFuture = false } = req.body;

    await RecurringTaskService.updateRecurringPattern(taskId, updates, applyToFuture);
    
    res.status(200).json({
      success: true,
      message: 'Successfully updated recurring pattern',
    });
  } catch (error: any) {
    console.error('Update recurring pattern error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update recurring pattern',
    });
  }
};

/**
 * Get recurring task statistics for authenticated user
 */
export const getRecurringTaskStats = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { days = 30 } = req.query;
    
    const stats = await RecurringTaskService.getRecurringTaskStats(req.user.id, Number(days));
    
    res.status(200).json({
      success: true,
      data: { stats },
    });
  } catch (error: any) {
    console.error('Get recurring task stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get recurring task stats',
    });
  }
};

/**
 * Get all recurring task patterns for authenticated user
 */
export const getRecurringPatterns = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { collections } = await import('../config/mongodb');
    
    const recurringTasks = await collections.dailyTasks.find({
      userId: req.user.id,
      isRecurring: true,
      recurringPattern: { $exists: true }
    }).toArray();

    // Group by taskId to show unique patterns
    const patterns = new Map();
    
    for (const task of recurringTasks) {
      if (!patterns.has(task.taskId)) {
        patterns.set(task.taskId, {
          taskId: task.taskId,
          task: null, // Will be populated if needed
          recurringPattern: task.recurringPattern,
          priority: task.priority,
          timePreference: task.timePreference,
          plannedTime: task.plannedTime,
          examples: []
        });
      }
      
      patterns.get(task.taskId).examples.push({
        date: task.date,
        status: task.status,
        pointsEarned: task.pointsEarned
      });
    }
    
    res.status(200).json({
      success: true,
      data: { 
        patterns: Array.from(patterns.values()),
        total: patterns.size 
      },
    });
  } catch (error: any) {
    console.error('Get recurring patterns error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get recurring patterns',
    });
  }
};