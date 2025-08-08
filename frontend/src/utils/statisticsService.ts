/**
 * Unified Statistics Service
 * Provides consistent date calculations, week calculations, and statistics utilities
 * across all components in the application.
 */

export interface DateRange {
  start: string;
  end: string;
}

export interface WeekInfo {
  monday: Date;
  sunday: Date;
  weekNumber: number;
  year: number;
}

export interface StatsPeriod {
  type: 'today' | 'week' | 'month' | 'year' | 'custom';
  label: string;
  dateRange: DateRange;
}

/**
 * Format a date to YYYY-MM-DD string consistently
 */
export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Parse a date string consistently, handling timezone issues
 */
export const parseDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Get current week info (Monday to Sunday)
 * This is the standard week calculation used throughout the app
 */
export const getCurrentWeek = (referenceDate?: Date): WeekInfo => {
  const now = referenceDate || new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Calculate Monday of current week
  const monday = new Date(now);
  monday.setDate(now.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
  monday.setHours(0, 0, 0, 0);
  
  // Calculate Sunday of current week
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  
  // Calculate week number (ISO week)
  const weekNumber = getWeekNumber(monday);
  
  return {
    monday,
    sunday,
    weekNumber,
    year: monday.getFullYear(),
  };
};

/**
 * Get ISO week number for a given date
 */
export const getWeekNumber = (date: Date): number => {
  const target = new Date(date.valueOf());
  const dayNumber = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNumber + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
};

/**
 * Get predefined date ranges for common statistics periods
 */
export const getStatsPeriod = (type: StatsPeriod['type'], customRange?: DateRange): StatsPeriod => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (type) {
    case 'today':
      return {
        type: 'today',
        label: '今天',
        dateRange: {
          start: formatDate(today),
          end: formatDate(today)
        }
      };
      
    case 'week': {
      const week = getCurrentWeek();
      return {
        type: 'week',
        label: '本周',
        dateRange: {
          start: formatDate(week.monday),
          end: formatDate(week.sunday)
        }
      };
    }
    
    case 'month': {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return {
        type: 'month',
        label: '本月',
        dateRange: {
          start: formatDate(monthStart),
          end: formatDate(monthEnd)
        }
      };
    }
    
    case 'year': {
      const yearStart = new Date(today.getFullYear(), 0, 1);
      const yearEnd = new Date(today.getFullYear(), 11, 31);
      return {
        type: 'year',
        label: '今年',
        dateRange: {
          start: formatDate(yearStart),
          end: formatDate(yearEnd)
        }
      };
    }
    
    case 'custom':
      return {
        type: 'custom',
        label: '自定义',
        dateRange: customRange || {
          start: formatDate(new Date(today.getFullYear() - 1, 0, 1)),
          end: formatDate(today)
        }
      };
      
    default:
      return getStatsPeriod('week');
  }
};

/**
 * Calculate completion rate as a percentage
 */
export const calculateCompletionRate = (completed: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
};

/**
 * Calculate average value
 */
export const calculateAverage = (values: number[]): number => {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return Math.round(sum / values.length);
};

/**
 * Format points for display with proper localization
 */
export const formatPoints = (points: number): string => {
  return points.toLocaleString('zh-CN');
};

/**
 * Calculate streak progress and next milestone
 */
export const calculateStreakProgress = (currentStreak: number): {
  level: number;
  progress: number;
  nextMilestone: number;
  progressPercent: number;
} => {
  const milestones = [3, 7, 14, 30, 60, 100];
  let level = 1;
  let nextMilestone = milestones[0];
  
  for (const milestone of milestones) {
    if (currentStreak >= milestone) {
      level++;
      continue;
    }
    nextMilestone = milestone;
    break;
  }
  
  if (currentStreak >= milestones[milestones.length - 1]) {
    nextMilestone = milestones[milestones.length - 1];
  }
  
  const progressPercent = Math.round((currentStreak / nextMilestone) * 100);
  
  return {
    level,
    progress: currentStreak,
    nextMilestone,
    progressPercent: Math.min(progressPercent, 100),
  };
};

/**
 * Check if a date falls within a date range
 */
export const isDateInRange = (date: string | Date, range: DateRange): boolean => {
  const checkDate = typeof date === 'string' ? date : formatDate(date);
  return checkDate >= range.start && checkDate <= range.end;
};

/**
 * Get relative date description (e.g., "今天", "昨天", "3天前")
 */
export const getRelativeDateDescription = (date: Date | string): string => {
  const targetDate = typeof date === 'string' ? parseDate(date) : date;
  const today = new Date();
  const diffTime = today.getTime() - targetDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '昨天';
  if (diffDays === 2) return '前天';
  if (diffDays > 0 && diffDays <= 7) return `${diffDays}天前`;
  if (diffDays > 7) return formatDate(targetDate);
  
  // Future dates
  if (diffDays === -1) return '明天';
  if (diffDays === -2) return '后天';
  if (diffDays < 0) return `${Math.abs(diffDays)}天后`;
  
  return formatDate(targetDate);
};

/**
 * Calculate weekly goal progress
 */
export const calculateWeeklyProgress = (completed: number, goal: number = 7): {
  completed: number;
  goal: number;
  percentage: number;
  remaining: number;
  isGoalMet: boolean;
} => {
  const percentage = calculateCompletionRate(completed, goal);
  const remaining = Math.max(0, goal - completed);
  const isGoalMet = completed >= goal;
  
  return {
    completed,
    goal,
    percentage,
    remaining,
    isGoalMet,
  };
};

/**
 * Group transactions or tasks by date for timeline display
 */
export const groupByDate = <T extends { date: Date | string }>(
  items: T[]
): Record<string, T[]> => {
  return items.reduce((groups, item) => {
    const dateKey = typeof item.date === 'string' ? item.date : formatDate(item.date);
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(item);
    return groups;
  }, {} as Record<string, T[]>);
};

/**
 * Statistics validation and sanitization
 */
export const sanitizeStatsInput = (input: any): {
  isValid: boolean;
  sanitized: any;
  errors: string[];
} => {
  const errors: string[] = [];
  const sanitized: any = {};
  
  // Validate numeric fields
  const numericFields = ['completed', 'total', 'points', 'streak'];
  numericFields.forEach(field => {
    if (input[field] !== undefined) {
      const num = Number(input[field]);
      if (isNaN(num) || num < 0) {
        errors.push(`${field} must be a non-negative number`);
        sanitized[field] = 0;
      } else {
        sanitized[field] = Math.floor(num); // Ensure integer
      }
    }
  });
  
  // Validate date fields
  const dateFields = ['startDate', 'endDate', 'date'];
  dateFields.forEach(field => {
    if (input[field] !== undefined) {
      try {
        const date = typeof input[field] === 'string' ? parseDate(input[field]) : new Date(input[field]);
        if (isNaN(date.getTime())) {
          errors.push(`${field} is not a valid date`);
        } else {
          sanitized[field] = formatDate(date);
        }
      } catch (error) {
        errors.push(`${field} is not a valid date`);
      }
    }
  });
  
  return {
    isValid: errors.length === 0,
    sanitized,
    errors,
  };
};