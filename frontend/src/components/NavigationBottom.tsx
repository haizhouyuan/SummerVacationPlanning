import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getNavigationItems, isCurrentPath } from '../config/navigation';
import { UserRole } from '../types';
import { usePendingApprovalCount } from '../hooks/usePendingApprovalCount';
import NotificationBadge from './NotificationBadge';

interface NavigationBottomProps {
  notificationCounts?: { [key: string]: number };
}

const NavigationBottom: React.FC<NavigationBottomProps> = ({ notificationCounts = {} }) => {
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

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 md:hidden">
      <div className="flex gap-3 px-3 py-2 rounded-2xl bg-neutral-900/70 backdrop-blur border border-white/10">
        {navigationItems.map((item) => {
          const isActive = isCurrentPath(location.pathname, item.path);
          const notificationCount = enhancedNotificationCounts[item.key] || 0;

          return (
            <NotificationBadge 
              key={item.key}
              count={notificationCount}
              size="sm"
            >
              <button
                onClick={() => handleTabClick(item.path)}
                className={`group flex flex-col items-center px-4 py-2 rounded-xl transition-transform min-w-[60px]
                   ${isActive ? "scale-105 bg-white/5" : "hover:scale-105"}`}
                title={item.description}
              >
                <span 
                  className={`text-lg ${
                    isActive ? "text-white" : "text-white/70 group-hover:text-white"
                  }`}
                >
                  {item.icon}
                </span>
                <span 
                  className={`text-xs mt-1 ${
                    isActive ? "text-white" : "text-white/70 group-hover:text-white"
                  }`}
                >
                  {item.shortName}
                </span>
              </button>
            </NotificationBadge>
          );
        })}
      </div>
    </div>
  );
};

export default NavigationBottom;