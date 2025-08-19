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
                        <div className="flex-1">
                          <span className="text-sm text-gray-700 truncate">{task.title}</span>
                          <div className="text-xs text-gray-500">
                            {task.points}分 • {task.estimatedTime}分钟
                          </div>
                        </div>
                        <button
                          onClick={() => handleTaskSelect(task)}
                          className="text-red-500 hover:text-red-700 ml-2 text-sm"
                        >
                          移除
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
                    {planningTask ? '规划中...' : `确认规划 (${selectedTasks.length}个任务)`}
                  </button>
                </div>
              )}

              {/* Today's planned tasks */}
              {dailyTasks.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">📋 今日计划 ({dailyTasks.length})</h4>
                  <div className="space-y-2">
                    {dailyTasks.map((dailyTask) => (
                      <div key={dailyTask.id} className="p-2 bg-success-50 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-700 font-medium">{dailyTask.task?.title}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            dailyTask.status === 'completed' ? 'bg-green-100 text-green-700' :
                            dailyTask.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {dailyTask.status === 'completed' ? '✅已完成' :
                             dailyTask.status === 'in_progress' ? '⏳进行中' : '📋计划中'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {dailyTask.task?.points}分 • {dailyTask.task?.estimatedTime}分钟
                          {dailyTask.approvalStatus && (
                            <span className={`ml-2 px-1 py-0.5 rounded text-xs ${
                              dailyTask.approvalStatus === 'approved' ? 'bg-green-50 text-green-600' :
                              dailyTask.approvalStatus === 'rejected' ? 'bg-red-50 text-red-600' :
                              'bg-yellow-50 text-yellow-600'
                            }`}>
                              {dailyTask.approvalStatus === 'approved' ? '已通过' :
                               dailyTask.approvalStatus === 'rejected' ? '已拒绝' : '待审批'}
                            </span>
                          )}
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

            {/* Intelligent Recommendations */}
            {recommendedTasks.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <div className="flex items-center mb-4">
                  <span className="text-2xl mr-3">🤖</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">智能推荐</h3>
                    <p className="text-sm text-gray-600">基于您的偏好和历史数据精选任务</p>
                  </div>
                </div>
                
                {loadingRecommendations ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    <span className="ml-3 text-gray-600">生成推荐中...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {recommendedTasks.map((recommendation, index) => (
                      <div key={recommendation.task.id} className="border border-primary-200 rounded-lg p-4 bg-gradient-to-br from-primary-50 to-white hover:shadow-md transition-shadow duration-200">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-1">{recommendation.task.title}</h4>
                            <p className="text-sm text-gray-600 mb-2">{recommendation.task.description}</p>
                            <div className="flex items-center space-x-3 text-xs text-gray-500">
                              <span className="flex items-center">
                                <span className="mr-1">⭐</span>
                                {recommendation.task.points}分
                              </span>
                              <span className="flex items-center">
                                <span className="mr-1">⏱️</span>
                                {recommendation.task.estimatedTime}分钟
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                recommendation.task.difficulty === 'easy' ? 'bg-success-100 text-success-700' :
                                recommendation.task.difficulty === 'medium' ? 'bg-secondary-100 text-secondary-700' :
                                'bg-danger-100 text-danger-700'
                              }`}>
                                {recommendation.task.difficulty === 'easy' ? '简单' :
                                 recommendation.task.difficulty === 'medium' ? '中等' : '困难'}
                              </span>
                            </div>
                          </div>
                          <div className="ml-3 text-right">
                            <div className="text-xs font-medium text-primary-600 mb-1">
                              匹配度 {Math.round(recommendation.score * 100)}%
                            </div>
                            <button
                              onClick={() => handleTaskSelect(recommendation.task)}
                              disabled={selectedTasks.some(t => t.id === recommendation.task.id) || isTaskPlanned(recommendation.task)}
                              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors duration-200 ${
                                selectedTasks.some(t => t.id === recommendation.task.id) || isTaskPlanned(recommendation.task)
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-primary-600 text-white hover:bg-primary-700'
                              }`}
                            >
                              {selectedTasks.some(t => t.id === recommendation.task.id) ? '已选择' : 
                               isTaskPlanned(recommendation.task) ? '已规划' : '选择'}
                            </button>
                          </div>
                        </div>
                        
                        <div className="bg-white rounded-lg p-3 border border-gray-100">
                          <div className="flex items-start">
                            <span className="text-sm mr-2">💡</span>
                            <p className="text-xs text-gray-700 leading-relaxed">{recommendation.reason}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

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