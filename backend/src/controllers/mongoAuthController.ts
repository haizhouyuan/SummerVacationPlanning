import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { collections } from '../config/mongodb';
import { User } from '../types';
import { generateToken } from '../utils/jwt';
import { AuthRequest } from '../middleware/mongoAuth';
import { getCurrentWeek, getToday, calculateCompletionRate, calculateAverage } from '../utils/dateUtils';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, displayName, role, parentEmail } = req.body;

    // Validate required fields
    if (!email || !password || !displayName || !role) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, display name, and role are required',
      });
    }

    if (!['student', 'parent'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Role must be either student or parent',
      });
    }

    // Check if user already exists
    const existingUser = await collections.users.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    let parentId: string | undefined;
    let parentDoc: any = null;

    // If registering a student, find the parent
    if (role === 'student') {
      if (!parentEmail) {
        return res.status(400).json({
          success: false,
          error: 'Parent email is required for student registration',
        });
      }

      // Find parent by email
      parentDoc = await collections.users.findOne({ 
        email: parentEmail, 
        role: 'parent' 
      });

      if (!parentDoc) {
        return res.status(404).json({
          success: false,
          error: 'Parent not found with the provided email',
        });
      }

      parentId = parentDoc._id.toString();
    }

    // Create user document
    const userData = {
      email,
      password: hashedPassword,
      displayName,
      role: role as 'student' | 'parent',
      parentId,
      children: role === 'parent' ? [] : undefined,
      points: 0,
      currentStreak: 0,
      medals: {
        bronze: false,
        silver: false,
        gold: false,
        diamond: false,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collections.users.insertOne(userData);
    const userId = result.insertedId.toString();

    // If student, update parent's children array
    if (role === 'student' && parentDoc) {
      const updatedChildren = [...(parentDoc.children || []), userId];
      
      await collections.users.updateOne(
        { _id: parentDoc._id },
        { 
          $set: { 
            children: updatedChildren,
            updatedAt: new Date()
          }
        }
      );
    }

    // Create user object for response (without password)
    const userResponse: User = {
      id: userId,
      email,
      displayName,
      role: role as 'student' | 'parent',
      parentId,
      children: role === 'parent' ? [] : undefined,
      points: 0,
      currentStreak: 0,
      medals: {
        bronze: false,
        silver: false,
        gold: false,
        diamond: false,
      },
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
    };

    // Generate JWT token
    const token = generateToken(userResponse);

    res.status(201).json({
      success: true,
      data: {
        user: userResponse,
        token,
      },
      message: 'User registered successfully',
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Registration failed',
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
    }

    // Find user by email
    const user = await collections.users.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Create user object for response (without password)
    const userResponse: User = {
      id: user._id.toString(),
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      parentId: user.parentId,
      children: user.children,
      points: user.points,
      avatar: user.avatar,
      currentStreak: user.currentStreak || 0,
      medals: user.medals || {
        bronze: false,
        silver: false,
        gold: false,
        diamond: false,
      },
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    // Generate JWT token
    const token = generateToken(userResponse);
    
    res.status(200).json({
      success: true,
      data: {
        user: userResponse,
        token,
      },
      message: 'Login successful',
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Login failed',
    });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    res.status(200).json({
      success: true,
      data: { user: req.user },
      message: 'Profile retrieved successfully',
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get profile',
    });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { displayName, avatar } = req.body;

    const updates: any = { updatedAt: new Date() };

    if (displayName) updates.displayName = displayName;
    if (avatar) updates.avatar = avatar;

    await collections.users.updateOne(
      { _id: new ObjectId(req.user.id) },
      { $set: updates }
    );

    // Get updated user
    const updatedUser = await collections.users.findOne({ _id: new ObjectId(req.user.id) });

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const userResponse: User = {
      id: updatedUser._id.toString(),
      email: updatedUser.email,
      displayName: updatedUser.displayName,
      role: updatedUser.role,
      parentId: updatedUser.parentId,
      children: updatedUser.children,
      points: updatedUser.points,
      avatar: updatedUser.avatar,
      currentStreak: updatedUser.currentStreak || 0,
      medals: updatedUser.medals || {
        bronze: false,
        silver: false,
        gold: false,
        diamond: false,
      },
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };

    res.status(200).json({
      success: true,
      data: { user: userResponse },
      message: 'Profile updated successfully',
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update profile',
    });
  }
};

// Get parent's children list
export const getChildren = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    // Only parents can get children list
    if (req.user.role !== 'parent') {
      return res.status(403).json({
        success: false,
        error: 'Only parents can access children data',
      });
    }

    // Get children using the children array from parent user
    const childrenIds = req.user.children || [];
    
    if (childrenIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: { children: [] },
      });
    }

    // Convert string IDs to ObjectIds for MongoDB query
    const objectIds = childrenIds.map(id => new ObjectId(id));
    
    // Fetch children details
    const children = await collections.users.find({
      _id: { $in: objectIds }
    }).toArray();

    // Format children data (exclude sensitive information)
    const childrenData = children.map((child: any) => ({
      id: child._id.toString(),
      name: child.displayName,
      email: child.email,
      points: child.points || 0,
      level: Math.floor((child.points || 0) / 100) + 1,
      avatar: child.avatar,
      streakDays: child.currentStreak || 0,
      // We'll calculate these from tasks in a real implementation
      tasksCompleted: 0,
      weeklyGoal: 7,
      weeklyProgress: 0,
      createdAt: child.createdAt,
      updatedAt: child.updatedAt,
    }));

    res.status(200).json({
      success: true,
      data: { children: childrenData },
    });
  } catch (error: any) {
    console.error('Get children error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get children data',
    });
  }
};

