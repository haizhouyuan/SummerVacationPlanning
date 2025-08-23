import React from 'react';
import Card from '../Card';
import AchievementBadge from '../AchievementBadge';

interface Achievement {
  type: string;
  level: number;
  title: string;
  description: string;
  isUnlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

interface AchievementGridProps {
  currentLevel: number;
  nextLevelPoints: number;
  currentPoints: number;
  currentStreak: number;
  achievements: Achievement[];
  levelTitle?: string;
  className?: string;
}

const AchievementGrid: React.FC<AchievementGridProps> = ({
  currentLevel,
  nextLevelPoints,
  currentPoints,
  currentStreak,
  achievements,
  levelTitle,
  className = ''
}) => {
  // Calculate level progress
  const levelProgress = nextLevelPoints > 0 
    ? Math.min(Math.round((currentPoints / nextLevelPoints) * 100), 100)
    : 100;

  const pointsToNext = Math.max(nextLevelPoints - currentPoints, 0);

  // Level icons based on level ranges
  const getLevelIcon = (level: number) => {
    if (level >= 20) return '👑';
    if (level >= 15) return '💎';
    if (level >= 10) return '🏆';
    if (level >= 5) return '🥇';
    if (level >= 3) return '🌟';
    return '⭐';
  };

  // Streak milestone rewards
  const getStreakMilestone = (streak: number) => {
    if (streak >= 30) return { icon: '🔥', title: '传奇连击', color: 'text-red-500' };
    if (streak >= 14) return { icon: '⚡', title: '超级连击', color: 'text-orange-500' };
    if (streak >= 7) return { icon: '💪', title: '持续坚持', color: 'text-yellow-500' };
    if (streak >= 3) return { icon: '🎯', title: '连续学习', color: 'text-blue-500' };
    return { icon: '🌱', title: '刚刚开始', color: 'text-green-500' };
  };

  const streakInfo = getStreakMilestone(currentStreak);

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-4 ${className}`}>
      {/* Level Display and Progress */}
      <Card animate={true}>
        <h3 className="text-lg font-semibold text-cartoon-dark mb-4 font-fun flex items-center">
          🌟 等级进度
        </h3>
        
        <div className="text-center mb-4">
          <div className="text-4xl mb-2">{getLevelIcon(currentLevel)}</div>
          <div className="text-2xl font-bold text-cartoon-purple mb-1">
            等级 {currentLevel}
          </div>
          {levelTitle && (
            <div className="text-sm text-cartoon-gray mb-3">
              "{levelTitle}"
            </div>
          )}
        </div>

        {/* Level Progress Bar */}
        <div className="bg-cartoon-light rounded-cartoon p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-cartoon-dark">升级进度</span>
            <span className="text-xs text-cartoon-gray">
              {currentPoints}/{nextLevelPoints}
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div 
              className="bg-gradient-to-r from-cartoon-purple to-primary-400 h-3 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
              style={{width: `${levelProgress}%`}}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
          </div>
          
          <div className="text-center">
            {pointsToNext > 0 ? (
              <span className="text-xs text-cartoon-gray">
                还需 {pointsToNext} 积分升级
              </span>
            ) : (
              <span className="text-xs text-cartoon-green animate-bounce">
                🎉 可以升级了！
              </span>
            )}
          </div>
        </div>

        {/* Streak Display */}
        <div className="bg-gradient-to-r from-cartoon-orange/10 to-cartoon-red/10 rounded-cartoon p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-cartoon-dark">学习连击</div>
              <div className="text-xs text-cartoon-gray">{streakInfo.title}</div>
            </div>
            <div className="text-right">
              <div className={`text-2xl ${streakInfo.color}`}>
                {streakInfo.icon}
              </div>
              <div className="font-bold text-cartoon-orange">
                {currentStreak} 天
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Achievement Badges */}
      <Card animate={true}>
        <h3 className="text-lg font-semibold text-cartoon-dark mb-4 font-fun flex items-center">
          🏆 成就徽章
        </h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          {achievements.length > 0 ? (
            achievements.slice(0, 6).map((achievement, index) => (
              <div key={index} className="relative">
                <AchievementBadge
                  type={achievement.type as any}
                  level={achievement.level}
                  title={achievement.title}
                  description={achievement.description}
                  isUnlocked={achievement.isUnlocked}
                  progress={achievement.progress}
                  maxProgress={achievement.maxProgress}
                  size="sm"
                />
                {/* New achievement indicator */}
                {achievement.isUnlocked && index < 2 && (
                  <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center animate-bounce">
                    !
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="col-span-2 sm:col-span-3 text-center py-6">
              <div className="text-3xl mb-2">🏆</div>
              <div className="text-sm text-cartoon-gray mb-2">暂无成就徽章</div>
              <div className="text-xs text-cartoon-gray">完成任务即可获得徽章</div>
            </div>
          )}
        </div>

        {/* Achievement Stats */}
        <div className="bg-cartoon-light rounded-cartoon p-3">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-cartoon-green">
                {achievements.filter(a => a.isUnlocked).length}
              </div>
              <div className="text-xs text-cartoon-gray">已获得</div>
            </div>
            <div>
              <div className="text-lg font-bold text-cartoon-gray">
                {achievements.length}
              </div>
              <div className="text-xs text-cartoon-gray">总共</div>
            </div>
          </div>
        </div>

        {/* View All Achievements */}
        {achievements.length > 6 && (
          <div className="text-center mt-3">
            <button className="text-sm text-cartoon-blue hover:text-primary-600 transition-colors">
              查看全部成就 ({achievements.length}) →
            </button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AchievementGrid;