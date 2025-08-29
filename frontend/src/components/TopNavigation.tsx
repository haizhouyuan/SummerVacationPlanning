import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface NavigationTab {
  path: string;
  name: string;
  icon: string;
  shortName: string; // 用于移动端显示
}

const TopNavigation: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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

  // 主要导航标签页
  const navigationTabs: NavigationTab[] = [
    {
      path: '/dashboard',
      name: '仪表盘',
      icon: '🏠',
      shortName: '首页'
    },
    {
      path: '/planning',
      name: '任务规划',
      icon: '📅',
      shortName: '任务'
    },
    {
      path: '/rewards',
      name: '成长与奖励',
      icon: '🎁',
      shortName: '奖励'
    }
  ];

  const isCurrentPath = (path: string) => {
    return location.pathname === path || 
           (path === '/dashboard' && location.pathname === '/');
  };

  const handleTabClick = (path: string) => {
    navigate(path);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="bg-white border-b border-cartoon-light shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto">
        {/* 顶部标题栏 - 仅在移动端显示 */}
        <div className="flex items-center justify-between py-2 md:hidden">
          <h1 className="text-lg font-bold text-cartoon-dark font-fun">
            🌟 暑期规划助手
          </h1>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm transition-colors"
          >
            退出
          </button>
        </div>
        
        {/* 桌面端标题栏和登出按钮 - 仅在桌面端显示 */}
        <div className="hidden md:flex items-center justify-between py-3 px-4">
          <h1 className="text-xl font-bold text-cartoon-dark font-fun">
            🌟 暑期规划助手
          </h1>
          <div className="flex items-center space-x-3">
            {currentUser && (
              <div className="text-right">
                <p className="text-sm font-medium text-cartoon-dark">{currentUser.displayName}</p>
                <p className="text-xs text-cartoon-gray">{currentUser.points} 积分</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              退出登录
            </button>
          </div>
        </div>
        
        {/* 导航标签页 */}
        <div className="flex border-b border-cartoon-light/50">
          {navigationTabs.map((tab) => (
            <button
              key={tab.path}
              onClick={() => handleTabClick(tab.path)}
              className={`
                flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 
                py-3 px-2 transition-all duration-200 relative
                ${isCurrentPath(tab.path)
                  ? 'text-primary-600 bg-primary-50 font-medium'
                  : 'text-cartoon-gray hover:text-cartoon-dark hover:bg-cartoon-light/50'
                }
              `}
            >
              {/* 图标 */}
              <span className="text-lg sm:text-base">{tab.icon}</span>
              
              {/* 标签文字 - 移动端显示短名称，桌面端显示全名 */}
              <span className="text-xs sm:text-sm font-medium">
                <span className="sm:hidden">{tab.shortName}</span>
                <span className="hidden sm:inline">{tab.name}</span>
              </span>
              
              {/* 激活状态指示器 */}
              {isCurrentPath(tab.path) && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-t-full" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TopNavigation;