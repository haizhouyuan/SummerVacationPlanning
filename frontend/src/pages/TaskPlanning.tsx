import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Task, DailyTask } from '../types';
import { apiService } from '../services/api';
import TaskCard from '../components/TaskCard';
import TaskTimeline from '../components/TaskTimeline';

const TaskPlanning: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTasks, setSelectedTasks] = useState<Task[]>([]);
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [planningTask, setPlanningTask] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [recommendedTasks, setRecommendedTasks] = useState<any[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  const categories = [
    { key: 'all', label: '全部', emoji: '📋' },
    { key: 'reading', label: '语文阅读', emoji: '📚' },
    { key: 'learning', label: '学习', emoji: '🧠' },
    { key: 'exercise', label: '运动', emoji: '🏃‍♂️' },
    { key: 'creativity', label: '创意', emoji: '🎨' },
    { key: 'other', label: '其他', emoji: '⭐' },
  ];

  useEffect(() => {
    loadTasks();
    loadDailyTasks();
    loadRecommendations();
  }, [selectedDate]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiService.getTasks();
      setTasks((response as any).data.tasks);
    } catch (error: any) {
      console.error('Error loading tasks:', error);
      setError(error.message || '加载任务列表失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const loadDailyTasks = async () => {
    try {
      const response = await apiService.getDailyTasks({ date: selectedDate });
      setDailyTasks((response as any).data.dailyTasks);
    } catch (error: any) {
      console.error('Error loading daily tasks:', error);
      setError(error.message || '加载每日任务失败，请重试');
    }
  };

  const loadRecommendations = async () => {
    try {
      setLoadingRecommendations(true);
      const response = await apiService.getRecommendedTasks({ limit: 3 });
      setRecommendedTasks((response as any).data?.recommendations || []);
    } catch (error: any) {
      console.error('Error loading recommendations:', error);
      // Don't show error for recommendations as it's not critical
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const handleTaskSelect = (task: Task) => {
    setSelectedTasks(prev => {
      const isSelected = prev.find(t => t.id === task.id);
      if (isSelected) {
        return prev.filter(t => t.id !== task.id);
      } else {
        return [...prev, task];
      }
    });
  };

  const handlePlanTasks = async () => {
    if (selectedTasks.length === 0) return;

    try {
      setPlanningTask(true);
      
      // Save the count before clearing the array
      const count = selectedTasks.length;
      
      for (const task of selectedTasks) {
        // Check if task is already planned for this date
        const existingTask = dailyTasks.find(dt => dt.taskId === task.id);
        if (!existingTask) {
          await apiService.createDailyTask({
            taskId: task.id,
            date: selectedDate,
            notes: `计划于 ${selectedDate} 完成`,
          });
        }
      }

      setSelectedTasks([]);
      await loadDailyTasks();
      
      // Show success message with correct count
      alert(`成功规划了 ${count} 个任务！`);
    } catch (error) {
      console.error('Error planning tasks:', error);
      alert('规划任务时出现错误，请重试');
    } finally {
      setPlanningTask(false);
    }
  };

  const filteredTasks = activeCategory === 'all' 
    ? tasks 
    : tasks.filter(task => task.category === activeCategory);

  const isTaskPlanned = (task: Task) => {
    return dailyTasks.some(dt => dt.taskId === task.id);
  };

  const getTotalPoints = () => {
    return selectedTasks.reduce((sum, task) => sum + task.points, 0);
  };

  const getTotalTime = () => {
    return selectedTasks.reduce((sum, task) => sum + task.estimatedTime, 0);
  };

  const handleTaskUpdate = (taskId: string, updates: Partial<DailyTask>) => {
    setDailyTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    ));
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
                <span className="text-white text-xl font-bold">📅</span>
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">任务规划</h1>
                <p className="text-sm text-gray-600">选择今日要完成的任务</p>
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
          {/* Left Sidebar - Task Selection */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📅 日期选择</h3>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                min={new Date().toISOString().split('T')[0]}
              />

              {/* Category Filter */}
              <div className="mt-6">
                <h4 className="text-md font-semibold text-gray-900 mb-3">📋 任务分类</h4>
                <div className="flex flex-wrap gap-1">
                  {categories.map((category) => (
                    <button
                      key={category.key}
                      onClick={() => setActiveCategory(category.key)}
                      className={`flex items-center space-x-1 px-2 py-1 text-xs rounded-md transition-colors duration-200 ${
                        activeCategory === category.key
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <span>{category.emoji}</span>
                      <span className="font-medium">{category.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Available Tasks */}
              <div className="mt-6">
                <h4 className="text-md font-semibold text-gray-900 mb-3">🎯 可用任务</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {loading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
                      <p className="mt-2 text-xs text-gray-600">加载中...</p>
                    </div>
                  ) : filteredTasks.length === 0 ? (
                    <div className="text-center py-4">
                      <div className="text-2xl mb-2">📝</div>
                      <p className="text-xs text-gray-600">该分类下暂无任务</p>
                    </div>
                  ) : (
                    filteredTasks.map((task) => (
                      <div
                        key={task.id}
                        draggable={!isTaskPlanned(task)}
                        onDragStart={(e) => {
                          if (!isTaskPlanned(task)) {
                            e.dataTransfer.setData('application/json', JSON.stringify(task));
                            e.dataTransfer.effectAllowed = 'copy';
                          } else {
                            e.preventDefault();
                          }
                        }}
                        className={`p-3 rounded-lg border-2 border-dashed transition-colors duration-200 ${
                          isTaskPlanned(task) 
                            ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed' 
                            : 'border-gray-300 bg-white cursor-move hover:border-primary-400 hover:bg-primary-50'
                        }`}
                      >
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-lg">
                            {categories.find(c => c.key === task.category)?.emoji || '⭐'}
                          </span>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-medium text-gray-900 truncate text-sm">
                              {task.title}
                            </h5>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs text-gray-500">
                                {task.estimatedTime}分钟
                              </span>
                              <span className="text-xs font-medium text-primary-600">
                                {task.points}分
                              </span>
                            </div>
                          </div>
                        </div>
                        {isTaskPlanned(task) && (
                          <div className="text-xs text-gray-500 text-center">已安排</div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Instructions */}
              <div className="mt-6 p-3 bg-blue-50 rounded-lg">
                <div className="text-xs text-blue-800">
                  <p className="font-medium mb-1">💡 使用提示：</p>
                  <p>• 拖拽任务到时间轴安排时间</p>
                  <p>• 点击时间槽快速创建新任务</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Timeline */}
          <div className="lg:col-span-3">
            <TaskTimeline
              date={selectedDate}
              dailyTasks={dailyTasks}
              onTaskUpdate={handleTaskUpdate}
              onRefresh={loadDailyTasks}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskPlanning;