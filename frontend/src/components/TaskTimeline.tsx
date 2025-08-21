import React, { useState } from 'react';
import { DailyTask } from '../types';
import { apiService } from '../services/api';
import TaskCategoryIcon from './TaskCategoryIcon';
import EvidenceModal from './EvidenceModal';

interface TaskTimelineProps {
  date: string;
  dailyTasks: DailyTask[];
  onTaskUpdate?: (taskId: string, updates: Partial<DailyTask>) => void;
  onRefresh?: () => void;
}

interface TimeSlot {
  time: string;
  hour: number;
  minute: number;
  displayTime: string;
}

interface ConflictInfo {
  hasConflicts: boolean;
  conflict: {
    timeSlot: string;
    conflictingTasks: {
      taskId: string;
      title: string;
      plannedTime: string;
      estimatedTime: number;
    }[];
  } | null;
}

const TaskTimeline: React.FC<TaskTimelineProps> = ({
  date,
  dailyTasks,
  onTaskUpdate,
  onRefresh,
}) => {
  const [draggedTask, setDraggedTask] = useState<DailyTask | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);
  const [conflictInfo, setConflictInfo] = useState<ConflictInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [quickCreateTime, setQuickCreateTime] = useState<string>('');
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickTaskDuration, setQuickTaskDuration] = useState(30);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<DailyTask | null>(null);
  const [resizingTask, setResizingTask] = useState<string | null>(null);

  // Generate time slots from 00:00 to 23:30 (every 30 minutes)
  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayTime = `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
        slots.push({ time, hour, minute, displayTime });
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Get tasks that are already scheduled with time
  const scheduledTasks = dailyTasks.filter(task => task.plannedTime);

  // Calculate end time based on start time and estimated duration
  const calculateEndTime = (startTime: string, durationMinutes: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
    return `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
  };

  // Check if a time slot conflicts with existing tasks
  const checkTimeConflict = async (startTime: string, estimatedTime: number, excludeTaskId?: string) => {
    try {
      const response = await apiService.checkSchedulingConflicts({
        date,
        plannedTime: startTime,
        estimatedTime: estimatedTime.toString(),
        excludeTaskId,
      });
      return (response as any).data;
    } catch (error) {
      console.error('Error checking conflicts:', error);
      return { hasConflicts: false, conflict: null };
    }
  };


  // Handle drag over time slot
  const handleDragOver = (e: React.DragEvent, timeSlot: string) => {
    e.preventDefault();
    setDragOverSlot(timeSlot);
    e.dataTransfer.dropEffect = 'move';
  };

  // Handle drag leave
  const handleDragLeave = () => {
    setDragOverSlot(null);
    setConflictInfo(null);
  };

  // Handle drop on time slot
  const handleDrop = async (e: React.DragEvent, timeSlot: string) => {
    e.preventDefault();
    setDragOverSlot(null);
    
    try {
      // Check if it's a new task from TaskPlanning sidebar or existing dailyTask
      const jsonData = e.dataTransfer.getData('application/json');
      const textData = e.dataTransfer.getData('text/plain');
      
      if (jsonData) {
        // New task from TaskPlanning sidebar
        const task = JSON.parse(jsonData);
        const estimatedTime = task.estimatedTime || 30;
        const endTime = calculateEndTime(timeSlot, estimatedTime);

        setLoading(true);

        // Check for conflicts
        const conflictData = await checkTimeConflict(timeSlot, estimatedTime);
        
        if (conflictData.hasConflicts) {
          setConflictInfo(conflictData);
          setLoading(false);
          return;
        }

        // Create new daily task with scheduled time
        await apiService.createDailyTask({
          taskId: task.id,
          date: date,
          plannedTime: timeSlot,
          plannedEndTime: endTime,
        });

        onRefresh?.();
        
      } else if (textData && draggedTask) {
        // Existing daily task being rescheduled
        const estimatedTime = draggedTask.task?.estimatedTime || 30;
        const endTime = calculateEndTime(timeSlot, estimatedTime);

        setLoading(true);

        // Check for conflicts
        const conflictData = await checkTimeConflict(timeSlot, estimatedTime, draggedTask.id);
        
        if (conflictData.hasConflicts) {
          setConflictInfo(conflictData);
          setLoading(false);
          return;
        }

        // Update the task with new time
        const updates = {
          plannedTime: timeSlot,
          plannedEndTime: endTime,
        };

        await apiService.updateDailyTask(draggedTask.id, updates);
        
        // Call parent callback to refresh data
        onTaskUpdate?.(draggedTask.id, updates);
        onRefresh?.();
      }
      
    } catch (error) {
      console.error('Error handling task drop:', error);
    } finally {
      setLoading(false);
      setDraggedTask(null);
    }
  };

  // Remove task from timeline (move back to unscheduled)
  const handleRemoveFromTimeline = async (task: DailyTask) => {
    try {
      const updates = {
        plannedTime: undefined,
        plannedEndTime: undefined,
      };

      await apiService.updateDailyTask(task.id, updates);
      onTaskUpdate?.(task.id, updates);
      onRefresh?.();
    } catch (error) {
      console.error('Error removing task from timeline:', error);
    }
  };

  // Handle time slot click to create new task
  const handleTimeSlotClick = (timeSlot: string) => {
    setQuickCreateTime(timeSlot);
    setShowQuickCreate(true);
    setQuickTaskTitle('');
    setQuickTaskDuration(30);
  };

  // Handle quick task creation
  const handleQuickTaskCreate = async () => {
    if (!quickTaskTitle.trim()) return;

    try {
      setLoading(true);
      
      // First create the task
      const newTaskResponse = await apiService.createTask({
        title: quickTaskTitle,
        description: `快速创建的任务：${quickTaskTitle}`,
        category: 'other' as const,
        difficulty: 'medium' as const,
        estimatedTime: quickTaskDuration,
        requiresEvidence: false,
      }) as any;

      // Then create the daily task with scheduled time
      const endTime = calculateEndTime(quickCreateTime, quickTaskDuration);
      const createdTaskId = newTaskResponse.data?.task?.id || newTaskResponse.data?.id || newTaskResponse.id;
      await apiService.createDailyTask({
        taskId: createdTaskId,
        date: date,
        plannedTime: quickCreateTime,
        plannedEndTime: endTime,
      });

      // Reset form and refresh
      setShowQuickCreate(false);
      onRefresh?.();
    } catch (error) {
      console.error('Error creating quick task:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle task click for evidence upload
  const handleTaskClick = (task: DailyTask) => {
    setSelectedTask(task);
    setShowEvidenceModal(true);
  };

  // Handle evidence submission
  const handleEvidenceSubmit = async (evidenceData: {
    evidenceText: string;
    evidenceMedia: any[];
    notes: string;
    isPublic: boolean;
  }) => {
    if (!selectedTask) return;

    try {
      setLoading(true);
      await apiService.updateDailyTask(selectedTask.id, {
        evidenceText: evidenceData.evidenceText,
        evidenceMedia: evidenceData.evidenceMedia,
        notes: evidenceData.notes,
        status: 'completed' as const,
      });
      setShowEvidenceModal(false);
      setSelectedTask(null);
      onRefresh?.();
    } catch (error) {
      console.error('Error submitting evidence:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get task style based on its position on timeline
  const getTaskStyle = (task: DailyTask): React.CSSProperties => {
    if (!task.plannedTime) return {};
    
    const [hours, minutes] = task.plannedTime.split(':').map(Number);
    const startMinutes = hours * 60 + minutes; // Minutes from 00:00
    const duration = task.task?.estimatedTime || 30;
    
    return {
      top: `${(startMinutes / 30) * 32}px`, // 32px per 30min slot (reduced for 24h view)
      height: `${Math.max((duration / 30) * 32, 32)}px`, // Minimum 32px height
    };
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-l-green-500 bg-green-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center">
          <span className="text-2xl mr-3">📅</span>
          <div>
            <h2 className="text-xl font-bold text-gray-900">时间轴视图</h2>
            <p className="text-sm text-gray-600">
              拖拽任务到时间轴安排您的一天 - {date}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Timeline */}
        <div>
            <div className="relative bg-gray-50 rounded-lg p-4 min-h-96">
              {/* Time Labels */}
              <div className="flex">
                <div className="w-20 flex-shrink-0">
                  {timeSlots.filter((_, index) => index % 2 === 0).map((slot) => (
                    <div
                      key={slot.time}
                      className="h-16 flex items-center text-xs text-gray-600 font-medium"
                    >
                      {slot.displayTime}
                    </div>
                  ))}
                </div>

                {/* Timeline Grid */}
                <div className="flex-1 relative">
                  {/* Time Slots */}
                  {timeSlots.map((slot, index) => (
                    <div
                      key={slot.time}
                      className={`h-4 border-t border-gray-200 relative cursor-pointer hover:bg-blue-50 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      } ${
                        dragOverSlot === slot.time ? 'bg-primary-100 border-primary-300' : ''
                      }`}
                      onDragOver={(e) => handleDragOver(e, slot.time)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, slot.time)}
                      onClick={() => handleTimeSlotClick(slot.time)}
                    >
                      {dragOverSlot === slot.time && (
                        <div className="absolute inset-0 bg-primary-200 bg-opacity-50 border-2 border-primary-400 border-dashed rounded">
                          <div className="text-center text-primary-700 font-medium text-sm py-1">
                            拖放任务到这里
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Scheduled Tasks */}
                  {scheduledTasks.map((task) => (
                    <div
                      key={task.id}
                      style={getTaskStyle(task)}
                      className={`absolute left-2 right-2 rounded-lg border-l-4 p-2 shadow-sm cursor-pointer group ${getPriorityColor(task.priority || 'medium')} z-10 hover:shadow-md transition-shadow`}
                      onClick={() => handleTaskClick(task)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-1">
                          <TaskCategoryIcon 
                            category={task.task?.category || 'other'} 
                            size="sm"
                          />
                          <h4 className="font-medium text-gray-900 text-sm truncate flex-1">
                            {task.task?.title}
                          </h4>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFromTimeline(task);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>{task.plannedTime} - {task.plannedEndTime}</span>
                        <span>{task.task?.estimatedTime}min</span>
                      </div>
                      <div className={`text-xs px-1 py-0.5 rounded ${
                        task.status === 'completed' ? 'bg-green-100 text-green-700' :
                        task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {task.status === 'completed' ? '已完成' :
                         task.status === 'in_progress' ? '进行中' : '计划中'}
                      </div>
                      
                      {/* Resize Handle */}
                      <div
                        className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 bg-blue-400 hover:bg-blue-500 transition-opacity"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setResizingTask(task.id);
                        }}
                        title="拖拽调整时长"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Loading Overlay */}
              {loading && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                    <span className="text-gray-600">更新中...</span>
                  </div>
                </div>
              )}
            </div>
        </div>

        {/* Conflict Warning */}
        {conflictInfo && conflictInfo.hasConflicts && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <div className="text-red-500 mr-3">⚠️</div>
              <div className="flex-1">
                <h4 className="font-medium text-red-800">时间冲突检测</h4>
                <p className="text-red-700 text-sm mt-1">
                  该时间段与以下任务冲突：
                </p>
                {conflictInfo.conflict?.conflictingTasks.map((conflictTask, index) => (
                  <div key={index} className="text-sm text-red-600 mt-1">
                    • {conflictTask.title} ({conflictTask.plannedTime}, {conflictTask.estimatedTime}分钟)
                  </div>
                ))}
                <div className="mt-3 flex space-x-2">
                  <button
                    onClick={() => setConflictInfo(null)}
                    className="text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => {
                      // Force schedule despite conflicts
                      // Implementation can be added if needed
                      setConflictInfo(null);
                    }}
                    className="text-sm bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                  >
                    强制安排
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Create Task Modal */}
        {showQuickCreate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">快速创建任务</h3>
              <p className="text-sm text-gray-600 mb-4">时间: {quickCreateTime}</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    任务标题
                  </label>
                  <input
                    type="text"
                    value={quickTaskTitle}
                    onChange={(e) => setQuickTaskTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="输入任务标题..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    预计时长 (分钟)
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="480"
                    step="15"
                    value={quickTaskDuration}
                    onChange={(e) => setQuickTaskDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowQuickCreate(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleQuickTaskCreate}
                  disabled={!quickTaskTitle.trim() || loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? '创建中...' : '创建任务'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Evidence Upload Modal */}
        {showEvidenceModal && selectedTask && selectedTask.task && (
          <EvidenceModal
            task={selectedTask.task}
            dailyTask={selectedTask}
            onClose={() => {
              setShowEvidenceModal(false);
              setSelectedTask(null);
            }}
            onSubmit={handleEvidenceSubmit}
          />
        )}
      </div>
    </div>
  );
};

export default TaskTimeline;