import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import BottomNav from '../BottomNav';
import { useAuth } from '../../contexts/AuthContext';
import { usePendingApprovalCount } from '../../hooks/usePendingApprovalCount';

const mockNavigate = jest.fn();
const mockUseLocation = jest.fn();

// Mock dependencies
jest.mock('../../contexts/AuthContext');
jest.mock('../../hooks/usePendingApprovalCount');
jest.mock('../NotificationBadge', () => {
  return function MockNotificationBadge({ children, count }: any) {
    return (
      <div data-testid="notification-badge" data-count={count}>
        {children}
      </div>
    );
  };
});

// Mock react-router-dom directly
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => mockUseLocation(),
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUsePendingApprovalCount = usePendingApprovalCount as jest.MockedFunction<typeof usePendingApprovalCount>;

const renderBottomNav = () => {
  return render(<BottomNav />);
};

describe('BottomNav', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocation.mockReturnValue({ pathname: '/dashboard' });
    mockUsePendingApprovalCount.mockReturnValue({
      pendingCount: 0,
      loading: false,
      error: null
    });
  });

  it('不渲染当用户未登录时', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      login: jest.fn(),
      logout: jest.fn(),
      loading: false,
      error: null
    });

    const { container } = renderBottomNav();
    expect(container.firstChild).toBeNull();
  });

  it('为学生用户渲染正确的导航项', () => {
    mockUseAuth.mockReturnValue({
      user: {
        uid: 'student1',
        email: 'student@test.com',
        displayName: 'Test Student',
        role: 'student',
        points: 100
      },
      login: jest.fn(),
      logout: jest.fn(),
      loading: false,
      error: null
    });

    renderBottomNav();

    // 验证学生导航项
    expect(screen.getByText('首页')).toBeInTheDocument();
    expect(screen.getByText('任务规划')).toBeInTheDocument();
    expect(screen.getByText('积分历史')).toBeInTheDocument();
    expect(screen.getByText('奖励中心')).toBeInTheDocument();
    expect(screen.getByText('简化版')).toBeInTheDocument();
    
    // 学生不应该看到任务审批
    expect(screen.queryByText('任务审批')).not.toBeInTheDocument();
  });

  it('为家长用户渲染正确的导航项', () => {
    mockUseAuth.mockReturnValue({
      user: {
        uid: 'parent1',
        email: 'parent@test.com',
        displayName: 'Test Parent',
        role: 'parent',
        points: 0
      },
      login: jest.fn(),
      logout: jest.fn(),
      loading: false,
      error: null
    });
    
    mockUsePendingApprovalCount.mockReturnValue({
      pendingCount: 3,
      loading: false,
      error: null
    });

    renderBottomNav();

    // 验证家长导航项
    expect(screen.getByText('首页')).toBeInTheDocument();
    expect(screen.getByText('任务规划')).toBeInTheDocument();
    expect(screen.getByText('积分历史')).toBeInTheDocument();
    expect(screen.getByText('奖励中心')).toBeInTheDocument();
    expect(screen.getByText('任务审批')).toBeInTheDocument();
    
    // 家长不应该看到简化版
    expect(screen.queryByText('简化版')).not.toBeInTheDocument();
  });

  it('正确高亮当前页面按钮', () => {
    mockUseAuth.mockReturnValue({
      user: {
        uid: 'student1',
        email: 'student@test.com',
        displayName: 'Test Student',
        role: 'student',
        points: 100
      },
      login: jest.fn(),
      logout: jest.fn(),
      loading: false,
      error: null
    });

    renderBottomNav();

    const homeButton = screen.getByText('首页').closest('button');
    expect(homeButton).toHaveClass('text-primary-600', 'bg-primary-50');
  });

  it('点击导航按钮时正确导航', async () => {
    mockUseAuth.mockReturnValue({
      user: {
        uid: 'student1',
        email: 'student@test.com',
        displayName: 'Test Student',
        role: 'student',
        points: 100
      },
      login: jest.fn(),
      logout: jest.fn(),
      loading: false,
      error: null
    });

    renderBottomNav();

    const planningButton = screen.getByText('任务规划');
    fireEvent.click(planningButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/planning');
    });
  });

  it('显示家长的待审批任务通知数量', () => {
    mockUseAuth.mockReturnValue({
      user: {
        uid: 'parent1',
        email: 'parent@test.com',
        displayName: 'Test Parent',
        role: 'parent',
        points: 0
      },
      login: jest.fn(),
      logout: jest.fn(),
      loading: false,
      error: null
    });
    
    mockUsePendingApprovalCount.mockReturnValue({
      pendingCount: 5,
      loading: false,
      error: null
    });

    renderBottomNav();

    // 查找包含任务审批按钮的通知徽章
    const notificationBadges = screen.getAllByTestId('notification-badge');
    const approvalBadge = notificationBadges.find(badge => 
      badge.textContent?.includes('任务审批')
    );
    
    expect(approvalBadge).toHaveAttribute('data-count', '5');
  });

  it('具有正确的可访问性属性', () => {
    mockUseAuth.mockReturnValue({
      user: {
        uid: 'student1',
        email: 'student@test.com',
        displayName: 'Test Student',
        role: 'student',
        points: 100
      },
      login: jest.fn(),
      logout: jest.fn(),
      loading: false,
      error: null
    });

    renderBottomNav();

    const homeButton = screen.getByText('首页').closest('button');
    expect(homeButton).toHaveAttribute('aria-label', '首页 - 仪表盘');
    expect(homeButton).toHaveAttribute('title', '仪表盘');
  });

  it('只在移动端显示（具有md:hidden类）', () => {
    mockUseAuth.mockReturnValue({
      user: {
        uid: 'student1',
        email: 'student@test.com',
        displayName: 'Test Student',
        role: 'student',
        points: 100
      },
      login: jest.fn(),
      logout: jest.fn(),
      loading: false,
      error: null
    });

    renderBottomNav();

    const bottomNavContainer = screen.getByText('首页').closest('div[class*="fixed bottom-0"]');
    expect(bottomNavContainer).toHaveClass('md:hidden');
  });
});