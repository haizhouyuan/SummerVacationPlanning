import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  animate?: boolean;
}

const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  onClick,
  animate = false 
}) => {
  const baseClasses = 'bg-white rounded-cartoon-lg shadow-cartoon p-4 sm:p-6';
  const animateClass = animate ? 'animate-bounce-in' : '';
  const clickableClass = onClick ? 'cursor-pointer hover:shadow-cartoon-lg transition-shadow' : '';
  
  const combinedClasses = [
    baseClasses,
    animateClass,
    clickableClass,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={combinedClasses} onClick={onClick}>
      {children}
    </div>
  );
};

export default Card;