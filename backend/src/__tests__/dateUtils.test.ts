/**
 * 日期工具函数单元测试
 * 测试日期处理、周计算、月计算等核心功能
 */

import {
  formatDate,
  parseDate,
  getCurrentWeek,
  getWeekNumber,
  getToday,
  getCurrentMonth,
  isDateInRange,
  calculateCompletionRate,
  calculateAverage,
} from '../utils/dateUtils';

describe('DateUtils Tests', () => {
  beforeEach(() => {
    // Reset any global state if needed
  });

  describe('formatDate', () => {
    it('应该正确格式化日期为YYYY-MM-DD', () => {
      const date = new Date(2024, 7, 15); // 2024-08-15
      expect(formatDate(date)).toBe('2024-08-15');
    });

    it('应该正确处理月份和日期的零填充', () => {
      const date = new Date(2024, 0, 5); // 2024-01-05
      expect(formatDate(date)).toBe('2024-01-05');
    });

    it('应该处理闰年的2月29日', () => {
      const date = new Date(2024, 1, 29); // 2024-02-29 (闰年)
      expect(formatDate(date)).toBe('2024-02-29');
    });
  });

  describe('parseDate', () => {
    it('应该正确解析YYYY-MM-DD格式的日期', () => {
      const dateString = '2024-08-15';
      const parsed = parseDate(dateString);
      expect(parsed.getFullYear()).toBe(2024);
      expect(parsed.getMonth()).toBe(7); // 0-indexed
      expect(parsed.getDate()).toBe(15);
    });

    it('应该处理月份和日期的前导零', () => {
      const dateString = '2024-01-05';
      const parsed = parseDate(dateString);
      expect(parsed.getFullYear()).toBe(2024);
      expect(parsed.getMonth()).toBe(0);
      expect(parsed.getDate()).toBe(5);
    });
  });

  describe('getCurrentWeek', () => {
    it('应该返回包含指定日期的周（周一到周日）', () => {
      // 2024年8月15日是周四
      const thursday = new Date(2024, 7, 15);
      const week = getCurrentWeek(thursday);
      
      // 本周周一应该是8月12日
      expect(formatDate(week.monday)).toBe('2024-08-12');
      // 本周周日应该是8月18日
      expect(formatDate(week.sunday)).toBe('2024-08-18');
      expect(week.year).toBe(2024);
    });

    it('应该正确处理跨月的周', () => {
      // 2024年8月31日是周六
      const saturday = new Date(2024, 7, 31);
      const week = getCurrentWeek(saturday);
      
      // 本周周一应该是8月26日
      expect(formatDate(week.monday)).toBe('2024-08-26');
      // 本周周日应该是9月1日
      expect(formatDate(week.sunday)).toBe('2024-09-01');
    });

    it('应该正确处理周日作为参考日期', () => {
      // 2024年8月18日是周日
      const sunday = new Date(2024, 7, 18);
      const week = getCurrentWeek(sunday);
      
      // 本周周一应该是8月12日
      expect(formatDate(week.monday)).toBe('2024-08-12');
      // 本周周日应该是8月18日（同一天）
      expect(formatDate(week.sunday)).toBe('2024-08-18');
    });
  });

  describe('getWeekNumber', () => {
    it('应该返回正确的ISO周号', () => {
      // 2024年第1周
      const jan1 = new Date(2024, 0, 1);
      expect(getWeekNumber(jan1)).toBe(1);
      
      // 2024年第30周（大约7月底）
      const july29 = new Date(2024, 6, 29);
      expect(getWeekNumber(july29)).toBeGreaterThan(29);
      expect(getWeekNumber(july29)).toBeLessThan(32);
    });

    it('应该处理年底的周号', () => {
      const dec31 = new Date(2024, 11, 31);
      const weekNum = getWeekNumber(dec31);
      expect(weekNum).toBeGreaterThan(50);
      expect(weekNum).toBeLessThanOrEqual(53);
    });
  });

  describe('getToday', () => {
    it('应该返回今天的日期信息', () => {
      const today = getToday();
      const now = new Date();
      
      expect(today.date.getFullYear()).toBe(now.getFullYear());
      expect(today.date.getMonth()).toBe(now.getMonth());
      expect(today.date.getDate()).toBe(now.getDate());
      expect(today.date.getHours()).toBe(0);
      expect(today.date.getMinutes()).toBe(0);
      expect(today.date.getSeconds()).toBe(0);
      expect(today.date.getMilliseconds()).toBe(0);
    });
  });

  describe('getCurrentMonth', () => {
    it('应该返回当前月份的开始和结束日期', () => {
      const august2024 = new Date(2024, 7, 15);
      const month = getCurrentMonth(august2024);
      
      expect(month.monthStartString).toBe('2024-08-01');
      expect(month.monthEndString).toBe('2024-08-31');
      
      // 检查时间设置
      expect(month.monthStart.getHours()).toBe(0);
      expect(month.monthEnd.getHours()).toBe(23);
      expect(month.monthEnd.getMinutes()).toBe(59);
    });

    it('应该正确处理2月（非闰年）', () => {
      const feb2023 = new Date(2023, 1, 15);
      const month = getCurrentMonth(feb2023);
      
      expect(month.monthStartString).toBe('2023-02-01');
      expect(month.monthEndString).toBe('2023-02-28');
    });

    it('应该正确处理2月（闰年）', () => {
      const feb2024 = new Date(2024, 1, 15);
      const month = getCurrentMonth(feb2024);
      
      expect(month.monthStartString).toBe('2024-02-01');
      expect(month.monthEndString).toBe('2024-02-29');
    });
  });

  describe('isDateInRange', () => {
    const range = { start: '2024-08-01', end: '2024-08-31' };

    it('应该正确判断日期是否在范围内', () => {
      expect(isDateInRange('2024-08-15', range)).toBe(true);
      expect(isDateInRange('2024-08-01', range)).toBe(true); // 边界
      expect(isDateInRange('2024-08-31', range)).toBe(true); // 边界
    });

    it('应该正确判断日期不在范围内', () => {
      expect(isDateInRange('2024-07-31', range)).toBe(false);
      expect(isDateInRange('2024-09-01', range)).toBe(false);
    });

    it('应该处理Date对象输入', () => {
      const date = new Date(2024, 7, 15);
      expect(isDateInRange(date, range)).toBe(true);
    });
  });

  describe('calculateCompletionRate', () => {
    it('应该正确计算完成率', () => {
      expect(calculateCompletionRate(8, 10)).toBe(80);
      expect(calculateCompletionRate(3, 4)).toBe(75);
      expect(calculateCompletionRate(10, 10)).toBe(100);
      expect(calculateCompletionRate(0, 10)).toBe(0);
    });

    it('应该处理除零的情况', () => {
      expect(calculateCompletionRate(5, 0)).toBe(0);
      expect(calculateCompletionRate(0, 0)).toBe(0);
    });

    it('应该四舍五入到最近的整数', () => {
      expect(calculateCompletionRate(1, 3)).toBe(33); // 33.333...
      expect(calculateCompletionRate(2, 3)).toBe(67); // 66.666...
    });
  });

  describe('calculateAverage', () => {
    it('应该正确计算平均值', () => {
      expect(calculateAverage([10, 20, 30])).toBe(20);
      expect(calculateAverage([15, 25])).toBe(20);
      expect(calculateAverage([100])).toBe(100);
    });

    it('应该处理空数组', () => {
      expect(calculateAverage([])).toBe(0);
    });

    it('应该四舍五入到最近的整数', () => {
      expect(calculateAverage([10, 11, 12])).toBe(11); // 11
      expect(calculateAverage([10, 15])).toBe(13); // 12.5 -> 13
    });

    it('应该处理负数', () => {
      expect(calculateAverage([-10, 10, 20])).toBe(7); // 20/3 = 6.666... -> 7
      expect(calculateAverage([-5, -10])).toBe(-8); // -7.5 -> -8
    });
  });

  describe('边界情况测试', () => {
    it('应该处理年份边界', () => {
      // 测试跨年的周
      const dec31_2023 = new Date(2023, 11, 31); // 2023-12-31是周日
      const week = getCurrentWeek(dec31_2023);
      expect(week.year).toBe(2023);
    });

    it('应该处理月份边界', () => {
      // 测试跨月的情况
      const jan31 = new Date(2024, 0, 31);
      const week = getCurrentWeek(jan31);
      expect(week.monday.getMonth()).toBe(0); // 仍在1月
    });
  });
});