// Get detailed stats for a specific child
export const getChildStats = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    // Only parents can get child stats
    if (req.user.role !== 'parent') {
      return res.status(403).json({
        success: false,
        error: 'Only parents can access child statistics',
      });
    }

    const { childId } = req.params;

    // Verify this child belongs to the parent
    if (!req.user.children?.includes(childId)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: Child does not belong to this parent',
      });
    }

    // Get child's basic info
    const child = await collections.users.findOne({ _id: new ObjectId(childId) });
    if (!child) {
      return res.status(404).json({
        success: false,
        error: 'Child not found',
      });
    }

    // Get child's daily tasks for current week using unified date calculation
    const weekInfo = getCurrentWeek();
    const { monday: weekStart, sunday: weekEnd } = weekInfo;

    const dailyTasks = await collections.dailyTasks.find({
      userId: childId,
      date: {
        $gte: weekStart.toISOString().split('T')[0],
        $lte: weekEnd.toISOString().split('T')[0]
      }
    }).toArray();

    // Get task details for each daily task
    const tasksWithDetails = await Promise.all(
      dailyTasks.map(async (dailyTask: any) => {
        const task = await collections.tasks.findOne({ _id: new ObjectId(dailyTask.taskId) });
        return {
          id: dailyTask._id.toString(),
          task: task ? {
            title: task.title,
            category: task.category,
            points: task.points,
          } : null,
          status: dailyTask.status,
          pointsEarned: dailyTask.pointsEarned || 0,
          completedAt: dailyTask.completedAt,
          evidenceText: dailyTask.evidenceText,
          evidenceMedia: dailyTask.evidenceMedia,
        };
      })
    );

    // Calculate weekly stats
    const weeklyStats = {
      completed: dailyTasks.filter((task: any) => task.status === 'completed').length,
      planned: dailyTasks.filter((task: any) => task.status === 'planned').length,
      skipped: dailyTasks.filter((task: any) => task.status === 'skipped').length,
    };

    // Calculate category breakdown
    const categoryBreakdown: { [key: string]: number } = {};
    for (const dailyTask of dailyTasks) {
      if (dailyTask.status === 'completed') {
        const task = await collections.tasks.findOne({ _id: new ObjectId(dailyTask.taskId) });
        if (task) {
          categoryBreakdown[task.category] = (categoryBreakdown[task.category] || 0) + 1;
        }
      }
    }

    // Simple achievements based on current data
    const achievements = [
      {
        type: 'streak',
        level: Math.floor((child.currentStreak || 0) / 3) + 1,
        title: '连续达人',
        description: `连续${child.currentStreak || 0}天完成任务`,
        isUnlocked: (child.currentStreak || 0) >= 3,
      },
      {
        type: 'points',
        level: Math.floor((child.points || 0) / 100) + 1,
        title: '积分大师',
        description: `获得${child.points || 0}积分`,
        isUnlocked: (child.points || 0) >= 100,
      },
    ];

    const childStats = {
      dailyTasks: tasksWithDetails,
      weeklyStats,
      categoryBreakdown,
      achievements,
    };

    res.status(200).json({
      success: true,
      data: { stats: childStats },
    });
  } catch (error: any) {
    console.error('Get child stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get child statistics',
    });
  }
};

