import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PointsDisplay from './PointsDisplay';
import NotificationBadge from './NotificationBadge';
import BottomNav from './BottomNav';
import { usePendingApprovalCount } from '../hooks/usePendingApprovalCount';

interface LayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, showSidebar = true }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { pendingCount } = usePendingApprovalCount();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navigationItems = user?.role === 'parent' 
    ? [
        { 
          path: '/parent-dashboard', 
          name: '仪表盘', 
          icon: '🏠',
          description: '总览和统计'
        },
        {
          path: '/task-approval', 
          name: '任务审批', 
          icon: '✅',
          description: '审核孩子提交的任务',
          notificationCount: pendingCount
        },
        {
          path: '/family-management', 
          name: '家庭管理', 
          icon: '👨‍👩‍👧‍👦',
          description: '管理家庭成员和设置'
        }
      ]
    : [
        { 
          path: '/dashboard', 
          name: '仪表盘', 
          icon: '🏠',
          description: '总览和统计'
        },
        { 
          path: '/planning', 
          name: '任务规划', 
          icon: '📅',
          description: '制定和管理任务计划'
        },
        { 
          path: '/rewards-center', 
          name: '成长与奖励', 
          icon: '🎁',
          description: '展示徽章、积分和奖励'
        },
        { 
          path: '/history', 
          name: '任务历史', 
          icon: '📚',
          description: '查看历史任务记录'
        }
      ];

  const isCurrentPath = (path: string) => {
    return location.pathname === path;
  };

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cartoon-light via-primary-50 to-secondary-50">
      {/* Top Navigation Bar */}
      <div className="bg-white shadow-cartoon sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Left side - Logo */}
            <div className="flex items-center">
              <div 
                className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => navigate(user.role === 'parent' ? '/parent-dashboard' : '/dashboard')}
              >
                <div className="h-10 w-10 bg-gradient-to-br from-cartoon-green to-success-400 rounded-cartoon flex items-center justify-center animate-float">
                  <span className="text-white text-lg font-bold">🏖️</span>
                </div>
                <div className="ml-3">
                  <h1 className="text-xl font-bold text-cartoon-dark font-fun">暑假计划</h1>
                  <p className="text-xs text-cartoon-gray hidden sm:block">让假期更精彩 ✨</p>
                </div>
              </div>
            </div>

            {/* Center - Navigation for all screens */}
            <div className="hidden md:flex items-center space-x-2">
              {navigationItems.map((item) => (
                <NotificationBadge 
                  key={item.path}
                  count={item.notificationCount || 0}
                  size="sm"
                >
                  <button
                    onClick={() => navigate(item.path)}
                    className={`px-4 py-2 rounded-cartoon text-sm font-medium transition-all duration-200 ${
                      isCurrentPath(item.path)
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-cartoon'
                        : 'text-cartoon-gray hover:text-cartoon-dark hover:bg-cartoon-light'
                    }`}
                    title={item.description}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.name}
                  </button>
                </NotificationBadge>
              ))}
            </div>

            {/* Mobile Menu Button - Hidden now that we use bottom nav */}
            <div className="hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-cartoon text-cartoon-gray hover:text-cartoon-dark hover:bg-cartoon-light transition-colors"
              >
                {mobileMenuOpen ? '✕' : '☰'}
              </button>
            </div>

            {/* Right side - User info and logout */}
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-cartoon-dark">{user.displayName}</p>
                <p className="text-xs text-cartoon-gray">
                  {user.role === 'student' ? '👨‍🎓 学生' : '👨‍👩‍👧‍👦 家长'}
                </p>
              </div>
              <PointsDisplay points={user.points} size="sm" />
              <button
                onClick={handleLogout}
                className="bg-gradient-to-r from-cartoon-red to-danger-500 hover:from-cartoon-red hover:to-danger-600 text-white px-3 py-2 rounded-cartoon text-sm font-medium transition-all duration-200 shadow-cartoon hover:shadow-cartoon-lg animate-pop"
              >
                <span className="hidden sm:inline">退出登录</span>
                <span className="sm:hidden">退出</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Navigation Menu - Hidden since we use bottom nav */}
        {false && mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-cartoon-light">
            <div className="px-3 sm:px-4 py-3 space-y-2">
              {/* Mobile points display */}
              <div className="flex items-center justify-center pb-2 border-b border-cartoon-light sm:hidden">
                <PointsDisplay points={user?.points || 0} size="md" />
              </div>
              {navigationItems.map((item) => (
                <NotificationBadge 
                  key={item.path}
                  count={item.notificationCount || 0}
                  size="md"
                  className="relative"
                >
                  <button
                    onClick={() => {
                      navigate(item.path);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-3 rounded-cartoon transition-all duration-200 min-h-[48px] flex items-center ${
                      isCurrentPath(item.path)
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white'
                        : 'text-cartoon-gray hover:text-cartoon-dark hover:bg-cartoon-light'
                    }`}
                  >
                    <span className="mr-3 text-lg">{item.icon}</span>
                    <span className="font-medium">{item.name}</span>
                  </button>
                </NotificationBadge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="w-full pb-16 md:pb-0">
        {children}
      </div>

      {/* Bottom Navigation - Mobile Only */}
      <BottomNav 
        active={location.pathname}
        onChange={(key) => {
          switch(key) {
            case 'dashboard':
              navigate(user?.role === 'parent' ? '/parent-dashboard' : '/dashboard');
              break;
            case 'approve':
              navigate('/task-approval');
              break;
            case 'family':
              navigate('/family-management');
              break;
          }
        }}
      />
    </div>
  );
};

export default Layout;