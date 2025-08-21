import { Response } from 'express';
import { collections } from '../config/mongodb';
import { Task, TaskFilters } from '../types';
import { AuthRequest } from '../middleware/mongoAuth';
import { ObjectId } from 'mongodb';
import { getTaskRecommendations, getUserInsights } from '../services/recommendationService';

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
      activity,
      difficulty,
      estimatedTime,
      points,
      requiresEvidence,
      evidenceTypes,
      tags,
      isPublic,
    } = req.body;

    // Validate required fields
    if (!title || !description || !category || !activity || !difficulty || !estimatedTime) {
      return res.status(400).json({
        success: false,
        error: 'Title, description, category, activity, difficulty, and estimated time are required',
      });
    }

    // Handle demo users
    if (req.user.id === 'demo-user-id') {
      console.log('🔄 Demo mode: Creating mock task');
      const mockTaskId = 'demo-task-' + Date.now();
      const calculatedPoints = points || calculateTaskPoints(difficulty, estimatedTime);
      
      const mockTask = {
        id: mockTaskId,
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

      return res.status(201).json({
        success: true,
        data: { task: mockTask },
        message: 'Task created successfully (demo mode)',
      });
    }

    // Calculate points based on difficulty and time if not provided
    const calculatedPoints = points || calculateTaskPoints(difficulty, estimatedTime);

    const taskData: Omit<Task, 'id'> = {
      title,
      description,
      category,
      activity,
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

    const result = await collections.tasks.insertOne(taskData);
    const task = { ...taskData, id: result.insertedId.toString() };

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

    let query: any = {};

    // Apply filters
    if (category) {
      query.category = category;
    }
    if (difficulty) {
      query.difficulty = difficulty;
    }
    if (minPoints || maxPoints) {
      query.points = {};
      if (minPoints) query.points.$gte = parseInt(minPoints as string);
      if (maxPoints) query.points.$lte = parseInt(maxPoints as string);
    }
    if (minTime || maxTime) {
      query.estimatedTime = {};
      if (minTime) query.estimatedTime.$gte = parseInt(minTime as string);
      if (maxTime) query.estimatedTime.$lte = parseInt(maxTime as string);
    }
    if (requiresEvidence !== undefined) {
      query.requiresEvidence = requiresEvidence === 'true';
    }
    if (isPublic !== undefined) {
      query.isPublic = isPublic === 'true';
    } else {
      // Show public tasks and user's own tasks
      query.$or = [
        { isPublic: true },
        { createdBy: req.user.id }
      ];
    }

    // Handle tags filter
    if (tags) {
      const tagArray = (tags as string).split(',');
      query.tags = { $in: tagArray };
    }

    const tasks = await collections.tasks
      .find(query)
      .sort({ createdAt: -1 })
      .skip(parseInt(offset as string))
      .limit(parseInt(limit as string))
      .toArray();

    const tasksWithId = tasks.map((task: any) => ({
      ...task,
      id: task._id.toString(),
    }));

    res.status(200).json({
      success: true,
      data: { tasks: tasksWithId },
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
    const task = await collections.tasks.findOne({ _id: new ObjectId(taskId) });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }

    res.status(200).json({
      success: true,
      data: { task: { ...task, id: task._id.toString() } },
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
    const task = await collections.tasks.findOne({ _id: new ObjectId(taskId) });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }

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

    await collections.tasks.updateOne(
      { _id: new ObjectId(taskId) },
      { $set: updates }
    );

    // Get updated task
    const updatedTask = await collections.tasks.findOne({ _id: new ObjectId(taskId) });

    res.status(200).json({
      success: true,
      data: { task: { ...updatedTask, id: updatedTask._id.toString() } },
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
    const task = await collections.tasks.findOne({ _id: new ObjectId(taskId) });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }

    // Only allow task creator to delete
    if (task.createdBy !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'You can only delete your own tasks',
      });
    }

    await collections.tasks.deleteOne({ _id: new ObjectId(taskId) });

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

/**
 * Get personalized task recommendations for the authenticated user
 */
export const getRecommendedTasks = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const {
      limit = 5,
      categories,
      difficulties,
      excludeTaskIds,
      minPoints,
      maxPoints,
      includeNovelTasks = true,
      timeWindow = 30
    } = req.query;

    // Parse array parameters
    const categoryArray = categories ? (categories as string).split(',') : [];
    const difficultyArray = difficulties ? (difficulties as string).split(',') : [];
    const excludeArray = excludeTaskIds ? (excludeTaskIds as string).split(',') : [];

    const options = {
      limit: parseInt(limit as string),
      categories: categoryArray,
      difficulties: difficultyArray,
      excludeTaskIds: excludeArray,
      minPoints: minPoints ? parseInt(minPoints as string) : undefined,
      maxPoints: maxPoints ? parseInt(maxPoints as string) : undefined,
      includeNovelTasks: includeNovelTasks === 'true',
      timeWindow: parseInt(timeWindow as string)
    };

    const recommendations = await getTaskRecommendations(req.user.id, options);

    res.status(200).json({
      success: true,
      data: { 
        recommendations,
        count: recommendations.length,
        generatedAt: new Date()
      },
      message: 'Recommendations generated successfully'
    });

  } catch (error: any) {
    console.error('Get recommendations error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate recommendations',
    });
  }
};

/**
 * Get user behavior insights and analytics
 */
export const getUserBehaviorInsights = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const insights = await getUserInsights(req.user.id);

    res.status(200).json({
      success: true,
      data: { 
        insights,
        generatedAt: new Date()
      },
      message: 'User insights generated successfully'
    });

  } catch (error: any) {
    console.error('Get user insights error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate user insights',
    });
  }
};