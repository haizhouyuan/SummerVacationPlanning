import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { detectNetworkAndGetApiServiceSync } from '../services/compatibleApi';
import PointsHistory from '../components/PointsHistory';
import SummerProgressTracker from '../components/SummerProgressTracker';
import Card from '../components/Card';
import {
  WelcomeBanner,
  TodayTaskList,
  ProgressStats,
  AchievementGrid,
  FeedbackAnimations
} from '../components/dashboard';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showPointsHistory, setShowPointsHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [todayTasks, setTodayTasks] = useState<any[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  
  // Feedback animation states
  const [showTaskComplete, setShowTaskComplete] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [taskCompleteData, setTaskCompleteData] = useState<any>(null);
  const [levelUpData, setLevelUpData] = useState<any>(null);

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
    
    setLoadingTasks(true);

    try {
      // For demo mode, provide sample tasks
      if (isDemoMode) {
        const demoTasks = [
          {
            id: 'demo-task-1',
            title: '完成数学作业',
            description: '完成第3章练习题1-10',
            points: 20,
            status: 'pending',
            category: 'learning'
          },
          {
            id: 'demo-task-2',
            title: '晨跑30分钟',
            description: '在公园跑步30分钟',
            points: 15,
            status: 'in_progress',
            category: 'exercise'
          },
          {
            id: 'demo-task-3',
            title: '吉他练习',
            description: '练习新学的和弦',
            points: 10,
            status: 'completed',
            category: 'creativity'
          }
        ];
        setTodayTasks(demoTasks);
      } else {
        // Real API call for production
        const apiService = detectNetworkAndGetApiServiceSync();
        const response = await apiService.getTodayTasks() as any;
        
        if (response.success) {
          setTodayTasks(response.data || []);
        } else {
          console.warn('Failed to load today tasks:', response.error);
          setTodayTasks([]);
        }
      }
    } catch (error: any) {
      console.error('Error loading today tasks:', error);
      setTodayTasks([]);
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    loadDashboardStats();
    loadTodayTasks();
  }, [user]);

  // Task handling functions
  const handleTaskComplete = async (taskId: string) => {
    try {
      // Find the task
      const task = todayTasks.find(t => t.id === taskId);
      if (!task) return;

      // Update task status locally
      const updatedTasks = todayTasks.map(t => 
        t.id === taskId ? { ...t, status: 'completed' } : t
      );
      setTodayTasks(updatedTasks);

      // Show completion animation
      setTaskCompleteData({
        title: task.title,
        points: task.points
      });
      setShowTaskComplete(true);

      // Update user points if not demo mode
      const isDemoMode = localStorage.getItem('isDemo') === 'true';
      if (!isDemoMode) {
        const apiService = detectNetworkAndGetApiServiceSync();
        await apiService.completeTask(taskId);
        
        // Refresh dashboard stats
        loadDashboardStats();
      }
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const handleTaskContinue = (taskId: string) => {
    // Navigate to task detail or simply update status
    const updatedTasks = todayTasks.map(t => 
      t.id === taskId ? { ...t, status: 'in_progress' } : t
    );
    setTodayTasks(updatedTasks);
  };

  const handleAddTask = () => {
    navigate('/planning');
  };

  const handleAnimationComplete = (type: string) => {
    switch (type) {
      case 'task_complete':
        setShowTaskComplete(false);
        setTaskCompleteData(null);
        break;
      case 'level_up':
        setShowLevelUp(false);
        setLevelUpData(null);
        break;
    }
  };

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
      <div className="max-w-7xl mx-auto">
        {/* Welcome Banner */}
        <WelcomeBanner 
          user={currentUser}
          userLevel={safeStats.user.level}
          className="mb-6"
        />

        {/* Today's Tasks Section */}
        <TodayTaskList
          tasks={todayTasks}
          onTaskComplete={handleTaskComplete}
          onTaskContinue={handleTaskContinue}
          onAddTask={handleAddTask}
          className="mb-6"
        />

        {/* Progress Stats and Achievement Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div>
            <ProgressStats
              todayProgress={{
                completed: todayTasks.filter(t => t.status === 'completed').length,
                total: todayTasks.length,
                points: todayTasks.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.points, 0),
                maxPoints: todayTasks.reduce((sum, t) => sum + t.points, 0)
              }}
              weeklyProgress={{
                completed: safeStats.weeklyStats.completed,
                total: safeStats.weeklyGoal,
                points: safeStats.weeklyStats.points || 0,
                maxPoints: safeStats.weeklyStats.maxPoints || 0
              }}
              weeklyGoal={safeStats.weeklyGoal}
              currentStreak={safeStats.user.currentStreak}
            />
          </div>
          
          <div>
            <AchievementGrid
              currentLevel={safeStats.user.level}
              nextLevelPoints={safeStats.user.nextLevelPoints || 200}
              currentPoints={currentUser?.points || 0}
              currentStreak={safeStats.user.currentStreak}
              achievements={safeStats.achievements}
              levelTitle={safeStats.user.levelTitle}
            />
          </div>
        </div>

        {/* Additional Sections Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

          {/* Summer Progress Tracker */}
          <SummerProgressTracker className="col-span-1 md:col-span-2 animate-bounce-in" />
        </div>
      </div>

      {/* Feedback Animations */}
      <FeedbackAnimations
        showTaskComplete={showTaskComplete}
        showLevelUp={showLevelUp}
        taskData={taskCompleteData}
        levelData={levelUpData}
        onAnimationComplete={handleAnimationComplete}
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