// Get current user's dashboard statistics
export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const userId = req.user.id;

    // Get user details
    const user = await collections.users.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Calculate current week start and end using unified date calculation
    const weekInfo = getCurrentWeek();
    const { weekStart, weekEnd } = weekInfo;

    // Get this week's daily tasks
    const weeklyTasks = await collections.dailyTasks.find({
      userId: userId,
      date: { $gte: weekStart, $lte: weekEnd }
    }).toArray();

    // Calculate comprehensive weekly statistics
    const weeklyStats = {
      completed: weeklyTasks.filter((task: any) => task.status === 'completed').length,
      planned: weeklyTasks.filter((task: any) => task.status === 'planned').length,
      inProgress: weeklyTasks.filter((task: any) => task.status === 'in_progress').length,
      skipped: weeklyTasks.filter((task: any) => task.status === 'skipped').length,
      total: weeklyTasks.length,
      totalPointsEarned: weeklyTasks.reduce((sum: number, task: any) => sum + (task.pointsEarned || 0), 0),
      completionRate: weeklyTasks.length > 0 ? Math.round((weeklyTasks.filter((task: any) => task.status === 'completed').length / weeklyTasks.length) * 100) : 0,
      averagePointsPerTask: weeklyTasks.length > 0 ? Math.round(weeklyTasks.reduce((sum: number, task: any) => sum + (task.pointsEarned || 0), 0) / weeklyTasks.length) : 0,
    };

    // Enhanced achievements calculation
    const achievements = [];
    
    // Streak achievements with multiple tiers
    const streakValue = user.currentStreak || 0;
    if (streakValue >= 3) {
      let streakLevel = 1;
      let nextMilestone = 7;
      if (streakValue >= 7) { streakLevel = 2; nextMilestone = 14; }
      if (streakValue >= 14) { streakLevel = 3; nextMilestone = 30; }
      if (streakValue >= 30) { streakLevel = 4; nextMilestone = 60; }
      if (streakValue >= 60) { streakLevel = 5; nextMilestone = 100; }
      
      achievements.push({
        type: 'streak',
        level: streakLevel,
        title: '连续达人',
        description: `连续${streakValue}天完成任务`,
        isUnlocked: true,
        progress: streakValue < nextMilestone ? streakValue : nextMilestone,
        maxProgress: nextMilestone,
      });
    } else {
      achievements.push({
        type: 'streak',
        level: 1,
        title: '连续达人',
        description: '连续完成每日任务',
        isUnlocked: false,
        progress: streakValue,
        maxProgress: 3,
      });
    }
    
    // Points achievements with enhanced tiers
    const pointsValue = user.points || 0;
    let pointsLevel = Math.max(1, Math.floor(pointsValue / 100) + 1);
    let pointsNextMilestone = pointsLevel * 100;
    
    achievements.push({
      type: 'points',
      level: pointsLevel,
      title: '积分收集者',
      description: `累计获得${pointsValue}积分`,
      isUnlocked: pointsValue >= 100,
      progress: pointsValue % 100,
      maxProgress: 100,
    });
    
    // Task completion achievements
    const weeklyCompleted = weeklyStats.completed;
    let taskLevel = 1;
    let taskNextMilestone = 5;
    if (weeklyCompleted >= 5) { taskLevel = 2; taskNextMilestone = 10; }
    if (weeklyCompleted >= 10) { taskLevel = 3; taskNextMilestone = 15; }
    if (weeklyCompleted >= 15) { taskLevel = 4; taskNextMilestone = 20; }
    
    achievements.push({
      type: 'tasks',
      level: taskLevel,
      title: '任务完成者',
      description: `本周完成${weeklyCompleted}个任务`,
      isUnlocked: weeklyCompleted >= 5,
      progress: weeklyCompleted % 5,
      maxProgress: 5,
    });
    
    // Medal-based achievements
    const medals = user.medals || { bronze: false, silver: false, gold: false, diamond: false };
    let medalCount = 0;
    if (medals.bronze) medalCount++;
    if (medals.silver) medalCount++;
    if (medals.gold) medalCount++;
    if (medals.diamond) medalCount++;
    
    if (medalCount > 0) {
      achievements.push({
        type: 'medals',
        level: medalCount,
        title: '徽章收集者',
        description: `获得${medalCount}个徽章`,
        isUnlocked: true,
        progress: medalCount,
        maxProgress: 4,
      });
    }
    
    // Category diversity achievement (bonus)
    const categoryTasksPromise = collections.dailyTasks.aggregate([
      {
        $match: {
          userId: userId,
          status: 'completed',
          date: { $gte: weekStart, $lte: weekEnd }
        }
      },
      {
        $lookup: {
          from: 'tasks',
          localField: 'taskId',
          foreignField: '_id',
          as: 'taskDetails'
        }
      },
      {
        $unwind: '$taskDetails'
      },
      {
        $group: {
          _id: '$taskDetails.category',
          count: { $sum: 1 }
        }
      }
    ]).toArray();
    
    const categoryTasks = await categoryTasksPromise;
    const uniqueCategories = categoryTasks.length;
    
    if (uniqueCategories >= 3) {
      achievements.push({
        type: 'diversity',
        level: Math.min(uniqueCategories, 6),
        title: '全能发展',
        description: `完成${uniqueCategories}种不同类型的任务`,
        isUnlocked: true,
        progress: uniqueCategories,
        maxProgress: 6, // Total number of categories
      });
    }

    // Calculate today's tasks for quick overview
    const today = new Date().toISOString().split('T')[0];
    const todayTasks = await collections.dailyTasks.find({
      userId: userId,
      date: today
    }).toArray();
    
    const todayStats = {
      total: todayTasks.length,
      completed: todayTasks.filter((task: any) => task.status === 'completed').length,
      planned: todayTasks.filter((task: any) => task.status === 'planned').length,
      inProgress: todayTasks.filter((task: any) => task.status === 'in_progress').length,
      pointsEarned: todayTasks.reduce((sum: number, task: any) => sum + (task.pointsEarned || 0), 0),
    };

    const dashboardStats = {
      user: {
        id: user._id.toString(),
        name: user.displayName,
        email: user.email,
        points: user.points || 0,
        level: Math.floor((user.points || 0) / 100) + 1,
        currentStreak: user.currentStreak || 0,
        medals: user.medals || { bronze: false, silver: false, gold: false, diamond: false },
      },
      weeklyStats,
      todayStats,
      achievements,
      weeklyGoal: 7, // Default weekly goal
      // Additional useful statistics
      performance: {
        thisWeekCompletion: weeklyStats.completionRate,
        pointsPerTask: weeklyStats.averagePointsPerTask,
        streakProgress: user.currentStreak || 0,
        nextLevelPoints: (Math.floor((user.points || 0) / 100) + 1) * 100 - (user.points || 0),
      }
    };

    res.status(200).json({
      success: true,
      data: { stats: dashboardStats },
    });
  } catch (error: any) {
    console.error('Get dashboard stats error:', error);
    
    // Provide fallback statistics in case of database issues
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const fallbackStats = {
      user: {
        id: req.user?.id || 'unknown',
        name: req.user?.displayName || '',
        email: req.user?.email || '',
        points: req.user?.points || 0,
        level: Math.floor((req.user?.points || 0) / 100) + 1,
        currentStreak: req.user?.currentStreak || 0,
        medals: req.user?.medals || { bronze: false, silver: false, gold: false, diamond: false },
      },
      weeklyStats: {
        completed: 0,
        planned: 0,
        inProgress: 0,
        skipped: 0,
        total: 0,
        totalPointsEarned: 0,
        completionRate: 0,
        averagePointsPerTask: 0,
      },
      todayStats: {
        total: 0,
        completed: 0,
        planned: 0,
        inProgress: 0,
        pointsEarned: 0,
      },
      achievements: [],
      weeklyGoal: 7,
      performance: {
        thisWeekCompletion: 0,
        pointsPerTask: 0,
        streakProgress: req.user?.currentStreak || 0,
        nextLevelPoints: (Math.floor((req.user?.points || 0) / 100) + 1) * 100 - (req.user?.points || 0),
      }
    };
    
    // Try to return fallback data instead of complete failure
    if (error.name === 'MongoError' || error.message.includes('database')) {
      res.status(200).json({
        success: true,
        data: { stats: fallbackStats },
        warning: 'Using cached user data due to database connectivity issues',
      });
    } else {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get dashboard statistics',
      });
    }
  }
};

