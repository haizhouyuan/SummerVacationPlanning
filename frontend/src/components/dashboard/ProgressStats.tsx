import React from 'react';
import Card from '../Card';
import ProgressBar from '../ProgressBar';
import PointsDisplay from '../PointsDisplay';

interface ProgressData {
  completed: number;
  total: number;
  points: number;
  maxPoints: number;
}

interface ProgressStatsProps {
  todayProgress: ProgressData;
  weeklyProgress: ProgressData;
  weeklyGoal: number;
  currentStreak: number;
  className?: string;
}

const ProgressStats: React.FC<ProgressStatsProps> = ({
  todayProgress,
  weeklyProgress,
  weeklyGoal,
  currentStreak,
  className = ''
}) => {
  const todayPercentage = todayProgress.total > 0 
    ? Math.round((todayProgress.completed / todayProgress.total) * 100) 
    : 0;

  const weeklyPercentage = weeklyGoal > 0 
    ? Math.round((weeklyProgress.completed / weeklyGoal) * 100) 
    : 0;

  const weeklyPointsPercentage = weeklyProgress.maxPoints > 0
    ? Math.round((weeklyProgress.points / weeklyProgress.maxPoints) * 100)
    : 0;

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-4 ${className}`}>
      {/* Today's Progress */}
      <Card animate={true}>
        <h3 className="text-lg font-semibold text-cartoon-dark mb-4 font-fun flex items-center">
          📅 今日进度
        </h3>
        
        <div className="space-y-4">
          {/* Task Completion */}
          <div className="bg-cartoon-light rounded-cartoon p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-cartoon-dark">任务完成</span>
              <span className="text-xs text-cartoon-gray">
                {todayProgress.completed}/{todayProgress.total}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-cartoon-blue to-primary-400 h-2 rounded-full transition-all duration-500"
                style={{width: `${todayPercentage}%`}}
              ></div>
            </div>
            <div className="text-xs text-cartoon-gray text-center mt-1">
              {todayPercentage}% 完成
            </div>
          </div>

          {/* Points Progress */}
          <div className="bg-cartoon-light rounded-cartoon p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-cartoon-dark">今日积分</span>
              <div className="text-right">
                <PointsDisplay 
                  points={todayProgress.points} 
                  size="xs" 
                  showLabel={false}
                />
                <div className="text-xs text-cartoon-gray">
                  / {todayProgress.maxPoints}
                </div>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-cartoon-green to-success-400 h-2 rounded-full transition-all duration-500"
                style={{width: `${Math.round((todayProgress.points / todayProgress.maxPoints) * 100)}%`}}
              ></div>
            </div>
          </div>

          {/* Today's Summary */}
          <div className="flex justify-between items-center p-3 bg-gradient-to-r from-cartoon-blue/10 to-cartoon-green/10 rounded-cartoon">
            <div>
              <div className="text-sm font-medium text-cartoon-dark">今日状态</div>
              <div className="text-xs text-cartoon-gray">
                {todayProgress.completed > 0 ? '进展不错！' : '开始今天的任务吧！'}
              </div>
            </div>
            <div className="text-2xl">
              {todayPercentage >= 100 ? '🎉' : todayPercentage >= 50 ? '👍' : '💪'}
            </div>
          </div>
        </div>
      </Card>

      {/* Weekly Progress */}
      <Card animate={true}>
        <h3 className="text-lg font-semibold text-cartoon-dark mb-4 font-fun flex items-center">
          📊 本周进度
        </h3>
        
        <div className="space-y-4">
          {/* Weekly Task Progress */}
          <div className="bg-cartoon-light rounded-cartoon p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-cartoon-dark">周任务目标</span>
              <span className="text-xs text-cartoon-gray">
                {weeklyProgress.completed}/{weeklyGoal}
              </span>
            </div>
            <ProgressBar 
              current={weeklyProgress.completed}
              max={weeklyGoal}
              label=""
              size="md"
              animated={true}
            />
            <div className="text-xs text-cartoon-gray text-center mt-1">
              {weeklyPercentage}% 完成
            </div>
          </div>

          {/* Weekly Points */}
          <div className="bg-cartoon-light rounded-cartoon p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-cartoon-dark">周积分</span>
              <div className="text-right">
                <PointsDisplay 
                  points={weeklyProgress.points} 
                  size="xs" 
                  showLabel={false}
                />
                <div className="text-xs text-cartoon-gray">
                  本周累计
                </div>
              </div>
            </div>
          </div>

          {/* Streak Counter */}
          <div className="bg-gradient-to-r from-cartoon-orange/10 to-cartoon-red/10 rounded-cartoon p-3">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm font-medium text-cartoon-dark">连续天数</div>
                <div className="text-xs text-cartoon-gray">保持学习习惯</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-cartoon-orange flex items-center">
                  🔥 {currentStreak} 天
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Summary */}
          <div className="text-center">
            <div className="text-xs text-cartoon-gray">
              {weeklyPercentage >= 100 ? '🏆 本周目标已达成！' : 
               weeklyPercentage >= 70 ? '🎯 即将达成周目标！' : 
               weeklyPercentage >= 30 ? '📈 进展良好！' : 
               '💪 继续加油！'}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ProgressStats;