export interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'student' | 'parent';
  parentId?: string;
  children?: string[];
  points: number;
  currentStreak: number;
  medals: {
    bronze: boolean;   // 7 days consecutive - 1.1x multiplier
    silver: boolean;   // 14 days consecutive - 1.2x multiplier
    gold: boolean;     // 30 days consecutive - 1.3x multiplier
    diamond: boolean;  // 60 days consecutive - 1.4x multiplier
  };
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  category: 'exercise' | 'reading' | 'chores' | 'learning' | 'creativity' | 'other';
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number;
  points: number;
  requiresEvidence: boolean;
  evidenceTypes: ('text' | 'photo' | 'video')[];
  tags: string[];
  createdBy: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DailyTask {
  id: string;
  userId: string;
  taskId: string;
  date: string;
  status: 'planned' | 'in_progress' | 'completed' | 'skipped';
  plannedTime?: string;
  plannedEndTime?: string;
  reminderTime?: string;
  priority?: 'low' | 'medium' | 'high';
  timePreference?: 'morning' | 'afternoon' | 'evening' | 'flexible';
  planningNotes?: string;
  completedAt?: Date;
  evidenceText?: string;
  evidenceMedia?: any[];
  evidence?: {
    type: 'text' | 'photo' | 'video' | 'audio';
    content: string;
    timestamp: Date;
    fileName?: string;
    fileSize?: number;
  }[];
  notes?: string;
  isPublic?: boolean;
  pointsEarned: number;
  createdAt: Date;
  updatedAt: Date;
  task?: Task;
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
  processedBy?: string;
  notes?: string;
}

export interface GameTimeExchange {
  id: string;
  userId: string;
  date: string;
  pointsSpent: number;
  gameType: 'normal' | 'educational';
  minutesGranted: number;
  minutesUsed: number;
  createdAt: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string, role: 'student' | 'parent', parentEmail?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (displayName?: string, avatar?: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}