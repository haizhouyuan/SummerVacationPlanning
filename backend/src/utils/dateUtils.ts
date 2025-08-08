/**
 * Unified Date Utilities for Backend
 * Provides consistent date calculations matching frontend statisticsService
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
  weekStart: string; // YYYY-MM-DD format
  weekEnd: string;   // YYYY-MM-DD format
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
 * Get current week info (Monday to Sunday) - UNIFIED IMPLEMENTATION
 * This matches the frontend getCurrentWeek function exactly
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
    weekStart: formatDate(monday),
    weekEnd: formatDate(sunday),
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
 * Get today's date info
 */
export const getToday = (): { date: Date; dateString: string } => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return {
    date: today,
    dateString: formatDate(today)
  };
};

/**
 * Get month start and end dates
 */
export const getCurrentMonth = (referenceDate?: Date): {
  monthStart: Date;
  monthEnd: Date;
  monthStartString: string;
  monthEndString: string;
} => {
  const now = referenceDate || new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  monthStart.setHours(0, 0, 0, 0);
  
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  monthEnd.setHours(23, 59, 59, 999);
  
  return {
    monthStart,
    monthEnd,
    monthStartString: formatDate(monthStart),
    monthEndString: formatDate(monthEnd),
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