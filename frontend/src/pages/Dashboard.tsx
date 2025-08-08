import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { detectNetworkAndGetApiServiceSync } from '../services/compatibleApi';
import PointsDisplay from '../components/PointsDisplay';
import ProgressBar from '../components/ProgressBar';
import CelebrationModal from '../components/CelebrationModal';
import AchievementBadge from '../components/AchievementBadge';
import { LoadingSpinner, ErrorDisplay, useDataState, withRetry } from '../utils/errorHandling';
import SummerProgressTracker from '../components/SummerProgressTracker';
import PointsHistory from '../components/PointsHistory';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showCelebration, setShowCelebration] = useState(false);
  const [showPointsHistory, setShowPointsHistory] = useState(false);
  
  // Use the new data state management hook
  const statsState = useDataState<any>(null);

  // Load dashboard statistics
  useEffect(() => {
    if (user) {
      loadDashboardStats();
    }
  }, [user]);

  const loadDashboardStats = async () => {
    statsState.setLoading({ 
      isLoading: true, 
      loadingMessage: '正在加载统计数据...' 
    });

    try {
      const result = await withRetry(
        async () => {
          const apiService = detectNetworkAndGetApiServiceSync();
          const response = await apiService.getDashboardStats() as any;
          
          if (!response.success) {
            throw new Error(response.error || '加载统计数据失败');
          }
          
          return response.data.stats;
        },
        {
          maxRetries: 2,
          baseDelay: 1000,
          onRetry: (attempt, error) => {
            console.warn(`Dashboard stats loading attempt ${attempt} failed:`, error);
            statsState.setLoading({ 
              isLoading: true, 
              loadingMessage: `重试中... (${attempt}/2)` 
            });
          }
        }
      );

      statsState.setData(result);
    } catch (error: any) {
      console.error('Error loading dashboard stats:', error);
      statsState.setError(error, '统计数据加载', loadDashboardStats);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Loading state
  if (!user || statsState.loading.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center">
        <LoadingSpinner
          size="lg"
          message={statsState.loading.loadingMessage || '加载中...'}
          className="text-center"
        />
      </div>
    );
  }

  // Error state
  if (statsState.error.hasError || !statsState.data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center">
        <div className="max-w-md mx-auto p-6">
          <ErrorDisplay
            error={statsState.error}
            size="lg"
            className="shadow-cartoon-lg"
          />
        </div>
      </div>
    );
  }

  const stats = statsState.data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-cartoon-light via-primary-50 to-secondary-50">
      <div className="bg-white shadow-cartoon">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-gradient-to-br from-cartoon-green to-success-400 rounded-cartoon flex items-center justify-center animate-float">
                <span className="text-white text-xl font-bold">🏖️</span>
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-cartoon-dark font-fun">暑假计划</h1>
                <p className="text-sm text-cartoon-gray">让假期更精彩 ✨</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-cartoon-dark">{user.displayName}</p>
                <p className="text-xs text-cartoon-gray">
                  {user.role === 'student' ? '👨‍🎓 学生' : '👨‍👩‍👧‍👦 家长'} • 等级 {stats.user.level}
                </p>
              </div>
              <PointsDisplay points={user.points} size="sm" />
              <button
                onClick={handleLogout}
                className="bg-gradient-to-r from-cartoon-red to-danger-500 hover:from-cartoon-red hover:to-danger-600 text-white px-4 py-2 rounded-cartoon text-sm font-medium transition-all duration-200 shadow-cartoon hover:shadow-cartoon-lg animate-pop"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Welcome Card */}
          <div className="bg-white rounded-cartoon-lg shadow-cartoon-lg p-6 col-span-full animate-bounce-in">
            <div className="text-center">
              <div className="text-6xl mb-4 animate-float">
                {user.role === 'student' ? '🎓' : '👨‍👩‍👧‍👦'}
              </div>
              <h2 className="text-3xl font-bold text-cartoon-dark mb-2 font-fun animate-bounce-in">
                欢迎回来，{user.displayName}！
              </h2>
              <p className="text-cartoon-gray mb-6 animate-bounce-in">
                {user.role === 'student' 
                  ? '准备好开始今天的冒险了吗？ 🚀' 
                  : '查看您孩子的精彩进展 📊'}
              </p>
              
              {/* Time-based greeting */}
              <div className="inline-block bg-cartoon-blue/10 text-cartoon-blue px-4 py-2 rounded-cartoon font-medium text-sm mb-4 animate-pop">
                {(() => {
                  const hour = new Date().getHours();
                  if (hour < 12) return '🌅 早上好！新的一天，新的开始！';
                  if (hour < 18) return '☀️ 下午好！继续保持优秀！';
                  return '🌙 晚上好！今天辛苦了！';
                })()}
              </div>
              <div className="flex justify-center items-center space-x-4 mb-4">
                <div className="bg-gradient-to-r from-cartoon-green to-success-400 rounded-cartoon-lg px-6 py-3 animate-pop">
                  <PointsDisplay points={user.points} size="md" />
                </div>
                <div className="bg-gradient-to-r from-cartoon-purple to-primary-400 rounded-cartoon-lg px-6 py-3 text-white animate-pop">
                  <span className="font-bold">
                    🌟 等级 {stats.user.level}
                  </span>
                </div>
              </div>
              
              {/* Weekly Progress */}
              <div className="bg-cartoon-light rounded-cartoon p-4 max-w-md mx-auto">
                <h3 className="text-sm font-medium text-cartoon-dark mb-2">本周进度</h3>
                <ProgressBar 
                  current={stats.weeklyStats.completed} 
                  max={stats.weeklyGoal}
                  label="任务完成"
                  size="md"
                  animated={true}
                />
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-cartoon-lg shadow-cartoon p-6 animate-bounce-in">
            <h3 className="text-lg font-semibold text-cartoon-dark mb-4 font-fun">🚀 快速操作</h3>
            <div className="space-y-3">
              <button 
                onClick={() => navigate('/today')}
                className="w-full bg-gradient-to-r from-cartoon-green to-success-400 hover:from-success-500 hover:to-success-600 text-white py-3 px-4 rounded-cartoon-lg transition-all duration-200 shadow-cartoon hover:shadow-cartoon-lg animate-pop font-medium"
              >
                ✅ 今日任务
              </button>
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
                onClick={() => setShowPointsHistory(true)}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-400 hover:from-pink-500 hover:to-purple-600 text-white py-3 px-4 rounded-cartoon-lg transition-all duration-200 shadow-cartoon hover:shadow-cartoon-lg animate-pop font-medium"
              >
                💎 积分历史
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white rounded-cartoon-lg shadow-cartoon p-6 animate-bounce-in">
            <h3 className="text-lg font-semibold text-cartoon-dark mb-4 font-fun">📊 统计信息</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-cartoon-light rounded-cartoon">
                <span className="text-cartoon-gray">本周完成</span>
                <span className="font-semibold text-cartoon-green flex items-center">
                  <span className="mr-1">✅</span>
                  {stats.weeklyStats.completed} 个任务
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-cartoon-light rounded-cartoon">
                <span className="text-cartoon-gray">累计积分</span>
                <PointsDisplay points={user.points} size="sm" showLabel={false} />
              </div>
              <div className="flex justify-between items-center p-3 bg-cartoon-light rounded-cartoon">
                <span className="text-cartoon-gray">连续天数</span>
                <span className="font-semibold text-cartoon-orange flex items-center">
                  <span className="mr-1">🔥</span>
                  {stats.user.currentStreak} 天
                </span>
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div className="bg-white rounded-cartoon-lg shadow-cartoon p-6 animate-bounce-in">
            <h3 className="text-lg font-semibold text-cartoon-dark mb-4 font-fun">🏆 成就徽章</h3>
            <div className="grid grid-cols-3 gap-4">
              {stats.achievements.length > 0 ? (
                stats.achievements.map((achievement: any, index: number) => (
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
                <div className="col-span-3 text-center py-4 text-cartoon-gray">
                  <div className="text-2xl mb-2">🏆</div>
                  <p className="text-sm">完成任务即可获得成就徽章</p>
                </div>
              )}
            </div>
          </div>

          {/* Summer Progress Tracker */}
          <SummerProgressTracker className="animate-bounce-in" />
        </div>
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