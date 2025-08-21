import React from 'react';

interface NotificationBadgeProps {
  count: number;
  maxCount?: number;
  size?: 'sm' | 'md' | 'lg';
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  className?: string;
  children?: React.ReactNode;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  maxCount = 99,
  size = 'sm',
  position = 'top-right',
  className = '',
  children,
}) => {
  if (count <= 0) {
    return children ? <>{children}</> : null;
  }

  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  const sizeClasses = {
    sm: 'w-4 h-4 text-xs',
    md: 'w-5 h-5 text-xs',
    lg: 'w-6 h-6 text-sm',
  };

  const positionClasses = {
    'top-right': '-top-1 -right-1',
    'top-left': '-top-1 -left-1',
    'bottom-right': '-bottom-1 -right-1',
    'bottom-left': '-bottom-1 -left-1',
  };

  const badge = (
    <span
      className={`
        absolute ${positionClasses[position]} 
        ${sizeClasses[size]} 
        bg-gradient-to-r from-cartoon-red to-danger-500 
        text-white font-bold rounded-full 
        flex items-center justify-center 
        shadow-cartoon animate-pulse
        ${className}
      `}
    >
      {displayCount}
    </span>
  );

  if (children) {
    return (
      <div className="relative inline-block">
        {children}
        {badge}
      </div>
    );
  }

  return badge;
};

export default NotificationBadge;