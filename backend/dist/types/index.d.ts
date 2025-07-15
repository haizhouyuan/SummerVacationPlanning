export interface User {
    id: string;
    email: string;
    displayName: string;
    role: 'student' | 'parent';
    parentId?: string;
    children?: string[];
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
    completedAt?: Date;
    evidence?: {
        type: 'text' | 'photo' | 'video';
        content: string;
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
    processedBy?: string;
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
//# sourceMappingURL=index.d.ts.map