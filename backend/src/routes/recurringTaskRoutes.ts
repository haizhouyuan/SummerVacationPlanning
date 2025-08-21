import express from 'express';
import { authenticateToken } from '../middleware/mongoAuth';
import {
  generateRecurringTasks,
  cleanupRecurringTasks,
  updateRecurringPattern,
  getRecurringTaskStats,
  getRecurringPatterns
} from '../controllers/recurringTaskController';

const router = express.Router();

// Generate recurring tasks (can be called manually or by cron job)
// This endpoint could be protected by an API key in production
router.post('/generate', generateRecurringTasks);

// Cleanup old recurring tasks
router.post('/cleanup', cleanupRecurringTasks);

// User-specific endpoints (require authentication)
router.get('/patterns', authenticateToken, getRecurringPatterns);
router.get('/stats', authenticateToken, getRecurringTaskStats);
router.put('/patterns/:taskId', authenticateToken, updateRecurringPattern);

export default router;