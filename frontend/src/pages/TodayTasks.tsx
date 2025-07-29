import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../components/NotificationSystem';
import { DailyTask } from '../types';
import { apiService } from '../services/api';
import DailyTaskCard from '../components/DailyTaskCard';
import PointsDisplay from '../components/PointsDisplay';
import AchievementBadge from '../components/AchievementBadge';
import GameTimeExchange from '../components/GameTimeExchange';
import EvidenceModal from '../components/EvidenceModal';
import WeatherWidget from '../components/WeatherWidget';

const TodayTasks: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { showSuccess, showError } = useNotifications();
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
  const [gameTimeStats, setGameTimeStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [todayDate] = useState(new Date().toISOString().split('T')[0]);
  const [previousPoints, setPreviousPoints] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<DailyTask | null>(null);

  useEffect(() => {
    loadTodayTasks();
    loadGameTimeStats();
  }, []);

  const loadTodayTasks = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiService.getDailyTasks({ date: todayDate });
      setDailyTasks((response as any).data.dailyTasks);
    } catch (error: any) {
      console.error('Error loading today tasks:', error);
      setError(error.message || '加载今日任务失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const loadGameTimeStats = async () => {
    try {
      const response = await apiService.getTodayGameTime({ date: todayDate });
      setGameTimeStats((response as any).data.gameTimeStats);
    } catch (error) {
      console.error('Error loading game time stats:', error);
    }
  };

  const handleStatusUpdate = async (
    dailyTaskId: string,
    status: string,
    evidenceData?: any
  ) => {
    try {
      setPreviousPoints(user?.points || 0);
      await apiService.updateDailyTaskStatus(dailyTaskId, { 
        status, 
        evidenceText: evidenceData?.text,
        evidenceMedia: evidenceData?.files 
      });
      await loadTodayTasks();
      await refreshUser();
      if (status === 'completed') {
        const task = dailyTasks.find(dt => dt.id === dailyTaskId);
        if (task) {
          const points = task.pointsEarned || task.task?.points || 0;
          showSuccess(
            '任务完成！', 
            `恭喜！您获得了 ${points} 积分！`,
            {
              label: '查看奖励',
              onClick: () => window.location.href = '/rewards'
            }
          );
        }
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      showError('更新失败', '更新任务状态时出现错误，请重试');
    }
  };

  const handleDeleteTask = async (dailyTaskId: string) => {
    if (window.confirm('确定要删除这个任务吗？')) {
      try {
        await apiService.deleteDailyTask(dailyTaskId);
        await loadTodayTasks();
        showSuccess('删除成功', '任务已成功删除');
      } catch (error) {
        console.error('Error deleting task:', error);
        showError('删除失败', '删除任务时出现错误，请重试');
      }
    }
  };

  const handleEvidenceSubmit = async (evidenceData: any) => {
    try {
      if (!selectedTask) return;
      
      await handleStatusUpdate(selectedTask.id, 'completed', evidenceData);
      
      setModalOpen(false);
      setSelectedTask(null);
      await loadTodayTasks();
    } catch (error) {
      console.error('Error submitting evidence:', error);
      showError('提交失败', '提交证据时出现错误，请重试');
    }
  };

  const getTasksByStatus = (status: string) => {
    return dailyTasks.filter(task => task.status === status);
  };

  const getTotalPointsEarned = () => {
    return getTasksByStatus('completed').reduce((total, task) => {
      return total + (task.pointsEarned || task.task?.points || 0);
    }, 0);
  };

  const getCompletionRate = () => {
    if (dailyTasks.length === 0) return 0;
    const completed = getTasksByStatus('completed').length;
    return Math.round((completed / dailyTasks.length) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">加载今日任务中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-100 to-secondary-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-primary-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xl font-bold">✅</span>
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">今日任务</h1>
                <p className="text-sm text-gray-600">完成今天的学习计划</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.displayName}</p>
                <p className="text-xs text-gray-500">
                  {user?.role === 'student' ? '👨‍🎓 学生' : '👨‍👩‍👧‍👦 家长'} • 积分: {user?.points || 0}
                </p>
              </div>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
              >
                返回首页
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error State */}
        {error && (
          <div className="mb-6 bg-danger-50 border border-danger-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <span className="text-danger-600">⚠️</span>
              <p className="text-danger-800">{error}</p>
              <button
                onClick={loadTodayTasks}
                className="ml-auto bg-danger-600 hover:bg-danger-700 text-white px-3 py-1 rounded text-sm"
              >
                重试
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Stats */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Today's Stats */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 今日统计</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">完成率</span>
                    <span className="font-semibold text-success-600">{getCompletionRate()}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">获得积分</span>
                    <span className="font-semibold text-primary-600">{getTotalPointsEarned()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">总任务数</span>
                    <span className="font-semibold text-gray-700">{dailyTasks.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">已完成</span>
                    <span className="font-semibold text-success-600">
                      {getTasksByStatus('completed').length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Streak Info */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🔥 连续记录</h3>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-500 mb-2">
                    {user?.currentStreak || 0}
                  </div>
                  <p className="text-sm text-gray-600">
                    🔥 连续完成 {user?.currentStreak || 0} 天
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">⚡ 快速操作</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => window.location.href = '/planning'}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-200"
                  >
                    📅 添加任务
                  </button>
                  <button
                    onClick={() => window.location.href = '/rewards'}
                    className="w-full bg-secondary-600 hover:bg-secondary-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-200"
                  >
                    🎁 兑换奖励
                  </button>
                  <button
                    onClick={() => window.location.href = '/achievements'}
                    className="w-full bg-success-600 hover:bg-success-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-200"
                  >
                    📊 成就广场
                  </button>
                </div>
              </div>

              {/* Game Time Exchange */}
              <GameTimeExchange 
                onExchangeSuccess={loadGameTimeStats}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="space-y-8">
              {/* Completed Tasks */}
              {getTasksByStatus('completed').length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="mr-2">✅</span>
                    已完成的任务
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {getTasksByStatus('completed').map((dailyTask) => (
                      <DailyTaskCard
                        key={dailyTask.id}
                        dailyTask={dailyTask}
                        onStatusUpdate={handleStatusUpdate}
                        onDelete={handleDeleteTask}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* In Progress Tasks */}
              {getTasksByStatus('in_progress').length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="mr-2">⏳</span>
                    进行中的任务
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {getTasksByStatus('in_progress').map((dailyTask) => (
                      <DailyTaskCard
                        key={dailyTask.id}
                        dailyTask={dailyTask}
                        onStatusUpdate={handleStatusUpdate}
                        onDelete={handleDeleteTask}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Planned Tasks */}
              {getTasksByStatus('planned').length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="mr-2">📋</span>
                    计划中的任务
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {getTasksByStatus('planned').map((dailyTask) => (
                      <DailyTaskCard
                        key={dailyTask.id}
                        dailyTask={dailyTask}
                        onStatusUpdate={handleStatusUpdate}
                        onDelete={handleDeleteTask}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {dailyTasks.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📅</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">今天还没有任务</h3>
                  <p className="text-gray-600 mb-6">开始制定今天的学习计划吧！</p>
                  <button
                    onClick={() => window.location.href = '/planning'}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                  >
                    📝 制定今日计划
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Evidence Upload Modal */}
      {modalOpen && selectedTask && selectedTask.task && (
        <EvidenceModal
          onClose={() => {
            setModalOpen(false);
            setSelectedTask(null);
          }}
          onSubmit={handleEvidenceSubmit}
          task={selectedTask.task}
          dailyTask={selectedTask}
        />
      )}
    </div>
  );
};

export default TodayTasks;