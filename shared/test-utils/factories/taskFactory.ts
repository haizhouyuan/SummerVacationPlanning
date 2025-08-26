/**
 * Task Factory for Test Data Generation
 * 任务数据工厂 - 用于生成测试数据
 */

export interface TaskFactoryOptions {
  userId?: string;
  title?: string;
  category?: 'exercise' | 'reading' | 'chores' | 'learning' | 'creativity' | 'other';
  difficulty?: 'easy' | 'medium' | 'hard';
  points?: number;
  evidenceRequired?: boolean;
  timeEstimate?: number;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: 'exercise' | 'reading' | 'chores' | 'learning' | 'creativity' | 'other';
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  evidenceRequired: boolean;
  timeEstimate: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DailyTask {
  id: string;
  userId: string;
  taskId: string;
  date: string;
  status: 'planned' | 'in_progress' | 'completed' | 'skipped' | 'pending_approval';
  scheduledTime: Date;
  startedAt?: Date;
  completedAt?: Date;
  evidenceUrl?: string;
  notes?: string;
  pointsEarned?: number;
  createdAt: Date;
}

export class TaskFactory {
  private static taskCounter = 0;
  private static dailyTaskCounter = 0;
  
  private static readonly TEMPLATES = {
    exercise: [
      { title: '跑步30分钟', points: 50, timeEstimate: 30, evidenceRequired: true },
      { title: '做20个俯卧撑', points: 30, timeEstimate: 10, evidenceRequired: false },
      { title: '跳绳100下', points: 25, timeEstimate: 15, evidenceRequired: false },
      { title: '骑自行车1小时', points: 60, timeEstimate: 60, evidenceRequired: true },
      { title: '游泳30分钟', points: 55, timeEstimate: 30, evidenceRequired: true }
    ],
    reading: [
      { title: '阅读科普书籍1小时', points: 60, timeEstimate: 60, evidenceRequired: true },
      { title: '写读书笔记', points: 40, timeEstimate: 30, evidenceRequired: true },
      { title: '背诵古诗一首', points: 35, timeEstimate: 20, evidenceRequired: false },
      { title: '阅读课外书30页', points: 45, timeEstimate: 45, evidenceRequired: false },
      { title: '朗读课文', points: 25, timeEstimate: 15, evidenceRequired: false }
    ],
    chores: [
      { title: '整理房间', points: 45, timeEstimate: 45, evidenceRequired: true },
      { title: '洗碗', points: 20, timeEstimate: 15, evidenceRequired: false },
      { title: '倒垃圾', points: 15, timeEstimate: 10, evidenceRequired: false },
      { title: '拖地', points: 35, timeEstimate: 30, evidenceRequired: true },
      { title: '晾晒衣物', points: 25, timeEstimate: 20, evidenceRequired: false }
    ],
    learning: [
      { title: '完成数学作业', points: 40, timeEstimate: 45, evidenceRequired: true },
      { title: '复习英语单词', points: 30, timeEstimate: 30, evidenceRequired: false },
      { title: '练习书法', points: 35, timeEstimate: 40, evidenceRequired: true },
      { title: '学习新技能', points: 50, timeEstimate: 60, evidenceRequired: true },
      { title: '观看教育视频', points: 25, timeEstimate: 30, evidenceRequired: false }
    ],
    creativity: [
      { title: '画一幅画', points: 45, timeEstimate: 60, evidenceRequired: true },
      { title: '制作手工', points: 40, timeEstimate: 45, evidenceRequired: true },
      { title: '写作文', points: 50, timeEstimate: 40, evidenceRequired: true },
      { title: '创作音乐', points: 55, timeEstimate: 60, evidenceRequired: true },
      { title: '设计作品', points: 45, timeEstimate: 50, evidenceRequired: true }
    ],
    other: [
      { title: '帮助他人', points: 30, timeEstimate: 30, evidenceRequired: false },
      { title: '参与社区活动', points: 60, timeEstimate: 120, evidenceRequired: true },
      { title: '环保行动', points: 40, timeEstimate: 45, evidenceRequired: true }
    ]
  };
  
