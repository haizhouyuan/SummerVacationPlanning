import express from 'express';
import cors from 'cors';
import { mockCollections } from './config/mockDb';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Mock collections for demo
const collections = {
  users: mockCollections,
  tasks: mockCollections,
  dailyTasks: mockCollections,
  redemptions: mockCollections
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Demo server is running'
  });
});

// Mock API endpoints for demonstration
app.get('/api/auth/me', (req, res) => {
  res.json({
    success: true,
    data: {
      user: {
        id: 'student-1',
        email: 'student@test.com',
        displayName: 'Test Student',
        role: 'student',
        points: 50
      }
    }
  });
});

app.get('/api/tasks', (req, res) => {
  res.json({
    success: true,
    data: {
      tasks: collections.tasks.tasks
    }
  });
});

app.get('/api/daily-tasks', (req, res) => {
  const { date } = req.query;
  res.json({
    success: true,
    data: {
      dailyTasks: collections.dailyTasks.dailyTasks.map(task => ({
        ...task,
        task: collections.tasks.tasks.find(t => t.id === task.taskId)
      }))
    }
  });
});

app.post('/api/daily-tasks', (req, res) => {
  const { taskId, date, notes } = req.body;
  const newDailyTask = {
    id: Math.random().toString(),
    userId: 'student-1',
    taskId,
    date,
    status: 'planned',
    pointsEarned: 0,
    notes,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  collections.dailyTasks.dailyTasks.push(newDailyTask as any);
  
  res.status(201).json({
    success: true,
    data: { dailyTask: newDailyTask },
    message: 'Daily task planned successfully'
  });
});

app.put('/api/daily-tasks/:dailyTaskId', (req, res) => {
  const { dailyTaskId } = req.params;
  const { status, evidenceText, evidenceMedia } = req.body;
  
  const taskIndex = collections.dailyTasks.dailyTasks.findIndex(task => task.id === dailyTaskId);
  if (taskIndex === -1) {
    return res.status(404).json({ success: false, error: 'Task not found' });
  }

  const task = collections.dailyTasks.dailyTasks[taskIndex];
  task.status = status;
  if (evidenceText) task.evidence = [{ type: 'text', content: evidenceText, timestamp: new Date() }];
  if (evidenceMedia) task.evidence = [...(task.evidence || []), { type: 'photo', content: evidenceMedia, timestamp: new Date() }];
  if (status === 'completed') {
    task.completedAt = new Date();
    task.approvalStatus = evidenceText || evidenceMedia ? 'pending' : 'approved';
    task.pointsEarned = 15; // Mock points
  }

  res.json({
    success: true,
    data: { dailyTask: task },
    message: 'Task updated successfully'
  });
});

// Parent approval endpoints
app.get('/api/daily-tasks/pending-approval', (req, res) => {
  const pendingTasks = collections.dailyTasks.dailyTasks
    .filter(task => task.approvalStatus === 'pending')
    .map(task => ({
      id: task.id,
      studentId: task.userId,
      studentName: 'Test Student',
      task: collections.tasks.tasks.find(t => t.id === task.taskId),
      evidenceText: task.evidence?.find(e => e.type === 'text')?.content || '',
      evidenceMedia: task.evidence?.filter(e => e.type !== 'text').map(e => e.content) || [],
      notes: task.notes || '',
      submittedAt: task.completedAt,
      status: task.approvalStatus,
      pointsEarned: task.pointsEarned
    }));

  res.json({
    success: true,
    data: { tasks: pendingTasks }
  });
});

app.put('/api/daily-tasks/:dailyTaskId/approve', (req, res) => {
  const { dailyTaskId } = req.params;
  const { action, approvalNotes, bonusPoints } = req.body;
  
  const taskIndex = collections.dailyTasks.dailyTasks.findIndex(task => task.id === dailyTaskId);
  if (taskIndex === -1) {
    return res.status(404).json({ success: false, error: 'Task not found' });
  }

  const task = collections.dailyTasks.dailyTasks[taskIndex];
  task.approvalStatus = action === 'approve' ? 'approved' : 'rejected';
  task.approvedAt = new Date();
  task.approvalNotes = approvalNotes;
  if (bonusPoints && action === 'approve') {
    task.bonusPoints = bonusPoints;
    task.pointsEarned = (task.pointsEarned || 0) + bonusPoints;
  }

  res.json({
    success: true,
    data: { task },
    message: `Task ${action}d successfully`
  });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Demo server running on port ${PORT}`);
  console.log(`📍 API endpoints available at http://localhost:${PORT}/api`);
  console.log(`❤️  Health check: http://localhost:${PORT}/api/health`);
});

export default app;