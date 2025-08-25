import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Task, DailyTask } from '../types';
import { detectNetworkAndGetApiServiceSync } from '../services/compatibleApi';
import TopNavigation from '../components/TopNavigation';
// import TaskCard from '../components/TaskCard';
import TaskTimeline from '../components/TaskTimeline';
import TaskCreationForm from '../components/TaskCreationForm';

const TaskPlanning: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  // const [selectedTasks, setSelectedTasks] = useState<Task[]>([]);
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(true);
  // const [error, setError] = useState<string>('');
  // const [planningTask, setPlanningTask] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  // const [recommendedTasks, setRecommendedTasks] = useState<any[]>([]);
  // const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeView, setActiveView] = useState<'schedule' | 'tasks'>('schedule');

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
      const apiService = detectNetworkAndGetApiServiceSync();
      const response = await apiService.getTasks();
      setTasks((response as any).data.tasks);
    } catch (error: any) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDailyTasks = async () => {
    try {
      const apiService = detectNetworkAndGetApiServiceSync();
      const response = await apiService.getDailyTasks({ date: selectedDate });
      setDailyTasks((response as any).data.dailyTasks);
    } catch (error: any) {
      console.error('Error loading daily tasks:', error);
      console.error('Failed to load daily tasks:', error);
    }
  };

  // Removed unused functions for now

  const filteredTasks = activeCategory === 'all' 
    ? tasks 
    : tasks.filter(task => task.category === activeCategory);

  const isTaskPlanned = (task: Task) => {
    return dailyTasks.some(dt => dt.taskId === task.id);
  };

  // Removed unused utility functions

  const handleTaskUpdate = (taskId: string, updates: Partial<DailyTask>) => {
    setDailyTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    ));
  };

  const handleTaskCreated = async (newTask: Task) => {
    // Add the new task to the tasks list
    setTasks(prev => [newTask, ...prev]);
    
    try {
      // Automatically add the new task to today's daily tasks
      const apiService = detectNetworkAndGetApiServiceSync();
      await apiService.createDailyTask({
        taskId: newTask.id,
        date: selectedDate,
        // Don't set plannedTime so it appears as unscheduled
      });
      
      // Refresh daily tasks to show the new task immediately
      await loadDailyTasks();
      
      // Show success message
      alert(`任务"${newTask.title}"创建成功并已添加到今日任务列表！`);
    } catch (error) {
      console.error('Error adding task to daily tasks:', error);
      // Show success message for task creation even if daily task creation failed
      alert(`任务"${newTask.title}"创建成功！`);
    }
    
    // Close the form
    setShowCreateForm(false);
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
    <div>
      {/* Top Navigation - 仅在移动端显示 */}
      <div className="md:hidden">
        <TopNavigation />
      </div>
      
      {/* Desktop Top Navigation - 仅在桌面端显示 */}
      <div className="hidden md:block">
        <TopNavigation />
      </div>
      
      <div className="min-h-screen bg-gradient-to-br from-primary-100 to-secondary-100">
      {/* Compact Header for mobile */}
      <div className="bg-white shadow-sm">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Title and Icon */}
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-primary-500 rounded-full flex items-center justify-center">
                <span className="text-white text-lg sm:text-xl font-bold">📅</span>
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900">任务规划</h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">选择今日要完成的任务</p>
              </div>
            </div>
            
            {/* Right: User Info - Compact */}
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user.displayName}</p>
              <p className="text-xs text-gray-500">{user.points} 积分</p>
            </div>
          </div>
          
          {/* Date Selection - Below header */}
          <div className="mt-4">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-700">📅 日期:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* View Toggle Tabs - Mobile */}
        <div className="sm:hidden mb-4">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveView('schedule')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                activeView === 'schedule'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              📅 今日安排
            </button>
            <button
              onClick={() => setActiveView('tasks')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                activeView === 'tasks'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              🎯 任务清单
            </button>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden sm:grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Task Selection */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="bg-white rounded-xl shadow-sm p-6 lg:sticky lg:top-6">
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
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-md font-semibold text-gray-900">🎯 可用任务</h4>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="flex items-center space-x-1 px-2 py-1 bg-primary-600 text-white text-xs rounded-md hover:bg-primary-700 transition-colors duration-200"
                    title="创建新任务"
                  >
                    <span>➕</span>
                    <span>新建</span>
                  </button>
                </div>
                <div className="space-y-2 max-h-64 lg:max-h-80 overflow-y-auto">
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
                            console.log('🚀 Starting drag for task:', task.title, task);
                            e.dataTransfer.setData('application/json', JSON.stringify(task));
                            e.dataTransfer.effectAllowed = 'copy';
                            console.log('✅ Drag data set successfully');
                          } else {
                            console.log('❌ Task already planned, preventing drag');
                            e.preventDefault();
                          }
                        }}
                        onDragEnd={(e) => {
                          console.log('🏁 Drag ended for task:', task.title);
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
          <div className="lg:col-span-3 order-1 lg:order-2">
            <TaskTimeline
              date={selectedDate}
              dailyTasks={dailyTasks}
              onTaskUpdate={handleTaskUpdate}
              onRefresh={loadDailyTasks}
            />
          </div>
        </div>

        {/* Mobile Views */}
        <div className="sm:hidden">
          {/* Today's Schedule View */}
          {activeView === 'schedule' && (
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <span className="text-xl mr-2">📅</span>
                    今日安排
                  </h3>
                  <button
                    onClick={() => setActiveView('tasks')}
                    className="text-primary-600 text-sm font-medium"
                  >
                    + 添加任务
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedDate} • {dailyTasks.length} 个任务
                </p>
              </div>
              
              <div className="p-4">
                {dailyTasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-3xl mb-3">📅</div>
                    <h4 className="font-medium text-gray-900 mb-2">还未安排任务</h4>
                    <p className="text-sm text-gray-600 mb-4">点击"任务清单"选择要完成的任务</p>
                    <button
                      onClick={() => setActiveView('tasks')}
                      className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
                    >
                      选择任务
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dailyTasks
                      .sort((a, b) => a.plannedTime?.localeCompare(b.plannedTime || '') || 0)
                      .map((task) => (
                        <div key={task.id} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center space-x-3">
                            <span className="text-lg">
                              {categories.find(c => c.key === task.task?.category)?.emoji || '⭐'}
                            </span>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 text-sm">{task.task?.title || '未知任务'}</h4>
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-xs text-gray-600">
                                  {task.plannedTime ? 
                                    `⏰ ${task.plannedTime}` : 
                                    '⏰ 待安排时间'
                                  }
                                </span>
                                <span className="text-xs text-primary-600 font-medium">
                                  {task.task?.points || 0}分
                                </span>
                              </div>
                            </div>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                              task.status === 'completed' 
                                ? 'bg-green-100 text-green-800' 
                                : task.status === 'in_progress'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {task.status === 'completed' ? '已完成' :
                               task.status === 'in_progress' ? '进行中' : '计划中'}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Task Selection View */}
          {activeView === 'tasks' && (
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <span className="text-xl mr-2">🎯</span>
                    任务清单
                  </h3>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="text-primary-600 text-sm font-medium"
                  >
                    + 新建
                  </button>
                </div>
              </div>

              {/* Category Filter - Horizontal scroll */}
              <div className="px-4 py-3 border-b bg-gray-50">
                <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
                  {categories.map((category) => (
                    <button
                      key={category.key}
                      onClick={() => setActiveCategory(category.key)}
                      className={`flex items-center space-x-1 px-3 py-2 text-sm rounded-full transition-colors duration-200 whitespace-nowrap ${
                        activeCategory === category.key
                          ? 'bg-primary-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span>{category.emoji}</span>
                      <span className="font-medium">{category.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="p-4">
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
                      <p className="text-gray-600">加载中...</p>
                    </div>
                  ) : filteredTasks.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-3xl mb-3">📝</div>
                      <p className="text-sm">该分类下暂无任务</p>
                    </div>
                  ) : (
                    filteredTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`p-3 rounded-lg border-2 transition-colors duration-200 ${
                          isTaskPlanned(task) 
                            ? 'border-gray-200 bg-gray-50 opacity-50' 
                            : 'border-gray-300 bg-white hover:border-primary-400 hover:bg-primary-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <span className="text-lg">
                              {categories.find(c => c.key === task.category)?.emoji || '⭐'}
                            </span>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 text-sm">{task.title}</h4>
                              <div className="flex items-center space-x-3 mt-1">
                                <span className="text-xs text-gray-500">
                                  ⏱️ {task.estimatedTime}分钟
                                </span>
                                <span className="text-xs text-primary-600 font-medium">
                                  💰 {task.points}分
                                </span>
                              </div>
                            </div>
                          </div>
                          {isTaskPlanned(task) ? (
                            <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                              已安排
                            </span>
                          ) : (
                            <button
                              onClick={async () => {
                                try {
                                  const apiService = detectNetworkAndGetApiServiceSync();
                                  await apiService.createDailyTask({
                                    taskId: task.id,
                                    date: selectedDate,
                                    // Don't set plannedTime so it appears as unscheduled
                                  });
                                  await loadDailyTasks();
                                  // Show success message briefly
                                  const successMessage = `✅ "${task.title}" 已添加到今日任务`;
                                  alert(successMessage);
                                } catch (error) {
                                  console.error('Error adding task to daily tasks:', error);
                                  alert(`❌ 添加任务失败：${(error as any)?.message || '未知错误'}`);
                                }
                              }}
                              className="bg-primary-600 text-white px-3 py-1 rounded-full text-xs font-medium hover:bg-primary-700 transition-colors"
                            >
                              添加
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Task Creation Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="max-w-2xl w-full min-h-0">
            <TaskCreationForm
              onClose={() => setShowCreateForm(false)}
              onTaskCreated={handleTaskCreated}
              className="max-h-screen overflow-y-auto"
            />
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default TaskPlanning;