import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { detectNetworkAndGetApiServiceSync } from '../services/compatibleApi';
import PointsHistory from '../components/PointsHistory';
import Layout from '../components/Layout';
import { DailyTask } from '../types';
import {
  TodayTaskList,
  FeedbackAnimations
} from '../components/dashboard';
import WelcomeBannerMagic from '../components/WelcomeBanner';
import ProgressCircle from '../components/ProgressCircle';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showPointsHistory, setShowPointsHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [todayTasks, setTodayTasks] = useState<DailyTask[]>([]);
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
      // For demo mode, provide sample data
      if (isDemoMode) {
        const demoStats = {
          user: {
            level: 3,
            levelTitle: '学习新星',
            currentStreak: 7,
            nextLevelPoints: 250
          },
          weeklyStats: {
            completed: 15,
            points: 230
          },
          weeklyGoal: 20,
          achievements: [
            {
              id: 'demo-achievement-1',
              title: '连续打卡',
              description: '连续7天完成任务',
              icon: '🔥',
              unlockedAt: new Date().toISOString()
            },
            {
              id: 'demo-achievement-2', 
              title: '学习达人',
              description: '完成50个学习任务',
              icon: '📚',
              unlockedAt: new Date().toISOString()
            }
          ]
        };
        setStats(demoStats);
      } else {
        // Real API call for production
        const apiService = detectNetworkAndGetApiServiceSync();
        const response = await apiService.getDashboardStats() as any;
        
        if (!response.success) {
          throw new Error(response.error || '加载统计数据失败');
        }
        
        setStats(response.data.stats);
      }
    } catch (error: any) {
      console.error('Error loading dashboard stats:', error);
      setError(error.message || '加载统计数据失败');
      
      // Fallback to basic stats if API fails
      setStats({
        user: {
          level: 1,
          levelTitle: '新手',
          currentStreak: 0,
          nextLevelPoints: 100
        },
        weeklyStats: {
          completed: 0,
          points: 0
        },
        weeklyGoal: 10,
        achievements: []
      });
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
        const demoTasks: DailyTask[] = [
          {
            id: 'demo-task-1',
            userId: 'demo-user-123',
            taskId: 'demo-task-template-1',
            date: new Date().toISOString().split('T')[0],
            status: 'planned',
            priority: 'medium',
            pointsEarned: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            task: {
              id: 'demo-task-template-1',
              title: '完成数学作业',
              description: '完成第3章练习题1-10',
              category: 'learning',
              points: 20,
              estimatedTime: 30,
              difficulty: 'medium',
              activity: 'homework',
              requiresEvidence: false,
              evidenceTypes: ['text'],
              tags: ['homework', 'math'],
              createdBy: 'demo-user-123',
              isPublic: false,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          },
          {
            id: 'demo-task-2',
            userId: 'demo-user-123',
            taskId: 'demo-task-template-2',
            date: new Date().toISOString().split('T')[0],
            status: 'in_progress',
            priority: 'high',
            pointsEarned: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            task: {
              id: 'demo-task-template-2',
              title: '晨跑30分钟',
              description: '在公园跑步30分钟',
              category: 'exercise',
              points: 15,
              estimatedTime: 30,
              difficulty: 'easy',
              activity: 'running',
              requiresEvidence: false,
              evidenceTypes: ['photo'],
              tags: ['exercise', 'running'],
              createdBy: 'demo-user-123',
              isPublic: false,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          },
          {
            id: 'demo-task-3',
            userId: 'demo-user-123',
            taskId: 'demo-task-template-3',
            date: new Date().toISOString().split('T')[0],
            status: 'completed',
            priority: 'low',
            completedAt: new Date(),
            pointsEarned: 10,
            createdAt: new Date(),
            updatedAt: new Date(),
            task: {
              id: 'demo-task-template-3',
              title: '吉他练习',
              description: '练习新学的和弦',
              category: 'creativity',
              points: 10,
              estimatedTime: 20,
              difficulty: 'easy',
              activity: 'music_practice',
              requiresEvidence: false,
              evidenceTypes: ['video'],
              tags: ['music', 'guitar'],
              createdBy: 'demo-user-123',
              isPublic: false,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          }
        ];
        setTodayTasks(demoTasks);
      } else {
        // Real API call for production
        const apiService = detectNetworkAndGetApiServiceSync();
        const today = new Date().toISOString().split('T')[0];
        const response = await apiService.getDailyTasks({ date: today }) as any;
        
        if (response.success) {
          setTodayTasks(response.data.dailyTasks || []);
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

      // Update task status locally for immediate UI feedback
      const updatedTasks = todayTasks.map(t => 
        t.id === taskId ? { ...t, status: 'completed' as const, approvalStatus: 'pending' as const } : t
      );
      setTodayTasks(updatedTasks);

      // Show completion message without points (waiting for approval)
      setTaskCompleteData({
        title: task.task?.title || 'Task',
        points: 0, // Don't show points until approved
        message: '任务已提交，等待家长审批'
      });
      setShowTaskComplete(true);

      // Update user points if not demo mode
      const isDemoMode = localStorage.getItem('isDemo') === 'true';
      if (!isDemoMode) {
        const apiService = detectNetworkAndGetApiServiceSync();
        // CRITICAL FIX: Don't pass pointsEarned - let backend handle approval flow
        await apiService.updateDailyTaskStatus(taskId, { 
          status: 'completed',
          completedAt: new Date()
          // Removed pointsEarned - backend will set pendingPoints and approvalStatus: 'pending'
        });
        
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
      t.id === taskId ? { ...t, status: 'in_progress' as const } : t
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
    email: 'demo@example.com'
  } : null);

  // Safe stats with defaults - ensure all nested properties are defined
  const safeStats = {
    user: {
      level: stats?.user?.level || 1,
      levelTitle: stats?.user?.levelTitle || '新手',
      currentStreak: stats?.user?.currentStreak || 0,
      nextLevelPoints: stats?.user?.nextLevelPoints || 100,
      ...stats?.user
    },
    weeklyStats: {
      completed: stats?.weeklyStats?.completed || 0,
      points: stats?.weeklyStats?.points || 0,
      maxPoints: stats?.weeklyStats?.maxPoints || 0,
      ...stats?.weeklyStats
    },
    todayStats: {
      pointsEarned: stats?.todayStats?.pointsEarned || 0,
      pointsPending: stats?.todayStats?.pointsPending || 0,
      totalPointsToday: stats?.todayStats?.totalPointsToday || 0,
      tasksAwaitingApproval: stats?.todayStats?.tasksAwaitingApproval || 0,
      completed: stats?.todayStats?.completed || 0,
      planned: stats?.todayStats?.planned || 0,
      inProgress: stats?.todayStats?.inProgress || 0,
      total: stats?.todayStats?.total || 0,
      ...stats?.todayStats
    },
    weeklyGoal: stats?.weeklyGoal || 10,
    achievements: stats?.achievements || [],
    ...stats
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载仪表盘数据中...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      {/* Main Container with Unified Spacing */}
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8 py-4 space-y-6">
        
        {/* Top Section: Welcome Banner + Progress Circle */}
        {currentUser && (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 items-stretch">
            {/* Left: Welcome Banner with Magic Effects */}
            <div className="min-h-0">
              <WelcomeBannerMagic 
                title={`欢迎回来，${currentUser.displayName}！`}
                subtitle={`今日已获得 ${stats?.todayStats?.pointsEarned || 0} 积分 • 连续学习 ${safeStats.user.currentStreak || 0} 天`}
              />
            </div>
            
            {/* Right: Progress Circle */}
            <div className="flex items-center justify-center lg:justify-end">
              <ProgressCircle 
                value={Math.min(1, (safeStats.weeklyStats.completed || 0) / (safeStats.weeklyGoal || 1))} 
              />
            </div>
          </div>
        )}

        {/* Today's Tasks Section */}
        <div className="w-full">
          <TodayTaskList
            tasks={todayTasks.map(t => ({
              id: t.id,
              title: t.task?.title || 'Unknown Task',
              description: t.task?.description || '',
              points: t.task?.points || 0,
              status: t.status === 'planned' ? 'pending' : t.status === 'in_progress' ? 'in_progress' : 'completed',
              category: t.task?.category || 'other',
              // 添加审批状态相关信息
              approvalStatus: t.approvalStatus,
              approvedBy: t.approvedBy,
              approvedAt: t.approvedAt,
              approvalNotes: t.approvalNotes,
              bonusPoints: t.bonusPoints
            }))}
            onTaskComplete={handleTaskComplete}
            onTaskContinue={handleTaskContinue}
            onAddTask={handleAddTask}
          />
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
    </Layout>
  );
};

export default Dashboard;