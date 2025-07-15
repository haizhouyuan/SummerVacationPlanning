import React, { useState, useEffect } from 'react';

interface PointsDisplayProps {
  points: number;
  previousPoints?: number;
  animated?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const PointsDisplay: React.FC<PointsDisplayProps> = ({
  points,
  previousPoints = 0,
  animated = true,
  size = 'md',
  showLabel = true,
  className = '',
}) => {
  const [displayPoints, setDisplayPoints] = useState(previousPoints);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showIncrease, setShowIncrease] = useState(false);

  useEffect(() => {
    if (points !== previousPoints && animated) {
      setIsAnimating(true);
      setShowIncrease(true);

      // Animate counting up to new points
      const difference = points - previousPoints;
      const duration = 1000; // 1 second
      const steps = Math.min(Math.abs(difference), 50);
      const stepValue = difference / steps;
      const stepDelay = duration / steps;

      let currentStep = 0;
      const timer = setInterval(() => {
        currentStep++;
        const newValue = previousPoints + (stepValue * currentStep);
        setDisplayPoints(Math.round(newValue));

        if (currentStep >= steps) {
          clearInterval(timer);
          setDisplayPoints(points);
          setIsAnimating(false);
          
          // Hide the increase indicator after a delay
          setTimeout(() => {
            setShowIncrease(false);
          }, 2000);
        }
      }, stepDelay);

      return () => clearInterval(timer);
    } else {
      setDisplayPoints(points);
    }
  }, [points, previousPoints, animated]);

  const getSizeClasses = () => {
    const sizeMap = {
      sm: 'text-lg',
      md: 'text-2xl',
      lg: 'text-4xl',
    };
    return sizeMap[size];
  };

  const getContainerClasses = () => {
    const sizeMap = {
      sm: 'px-3 py-1',
      md: 'px-4 py-2',
      lg: 'px-6 py-3',
    };
    return sizeMap[size];
  };

  const pointsIncrease = points - previousPoints;

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      {/* Main points display */}
      <div
        className={`
          bg-gradient-to-r from-cartoon-green to-success-400 text-white font-bold rounded-cartoon-lg
          ${getContainerClasses()}
          ${isAnimating ? 'animate-pop' : ''}
          shadow-cartoon
          relative overflow-hidden
        `}
      >
        {/* Background shine effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 animate-pulse" />
        
        <div className="relative flex items-center space-x-2">
          <span className="text-cartoon-yellow animate-sparkle">⭐</span>
          <span className={`${getSizeClasses()} font-fun`}>
            {displayPoints.toLocaleString()}
          </span>
          {showLabel && (
            <span className={`${size === 'lg' ? 'text-lg' : 'text-sm'} opacity-90`}>
              积分
            </span>
          )}
        </div>
      </div>

      {/* Points increase indicator */}
      {showIncrease && pointsIncrease > 0 && (
        <div
          className={`
            absolute -top-8 left-1/2 transform -translate-x-1/2
            bg-cartoon-yellow text-cartoon-dark px-2 py-1 rounded-cartoon text-sm font-bold
            animate-bounce-in
            shadow-lg
          `}
        >
          +{pointsIncrease}
        </div>
      )}

      {/* Floating sparkles when animating */}
      {isAnimating && (
        <>
          <div className="absolute -top-2 -right-2 w-1 h-1 bg-cartoon-yellow rounded-full animate-sparkle" />
          <div className="absolute -bottom-2 -left-2 w-1 h-1 bg-cartoon-pink rounded-full animate-sparkle" style={{ animationDelay: '0.3s' }} />
          <div className="absolute -top-2 left-1/2 w-1 h-1 bg-cartoon-blue rounded-full animate-sparkle" style={{ animationDelay: '0.6s' }} />
        </>
      )}

      {/* Level indicator based on points */}
      {points >= 100 && (
        <div className="absolute -top-3 -right-3">
          <div className="bg-cartoon-purple text-white text-xs font-bold px-2 py-1 rounded-full animate-float">
            Lv.{Math.floor(points / 100)}
          </div>
        </div>
      )}
    </div>
  );
};

export default PointsDisplay;