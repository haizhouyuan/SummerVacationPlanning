import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotificationBadge from './NotificationBadge';
import { usePendingApprovalCount } from '../hooks/usePendingApprovalCount';

export interface NavigationItem {
  path: string;
  name: string;
  icon: string;
  description: string;
  notificationCount?: number;
}

const BottomNav: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { pendingCount } = usePendingApprovalCount();

  // Check if in demo mode
  const isDemoMode = localStorage.getItem('isDemo') === 'true' || localStorage.getItem('auth_token')?.startsWith('demo-token');
  
  // Create demo user data if in demo mode and no user
  const currentUser = user || (isDemoMode ? {
    id: 'demo-user-123',
    displayName: localStorage.getItem('user_role') === 'parent' ? '演示家长' : '演示学生',
    role: localStorage.getItem('user_role') || 'student',
    points: 150,
    email: localStorage.getItem('user_email') || 'student@example.com'
  } : null);

  if (!currentUser && !isDemoMode) {
    return null;
  }

  const navigationItems: NavigationItem[] = [
    { 
      path: currentUser?.role === 'parent' ? '/parent-dashboard' : '/dashboard', 
      name: '首页', 
      icon: '🏠',
      description: '仪表盘'
    },
    { 
      path: '/planning', 
      name: '任务规划', 
      icon: '📅',
      description: '制定和管理任务计划'
    },
    {
      path: '/points-history',
      name: '积分历史',
      icon: '💎',
      description: '查看积分获取历史'
    },
    { 
      path: '/rewards', 
      name: '奖励中心', 
      icon: '🎁',
      description: '兑换奖励和游戏时间'
    },
    ...(currentUser?.role === 'student' ? [{
      path: '/lite',
      name: '简化版',
      icon: '⚡',
      description: '简化视图界面'
    }] : [{
      path: '/task-approval', 
      name: '任务审批', 
      icon: '✅',
      description: '审核孩子提交的任务',
      notificationCount: pendingCount
    }])
  ];

  const isCurrentPath = (path: string) => {
    return location.pathname === path;
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div className="fixed bottom-0 inset-x-0 bg-white border-t border-cartoon-light shadow-cartoon z-50 md:hidden">
      <div className="grid grid-cols-5 h-16">
        {navigationItems.map((item) => (
          <NotificationBadge
            key={item.path}
            count={item.notificationCount || 0}
            size="sm"
            className="relative"
          >
            <button
              onClick={() => handleNavigation(item.path)}
              className={`w-full h-full flex flex-col items-center justify-center px-1 py-1 transition-all duration-200 ${
                isCurrentPath(item.path)
                  ? 'text-primary-600 bg-primary-50'
                  : 'text-cartoon-gray hover:text-cartoon-dark hover:bg-cartoon-light'
              }`}
              title={item.description}
              aria-label={`${item.name} - ${item.description}`}
            >
              <span className="text-xl mb-1">{item.icon}</span>
              <span className="text-xs font-medium leading-none">{item.name}</span>
            </button>
          </NotificationBadge>
        ))}
      </div>
    </div>
  );
};

export default BottomNav;