// Get comprehensive points history for a user
export const getPointsHistory = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { startDate, endDate, type, limit = 50, offset = 0 } = req.query;
    const userId = req.user.id;

    // Build date filter
    let dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter = {};
      if (startDate) dateFilter.$gte = startDate as string;
      if (endDate) dateFilter.$lte = endDate as string;
    }

    const pointsHistory: any[] = [];

    // Get points earned from completed daily tasks
    const taskEarningQuery: any = {
      userId: userId,
      status: 'completed',
      pointsEarned: { $gt: 0 }
    };
    
    if (Object.keys(dateFilter).length > 0) {
      taskEarningQuery.date = dateFilter;
    }

    const earnedFromTasks = await collections.dailyTasks.find(taskEarningQuery)
      .sort({ completedAt: -1, updatedAt: -1 })
      .toArray();

    // Process task earnings with task details
    for (const dailyTask of earnedFromTasks) {
      try {
        const task = await collections.tasks.findOne({ _id: new ObjectId(dailyTask.taskId) });
        
        pointsHistory.push({
          id: `task-${dailyTask._id.toString()}`,
          type: 'earn',
          amount: dailyTask.pointsEarned || 0,
          source: 'task_completion',
          description: `完成任务: ${task?.title || '未知任务'}`,
          date: dailyTask.completedAt || dailyTask.updatedAt,
          details: {
            taskId: dailyTask.taskId,
            taskTitle: task?.title,
            taskCategory: task?.category,
            difficulty: task?.difficulty,
            originalPoints: task?.points,
            bonusPoints: dailyTask.bonusPoints || 0,
            evidenceProvided: !!(dailyTask.evidenceText || (dailyTask.evidenceMedia && dailyTask.evidenceMedia.length > 0)),
            approvalStatus: dailyTask.approvalStatus,
          }
        });
      } catch (taskError) {
        console.warn('Error processing task for points history:', taskError);
      }
    }

    // Get points spent on game time exchanges
    try {
      const gameTimeExchanges = await collections.gameTimeExchanges?.find({
        userId: userId,
        ...(Object.keys(dateFilter).length > 0 && { 
          createdAt: { 
            $gte: startDate ? new Date(startDate as string) : new Date(0),
            $lte: endDate ? new Date(endDate as string) : new Date()
          } 
        })
      }).sort({ createdAt: -1 }).toArray() || [];

      gameTimeExchanges.forEach((exchange: any) => {
        pointsHistory.push({
          id: `exchange-${exchange._id.toString()}`,
          type: 'spend',
          amount: exchange.pointsSpent || 0,
          source: 'game_time_exchange',
          description: `兑换游戏时间: ${exchange.minutesGranted || 0}分钟${exchange.gameType === 'normal' ? '普通' : '教育'}游戏`,
          date: exchange.createdAt,
          details: {
            gameType: exchange.gameType,
            minutesGranted: exchange.minutesGranted,
            exchangeRate: exchange.pointsPerMinute,
          }
        });
      });
    } catch (exchangeError) {
      console.warn('Error loading game time exchanges for points history:', exchangeError);
    }

    // Get points spent on redemptions
    try {
      const redemptions = await collections.redemptions?.find({
        userId: userId,
        status: 'approved',
        ...(Object.keys(dateFilter).length > 0 && { 
          processedAt: { 
            $gte: startDate ? new Date(startDate as string) : new Date(0),
            $lte: endDate ? new Date(endDate as string) : new Date()
          } 
        })
      }).sort({ processedAt: -1 }).toArray() || [];

      redemptions.forEach((redemption: any) => {
        pointsHistory.push({
          id: `redemption-${redemption._id.toString()}`,
          type: 'spend',
          amount: redemption.pointsCost || 0,
          source: 'reward_redemption',
          description: `兑换奖励: ${redemption.rewardTitle || '未知奖励'}`,
          date: redemption.processedAt,
          details: {
            rewardId: redemption.rewardId,
            rewardTitle: redemption.rewardTitle,
            rewardType: redemption.rewardType,
            processedBy: redemption.processedBy,
          }
        });
      });
    } catch (redemptionError) {
      console.warn('Error loading redemptions for points history:', redemptionError);
    }

    // Filter by type if specified
    let filteredHistory = pointsHistory;
    if (type && type !== 'all') {
      filteredHistory = pointsHistory.filter(entry => entry.type === type);
    }

    // Sort by date (newest first)
    filteredHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Apply pagination
    const totalCount = filteredHistory.length;
    const paginatedHistory = filteredHistory.slice(Number(offset), Number(offset) + Number(limit));

    // Calculate summary statistics
    const summary = {
      totalTransactions: totalCount,
      totalEarned: pointsHistory.filter(entry => entry.type === 'earn').reduce((sum, entry) => sum + entry.amount, 0),
      totalSpent: pointsHistory.filter(entry => entry.type === 'spend').reduce((sum, entry) => sum + entry.amount, 0),
      netGain: 0,
      periodStart: startDate || null,
      periodEnd: endDate || null,
    };
    summary.netGain = summary.totalEarned - summary.totalSpent;

    res.status(200).json({
      success: true,
      data: {
        history: paginatedHistory,
        summary,
        pagination: {
          total: totalCount,
          limit: Number(limit),
          offset: Number(offset),
          hasMore: Number(offset) + Number(limit) < totalCount,
        }
      },
    });
  } catch (error: any) {
    console.error('Get points history error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get points history',
    });
  }
};

