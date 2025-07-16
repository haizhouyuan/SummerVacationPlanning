export interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'student' | 'parent';
  parentId?: string; // For students, reference to parent
  children?: string[]; // For parents, array of child IDs
  points: number;
  avatar?: string;
  currentStreak: number; // Consecutive days of full task completion
  medals: {
    bronze: boolean;   // 7 days consecutive - 1.1x multiplier
    silver: boolean;   // 14 days consecutive - 1.2x multiplier
    gold: boolean;     // 30 days consecutive - 1.3x multiplier
    diamond: boolean;  // 60 days consecutive - 1.4x multiplier
  };
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
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number; // in minutes
  points: number;
  requiresEvidence: boolean;
  evidenceTypes: ('text' | 'photo' | 'video')[];
  tags: string[];
  createdBy: string; // User ID
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DailyTask {
  id: string;
  userId: string;
  taskId: string;
  date: string; // YYYY-MM-DD format
  status: 'planned' | 'in_progress' | 'completed' | 'skipped';
  plannedTime?: string; // HH:MM format
  completedAt?: Date;
  evidence?: {
    type: 'text' | 'photo' | 'video';
    content: string; // Text content or file URL
    timestamp: Date;
  }[];
  notes?: string;
  pointsEarned: number;
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