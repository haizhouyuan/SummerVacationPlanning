import React from 'react';
import PointsDisplay from './PointsDisplay';
import AchievementBadge from './AchievementBadge';

interface LeaderboardEntry {
  id: string;
  name: string;
  points: number;
  level: number;
  tasksCompleted: number;
  streakDays: number;
  rank: number;
  avatar?: string;
  recentAchievements: Array<{
    type: 'streak' | 'points' | 'tasks' | 'category' | 'special';
    title: string;
    isNew: boolean;
  }>;
}

interface FamilyLeaderboardProps {
  className?: string;
}

const FamilyLeaderboard: React.FC<FamilyLeaderboardProps> = ({ className = '' }) => {
  // Mock leaderboard data
  const leaderboardData: LeaderboardEntry[] = [
    {
      id: '1',
      name: '小明',
      points: 250,
      level: 3,
      tasksCompleted: 23,
      streakDays: 5,
      rank: 1,
      recentAchievements: [
        { type: 'streak', title: '连续达人', isNew: true },
        { type: 'points', title: '积分大师', isNew: false },
      ],
    },
    {
      id: '2',
      name: '小红',
      points: 180,
      level: 2,
      tasksCompleted: 15,
      streakDays: 3,
      rank: 2,
      recentAchievements: [
        { type: 'tasks', title: '任务完成者', isNew: false },
      ],
    },
    {
      id: '3',
      name: '小李',
      points: 120,
      level: 2,
      tasksCompleted: 12,
      streakDays: 2,
      rank: 3,
      recentAchievements: [],
    },
  ];

  const getRankIcon = (rank: number) => {
    const iconMap: { [key: number]: string } = {
      1: '🥇',
      2: '🥈', 
      3: '🥉',
    };
    return iconMap[rank] || '🏅';
  };

  const getRankColor = (rank: number) => {
    const colorMap: { [key: number]: string } = {
      1: 'from-cartoon-yellow to-cartoon-orange',
      2: 'from-cartoon-gray to-gray-400',
      3: 'from-cartoon-orange to-orange-400',
    };
    return colorMap[rank] || 'from-cartoon-blue to-primary-400';
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1) {
      return 'animate-float shadow-cartoon-lg border-cartoon-yellow';
    }
    return 'shadow-cartoon';
  };

  return (
    <div className={`bg-white rounded-cartoon-lg shadow-cartoon p-6 ${className}`}>
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-cartoon-dark font-fun mb-2">🏆 家庭排行榜</h3>
        <p className="text-sm text-cartoon-gray">本周积分排名</p>
      </div>

      <div className="space-y-4">
        {leaderboardData.map((entry, index) => (
          <div
            key={entry.id}
            className={`
              relative rounded-cartoon-lg p-4 border-2 transition-all duration-200
              ${getRankStyle(entry.rank)}
              ${entry.rank === 1 ? 'bg-gradient-to-r from-cartoon-yellow/10 to-cartoon-orange/10 border-cartoon-yellow/20' :
                entry.rank === 2 ? 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200' :
                entry.rank === 3 ? 'bg-gradient-to-r from-cartoon-orange/10 to-orange-50 border-cartoon-orange/20' :
                'bg-cartoon-light border-cartoon-light'
              }
            `}
          >
            {/* Rank Badge */}
            <div className="absolute -top-3 -left-3">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm
                bg-gradient-to-r ${getRankColor(entry.rank)} shadow-cartoon
                ${entry.rank === 1 ? 'animate-pulse-slow' : ''}
              `}>
                {entry.rank}
              </div>
            </div>

            {/* New Achievement Indicator */}
            {entry.recentAchievements.some(a => a.isNew) && (
              <div className="absolute -top-2 -right-2">
                <div className="bg-cartoon-red text-white text-xs px-2 py-1 rounded-cartoon animate-bounce-in">
                  NEW!
                </div>
              </div>
            )}

            <div className="flex items-center space-x-4">
              {/* Rank Icon */}
              <div className="text-3xl animate-float" style={{ animationDelay: `${index * 0.1}s` }}>
                {getRankIcon(entry.rank)}
              </div>

              {/* Student Info */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-cartoon-dark text-lg">{entry.name}</h4>
                  <PointsDisplay points={entry.points} size="sm" />
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="text-center p-2 bg-white/50 rounded-cartoon">
                    <div className="font-bold text-cartoon-green">{entry.tasksCompleted}</div>
                    <div className="text-cartoon-gray text-xs">任务</div>
                  </div>
                  <div className="text-center p-2 bg-white/50 rounded-cartoon">
                    <div className="font-bold text-cartoon-orange">{entry.streakDays}</div>
                    <div className="text-cartoon-gray text-xs">连续</div>
                  </div>
                  <div className="text-center p-2 bg-white/50 rounded-cartoon">
                    <div className="font-bold text-cartoon-purple">Lv.{entry.level}</div>
                    <div className="text-cartoon-gray text-xs">等级</div>
                  </div>
                </div>

                {/* Recent Achievements */}
                {entry.recentAchievements.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs text-cartoon-gray mb-1">最新成就:</div>
                    <div className="flex space-x-1">
                      {entry.recentAchievements.slice(0, 2).map((achievement, achievementIndex) => (
                        <div
                          key={achievementIndex}
                          className={`
                            text-xs px-2 py-1 rounded-cartoon border
                            ${achievement.isNew 
                              ? 'bg-cartoon-green/10 text-cartoon-green border-cartoon-green/20 animate-pulse' 
                              : 'bg-cartoon-blue/10 text-cartoon-blue border-cartoon-blue/20'
                            }
                          `}
                        >
                          {achievement.title}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Progress to next level */}
            <div className="mt-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-cartoon-gray">升级进度</span>
                <span className="text-xs text-cartoon-gray">
                  {entry.points % 100}/100
                </span>
              </div>
              <div className="w-full bg-white/50 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-cartoon-green to-success-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(entry.points % 100)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Encouragement for lower ranks */}
      <div className="mt-6 text-center p-4 bg-cartoon-light rounded-cartoon">
        <div className="text-2xl mb-2">💪</div>
        <p className="text-sm font-medium text-cartoon-dark">
          继续努力，下周冲击更高排名！
        </p>
        <p className="text-xs text-cartoon-gray mt-1">
          每完成一个任务都是进步的一小步
        </p>
      </div>
    </div>
  );
};

export default FamilyLeaderboard;