// Get family leaderboard (parent only)
export const getFamilyLeaderboard = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    // Only parents can access family leaderboard
    if (req.user.role !== 'parent') {
      return res.status(403).json({
        success: false,
        error: 'Only parents can access family leaderboard',
      });
    }

    const parentId = req.user.id;

    // Get all children of this parent
    const children = await collections.users.find({
      parentId: parentId,
      role: 'student',
    }).toArray();

    if (children.length === 0) {
      return res.status(200).json({
        success: true,
        data: { leaderboard: [] },
      });
    }

    const childrenIds = children.map((child: any) => child._id.toString());

    // Calculate current week start and end using unified date calculation
    const weekInfo = getCurrentWeek();
    const { weekStart, weekEnd } = weekInfo;

    // Get this week's daily tasks for all children
    const weeklyTasks = await collections.dailyTasks.find({
      userId: { $in: childrenIds },
      date: { $gte: weekStart, $lte: weekEnd }
    }).toArray();

    // Create leaderboard entries
    const leaderboardEntries = children.map((child: any) => {
      const childTasks = weeklyTasks.filter((task: any) => task.userId === child._id.toString());
      const completedTasks = childTasks.filter((task: any) => task.status === 'completed').length;
      
      // Calculate recent achievements
      const recentAchievements = [];
      if ((child.currentStreak || 0) >= 3) {
        recentAchievements.push({
          type: 'streak',
          title: '连续达人',
          isNew: (child.currentStreak || 0) === 3,
        });
      }
      if ((child.points || 0) >= 100) {
        recentAchievements.push({
          type: 'points',
          title: '积分大师',
          isNew: (child.points || 0) >= 100 && (child.points || 0) < 120,
        });
      }
      if (completedTasks >= 5) {
        recentAchievements.push({
          type: 'tasks',
          title: '任务完成者',
          isNew: completedTasks === 5,
        });
      }

      return {
        id: child._id.toString(),
        name: child.displayName,
        points: child.points || 0,
        level: Math.floor((child.points || 0) / 100) + 1,
        tasksCompleted: completedTasks,
        streakDays: child.currentStreak || 0,
        recentAchievements: recentAchievements.slice(0, 2), // Limit to 2 achievements
        rank: 0, // Will be set below
      };
    });

    // Sort by points (descending) and assign ranks
    leaderboardEntries.sort((a: any, b: any) => b.points - a.points);
    leaderboardEntries.forEach((entry: any, index: number) => {
      entry.rank = index + 1;
    });

    res.status(200).json({
      success: true,
      data: { leaderboard: leaderboardEntries },
    });
  } catch (error: any) {
    console.error('Get family leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get family leaderboard',
    });
  }
}; 