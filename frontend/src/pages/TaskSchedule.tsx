import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { DailyTask } from '../types';
import { apiService } from '../services/api';

const TaskSchedule: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<'timeline' | 'calendar'>('timeline');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
  const [weeklyTasks, setWeeklyTasks] = useState<{ [date: string]: DailyTask[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (view === 'timeline') {
      loadDailyTasks(selectedDate);
    } else {
      loadWeeklyTasks();
    }
  }, [view, selectedDate]);

  const loadDailyTasks = async (date: string) => {
    try {
      setLoading(true);
      setError('');
      const response: any = await apiService.getDailyTasks({ date });
      if (response.success && response.data) {
        setDailyTasks(response.data.dailyTasks || []);
      } else {
        setError(response.error || '加载当日任务失败');
      }
    } catch (error: any) {
      console.error('Error loading daily tasks:', error);
      setError(error.message || '加载任务失败');
    } finally {
      setLoading(false);
    }
  };

  const loadWeeklyTasks = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get the start of the week (Monday)
      const date = new Date(selectedDate);
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
      const monday = new Date(date.setDate(diff));
      
      const weekStart = monday.toISOString().split('T')[0];
      
      const response: any = await apiService.getWeeklySchedule(weekStart);
      if (response.success && response.data) {
        // Group tasks by date
        const tasksByDate: { [date: string]: DailyTask[] } = {};
        response.data.tasks.forEach((task: DailyTask) => {
          if (!tasksByDate[task.date]) {
            tasksByDate[task.date] = [];
          }
          tasksByDate[task.date].push(task);
        });
        setWeeklyTasks(tasksByDate);
      } else {
        setError(response.error || '加载周计划失败');
      }
    } catch (error: any) {
      console.error('Error loading weekly tasks:', error);
      setError(error.message || '加载周计划失败');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentTimePosition = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    const percentage = (totalMinutes / (24 * 60)) * 100;
    return percentage;
  };

  const getTimeFromString = (timeString: string): number => {
    if (!timeString) return 0;
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const formatTime = (timeString: string): string => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'skipped':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high':
        return 'border-l-4 border-l-red-500';
      case 'medium':
        return 'border-l-4 border-l-yellow-500';
      case 'low':
        return 'border-l-4 border-l-green-500';
      default:
        return 'border-l-4 border-l-gray-300';
    }
  };

  const getWeekDates = () => {
    const date = new Date(selectedDate);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(monday);
      currentDate.setDate(monday.getDate() + i);
      dates.push(currentDate.toISOString().split('T')[0]);
    }
    return dates;
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Compact Header for mobile */}
      <div className="bg-white shadow-sm">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Title and Icon */}
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-indigo-500 rounded-full flex items-center justify-center">
                <span className="text-white text-lg sm:text-xl font-bold">📅</span>
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900">任务日程</h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">查看您的任务时间安排和进度</p>
              </div>
            </div>
            
            {/* Right: User Info and Logout - Compact */}
            {user && (
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user.displayName}</p>
                  <p className="text-xs text-gray-500">{user.points} 积分</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-xs font-medium transition-colors duration-200"
                >
                  退出
                </button>
              </div>
            )}
          </div>
          
          {/* Mobile Controls - Below header */}
          <div className="mt-4 space-y-3">
            {/* Date Selection */}
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-700">📅 日期:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            {/* View Toggle - Mobile */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setView('timeline')}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                  view === 'timeline'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                📊 时间轴
              </button>
              <button
                onClick={() => setView('calendar')}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                  view === 'calendar'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                📆 周视图
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Header - Hidden on mobile */}
      <div className="hidden sm:block bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">📅 任务日程</h1>
                <p className="mt-1 text-sm text-gray-600">查看您的任务时间安排和进度</p>
              </div>
              
              <div className="mt-4 sm:mt-0 flex items-center space-x-4">
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setView('timeline')}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                      view === 'timeline'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    📊 时间轴
                  </button>
                  <button
                    onClick={() => setView('calendar')}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                      view === 'calendar'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    📆 周视图
                  </button>
                </div>
                
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{user?.displayName}</p>
                    <p className="text-xs text-gray-500">积分: {user?.points || 0}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                  >
                    退出登录
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:max-w-7xl sm:mx-auto sm:px-6 lg:px-8 sm:py-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-gray-600 text-sm">加载中...</p>
          </div>
        ) : view === 'timeline' ? (
          /* Timeline View */
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {new Date(selectedDate).toLocaleDateString('zh-CN', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                共 {dailyTasks.length} 个任务
                {dailyTasks.filter(t => t.status === 'completed').length > 0 && 
                  ` • ${dailyTasks.filter(t => t.status === 'completed').length} 个已完成`}
              </p>
            </div>

            <div className="relative">
              {/* Current Time Indicator */}
              {selectedDate === new Date().toISOString().split('T')[0] && (
                <div 
                  className="absolute left-0 right-0 h-0.5 bg-red-500 z-10"
                  style={{ top: `${getCurrentTimePosition()}%` }}
                >
                  <div className="absolute left-4 -top-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                    现在 {new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div className="relative min-h-[400px] sm:min-h-[600px]">
                {/* Hour markers */}
                {Array.from({ length: 24 }, (_, i) => (
                  <div 
                    key={i}
                    className="absolute left-0 right-0 border-t border-gray-100"
                    style={{ top: `${(i / 24) * 100}%` }}
                  >
                    <span className="absolute left-2 sm:left-4 -top-2 text-xs text-gray-500 bg-white px-1">
                      {i.toString().padStart(2, '0')}:00
                    </span>
                  </div>
                ))}

                {/* Tasks */}
                <div className="pl-12 sm:pl-16 pr-4 sm:pr-6 py-4">
                  {dailyTasks.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-4xl sm:text-6xl mb-3">📋</div>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">今日暂无安排</h3>
                      <p className="text-sm text-gray-600">前往任务规划页面添加今日任务</p>
                    </div>
                  ) : (
                    dailyTasks
                      .sort((a, b) => {
                        // Sort by planned time, then by creation time
                        if (a.plannedTime && b.plannedTime) {
                          return getTimeFromString(a.plannedTime) - getTimeFromString(b.plannedTime);
                        }
                        if (a.plannedTime) return -1;
                        if (b.plannedTime) return 1;
                        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                      })
                      .map((task, index) => {
                        const hasTime = task.plannedTime;
                        const topPosition = hasTime 
                          ? (getTimeFromString(task.plannedTime!) / (24 * 60)) * 100
                          : 90 + (index * 5); // Stack unscheduled tasks at bottom

                        return (
                          <div
                            key={task.id}
                            className={`absolute left-0 right-0 mx-2 sm:mx-4 p-3 sm:p-4 rounded-lg shadow-sm border ${getStatusColor(task.status)} ${getPriorityColor(task.priority || 'medium')}`}
                            style={{ 
                              top: `${topPosition}%`,
                              minHeight: '50px',
                              zIndex: hasTime ? 5 : 1
                            }}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 text-xs sm:text-sm truncate">
                                  {task.task?.title || '未知任务'}
                                </h4>
                                <div className="flex items-center space-x-2 sm:space-x-3 mt-1 text-xs text-gray-600">
                                  {task.plannedTime && (
                                    <span className="flex items-center">
                                      ⏰ {formatTime(task.plannedTime)}
                                      {task.plannedEndTime && ` - ${formatTime(task.plannedEndTime)}`}
                                    </span>
                                  )}
                                  <span>{task.task?.points || 0}分</span>
                                  <span className="hidden sm:inline">{task.task?.estimatedTime || 0}分钟</span>
                                  {task.priority && task.priority !== 'medium' && (
                                    <span className={`px-1 sm:px-2 py-1 rounded-full text-xs hidden sm:inline-block ${
                                      task.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                    }`}>
                                      {task.priority === 'high' ? '高' : '低'}
                                    </span>
                                  )}
                                </div>
                                {task.planningNotes && (
                                  <p className="text-xs text-gray-600 mt-1 sm:mt-2 truncate sm:whitespace-normal">{task.planningNotes}</p>
                                )}
                              </div>
                              
                              <div className="flex items-center ml-2 sm:ml-4">
                                <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                                  task.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                  task.status === 'skipped' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {task.status === 'completed' ? '✅' :
                                   task.status === 'in_progress' ? '⏳' :
                                   task.status === 'skipped' ? '⏭️' : '📋'}
                                  <span className="hidden sm:inline ml-1">
                                    {task.status === 'completed' ? '已完成' :
                                     task.status === 'in_progress' ? '进行中' :
                                     task.status === 'skipped' ? '已跳过' : '计划中'}
                                  </span>
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Calendar/Weekly View */
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                周视图 - {new Date(getWeekDates()[0]).toLocaleDateString('zh-CN', { month: 'long' })}
              </h2>
            </div>

            <div className="grid grid-cols-7 gap-0 border-b border-gray-200">
              {['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map((day, index) => (
                <div key={index} className="p-2 sm:p-4 text-center border-r border-gray-200 last:border-r-0">
                  <div className="text-xs sm:text-sm font-medium text-gray-900">{day}</div>
                  <div className="text-sm sm:text-lg font-bold text-gray-700 mt-1">
                    {new Date(getWeekDates()[index]).getDate()}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-0 min-h-[300px] sm:min-h-[400px]">
              {getWeekDates().map((date, index) => {
                const dayTasks = weeklyTasks[date] || [];
                const isToday = date === new Date().toISOString().split('T')[0];
                
                return (
                  <div 
                    key={date} 
                    className={`border-r border-gray-200 last:border-r-0 p-1 sm:p-2 ${isToday ? 'bg-blue-50' : ''}`}
                  >
                    <div className="space-y-1">
                      {dayTasks.length === 0 ? (
                        <div className="text-xs text-gray-400 text-center py-2 sm:py-4">无任务</div>
                      ) : (
                        dayTasks.slice(0, 2).map((task) => (
                          <div
                            key={task.id}
                            className={`p-1 sm:p-2 rounded text-xs border ${getStatusColor(task.status)}`}
                          >
                            <div className="font-medium truncate text-xs">
                              {task.task?.title || '未知任务'}
                            </div>
                            {task.plannedTime && (
                              <div className="text-xs opacity-75 hidden sm:block">
                                {formatTime(task.plannedTime)}
                              </div>
                            )}
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs">{task.task?.points || 0}分</span>
                              <span className="text-xs">
                                {task.status === 'completed' ? '✅' :
                                 task.status === 'in_progress' ? '⏳' :
                                 task.status === 'skipped' ? '⏭️' : '📋'}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                      {dayTasks.length > 2 && (
                        <div className="text-xs text-gray-500 text-center py-1">
                          +{dayTasks.length - 2}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskSchedule;