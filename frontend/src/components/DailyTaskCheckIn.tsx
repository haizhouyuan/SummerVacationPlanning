import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DailyTask, Task } from '../types';
import { detectNetworkAndGetApiServiceSync } from '../services/compatibleApi';
import EvidenceModal from './EvidenceModal';

interface DailyTaskCheckInProps {
  selectedDate?: string;
  onTaskUpdate?: (task: DailyTask) => void;
  className?: string;
}

const DailyTaskCheckIn: React.FC<DailyTaskCheckInProps> = ({
  selectedDate = new Date().toISOString().split('T')[0],
  onTaskUpdate,
  className = '',
}) => {
  const { user } = useAuth();
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [updatingTasks, setUpdatingTasks] = useState<Set<string>>(new Set());
  const [selectedTask, setSelectedTask] = useState<DailyTask | null>(null);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'time' | 'priority' | 'status'>('time');
  const [dailyPointsInfo, setDailyPointsInfo] = useState<{
    currentPoints: number;
    dailyLimit: number;
    limitReached: boolean;
  }>({ currentPoints: 0, dailyLimit: 20, limitReached: false });

  const statusOptions = [
    { key: 'all', label: '全部', emoji: '📋', color: 'bg-gray-100 text-gray-700' },
    { key: 'planned', label: '计划中', emoji: '📅', color: 'bg-blue-100 text-blue-700' },
    { key: 'in_progress', label: '进行中', emoji: '🏃‍♂️', color: 'bg-yellow-100 text-yellow-700' },
    { key: 'completed', label: '已完成', emoji: '✅', color: 'bg-green-100 text-green-700' },
    { key: 'skipped', label: '已跳过', emoji: '⏭️', color: 'bg-gray-100 text-gray-500' },
  ];

  const priorityOrder = { high: 3, medium: 2, low: 1 };

  useEffect(() => {
    loadDailyTasks();
    loadDailyPointsInfo();
  }, [selectedDate]);

  const loadDailyPointsInfo = async () => {
    try {
      // Try to get current daily points from the user's stats
      const apiService = detectNetworkAndGetApiServiceSync();
      const response = await apiService.getDashboardStats();
      if (response.success && response.data.dailyPoints !== undefined) {
        setDailyPointsInfo({
          currentPoints: response.data.dailyPoints,
          dailyLimit: 20,
          limitReached: response.data.dailyPoints >= 20,
        });
      }
    } catch (error: any) {
      console.error('Error loading daily points info:', error);
    }
  };

  const loadDailyTasks = async () => {
    try {
      setLoading(true);
      setError('');
      const apiService = detectNetworkAndGetApiServiceSync();
      const response = await apiService.getDailyTasks({ date: selectedDate });
      setDailyTasks((response as any).data.dailyTasks || []);
    } catch (error: any) {
      console.error('Error loading daily tasks:', error);
      setError(error.message || '加载每日任务失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (dailyTask: DailyTask, newStatus: string) => {
    try {
      setUpdatingTasks(prev => new Set(prev).add(dailyTask.id));
      
      const updateData: any = { status: newStatus };
      
      // If completing task and it requires evidence, show evidence modal
      if (newStatus === 'completed' && dailyTask.task?.requiresEvidence) {
        setSelectedTask(dailyTask);
        setShowEvidenceModal(true);
        return;
      }

      const apiService = detectNetworkAndGetApiServiceSync();
      const response = await apiService.updateDailyTaskStatus(
        dailyTask.id,
        updateData
      );

      const updatedTask = (response as any).data.dailyTask;
      setDailyTasks(prev =>
        prev.map(task => task.id === dailyTask.id ? { ...task, ...updatedTask } : task)
      );

      onTaskUpdate?.(updatedTask);

      // Show points earned notification only for approved tasks
      if (newStatus === 'completed' && updatedTask.pointsEarned > 0 && updatedTask.approvalStatus === 'approved') {
        showPointsNotification(updatedTask.pointsEarned);
      }

    } catch (error: any) {
      console.error('Error updating task status:', error);
      alert(error.message || '更新任务状态失败，请重试');
    } finally {
      setUpdatingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(dailyTask.id);
        return newSet;
      });
    }
  };

  const handleEvidenceSubmit = async (evidenceData: any) => {
    if (!selectedTask) return;

    try {
      setUpdatingTasks(prev => new Set(prev).add(selectedTask.id));

      const updateData = {
        status: 'completed',
        evidenceText: evidenceData.evidenceText,
        evidenceMedia: evidenceData.evidenceMedia,
        notes: evidenceData.notes,
        isPublic: evidenceData.isPublic,
      };

      const apiService = detectNetworkAndGetApiServiceSync();
      const response = await apiService.updateDailyTaskStatus(
        selectedTask.id,
        updateData
      );

      const updatedTask = (response as any).data.dailyTask;
      setDailyTasks(prev =>
        prev.map(task => task.id === selectedTask.id ? { ...task, ...updatedTask } : task)
      );

      onTaskUpdate?.(updatedTask);
      setShowEvidenceModal(false);
      setSelectedTask(null);

      // Show points earned notification only for approved tasks
      if (updatedTask.pointsEarned > 0 && updatedTask.approvalStatus === 'approved') {
        showPointsNotification(updatedTask.pointsEarned);
      }

    } catch (error: any) {
      console.error('Error submitting evidence:', error);
      alert(error.message || '提交证据失败，请重试');
    } finally {
      setUpdatingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(selectedTask.id);
        return newSet;
      });
    }
  };

  const showPointsNotification = (points: number) => {
    // Create a temporary notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce';
    notification.innerHTML = `
      <div class="flex items-center">
        <span class="text-xl mr-2">🎉</span>
        <span class="font-medium">获得 ${points} 积分！</span>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  };

  const getStatusColor = (status: string) => {
    const statusOption = statusOptions.find(s => s.key === status);
    return statusOption?.color || 'bg-gray-100 text-gray-700';
  };

  const getStatusEmoji = (status: string) => {
    const statusOption = statusOptions.find(s => s.key === status);
    return statusOption?.emoji || '📋';
  };

  const getPriorityEmoji = (priority: string) => {
    const emojiMap = {
      high: '🔴',
      medium: '🟡',
      low: '🟢',
    };
    return emojiMap[priority as keyof typeof emojiMap] || '⚪';
  };

  const filteredAndSortedTasks = React.useMemo(() => {
    let filtered = statusFilter === 'all' 
      ? dailyTasks 
      : dailyTasks.filter(task => task.status === statusFilter);

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'time':
          if (a.plannedTime && b.plannedTime) {
            return a.plannedTime.localeCompare(b.plannedTime);
          }
          return a.plannedTime ? -1 : 1;
        case 'priority':
          const aPriority = (a as any).priority || 'medium';
          const bPriority = (b as any).priority || 'medium';
          return priorityOrder[bPriority as keyof typeof priorityOrder] - priorityOrder[aPriority as keyof typeof priorityOrder];
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });
  }, [dailyTasks, statusFilter, sortBy]);

  const getTaskStats = () => {
    const total = dailyTasks.length;
    const completed = dailyTasks.filter(t => t.status === 'completed').length;
    const inProgress = dailyTasks.filter(t => t.status === 'in_progress').length;
    const planned = dailyTasks.filter(t => t.status === 'planned').length;
    const totalPoints = dailyTasks.reduce((sum, task) => sum + task.pointsEarned, 0);
    const potentialPoints = dailyTasks.reduce((sum, task) => {
      if (task.status === 'completed') {
        return sum + task.pointsEarned;
      }
      return sum + (task.task?.points || 0);
    }, 0);
    
    // Update daily points info based on current task stats
    const currentEarnedPoints = dailyPointsInfo.currentPoints > 0 ? dailyPointsInfo.currentPoints : totalPoints;
    if (dailyPointsInfo.currentPoints === 0 && totalPoints > 0) {
      setDailyPointsInfo(prev => ({
        ...prev,
        currentPoints: totalPoints,
        limitReached: totalPoints >= prev.dailyLimit
      }));
    }
    
    return { total, completed, inProgress, planned, totalPoints, potentialPoints };
  };

  const stats = getTaskStats();

  if (!user) {
    return <div className="text-center py-8">请先登录</div>;
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm ${className}`}>
      {/* Header with Stats */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <span className="text-2xl mr-3">📱</span>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                每日打卡 ({selectedDate})
              </h2>
              <p className="text-sm text-gray-600">
                管理今日任务进度和状态
              </p>
            </div>
          </div>
          
          {/* Stats Cards */}
          <div className="flex space-x-4">
            <div className="bg-blue-50 px-3 py-2 rounded-lg">
              <div className="text-xs text-blue-600">总任务</div>
              <div className="text-lg font-bold text-blue-700">{stats.total}</div>
            </div>
            <div className="bg-green-50 px-3 py-2 rounded-lg">
              <div className="text-xs text-green-600">已完成</div>
              <div className="text-lg font-bold text-green-700">{stats.completed}</div>
            </div>
            <div className="bg-yellow-50 px-3 py-2 rounded-lg">
              <div className="text-xs text-yellow-600">获得积分</div>
              <div className="text-lg font-bold text-yellow-700">{stats.totalPoints}</div>
            </div>
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {statusOptions.map(status => (
              <button
                key={status.key}
                onClick={() => setStatusFilter(status.key)}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  statusFilter === status.key
                    ? 'bg-primary-600 text-white'
                    : status.color
                }`}
              >
                <span>{status.emoji}</span>
                <span>{status.label}</span>
                {status.key !== 'all' && (
                  <span className="ml-1 bg-white bg-opacity-20 px-1 rounded text-xs">
                    {status.key === 'all' ? stats.total : dailyTasks.filter(t => t.status === status.key).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">排序:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="time">按时间</option>
              <option value="priority">按优先级</option>
              <option value="status">按状态</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <span className="text-red-500 mr-2">⚠️</span>
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">加载任务中...</p>
          </div>
        ) : filteredAndSortedTasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">
              {statusFilter === 'all' ? '📅' : getStatusEmoji(statusFilter)}
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {statusFilter === 'all' ? '今日暂无任务' : `暂无${statusOptions.find(s => s.key === statusFilter)?.label}的任务`}
            </h3>
            <p className="text-gray-600">
              {statusFilter === 'all' ? '请先去任务规划页面添加一些任务' : '请切换到其他状态查看任务'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedTasks.map((dailyTask) => (
              <div
                key={dailyTask.id}
                className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-start justify-between">
                  {/* Task Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg">{dailyTask.task?.category ? 
                        (['exercise', 'reading', 'chores', 'learning', 'creativity', 'other'].includes(dailyTask.task.category) ?
                          { exercise: '🏃‍♂️', reading: '📚', chores: '🧹', learning: '🧠', creativity: '🎨', other: '⭐' }[dailyTask.task.category] :
                          '📋'
                        ) : '📋'
                      }</span>
                      <h3 className="font-semibold text-gray-900 truncate">
                        {dailyTask.task?.title || '未知任务'}
                      </h3>
                      {(dailyTask as any).priority && (
                        <span className="flex-shrink-0">
                          {getPriorityEmoji((dailyTask as any).priority)}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {dailyTask.task?.description}
                    </p>

                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      {dailyTask.plannedTime && (
                        <span className="flex items-center">
                          <span className="mr-1">⏰</span>
                          {dailyTask.plannedTime}
                        </span>
                      )}
                      <span className="flex items-center">
                        <span className="mr-1">⭐</span>
                        {dailyTask.task?.points || 0} 积分
                      </span>
                      <span className="flex items-center">
                        <span className="mr-1">⏱️</span>
                        {dailyTask.task?.estimatedTime || 0} 分钟
                      </span>
                      {dailyTask.status === 'completed' && dailyTask.approvalStatus === 'pending' && (
                        <span className="flex items-center text-yellow-600 font-medium">
                          <span className="mr-1">⏳</span>
                          等待家长审批
                        </span>
                      )}
                      {dailyTask.status === 'completed' && dailyTask.approvalStatus === 'approved' && dailyTask.pointsEarned > 0 && (
                        <span className="flex items-center text-green-600 font-medium">
                          <span className="mr-1">🎉</span>
                          已获得 {dailyTask.pointsEarned} 积分
                        </span>
                      )}
                      {dailyTask.status === 'completed' && dailyTask.approvalStatus === 'rejected' && (
                        <span className="flex items-center text-red-600 font-medium">
                          <span className="mr-1">❌</span>
                          家长已拒绝
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status and Actions */}
                  <div className="flex flex-col items-end space-y-2 ml-4">
                    {/* Current Status */}
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(dailyTask.status)} flex items-center`}>
                      <span className="mr-1">{getStatusEmoji(dailyTask.status)}</span>
                      {statusOptions.find(s => s.key === dailyTask.status)?.label || dailyTask.status}
                    </span>

                    {/* Status Actions */}
                    <div className="flex space-x-1">
                      {dailyTask.status === 'planned' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(dailyTask, 'in_progress')}
                            disabled={updatingTasks.has(dailyTask.id)}
                            className="px-3 py-1 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded-lg text-xs font-medium transition-colors duration-200 disabled:opacity-50"
                          >
                            开始
                          </button>
                          <button
                            onClick={() => handleStatusChange(dailyTask, 'skipped')}
                            disabled={updatingTasks.has(dailyTask.id)}
                            className="px-3 py-1 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg text-xs font-medium transition-colors duration-200 disabled:opacity-50"
                          >
                            跳过
                          </button>
                        </>
                      )}

                      {dailyTask.status === 'in_progress' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(dailyTask, 'completed')}
                            disabled={updatingTasks.has(dailyTask.id)}
                            className="px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg text-xs font-medium transition-colors duration-200 disabled:opacity-50"
                          >
                            完成
                          </button>
                          <button
                            onClick={() => handleStatusChange(dailyTask, 'planned')}
                            disabled={updatingTasks.has(dailyTask.id)}
                            className="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg text-xs font-medium transition-colors duration-200 disabled:opacity-50"
                          >
                            暂停
                          </button>
                        </>
                      )}

                      {dailyTask.status === 'completed' && dailyTask.task?.requiresEvidence && (
                        <button
                          onClick={() => {
                            setSelectedTask(dailyTask);
                            setShowEvidenceModal(true);
                          }}
                          className="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg text-xs font-medium transition-colors duration-200"
                        >
                          查看证据
                        </button>
                      )}

                      {(dailyTask.status === 'completed' || dailyTask.status === 'skipped') && (
                        <button
                          onClick={() => handleStatusChange(dailyTask, 'planned')}
                          disabled={updatingTasks.has(dailyTask.id)}
                          className="px-3 py-1 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg text-xs font-medium transition-colors duration-200 disabled:opacity-50"
                        >
                          重置
                        </button>
                      )}
                    </div>

                    {updatingTasks.has(dailyTask.id) && (
                      <div className="flex items-center text-xs text-gray-500">
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-400 mr-2"></div>
                        更新中...
                      </div>
                    )}
                  </div>
                </div>

                {/* Evidence Preview */}
                {(dailyTask.evidenceText || (dailyTask as any).evidenceMedia?.length > 0) && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">任务证据:</div>
                    {dailyTask.evidenceText && (
                      <p className="text-sm text-gray-700 bg-white p-2 rounded border line-clamp-2">
                        {dailyTask.evidenceText}
                      </p>
                    )}
                    {(dailyTask as any).evidenceMedia?.length > 0 && (
                      <div className="flex space-x-2 mt-2">
                        {(dailyTask as any).evidenceMedia.slice(0, 3).map((media: any, index: number) => (
                          <div key={index} className="w-12 h-12 bg-gray-200 rounded border flex items-center justify-center text-xs">
                            {media.type === 'image' ? '📷' : '🎥'}
                          </div>
                        ))}
                        {(dailyTask as any).evidenceMedia.length > 3 && (
                          <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center text-xs text-gray-500">
                            +{(dailyTask as any).evidenceMedia.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Evidence Modal */}
      {showEvidenceModal && selectedTask && (
        <EvidenceModal
          task={selectedTask.task!}
          dailyTask={selectedTask}
          onClose={() => {
            setShowEvidenceModal(false);
            setSelectedTask(null);
          }}
          onSubmit={handleEvidenceSubmit}
        />
      )}
    </div>
  );
};

export default DailyTaskCheckIn;