import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import ParentApprovalDashboard from '../ParentApprovalDashboard';

// Mock the AuthContext
const mockUser = {
  id: 'parent-1',
  email: 'parent@test.com',
  displayName: 'Test Parent',
  role: 'parent' as const,
  children: ['child-1', 'child-2'],
  points: 0,
  currentStreak: 0,
  medals: { bronze: false, silver: false, gold: false, diamond: false },
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockRefreshUser = jest.fn();

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    refreshUser: mockRefreshUser,
  }),
}));

// Mock fetch
const mockPendingTasks = [
  {
    id: 'task-1',
    studentId: 'child-1',
    studentName: 'Child One',
    task: {
      id: 'task-template-1',
      title: '数学作业',
      description: '完成数学练习册第10页',
      category: 'learning',
      points: 15,
    },
    evidenceText: '我已经完成了所有题目',
    evidenceMedia: [],
    notes: '',
    submittedAt: new Date('2023-12-01T10:00:00Z'),
    status: 'pending',
    pointsEarned: 15,
  },
  {
    id: 'task-2',
    studentId: 'child-2',
    studentName: 'Child Two',
    task: {
      id: 'task-template-2',
      title: '英语阅读',
      description: '阅读英语故事书',
      category: 'reading',
      points: 10,
    },
    evidenceText: '读了小红帽的故事',
    evidenceMedia: [
      {
        type: 'image',
        filename: 'reading-photo.jpg',
        url: '/uploads/reading-photo.jpg',
        size: 1024,
        mimetype: 'image/jpeg'
      }
    ],
    notes: '很有趣的故事',
    submittedAt: new Date('2023-12-01T11:00:00Z'),
    status: 'pending',
    pointsEarned: 10,
  }
];

global.fetch = jest.fn();

describe('ParentApprovalDashboard', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
    
    // Mock successful pending tasks response
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: { tasks: mockPendingTasks }
      }),
    });

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => 'mock-token'),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });
  });

  it('renders parent approval dashboard', async () => {
    render(<ParentApprovalDashboard />);

    expect(screen.getByText('家长审批仪表板')).toBeInTheDocument();
    expect(screen.getByText('管理孩子的任务完成情况')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('数学作业')).toBeInTheDocument();
      expect(screen.getByText('英语阅读')).toBeInTheDocument();
    });
  });

  it('shows pending tasks count', async () => {
    render(<ParentApprovalDashboard />);

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  it('displays task details correctly', async () => {
    render(<ParentApprovalDashboard />);

    await waitFor(() => {
      expect(screen.getByText('数学作业')).toBeInTheDocument();
      expect(screen.getByText('学生: Child One • 15 积分')).toBeInTheDocument();
      expect(screen.getByText('我已经完成了所有题目')).toBeInTheDocument();
      
      expect(screen.getByText('英语阅读')).toBeInTheDocument();
      expect(screen.getByText('学生: Child Two • 10 积分')).toBeInTheDocument();
      expect(screen.getByText('读了小红帽的故事')).toBeInTheDocument();
    });
  });

  it('allows single task approval', async () => {
    (fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/pending-approval')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: { tasks: mockPendingTasks }
          }),
        });
      }
      if (url.includes('/approve')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: { task: { ...mockPendingTasks[0], approvalStatus: 'approved' } }
          }),
        });
      }
      return Promise.resolve({ ok: false });
    });

    render(<ParentApprovalDashboard />);

    await waitFor(() => {
      expect(screen.getByText('数学作业')).toBeInTheDocument();
    });

    const approveButtons = screen.getAllByText('✅ 通过');
    fireEvent.click(approveButtons[0]);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/daily-tasks/task-1/approve'),
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token',
          }),
          body: expect.stringContaining('"action":"approve"'),
        })
      );
    });
  });

  it('allows single task rejection', async () => {
    (fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/pending-approval')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: { tasks: mockPendingTasks }
          }),
        });
      }
      if (url.includes('/approve')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: { task: { ...mockPendingTasks[0], approvalStatus: 'rejected' } }
          }),
        });
      }
      return Promise.resolve({ ok: false });
    });

    render(<ParentApprovalDashboard />);

    await waitFor(() => {
      expect(screen.getByText('数学作业')).toBeInTheDocument();
    });

    const rejectButtons = screen.getAllByText('❌ 拒绝');
    fireEvent.click(rejectButtons[0]);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/daily-tasks/task-1/approve'),
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('"action":"reject"'),
        })
      );
    });
  });

  it('supports task selection for batch operations', async () => {
    render(<ParentApprovalDashboard />);

    await waitFor(() => {
      expect(screen.getByText('数学作业')).toBeInTheDocument();
    });

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    expect(screen.getByText('已选择 1 个任务')).toBeInTheDocument();
    expect(screen.getByText('批量通过')).toBeInTheDocument();
    expect(screen.getByText('批量拒绝')).toBeInTheDocument();
  });

  it('supports bonus points input', async () => {
    render(<ParentApprovalDashboard />);

    await waitFor(() => {
      expect(screen.getByText('数学作业')).toBeInTheDocument();
    });

    const bonusInputs = screen.getAllByPlaceholderText('0');
    fireEvent.change(bonusInputs[0], { target: { value: '5' } });

    expect((bonusInputs[0] as HTMLInputElement).value).toBe('5');
  });

  it('filters tasks by student', async () => {
    render(<ParentApprovalDashboard />);

    await waitFor(() => {
      expect(screen.getByText('数学作业')).toBeInTheDocument();
      expect(screen.getByText('英语阅读')).toBeInTheDocument();
    });

    const studentFilter = screen.getByDisplayValue('所有孩子');
    fireEvent.change(studentFilter, { target: { value: 'child-1' } });

    // This would trigger re-filtering in the actual component
    expect(studentFilter).toHaveValue('child-1');
  });

  it('shows empty state when no pending tasks', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: { tasks: [] }
      }),
    });

    render(<ParentApprovalDashboard />);

    await waitFor(() => {
      expect(screen.getByText('暂无待审批任务')).toBeInTheDocument();
      expect(screen.getByText('所有任务都已处理完毕')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
    });

    render(<ParentApprovalDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load pending tasks')).toBeInTheDocument();
    });
  });

  it('restricts access to non-parent users', () => {
    jest.doMock('../../contexts/AuthContext', () => ({
      useAuth: () => ({
        user: { ...mockUser, role: 'student' },
        refreshUser: jest.fn(),
      }),
    }));

    // Re-import the component after mocking
    const { ParentApprovalDashboard: RestrictedComponent } = require('../ParentApprovalDashboard');

    render(<RestrictedComponent />);

    expect(screen.getByText('访问受限')).toBeInTheDocument();
    expect(screen.getByText('只有家长可以访问审批仪表板')).toBeInTheDocument();
  });
});