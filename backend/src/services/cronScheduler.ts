import { RecurringTaskService } from './recurringTaskService';

/**
 * Simple cron-like scheduler for recurring tasks
 * In production, this should be replaced with a proper cron job or task scheduler
 */
export class CronScheduler {
  private static intervals: NodeJS.Timeout[] = [];

  /**
   * Start the recurring task generation scheduler
   * This will run daily at midnight to generate tasks for the next week
   */
  static startRecurringTaskScheduler(): void {
    console.log('Starting recurring task scheduler...');

    // Calculate time until next midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    // Schedule first run at midnight, then every 24 hours
    const initialTimeout = setTimeout(() => {
      this.generateRecurringTasks();
      
      // Set up daily recurring generation
      const dailyInterval = setInterval(() => {
        this.generateRecurringTasks();
      }, 24 * 60 * 60 * 1000); // 24 hours
      
      this.intervals.push(dailyInterval);
    }, msUntilMidnight);

    this.intervals.push(initialTimeout as any);

    // Also run immediately on startup to catch any missed generations
    setTimeout(() => {
      this.generateRecurringTasks();
    }, 10000); // Wait 10 seconds after startup

    console.log(`Recurring task scheduler started. Next run in ${Math.round(msUntilMidnight / 1000 / 60)} minutes.`);
  }

  /**
   * Generate recurring tasks and handle cleanup
   */
  private static async generateRecurringTasks(): Promise<void> {
    try {
      console.log('🔄 Running scheduled recurring task generation...');
      
      // Generate tasks for the next 7 days
      await RecurringTaskService.generateRecurringTasks(7);
      
      // Clean up old completed tasks (keep last 30 days)
      await RecurringTaskService.cleanupOldRecurringTasks(30);
      
      console.log('✅ Scheduled recurring task generation completed');
    } catch (error) {
      console.error('❌ Error in scheduled recurring task generation:', error);
    }
  }

  /**
   * Stop all schedulers (useful for graceful shutdown)
   */
  static stopScheduler(): void {
    console.log('Stopping recurring task scheduler...');
    this.intervals.forEach(interval => {
      clearTimeout(interval);
      clearInterval(interval);
    });
    this.intervals = [];
  }

  /**
   * Manual trigger for immediate generation (useful for testing)
   */
  static async runNow(): Promise<void> {
    await this.generateRecurringTasks();
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, stopping scheduler...');
  CronScheduler.stopScheduler();
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, stopping scheduler...');
  CronScheduler.stopScheduler();
});

export default CronScheduler;