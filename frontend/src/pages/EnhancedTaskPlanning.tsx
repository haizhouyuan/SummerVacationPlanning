import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Task, DailyTask } from '../types';
import { detectNetworkAndGetApiServiceSync } from '../services/compatibleApi';
import TaskLibrary from '../components/TaskLibrary';
import { getCurrentWeek, formatDate } from '../utils/statisticsService';
import { LoadingSpinner, ErrorDisplay, useDataState, withRetry } from '../utils/errorHandling.jsx';

interface WeeklySchedule {
  userId: string;
  weekStart: string;
  tasks: DailyTask[];
  totalPlannedTasks: number;
  totalCompletedTasks: number;
  totalPointsEarned: number;
  completionRate: number;
}

interface SchedulingConflict {
  hasConflicts: boolean;
  conflict?: {
    date: string;
    timeSlot: string;
    conflictingTasks: {
      taskId: string;
      title: string;
      plannedTime: string;
      estimatedTime: number;
    }[];
    suggestions: {
      action: string;
      details: string;
    }[];
  };
}

const EnhancedTaskPlanning: React.FC = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTasks, setSelectedTasks] = useState<Task[]>([]);
  const [planningTask, setPlanningTask] = useState(false);
  // Removed planning mode toggle - using single simplified planning
  
  // Use data state management hooks
  const dailyTasksState = useDataState<DailyTask[]>([]);
  const weeklyScheduleState = useDataState<WeeklySchedule | null>(null);
  
  // Simplified planning - removed advanced scheduling features

  useEffect(() => {
    if (user) {
      loadDailyTasks();
      loadWeeklySchedule();
    }
  }, [user, selectedDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadDailyTasks = async () => {
    dailyTasksState.setLoading({ 
      isLoading: true, 
      loadingMessage: '正在加载每日任务...' 
    });

    try {
      const result = await withRetry(
        async () => {
          const apiService = detectNetworkAndGetApiServiceSync();
          const response = await apiService.getDailyTasks({ date: selectedDate }) as any;
          
          if (!response.success) {
            throw new Error(response.error || '加载每日任务失败');
          }
          
          return response.data.dailyTasks;
        },
        {
          maxRetries: 2,
          baseDelay: 1000
        }
      );

      dailyTasksState.setData(result);
    } catch (error: any) {
      console.error('Error loading daily tasks:', error);
      dailyTasksState.setError(error, '每日任务加载', loadDailyTasks);
    }
  };

  const loadWeeklySchedule = async () => {
    weeklyScheduleState.setLoading({ 
      isLoading: true, 
      loadingMessage: '正在加载周时间表...' 
    });

    try {
      const result = await withRetry(
        async () => {
          const apiService = detectNetworkAndGetApiServiceSync();
          // Try to get weekly stats through the compatible API
          const response = await apiService.getWeeklyStats({ 
            weekStart: getWeekStart(selectedDate) 
          }) as any;
          
          if (response.success) {
            return response.data;
          } else {
            // Fallback to a mock schedule
            return {
              userId: user?.id,
              weekStart: getWeekStart(selectedDate),
              tasks: [],
              totalPlannedTasks: 0,
              totalCompletedTasks: 0,
              totalPointsEarned: 0,
              completionRate: 0
            };
          }
        },
        {
          maxRetries: 1,
          baseDelay: 1000
        }
      );

      weeklyScheduleState.setData(result);
    } catch (error: any) {
      console.error('Error loading weekly schedule:', error);
      // Set default data instead of error for weekly schedule
      weeklyScheduleState.setData({
        userId: user?.id || '',
        weekStart: getWeekStart(selectedDate),
        tasks: [],
        totalPlannedTasks: 0,
        totalCompletedTasks: 0,
        totalPointsEarned: 0,
        completionRate: 0
      });
    }
  };

  const getWeekStart = (date?: string) => {
    // Use unified date calculation from statisticsService
    const referenceDate = date ? new Date(date) : undefined;
    const weekInfo = getCurrentWeek(referenceDate);
    return formatDate(weekInfo.monday);
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

  // Removed advanced scheduling functions for simplified planning

  const handlePlanTasks = async () => {
    if (selectedTasks.length === 0) return;

    try {
      setPlanningTask(true);
      const count = selectedTasks.length;
      
      for (const task of selectedTasks) {
        // Check if task is already planned for this date
        const existingTask = dailyTasks.find((dt: DailyTask) => dt.taskId === task.id);
        if (!existingTask) {
          const apiService = detectNetworkAndGetApiServiceSync();
          await apiService.createDailyTask({
            taskId: task.id,
            date: selectedDate,
            priority: 'medium', // Default priority
            notes: `计划于 ${selectedDate} 完成`,
          });
        }
      }

      setSelectedTasks([]);
      await loadDailyTasks();
      await loadWeeklySchedule();
      
      alert(`成功规划了 ${count} 个任务！`);
    } catch (error) {
      console.error('Error planning tasks:', error);
      alert('规划任务时出现错误，请重试');
    } finally {
      setPlanningTask(false);
    }
  };

  const dailyTasks = dailyTasksState.data || [];
  const weeklySchedule = weeklyScheduleState.data;
  
  const isTaskPlanned = (task: Task) => {
    return dailyTasks.some((dt: DailyTask) => dt.taskId === task.id);
  };

  const getTotalPoints = () => {
    return selectedTasks.reduce((sum, task) => sum + task.points, 0);
  };

  const getTotalTime = () => {
    return selectedTasks.reduce((sum, task) => sum + task.estimatedTime, 0);
  };

  const getWeekDays = () => {
    const days = [];
    const start = new Date(getWeekStart(selectedDate));
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      days.push({
        date: date.toISOString().split('T')[0],
        dayName: date.toLocaleDateString('zh-CN', { weekday: 'short' }),
        dayNumber: date.getDate(),
        isToday: date.toISOString().split('T')[0] === new Date().toISOString().split('T')[0],
        isSelected: date.toISOString().split('T')[0] === selectedDate,
      });
    }
    
    return days;
  };

  if (!user) {
    return null;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-cartoon-dark mb-2 font-fun">🎯 智能任务规划</h1>
        <p className="text-cartoon-gray">高效管理您的每日任务安排，精准时间规划</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Planning Panel */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Week Calendar */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📅 本周视图</h3>
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {getWeekDays().map((day) => (
                    <button
                      key={day.date}
                      onClick={() => setSelectedDate(day.date)}
                      className={`p-2 text-center rounded-lg text-xs font-medium transition-colors duration-200 ${
                        day.isSelected
                          ? 'bg-primary-600 text-white'
                          : day.isToday
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div>{day.dayName}</div>
                      <div className="text-lg">{day.dayNumber}</div>
                    </button>
                  ))}
                </div>
                
                {weeklySchedule && (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>本周任务:</span>
                      <span className="font-semibold">{weeklySchedule.totalPlannedTasks}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>已完成:</span>
                      <span className="font-semibold text-green-600">{weeklySchedule.totalCompletedTasks}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>完成率:</span>
                      <span className="font-semibold text-primary-600">
                        {Math.round(weeklySchedule.completionRate * 100)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>获得积分:</span>
                      <span className="font-semibold text-yellow-600">{weeklySchedule.totalPointsEarned}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Task Planning Actions */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📅 任务规划</h3>
                <p className="text-sm text-gray-600 mb-4">选择任务后点击规划按钮添加到今日计划</p>
              </div>

              {/* Selected Tasks Summary */}
              {selectedTasks.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">✅ 已选任务 ({selectedTasks.length})</h4>
                  
                  <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                    {selectedTasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-2 bg-primary-50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-gray-700 truncate block">{task.title}</span>
                        </div>
                        <button
                          onClick={() => handleTaskSelect(task)}
                          className="text-danger-500 hover:text-danger-700 ml-2 flex-shrink-0"
                        >
                          ❌
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 p-3 bg-gray-50 rounded-lg mb-4">
                    <div className="flex justify-between text-sm">
                      <span>总积分:</span>
                      <span className="font-semibold text-primary-600">{getTotalPoints()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>总时间:</span>
                      <span className="font-semibold text-secondary-600">{getTotalTime()}分钟</span>
                    </div>
                  </div>


                  <button
                    onClick={handlePlanTasks}
                    disabled={planningTask}
                    className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200"
                  >
                    {planningTask ? '规划中...' : '📅 规划任务'}
                  </button>
                </div>
              )}

              {/* Today's Tasks */}
              {dailyTasks.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">📋 今日任务</h4>
                  <div className="space-y-2">
                    {dailyTasks.map((dailyTask: DailyTask) => (
                      <div key={dailyTask.id} className="p-2 bg-success-50 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <span className="text-sm text-gray-700 block truncate">
                              {dailyTask.task?.title}
                            </span>
                            {dailyTask.plannedTime && (
                              <span className="text-xs text-gray-500">
                                {dailyTask.plannedTime}
                              </span>
                            )}
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ml-2 ${
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

          {/* Main Content - Task Library */}
          <div className="lg:col-span-3">
            {/* Task Library */}
            <TaskLibrary
              onTaskSelect={handleTaskSelect}
              selectedTasks={selectedTasks}
              showSelectionMode={true}
              maxSelections={10}
            />

            {/* Selected Tasks Summary */}
            {selectedTasks.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">✅ 已选择的任务</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-600">
                      📅 {new Date(selectedDate).toLocaleDateString('zh-CN', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        weekday: 'long'
                      })}
                    </span>
                    <div className="text-sm text-gray-600">
                      总计: {getTotalTime()} 分钟 | {getTotalPoints()} 积分
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {selectedTasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-white">
                        <div className="flex items-center space-x-3">
                          <div>
                            <div className="font-medium text-gray-900">{task.title}</div>
                            <div className="text-xs text-gray-500">
                              {task.estimatedTime}分钟 • {task.points}积分 • {task.category}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleTaskSelect(task)}
                          className="text-danger-500 hover:text-danger-700 ml-2 flex-shrink-0"
                        >
                          ❌
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedTaskPlanning;