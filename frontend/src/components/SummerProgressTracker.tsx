import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { detectNetworkAndGetApiServiceSync } from '../services/compatibleApi';

interface SummerProgressTrackerProps {
  className?: string;
}

interface ProgressData {
  startDate: string;
  endDate: string;
  totalDays: number;
  daysElapsed: number;
  daysRemaining: number;
  progressPercentage: number;
  totalTasksPlanned: number;
  totalTasksCompleted: number;
  totalPointsEarned: number;
  averagePointsPerDay: number;
  streakRecord: number;
  currentStreak: number;
  weeklyStats: {
    week: number;
    tasks: number;
    points: number;
  }[];
}

const SummerProgressTracker: React.FC<SummerProgressTrackerProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadProgressData();
  }, []);

  const loadProgressData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Calculate summer vacation period (June 15 - August 31)
      const currentYear = new Date().getFullYear();
      const startDate = new Date(currentYear, 5, 15); // June 15
      const endDate = new Date(currentYear, 7, 31); // August 31
      const today = new Date();
      
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysElapsed = Math.max(0, Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
      const daysRemaining = Math.max(0, totalDays - daysElapsed);
      const progressPercentage = Math.min(100, Math.round((daysElapsed / totalDays) * 100));

      // Get tasks and statistics from API
      const apiService = detectNetworkAndGetApiServiceSync();
      const response = await apiService.getDashboardStats() as any;
      if (response.success) {
        const stats = response.data.stats;
        
        setProgressData({
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          totalDays,
          daysElapsed,
          daysRemaining,
          progressPercentage,
          totalTasksPlanned: 50, // Mock data - could be calculated from actual tasks
          totalTasksCompleted: 25, // Mock data
          totalPointsEarned: user?.points || 0,
          averagePointsPerDay: daysElapsed > 0 ? Math.round((user?.points || 0) / daysElapsed) : 0,
          streakRecord: 12, // Mock data
          currentStreak: user?.currentStreak || 0,
          weeklyStats: [ // Mock weekly data
            { week: 1, tasks: 5, points: 25 },
            { week: 2, tasks: 7, points: 35 },
            { week: 3, tasks: 6, points: 30 },
            { week: 4, tasks: 4, points: 20 },
          ]
        });
      }
    } catch (error: any) {
      console.error('Error loading progress data:', error);
      setError('加载进度数据失败');
    } finally {
      setLoading(false);
    }
  };

  const getMotivationalMessage = () => {
    if (!progressData) return '';
    
    const { progressPercentage, currentStreak } = progressData;
    
    if (progressPercentage < 25) {
      return '🌱 暑假刚开始，保持积极的态度！';
    } else if (progressPercentage < 50) {
      return '🌿 你已经走了四分之一的路程，继续加油！';
    } else if (progressPercentage < 75) {
      return '🌳 已经过半了！你做得很棒！';
    } else if (progressPercentage < 90) {
      return '🎯 快要到终点了，坚持到底！';
    } else {
      return '🏆 暑假即将结束，你收获满满！';
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-cartoon-lg shadow-cartoon p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-20 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error || !progressData) {
    return (
      <div className={`bg-white rounded-cartoon-lg shadow-cartoon p-6 ${className}`}>
        <div className="text-center py-4">
          <div className="text-2xl mb-2">📊</div>
          <p className="text-cartoon-gray">{error || '暂无进度数据'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-cartoon-lg shadow-cartoon p-6 ${className}`}>
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-cartoon-dark font-fun mb-2">
          🏖️ 暑假进度追踪
        </h3>
        <p className="text-sm text-cartoon-gray">
          {progressData.startDate} - {progressData.endDate}
        </p>
      </div>

      {/* Progress Ring */}
      <div className="flex justify-center mb-6">
        <div className="relative w-32 h-32">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-cartoon-light"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="text-cartoon-green"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray={`${progressData.progressPercentage}, 100`}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-cartoon-green">
              {progressData.progressPercentage}%
            </span>
            <span className="text-xs text-cartoon-gray">完成</span>
          </div>
        </div>
      </div>

      {/* Days Info */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-cartoon-light rounded-cartoon">
          <div className="text-lg font-bold text-cartoon-dark">
            {progressData.totalDays}
          </div>
          <div className="text-xs text-cartoon-gray">总天数</div>
        </div>
        <div className="text-center p-3 bg-cartoon-blue/10 rounded-cartoon">
          <div className="text-lg font-bold text-cartoon-blue">
            {progressData.daysElapsed}
          </div>
          <div className="text-xs text-cartoon-gray">已过天数</div>
        </div>
        <div className="text-center p-3 bg-cartoon-orange/10 rounded-cartoon">
          <div className="text-lg font-bold text-cartoon-orange">
            {progressData.daysRemaining}
          </div>
          <div className="text-xs text-cartoon-gray">剩余天数</div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-3 bg-cartoon-green/10 rounded-cartoon">
          <div className="text-lg font-bold text-cartoon-green">
            {progressData.totalPointsEarned}
          </div>
          <div className="text-xs text-cartoon-gray">总积分</div>
        </div>
        <div className="text-center p-3 bg-cartoon-purple/10 rounded-cartoon">
          <div className="text-lg font-bold text-cartoon-purple">
            {progressData.averagePointsPerDay}
          </div>
          <div className="text-xs text-cartoon-gray">日均积分</div>
        </div>
        <div className="text-center p-3 bg-cartoon-red/10 rounded-cartoon">
          <div className="text-lg font-bold text-cartoon-red">
            🔥 {progressData.currentStreak}
          </div>
          <div className="text-xs text-cartoon-gray">当前连击</div>
        </div>
        <div className="text-center p-3 bg-cartoon-yellow/10 rounded-cartoon">
          <div className="text-lg font-bold text-cartoon-orange">
            ⭐ {progressData.streakRecord}
          </div>
          <div className="text-xs text-cartoon-gray">最高连击</div>
        </div>
      </div>

      {/* Motivational Message */}
      <div className="text-center p-4 bg-gradient-to-r from-cartoon-blue/10 to-cartoon-green/10 rounded-cartoon">
        <p className="text-sm font-medium text-cartoon-dark">
          {getMotivationalMessage()}
        </p>
      </div>

      {/* Weekly Progress Mini Chart */}
      <div className="mt-6">
        <h4 className="text-sm font-medium text-cartoon-dark mb-3">📈 周度进展</h4>
        <div className="flex space-x-2">
          {progressData.weeklyStats.map((week, index) => (
            <div 
              key={week.week}
              className="flex-1 text-center p-2 bg-cartoon-light rounded"
            >
              <div className="text-xs text-cartoon-gray mb-1">第{week.week}周</div>
              <div 
                className="bg-cartoon-green rounded-sm"
                style={{ 
                  height: `${Math.max(4, (week.points / 40) * 24)}px`,
                  width: '100%'
                }}
              />
              <div className="text-xs text-cartoon-gray mt-1">{week.points}分</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SummerProgressTracker;