/**
 * TaskTimeline Component Tests
 * 任务时间轴组件测试
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TaskTimeline from '../TaskTimeline';

// Mock the API service
jest.mock('../../services/compatibleApi', () => ({
  detectNetworkAndGetApiServiceSync: () => ({
    checkSchedulingConflicts: jest.fn().mockResolvedValue({
      data: { hasConflicts: false, conflict: null }
    }),
    updateDailyTask: jest.fn().mockResolvedValue({
      data: { success: true }
    })
  })
}));

// Mock TaskCategoryIcon component
jest.mock('../TaskCategoryIcon', () => {
  return function MockTaskCategoryIcon({ category }: { category: string }) {
    return <div data-testid={`category-icon-${category}`}>📚</div>;
  };
});

// Mock EvidenceModal component  
jest.mock('../EvidenceModal', () => {
  return function MockEvidenceModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    return isOpen ? <div data-testid="evidence-modal" onClick={onClose}>Evidence Modal</div> : null;
  };
});

// Mock the drag and drop functionality
const mockDragEvent = (type: string, dataTransfer = { data: {}, setData: jest.fn(), getData: jest.fn() }) => {
  return {
    type,
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
    dataTransfer,
    target: { closest: jest.fn(() => ({ dataset: { taskId: 'test-task-1' } })) },
    currentTarget: { dataset: { taskId: 'test-task-1' } }
  } as any;
};

// Mock data - 修正为符合 DailyTask 类型的结构
const mockDailyTasks = [
  {
    id: 'task-1',
    userId: 'user-1',
    taskId: 'base-task-1',
    date: '2024-08-26',
    title: '数学作业',
    description: '完成数学练习册第15页',
    category: 'learning',
    difficulty: 'medium',
    estimatedTime: 45,
    points: 30,
    status: 'planned' as const,
    plannedTime: '09:00',
    priority: 'high' as const,
    pointsEarned: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'task-2',
    userId: 'user-1',
    taskId: 'base-task-2',
    date: '2024-08-26',
    title: '英语阅读',
    description: '阅读英语故事书30分钟',
    category: 'reading',
    difficulty: 'easy',
    estimatedTime: 30,
    points: 20,
    status: 'in_progress' as const,
    plannedTime: '10:30',
    priority: 'medium' as const,
    pointsEarned: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    completedAt: new Date()
  },
  {
    id: 'task-3',
    userId: 'user-1',
    taskId: 'base-task-3',
    date: '2024-08-26',
    title: '体育锻炼',
    description: '户外运动30分钟',
    category: 'exercise',
    difficulty: 'medium',
    estimatedTime: 30,
    points: 25,
    status: 'completed' as const,
    plannedTime: '14:00',
    priority: 'low' as const,
    pointsEarned: 25,
    completedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const mockProps = {
  date: '2024-08-26',
  dailyTasks: mockDailyTasks,
  onTaskUpdate: jest.fn(),
  onRefresh: jest.fn()
};

describe('TaskTimeline Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('基本渲染', () => {
    test('应该渲染所有任务', () => {
      render(<TaskTimeline {...mockProps} />);
      
      expect(screen.getByText('数学作业')).toBeInTheDocument();
      expect(screen.getByText('英语阅读')).toBeInTheDocument();
      expect(screen.getByText('体育锻炼')).toBeInTheDocument();
    });

    test('应该显示任务的计划时间', () => {
      render(<TaskTimeline {...mockProps} />);
      
      expect(screen.getByText('09:00')).toBeInTheDocument();
      expect(screen.getByText('10:30')).toBeInTheDocument();
      expect(screen.getByText('14:00')).toBeInTheDocument();
    });

    test('应该显示任务的分类图标', () => {
      render(<TaskTimeline {...mockProps} />);
      
      // 检查分类数据属性
      const learningIcon = screen.getByTestId('category-icon-learning');
      const readingIcon = screen.getByTestId('category-icon-reading');
      const exerciseIcon = screen.getByTestId('category-icon-exercise');
      
      expect(learningIcon).toBeInTheDocument();
      expect(readingIcon).toBeInTheDocument();
      expect(exerciseIcon).toBeInTheDocument();
    });

    test('应该根据任务状态显示不同的样式', () => {
      render(<TaskTimeline {...mockProps} />);
      
      // 计划中的任务应该有特定样式
      const plannedTask = screen.getByTestId('task-card-task-1');
      expect(plannedTask).toHaveClass('planned');
      
      // 进行中的任务应该有特定样式
      const inProgressTask = screen.getByTestId('task-card-task-2');
      expect(inProgressTask).toHaveClass('in-progress');
      
      // 已完成的任务应该有特定样式
      const completedTask = screen.getByTestId('task-card-task-3');
      expect(completedTask).toHaveClass('completed');
    });
  });

  describe('任务交互', () => {
    test('应该处理任务开始', async () => {
      render(<TaskTimeline {...mockProps} />);
      
      const startButton = screen.getByTestId('start-task-task-1');
      fireEvent.click(startButton);
      
      await waitFor(() => {
        expect(mockProps.onTaskStart).toHaveBeenCalledWith('task-1');
      });
    });

    test('应该处理任务完成', async () => {
      render(<TaskTimeline {...mockProps} />);
      
      const completeButton = screen.getByTestId('complete-task-task-2');
      fireEvent.click(completeButton);
      
      await waitFor(() => {
        expect(mockProps.onTaskComplete).toHaveBeenCalledWith('task-2');
      });
    });

    test('应该处理任务暂停', async () => {
      render(<TaskTimeline {...mockProps} />);
      
      const pauseButton = screen.getByTestId('pause-task-task-2');
      fireEvent.click(pauseButton);
      
      await waitFor(() => {
        expect(mockProps.onTaskPause).toHaveBeenCalledWith('task-2');
      });
    });

    test('应该处理任务编辑', async () => {
      render(<TaskTimeline {...mockProps} />);
      
      const editButton = screen.getByTestId('edit-task-task-1');
      fireEvent.click(editButton);
      
      await waitFor(() => {
        expect(mockProps.onTaskEdit).toHaveBeenCalledWith('task-1');
      });
    });

    test('应该处理任务删除', async () => {
      render(<TaskTimeline {...mockProps} />);
      
      const deleteButton = screen.getByTestId('delete-task-task-1');
      fireEvent.click(deleteButton);
      
      await waitFor(() => {
        expect(mockProps.onTaskDelete).toHaveBeenCalledWith('task-1');
      });
    });
  });

  describe('拖拽功能', () => {
    test('应该处理拖拽开始事件', () => {
      render(<TaskTimeline {...mockProps} />);
      
      const taskCard = screen.getByTestId('task-card-task-1');
      const dragStartEvent = mockDragEvent('dragstart');
      
      fireEvent(taskCard, dragStartEvent);
      
      expect(dragStartEvent.preventDefault).not.toHaveBeenCalled();
      expect(dragStartEvent.dataTransfer.setData).toHaveBeenCalledWith('text/plain', 'task-1');
    });

    test('应该处理拖拽经过事件', () => {
      render(<TaskTimeline {...mockProps} />);
      
      const taskCard = screen.getByTestId('task-card-task-1');
      const dragOverEvent = mockDragEvent('dragover');
      
      fireEvent(taskCard, dragOverEvent);
      
      expect(dragOverEvent.preventDefault).toHaveBeenCalled();
    });

    test('应该处理拖拽放置事件', () => {
      render(<TaskTimeline {...mockProps} />);
      
      const taskCard = screen.getByTestId('task-card-task-2');
      const dropEvent = mockDragEvent('drop', {
        data: {},
        setData: jest.fn(),
        getData: jest.fn(() => 'task-1')
      });
      
      fireEvent(taskCard, dropEvent);
      
      expect(dropEvent.preventDefault).toHaveBeenCalled();
      expect(mockProps.onTaskReorder).toHaveBeenCalledWith('task-1', 'task-2');
    });

    test('应该在拖拽时添加视觉反馈', () => {
      render(<TaskTimeline {...mockProps} />);
      
      const taskCard = screen.getByTestId('task-card-task-1');
      const dragEnterEvent = mockDragEvent('dragenter');
      
      fireEvent(taskCard, dragEnterEvent);
      
      expect(taskCard).toHaveClass('drag-over');
    });

    test('应该在拖拽离开时移除视觉反馈', () => {
      render(<TaskTimeline {...mockProps} />);
      
      const taskCard = screen.getByTestId('task-card-task-1');
      const dragLeaveEvent = mockDragEvent('dragleave');
      
      fireEvent(taskCard, dragLeaveEvent);
      
      expect(taskCard).not.toHaveClass('drag-over');
    });
  });

  describe('时间显示', () => {
    test('应该显示任务的计划时间', () => {
      render(<TaskTimeline {...mockProps} />);
      
      expect(screen.getByText('09:00')).toBeInTheDocument();
      expect(screen.getByText('10:30')).toBeInTheDocument();
      expect(screen.getByText('14:00')).toBeInTheDocument();
    });

    test('应该显示任务的预计时长', () => {
      render(<TaskTimeline {...mockProps} />);
      
      expect(screen.getByText('45分钟')).toBeInTheDocument();
      expect(screen.getByText('30分钟')).toBeInTheDocument();
    });

    test('应该显示进行中任务的已用时间', () => {
      render(<TaskTimeline {...mockProps} />);
      
      // 进行中的任务应该显示计时器
      const timer = screen.getByTestId('task-timer-task-2');
      expect(timer).toBeInTheDocument();
    });

    test('应该高亮当前时间段的任务', () => {
      const props = { ...mockProps, currentTime: '09:15' };
      render(<TaskTimeline {...props} />);
      
      // 当前时间在09:00任务时间段内
      const currentTask = screen.getByTestId('task-card-task-1');
      expect(currentTask).toHaveClass('current-time');
    });
  });

  describe('优先级显示', () => {
    test('应该显示高优先级任务的标识', () => {
      render(<TaskTimeline {...mockProps} />);
      
      const highPriorityTask = screen.getByTestId('task-card-task-1');
      expect(highPriorityTask).toHaveClass('priority-high');
    });

    test('应该按优先级排序任务', () => {
      const tasksWithPriority = [
        { ...mockTasks[0], priority: 'low', plannedTime: '09:00' },
        { ...mockTasks[1], priority: 'high', plannedTime: '10:00' },
        { ...mockTasks[2], priority: 'medium', plannedTime: '11:00' }
      ];

      render(<TaskTimeline {...mockProps} tasks={tasksWithPriority} />);
      
      const taskCards = screen.getAllByTestId(/task-card-/);
      // 高优先级任务应该排在前面
      expect(taskCards[0]).toHaveClass('priority-high');
    });
  });

  describe('家长视图', () => {
    test('在家长视图下应该隐藏操作按钮', () => {
      const parentProps = { ...mockProps, isParentView: true };
      render(<TaskTimeline {...parentProps} />);
      
      // 家长视图不应该显示开始、完成等按钮
      expect(screen.queryByTestId('start-task-task-1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('complete-task-task-2')).not.toBeInTheDocument();
    });

    test('在家长视图下应该显示查看详情按钮', () => {
      const parentProps = { ...mockProps, isParentView: true };
      render(<TaskTimeline {...parentProps} />);
      
      const viewButtons = screen.getAllByTestId(/view-task-/);
      expect(viewButtons.length).toBeGreaterThan(0);
    });
  });

  describe('证据要求显示', () => {
    test('应该显示需要证据的任务标识', () => {
      render(<TaskTimeline {...mockProps} />);
      
      const evidenceIcon = screen.getByTestId('evidence-required-task-2');
      expect(evidenceIcon).toBeInTheDocument();
    });

    test('不需要证据的任务不应该显示证据标识', () => {
      render(<TaskTimeline {...mockProps} />);
      
      expect(screen.queryByTestId('evidence-required-task-1')).not.toBeInTheDocument();
    });
  });

  describe('任务进度显示', () => {
    test('应该显示已完成任务的积分', () => {
      render(<TaskTimeline {...mockProps} />);
      
      const points = screen.getByTestId('points-earned-task-3');
      expect(points).toHaveTextContent('25');
    });

    test('应该显示任务完成时间', () => {
      render(<TaskTimeline {...mockProps} />);
      
      const completedTime = screen.getByTestId('completed-time-task-3');
      expect(completedTime).toBeInTheDocument();
    });
  });

  describe('响应式设计', () => {
    test('应该在小屏幕上适应布局', () => {
      // 模拟小屏幕
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });
      
      render(<TaskTimeline {...mockProps} />);
      
      const timeline = screen.getByTestId('task-timeline');
      expect(timeline).toHaveClass('responsive-mobile');
    });

    test('应该在大屏幕上显示完整布局', () => {
      // 模拟大屏幕
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });
      
      render(<TaskTimeline {...mockProps} />);
      
      const timeline = screen.getByTestId('task-timeline');
      expect(timeline).toHaveClass('responsive-desktop');
    });
  });

  describe('空状态处理', () => {
    test('应该显示空任务列表的提示', () => {
      const emptyProps = { ...mockProps, tasks: [] };
      render(<TaskTimeline {...emptyProps} />);
      
      expect(screen.getByText('今天还没有安排任务')).toBeInTheDocument();
      expect(screen.getByText('点击添加按钮来规划你的一天吧！')).toBeInTheDocument();
    });

    test('应该在空状态下显示添加任务按钮', () => {
      const emptyProps = { ...mockProps, tasks: [] };
      render(<TaskTimeline {...emptyProps} />);
      
      const addButton = screen.getByTestId('add-first-task-button');
      expect(addButton).toBeInTheDocument();
    });
  });

  describe('错误处理', () => {
    test('应该处理无效的任务数据', () => {
      const invalidTasks = [
        { id: 'invalid-1', title: '', status: 'unknown' }
      ];
      
      const invalidProps = { ...mockProps, tasks: invalidTasks };
      
      expect(() => render(<TaskTimeline {...invalidProps} />)).not.toThrow();
    });

    test('应该处理缺失的回调函数', () => {
      const incompleteProps = {
        ...mockProps,
        onTaskStart: undefined,
        onTaskComplete: undefined
      };
      
      expect(() => render(<TaskTimeline {...incompleteProps} />)).not.toThrow();
    });
  });
});