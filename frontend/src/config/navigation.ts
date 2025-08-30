import { UserRole } from '../types';

export interface NavigationItem {
  key: string;
  path: string;
  name: string;
  icon: string;
  shortName: string;
  description: string;
  notificationCount?: number;
  mobileIcon?: React.ComponentType<any>; // For Lucide React icons
}

export interface RoleNavConfig {
  student: NavigationItem[];
  parent: NavigationItem[];
}

// Navigation configuration for different user roles
export const navigationConfig: RoleNavConfig = {
  student: [
    {
      key: 'dashboard',
      path: '/dashboard',
      name: '仪表盘',
      icon: '🏠',
      shortName: '首页',
      description: '总览和统计'
    },
    {
      key: 'planning',
      path: '/planning',
      name: '任务规划',
      icon: '📅',
      shortName: '任务',
      description: '制定和管理任务计划'
    },
    {
      key: 'rewards-center',
      path: '/rewards-center',
      name: '成长与奖励',
      icon: '🎁',
      shortName: '奖励',
      description: '展示徽章、积分和奖励'
    },
    {
      key: 'history',
      path: '/history',
      name: '任务历史',
      icon: '📚',
      shortName: '历史',
      description: '查看历史任务记录'
    }
  ],
  parent: [
    {
      key: 'parent-dashboard',
      path: '/parent-dashboard',
      name: '仪表盘',
      icon: '🏠',
      shortName: '首页',
      description: '总览和统计'
    },
    {
      key: 'task-approval',
      path: '/task-approval',
      name: '任务审批',
      icon: '✅',
      shortName: '审批',
      description: '审核孩子提交的任务'
    },
    {
      key: 'family-management',
      path: '/family-management',
      name: '家庭管理',
      icon: '👨‍👩‍👧‍👦',
      shortName: '家庭',
      description: '管理家庭成员和设置'
    }
  ]
};

// Get navigation items for a specific role
export const getNavigationItems = (role: UserRole): NavigationItem[] => {
  return navigationConfig[role] || [];
};

// Check if a path is currently active
export const isCurrentPath = (currentPath: string, targetPath: string): boolean => {
  return currentPath === targetPath || 
         (targetPath === '/dashboard' && currentPath === '/') ||
         (targetPath === '/parent-dashboard' && currentPath === '/');
};

// Get the default route for a user role
export const getDefaultRoute = (role: UserRole): string => {
  return role === 'parent' ? '/parent-dashboard' : '/dashboard';
};

// Navigation item lookup by key
export const getNavigationItemByKey = (role: UserRole, key: string): NavigationItem | undefined => {
  return getNavigationItems(role).find(item => item.key === key);
};

// Update navigation item notification count
export const updateNotificationCount = (
  items: NavigationItem[], 
  key: string, 
  count: number
): NavigationItem[] => {
  return items.map(item => 
    item.key === key 
      ? { ...item, notificationCount: count }
      : item
  );
};