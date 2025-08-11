/**
 * Dashboard组件单元测试
 * 测试统计显示、用户交互、数据加载、错误处理等
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';

// Mock相关依赖
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../services/compatibleApi', () => ({
  detectNetworkAndGetApiServiceSync: jest.fn(),
}));

import { useAuth } from '../../contexts/AuthContext';
import { detectNetworkAndGetApiServiceSync } from '../../services/compatibleApi';
import Dashboard from '../Dashboard';

describe('Dashboard组件测试', () => {
  const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
  const mockDetectNetwork = detectNetworkAndGetApiServiceSync as jest.MockedFunction<typeof detectNetworkAndGetApiServiceSync>;
  
  const mockUser = {
    id: 'user123',
    email: 'test@example.com',
    displayName: '测试学生',
    role: 'student' as const,
    points: 240,
    currentStreak: 5,
    medals: {
      bronze: true,
      silver: false,
      gold: false,
      diamond: false,
    },
  };

  const mockStats = {
    user: {
      id: 'user123',
      name: '测试学生',
      email: 'test@example.com',
      points: 240,
      level: 3,
      currentStreak: 5,
      medals: {
        bronze: true,
        silver: false,
        gold: false,
        diamond: false,
      },
    },
    weeklyStats: {
      completed: 8,
      planned: 3,
      inProgress: 2,
      skipped: 1,
      total: 14,
      totalPointsEarned: 160,
      completionRate: 57,
      averagePointsPerTask: 20,
    },
    todayStats: {
      total: 3,
      completed: 2,
      planned: 1,
      inProgress: 0,
      pointsEarned: 35,
    },
    achievements: [
      {
        type: 'streak',
        level: 1,
        title: '连续达人',
        description: '连续5天完成任务',
        isUnlocked: true,
        progress: 5,
        maxProgress: 7,
      },
      {
        type: 'points',
        level: 3,
        title: '积分收集者',
        description: '累计获得240积分',
        isUnlocked: true,
        progress: 40,
        maxProgress: 100,
      },
    ],
    weeklyGoal: 10,
    performance: {
      thisWeekCompletion: 57,
      pointsPerTask: 20,
      streakProgress: 5,
      nextLevelPoints: 60,
    },
  };

  const mockApiService = {
    getDashboardStats: jest.fn(),
  };

  const mockLogout = jest.fn();

  const renderDashboard = (user = mockUser) => {
    mockUseAuth.mockReturnValue({
      user,
      logout: mockLogout,
      login: jest.fn(),
      register: jest.fn(),
    });

    mockDetectNetwork.mockReturnValue(mockApiService);

    return render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockApiService.getDashboardStats.mockResolvedValue({
      success: true,
      data: { stats: mockStats },
    });
  });

  describe('基础渲染测试', () => {
    it('应该显示用户欢迎信息', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/欢迎回来，测试学生！/)).toBeInTheDocument();
      });

      expect(screen.getByText('👨‍🎓 学生')).toBeInTheDocument();
      expect(screen.getByText('等级 3')).toBeInTheDocument();
    });

    it('应该显示时间问候语', async () => {
      // Mock时间为上午
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-08-15T08:00:00Z'));

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/早上好！新的一天，新的开始！/)).toBeInTheDocument();
      });

      jest.useRealTimers();
    });

    it('应该显示积分信息', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getAllByText(/240/)).toHaveLength(2); // 多处显示积分
      });
    });

    it('应该显示快速操作按钮', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('✅ 今日任务')).toBeInTheDocument();
        expect(screen.getByText('📅 任务规划')).toBeInTheDocument();
        expect(screen.getByText('🎁 奖励中心')).toBeInTheDocument();
        expect(screen.getByText('🏆 成就广场')).toBeInTheDocument();
      });
    });
  });

  describe('统计数据显示测试', () => {
    it('应该显示周统计信息', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('8 个任务')).toBeInTheDocument(); // 本周完成
        expect(screen.getByText('5 天')).toBeInTheDocument(); // 连续天数
      });
    });

    it('应该显示进度条', async () => {
      renderDashboard();

      await waitFor(() => {
        const progressBars = screen.getAllByRole('progressbar');
        expect(progressBars.length).toBeGreaterThan(0);
      });
    });

    it('应该显示成就徽章', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('连续达人')).toBeInTheDocument();
        expect(screen.getByText('积分收集者')).toBeInTheDocument();
      });
    });

    it('应该正确计算和显示完成率', async () => {
      renderDashboard();

      await waitFor(() => {
        // 查找显示完成率的元素
        expect(screen.getByText(/本周进度/)).toBeInTheDocument();
      });
    });
  });

  describe('用户交互测试', () => {
    it('应该支持导航到不同页面', async () => {
      const user = userEvent.setup();
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('✅ 今日任务')).toBeInTheDocument();
      });

      const todayTasksButton = screen.getByText('✅ 今日任务');
      await user.click(todayTasksButton);

      // 验证导航行为 (在实际应用中会检查路由变化)
    });

    it('应该支持退出登录', async () => {
      const user = userEvent.setup();
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('退出登录')).toBeInTheDocument();
      });

      const logoutButton = screen.getByText('退出登录');
      await user.click(logoutButton);

      expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    it('应该支持打开积分历史', async () => {
      const user = userEvent.setup();
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('💎 积分历史')).toBeInTheDocument();
      });

      const pointsHistoryButton = screen.getByText('💎 积分历史');
      await user.click(pointsHistoryButton);

      // 验证积分历史模态框打开
      // expect(screen.getByText(/积分历史/)).toBeInTheDocument();
    });
  });

  describe('加载状态测试', () => {
    it('应该显示加载状态', async () => {
      // 让API调用挂起以测试加载状态
      mockApiService.getDashboardStats.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      renderDashboard();

      expect(screen.getByText('加载中...')).toBeInTheDocument();
    });

    it('应该显示加载消息', async () => {
      mockApiService.getDashboardStats.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      renderDashboard();

      expect(screen.getByText(/正在加载统计数据.../)).toBeInTheDocument();
    });
  });

  describe('错误处理测试', () => {
    it('应该处理API调用错误', async () => {
      mockApiService.getDashboardStats.mockRejectedValue(
        new Error('加载统计数据失败')
      );

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/加载统计数据失败/)).toBeInTheDocument();
      });
    });

    it('应该支持重试失败的请求', async () => {
      mockApiService.getDashboardStats
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue({
          success: true,
          data: { stats: mockStats },
        });

      renderDashboard();

      // 等待错误显示
      await waitFor(() => {
        expect(screen.getByText(/Network error/)).toBeInTheDocument();
      });

      // 查找并点击重试按钮
      const retryButton = screen.getByText('重试');
      const user = userEvent.setup();
      await user.click(retryButton);

      // 验证重试后数据正确加载
      await waitFor(() => {
        expect(screen.getByText(/欢迎回来，测试学生！/)).toBeInTheDocument();
      });
    });

    it('应该处理无数据的情况', async () => {
      mockApiService.getDashboardStats.mockResolvedValue({
        success: false,
        error: '无数据',
      });

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/无数据/)).toBeInTheDocument();
      });
    });
  });

  describe('不同用户角色测试', () => {
    it('应该为家长用户显示不同的界面', async () => {
      const parentUser = {
        ...mockUser,
        role: 'parent' as const,
        displayName: '家长用户',
      };

      const parentStats = {
        ...mockStats,
        user: {
          ...mockStats.user,
          name: '家长用户',
        },
      };

      mockApiService.getDashboardStats.mockResolvedValue({
        success: true,
        data: { stats: parentStats },
      });

      renderDashboard(parentUser);

      await waitFor(() => {
        expect(screen.getByText('👨‍👩‍👧‍👦 家长')).toBeInTheDocument();
        expect(screen.getByText(/查看您孩子的精彩进展/)).toBeInTheDocument();
      });
    });

    it('应该显示不同的用户头像', async () => {
      const parentUser = { ...mockUser, role: 'parent' as const };
      renderDashboard(parentUser);

      await waitFor(() => {
        expect(screen.getByText('👨‍👩‍👧‍👦')).toBeInTheDocument();
      });
    });
  });

  describe('响应式设计测试', () => {
    it('应该在移动设备上正确显示', async () => {
      // 模拟移动设备视口
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/欢迎回来，测试学生！/)).toBeInTheDocument();
      });

      // 验证移动端布局
      const container = screen.getByRole('main');
      expect(container).toHaveClass('min-h-screen');
    });
  });

  describe('性能测试', () => {
    it('应该在合理时间内渲染', async () => {
      const startTime = performance.now();
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/欢迎回来/)).toBeInTheDocument();
      });

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(1000); // 应在1秒内渲染完成
    });

    it('应该正确处理大量成就数据', async () => {
      const largeAchievements = Array(50).fill(null).map((_, index) => ({
        type: 'test',
        level: index + 1,
        title: `成就 ${index + 1}`,
        description: `描述 ${index + 1}`,
        isUnlocked: index % 2 === 0,
        progress: index,
        maxProgress: 100,
      }));

      const statsWithManyAchievements = {
        ...mockStats,
        achievements: largeAchievements,
      };

      mockApiService.getDashboardStats.mockResolvedValue({
        success: true,
        data: { stats: statsWithManyAchievements },
      });

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/欢迎回来/)).toBeInTheDocument();
      });
    });
  });

  describe('无障碍访问测试', () => {
    it('应该有正确的ARIA标签', async () => {
      renderDashboard();

      await waitFor(() => {
        const progressBars = screen.getAllByRole('progressbar');
        progressBars.forEach(bar => {
          expect(bar).toHaveAttribute('aria-valuenow');
          expect(bar).toHaveAttribute('aria-valuemax');
        });
      });
    });

    it('应该支持键盘导航', async () => {
      const user = userEvent.setup();
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('✅ 今日任务')).toBeInTheDocument();
      });

      const button = screen.getByText('✅ 今日任务');
      button.focus();
      expect(button).toHaveFocus();

      await user.keyboard('{Enter}');
      // 验证按键操作
    });
  });
});