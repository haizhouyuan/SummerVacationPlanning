import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Task, DailyTask } from '../types';
import { apiService } from '../services/api';
import TaskCard from '../components/TaskCard';

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
          {/* Sidebar - Planning Info */}
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

              {selectedTasks.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">✅ 已选任务</h4>
                  <div className="space-y-2">
                    {selectedTasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-2 bg-primary-50 rounded-lg">
                        <span className="text-sm text-gray-700 truncate">{task.title}</span>
                        <button
                          onClick={() => handleTaskSelect(task)}
                          className="text-danger-500 hover:text-danger-700 ml-2"
                        >
                          ❌
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span>总积分:</span>
                      <span className="font-semibold text-primary-600">{getTotalPoints()}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span>总时间:</span>
                      <span className="font-semibold text-secondary-600">{getTotalTime()}分钟</span>
                    </div>
                  </div>

                  <button
                    onClick={handlePlanTasks}
                    disabled={planningTask}
                    className="w-full mt-4 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200"
                  >
                    {planningTask ? '规划中...' : '确认规划'}
                  </button>
                </div>
              )}

              {/* Today's planned tasks */}
              {dailyTasks.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">📋 今日计划</h4>
                  <div className="space-y-2">
                    {dailyTasks.map((dailyTask) => (
                      <div key={dailyTask.id} className="p-2 bg-success-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">{dailyTask.task?.title}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            dailyTask.status === 'completed' ? 'bg-success-100 text-success-700' :
                            dailyTask.status === 'in_progress' ? 'bg-secondary-100 text-secondary-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {dailyTask.status === 'completed' ? '已完成' :
                             dailyTask.status === 'in_progress' ? '进行中' : '计划中'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content - Task Selection */}
          <div className="lg:col-span-3">
            {/* Category Filter */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category.key}
                    onClick={() => setActiveCategory(category.key)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
                      activeCategory === category.key
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span>{category.emoji}</span>
                    <span className="text-sm font-medium">{category.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Task Grid */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">加载任务中...</p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">暂无任务</h3>
                <p className="text-gray-600">该分类下暂时没有可用的任务</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onSelect={handleTaskSelect}
                    isSelected={selectedTasks.some(t => t.id === task.id) || isTaskPlanned(task)}
                    showActions={false}
                    className={isTaskPlanned(task) ? 'opacity-50 pointer-events-none' : ''}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskPlanning;