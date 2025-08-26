import { Request } from 'express';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'student' | 'parent' | 'admin';
  parentId?: string; // For students, reference to parent
  children?: string[]; // For parents, array of child IDs
  points: number;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserDocument extends Omit<User, 'id'> {
  password: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  category: 'exercise' | 'reading' | 'chores' | 'learning' | 'creativity' | 'other';
  activity: string; // Standardized activity identifier for points calculation
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number; // in minutes
  points: number;
  requiresEvidence: boolean;
  evidenceTypes: ('text' | 'photo' | 'video')[];
  tags: string[];
  createdBy: string; // User ID
  isPublic: boolean;
  // Extended fields for A2
  priority?: 'low' | 'medium' | 'high';
  timePreference?: 'morning' | 'afternoon' | 'evening' | 'flexible';
  isRecurring?: boolean;
  recurringPattern?: {
    type: 'daily' | 'weekly' | 'custom';
    daysOfWeek?: number[];
    interval?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface EvidenceMediaItem {
  type: 'image' | 'video';
  filename: string;
  url: string;
  size: number;
  mimetype: string;
}

export interface DailyTask {
  id: string;
  userId: string;
  taskId: string;
  date: string; // YYYY-MM-DD format
  status: 'planned' | 'in_progress' | 'completed' | 'skipped';
  plannedTime?: string; // HH:MM format
  plannedEndTime?: string; // HH:MM format for time blocks
  reminderTime?: string; // HH:MM format for reminders
  priority: 'low' | 'medium' | 'high'; // Task priority for scheduling
  timePreference?: 'morning' | 'afternoon' | 'evening' | 'flexible'; // Preferred time of day
  isRecurring?: boolean; // Whether this is part of a recurring schedule
  recurringPattern?: {
    type: 'daily' | 'weekly' | 'custom';
    daysOfWeek?: number[]; // [0-6] for weekly patterns, 0=Sunday
    interval?: number; // For custom intervals
  };
  completedAt?: Date;
  isPublic?: boolean; // 是否公开
  evidence?: {
    type: 'text' | 'photo' | 'video' | 'audio';
    content: string; // Text content or file URL
    timestamp: Date;
    metadata?: {
      filename?: string;
      size?: number;
      mimetype?: string;
    };
  }[];
  notes?: string;
  planningNotes?: string; // Notes added during planning phase
  pointsEarned: number;
  pendingPoints?: number; // Points waiting for approval, stored when task completed but not yet approved
  // Approval system enhancement
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approvedBy?: string; // Parent ID
  approvedAt?: Date;
  approvalNotes?: string;
  bonusPoints?: number; // Additional points awarded by parent
  createdAt: Date;
  updatedAt: Date;
}

export interface Redemption {
  id: string;
  userId: string;
  rewardTitle: string;
  rewardDescription: string;
  pointsCost: number;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: Date;
  processedAt?: Date;
  processedBy?: string; // Parent/admin ID
  notes?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthRequest extends Request {
  user?: User;
}

export interface TaskFilters {
  category?: Task['category'];
  difficulty?: Task['difficulty'];
  points?: {
    min?: number;
    max?: number;
  };
  estimatedTime?: {
    min?: number;
    max?: number;
  };
  requiresEvidence?: boolean;
  tags?: string[];
  isPublic?: boolean;
}

// New interfaces for enhanced task planning
export interface TaskScheduleRequest {
  taskId: string;
  date: string;
  plannedTime?: string;
  plannedEndTime?: string;
  reminderTime?: string;
  priority: 'low' | 'medium' | 'high';
  timePreference?: 'morning' | 'afternoon' | 'evening' | 'flexible';
  isRecurring?: boolean;
  recurringPattern?: {
    type: 'daily' | 'weekly' | 'custom';
    daysOfWeek?: number[];
    interval?: number;
  };
  planningNotes?: string;
}

export interface WeeklySchedule {
  userId: string;
  weekStart: string; // YYYY-MM-DD format (Monday)
  tasks: DailyTask[];
  totalPlannedTasks: number;
  totalCompletedTasks: number;
  totalPointsEarned: number;
  completionRate: number;
}

export interface SchedulingConflict {
  date: string;
  timeSlot: string;
  conflictingTasks: {
    taskId: string;
    title: string;
    plannedTime: string;
    estimatedTime: number;
  }[];
  suggestions: {
    action: 'reschedule' | 'adjust_time' | 'change_date';
    details: string;
  }[];
}

export interface BatchApprovalRequest {
  dailyTaskIds: string[];
  action: 'approve' | 'reject';
  approvalNotes?: string;
  bonusPoints?: { [dailyTaskId: string]: number };
}

// Points Configuration System
export interface PointsRule {
  id: string;
  category: Task['category'];
  activity: string; // Specific activity name
  basePoints: number;
  bonusRules?: {
    type: 'word_count' | 'duration' | 'quality' | 'completion';
    threshold: number;
    bonusPoints: number;
    maxBonus?: number;
  }[];
  dailyLimit?: number; // Max points per day for this activity
  multipliers?: {
    difficulty?: { [key: string]: number };
    quality?: { [key: string]: number };
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GameTimeConfig {
  id: string;
  baseGameTimeMinutes: number; // Daily free game time
  pointsToMinutesRatio: number; // How many minutes per point
  educationalGameBonus: number; // Multiplier for educational games
  dailyGameTimeLimit: number; // Max total game time per day
  freeEducationalMinutes: number; // Free daily minutes for educational games
  weeklyAccumulationLimit: number; // Max accumulated points that can be stored
  dailyPointsLimit: number; // Max daily points limit across all activities
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPointsLimit {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD format
  activityPoints: { [activityId: string]: number }; // Track daily points per activity
  totalDailyPoints: number;
  gameTimeUsed: number; // Minutes used today
  gameTimeAvailable: number; // Minutes available (from points + base time)
  accumulatedPoints: number; // Saved points from previous days
  createdAt: Date;
  updatedAt: Date;
}

// Points Transaction System for clawback tracking
export interface PointsTransaction {
  id: string;
  userId: string;
  dailyTaskId?: string; // Reference to daily task if applicable
  type: 'earn' | 'clawback' | 'bonus' | 'redemption';
  amount: number; // Positive for earn/bonus, negative for clawback/redemption
  reason: string; // Description of why points were gained/lost
  approvedBy?: string; // Parent ID for approvals/rejections
  previousTotal: number; // User's points before this transaction
  newTotal: number; // User's points after this transaction
  metadata?: {
    activityType?: string;
    originalPoints?: number;
    taskTitle?: string;
    approvalNotes?: string;
  };
  createdAt: Date;
}

// Enhanced DailyTask interface with clawback tracking
export interface DailyTaskWithClawback extends DailyTask {
  pointsClawback?: number; // Points that were clawed back due to rejection
  transactionHistory?: string[]; // Array of transaction IDs
}