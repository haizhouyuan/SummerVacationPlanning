/**
 * TaskCard Component Unit Tests
 * TaskCard组件单元测试
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthContext } from '../../contexts/AuthContext';
import { TaskCard } from '../TaskCard';
import * as apiService from '../../services/api';

// Mock API service
jest.mock('../../services/api');
const mockApiService = apiService as jest.Mocked<typeof apiService>;

// Mock AuthContext
const mockAuthContext = {
  user: {
    id: 'test-user-id',
    username: '测试用户',
    email: 'test@test.com',
    role: 'student' as const,
    points: 100
  },
  login: jest.fn(),
  logout: jest.fn(),
  refreshUser: jest.fn(),
  loading: false
};

// Test wrapper with AuthContext
const renderWithAuth = (component: React.ReactElement) => {
  return render(
    <AuthContext.Provider value={mockAuthContext}>
      {component}
    </AuthContext.Provider>
  );
};

// Sample task data
const mockTask = {
  id: 'task-1',
  title: '跑步30分钟',
  description: '在公园或跑步机上跑步30分钟',
  category: 'exercise' as const,
  difficulty: 'medium' as const,
  points: 50,
  evidenceRequired: true,
  timeEstimate: 30,
  userId: 'test-user-id',
  createdAt: '2024-08-26T09:00:00Z',
  updatedAt: '2024-08-26T09:00:00Z'
};

const mockDailyTask = {
  id: 'daily-1',
  taskId: 'task-1',
  userId: 'test-user-id',
  date: '2024-08-26',
  status: 'planned' as const,
  scheduledTime: '2024-08-26T09:00:00Z',
  createdAt: '2024-08-26T08:00:00Z'
};

describe('TaskCard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('基础渲染测试', () => {
    test('应该正确显示任务信息', () => {
      renderWithAuth(
        <TaskCard 
          task={mockTask} 
          dailyTask={mockDailyTask}
          onUpdate={jest.fn()}
        />
      );
      
      expect(screen.getByText('跑步30分钟')).toBeInTheDocument();
      expect(screen.getByText('在公园或跑步机上跑步30分钟')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument(); // 积分
      expect(screen.getByText('30分钟')).toBeInTheDocument(); // 预估时间
      expect(screen.getByText('中等')).toBeInTheDocument(); // 难度
    });
    
    test('应该显示正确的任务分类图标', () => {
      renderWithAuth(
        <TaskCard 
          task={mockTask} 
          dailyTask={mockDailyTask}
          onUpdate={jest.fn()}
        />
      );
      
      // 运动分类应该显示相关图标
      expect(screen.getByText(/🏃‍♂️|💪|🏋️/)).toBeInTheDocument();
    });
    
    test('应该显示证据要求标识', () => {
      renderWithAuth(
        <TaskCard 
          task={mockTask} 
          dailyTask={mockDailyTask}
          onUpdate={jest.fn()}
        />
      );
      
      expect(screen.getByText(/需要证据|📷/)).toBeInTheDocument();
    });
    
    test('不需要证据的任务不应该显示证据标识', () => {
      const taskWithoutEvidence = { ...mockTask, evidenceRequired: false };
      
      renderWithAuth(
        <TaskCard 
          task={taskWithoutEvidence} 
          dailyTask={mockDailyTask}
          onUpdate={jest.fn()}
        />
      );
      
      expect(screen.queryByText(/需要证据|📷/)).not.toBeInTheDocument();
    });
  });
  
  describe('任务状态显示', () => {
    test('计划状态应该显示开始按钮', () => {
      renderWithAuth(
        <TaskCard 
          task={mockTask} 
          dailyTask={mockDailyTask}
          onUpdate={jest.fn()}
        />
      );
      
      expect(screen.getByText('开始任务')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /开始任务/ })).toBeEnabled();
    });
    
    test('进行中状态应该显示完成按钮', () => {
      const inProgressTask = { ...mockDailyTask, status: 'in_progress' as const };
      
      renderWithAuth(
        <TaskCard 
          task={mockTask} 
          dailyTask={inProgressTask}
          onUpdate={jest.fn()}
        />
      );
      
      expect(screen.getByText('完成任务')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /完成任务/ })).toBeEnabled();
    });
    
    test('已完成状态应该显示完成标识', () => {
      const completedTask = { 
        ...mockDailyTask, 
        status: 'completed' as const,
        completedAt: '2024-08-26T10:00:00Z',
        pointsEarned: 50
      };
      
      renderWithAuth(
        <TaskCard 
          task={mockTask} 
          dailyTask={completedTask}
          onUpdate={jest.fn()}
        />
      );
      
      expect(screen.getByText(/已完成|✅/)).toBeInTheDocument();
      expect(screen.getByText('获得 50 积分')).toBeInTheDocument();
    });
    
    test('待审批状态应该显示审批标识', () => {
      const pendingTask = { 
        ...mockDailyTask, 
        status: 'pending_approval' as const,
        evidenceUrl: 'evidence.jpg'
      };
      
      renderWithAuth(
        <TaskCard 
          task={mockTask} 
          dailyTask={pendingTask}
          onUpdate={jest.fn()}
        />
      );
      
      expect(screen.getByText(/待审批|⏳/)).toBeInTheDocument();
    });
  });
  
  describe('用户交互测试', () => {
    test('点击开始任务应该调用API', async () => {
      const mockUpdate = jest.fn();
      mockApiService.startTask.mockResolvedValue({
        id: 'daily-1',
        status: 'in_progress',
        startedAt: '2024-08-26T09:30:00Z'
      });
      
      renderWithAuth(
        <TaskCard 
          task={mockTask} 
          dailyTask={mockDailyTask}
          onUpdate={mockUpdate}
        />
      );
      
      const startButton = screen.getByRole('button', { name: /开始任务/ });
      await userEvent.click(startButton);
      
      expect(mockApiService.startTask).toHaveBeenCalledWith('daily-1');
      
      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalled();
      });
    });
    
    test('点击完成任务应该弹出证据上传模态框', async () => {
      const inProgressTask = { ...mockDailyTask, status: 'in_progress' as const };
      
      renderWithAuth(
        <TaskCard 
          task={mockTask} 
          dailyTask={inProgressTask}
          onUpdate={jest.fn()}
        />
      );
      
      const completeButton = screen.getByRole('button', { name: /完成任务/ });
      await userEvent.click(completeButton);
      
      // 应该显示证据上传模态框
      expect(screen.getByText(/上传证据|提交证据/)).toBeInTheDocument();
    });
    
    test('不需要证据的任务完成应该直接提交', async () => {
      const taskWithoutEvidence = { ...mockTask, evidenceRequired: false };
      const inProgressTask = { ...mockDailyTask, status: 'in_progress' as const };
      const mockUpdate = jest.fn();
      
      mockApiService.completeTask.mockResolvedValue({
        id: 'daily-1',
        status: 'completed',
        completedAt: '2024-08-26T10:00:00Z',
        pointsEarned: 50
      });
      
      renderWithAuth(
        <TaskCard 
          task={taskWithoutEvidence} 
          dailyTask={inProgressTask}
          onUpdate={mockUpdate}
        />
      );
      
      const completeButton = screen.getByRole('button', { name: /完成任务/ });
      await userEvent.click(completeButton);
      
      expect(mockApiService.completeTask).toHaveBeenCalledWith('daily-1', {
        notes: ''
      });
      
      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalled();
      });
    });
    
    test('应该处理API错误', async () => {
      const mockUpdate = jest.fn();
      mockApiService.startTask.mockRejectedValue(new Error('网络错误'));
      
      // Mock console.error to avoid error output in tests
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      renderWithAuth(
        <TaskCard 
          task={mockTask} 
          dailyTask={mockDailyTask}
          onUpdate={mockUpdate}
        />
      );
      
      const startButton = screen.getByRole('button', { name: /开始任务/ });
      await userEvent.click(startButton);
      
      await waitFor(() => {
        expect(screen.getByText(/操作失败|错误/)).toBeInTheDocument();
      });
      
      expect(mockUpdate).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
  
  describe('证据上传功能', () => {
    test('应该显示证据上传界面', async () => {
      const inProgressTask = { ...mockDailyTask, status: 'in_progress' as const };
      
      renderWithAuth(
        <TaskCard 
          task={mockTask} 
          dailyTask={inProgressTask}
          onUpdate={jest.fn()}
        />
      );
      
      // 点击完成任务
      const completeButton = screen.getByRole('button', { name: /完成任务/ });
      await userEvent.click(completeButton);
      
      // 应该显示证据上传相关元素
      expect(screen.getByText(/选择文件|上传图片/)).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /备注|说明/ })).toBeInTheDocument();
    });
    
    test('应该验证上传文件类型', async () => {
      const inProgressTask = { ...mockDailyTask, status: 'in_progress' as const };
      
      renderWithAuth(
        <TaskCard 
          task={mockTask} 
          dailyTask={inProgressTask}
          onUpdate={jest.fn()}
        />
      );
      
      const completeButton = screen.getByRole('button', { name: /完成任务/ });
      await userEvent.click(completeButton);
      
      const fileInput = screen.getByRole('textbox', { name: /文件选择/ });
      
      // 尝试上传无效文件类型
      const invalidFile = new File(['content'], 'test.txt', { type: 'text/plain' });
      await userEvent.upload(fileInput, invalidFile);
      
      expect(screen.getByText(/文件类型不支持|请选择图片文件/)).toBeInTheDocument();
    });
    
    test('应该限制文件大小', async () => {
      const inProgressTask = { ...mockDailyTask, status: 'in_progress' as const };
      
      renderWithAuth(
        <TaskCard 
          task={mockTask} 
          dailyTask={inProgressTask}
          onUpdate={jest.fn()}
        />
      );
      
      const completeButton = screen.getByRole('button', { name: /完成任务/ });
      await userEvent.click(completeButton);
      
      const fileInput = screen.getByRole('textbox', { name: /文件选择/ });
      
      // 创建超大文件 (超过10MB)
      const oversizedFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', { 
        type: 'image/jpeg' 
      });
      await userEvent.upload(fileInput, oversizedFile);
      
      expect(screen.getByText(/文件过大|大小超过限制/)).toBeInTheDocument();
    });
  });
  
  describe('可访问性测试', () => {
    test('应该有正确的ARIA属性', () => {
      renderWithAuth(
        <TaskCard 
          task={mockTask} 
          dailyTask={mockDailyTask}
          onUpdate={jest.fn()}
        />
      );
      
      const startButton = screen.getByRole('button', { name: /开始任务/ });
      expect(startButton).toHaveAttribute('aria-label');
      
      const taskCard = screen.getByRole('article');
      expect(taskCard).toHaveAttribute('aria-label');
    });
    
    test('应该支持键盘导航', async () => {
      renderWithAuth(
        <TaskCard 
          task={mockTask} 
          dailyTask={mockDailyTask}
          onUpdate={jest.fn()}
        />
      );
      
      const startButton = screen.getByRole('button', { name: /开始任务/ });
      
      // 测试Tab键导航
      await userEvent.tab();
      expect(startButton).toHaveFocus();
      
      // 测试Enter键激活
      await userEvent.keyboard('{Enter}');
      expect(mockApiService.startTask).toHaveBeenCalled();
    });
  });
  
  describe('响应式设计', () => {
    test('应该在移动设备上正确显示', () => {
      // Mock移动设备视窗
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      });
      
      renderWithAuth(
        <TaskCard 
          task={mockTask} 
          dailyTask={mockDailyTask}
          onUpdate={jest.fn()}
        />
      );
      
      const taskCard = screen.getByRole('article');
      expect(taskCard).toHaveClass(/responsive|mobile/);
    });
  });
});