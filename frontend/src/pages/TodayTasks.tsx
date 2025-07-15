import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DailyTask } from '../types';
import { apiService } from '../services/api';
import DailyTaskCard from '../components/DailyTaskCard';

const TodayTasks: React.FC = () => {
  const { user } = useAuth();
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
  const [gameTimeStats, setGameTimeStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [todayDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadTodayTasks();
    loadGameTimeStats();
  }, []);

  const loadTodayTasks = async () => {
    try {
      setLoading(true);
      const response = await apiService.getDailyTasks({ date: todayDate });
      setDailyTasks((response as any).data.dailyTasks);
    } catch (error) {
      console.error('Error loading today tasks:', error);
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

  const handleStatusUpdate = async (dailyTaskId: string, status: string, evidence?: any[], notes?: string) => {
    try {
      await apiService.updateDailyTaskStatus(dailyTaskId, {
        status,
        evidence,
        notes,
      });
      
      // Reload tasks and stats to reflect changes
      await loadTodayTasks();
      await loadGameTimeStats();
      
      // Show success message
      if (status === 'completed') {
        const task = dailyTasks.find(dt => dt.id === dailyTaskId);
        if (task) {
          alert(`🎉 任务完成！获得 ${task.task?.points || 0} 积分！`);
        }
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      alert('更新任务状态时出现错误，请重试');
    }
  };

  const handleDeleteTask = async (dailyTaskId: string) => {
    if (window.confirm('确定要删除这个任务吗？')) {
      try {
        await apiService.deleteDailyTask(dailyTaskId);
        await loadTodayTasks();
      } catch (error) {
        console.error('Error deleting task:', error);
        alert('删除任务时出现错误，请重试');
      }
    }
  };

  const getTasksByStatus = (status: string) => {
    return dailyTasks.filter(task => task.status === status);
  };

  const getTotalPointsEarned = () => {
    return dailyTasks
      .filter(task => task.status === 'completed')
      .reduce((sum, task) => sum + (task.pointsEarned || 0), 0);
  };

  const getCompletionRate = () => {
    if (dailyTasks.length === 0) return 0;
    const completed = dailyTasks.filter(task => task.status === 'completed').length;
    return Math.round((completed / dailyTasks.length) * 100);
  };

  if (!user) {
    return <div className="min-h-screen bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-lg text-gray-600">加载中...</p>
      </div>
    </div>;
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
                <p className="text-sm font-medium text-gray-900">{user.displayName}</p>
                <p className="text-xs text-gray-500">{user.points} 积分</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

              {/* Game Time Stats */}
              {gameTimeStats && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">🎮 游戏时间</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">基础时间</span>
                      <span className="font-semibold text-gray-700">{gameTimeStats.baseGameTime}分钟</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">奖励时间</span>
                      <span className="font-semibold text-secondary-600">{gameTimeStats.bonusTimeEarned}分钟</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">剩余时间</span>
                      <span className="font-semibold text-primary-600">{gameTimeStats.remainingTime}分钟</span>
                    </div>
                  </div>
                  
                  {gameTimeStats.remainingTime > 0 && (
                    <div className="mt-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${Math.max(0, Math.min(100, (gameTimeStats.totalUsed / gameTimeStats.totalAvailable) * 100))}%` 
                          }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        已使用 {gameTimeStats.totalUsed} / {gameTimeStats.totalAvailable} 分钟
                      </p>
                    </div>
                  )}
                </div>
              )}

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
                    onClick={() => window.location.href = '/records'}
                    className="w-full bg-success-600 hover:bg-success-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-200"
                  >
                    📊 查看记录
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content - Tasks */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">加载任务中...</p>
              </div>
            ) : dailyTasks.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">今日还没有任务</h3>
                <p className="text-gray-600 mb-4">去任务规划页面添加一些任务吧！</p>
                <button
                  onClick={() => window.location.href = '/planning'}
                  className="bg-primary-600 hover:bg-primary-700 text-white py-2 px-6 rounded-lg font-medium transition-colors duration-200"
                >
                  📅 开始规划
                </button>
              </div>
            ) : (
              <div className="space-y-6">
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
                          showActions={false}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Skipped Tasks */}
                {getTasksByStatus('skipped').length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                      <span className="mr-2">⏭️</span>
                      跳过的任务
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {getTasksByStatus('skipped').map((dailyTask) => (
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TodayTasks;