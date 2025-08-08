import React, { useEffect, useState } from 'react';

interface ProgressBarProps {
  current: number;
  max: number;
  label?: string;
  color?: 'primary' | 'success' | 'secondary' | 'cartoon-green';
  showPercentage?: boolean;
  animated?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  max,
  label,
  color = 'cartoon-green',
  showPercentage = true,
  animated = true,
  size = 'md',
  className = '',
}) => {
  const [displayProgress, setDisplayProgress] = useState(0);
  const percentage = Math.min(Math.round((current / max) * 100), 100);

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setDisplayProgress(percentage);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setDisplayProgress(percentage);
    }
  }, [percentage, animated]);

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-4',
    lg: 'h-6',
  };

  const getColorClasses = () => {
    const colorMap = {
      primary: 'bg-primary-500',
      success: 'bg-success-500', 
      secondary: 'bg-secondary-500',
      'cartoon-green': 'bg-cartoon-green',
    };
    return colorMap[color];
  };

  const getGlowEffect = () => {
    if (percentage >= 100) {
      return 'shadow-lg shadow-cartoon-green/50 animate-pulse-slow';
    }
    return '';
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          {showPercentage && (
            <span className="text-sm font-bold text-cartoon-green">
              {current}/{max} {percentage >= 100 && '🎉'}
            </span>
          )}
        </div>
      )}
      
      <div className={`relative bg-gray-200 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`
            ${getColorClasses()} 
            ${sizeClasses[size]} 
            rounded-full 
            transition-all 
            duration-1000 
            ease-out
            ${getGlowEffect()}
            relative
            overflow-hidden
          `}
          style={{ width: `${displayProgress}%` }}
        >
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 animate-pulse" />
          
          {/* Celebration sparkles for completed progress */}
          {percentage >= 100 && (
            <>
              <div className="absolute -top-1 left-1/4 w-1 h-1 bg-cartoon-yellow rounded-full animate-sparkle" />
              <div className="absolute -top-1 right-1/4 w-1 h-1 bg-cartoon-yellow rounded-full animate-sparkle" style={{ animationDelay: '0.3s' }} />
              <div className="absolute -bottom-1 left-1/3 w-1 h-1 bg-cartoon-yellow rounded-full animate-sparkle" style={{ animationDelay: '0.6s' }} />
            </>
          )}
        </div>
        
        {/* Progress text overlay for larger bars */}
        {size === 'lg' && showPercentage && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-white drop-shadow-sm">
              {displayProgress}%
            </span>
          </div>
        )}
      </div>

      {/* Milestone indicators */}
      {max > 5 && (
        <div className="flex justify-between mt-1">
          {Array.from({ length: Math.min(5, max) }, (_, i) => {
            const milestone = Math.round((max / 4) * i);
            const isReached = current >= milestone;
            return (
              <div
                key={i}
                className={`
                  w-2 h-2 rounded-full transition-colors duration-300
                  ${isReached ? 'bg-cartoon-green' : 'bg-gray-300'}
                  ${isReached && 'animate-pop'}
                `}
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProgressBar;