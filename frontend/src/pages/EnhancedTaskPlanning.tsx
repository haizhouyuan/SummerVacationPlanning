import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Task, DailyTask } from '../types';
import { apiService } from '../services/api';
import TaskLibrary from '../components/TaskLibrary';

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
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [planningTask, setPlanningTask] = useState(false);
  const [showAdvancedPlanning, setShowAdvancedPlanning] = useState(false);
  const [planningMode, setPlanningMode] = useState<'simple' | 'advanced'>('simple');
  
  // Advanced planning state
  const [taskScheduleDetails, setTaskScheduleDetails] = useState<{
    [taskId: string]: {
      plannedTime?: string;
      plannedEndTime?: string;
      reminderTime?: string;
      priority: 'low' | 'medium' | 'high';
      timePreference?: 'morning' | 'afternoon' | 'evening' | 'flexible';
      planningNotes?: string;
    };
  }>({});
  
  const [conflicts, setConflicts] = useState<SchedulingConflict | null>(null);

  const priorityOptions = [
    { value: 'low', label: '低优先级', color: 'bg-gray-100 text-gray-700', emoji: '⬇️' },
    { value: 'medium', label: '中优先级', color: 'bg-yellow-100 text-yellow-700', emoji: '➡️' },
    { value: 'high', label: '高优先级', color: 'bg-red-100 text-red-700', emoji: '⬆️' },
  ];

  const timePreferenceOptions = [
    { value: 'morning', label: '上午', emoji: '🌅' },
    { value: 'afternoon', label: '下午', emoji: '☀️' },
    { value: 'evening', label: '晚上', emoji: '🌙' },
    { value: 'flexible', label: '灵活', emoji: '🔄' },
  ];

  useEffect(() => {
    loadDailyTasks();
    loadWeeklySchedule();
  }, [selectedDate]);

  const loadDailyTasks = async () => {
    try {
      const response = await apiService.getDailyTasks({ date: selectedDate });
      setDailyTasks((response as any).data.dailyTasks);
    } catch (error: any) {
      console.error('Error loading daily tasks:', error);
      setError(error.message || '加载每日任务失败，请重试');
    }
  };

  const loadWeeklySchedule = async () => {
    try {
      const response = await fetch('/api/daily-tasks/weekly-schedule?' + new URLSearchParams({
        weekStart: getWeekStart(selectedDate),
      }), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setWeeklySchedule(data.data.weeklySchedule);
      }
    } catch (error) {
      console.error('Error loading weekly schedule:', error);
    }
  };

  const getWeekStart = (date: string) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().split('T')[0];
  };

  const handleTaskSelect = (task: Task) => {
    setSelectedTasks(prev => {
      const isSelected = prev.find(t => t.id === task.id);
      if (isSelected) {
        // Remove task and its schedule details
        const newDetails = { ...taskScheduleDetails };
        delete newDetails[task.id];
        setTaskScheduleDetails(newDetails);
        return prev.filter(t => t.id !== task.id);
      } else {
        // Add task with default schedule details
        setTaskScheduleDetails(prev => ({
          ...prev,
          [task.id]: {
            priority: 'medium',
            timePreference: 'flexible',
          },
        }));
        return [...prev, task];
      }
    });
  };

  const handleScheduleDetailChange = (taskId: string, field: string, value: any) => {
    setTaskScheduleDetails(prev => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        [field]: value,
      },
    }));

    // Check for conflicts if time-related fields are changed
    if (field === 'plannedTime' && value) {
      checkSchedulingConflicts(taskId, value);
    }
  };

  const checkSchedulingConflicts = async (taskId: string, plannedTime: string) => {
    try {
      const task = selectedTasks.find(t => t.id === taskId);
      if (!task) return;

      const response = await fetch('/api/daily-tasks/check-conflicts?' + new URLSearchParams({
        date: selectedDate,
        plannedTime,
        estimatedTime: task.estimatedTime.toString(),
        excludeTaskId: taskId,
      }), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setConflicts(data.data);
      }
    } catch (error) {
      console.error('Error checking conflicts:', error);
    }
  };

  const handlePlanTasks = async () => {
    if (selectedTasks.length === 0) return;

    try {
      setPlanningTask(true);
      const count = selectedTasks.length;
      
      for (const task of selectedTasks) {
        // Check if task is already planned for this date
        const existingTask = dailyTasks.find(dt => dt.taskId === task.id);
        if (!existingTask) {
          const scheduleDetails = taskScheduleDetails[task.id] || {};
          
          await apiService.createDailyTask({
            taskId: task.id,
            date: selectedDate,
            ...scheduleDetails,
            notes: `计划于 ${selectedDate} 完成`,
          });
        }
      }

      setSelectedTasks([]);
      setTaskScheduleDetails({});
      setConflicts(null);
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

  const isTaskPlanned = (task: Task) => {
    return dailyTasks.some(dt => dt.taskId === task.id);
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
                <h1 className="text-2xl font-bold text-gray-900">智能任务规划</h1>
                <p className="text-sm text-gray-600">高效管理你的每日任务安排</p>
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

              {/* Planning Mode Toggle */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🛠️ 规划模式</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setPlanningMode('simple')}
                    className={`w-full p-3 rounded-lg text-left transition-colors duration-200 ${
                      planningMode === 'simple'
                        ? 'bg-primary-100 border-2 border-primary-300'
                        : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center">
                      <span className="text-xl mr-3">⚡</span>
                      <div>
                        <div className="font-medium">快速规划</div>
                        <div className="text-sm text-gray-600">简单选择任务</div>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setPlanningMode('advanced')}
                    className={`w-full p-3 rounded-lg text-left transition-colors duration-200 ${
                      planningMode === 'advanced'
                        ? 'bg-primary-100 border-2 border-primary-300'
                        : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center">
                      <span className="text-xl mr-3">🎯</span>
                      <div>
                        <div className="font-medium">精确规划</div>
                        <div className="text-sm text-gray-600">设置时间和优先级</div>
                      </div>
                    </div>
                  </button>
                </div>
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
                          {planningMode === 'advanced' && taskScheduleDetails[task.id]?.plannedTime && (
                            <span className="text-xs text-gray-500">
                              {taskScheduleDetails[task.id].plannedTime}
                            </span>
                          )}
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

                  {/* Conflict Warning */}
                  {conflicts?.hasConflicts && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start">
                        <span className="text-red-500 mr-2">⚠️</span>
                        <div>
                          <div className="text-sm font-medium text-red-700">时间冲突</div>
                          <div className="text-xs text-red-600 mt-1">
                            {conflicts.conflict?.suggestions[0]?.details}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handlePlanTasks}
                    disabled={planningTask || (conflicts?.hasConflicts && planningMode === 'advanced')}
                    className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200"
                  >
                    {planningTask ? '规划中...' : '确认规划'}
                  </button>
                </div>
              )}

              {/* Today's Tasks */}
              {dailyTasks.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">📋 今日任务</h4>
                  <div className="space-y-2">
                    {dailyTasks.map((dailyTask) => (
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

          {/* Main Content - Task Library + Advanced Planning */}
          <div className="lg:col-span-3">
            {/* Advanced Planning Details */}
            {planningMode === 'advanced' && selectedTasks.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 任务详细规划</h3>
                <div className="space-y-6">
                  {selectedTasks.map((task) => (
                    <div key={task.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-medium text-gray-900">{task.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          <div>{task.points} 积分</div>
                          <div>{task.estimatedTime} 分钟</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Planned Time */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            开始时间
                          </label>
                          <input
                            type="time"
                            value={taskScheduleDetails[task.id]?.plannedTime || ''}
                            onChange={(e) => handleScheduleDetailChange(task.id, 'plannedTime', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>

                        {/* Reminder Time */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            提醒时间
                          </label>
                          <input
                            type="time"
                            value={taskScheduleDetails[task.id]?.reminderTime || ''}
                            onChange={(e) => handleScheduleDetailChange(task.id, 'reminderTime', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>

                        {/* Priority */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            优先级
                          </label>
                          <div className="flex space-x-1">
                            {priorityOptions.map((option) => (
                              <button
                                key={option.value}
                                onClick={() => handleScheduleDetailChange(task.id, 'priority', option.value)}
                                className={`flex-1 px-2 py-2 rounded-lg text-xs font-medium transition-colors duration-200 ${
                                  taskScheduleDetails[task.id]?.priority === option.value
                                    ? 'bg-primary-600 text-white'
                                    : option.color
                                }`}
                              >
                                <span className="mr-1">{option.emoji}</span>
                                {option.label.replace('优先级', '')}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Time Preference */}
                        <div className="md:col-span-2 lg:col-span-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            时间偏好
                          </label>
                          <div className="flex space-x-2">
                            {timePreferenceOptions.map((option) => (
                              <button
                                key={option.value}
                                onClick={() => handleScheduleDetailChange(task.id, 'timePreference', option.value)}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                                  taskScheduleDetails[task.id]?.timePreference === option.value
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                <span className="mr-1">{option.emoji}</span>
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Planning Notes */}
                        <div className="md:col-span-2 lg:col-span-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            规划备注
                          </label>
                          <textarea
                            value={taskScheduleDetails[task.id]?.planningNotes || ''}
                            onChange={(e) => handleScheduleDetailChange(task.id, 'planningNotes', e.target.value)}
                            placeholder="为这个任务添加一些规划备注..."
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Task Library */}
            <TaskLibrary
              onTaskSelect={handleTaskSelect}
              selectedTasks={selectedTasks}
              showSelectionMode={true}
              maxSelections={10}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedTaskPlanning;