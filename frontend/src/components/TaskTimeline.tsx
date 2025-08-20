import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DailyTask } from '../types';
import { detectNetworkAndGetApiServiceSync } from '../services/compatibleApi';
import { LoadingSpinner, ErrorDisplay, useDataState, withRetry } from '../utils/errorHandling';
import Calendar from './Calendar';

interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  time: string;
  endTime?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  category: string;
  points: number;
  priority?: 'low' | 'medium' | 'high';
  type: 'task' | 'milestone' | 'reminder' | 'break';
  task?: DailyTask;
}

interface TaskTimelineProps {
  selectedDate?: string;
  showDatePicker?: boolean;
  compact?: boolean;
  className?: string;
}

const TaskTimeline: React.FC<TaskTimelineProps> = ({
  selectedDate = new Date().toISOString().split('T')[0],
  showDatePicker = true,
  compact = false,
  className = ''
}) => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(selectedDate);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const timelineState = useDataState<TimelineEvent[]>([]);

  useEffect(() => {
    if (user) {
      loadTimelineData();
    }
  }, [user, currentDate, viewMode]);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const loadTimelineData = async () => {
    timelineState.setLoading({
      isLoading: true,
      loadingMessage: '正在加载时间轴数据...'
    });

    try {
      const result = await withRetry(
        async () => {
          const apiService = detectNetworkAndGetApiServiceSync();
          
          if (viewMode === 'day') {
            // Load single day tasks
            const response = await apiService.getDailyTasks({ 
              date: currentDate
            }) as any;
            
            if (!response.success) {
              throw new Error(response.error || '加载时间轴数据失败');
            }
            
            return convertDailyTasksToTimeline(response.data.dailyTasks);
          } else {
            // Load week view
            const weekStart = getWeekStart(currentDate);
            const weekDays = getWeekDays(weekStart);
            
            const weekData = await Promise.all(
              weekDays.map(async (day) => {
                const response = await apiService.getDailyTasks({ 
                  date: day.date
                }) as any;
                
                return {
                  date: day.date,
                  tasks: response.success ? response.data.dailyTasks : []
                };
              })
            );
            
            return convertWeekDataToTimeline(weekData);
          }
        },
        {
          maxRetries: 2,
          baseDelay: 1000,
          onRetry: (attempt, error) => {
            console.warn(`Timeline loading attempt ${attempt} failed:`, error);
            timelineState.setLoading({
              isLoading: true,
              loadingMessage: `重试中... (${attempt}/2)`
            });
          }
        }
      );

      timelineState.setData(result);
    } catch (error: any) {
      console.error('Error loading timeline:', error);
      timelineState.setError(error, '时间轴数据加载', loadTimelineData);
    }
  };

  const convertDailyTasksToTimeline = (dailyTasks: DailyTask[]): TimelineEvent[] => {
    const events: TimelineEvent[] = [];
    
    // Add morning milestone
    events.push({
      id: 'morning-start',
      title: '🌅 新的一天开始',
      time: '06:00',
      status: 'completed',
      category: 'milestone',
      points: 0,
      type: 'milestone'
    });

    // Convert daily tasks to timeline events
    dailyTasks.forEach((dailyTask) => {
      if (dailyTask.task) {
        const startTime = dailyTask.plannedTime || getDefaultTimeForCategory(dailyTask.task.category);
        const endTime = dailyTask.plannedEndTime || addMinutesToTime(startTime, dailyTask.task.estimatedTime);
        
        events.push({
          id: dailyTask.id,
          title: dailyTask.task.title,
          description: dailyTask.task.description,
          time: startTime,
          endTime: endTime,
          status: getTimelineStatus(dailyTask),
          category: dailyTask.task.category,
          points: dailyTask.pointsEarned || dailyTask.task.points,
          priority: dailyTask.priority as any,
          type: 'task',
          task: dailyTask
        });
      }
    });

    // Add study breaks
    const studyTasks = events.filter(e => e.category === 'study' || e.category === 'learning');
    studyTasks.forEach((task, index) => {
      if (index > 0 && task.endTime) {
        const breakTime = addMinutesToTime(task.endTime, 0);
        events.push({
          id: `break-${task.id}`,
          title: '☕ 学习休息',
          time: breakTime,
          endTime: addMinutesToTime(breakTime, 15),
          status: 'pending',
          category: 'break',
          points: 0,
          type: 'break'
        });
      }
    });

    // Add evening milestone
    events.push({
      id: 'evening-end',
      title: '🌙 今日总结',
      time: '21:00',
      status: 'pending',
      category: 'milestone',
      points: 0,
      type: 'milestone'
    });

    // Sort by time
    return events.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
  };

  const convertWeekDataToTimeline = (weekData: any[]): TimelineEvent[] => {
    // For week view, show daily summaries
    const events: TimelineEvent[] = [];
    
    weekData.forEach((dayData) => {
      const tasksCount = dayData.tasks.length;
      const completedCount = dayData.tasks.filter((t: DailyTask) => t.status === 'completed').length;
      const totalPoints = dayData.tasks.reduce((sum: number, t: DailyTask) => 
        sum + (t.pointsEarned || t.task?.points || 0), 0);
      
      events.push({
        id: `day-${dayData.date}`,
        title: `📅 ${formatDateChinese(dayData.date)}`,
        description: `${completedCount}/${tasksCount} 个任务完成，获得 ${totalPoints} 积分`,
        time: '09:00',
        status: completedCount === tasksCount && tasksCount > 0 ? 'completed' : 
               completedCount > 0 ? 'in_progress' : 'pending',
        category: 'daily-summary',
        points: totalPoints,
        type: 'milestone'
      });
    });

    return events;
  };

  const getTimelineStatus = (dailyTask: DailyTask): TimelineEvent['status'] => {
    if (dailyTask.status === 'completed') return 'completed';
    if (dailyTask.status === 'in_progress') return 'in_progress';
    
    // Check if overdue
    const now = new Date();
    const taskDate = new Date(dailyTask.date);
    const taskTime = dailyTask.plannedTime;
    
    if (taskTime && taskDate.toDateString() === now.toDateString()) {
      const taskDateTime = new Date(`${dailyTask.date}T${taskTime}`);
      if (now > taskDateTime) return 'overdue';
    }
    
    return 'pending';
  };

  // Helper functions
  const getDefaultTimeForCategory = (category: string): string => {
    const categoryTimes: { [key: string]: string } = {
      'study': '09:00',
      'learning': '09:00',
      'exercise': '07:00',
      'housework': '10:00',
      'reading': '20:00',
      'hobby': '15:00',
      'creativity': '16:00'
    };
    return categoryTimes[category] || '14:00';
  };

  const addMinutesToTime = (time: string, minutes: number): string => {
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMins = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
  };

  const timeToMinutes = (time: string): number => {
    const [hours, mins] = time.split(':').map(Number);
    return hours * 60 + mins;
  };

  const formatDateChinese = (date: string): string => {
    return new Date(date).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    });
  };

  const getWeekStart = (date: string): string => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().split('T')[0];
  };

  const getWeekDays = (weekStart: string): { date: string; dayName: string }[] => {
    const days = [];
    const start = new Date(weekStart);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      days.push({
        date: date.toISOString().split('T')[0],
        dayName: date.toLocaleDateString('zh-CN', { weekday: 'short' })
      });
    }
    
    return days;
  };

  const getCurrentTimePosition = (): number => {
    const now = currentTime;
    const minutes = now.getHours() * 60 + now.getMinutes();
    return Math.max(0, Math.min(100, (minutes - 360) / (1260 - 360) * 100)); // 6:00 to 21:00 range
  };

  const getStatusColor = (status: TimelineEvent['status']) => {
    switch (status) {
      case 'completed': return 'text-cartoon-green bg-cartoon-green/10 border-cartoon-green';
      case 'in_progress': return 'text-cartoon-blue bg-cartoon-blue/10 border-cartoon-blue';
      case 'overdue': return 'text-cartoon-red bg-cartoon-red/10 border-cartoon-red';
      default: return 'text-cartoon-gray bg-cartoon-light border-cartoon-light';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'border-l-cartoon-red';
      case 'medium': return 'border-l-cartoon-orange';
      case 'low': return 'border-l-cartoon-green';
      default: return 'border-l-cartoon-light';
    }
  };

  const getTypeIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'task': return '📝';
      case 'milestone': return '🎯';
      case 'reminder': return '⏰';
      case 'break': return '☕';
      default: return '📋';
    }
  };

  if (!user) {
    return null;
  }

  const events = timelineState.data || [];
  const isToday = currentDate === new Date().toISOString().split('T')[0];

  return (
    <div className={`bg-white rounded-cartoon-lg shadow-cartoon p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-cartoon-dark font-fun">
            ⏰ 任务时间轴
          </h2>
          <p className="text-sm text-cartoon-gray">
            {viewMode === 'day' ? '今日任务安排' : '本周进度概览'}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* View Mode Toggle */}
          <div className="flex bg-cartoon-light rounded-cartoon p-1">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1 rounded-cartoon text-sm font-medium transition-colors ${
                viewMode === 'day' 
                  ? 'bg-cartoon-blue text-white' 
                  : 'text-cartoon-gray hover:text-cartoon-dark'
              }`}
            >
              日视图
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded-cartoon text-sm font-medium transition-colors ${
                viewMode === 'week' 
                  ? 'bg-cartoon-blue text-white' 
                  : 'text-cartoon-gray hover:text-cartoon-dark'
              }`}
            >
              周视图
            </button>
          </div>

          {/* Date Picker */}
          {showDatePicker && (
            <div className="relative">
              <Calendar
                selectedDate={currentDate}
                onDateChange={setCurrentDate}
                className="absolute right-0 top-0 z-10 min-w-[300px]"
                compactMode={true}
                showToday={true}
              />
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {timelineState.loading.isLoading && (
        <div className="text-center py-12">
          <LoadingSpinner
            size="lg"
            message={timelineState.loading.loadingMessage}
            className="text-center"
          />
        </div>
      )}

      {/* Error State */}
      {timelineState.error.hasError && (
        <div className="mb-6">
          <ErrorDisplay
            error={timelineState.error}
            size="md"
            className="text-center"
          />
        </div>
      )}

      {/* Timeline Content */}
      {!timelineState.loading.isLoading && !timelineState.error.hasError && (
        <div className="relative">
          {events.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-xl font-semibold text-cartoon-dark mb-2 font-fun">
                暂无安排
              </h3>
              <p className="text-cartoon-gray">
                {viewMode === 'day' ? '今日还没有任务安排' : '本周还没有任务计划'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Current Time Indicator (only for today in day view) */}
              {viewMode === 'day' && isToday && (
                <div 
                  className="absolute left-8 w-full border-t-2 border-cartoon-red z-10"
                  style={{ top: `${getCurrentTimePosition() * 6}px` }}
                >
                  <div className="bg-cartoon-red text-white text-xs px-2 py-1 rounded-cartoon inline-block -mt-3">
                    现在 {currentTime.toLocaleTimeString('zh-CN', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              )}

              {/* Timeline Events */}
              {events.map((event, index) => (
                <div key={event.id} className="relative flex items-start">
                  {/* Timeline Line */}
                  <div className="flex flex-col items-center mr-4">
                    <div className={`
                      w-4 h-4 rounded-full border-2 flex items-center justify-center text-xs
                      ${getStatusColor(event.status)}
                    `}>
                      {event.status === 'completed' && '✓'}
                      {event.status === 'in_progress' && '⏳'}
                      {event.status === 'overdue' && '!'}
                    </div>
                    {index < events.length - 1 && (
                      <div className="w-0.5 h-16 bg-cartoon-light mt-2"></div>
                    )}
                  </div>

                  {/* Event Content */}
                  <div className={`
                    flex-1 bg-cartoon-light rounded-cartoon p-4 border-l-4 
                    ${getPriorityColor(event.priority)}
                    ${event.status === 'in_progress' ? 'animate-pulse' : ''}
                  `}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getTypeIcon(event.type)}</span>
                        <h3 className="font-medium text-cartoon-dark">{event.title}</h3>
                        {event.priority && (
                          <span className={`
                            text-xs px-2 py-1 rounded-cartoon font-medium
                            ${event.priority === 'high' ? 'bg-cartoon-red text-white' :
                              event.priority === 'medium' ? 'bg-cartoon-orange text-white' :
                              'bg-cartoon-green text-white'}
                          `}>
                            {event.priority === 'high' ? '高' :
                             event.priority === 'medium' ? '中' : '低'}优先级
                          </span>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm font-mono text-cartoon-dark">
                          {event.time}
                          {event.endTime && ` - ${event.endTime}`}
                        </div>
                        {event.points > 0 && (
                          <div className="text-xs text-cartoon-green font-medium">
                            +{event.points} 积分
                          </div>
                        )}
                      </div>
                    </div>

                    {event.description && (
                      <p className="text-sm text-cartoon-gray mb-2">{event.description}</p>
                    )}

                    {/* Task Actions */}
                    {event.type === 'task' && event.task && (
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-3 text-cartoon-gray">
                          <span>🏷️ {event.category}</span>
                          {event.task.task?.estimatedTime && (
                            <span>⏱️ {event.task.task.estimatedTime}分钟</span>
                          )}
                        </div>
                        
                        {event.status === 'pending' && (
                          <button className="bg-cartoon-blue hover:bg-blue-600 text-white px-3 py-1 rounded-cartoon text-xs font-medium transition-colors">
                            开始任务
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskTimeline;