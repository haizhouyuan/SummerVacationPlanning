/**
 * 前端统计服务单元测试
 * 测试日期处理、周期计算、统计工具函数等
 */

import {
  formatDate,
  parseDate,
  getCurrentWeek,
  getWeekNumber,
  getStatsPeriod,
  calculateCompletionRate,
  calculateAverage,
  formatPoints,
  calculateStreakProgress,
} from '../statisticsService';

describe('StatisticsService Tests', () => {
  beforeEach(() => {
    // 固定时间以确保测试的一致性
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-08-15T10:00:00Z')); // 2024年8月15日周四
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('日期格式化和解析', () => {
    it('formatDate应该正确格式化日期', () => {
      const date = new Date(2024, 7, 15); // 2024-08-15
      expect(formatDate(date)).toBe('2024-08-15');
    });

    it('formatDate应该处理零填充', () => {
      const date = new Date(2024, 0, 5); // 2024-01-05
      expect(formatDate(date)).toBe('2024-01-05');
    });

    it('parseDate应该正确解析日期字符串', () => {
      const parsed = parseDate('2024-08-15');
      expect(parsed.getFullYear()).toBe(2024);
      expect(parsed.getMonth()).toBe(7); // 0-indexed
      expect(parsed.getDate()).toBe(15);
    });

    it('formatDate和parseDate应该互相兼容', () => {
      const original = new Date(2024, 7, 15);
      const formatted = formatDate(original);
      const parsed = parseDate(formatted);
      
      expect(parsed.getFullYear()).toBe(original.getFullYear());
      expect(parsed.getMonth()).toBe(original.getMonth());
      expect(parsed.getDate()).toBe(original.getDate());
    });
  });

  describe('周计算功能', () => {
    it('getCurrentWeek应该返回包含指定日期的周', () => {
      const thursday = new Date(2024, 7, 15); // 2024年8月15日周四
      const week = getCurrentWeek(thursday);
      
      // 应该返回8月12日(周一)到8月18日(周日)
      expect(formatDate(week.monday)).toBe('2024-08-12');
      expect(formatDate(week.sunday)).toBe('2024-08-18');
      expect(week.year).toBe(2024);
    });

    it('getCurrentWeek应该正确处理周日', () => {
      const sunday = new Date(2024, 7, 18); // 2024年8月18日周日
      const week = getCurrentWeek(sunday);
      
      expect(formatDate(week.monday)).toBe('2024-08-12');
      expect(formatDate(week.sunday)).toBe('2024-08-18');
    });

    it('getCurrentWeek应该正确处理周一', () => {
      const monday = new Date(2024, 7, 12); // 2024年8月12日周一
      const week = getCurrentWeek(monday);
      
      expect(formatDate(week.monday)).toBe('2024-08-12');
      expect(formatDate(week.sunday)).toBe('2024-08-18');
    });

    it('getWeekNumber应该返回合理的周号', () => {
      const date = new Date(2024, 7, 15);
      const weekNum = getWeekNumber(date);
      expect(weekNum).toBeGreaterThan(30);
      expect(weekNum).toBeLessThan(35);
    });
  });

  describe('统计周期计算', () => {
    beforeEach(() => {
      jest.setSystemTime(new Date('2024-08-15T10:00:00Z'));
    });

    it('getStatsPeriod应该返回今天的日期范围', () => {
      const period = getStatsPeriod('today');
      expect(period).toEqual({
        type: 'today',
        label: '今天',
        dateRange: {
          start: '2024-08-15',
          end: '2024-08-15',
        },
      });
    });

    it('getStatsPeriod应该返回本周的日期范围', () => {
      const period = getStatsPeriod('week');
      expect(period).toEqual({
        type: 'week',
        label: '本周',
        dateRange: {
          start: '2024-08-12', // 周一
          end: '2024-08-18',   // 周日
        },
      });
    });

    it('getStatsPeriod应该返回本月的日期范围', () => {
      const period = getStatsPeriod('month');
      expect(period).toEqual({
        type: 'month',
        label: '本月',
        dateRange: {
          start: '2024-08-01',
          end: '2024-08-31',
        },
      });
    });

    it('getStatsPeriod应该返回今年的日期范围', () => {
      const period = getStatsPeriod('year');
      expect(period).toEqual({
        type: 'year',
        label: '今年',
        dateRange: {
          start: '2024-01-01',
          end: '2024-12-31',
        },
      });
    });

    it('getStatsPeriod应该处理自定义日期范围', () => {
      const customRange = { start: '2024-07-01', end: '2024-07-31' };
      const period = getStatsPeriod('custom', customRange);
      expect(period).toEqual({
        type: 'custom',
        label: '自定义',
        dateRange: customRange,
      });
    });

    it('getStatsPeriod应该为无效类型返回默认值', () => {
      const period = getStatsPeriod('invalid' as any);
      expect(period.type).toBe('week');
      expect(period.label).toBe('本周');
    });
  });

  describe('统计计算函数', () => {
    it('calculateCompletionRate应该正确计算完成率', () => {
      expect(calculateCompletionRate(8, 10)).toBe(80);
      expect(calculateCompletionRate(3, 4)).toBe(75);
      expect(calculateCompletionRate(10, 10)).toBe(100);
      expect(calculateCompletionRate(0, 10)).toBe(0);
    });

    it('calculateCompletionRate应该处理除零情况', () => {
      expect(calculateCompletionRate(5, 0)).toBe(0);
      expect(calculateCompletionRate(0, 0)).toBe(0);
    });

    it('calculateCompletionRate应该四舍五入', () => {
      expect(calculateCompletionRate(1, 3)).toBe(33);
      expect(calculateCompletionRate(2, 3)).toBe(67);
    });

    it('calculateAverage应该正确计算平均值', () => {
      expect(calculateAverage([10, 20, 30])).toBe(20);
      expect(calculateAverage([15, 25])).toBe(20);
      expect(calculateAverage([100])).toBe(100);
    });

    it('calculateAverage应该处理空数组', () => {
      expect(calculateAverage([])).toBe(0);
    });

    it('calculateAverage应该四舍五入', () => {
      expect(calculateAverage([10, 11, 12])).toBe(11);
      expect(calculateAverage([10, 15])).toBe(13); // 12.5 -> 13
    });
  });

  describe('积分和显示格式化', () => {
    it('formatPoints应该格式化积分显示', () => {
      expect(formatPoints(1000)).toBe('1,000');
      expect(formatPoints(50000)).toBe('50,000');
      expect(formatPoints(123)).toBe('123');
      expect(formatPoints(0)).toBe('0');
    });

    it('formatPoints应该使用中文本地化', () => {
      expect(formatPoints(1234567)).toBe('1,234,567');
    });
  });

  describe('连续天数进度计算', () => {
    it('calculateStreakProgress应该为低连续天数返回正确信息', () => {
      const progress = calculateStreakProgress(2);
      expect(progress).toEqual({
        level: 1,
        progress: 2,
        nextMilestone: 3,
        progressPercent: expect.closeTo(66.67, 2), // 2/3 * 100
      });
    });

    it('calculateStreakProgress应该为中等连续天数计算正确等级', () => {
      const progress = calculateStreakProgress(10);
      expect(progress).toEqual({
        level: 3, // 超过了3和7的里程碑
        progress: 10,
        nextMilestone: 14,
        progressPercent: expect.closeTo(71.43, 2), // 10/14 * 100
      });
    });

    it('calculateStreakProgress应该为高连续天数计算正确等级', () => {
      const progress = calculateStreakProgress(45);
      expect(progress).toEqual({
        level: 5, // 超过了3,7,14,30的里程碑
        progress: 45,
        nextMilestone: 60,
        progressPercent: 75, // 45/60 * 100
      });
    });

    it('calculateStreakProgress应该处理最高等级', () => {
      const progress = calculateStreakProgress(120);
      expect(progress).toEqual({
        level: 7, // 超过所有里程碑
        progress: 120,
        nextMilestone: 100,
        progressPercent: 120, // 超过100%
      });
    });

    it('calculateStreakProgress应该处理零连续天数', () => {
      const progress = calculateStreakProgress(0);
      expect(progress).toEqual({
        level: 1,
        progress: 0,
        nextMilestone: 3,
        progressPercent: 0,
      });
    });

    it('calculateStreakProgress应该处理刚好达到里程碑的情况', () => {
      const progress = calculateStreakProgress(7);
      expect(progress).toEqual({
        level: 3, // 刚好达到7天里程碑，进入下一级
        progress: 7,
        nextMilestone: 14,
        progressPercent: 50, // 7/14 * 100
      });
    });
  });

  describe('边界情况测试', () => {
    it('应该处理闰年的2月', () => {
      jest.setSystemTime(new Date('2024-02-29T10:00:00Z')); // 闰年2月29日
      
      const period = getStatsPeriod('month');
      expect(period.dateRange.end).toBe('2024-02-29');
    });

    it('应该处理平年的2月', () => {
      jest.setSystemTime(new Date('2023-02-28T10:00:00Z')); // 平年2月28日
      
      const period = getStatsPeriod('month');
      expect(period.dateRange.end).toBe('2023-02-28');
    });

    it('应该处理跨年的周', () => {
      jest.setSystemTime(new Date('2024-01-01T10:00:00Z')); // 新年第一天
      
      const week = getCurrentWeek();
      // 2024年1月1日是周一，所以本周应该是1月1日到1月7日
      expect(formatDate(week.monday)).toBe('2024-01-01');
      expect(formatDate(week.sunday)).toBe('2024-01-07');
    });

    it('应该处理年底的情况', () => {
      jest.setSystemTime(new Date('2024-12-31T10:00:00Z')); // 年底
      
      const period = getStatsPeriod('year');
      expect(period.dateRange.start).toBe('2024-01-01');
      expect(period.dateRange.end).toBe('2024-12-31');
    });
  });

  describe('性能测试', () => {
    it('日期计算应该在合理时间内完成', () => {
      const startTime = performance.now();
      
      // 执行多次日期计算
      for (let i = 0; i < 1000; i++) {
        const date = new Date(2024, 7, i % 31 + 1);
        getCurrentWeek(date);
        formatDate(date);
      }
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100); // 应该在100ms内完成
    });

    it('统计计算应该处理大数组', () => {
      const largeArray = Array(10000).fill(0).map((_, i) => i);
      
      const startTime = performance.now();
      const average = calculateAverage(largeArray);
      const endTime = performance.now();
      
      expect(average).toBe(4999.5); // 数组的平均值
      expect(endTime - startTime).toBeLessThan(10); // 应该很快完成
    });
  });
});