  /**
   * 创建单个任务
   */
  static async create(options: TaskFactoryOptions = {}): Promise<Task> {
    const counter = ++this.taskCounter;
    const category = options.category || 'exercise';
    const templates = this.TEMPLATES[category] || this.TEMPLATES.other;
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    const task: Task = {
      id: `task_${counter}_${Date.now()}`,
      userId: options.userId || 'default-user-id',
      title: options.title || `${template.title}_${counter}`,
      description: `这是一个${category}类型的测试任务`,
      category,
      difficulty: options.difficulty || 'medium',
      points: options.points || template.points,
      evidenceRequired: options.evidenceRequired !== undefined ? 
        options.evidenceRequired : template.evidenceRequired,
      timeEstimate: options.timeEstimate || template.timeEstimate || 30,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return task;
  }
  
  /**
   * 按分类创建任务
   */
  static async createByCategory(
    userId: string, 
    category: TaskFactoryOptions['category'], 
    count: number = 3
  ): Promise<Task[]> {
    const tasks = [];
    
    for (let i = 0; i < count; i++) {
      tasks.push(await this.create({
        userId,
        category
      }));
    }
    
    return tasks;
  }
  
  /**
   * 创建每日任务安排
   */
  static async createDailySchedule(userId: string, date: string): Promise<DailyTask[]> {
    // 为指定日期创建一天的任务安排
    const tasks = await Promise.all([
      this.create({ userId, category: 'exercise' }),
      this.create({ userId, category: 'reading' }),
      this.create({ userId, category: 'chores' })
    ]);
    
    const dailyTasks = tasks.map((task, index) => {
      const counter = ++this.dailyTaskCounter;
      return {
        id: `daily_${counter}_${Date.now()}`,
        userId,
        taskId: task.id,
        date,
        status: 'planned' as const,
        scheduledTime: new Date(`${date}T${8 + index * 2}:00:00`),
        createdAt: new Date()
      };
    });
    
    return dailyTasks;
  }
  
  /**
   * 创建完成的每日任务
   */
  static async createCompletedDailyTask(
    userId: string, 
    taskId: string, 
    date: string
  ): Promise<DailyTask> {
    const counter = ++this.dailyTaskCounter;
    
    return {
      id: `daily_${counter}_${Date.now()}`,
      userId,
      taskId,
      date,
      status: 'completed',
      scheduledTime: new Date(`${date}T09:00:00`),
      startedAt: new Date(`${date}T09:00:00`),
      completedAt: new Date(`${date}T10:00:00`),
      evidenceUrl: 'mock-evidence-url.jpg',
      notes: '任务完成得很好！',
      pointsEarned: 50,
      createdAt: new Date()
    };
  }
  
  /**
   * 批量创建任务
   */
  static async createBatch(count: number, options: TaskFactoryOptions = {}): Promise<Task[]> {
    const tasks = [];
    for (let i = 0; i < count; i++) {
      tasks.push(await this.create(options));
    }
    return tasks;
  }
  
  /**
   * 创建测试场景数据
   */
  static async createStudentWithTasks(options: {
    userId?: string;
    taskCount?: number;
    completedCount?: number;
    pointsEarned?: number;
  } = {}): Promise<{
    tasks: Task[];
    dailyTasks: DailyTask[];
    totalPoints: number;
  }> {
    const userId = options.userId || 'test-student-id';
    const taskCount = options.taskCount || 5;
    const completedCount = options.completedCount || 3;
    
    // 创建任务
    const tasks = await this.createBatch(taskCount, { userId });
    
    // 创建每日任务，其中一些已完成
    const dailyTasks: DailyTask[] = [];
    let totalPoints = 0;
    
    for (let i = 0; i < taskCount; i++) {
      const task = tasks[i];
      const isCompleted = i < completedCount;
      
      if (isCompleted) {
        const completedTask = await this.createCompletedDailyTask(
          userId, 
          task.id, 
          '2024-08-26'
        );
        dailyTasks.push(completedTask);
        totalPoints += completedTask.pointsEarned || 0;
      } else {
        const counter = ++this.dailyTaskCounter;
        dailyTasks.push({
          id: `daily_${counter}_${Date.now()}`,
          userId,
          taskId: task.id,
          date: '2024-08-26',
          status: 'planned',
          scheduledTime: new Date('2024-08-26T09:00:00'),
          createdAt: new Date()
        });
      }
    }
    
    return { tasks, dailyTasks, totalPoints };
  }
}