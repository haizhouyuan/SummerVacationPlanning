import React from 'react';
import Card from './Card';
import ProgressBar from './ProgressBar';

interface PointsProgressCardProps {
  dailyCompleted: number;
  dailyTotal: number;
  dailyPointsEarned: number;
  dailyPointsTotal: number;
  weeklyCompleted: number;
  weeklyGoal: number;
  className?: string;
}

const PointsProgressCard: React.FC<PointsProgressCardProps> = ({
  dailyCompleted,
  dailyTotal,
  dailyPointsEarned,
  dailyPointsTotal,
  weeklyCompleted,
  weeklyGoal,
  className = ''
}) => {
  const dailyCompletionRate = dailyTotal > 0 ? (dailyCompleted / dailyTotal) * 100 : 0;
  const weeklyCompletionRate = weeklyGoal > 0 ? (weeklyCompleted / weeklyGoal) * 100 : 0;

  return (
    <Card className={`${className}`} animate={true}>
      <div className="space-y-3 sm:space-y-4">
        {/* Daily Progress */}
        <div className="bg-gradient-to-r from-cartoon-blue/10 to-cartoon-green/10 rounded-cartoon p-3 sm:p-4">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h4 className="font-medium text-cartoon-dark text-sm sm:text-base">今日进度</h4>
              <p className="text-xs sm:text-sm text-cartoon-gray">已完成 {dailyCompleted}/{dailyTotal} 个任务</p>
            </div>
            <div className="text-right">
              <p className="text-sm sm:text-lg font-bold text-cartoon-green">{dailyPointsEarned} / {dailyPointsTotal}</p>
              <p className="text-xs text-cartoon-gray">今日积分</p>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-cartoon-green to-success-400 h-2 rounded-full transition-all duration-300" 
              style={{width: `${dailyCompletionRate}%`}}
            ></div>
          </div>
        </div>

        {/* Weekly Progress */}
        <div className="bg-gradient-to-r from-cartoon-purple/10 to-cartoon-orange/10 rounded-cartoon p-3 sm:p-4">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h4 className="font-medium text-cartoon-dark text-sm sm:text-base">本周进度</h4>
              <p className="text-xs sm:text-sm text-cartoon-gray">已完成 {weeklyCompleted}/{weeklyGoal} 个任务</p>
            </div>
            <div className="text-right">
              <p className="text-sm sm:text-lg font-bold text-cartoon-purple">{Math.round(weeklyCompletionRate)}%</p>
              <p className="text-xs text-cartoon-gray">完成率</p>
            </div>
          </div>
          <ProgressBar 
            current={weeklyCompleted} 
            max={weeklyGoal}
            size="sm"
            animated={true}
            className="mt-2"
          />
        </div>
      </div>
    </Card>
  );
};

export default PointsProgressCard;