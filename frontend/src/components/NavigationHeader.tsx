import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getNavigationItems, isCurrentPath, getDefaultRoute } from '../config/navigation';
import { UserRole } from '../types';
import PointsDisplay from './PointsDisplay';
import NotificationBadge from './NotificationBadge';
import { usePendingApprovalCount } from '../hooks/usePendingApprovalCount';

interface NavigationHeaderProps {
  notificationCounts?: { [key: string]: number };
}

const NavigationHeader: React.FC<NavigationHeaderProps> = ({ notificationCounts = {} }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { pendingCount } = usePendingApprovalCount();

  // Check if in demo mode
  const isDemoMode = localStorage.getItem('isDemo') === 'true' || localStorage.getItem('auth_token')?.startsWith('demo-token');
  
  // Create demo user data if in demo mode and no user
  const currentUser = user || (isDemoMode ? {
    id: 'demo-user-123',
    displayName: localStorage.getItem('user_role') === 'parent' ? '演示家长' : '演示学生',
    role: (localStorage.getItem('user_role') || 'student') as UserRole,
    points: 150,
    email: localStorage.getItem('user_email') || 'student@example.com'
  } : null);

  if (!currentUser && !isDemoMode) {
    return null;
  }

  const userRole = currentUser?.role as UserRole;
  const navigationItems = getNavigationItems(userRole);

  // Merge notification counts with pending approval count
  const enhancedNotificationCounts: { [key: string]: number } = {
    ...notificationCounts,
    'task-approval': pendingCount
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

  const handleLogoClick = () => {
    const defaultRoute = getDefaultRoute(userRole);
    navigate(defaultRoute);
  };

  return (
    <div className="bg-white shadow-cartoon sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Left side - Logo */}
          <div className="flex items-center">
            <div 
              className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handleLogoClick}
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

          {/* Center - Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {navigationItems.map((item) => (
              <NotificationBadge 
                key={item.key}
                count={enhancedNotificationCounts[item.key] || 0}
                size="sm"
              >
                <button
                  onClick={() => handleTabClick(item.path)}
                  className={`px-4 py-2 rounded-cartoon text-sm font-medium transition-all duration-200 ${
                    isCurrentPath(location.pathname, item.path)
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

          {/* Right side - User info and logout */}
          <div className="flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-cartoon-dark">{currentUser?.displayName}</p>
              <p className="text-xs text-cartoon-gray">
                {userRole === 'student' ? '👨‍🎓 学生' : '👨‍👩‍👧‍👦 家长'}
              </p>
            </div>
            {currentUser?.points !== undefined && (
              <PointsDisplay points={currentUser.points} size="sm" />
            )}
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
    </div>
  );
};

export default NavigationHeader;