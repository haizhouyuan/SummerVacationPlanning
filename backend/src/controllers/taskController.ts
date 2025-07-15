import { Response } from 'express';
import { collections } from '../config/firebase';
import { Task, TaskFilters } from '../types';
import { AuthRequest } from '../middleware/auth';

export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const {
      title,
      description,
      category,
      difficulty,
      estimatedTime,
      points,
      requiresEvidence,
      evidenceTypes,
      tags,
      isPublic,
    } = req.body;

    // Validate required fields
    if (!title || !description || !category || !difficulty || !estimatedTime || !points) {
      return res.status(400).json({
        success: false,
        error: 'Title, description, category, difficulty, estimated time, and points are required',
      });
    }

    // Calculate points based on difficulty and time if not provided
    const calculatedPoints = points || calculateTaskPoints(difficulty, estimatedTime);

    const taskData: Omit<Task, 'id'> = {
      title,
      description,
      category,
      difficulty,
      estimatedTime,
      points: calculatedPoints,
      requiresEvidence: requiresEvidence || false,
      evidenceTypes: evidenceTypes || [],
      tags: tags || [],
      createdBy: req.user.id,
      isPublic: isPublic || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const taskRef = await collections.tasks.add(taskData);
    const task = { ...taskData, id: taskRef.id };

    res.status(201).json({
      success: true,
      data: { task },
      message: 'Task created successfully',
    });
  } catch (error: any) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create task',
    });
  }
};

export const getTasks = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const {
      category,
      difficulty,
      minPoints,
      maxPoints,
      minTime,
      maxTime,
      requiresEvidence,
      tags,
      isPublic,
      limit = 50,
      offset = 0,
    } = req.query;

    let query = collections.tasks.orderBy('createdAt', 'desc');

    // Apply filters
    if (category) {
      query = query.where('category', '==', category);
    }
    if (difficulty) {
      query = query.where('difficulty', '==', difficulty);
    }
    if (minPoints) {
      query = query.where('points', '>=', parseInt(minPoints as string));
    }
    if (maxPoints) {
      query = query.where('points', '<=', parseInt(maxPoints as string));
    }
    if (requiresEvidence !== undefined) {
      query = query.where('requiresEvidence', '==', requiresEvidence === 'true');
    }
    if (isPublic !== undefined) {
      query = query.where('isPublic', '==', isPublic === 'true');
    } else {
      // Show public tasks and user's own tasks
      query = query.where('isPublic', '==', true);
    }

    // Apply pagination
    query = query.limit(parseInt(limit as string));
    if (offset && parseInt(offset as string) > 0) {
      query = query.offset(parseInt(offset as string));
    }

    const snapshot = await query.get();
    const tasks = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Task[];

    // Client-side filtering for complex queries
    let filteredTasks = tasks;

    if (minTime || maxTime) {
      filteredTasks = filteredTasks.filter(task => {
        if (minTime && task.estimatedTime < parseInt(minTime as string)) return false;
        if (maxTime && task.estimatedTime > parseInt(maxTime as string)) return false;
        return true;
      });
    }

    if (tags) {
      const tagArray = (tags as string).split(',');
      filteredTasks = filteredTasks.filter(task =>
        tagArray.some(tag => task.tags.includes(tag))
      );
    }

    res.status(200).json({
      success: true,
      data: { tasks: filteredTasks },
    });
  } catch (error: any) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get tasks',
    });
  }
};

export const getTaskById = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { taskId } = req.params;
    const taskDoc = await collections.tasks.doc(taskId).get();

    if (!taskDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }

    const task = { id: taskDoc.id, ...taskDoc.data() } as Task;

    res.status(200).json({
      success: true,
      data: { task },
    });
  } catch (error: any) {
    console.error('Get task by ID error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get task',
    });
  }
};

