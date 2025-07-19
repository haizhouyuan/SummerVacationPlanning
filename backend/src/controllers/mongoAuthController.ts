import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { collections } from '../config/mongodb';
import { User } from '../types';
import { generateToken } from '../utils/jwt';
import { AuthRequest } from '../middleware/mongoAuth';

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

    // Get child's daily tasks for current week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6); // End of week
    weekEnd.setHours(23, 59, 59, 999);

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

    // Calculate current week start and end
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const monday = new Date(now);
    monday.setDate(now.getDate() - (currentDay === 0 ? 6 : currentDay - 1)); // Set to Monday
    monday.setHours(0, 0, 0, 0);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6); // Set to Sunday
    sunday.setHours(23, 59, 59, 999);

    const weekStart = monday.toISOString().split('T')[0];
    const weekEnd = sunday.toISOString().split('T')[0];

    // Get this week's daily tasks
    const weeklyTasks = await collections.dailyTasks.find({
      userId: userId,
      date: { $gte: weekStart, $lte: weekEnd }
    }).toArray();

    // Calculate weekly statistics
    const weeklyStats = {
      completed: weeklyTasks.filter((task: any) => task.status === 'completed').length,
      planned: weeklyTasks.filter((task: any) => task.status === 'planned').length,
      inProgress: weeklyTasks.filter((task: any) => task.status === 'in_progress').length,
      skipped: weeklyTasks.filter((task: any) => task.status === 'skipped').length,
      total: weeklyTasks.length,
    };

    // Calculate achievements
    const achievements = [
      {
        type: 'streak',
        level: Math.max(1, Math.floor((user.currentStreak || 0) / 3) + 1),
        title: '连续达人',
        description: '连续完成每日任务',
        isUnlocked: (user.currentStreak || 0) >= 3,
        progress: (user.currentStreak || 0) % 3,
        maxProgress: 3,
      },
      {
        type: 'points',
        level: Math.max(1, Math.floor((user.points || 0) / 100) + 1),
        title: '积分收集者',
        description: '累计获得积分',
        isUnlocked: (user.points || 0) >= 100,
        progress: (user.points || 0) % 100,
        maxProgress: 100,
      },
      {
        type: 'tasks',
        level: Math.max(1, Math.floor(weeklyStats.completed / 5) + 1),
        title: '任务完成者',
        description: '本周完成任务',
        isUnlocked: weeklyStats.completed >= 5,
        progress: weeklyStats.completed % 5,
        maxProgress: 5,
      },
    ];

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
      achievements,
      weeklyGoal: 7, // Default weekly goal
    };

    res.status(200).json({
      success: true,
      data: { stats: dashboardStats },
    });
  } catch (error: any) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get dashboard statistics',
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

    // Calculate current week start and end
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const monday = new Date(now);
    monday.setDate(now.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
    monday.setHours(0, 0, 0, 0);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const weekStart = monday.toISOString().split('T')[0];
    const weekEnd = sunday.toISOString().split('T')[0];

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