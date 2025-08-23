import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { detectNetworkAndGetApiServiceSync } from '../services/compatibleApi';
import PointsDisplay from '../components/PointsDisplay';
import CelebrationModal from '../components/CelebrationModal';
import AchievementBadge from '../components/AchievementBadge';
import SummerProgressTracker from '../components/SummerProgressTracker';
import PointsHistory from '../components/PointsHistory';
import Card from '../components/Card';
import PointsProgressCard from '../components/PointsProgressCard';
import DailyTaskCard from '../components/DailyTaskCard';
import { DailyTask } from '../types';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showCelebration, setShowCelebration] = useState(false);
  const [showPointsHistory, setShowPointsHistory] = useState(false);
  const [showStatsExpanded, setShowStatsExpanded] = useState(false);
  const [showAchievementsExpanded, setShowAchievementsExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [todayTasks, setTodayTasks] = useState<DailyTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);

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

  // Load today's tasks
  const loadTodayTasks = async () => {
    const isDemoMode = localStorage.getItem('isDemo') === 'true';
    if (!user && !isDemoMode) return;
    
    setTasksLoading(true);
    
    try {
      const apiService = detectNetworkAndGetApiServiceSync();
      const today = new Date().toISOString().split('T')[0];
      const response = await apiService.getDailyTasks({ date: today }) as any;
      
      if (response.success) {
        setTodayTasks(response.data.dailyTasks || []);
      } else {
        console.error('Failed to load today tasks:', response.error);
        setTodayTasks([]);
      }
    } catch (error: any) {
      console.error('Error loading today tasks:', error);
      setTodayTasks([]);
    } finally {
      setTasksLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardStats();
    loadTodayTasks();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

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
      total: stats?.weeklyStats?.total || 0,
      ...stats?.weeklyStats
    },
    todayStats: {
      completed: stats?.todayStats?.completed || 0,
      total: stats?.todayStats?.total || 0,
      pointsEarned: stats?.todayStats?.pointsEarned || 0,
      ...stats?.todayStats
    },
    weeklyGoal: stats?.weeklyGoal || 7,
    achievements: stats?.achievements || [],
    ...stats
  };

  // Handle task status updates
  const handleTaskStatusUpdate = async (
    dailyTaskId: string,
    status: string,
    evidenceText?: string,
    evidenceMedia?: any[],
    isPublic?: boolean,
    notes?: string
  ) => {
    try {
      const apiService = detectNetworkAndGetApiServiceSync();
      const updateData = {
        status,
        evidenceText,
        evidenceMedia,
        isPublic,
        notes
      };
      
      const response = await apiService.updateDailyTaskStatus(dailyTaskId, updateData) as any;
      
      if (response.success) {
        // Refresh both tasks and stats
        await Promise.all([
          loadTodayTasks(),
          loadDashboardStats()
        ]);
        
        // Show celebration modal for completed tasks
        if (status === 'completed') {
          setShowCelebration(true);
        }
      } else {
        console.error('Failed to update task status:', response.error);
      }
    } catch (error: any) {
      console.error('Error updating task status:', error);
    }
  };

  return (
    <div className="p-2 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6">
      {/* Welcome Card - Compact for mobile */}
      <Card className="animate-bounce-in" animate={true}>
        <div className="flex items-center justify-between">
          {/* Left: Emoji and Greeting */}
          <div className="flex items-center space-x-3">
            <div className="text-3xl sm:text-4xl animate-float">
              {currentUser?.role === 'student' ? '🎓' : '👨‍👩‍👧‍👦'}
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-cartoon-dark font-fun">
                欢迎回来，{currentUser?.displayName}！
              </h2>
              <p className="text-xs sm:text-sm text-cartoon-gray">
                {(() => {
                  const hour = new Date().getHours();
                  if (hour < 12) return '🌅 早上好！';
                  if (hour < 18) return '☀️ 下午好！';
                  return '🌙 晚上好！';
                })()}
              </p>
            </div>
          </div>
          
          {/* Right: Points and Level */}
          <div className="flex flex-col items-end space-y-1">
            <div className="bg-gradient-to-r from-cartoon-green to-success-400 rounded-full px-3 py-1">
              <PointsDisplay points={currentUser?.points || 0} size="sm" />
            </div>
            <div className="flex items-center space-x-2 text-xs sm:text-sm">
              <div className="bg-gradient-to-r from-cartoon-purple to-primary-400 rounded-full px-2 py-1 text-white">
                <span className="font-bold">🌟 Lv.{safeStats.user.level}</span>
              </div>
              {safeStats.user.currentStreak > 0 && (
                <div className="bg-gradient-to-r from-cartoon-orange to-warning-400 rounded-full px-2 py-1 text-white">
                  <span className="font-bold">🔥{safeStats.user.currentStreak}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Today's Progress Summary - Compact */}
      <Card animate={true}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">📊</div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-cartoon-dark font-fun">今日进度</h3>
              <p className="text-xs sm:text-sm text-cartoon-gray">
                已完成 {safeStats.todayStats.completed}/{safeStats.todayStats.total} 任务
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg sm:text-xl font-bold text-cartoon-green">
              +{safeStats.todayStats.pointsEarned}分
            </div>
            <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
              <div 
                className="bg-gradient-to-r from-cartoon-green to-success-400 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${safeStats.todayStats.total > 0 ? (safeStats.todayStats.completed / safeStats.todayStats.total) * 100 : 0}%`
                }}
              ></div>
            </div>
          </div>
        </div>
      </Card>

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

      {/* Today's Tasks - Prioritized for mobile */}
      <Card animate={true}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm sm:text-base font-semibold text-cartoon-dark font-fun flex items-center">
            <span className="text-lg mr-2">✅</span>今日任务
          </h3>
          {todayTasks.length > 0 && (
            <button 
              onClick={() => navigate('/today')}
              className="text-xs text-cartoon-blue hover:text-primary-600 transition-colors"
            >
              查看全部 →
            </button>
          )}
        </div>
        {tasksLoading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto mb-2"></div>
            <p className="text-cartoon-gray text-xs">加载中...</p>
          </div>
        ) : todayTasks.length > 0 ? (
          <div className="space-y-2 max-h-48 sm:max-h-64 overflow-y-auto">
            {todayTasks.slice(0, 3).map((task) => (
              <div key={task.id} className="transform transition-transform hover:scale-[1.01]">
                <DailyTaskCard
                  dailyTask={task}
                  onStatusUpdate={handleTaskStatusUpdate}
                  showActions={true}
                />
              </div>
            ))}
            {todayTasks.length > 3 && (
              <div className="text-center py-2">
                <button 
                  onClick={() => navigate('/today')}
                  className="text-xs text-cartoon-gray hover:text-cartoon-dark transition-colors"
                >
                  还有 {todayTasks.length - 3} 个任务...
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4 bg-cartoon-light rounded-cartoon">
            <div className="text-2xl mb-2">📅</div>
            <h4 className="font-medium text-cartoon-dark mb-1 text-sm">今天还没有安排任务</h4>
            <p className="text-xs text-cartoon-gray mb-3">去任务规划页面安排今天的任务吧！</p>
            <button 
              onClick={() => navigate('/planning')}
              className="bg-gradient-to-r from-cartoon-blue to-primary-400 hover:from-primary-500 hover:to-primary-600 text-white py-2 px-3 rounded-cartoon text-xs font-medium transition-all duration-200 shadow-cartoon hover:shadow-cartoon-lg"
            >
              📅 去规划任务
            </button>
          </div>
        )}
      </Card>

      {/* Weekly Stats - Collapsible on mobile */}
      <Card animate={true} className="sm:hidden">
        <button
          onClick={() => setShowStatsExpanded(!showStatsExpanded)}
          className="w-full flex items-center justify-between text-left"
        >
          <h3 className="text-sm font-semibold text-cartoon-dark font-fun flex items-center">
            <span className="text-lg mr-2">📊</span>统计信息
          </h3>
          <div className="text-cartoon-gray transition-transform duration-200" style={{
            transform: showStatsExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
          }}>
            ▼
          </div>
        </button>
        
        <div className={`transition-all duration-300 overflow-hidden ${
          showStatsExpanded ? 'max-h-96 mt-3' : 'max-h-0'
        }`}>
          <div className="space-y-2">
            <div className="flex justify-between items-center p-2 bg-cartoon-light rounded-lg">
              <span className="text-xs text-cartoon-gray">本周完成</span>
              <span className="text-sm font-semibold text-cartoon-green flex items-center">
                <span className="mr-1">✅</span>
                {safeStats.weeklyStats.completed} 个任务
              </span>
            </div>
            <div className="flex justify-between items-center p-2 bg-cartoon-light rounded-lg">
              <span className="text-xs text-cartoon-gray">累计积分</span>
              <PointsDisplay points={currentUser?.points || 0} size="sm" showLabel={false} />
            </div>
            <div className="flex justify-between items-center p-2 bg-cartoon-light rounded-lg">
              <span className="text-xs text-cartoon-gray">连续天数</span>
              <span className="text-sm font-semibold text-cartoon-orange flex items-center">
                <span className="mr-1">🔥</span>
                {safeStats.user.currentStreak} 天
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Desktop Stats - Always visible */}
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

      {/* Achievements - Compact horizontal scroll */}
      <Card animate={true}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm sm:text-base font-semibold text-cartoon-dark font-fun flex items-center">
            <span className="text-lg mr-2">🏆</span>成就徽章
          </h3>
          {safeStats.achievements.length > 2 && (
            <button 
              onClick={() => navigate('/achievements')}
              className="text-xs text-cartoon-blue hover:text-primary-600 transition-colors"
            >
              查看全部 →
            </button>
          )}
        </div>
        
        {safeStats.achievements.length > 0 ? (
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex space-x-3 pb-2" style={{minWidth: 'max-content'}}>
              {safeStats.achievements.slice(0, 6).map((achievement: any, index: number) => (
                <div key={index} className="flex-shrink-0 w-24 sm:w-32">
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
                </div>
              ))}
            </div>
            {safeStats.achievements.length > 2 && (
              <div className="flex justify-center mt-2">
                <div className="text-xs text-cartoon-gray">👈 滑动查看更多徽章</div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-cartoon-gray">
            <div className="text-2xl mb-2">🏆</div>
            <h4 className="font-medium text-cartoon-dark mb-1 text-sm">还没有成就徽章</h4>
            <p className="text-xs text-cartoon-gray">完成任务即可获得成就徽章</p>
          </div>
        )}
      </Card>

      {/* Summer Progress Tracker - Hidden on mobile */}
      <SummerProgressTracker className="animate-bounce-in hidden sm:block" />
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