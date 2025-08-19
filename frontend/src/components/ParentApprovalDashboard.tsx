import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DailyTask, Task, User } from '../types';
import { apiService } from '../services/api';
import EvidenceModal from './EvidenceModal';
import MediaPreview from './MediaPreview';

interface PendingTask {
  id: string;
  studentId: string;
  studentName: string;
  task: {
    id: string;
    title: string;
    description: string;
    category: string;
    points: number;
  };
  evidenceText?: string;
  evidenceMedia: any[];
  notes: string;
  submittedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  pointsEarned: number;
}

interface ApprovalStats {
  totalPending: number;
  totalApproved: number;
  totalRejected: number;
  totalPointsAwarded: number;
}

const ParentApprovalDashboard: React.FC = () => {
  const { user } = useAuth();
  const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [batchApproving, setBatchApproving] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedTaskForModal, setSelectedTaskForModal] = useState<PendingTask | null>(null);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [approvalStats, setApprovalStats] = useState<ApprovalStats | null>(null);
  const [filterStudent, setFilterStudent] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'student' | 'points'>('date');
  
  // Batch approval settings
  const [batchApprovalNotes, setBatchApprovalNotes] = useState('');
  const [batchBonusPoints, setBatchBonusPoints] = useState<{ [taskId: string]: number }>({});

  const students = React.useMemo(() => {
    const uniqueStudents = Array.from(
      new Set(pendingTasks.map(task => JSON.stringify({ id: task.studentId, name: task.studentName })))
    ).map(str => JSON.parse(str));
    return uniqueStudents;
  }, [pendingTasks]);

  useEffect(() => {
    if (user?.role === 'parent') {
      loadPendingTasks();
      loadApprovalStats();
    }
  }, [user]);

  const loadPendingTasks = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/daily-tasks/pending-approval', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPendingTasks(data.data.tasks || []);
      } else {
        throw new Error('Failed to load pending tasks');
      }
    } catch (error: any) {
      console.error('Error loading pending tasks:', error);
      setError(error.message || '加载待审批任务失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const loadApprovalStats = async () => {
    try {
      // This would be a new API endpoint to get approval statistics
      // For now, calculate from pending tasks
      const stats: ApprovalStats = {
        totalPending: pendingTasks.length,
        totalApproved: 0, // Would come from API
        totalRejected: 0, // Would come from API
        totalPointsAwarded: 0, // Would come from API
      };
      setApprovalStats(stats);
    } catch (error) {
      console.error('Error loading approval stats:', error);
    }
  };

  const handleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedTasks.size === filteredAndSortedTasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(filteredAndSortedTasks.map(task => task.id)));
    }
  };

  const handleSingleApproval = async (taskId: string, action: 'approve' | 'reject', bonusPoints?: number) => {
    try {
      const response = await fetch(`/api/daily-tasks/${taskId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          action,
          approvalNotes: batchApprovalNotes || `${action === 'approve' ? '任务完成良好' : '需要改进'}`,
          bonusPoints: bonusPoints || 0,
        }),
      });

      if (response.ok) {
        await loadPendingTasks();
        showNotification(`任务${action === 'approve' ? '通过' : '拒绝'}成功！`);
      } else {
        throw new Error(`Failed to ${action} task`);
      }
    } catch (error: any) {
      console.error(`Error ${action}ing task:`, error);
      alert(error.message || `${action === 'approve' ? '通过' : '拒绝'}任务失败，请重试`);
    }
  };

  const handleBatchApproval = async (action: 'approve' | 'reject') => {
    if (selectedTasks.size === 0) {
      alert('请先选择要批量处理的任务');
      return;
    }

    try {
      setBatchApproving(true);
      
      const response = await fetch('/api/daily-tasks/batch-approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          dailyTaskIds: Array.from(selectedTasks),
          action,
          approvalNotes: batchApprovalNotes || `批量${action === 'approve' ? '通过' : '拒绝'}`,
          bonusPoints: batchBonusPoints,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const { successful, failed } = data.data.summary;
        
        setSelectedTasks(new Set());
        setBatchApprovalNotes('');
        setBatchBonusPoints({});
        await loadPendingTasks();
        
        showNotification(`批量操作完成: ${successful} 个成功, ${failed} 个失败`);
      } else {
        throw new Error('Batch approval failed');
      }
    } catch (error: any) {
      console.error('Error in batch approval:', error);
      alert(error.message || '批量处理失败，请重试');
    } finally {
      setBatchApproving(false);
    }
  };

  const showNotification = (message: string) => {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    notification.innerHTML = `
      <div class="flex items-center">
        <span class="text-xl mr-2">✅</span>
        <span class="font-medium">${message}</span>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  };

  const handleBonusPointsChange = (taskId: string, points: number) => {
    setBatchBonusPoints(prev => ({
      ...prev,
      [taskId]: points,
    }));
  };

  const viewTaskEvidence = (task: PendingTask) => {
    setSelectedTaskForModal(task);
    setShowEvidenceModal(true);
  };

  const getCategoryEmoji = (category: string) => {
    const emojiMap = {
      exercise: '🏃‍♂️',
      reading: '📚',
      chores: '🧹',
      learning: '🧠',
      creativity: '🎨',
      other: '⭐',
    };
    return emojiMap[category as keyof typeof emojiMap] || '📋';
  };

  const filteredAndSortedTasks = React.useMemo(() => {
    let filtered = filterStudent === 'all' 
      ? pendingTasks 
      : pendingTasks.filter(task => task.studentId === filterStudent);

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
        case 'student':
          return a.studentName.localeCompare(b.studentName);
        case 'points':
          return b.pointsEarned - a.pointsEarned;
        default:
          return 0;
      }
    });
  }, [pendingTasks, filterStudent, sortBy]);

  if (!user || user.role !== 'parent') {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="text-center">
          <span className="text-4xl mb-4 block">🔒</span>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">访问受限</h3>
          <p className="text-gray-600">只有家长可以访问审批仪表板</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Stats */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <span className="text-2xl mr-3">👨‍👩‍👧‍👦</span>
            <div>
              <h2 className="text-xl font-bold text-gray-900">家长审批仪表板</h2>
              <p className="text-sm text-gray-600">管理孩子的任务完成情况</p>
            </div>
          </div>
          
          <div className="flex space-x-4">
            <div className="bg-yellow-50 px-4 py-3 rounded-lg text-center">
              <div className="text-xs text-yellow-600">待审批</div>
              <div className="text-xl font-bold text-yellow-700">{pendingTasks.length}</div>
            </div>
            {approvalStats && (
              <>
                <div className="bg-green-50 px-4 py-3 rounded-lg text-center">
                  <div className="text-xs text-green-600">已通过</div>
                  <div className="text-xl font-bold text-green-700">{approvalStats.totalApproved}</div>
                </div>
                <div className="bg-blue-50 px-4 py-3 rounded-lg text-center">
                  <div className="text-xs text-blue-600">积分奖励</div>
                  <div className="text-xl font-bold text-blue-700">{approvalStats.totalPointsAwarded}</div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Filters and Batch Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center space-x-4">
            <select
              value={filterStudent}
              onChange={(e) => setFilterStudent(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">所有孩子</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="date">按提交时间</option>
              <option value="student">按学生姓名</option>
              <option value="points">按积分高低</option>
            </select>
          </div>

          {selectedTasks.size > 0 && (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">
                已选择 {selectedTasks.size} 个任务
              </span>
              <input
                type="text"
                placeholder="批量审批备注..."
                value={batchApprovalNotes}
                onChange={(e) => setBatchApprovalNotes(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                onClick={() => handleBatchApproval('approve')}
                disabled={batchApproving}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors duration-200"
              >
                批量通过
              </button>
              <button
                onClick={() => handleBatchApproval('reject')}
                disabled={batchApproving}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors duration-200"
              >
                批量拒绝
              </button>
            </div>
          )}
        </div>

        {/* Select All */}
        {filteredAndSortedTasks.length > 0 && (
          <div className="mb-4">
            <button
              onClick={handleSelectAll}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              {selectedTasks.size === filteredAndSortedTasks.length ? '取消全选' : '全选'}
            </button>
          </div>
        )}
      </div>

      {/* Task List */}
      <div className="bg-white rounded-xl shadow-sm">
        {error && (
          <div className="p-4 bg-red-50 border-b border-red-200">
            <div className="flex items-center">
              <span className="text-red-500 mr-2">⚠️</span>
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">加载待审批任务中...</p>
          </div>
        ) : filteredAndSortedTasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {filterStudent === 'all' ? '暂无待审批任务' : '该学生暂无待审批任务'}
            </h3>
            <p className="text-gray-600">
              {filterStudent === 'all' ? '所有任务都已处理完毕' : '请选择其他学生或查看所有学生'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredAndSortedTasks.map((task) => (
              <div key={task.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-start space-x-4">
                  {/* Selection Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedTasks.has(task.id)}
                    onChange={() => handleTaskSelection(task.id)}
                    className="mt-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />

                  {/* Task Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">{getCategoryEmoji(task.task.category)}</span>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {task.task.title}
                          </h3>
                          <p className="text-sm text-gray-600">
                            学生: {task.studentName} • {task.task.points} 积分
                          </p>
                        </div>
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        <div>提交时间</div>
                        <div>{new Date(task.submittedAt).toLocaleString('zh-CN')}</div>
                      </div>
                    </div>

                    <p className="text-sm text-gray-700 mb-3">
                      {task.task.description}
                    </p>

                    {/* Evidence Preview */}
                    {(task.evidenceText || task.evidenceMedia.length > 0) && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">任务证据</span>
                          <button
                            onClick={() => viewTaskEvidence(task)}
                            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                          >
                            查看详情 →
                          </button>
                        </div>
                        
                        {task.evidenceText && (
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                            {task.evidenceText}
                          </p>
                        )}
                        
                        {task.evidenceMedia.length > 0 && (
                          <div className="flex space-x-2">
                            {task.evidenceMedia.slice(0, 3).map((media, index) => (
                              <div key={index} className="w-16 h-16 bg-gray-200 rounded border flex items-center justify-center text-xs">
                                {media.type === 'image' ? '📷' : '🎥'}
                              </div>
                            ))}
                            {task.evidenceMedia.length > 3 && (
                              <div className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center text-xs text-gray-500">
                                +{task.evidenceMedia.length - 3}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Bonus Points Input */}
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        奖励积分 (可选)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={batchBonusPoints[task.id] || 0}
                        onChange={(e) => handleBonusPointsChange(task.id, parseInt(e.target.value) || 0)}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="0"
                      />
                      <span className="text-xs text-gray-500 ml-2">
                        基础 {task.pointsEarned} 分 + 奖励分
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleSingleApproval(task.id, 'approve', batchBonusPoints[task.id])}
                        className="px-4 py-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg text-sm font-medium transition-colors duration-200"
                      >
                        ✅ 通过
                      </button>
                      <button
                        onClick={() => handleSingleApproval(task.id, 'reject')}
                        className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-sm font-medium transition-colors duration-200"
                      >
                        ❌ 拒绝
                      </button>
                      <button
                        onClick={() => viewTaskEvidence(task)}
                        className="px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg text-sm font-medium transition-colors duration-200"
                      >
                        👀 查看证据
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Evidence Modal */}
      {showEvidenceModal && selectedTaskForModal && (
        <EvidenceModal
          task={selectedTaskForModal.task as Task}
          dailyTask={{
            id: selectedTaskForModal.id,
            status: 'completed',
            evidenceText: selectedTaskForModal.evidenceText,
            notes: selectedTaskForModal.notes,
            pointsEarned: selectedTaskForModal.pointsEarned,
            completedAt: selectedTaskForModal.submittedAt,
          } as any}
          onClose={() => {
            setShowEvidenceModal(false);
            setSelectedTaskForModal(null);
          }}
          onSubmit={() => {
            // Evidence is read-only in approval dashboard
            setShowEvidenceModal(false);
            setSelectedTaskForModal(null);
          }}
        />
      )}
    </div>
  );
};

export default ParentApprovalDashboard;