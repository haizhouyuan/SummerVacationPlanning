import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import NavigationHeader from './NavigationHeader';
import NavigationBottom from './NavigationBottom';
import { usePendingApprovalCount } from '../hooks/usePendingApprovalCount';

interface LayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, showSidebar = true }) => {
  const { user } = useAuth();
  const { pendingCount } = usePendingApprovalCount();

  // Check if in demo mode
  const isDemoMode = localStorage.getItem('isDemo') === 'true' || localStorage.getItem('auth_token')?.startsWith('demo-token');
  
  // If not logged in and not in demo mode, render children without layout
  if (!user && !isDemoMode) {
    return <>{children}</>;
  }

  // Prepare notification counts for navigation components
  const notificationCounts = {
    'task-approval': pendingCount
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cartoon-light via-primary-50 to-secondary-50">
      {/* Top Navigation Bar - Desktop */}
      <NavigationHeader notificationCounts={notificationCounts} />

      {/* Main content */}
      <div className="w-full pb-16 md:pb-0">
        {children}
      </div>

      {/* Bottom Navigation - Mobile Only */}
      <NavigationBottom notificationCounts={notificationCounts} />
    </div>
  );
};

export default Layout;