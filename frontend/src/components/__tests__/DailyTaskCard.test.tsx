import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import DailyTaskCard from '../DailyTaskCard';
import { DailyTask } from '../../types';

// Mock components
jest.mock('../EvidenceModal', () => {
  return function MockEvidenceModal({ onClose, onSubmit, task }: any) {
    return (
      <div data-testid="evidence-modal">
        <button onClick={() => onSubmit({ evidenceText: 'Test evidence', evidenceMedia: [], notes: '', isPublic: false })}>
          Submit Evidence
        </button>
        <button onClick={onClose}>Close</button>
      </div>
    );
  };
});

jest.mock('../MediaPreview', () => {
  return function MockMediaPreview() {
    return <div data-testid="media-preview">Media Preview</div>;
  };
});

jest.mock('../TaskCategoryIcon', () => {
  return function MockTaskCategoryIcon() {
    return <div data-testid="category-icon">📚</div>;
  };
});

const mockTask = {
  id: 'task-1',
  title: '读书30分钟',
  description: '阅读课外书籍',
  category: 'reading',
  points: 10,
  estimatedTime: 30,
  requiresEvidence: true,
  evidenceTypes: ['text'],
  tags: [],
  createdBy: 'user-1',
  isPublic: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockDailyTask: DailyTask & { task?: any } = {
  id: 'daily-task-1',
  userId: 'user-1',
  taskId: 'task-1',
  date: '2023-12-01',
  status: 'planned',
  pointsEarned: 10,
  task: mockTask,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('DailyTaskCard', () => {
  const mockOnStatusUpdate = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    mockOnStatusUpdate.mockClear();
    mockOnDelete.mockClear();
  });

  it('renders daily task card with basic information', () => {
    render(
      <DailyTaskCard
        dailyTask={mockDailyTask}
        onStatusUpdate={mockOnStatusUpdate}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('读书30分钟')).toBeInTheDocument();
    expect(screen.getByText('阅读课外书籍')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('积分')).toBeInTheDocument();
  });

  it('shows planned task status and actions', () => {
    render(
      <DailyTaskCard
        dailyTask={mockDailyTask}
        onStatusUpdate={mockOnStatusUpdate}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('计划中')).toBeInTheDocument();
    expect(screen.getByText('🚀 开始任务')).toBeInTheDocument();
    expect(screen.getByText('✅ 标记完成')).toBeInTheDocument();
  });

  it('handles status update to in_progress', () => {
    render(
      <DailyTaskCard
        dailyTask={mockDailyTask}
        onStatusUpdate={mockOnStatusUpdate}
        onDelete={mockOnDelete}
      />
    );

    fireEvent.click(screen.getByText('🚀 开始任务'));

    expect(mockOnStatusUpdate).toHaveBeenCalledWith('daily-task-1', 'in_progress', '', [], false, '');
  });

  it('opens evidence modal when completing task that requires evidence', () => {
    render(
      <DailyTaskCard
        dailyTask={mockDailyTask}
        onStatusUpdate={mockOnStatusUpdate}
        onDelete={mockOnDelete}
      />
    );

    fireEvent.click(screen.getByText('✅ 标记完成'));

    expect(screen.getByTestId('evidence-modal')).toBeInTheDocument();
  });

  it('completes task directly when no evidence required', () => {
    const taskWithoutEvidence = {
      ...mockDailyTask,
      task: { ...mockTask, requiresEvidence: false }
    };

    render(
      <DailyTaskCard
        dailyTask={taskWithoutEvidence}
        onStatusUpdate={mockOnStatusUpdate}
        onDelete={mockOnDelete}
      />
    );

    fireEvent.click(screen.getByText('✅ 标记完成'));

    expect(mockOnStatusUpdate).toHaveBeenCalledWith('daily-task-1', 'completed', '', [], false, '');
  });

  it('shows approval status for completed tasks', () => {
    const completedTask = {
      ...mockDailyTask,
      status: 'completed' as const,
      approvalStatus: 'pending' as const,
      evidenceText: 'I read the book for 30 minutes'
    };

    render(
      <DailyTaskCard
        dailyTask={completedTask}
        onStatusUpdate={mockOnStatusUpdate}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('⏳ 等待家长审批')).toBeInTheDocument();
  });

  it('shows approved status with bonus points', () => {
    const approvedTask = {
      ...mockDailyTask,
      status: 'completed' as const,
      approvalStatus: 'approved' as const,
      bonusPoints: 5,
      approvalNotes: 'Great job!',
      approvedAt: new Date()
    };

    render(
      <DailyTaskCard
        dailyTask={approvedTask}
        onStatusUpdate={mockOnStatusUpdate}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('✅ 家长已通过')).toBeInTheDocument();
    expect(screen.getByText('+5 奖励积分')).toBeInTheDocument();
    expect(screen.getByText('家长留言: Great job!')).toBeInTheDocument();
  });

  it('displays evidence text and media', () => {
    const taskWithEvidence = {
      ...mockDailyTask,
      status: 'completed' as const,
      evidenceText: 'I read Harry Potter',
      evidenceMedia: [
        { type: 'image', filename: 'book-photo.jpg', url: '/uploads/book-photo.jpg', size: 1024, mimetype: 'image/jpeg' }
      ]
    };

    render(
      <DailyTaskCard
        dailyTask={taskWithEvidence}
        onStatusUpdate={mockOnStatusUpdate}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('📎 提交的证据')).toBeInTheDocument();
    expect(screen.getByText('I read Harry Potter')).toBeInTheDocument();
    expect(screen.getByText('book-photo.jpg')).toBeInTheDocument();
  });

  it('handles delete action', () => {
    render(
      <DailyTaskCard
        dailyTask={mockDailyTask}
        onStatusUpdate={mockOnStatusUpdate}
        onDelete={mockOnDelete}
      />
    );

    fireEvent.click(screen.getByTitle('删除任务'));

    expect(mockOnDelete).toHaveBeenCalledWith('daily-task-1');
  });

  it('shows in-progress actions', () => {
    const inProgressTask = {
      ...mockDailyTask,
      status: 'in_progress' as const
    };

    render(
      <DailyTaskCard
        dailyTask={inProgressTask}
        onStatusUpdate={mockOnStatusUpdate}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('🎉 完成任务')).toBeInTheDocument();
    expect(screen.getByText('⏸️ 暂停')).toBeInTheDocument();
  });

  it('hides actions for completed tasks', () => {
    const completedTask = {
      ...mockDailyTask,
      status: 'completed' as const
    };

    render(
      <DailyTaskCard
        dailyTask={completedTask}
        onStatusUpdate={mockOnStatusUpdate}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.queryByText('🚀 开始任务')).not.toBeInTheDocument();
    expect(screen.queryByText('✅ 标记完成')).not.toBeInTheDocument();
  });
});