import { collections } from '../config/mongodb';
import { ObjectId } from 'mongodb';
import { DailyTask } from '../types';

export class RecurringTaskService {
  /**
   * Generate recurring tasks for the next N days
   * @param daysAhead Number of days to generate tasks for (default: 7)
   */
  static async generateRecurringTasks(daysAhead: number = 7): Promise<void> {
    console.log(`Generating recurring tasks for the next ${daysAhead} days...`);
    
    try {
      // Get all active recurring daily tasks
      const recurringTasks = await collections.dailyTasks.find({
        isRecurring: true,
        recurringPattern: { $exists: true },
        status: { $ne: 'skipped' } // Don't generate for skipped recurring tasks
      }).toArray();

      console.log(`Found ${recurringTasks.length} recurring task patterns`);

      const today = new Date();
      const createdTasks = [];

      for (const recurringTask of recurringTasks) {
        const pattern = recurringTask.recurringPattern;
        if (!pattern) continue;

        // Generate tasks for each day in the range
        for (let dayOffset = 1; dayOffset <= daysAhead; dayOffset++) {
          const targetDate = new Date(today);
          targetDate.setDate(today.getDate() + dayOffset);
          const targetDateString = targetDate.toISOString().split('T')[0];

          // Check if we should generate a task for this date
          if (!this.shouldGenerateTaskForDate(targetDate, pattern)) {
            continue;
          }

          // Check if task already exists for this date
          const existingTask = await collections.dailyTasks.findOne({
            userId: recurringTask.userId,
            taskId: recurringTask.taskId,
            date: targetDateString,
          });

          if (existingTask) {
            continue; // Skip if task already exists
          }

          // Create new daily task based on the recurring pattern
          const newDailyTask: Omit<DailyTask, 'id'> = {
            taskId: recurringTask.taskId,
            userId: recurringTask.userId,
            date: targetDateString,
            status: 'planned',
            priority: recurringTask.priority || 'medium',
            timePreference: recurringTask.timePreference,
            isRecurring: true,
            recurringPattern: pattern,
            plannedTime: recurringTask.plannedTime, // Keep same time if set
            plannedEndTime: recurringTask.plannedEndTime,
            reminderTime: recurringTask.reminderTime,
            notes: `自动生成的重复任务 (基于 ${recurringTask.date})`,
            planningNotes: recurringTask.planningNotes,
            pointsEarned: 0,
            approvalStatus: 'pending',
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const result = await collections.dailyTasks.insertOne(newDailyTask);
          createdTasks.push({
            id: result.insertedId.toString(),
            ...newDailyTask,
          });

          console.log(`Created recurring task for user ${recurringTask.userId} on ${targetDateString}`);
        }
      }

      console.log(`Successfully generated ${createdTasks.length} recurring tasks`);
    } catch (error) {
      console.error('Error generating recurring tasks:', error);
      throw error;
    }
  }

  /**
   * Check if a task should be generated for a specific date based on recurring pattern
   */
  private static shouldGenerateTaskForDate(
    targetDate: Date,
    pattern: NonNullable<DailyTask['recurringPattern']>
  ): boolean {
    switch (pattern.type) {
      case 'daily':
        return true; // Generate every day

      case 'weekly':
        if (!pattern.daysOfWeek || pattern.daysOfWeek.length === 0) {
          return false;
        }
        const dayOfWeek = targetDate.getDay(); // 0=Sunday, 1=Monday, etc.
        return pattern.daysOfWeek.includes(dayOfWeek);

      case 'custom':
        if (!pattern.interval || pattern.interval <= 0) {
          return false;
        }
        // For custom intervals, we need a reference date to calculate from
        // For now, generate every N days from today
        const today = new Date();
        const diffDays = Math.floor((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays % pattern.interval === 0;

      default:
        return false;
    }
  }

  /**
   * Clean up completed or old recurring task instances (keep system tidy)
   * @param keepDays Number of days of old tasks to keep (default: 30)
   */
  static async cleanupOldRecurringTasks(keepDays: number = 30): Promise<void> {
    console.log(`Cleaning up recurring tasks older than ${keepDays} days...`);
    
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - keepDays);
      const cutoffDateString = cutoffDate.toISOString().split('T')[0];

      const result = await collections.dailyTasks.deleteMany({
        isRecurring: true,
        status: { $in: ['completed', 'skipped'] },
        date: { $lt: cutoffDateString }
      });

      console.log(`Cleaned up ${result.deletedCount} old recurring tasks`);
    } catch (error) {
      console.error('Error cleaning up recurring tasks:', error);
      throw error;
    }
  }

  /**
   * Update a recurring task pattern and optionally apply to future instances
   * @param originalTaskId The ID of the original recurring task
   * @param updates The updates to apply
   * @param applyToFuture Whether to apply changes to future instances
   */
  static async updateRecurringPattern(
    originalTaskId: string,
    updates: Partial<DailyTask>,
    applyToFuture: boolean = false
  ): Promise<void> {
    console.log(`Updating recurring pattern for task ${originalTaskId}`);
    
    try {
      // Update the original task
      await collections.dailyTasks.updateOne(
        { _id: new ObjectId(originalTaskId) },
        {
          $set: {
            ...updates,
            updatedAt: new Date()
          }
        }
      );

      if (applyToFuture) {
        // Get the original task to find related future instances
        const originalTask = await collections.dailyTasks.findOne({ _id: new ObjectId(originalTaskId) });
        if (!originalTask) return;

        const today = new Date().toISOString().split('T')[0];
        
        // Update future instances of this recurring task
        await collections.dailyTasks.updateMany(
          {
            userId: originalTask.userId,
            taskId: originalTask.taskId,
            date: { $gt: today },
            isRecurring: true,
            status: 'planned' // Only update planned tasks, not completed ones
          },
          {
            $set: {
              ...updates,
              updatedAt: new Date()
            }
          }
        );

        console.log(`Updated future instances of recurring task ${originalTaskId}`);
      }
    } catch (error) {
      console.error('Error updating recurring pattern:', error);
      throw error;
    }
  }

  /**
   * Get recurring task statistics for a user
   */
  static async getRecurringTaskStats(userId: string, days: number = 30) {
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + days);
      
      const startDateString = startDate.toISOString().split('T')[0];
      const endDateString = endDate.toISOString().split('T')[0];

      const stats = await collections.dailyTasks.aggregate([
        {
          $match: {
            userId,
            isRecurring: true,
            date: { $gte: startDateString, $lte: endDateString }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalPoints: { $sum: '$pointsEarned' }
          }
        }
      ]).toArray();

      return {
        period: `${startDateString} to ${endDateString}`,
        stats
      };
    } catch (error) {
      console.error('Error getting recurring task stats:', error);
      throw error;
    }
  }
}

export default RecurringTaskService;