export const updateTask = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { taskId } = req.params;
    const taskDoc = await collections.tasks.doc(taskId).get();

    if (!taskDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }

    const task = taskDoc.data() as Task;

    // Only allow task creator to update
    if (task.createdBy !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'You can only update your own tasks',
      });
    }

    const {
      title,
      description,
      category,
      difficulty,
      estimatedTime,
      points,
      requiresEvidence,
      evidenceTypes,
      tags,
      isPublic,
    } = req.body;

    const updates: any = { updatedAt: new Date() };

    if (title) updates.title = title;
    if (description) updates.description = description;
    if (category) updates.category = category;
    if (difficulty) updates.difficulty = difficulty;
    if (estimatedTime) updates.estimatedTime = estimatedTime;
    if (points) updates.points = points;
    if (requiresEvidence !== undefined) updates.requiresEvidence = requiresEvidence;
    if (evidenceTypes) updates.evidenceTypes = evidenceTypes;
    if (tags) updates.tags = tags;
    if (isPublic !== undefined) updates.isPublic = isPublic;

    await collections.tasks.doc(taskId).update(updates);

    // Get updated task
    const updatedTaskDoc = await collections.tasks.doc(taskId).get();
    const updatedTask = { id: updatedTaskDoc.id, ...updatedTaskDoc.data() } as Task;

    res.status(200).json({
      success: true,
      data: { task: updatedTask },
      message: 'Task updated successfully',
    });
  } catch (error: any) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update task',
    });
  }
};

export const deleteTask = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { taskId } = req.params;
    const taskDoc = await collections.tasks.doc(taskId).get();

    if (!taskDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }

    const task = taskDoc.data() as Task;

    // Only allow task creator to delete
    if (task.createdBy !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'You can only delete your own tasks',
      });
    }

    await collections.tasks.doc(taskId).delete();

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete task',
    });
  }
};

// Helper function to calculate task points based on difficulty and time
const calculateTaskPoints = (difficulty: string, estimatedTime: number): number => {
  const basePoints = Math.ceil(estimatedTime / 15); // 1 point per 15 minutes
  
  const difficultyMultipliers = {
    easy: 1,
    medium: 1.5,
    hard: 2,
  };
  
  return Math.ceil(basePoints * (difficultyMultipliers[difficulty as keyof typeof difficultyMultipliers] || 1));
};

// Point system based on activity type (from EarnPoints.md)
export const getActivityPoints = (category: string, activity: string, duration?: number, quality?: string): number => {
  switch (category) {
    case 'reading':
      if (activity === 'diary') return 2; // Base 2 points + extra for word count
      if (activity === 'book_reading') return Math.ceil((duration || 30) / 30) * 2; // 2 points per 30 min
      if (activity === 'poetry_recitation') return 2;
      if (activity === 'composition') return 3;
      return 1;
    
    case 'learning':
      if (activity === 'math_video') return 2; // Li Yongle math course
      if (activity === 'math_practice') return 2;
      if (activity === 'olympiad_problem') return 1; // per problem
      if (activity === 'preview_complete') return 5; // bonus for completing grade ahead
      return 1;
    
    case 'exercise':
      return Math.ceil((duration || 10) / 10); // 1 point per 10 minutes, max 3 per day
    
    case 'creativity':
      if (activity === 'programming_game') return 2; // per level/session
      if (activity === 'diy_project_milestone') return 10; // major milestone
      if (activity === 'diy_project_complete') return 50; // complete project
      if (activity === 'scratch_project') return 3;
      return 2;
    
    case 'other':
      if (activity === 'music_practice') {
        const basePoints = Math.ceil((duration || 15) / 15); // 1 point per 15 min
        return quality === 'excellent' ? basePoints + 2 : basePoints;
      }
      if (activity === 'english_game') return 2; // per session
      if (activity === 'english_speaking') return 1; // bonus for speaking
      if (activity === 'chores') return 1; // per task
      return 1;
    
    default:
      return 1;
  }
};