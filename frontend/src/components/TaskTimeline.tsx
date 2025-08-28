import React, { useState } from 'react';
import { DailyTask } from '../types';
import { detectNetworkAndGetApiServiceSync, compatibleApiService } from '../services/compatibleApi';
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
  const [resizeStartY, setResizeStartY] = useState<number>(0);
  const [resizeOriginalHeight, setResizeOriginalHeight] = useState<number>(0);

  // Generate time slots from 06:00 to 22:00 (every 30 minutes) - focus on active hours
  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    for (let hour = 6; hour <= 22; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        // Stop at 22:00, don't include 22:30
        if (hour === 22 && minute > 0) break;
        
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
      const apiService = detectNetworkAndGetApiServiceSync();
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
    e.stopPropagation();
    console.log('🎯 TaskTimeline: Drag over timeSlot:', timeSlot);
    setDragOverSlot(timeSlot);
    
    // Set dropEffect based on effectAllowed (safer than accessing getData in dragOver)
    if (e.dataTransfer.effectAllowed === 'move') {
      e.dataTransfer.dropEffect = 'move';
    } else {
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  // Handle drag leave
  const handleDragLeave = () => {
    setDragOverSlot(null);
    setConflictInfo(null);
  };

  // Handle drop on time slot
  const handleDrop = async (e: React.DragEvent, timeSlot: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverSlot(null);
    
    console.log('🎯 TaskTimeline: Drop event triggered on timeSlot:', timeSlot);
    
    try {
      // Check if it's a new task from TaskPlanning sidebar or existing dailyTask
      const jsonData = e.dataTransfer.getData('application/json');
      const textData = e.dataTransfer.getData('text/plain');
      
      console.log('📋 TaskTimeline: Drag data received:', { jsonData, textData });
      
      
      if (jsonData) {
        const parsedData = JSON.parse(jsonData);
        
        if (parsedData.isExistingTask) {
          // Existing daily task being rescheduled
          const taskToMove = parsedData.taskData;
          const estimatedTime = taskToMove.task?.estimatedTime || 30;
          const endTime = calculateEndTime(timeSlot, estimatedTime);

          setLoading(true);

          // Check for conflicts (exclude the current task)
          const conflictData = await checkTimeConflict(timeSlot, estimatedTime, taskToMove.id);
          
          if (conflictData.hasConflicts) {
            setConflictInfo(conflictData);
            setLoading(false);
            return;
          }

          // Update the existing daily task with new time
          const updates = {
            plannedTime: timeSlot,
            plannedEndTime: endTime,
          };

          const apiService = detectNetworkAndGetApiServiceSync();
          await apiService.updateDailyTask(taskToMove.id, updates);
          
          // Call parent callback to refresh data
          onTaskUpdate?.(taskToMove.id, updates);
          onRefresh?.();
          
        } else {
          // New task from TaskPlanning sidebar
          const task = parsedData;
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
          const apiService = detectNetworkAndGetApiServiceSync();
          
          console.log('📤 TaskTimeline: About to call createDailyTask API with:', {
            taskId: task._id || task.id,
            date: date,
            plannedTime: timeSlot,
            plannedEndTime: endTime,
          });
          
          // 添加API服务实例验证
          console.log('🔍 API Service Instance Analysis:', {
            apiServiceType: apiService.constructor.name,
            isCompatibleApiService: apiService === compatibleApiService,
            hasCreateDailyTaskMethod: typeof apiService.createDailyTask === 'function',
            serviceString: apiService.toString().substring(0, 100)
          });
          
          try {
            console.log('📤 TaskTimeline: About to call createDailyTask API...');
            console.log('🔗 Expected URL: POST /daily-tasks');
            console.log('📝 Request payload:', {
              taskId: task._id || task.id,
              date: date,
              plannedTime: timeSlot,
              plannedEndTime: endTime,
            });
            
            // CRITICAL DEBUG: 验证我们使用的是哪个API服务
            console.log('🔧 CRITICAL DEBUG - API Service Verification:', {
              serviceName: apiService.constructor.name,
              isRealApiService: apiService.constructor.name === 'ApiService',
              isCompatibleApiService: apiService === compatibleApiService,
              serviceToString: apiService.toString().substring(0, 200)
            });
            
            const startTime = Date.now();
            
            // 增强的网络请求监控 - 捕获真实的fetch调用
            const originalFetch = window.fetch;
            let actualRequestUrl = '';
            let actualRequestMethod = '';
            let actualRequestHeaders: HeadersInit = {};
            let actualRequestPayload: any = null;
            let actualResponseStatus = 0;
            let actualResponseHeaders: Record<string, string> = {};
            let actualResponseBody: any = null;
            
            // 临时拦截fetch以捕获实际网络请求
            window.fetch = async function(input, init) {
              if (typeof input === 'string' && input.includes('/daily-tasks')) {
                actualRequestUrl = input;
                actualRequestMethod = init?.method || 'GET';
                actualRequestHeaders = init?.headers || {};
                if (init?.body && typeof init.body === 'string') {
                  try {
                    actualRequestPayload = JSON.parse(init.body);
                  } catch (e) {
                    actualRequestPayload = init.body;
                  }
                } else if (init?.body) {
                  actualRequestPayload = init.body;
                }
                
                console.log('🌐 NETWORK INTERCEPT: Actual fetch request detected', {
                  url: actualRequestUrl,
                  method: actualRequestMethod,
                  headers: actualRequestHeaders,
                  payload: actualRequestPayload
                });
              }
              
              const response = await originalFetch(input, init);
              
              if (typeof input === 'string' && input.includes('/daily-tasks')) {
                actualResponseStatus = response.status;
                actualResponseHeaders = Object.fromEntries(response.headers.entries());
                
                // 克隆响应以读取body而不影响原始响应
                const responseClone = response.clone();
                try {
                  actualResponseBody = await responseClone.json();
                } catch (e) {
                  try {
                    actualResponseBody = await responseClone.text();
                  } catch (e2) {
                    actualResponseBody = 'Unable to parse response body';
                  }
                }
                
                console.log('🌐 NETWORK INTERCEPT: Actual fetch response received', {
                  status: actualResponseStatus,
                  headers: actualResponseHeaders,
                  body: actualResponseBody
                });
              }
              
              return response;
            };
            
            const createResult = await apiService.createDailyTask({
              taskId: task._id || task.id,
              date: date,
              plannedTime: timeSlot,
              plannedEndTime: endTime,
            });
            
            // 恢复原始fetch
            window.fetch = originalFetch;
            
            const responseTime = Date.now() - startTime;
            console.log('✅ TaskTimeline: createDailyTask API call completed in', responseTime + 'ms');
            console.log('📨 Response received:', createResult);
            
            // CRITICAL CHECKPOINT: 验证网络拦截是否执行
            console.log('🔧 CRITICAL CHECKPOINT - Network Interception Results:', {
              actualRequestUrl,
              actualRequestMethod,
              actualResponseStatus,
              networkRequestDetected: !!actualRequestUrl,
              interceptorExecuted: actualRequestUrl !== ''
            });
            
            // 详细的网络请求状态检查
            const createResultObj = createResult as any;
            console.log('🔍 Detailed API response analysis:', {
              responseType: typeof createResult,
              hasSuccessProperty: createResultObj && typeof createResultObj === 'object' && 'success' in createResultObj,
              successValue: createResultObj?.success,
              hasDataProperty: createResultObj && typeof createResultObj === 'object' && 'data' in createResultObj,
              dataType: typeof createResultObj?.data,
              isPromise: createResult instanceof Promise,
              isMockResponse: createResultObj && createResultObj.data?.dailyTask?.id?.startsWith?.('demo-') || false,
              responseTime: responseTime + 'ms',
              responseSize: JSON.stringify(createResult).length + ' bytes',
              // 添加网络拦截数据
              actualNetworkRequest: {
                url: actualRequestUrl,
                method: actualRequestMethod,
                status: actualResponseStatus,
                requestHeaders: actualRequestHeaders,
                requestPayload: actualRequestPayload,
                responseHeaders: actualResponseHeaders,
                responseBody: actualResponseBody
              }
            });
            
            // 关键诊断：检查是否实际发送了网络请求
            if (!actualRequestUrl) {
              console.error('❌ CRITICAL: No actual network request was detected!');
              console.error('❌ This indicates the API call is being handled by mock/compatible service');
              console.error('❌ API service instance type:', apiService.constructor.name);
              console.error('❌ API service methods:', Object.getOwnPropertyNames(apiService).filter(prop => typeof (apiService as any)[prop] === 'function'));
              
              // 立即测试API服务类型
              const isCompatibleApi = apiService === compatibleApiService;
              console.error('❌ Service type check:', {
                isCompatibleApi,
                hasCreateDailyTask: typeof (apiService as any).createDailyTask === 'function',
                constructorName: apiService.constructor.name
              });
            } else {
              console.log('✅ Network request was successfully sent to:', actualRequestUrl);
            }
            
            // 检查响应是否包含有效的dailyTask数据
            const dailyTaskData = (createResult as any)?.data?.dailyTask;
            if (dailyTaskData && dailyTaskData.id) {
              console.log('✅ Valid daily task created with ID:', dailyTaskData.id);
              console.log('📋 Daily task details:', {
                id: dailyTaskData.id,
                taskId: dailyTaskData.taskId,
                date: dailyTaskData.date,
                plannedTime: dailyTaskData.plannedTime,
                status: dailyTaskData.status
              });
            } else {
              console.warn('⚠️ API response missing daily task data:', createResult);
            }
            
            onRefresh?.();
          } catch (error) {
            console.error('❌ TaskTimeline: createDailyTask API call failed:', error);
            console.error('❌ Error details:', {
              message: (error as any)?.message,
              name: (error as any)?.name,
              stack: (error as any)?.stack
            });
            
            // 显示错误提示给用户
            alert(`创建每日任务失败: ${(error as any)?.message || '未知错误'}`);
          }
        }
        
      } else if (textData && draggedTask) {
        // Fallback: Existing daily task being rescheduled (legacy path)
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

        const apiService = detectNetworkAndGetApiServiceSync();
        await apiService.updateDailyTask(draggedTask.id, updates);
        
        // Call parent callback to refresh data
        onTaskUpdate?.(draggedTask.id, updates);
        onRefresh?.();
      }
      
    } catch (error) {
      console.error('❌ Error handling task drop:', error);
      console.error('❌ Error details:', {
        message: (error as any)?.message,
        stack: (error as any)?.stack,
        error: error
      });
      
      // Show error alert to user
      alert(`拖拽失败: ${(error as any)?.message || '未知错误'}`);
    } finally {
      setLoading(false);
      setDraggedTask(null);
    }
  };

  // Handle task resizing
  const handleResizeStart = (e: React.MouseEvent, task: DailyTask) => {
    e.stopPropagation();
    e.preventDefault();
    
    setResizingTask(task.id);
    setResizeStartY(e.clientY);
    
    // Calculate current height based on task duration
    const currentDuration = task.task?.estimatedTime || 30;
    const slotHeight = 40; // 40px per 30min slot
    const currentHeight = Math.max((currentDuration / 30) * slotHeight, slotHeight);
    setResizeOriginalHeight(currentHeight);
    
    
    // Add global mouse move and mouse up listeners
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!resizingTask) return;
    
    const deltaY = e.clientY - resizeStartY;
    const slotHeight = 40; // 40px per 30min slot
    
    // Calculate new height (minimum 1 slot = 30 minutes)
    const newHeight = Math.max(resizeOriginalHeight + deltaY, slotHeight);
    
    // Convert height back to duration (in minutes)
    const newDuration = Math.max(Math.round((newHeight / slotHeight) * 30), 15); // Minimum 15 minutes
    
    
    // Update the visual height immediately for smooth feedback
    const taskElement = document.querySelector(`[data-task-id="${resizingTask}"]`) as HTMLElement;
    if (taskElement) {
      taskElement.style.height = `${newHeight}px`;
    }
  };

  const handleResizeEnd = async (e: MouseEvent) => {
    if (!resizingTask) return;
    
    const deltaY = e.clientY - resizeStartY;
    const slotHeight = 40;
    
    // Calculate final duration
    const newHeight = Math.max(resizeOriginalHeight + deltaY, slotHeight);
    const newDuration = Math.max(Math.round((newHeight / slotHeight) * 30), 15);
    
    
    try {
      // Find the task being resized
      const task = dailyTasks.find(t => t.id === resizingTask);
      if (task && task.plannedTime) {
        // Calculate new end time
        const newEndTime = calculateEndTime(task.plannedTime, newDuration);
        
        // Update only the planned end time for this specific daily task
        // Don't modify the global task template - just this instance's scheduling
        const updates = {
          plannedEndTime: newEndTime,
        };
        
        const apiService = detectNetworkAndGetApiServiceSync();
        await apiService.updateDailyTask(task.id, updates);
        
        // Update local state
        onTaskUpdate?.(task.id, updates);
        onRefresh?.();
        
      }
    } catch (error) {
      console.error('❌ Error updating task duration:', error);
      // Revert visual changes on error
      onRefresh?.();
    }
    
    // Clean up
    setResizingTask(null);
    setResizeStartY(0);
    setResizeOriginalHeight(0);
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
  };

  // Remove task from timeline (move back to unscheduled)
  const handleRemoveFromTimeline = async (task: DailyTask) => {
    try {
      const updates = {
        plannedTime: undefined,
        plannedEndTime: undefined,
      };

      const apiService = detectNetworkAndGetApiServiceSync();
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
      
      const apiService = detectNetworkAndGetApiServiceSync();
      
      // First create the task
      const newTaskResponse = await apiService.createTask({
        title: quickTaskTitle,
        description: `快速创建的任务：${quickTaskTitle}`,
        category: 'other' as const,
        activity: 'general_task', // 必需的activity字段，对应'other'类别的通用任务
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
  const handleTaskClick = async (task: DailyTask) => {
    // If task object is missing, try to fetch it
    if (!task.task && task.taskId) {
      try {
        const apiService = detectNetworkAndGetApiServiceSync();
        const response = await apiService.getTaskById(task.taskId);
        const fetchedTask = (response as any).data?.task;
        if (fetchedTask) {
          // Update the daily task with the fetched task object
          task.task = fetchedTask;
        }
      } catch (error) {
        console.error('Error fetching task details:', error);
        // Create a minimal task object if fetch fails
        task.task = {
          id: task.taskId || 'unknown',
          title: '未知任务',
          description: '',
          category: 'other' as const,
          activity: 'general_task',
          difficulty: 'medium' as const,
          estimatedTime: 30,
          requiresEvidence: false,
          evidenceTypes: [],
          tags: [],
          points: 10,
          isPublic: false,
          createdBy: 'demo-user',
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }
    }
    
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
      const apiService = detectNetworkAndGetApiServiceSync();
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

  // Calculate time overlap between two tasks
  const tasksOverlap = (task1: DailyTask, task2: DailyTask): boolean => {
    if (!task1.plannedTime || !task2.plannedTime) return false;
    
    const getMinutes = (timeStr: string) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };
    
    const task1Start = getMinutes(task1.plannedTime);
    const task1End = task1.plannedEndTime ? getMinutes(task1.plannedEndTime) : task1Start + (task1.task?.estimatedTime || 30);
    
    const task2Start = getMinutes(task2.plannedTime);
    const task2End = task2.plannedEndTime ? getMinutes(task2.plannedEndTime) : task2Start + (task2.task?.estimatedTime || 30);
    
    return task1Start < task2End && task2Start < task1End;
  };

  // Calculate parallel task layout for overlapping tasks
  const calculateParallelLayout = (currentTask: DailyTask, allTasks: DailyTask[]) => {
    if (!currentTask.plannedTime) return { leftPercent: 0, widthPercent: 100, column: 0, totalColumns: 1 };
    
    // Find all tasks that overlap with the current task
    const overlappingTasks = allTasks.filter(task => 
      task.id !== currentTask.id && tasksOverlap(currentTask, task)
    );
    
    if (overlappingTasks.length === 0) {
      return { leftPercent: 0, widthPercent: 100, column: 0, totalColumns: 1 };
    }
    
    // Sort all overlapping tasks (including current) by start time, then by id for consistency
    const allOverlappingTasks = [currentTask, ...overlappingTasks].sort((a, b) => {
      const aStart = a.plannedTime!.localeCompare(b.plannedTime!);
      return aStart !== 0 ? aStart : a.id.localeCompare(b.id);
    });
    
    const totalColumns = allOverlappingTasks.length;
    const currentColumn = allOverlappingTasks.findIndex(task => task.id === currentTask.id);
    
    const widthPercent = Math.floor(100 / totalColumns);
    const leftPercent = currentColumn * widthPercent;
    
    return { leftPercent, widthPercent, column: currentColumn, totalColumns };
  };

  // Get task style based on its position on timeline with parallel layout support
  const getTaskStyle = (task: DailyTask): React.CSSProperties => {
    if (!task.plannedTime) return {};
    
    const [hours, minutes] = task.plannedTime.split(':').map(Number);
    
    // Hide tasks outside visible range (6:00-22:00)
    if (hours < 6 || hours > 22) {
      return { display: 'none' };
    }
    
    // Calculate position relative to 6:00 AM start
    const startMinutes = (hours - 6) * 60 + minutes; // Minutes from 06:00
    const duration = task.task?.estimatedTime || 30;
    
    // Each slot is 40px high (represents 30 minutes) - matching h-10 class
    const slotHeight = 40;
    
    // Calculate parallel layout
    const { leftPercent, widthPercent } = calculateParallelLayout(task, scheduledTasks);
    
    return {
      top: `${32 + (startMinutes / 30) * slotHeight}px`, // 32px (top-8) + 40px per 30min slot for proper alignment
      height: `${Math.max((duration / 30) * slotHeight, 60)}px`, // Minimum 60px height for simplified content
      left: `calc(8px + ${leftPercent}%)`, // 8px base margin + percentage position
      right: 'auto',
      width: `calc(${widthPercent}% - 4px)`, // Full width minus small gap between parallel tasks
    };
  };

  // Get enhanced task color based on status, priority, and category
  const getTaskColor = (task: DailyTask) => {
    // Priority colors (status takes precedence)
    const statusColorMap = {
      'completed': 'border-l-green-500 bg-green-50/80 shadow-green-100',
      'in_progress': 'border-l-blue-500 bg-blue-50/80 shadow-blue-100',
      'planned': 'border-l-gray-400 bg-gray-50/80 shadow-gray-100',
      'skipped': 'border-l-red-400 bg-red-50/80 shadow-red-100'
    };

    // If task has specific status, use status color
    if (task.status && statusColorMap[task.status as keyof typeof statusColorMap]) {
      return statusColorMap[task.status as keyof typeof statusColorMap];
    }

    // Otherwise use priority color
    const priorityColorMap = {
      'high': 'border-l-red-500 bg-red-50/80 shadow-red-100',
      'medium': 'border-l-yellow-500 bg-yellow-50/80 shadow-yellow-100',  
      'low': 'border-l-green-500 bg-green-50/80 shadow-green-100'
    };

    const priority = task.priority || 'medium';
    return priorityColorMap[priority as keyof typeof priorityColorMap] || 'border-l-gray-500 bg-gray-50/80 shadow-gray-100';
  };

  // Get category color for task type identification
  const getCategoryColor = (category: string) => {
    const categoryColors = {
      'exercise': 'bg-emerald-100 text-emerald-700 border-emerald-200',     // 运动 - 翠绿色
      'reading': 'bg-indigo-100 text-indigo-700 border-indigo-200',        // 阅读 - 靛蓝色
      'learning': 'bg-amber-100 text-amber-700 border-amber-200',          // 学习 - 琥珀色
      'creativity': 'bg-purple-100 text-purple-700 border-purple-200',     // 创意 - 紫色
      'chores': 'bg-slate-100 text-slate-700 border-slate-200',           // 家务 - 石板色
      'other': 'bg-cyan-100 text-cyan-700 border-cyan-200'                // 其他 - 青色
    };
    return categoryColors[category as keyof typeof categoryColors] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    const statusBadgeColors = {
      'completed': 'bg-green-100 text-green-700 border-green-200',
      'in_progress': 'bg-blue-100 text-blue-700 border-blue-200', 
      'planned': 'bg-gray-100 text-gray-600 border-gray-200',
      'skipped': 'bg-red-100 text-red-700 border-red-200'
    };
    return statusBadgeColors[status as keyof typeof statusBadgeColors] || 'bg-gray-100 text-gray-600 border-gray-200';
  };

  // Get priority indicator
  const getPriorityIndicator = (priority: string) => {
    const indicators = {
      'high': { emoji: '🔴', text: '高优先级', color: 'text-red-600' },
      'medium': { emoji: '🟡', text: '中优先级', color: 'text-yellow-600' },
      'low': { emoji: '🟢', text: '低优先级', color: 'text-green-600' }
    };
    return indicators[priority as keyof typeof indicators] || indicators.medium;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-2xl mr-3">📅</span>
            <div>
              <h2 className="text-xl font-bold text-gray-900">时间轴视图</h2>
              <p className="text-sm text-gray-600">
                拖拽任务到时间轴安排您的一天 - {date}
              </p>
            </div>
          </div>
          
          {/* Color Legend */}
          <div className="hidden lg:flex items-center space-x-4 text-xs">
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="font-medium text-gray-700 mb-2">颜色说明</div>
              
              {/* Status Colors */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-green-100 border-l-4 border-green-500 rounded-sm"></div>
                  <span className="text-gray-600">已完成</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-blue-100 border-l-4 border-blue-500 rounded-sm"></div>
                  <span className="text-gray-600">进行中</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-gray-100 border-l-4 border-gray-400 rounded-sm"></div>
                  <span className="text-gray-600">计划中</span>
                </div>
              </div>
              
              {/* Priority Indicators */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <span>🔴</span>
                  <span className="text-gray-600">高优先级</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>🟡</span>
                  <span className="text-gray-600">中优先级</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>🟢</span>
                  <span className="text-gray-600">低优先级</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-6">
        {/* Timeline */}
        <div>
          {/* Mobile Timeline View (< 768px) */}
          <div className="block md:hidden">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 border border-gray-200">
              {/* Mobile Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">今日安排</h3>
                <div className="text-sm text-gray-500">
                  {scheduledTasks.length} 项任务
                </div>
              </div>

              {/* Mobile Task List */}
              <div className="space-y-3">
                {scheduledTasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">📋</div>
                    <p>暂无安排的任务</p>
                    <p className="text-sm mt-1">从任务库拖拽任务到此处</p>
                  </div>
                ) : (
                  scheduledTasks.map((task) => {
                    const priorityInfo = getPriorityIndicator(task.priority || 'medium');
                    return (
                      <div
                        key={task.id}
                        className={`relative rounded-lg border-l-4 p-4 shadow-sm ${getTaskColor(task)} bg-white/90`}
                        onClick={() => handleTaskClick(task)}
                      >
                        {/* Task Title with Category Icon and Priority */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <TaskCategoryIcon 
                              category={task.task?.category || 'other'} 
                              size="sm"
                            />
                            <h4 className="font-medium text-gray-900 flex-1 truncate">
                              {task.task?.title}
                            </h4>
                          </div>
                          <div className={`text-sm ${priorityInfo.color}`} title={priorityInfo.text}>
                            {priorityInfo.emoji}
                          </div>
                        </div>

                        {/* Mobile Actions */}
                        <div className="flex items-center justify-end mt-3 space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFromTimeline(task);
                            }}
                            className="text-xs px-3 py-1 bg-red-50 text-red-600 rounded-full border border-red-200 hover:bg-red-100 transition-colors"
                          >
                            移除
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Mobile Color Legend */}
              <div className="mt-4 p-3 bg-white/80 rounded-lg border border-gray-200">
                <div className="text-xs font-medium text-gray-700 mb-2">图例说明</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-100 border-l-2 border-green-500 rounded-sm"></div>
                    <span className="text-gray-600">已完成</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-blue-100 border-l-2 border-blue-500 rounded-sm"></div>
                    <span className="text-gray-600">进行中</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>🔴</span>
                    <span className="text-gray-600">高优先级</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>🟡</span>
                    <span className="text-gray-600">中优先级</span>
                  </div>
                </div>
              </div>

              {/* Mobile Quick Add */}
              <div className="mt-4">
                <button
                  onClick={() => setShowQuickCreate(true)}
                  className="w-full py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2 active:bg-primary-800"
                >
                  <span>➕</span>
                  <span>快速添加任务</span>
                </button>
              </div>
            </div>
          </div>

          {/* Desktop Timeline View (≥ 768px) */}
          <div className="hidden md:block">
            <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 min-h-[700px] border border-gray-200">
              {/* Timeline Main Structure with Central Axis */}
              <div className="flex">
                {/* Time Scale Column */}
                <div className="w-24 flex-shrink-0 mr-4">
                  <div className="text-xs font-medium text-gray-500 mb-4 text-center">时间</div>
                  {timeSlots.filter((_, index) => index % 2 === 0).map((slot, hourIndex) => (
                    <div
                      key={slot.time}
                      className="h-20 flex items-center justify-end pr-4 text-xs text-gray-700 font-medium relative"
                    >
                      <div className="text-right">
                        <div className="font-semibold text-sm">{slot.time}</div>
                      </div>
                      {/* Time axis dot */}
                      <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-primary-500 rounded-full border-2 border-white shadow-sm z-20"></div>
                    </div>
                  ))}
                </div>

                {/* Central Timeline Axis */}
                <div className="relative w-px bg-primary-500 flex-shrink-0 shadow-sm"></div>

                {/* Task Schedule Column */}
                <div className="flex-1 ml-4 relative">
                  <div className="text-xs font-medium text-gray-500 mb-4 text-center">任务安排</div>
                  
                  {/* Time Grid Background */}
                  <div className="absolute inset-0 top-8">
                    {timeSlots.map((slot, index) => (
                      <div
                        key={`grid-${slot.time}`}
                        className={`h-10 relative border-b transition-colors duration-200 ${
                          index % 2 === 0 
                            ? 'border-gray-200 bg-white/50' 
                            : 'border-gray-100 bg-gray-50/30'
                        }`}
                      >
                        {/* Grid lines for precise alignment */}
                        {index % 2 === 0 && (
                          <div className="absolute left-0 right-0 top-0 h-px bg-primary-200 opacity-30"></div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Interactive Drop Zones */}
                  {timeSlots.map((slot, index) => (
                    <div
                      key={`drop-${slot.time}`}
                      className={`h-10 relative cursor-pointer transition-all duration-200 ${
                        dragOverSlot === slot.time ? 'bg-blue-100 border-blue-400 shadow-sm' : 'hover:bg-blue-50/50'
                      }`}
                      onDragOver={(e) => handleDragOver(e, slot.time)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, slot.time)}
                      onClick={() => handleTimeSlotClick(slot.time)}
                      title={`点击创建任务 - ${slot.time}`}
                    >
                      {/* Snap-to-grid indicators */}
                      {index % 2 === 0 && (
                        <div className="absolute left-0 top-0 w-2 h-px bg-primary-300 opacity-50"></div>
                      )}
                      
                      {/* Empty state hint */}
                      {index % 4 === 1 && !scheduledTasks.some(task => {
                        if (!task.plannedTime) return false;
                        const [taskHour, taskMinute] = task.plannedTime.split(':').map(Number);
                        const [slotHour, slotMinute] = slot.time.split(':').map(Number);
                        return taskHour === slotHour && Math.abs(taskMinute - slotMinute) < 30;
                      }) && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <div className="text-xs text-gray-400 bg-white/80 px-2 py-1 rounded shadow">空闲时段</div>
                        </div>
                      )}
                      
                      {/* Enhanced drop indicator */}
                      {dragOverSlot === slot.time && (
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-blue-50 border-2 border-blue-400 border-dashed rounded-md flex items-center justify-center shadow-md">
                          <div className="text-center text-blue-700 font-medium text-sm flex items-center space-x-2">
                            <span>📋</span>
                            <span>拖放任务到此时间段</span>
                            <span className="text-xs bg-blue-200 px-2 py-1 rounded">{slot.time}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Scheduled Tasks with Enhanced Alignment and Color Coding */}
                  {scheduledTasks.map((task) => {
                    const priorityInfo = getPriorityIndicator(task.priority || 'medium');
                    return (
                      <div
                        key={task.id}
                        data-task-id={task.id}
                        style={getTaskStyle(task)}
                        className={`absolute rounded-lg border-l-4 p-3 shadow-lg cursor-pointer group ${getTaskColor(task)} z-10 hover:shadow-xl transition-all duration-200 hover:scale-[1.01] bg-white/90 backdrop-blur-sm`}
                        onClick={() => handleTaskClick(task)}
                        draggable
                        onDragStart={(e) => {
                          setDraggedTask(task);
                          // Set both text and JSON data for better handling
                          e.dataTransfer.setData('text/plain', task.id);
                          // Mark as existing task by using a special prefix
                          e.dataTransfer.setData('application/json', JSON.stringify({
                            isExistingTask: true,
                            taskId: task.id,
                            dailyTaskId: task.id,
                            taskData: task
                          }));
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                      >
                        {/* Timeline connection line */}
                        <div className="absolute left-0 top-1/2 transform -translate-x-6 -translate-y-1/2 w-4 h-px bg-primary-300"></div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <TaskCategoryIcon 
                              category={task.task?.category || 'other'} 
                              size="sm"
                            />
                            <h4 className="font-medium text-gray-900 text-sm truncate flex-1">
                              {task.task?.title}
                            </h4>
                          </div>
                          <div className="flex items-center space-x-2">
                            {/* Priority indicator */}
                            <div className={`text-xs ${priorityInfo.color}`} title={priorityInfo.text}>
                              {priorityInfo.emoji}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveFromTimeline(task);
                              }}
                              className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-all text-sm p-1 rounded hover:bg-red-50"
                              title="移除任务安排"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                        
                        {/* Enhanced Resize Handle */}
                        <div
                          className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize opacity-0 group-hover:opacity-100 bg-gradient-to-r from-primary-400 to-primary-500 hover:from-primary-500 hover:to-primary-600 transition-all duration-200 rounded-b-lg flex items-center justify-center"
                          onMouseDown={(e) => handleResizeStart(e, task)}
                          title="拖拽调整任务时长"
                        >
                          <div className="w-8 h-1 bg-white/50 rounded"></div>
                        </div>
                      </div>
                    );
                  })}
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
                <div className="mt-3">
                  <button
                    onClick={() => setConflictInfo(null)}
                    className="text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded"
                  >
                    确定
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Create Task Modal - Mobile Optimized */}
        {showQuickCreate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
            <div className="bg-white rounded-t-xl sm:rounded-lg p-4 sm:p-6 w-full sm:w-96 max-w-full sm:mx-4 max-h-[80vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4 text-center sm:text-left">快速创建任务</h3>
              {quickCreateTime && (
                <div className="flex items-center justify-center sm:justify-start mb-4">
                  <div className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium">
                    ⏰ 时间: {quickCreateTime}
                  </div>
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    任务标题
                  </label>
                  <input
                    type="text"
                    value={quickTaskTitle}
                    onChange={(e) => setQuickTaskTitle(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base"
                    placeholder="输入任务标题..."
                    autoFocus
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    预计时长 (分钟)
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="15"
                      max="480"
                      step="15"
                      value={quickTaskDuration}
                      onChange={(e) => setQuickTaskDuration(Number(e.target.value))}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base"
                    />
                    <div className="text-sm text-gray-500">分钟</div>
                  </div>
                  
                  {/* Quick Duration Buttons for Mobile */}
                  <div className="flex flex-wrap gap-2 mt-2 sm:hidden">
                    {[15, 30, 60, 90, 120].map(duration => (
                      <button
                        key={duration}
                        onClick={() => setQuickTaskDuration(duration)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          quickTaskDuration === duration 
                            ? 'bg-primary-600 text-white' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {duration}分钟
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
                <button
                  onClick={() => setShowQuickCreate(false)}
                  className="w-full sm:w-auto px-4 py-3 sm:py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                >
                  取消
                </button>
                <button
                  onClick={handleQuickTaskCreate}
                  disabled={!quickTaskTitle.trim() || loading}
                  className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
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