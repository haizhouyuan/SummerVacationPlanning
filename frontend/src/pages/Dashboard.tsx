import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { detectNetworkAndGetApiServiceSync } from '../services/compatibleApi';
import PointsDisplay from '../components/PointsDisplay';
import ProgressBar from '../components/ProgressBar';
import CelebrationModal from '../components/CelebrationModal';
import AchievementBadge from '../components/AchievementBadge';
import SummerProgressTracker from '../components/SummerProgressTracker';
import PointsHistory from '../components/PointsHistory';
import Card from '../components/Card';
import PointsProgressCard from '../components/PointsProgressCard';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showCelebration, setShowCelebration] = useState(false);
  const [showPointsHistory, setShowPointsHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  // Load dashboard statistics
  const loadDashboardStats = async () => {
    const isDemoMode = localStorage.getItem('isDemo') === 'true';
    if (!user && !isDemoMode) return;
    
    setLoading(true);
    setError(null);

    try {
      const apiService = detectNetworkAndGetApiServiceSync();
      const response = await apiService.getDashboardStats() as any;
      
      if (!response.success) {
        throw new Error(response.error || '加载统计数据失败');
      }
      
      setStats(response.data);
    } catch (error: any) {
      console.error('Error loading dashboard stats:', error);
      setError(error.message || '加载统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardStats();
  }, [user]);

  // Check if in demo mode
  const isDemoMode = localStorage.getItem('isDemo') === 'true';
  
  // Create demo user data if in demo mode and no user
  const currentUser = user || (isDemoMode ? {
    id: 'demo-user-123',
    displayName: localStorage.getItem('user_role') === 'parent' ? '演示家长' : '演示学生',
    role: localStorage.getItem('user_role') || 'student',
    points: 150,
    email: localStorage.getItem('user_email') || 'student@example.com'
  } : null);
  
  // Loading state (but not for demo mode)
  if ((!currentUser && !isDemoMode) || loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">正在加载统计数据...</p>
      </div>
    );
  }

  // Error state
  if (error || !stats) {
    return (
      <div className="p-6">
        <div className="max-w-md mx-auto bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 text-xl mb-2">⚠️</div>
          <h3 className="text-red-800 font-semibold mb-2">加载失败</h3>
          <p className="text-red-600 text-sm mb-4">{error || '无法加载统计数据'}</p>
          <button 
            onClick={loadDashboardStats}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  // Provide default fallback data structure to prevent rendering errors
  const safeStats = {
    user: {
      level: stats?.user?.level || 1,
      currentStreak: stats?.user?.currentStreak || 0,
      ...stats?.user
    },
    weeklyStats: {
      completed: stats?.weeklyStats?.completed || 0,
      ...stats?.weeklyStats
    },
    weeklyGoal: stats?.weeklyGoal || 7,
    achievements: stats?.achievements || [],
    ...stats
  };

  return (
    <div className="p-3 sm:p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
          {/* Welcome Card - Simplified for mobile */}
          <Card className="col-span-full" animate={true}>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl lg:text-6xl mb-2 sm:mb-3 animate-float">
                {currentUser?.role === 'student' ? '🎓' : '👨‍👩‍👧‍👦'}
              </div>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-cartoon-dark mb-1 sm:mb-2 font-fun animate-bounce-in px-2">
                欢迎回来，{currentUser?.displayName}！
              </h2>
              <p className="text-sm text-cartoon-gray mb-3 sm:mb-4 animate-bounce-in px-2 hidden sm:block">
                {currentUser?.role === 'student' 
                  ? '准备好开始今天的冒险了吗？ 🚀' 
                  : '查看您孩子的精彩进展 📊'}
              </p>
              
              {/* Time-based greeting - simplified for mobile */}
              <div className="inline-block bg-cartoon-blue/10 text-cartoon-blue px-2 sm:px-3 py-1 sm:py-2 rounded-cartoon font-medium text-xs mb-2 sm:mb-3 animate-pop">
                {(() => {
                  const hour = new Date().getHours();
                  if (hour < 12) return '🌅 早上好！';
                  if (hour < 18) return '☀️ 下午好！';
                  return '🌙 晚上好！';
                })()}
              </div>
              
              {/* User stats integrated into welcome */}
              <div className="flex flex-row justify-center items-center gap-2 sm:gap-3 mb-2 text-sm">
                <div className="bg-gradient-to-r from-cartoon-green to-success-400 rounded-cartoon px-3 py-1 sm:px-4 sm:py-2 animate-pop">
                  <PointsDisplay points={currentUser?.points || 0} size="sm" />
                </div>
                <div className="bg-gradient-to-r from-cartoon-purple to-primary-400 rounded-cartoon px-3 py-1 sm:px-4 sm:py-2 text-white animate-pop">
                  <span className="font-bold text-xs sm:text-sm">
                    🌟 等级 {safeStats.user.level}
                  </span>
                </div>
                {safeStats.user.currentStreak > 0 && (
                  <div className="bg-gradient-to-r from-cartoon-orange to-warning-400 rounded-cartoon px-3 py-1 sm:px-4 sm:py-2 text-white animate-pop">
                    <span className="font-bold text-xs sm:text-sm">
                      🔥 {safeStats.user.currentStreak}天
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Points & Progress Card - New combined module */}
          <PointsProgressCard
            className="col-span-full"
            dailyCompleted={1}
            dailyTotal={3}
            dailyPointsEarned={10}
            dailyPointsTotal={45}
            weeklyCompleted={safeStats.weeklyStats.completed}
            weeklyGoal={safeStats.weeklyGoal}
          />

          {/* Quick Actions - Hidden on mobile to avoid duplication with bottom nav */}
          <Card className="hidden sm:block" animate={true}>
            <h3 className="text-base sm:text-lg font-semibold text-cartoon-dark mb-3 sm:mb-4 font-fun">🚀 快速操作</h3>
            <div className="space-y-2 sm:space-y-3">
              <button 
                onClick={() => navigate('/planning')}
                className="w-full bg-gradient-to-r from-cartoon-blue to-primary-400 hover:from-primary-500 hover:to-primary-600 text-white py-3 px-4 rounded-cartoon-lg transition-all duration-200 shadow-cartoon hover:shadow-cartoon-lg animate-pop font-medium"
              >
                📅 任务规划
              </button>
              <button 
                onClick={() => navigate('/rewards')}
                className="w-full bg-gradient-to-r from-cartoon-purple to-secondary-400 hover:from-secondary-500 hover:to-secondary-600 text-white py-3 px-4 rounded-cartoon-lg transition-all duration-200 shadow-cartoon hover:shadow-cartoon-lg animate-pop font-medium"
              >
                🎁 奖励中心
              </button>
              <button 
                onClick={() => navigate('/achievements')}
                className="w-full bg-gradient-to-r from-cartoon-orange to-warning-400 hover:from-warning-500 hover:to-warning-600 text-white py-3 px-4 rounded-cartoon-lg transition-all duration-200 shadow-cartoon hover:shadow-cartoon-lg animate-pop font-medium"
              >
                🏆 成就广场
              </button>
              <button 
                onClick={() => navigate('/lite')}
                className="w-full bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white py-3 px-4 rounded-cartoon-lg transition-all duration-200 shadow-cartoon hover:shadow-cartoon-lg animate-pop font-medium"
              >
                ⚡ 简化版
              </button>
              <button 
                onClick={() => setShowPointsHistory(true)}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-400 hover:from-pink-500 hover:to-purple-600 text-white py-3 px-4 rounded-cartoon-lg transition-all duration-200 shadow-cartoon hover:shadow-cartoon-lg animate-pop font-medium"
              >
                💎 积分历史
              </button>
            </div>
          </Card>

          {/* Stats - Hidden on mobile */}
          <Card className="hidden sm:block" animate={true}>
            <h3 className="text-lg font-semibold text-cartoon-dark mb-4 font-fun">📊 统计信息</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-cartoon-light rounded-cartoon">
                <span className="text-cartoon-gray">本周完成</span>
                <span className="font-semibold text-cartoon-green flex items-center">
                  <span className="mr-1">✅</span>
                  {safeStats.weeklyStats.completed} 个任务
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-cartoon-light rounded-cartoon">
                <span className="text-cartoon-gray">累计积分</span>
                <PointsDisplay points={currentUser?.points || 0} size="sm" showLabel={false} />
              </div>
              <div className="flex justify-between items-center p-3 bg-cartoon-light rounded-cartoon">
                <span className="text-cartoon-gray">连续天数</span>
                <span className="font-semibold text-cartoon-orange flex items-center">
                  <span className="mr-1">🔥</span>
                  {safeStats.user.currentStreak} 天
                </span>
              </div>
            </div>
          </Card>

          {/* Today's Tasks - Simplified for mobile */}
          <Card className="col-span-full mt-1" animate={true}>
            <h3 className="text-base sm:text-lg font-semibold text-cartoon-dark mb-3 sm:mb-4 font-fun">✅ 今日任务</h3>
            <div className="space-y-2 sm:space-y-3">
              {/* 示例今日任务 - 这里可以从API加载实际数据 */}
              <div className="bg-cartoon-light rounded-cartoon p-3 sm:p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-cartoon-dark text-sm sm:text-base">📚 完成数学作业</h4>
                  <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full">未完成</span>
                </div>
                <p className="text-xs sm:text-sm text-cartoon-gray mb-2 sm:mb-3">完成第3章练习题1-10</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-cartoon-purple">⭐ 20 积分</span>
                  <button className="bg-cartoon-green hover:bg-success-500 text-white px-2 sm:px-3 py-1 rounded-cartoon text-xs transition-colors">
                    完成
                  </button>
                </div>
              </div>
              
              <div className="bg-cartoon-light rounded-cartoon p-3 sm:p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-cartoon-dark text-sm sm:text-base">🏃 晨跑30分钟</h4>
                  <span className="text-xs bg-cartoon-orange text-white px-2 py-1 rounded-full">进行中</span>
                </div>
                <p className="text-xs sm:text-sm text-cartoon-gray mb-2 sm:mb-3">在公园跑步30分钟</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-cartoon-purple">⭐ 15 积分</span>
                  <button className="bg-cartoon-orange hover:bg-warning-500 text-white px-2 sm:px-3 py-1 rounded-cartoon text-xs transition-colors">
                    继续
                  </button>
                </div>
              </div>
              
              <div className="bg-cartoon-light rounded-cartoon p-3 sm:p-4 opacity-75">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-cartoon-dark text-sm sm:text-base">🎸 吉他练习</h4>
                  <span className="text-xs bg-cartoon-green text-white px-2 py-1 rounded-full">✓ 已完成</span>
                </div>
                <p className="text-xs sm:text-sm text-cartoon-gray mb-2 sm:mb-3">练习新学的和弦</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-cartoon-purple">⭐ 10 积分</span>
                  <span className="text-xs text-cartoon-green">✓ 完成</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Achievements - Optimized for mobile */}
          <Card animate={true}>
            <h3 className="text-base sm:text-lg font-semibold text-cartoon-dark mb-3 sm:mb-4 font-fun">🏆 成就徽章</h3>
            <div className="overflow-x-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 min-w-0">
                {safeStats.achievements.length > 0 ? (
                  safeStats.achievements.map((achievement: any, index: number) => (
                    <AchievementBadge
                      key={index}
                      type={achievement.type as any}
                      level={achievement.level}
                      title={achievement.title}
                      description={achievement.description}
                      isUnlocked={achievement.isUnlocked}
                      progress={achievement.progress}
                      maxProgress={achievement.maxProgress}
                      size="sm"
                    />
                  ))
                ) : (
                  <div className="col-span-2 sm:col-span-3 text-center py-4 text-cartoon-gray">
                    <div className="text-2xl mb-2">🏆</div>
                    <p className="text-sm">完成任务即可获得成就徽章</p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Summer Progress Tracker - Hidden on mobile */}
          <SummerProgressTracker className="animate-bounce-in hidden sm:block" />
        </div>

        {/* Celebration Modal */}
        <CelebrationModal
          isOpen={showCelebration}
          onClose={() => setShowCelebration(false)}
          type="task_complete"
          title="任务完成！"
          message="恭喜你完成了今天的任务！"
          points={10}
          emoji="🎉"
        />

        {/* Points History Modal */}
        <PointsHistory
          isOpen={showPointsHistory}
          onClose={() => setShowPointsHistory(false)}
        />
      </div>
  );
};

export default Dashboard;