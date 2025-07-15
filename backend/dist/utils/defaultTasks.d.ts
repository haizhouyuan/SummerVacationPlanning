import { Task } from '../types';
export declare const defaultTasks: Omit<Task, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>[];
export declare const initializeDefaultTasks: (systemUserId: string) => Promise<void>;
//# sourceMappingURL=defaultTasks.d.ts.map