import React, { useState, useEffect } from 'react';

interface PointsDisplayProps {
  points: number;
  previousPoints?: number;
  animated?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
  currentStreak?: number;
  medals?: {
    bronze: boolean;
    silver: boolean;
    gold: boolean;
    diamond: boolean;
  };
  showMedalMultiplier?: boolean;
  showStreak?: boolean;
}

const PointsDisplay: React.FC<PointsDisplayProps> = ({
  points,
  previousPoints = 0,
  animated = true,
  size = 'md',
  showLabel = true,
  className = '',
  currentStreak = 0,
  medals = { bronze: false, silver: false, gold: false, diamond: false },
  showMedalMultiplier = false,
  showStreak = false,
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

  // Calculate medal multiplier
  const calculateMedalMultiplier = () => {
    let multiplier = 1;
    if (medals.bronze) multiplier *= 1.1;
    if (medals.silver) multiplier *= 1.2;
    if (medals.gold) multiplier *= 1.3;
    if (medals.diamond) multiplier *= 1.4;
    return multiplier;
  };

  const medalMultiplier = calculateMedalMultiplier();

  // Get highest medal
  const getHighestMedal = () => {
    if (medals.diamond) return { name: '💎 钻石', color: 'text-purple-400' };
    if (medals.gold) return { name: '🥇 黄金', color: 'text-yellow-400' };
    if (medals.silver) return { name: '🥈 白银', color: 'text-gray-400' };
    if (medals.bronze) return { name: '🥉 青铜', color: 'text-orange-400' };
    return null;
  };

  const highestMedal = getHighestMedal();

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

      {/* Medal multiplier display */}
      {showMedalMultiplier && medalMultiplier > 1 && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="bg-gradient-to-r from-cartoon-purple to-cartoon-pink text-white text-xs font-bold px-2 py-1 rounded-cartoon flex items-center space-x-1">
            {highestMedal && <span className={highestMedal.color}>{highestMedal.name.split(' ')[0]}</span>}
            <span>{medalMultiplier.toFixed(1)}x</span>
          </div>
        </div>
      )}

      {/* Streak display */}
      {showStreak && currentStreak > 0 && (
        <div className="absolute -bottom-8 -right-8">
          <div className="bg-cartoon-orange text-white text-xs font-bold px-2 py-1 rounded-cartoon flex items-center space-x-1">
            <span>🔥</span>
            <span>{currentStreak}天</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PointsDisplay;