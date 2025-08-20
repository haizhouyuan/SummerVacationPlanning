import React from 'react';

interface AchievementBadgeProps {
  type: 'streak' | 'points' | 'tasks' | 'category' | 'special' | 'medal';
  level: number;
  title: string;
  description: string;
  isUnlocked: boolean;
  progress?: number;
  maxProgress?: number;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
  className?: string;
  medalType?: 'bronze' | 'silver' | 'gold' | 'diamond';
  multiplier?: number;
}

const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  type,
  level,
  title,
  description,
  isUnlocked,
  progress = 0,
  maxProgress = 100,
  size = 'md',
  showProgress = true,
  className = '',
  medalType,
  multiplier,
}) => {
  const getBadgeData = () => {
    const badgeMap: { [key: string]: { emoji: string; color: string; bgColor: string } } = {
      streak: { emoji: '🔥', color: 'text-cartoon-orange', bgColor: 'bg-gradient-to-br from-cartoon-orange to-cartoon-red' },
      points: { emoji: '⭐', color: 'text-cartoon-yellow', bgColor: 'bg-gradient-to-br from-cartoon-yellow to-cartoon-orange' },
      tasks: { emoji: '✅', color: 'text-cartoon-green', bgColor: 'bg-gradient-to-br from-cartoon-green to-success-400' },
      category: { emoji: '🎯', color: 'text-cartoon-purple', bgColor: 'bg-gradient-to-br from-cartoon-purple to-primary-400' },
      special: { emoji: '🏆', color: 'text-cartoon-pink', bgColor: 'bg-gradient-to-br from-cartoon-pink to-cartoon-purple' },
      medal: getMedalData(),
    };
    return badgeMap[type] || { emoji: '🏅', color: 'text-gray-500', bgColor: 'bg-gradient-to-br from-gray-400 to-gray-600' };
  };

  const getMedalData = () => {
    const medalMap: { [key: string]: { emoji: string; color: string; bgColor: string } } = {
      bronze: { emoji: '🥉', color: 'text-orange-400', bgColor: 'bg-gradient-to-br from-orange-400 to-orange-600' },
      silver: { emoji: '🥈', color: 'text-gray-400', bgColor: 'bg-gradient-to-br from-gray-400 to-gray-600' },
      gold: { emoji: '🥇', color: 'text-yellow-400', bgColor: 'bg-gradient-to-br from-yellow-400 to-yellow-600' },
      diamond: { emoji: '💎', color: 'text-purple-400', bgColor: 'bg-gradient-to-br from-purple-400 to-purple-600' },
    };
    return medalMap[medalType || 'bronze'] || medalMap['bronze'];
  };

  const getSizeClasses = () => {
    const sizeMap = {
      sm: 'w-16 h-16 text-2xl',
      md: 'w-20 h-20 text-3xl',
      lg: 'w-24 h-24 text-4xl',
    };
    return sizeMap[size];
  };

  const getLevelStars = () => {
    const stars = [];
    for (let i = 0; i < level; i++) {
      stars.push(
        <span
          key={i}
          className="text-cartoon-yellow animate-sparkle"
          style={{ animationDelay: `${i * 0.2}s` }}
        >
          ⭐
        </span>
      );
    }
    return stars;
  };

  const progressPercentage = Math.min((progress / maxProgress) * 100, 100);
  const badgeData = getBadgeData();

  // Safety check to ensure badgeData is valid
  if (!badgeData || typeof badgeData !== 'object') {
    console.warn('AchievementBadge: Invalid badgeData for type:', type, 'medalType:', medalType);
    return <div className="text-red-500 text-sm">Badge Error</div>;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Badge container */}
      <div
        className={`
          ${getSizeClasses()}
          ${badgeData.bgColor}
          rounded-cartoon-lg
          flex items-center justify-center
          shadow-cartoon-lg
          transition-all duration-300
          relative
          ${isUnlocked 
            ? 'animate-float hover:animate-celebrate cursor-pointer' 
            : 'grayscale opacity-50'
          }
        `}
      >
        {/* Badge emoji */}
        <span className={`${badgeData.color} ${isUnlocked ? 'animate-sparkle' : ''}`}>
          {badgeData.emoji}
        </span>

        {/* Lock overlay for locked badges */}
        {!isUnlocked && (
          <div className="absolute inset-0 bg-black/30 rounded-cartoon-lg flex items-center justify-center">
            <span className="text-white text-xl">🔒</span>
          </div>
        )}

        {/* Level indicator or multiplier */}
        {level > 1 && isUnlocked && !multiplier && (
          <div className="absolute -top-2 -right-2 bg-cartoon-purple text-white text-xs font-bold px-2 py-1 rounded-full">
            Lv.{level}
          </div>
        )}
        
        {/* Medal multiplier */}
        {multiplier && isUnlocked && (
          <div className="absolute -top-2 -right-2 bg-cartoon-green text-white text-xs font-bold px-2 py-1 rounded-full">
            {multiplier.toFixed(1)}x
          </div>
        )}

        {/* Glow effect for unlocked badges */}
        {isUnlocked && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 animate-pulse" />
        )}
      </div>

      {/* Badge title */}
      <div className="mt-2 text-center">
        <h4 className={`font-bold ${isUnlocked ? 'text-gray-900' : 'text-gray-500'}`}>
          {title}
        </h4>
        <p className={`text-xs ${isUnlocked ? 'text-gray-600' : 'text-gray-400'}`}>
          {description}
        </p>
      </div>

      {/* Level stars */}
      {level > 0 && isUnlocked && (
        <div className="flex justify-center mt-1 space-x-1">
          {getLevelStars()}
        </div>
      )}

      {/* Progress bar for locked badges */}
      {!isUnlocked && showProgress && maxProgress > 0 && (
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-cartoon-green h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 text-center mt-1">
            {progress}/{maxProgress}
          </p>
        </div>
      )}

      {/* Celebration sparkles for newly unlocked badges */}
      {isUnlocked && (
        <>
          <div className="absolute -top-3 -left-3 w-2 h-2 bg-cartoon-yellow rounded-full animate-sparkle" />
          <div className="absolute -top-3 -right-3 w-2 h-2 bg-cartoon-pink rounded-full animate-sparkle" style={{ animationDelay: '0.3s' }} />
          <div className="absolute -bottom-3 -left-3 w-2 h-2 bg-cartoon-blue rounded-full animate-sparkle" style={{ animationDelay: '0.6s' }} />
          <div className="absolute -bottom-3 -right-3 w-2 h-2 bg-cartoon-green rounded-full animate-sparkle" style={{ animationDelay: '0.9s' }} />
        </>
      )}
    </div>
  );
};

export default AchievementBadge;