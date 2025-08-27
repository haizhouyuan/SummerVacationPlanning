import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import MediaPreview from './MediaPreview';
import TaskCategoryIcon from './TaskCategoryIcon';
import PointsDisplay from './PointsDisplay';

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
  evidenceMedia?: Array<{
    type: string;
    url: string;
    fileName?: string;
    fileSize?: number;
  }>;
  notes: string;
  submittedAt: Date | string; // 支持Date对象和字符串格式
  status: 'pending' | 'approved' | 'rejected';
  pointsEarned: number;
}

interface TaskApprovalWorkflowProps {
  isOpen: boolean;
  onClose: () => void;
}

const TaskApprovalWorkflow: React.FC<TaskApprovalWorkflowProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [selectedTask, setSelectedTask] = useState<PendingTask | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [bonusPoints, setBonusPoints] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([]);
  const [approvedTasks, setApprovedTasks] = useState<PendingTask[]>([]);
  const [rejectedTasks, setRejectedTasks] = useState<PendingTask[]>([]);

  // Load pending approval tasks
  useEffect(() => {
    if (isOpen && user?.role === 'parent') {
      loadPendingTasks();
    }
  }, [isOpen, user]);

  const loadPendingTasks = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await apiService.getPendingApprovalTasks() as any;
      if (response.success) {
        const tasks = response.data.tasks || [];
        
        // 转换日期字段并处理数据
        const processedTasks = tasks.map((task: any) => ({
          ...task,
          submittedAt: task.submittedAt ? (typeof task.submittedAt === 'string' ? new Date(task.submittedAt) : task.submittedAt) : new Date()
        }));
        
        // Separate tasks by approval status
        setPendingTasks(processedTasks.filter((task: PendingTask) => task.status === 'pending'));
        setApprovedTasks(processedTasks.filter((task: PendingTask) => task.status === 'approved'));
        setRejectedTasks(processedTasks.filter((task: PendingTask) => task.status === 'rejected'));
      } else {
        setError('加载待审批任务失败');
      }
    } catch (error: any) {
      console.error('Error loading pending tasks:', error);
      setError(error.message || '网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveTask = async (taskId: string) => {
    try {
      setLoading(true);
      
      const response = await apiService.approveTask(taskId, {
        action: 'approve',
        approvalNotes,
        bonusPoints: bonusPoints > 0 ? bonusPoints : undefined,
      }) as any;
      
      if (response.success) {
        // Move task from pending to approved
        const task = pendingTasks.find(t => t.id === taskId);
        if (task) {
          const updatedTask = { ...task, status: 'approved' as const };
          setPendingTasks(prev => prev.filter(t => t.id !== taskId));
          setApprovedTasks(prev => [...prev, updatedTask]);
        }
        
        setSelectedTask(null);
        setApprovalNotes('');
        setBonusPoints(0);
      } else {
        setError('审批失败，请重试');
      }
    } catch (error: any) {
      console.error('Error approving task:', error);
      setError(error.message || '审批失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectTask = async (taskId: string) => {
    try {
      setLoading(true);
      
      const response = await apiService.approveTask(taskId, {
        action: 'reject',
        approvalNotes,
      }) as any;
      
      if (response.success) {
        // Move task from pending to rejected
        const task = pendingTasks.find(t => t.id === taskId);
        if (task) {
          const updatedTask = { ...task, status: 'rejected' as const };
          setPendingTasks(prev => prev.filter(t => t.id !== taskId));
          setRejectedTasks(prev => [...prev, updatedTask]);
        }
        
        setSelectedTask(null);
        setApprovalNotes('');
      } else {
        setError('拒绝失败，请重试');
      }
    } catch (error: any) {
      console.error('Error rejecting task:', error);
      setError(error.message || '拒绝失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (date: Date | string) => {
    try {
      // 确保输入被转换为Date对象
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      
      // 检查日期是否有效
      if (!dateObj || isNaN(dateObj.getTime())) {
        return '时间未知';
      }

      const now = new Date();
      const diffMs = now.getTime() - dateObj.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      if (diffHours < 1) return '刚刚';
      if (diffHours < 24) return `${diffHours}小时前`;
      if (diffDays < 7) return `${diffDays}天前`;
      return dateObj.toLocaleDateString();
    } catch (error) {
      console.warn('Error formatting date:', error, 'Input:', date);
      return '时间未知';
    }
  };

  const getCurrentTasks = () => {
    switch (activeTab) {
      case 'pending': return pendingTasks;
      case 'approved': return approvedTasks;
      case 'rejected': return rejectedTasks;
      default: return [];
    }
  };

  const getTabCount = (tab: string) => {
    switch (tab) {
      case 'pending': return pendingTasks.length;
      case 'approved': return approvedTasks.length;
      case 'rejected': return rejectedTasks.length;
      default: return 0;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-cartoon-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-cartoon-lg">
        {/* Header */}
        <div className="p-6 border-b border-cartoon-light">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-cartoon-dark font-fun">✅ 任务审批</h2>
              <p className="text-cartoon-gray">审核孩子提交的任务完成证据</p>
              {loading && <p className="text-sm text-cartoon-blue mt-1">加载中...</p>}
              {error && (
                <div className="mt-2 bg-danger-50 border border-danger-200 rounded-cartoon p-2">
                  <p className="text-sm text-danger-800">{error}</p>
                  <button
                    onClick={loadPendingTasks}
                    className="text-xs text-danger-600 hover:text-danger-800 underline mt-1"
                  >
                    重试
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-cartoon-gray hover:text-cartoon-dark text-xl font-bold p-2 rounded-cartoon hover:bg-cartoon-light transition-all duration-200"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 py-4 border-b border-cartoon-light">
          <div className="flex space-x-1">
            {[
              { id: 'pending', label: '⏳ 待审批', color: 'cartoon-orange' },
              { id: 'approved', label: '✅ 已通过', color: 'cartoon-green' },
              { id: 'rejected', label: '❌ 已拒绝', color: 'cartoon-red' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  px-4 py-2 rounded-cartoon text-sm font-medium transition-all duration-200 relative
                  ${activeTab === tab.id
                    ? `bg-${tab.color} text-white shadow-cartoon`
                    : 'text-cartoon-gray hover:bg-cartoon-light hover:text-cartoon-dark'
                  }
                `}
              >
                {tab.label}
                {getTabCount(tab.id) > 0 && (
                  <span className="absolute -top-2 -right-2 bg-cartoon-red text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {getTabCount(tab.id)}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {getCurrentTasks().length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Task List */}
              <div className="space-y-4">
                <h3 className="font-semibold text-cartoon-dark font-fun">
                  {activeTab === 'pending' && '⏳ 待审批任务'}
                  {activeTab === 'approved' && '✅ 已通过任务'}
                  {activeTab === 'rejected' && '❌ 已拒绝任务'}
                </h3>
                
                {getCurrentTasks().map((task) => (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className={`
                      bg-cartoon-light rounded-cartoon-lg p-4 cursor-pointer transition-all duration-200
                      hover:shadow-cartoon border-2
                      ${selectedTask?.id === task.id 
                        ? 'border-cartoon-green shadow-success' 
                        : 'border-transparent'
                      }
                    `}
                  >
                    <div className="flex items-start space-x-3">
                      <TaskCategoryIcon category={task.task.category} size="sm" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-cartoon-dark">{task.task.title}</h4>
                          <PointsDisplay points={task.task.points} size="sm" showLabel={false} />
                        </div>
                        <p className="text-sm text-cartoon-gray mb-2">👦 {task.studentName}</p>
                        <p className="text-sm text-cartoon-gray mb-2">{task.task.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-cartoon-gray">
                            提交于 {task.submittedAt ? formatTimeAgo(task.submittedAt) : '时间未知'}
                          </span>
                          <span className="text-xs bg-cartoon-blue/10 text-cartoon-blue px-2 py-1 rounded-cartoon">
                            {(task.evidenceText ? 1 : 0) + (task.evidenceMedia?.length || 0)} 个证据
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Task Detail */}
              <div className="bg-cartoon-light rounded-cartoon-lg p-6">
                {selectedTask ? (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-cartoon-dark mb-2 font-fun">📋 任务详情</h3>
                      <div className="bg-white rounded-cartoon p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <TaskCategoryIcon category={selectedTask.task.category} size="md" />
                          <div>
                            <h4 className="font-semibold text-cartoon-dark">{selectedTask.task.title}</h4>
                            <p className="text-sm text-cartoon-gray">{selectedTask.task.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-cartoon-gray">👦 {selectedTask.studentName}</span>
                          <PointsDisplay points={selectedTask.task.points} size="sm" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-cartoon-dark mb-2 font-fun">📎 提交证据</h3>
                      <div className="space-y-3">
                        {selectedTask.evidenceText && (
                          <div className="bg-white rounded-cartoon p-4">
                            <h5 className="text-sm font-medium text-cartoon-dark mb-2">📝 文字描述</h5>
                            <p className="text-sm text-cartoon-gray">{selectedTask.evidenceText}</p>
                          </div>
                        )}
                        {selectedTask.evidenceMedia && selectedTask.evidenceMedia.map((media, index) => (
                          <div key={index} className="bg-white rounded-cartoon p-4">
                            <h5 className="text-sm font-medium text-cartoon-dark mb-2">
                              {media.type.startsWith('image') && '📸 照片证据'}
                              {media.type.startsWith('video') && '🎥 视频证据'}
                              {media.type.startsWith('audio') && '🎵 音频证据'}
                            </h5>
                            <MediaPreview
                              files={[{
                                url: media.url,
                                type: media.type,
                                name: media.fileName || 'evidence-file',
                                size: media.fileSize
                              }]}
                              readOnly={true}
                            />
                          </div>
                        ))}
                        {!selectedTask.evidenceText && (!selectedTask.evidenceMedia || selectedTask.evidenceMedia.length === 0) && (
                          <div className="bg-white rounded-cartoon p-4 text-center text-cartoon-gray">
                            <div className="text-2xl mb-2">📎</div>
                            <p className="text-sm">暂无证据内容</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedTask.notes && (
                      <div>
                        <h3 className="font-semibold text-cartoon-dark mb-2 font-fun">💭 学生备注</h3>
                        <div className="bg-white rounded-cartoon p-4">
                          <p className="text-sm text-cartoon-gray">{selectedTask.notes}</p>
                        </div>
                      </div>
                    )}

                    {/* Approval Actions */}
                    {activeTab === 'pending' && (
                      <div>
                        <h3 className="font-semibold text-cartoon-dark mb-2 font-fun">✍️ 审批操作</h3>
                        <div className="bg-white rounded-cartoon p-4 space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-cartoon-dark mb-1">
                              审批备注
                            </label>
                            <textarea
                              value={approvalNotes}
                              onChange={(e) => setApprovalNotes(e.target.value)}
                              placeholder="为孩子留下鼓励的话语..."
                              className="w-full px-3 py-2 border border-cartoon-light rounded-cartoon focus:outline-none focus:ring-2 focus:ring-cartoon-green resize-none"
                              rows={3}
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-cartoon-dark mb-1">
                              额外奖励积分
                            </label>
                            <input
                              type="number"
                              value={bonusPoints}
                              onChange={(e) => setBonusPoints(Math.max(0, parseInt(e.target.value) || 0))}
                              min={0}
                              max={20}
                              className="w-full px-3 py-2 border border-cartoon-light rounded-cartoon focus:outline-none focus:ring-2 focus:ring-cartoon-green"
                              placeholder="0-20分额外奖励"
                            />
                            <p className="text-xs text-cartoon-gray mt-1">
                              表现优秀可给予额外积分奖励
                            </p>
                          </div>

                          <div className="flex space-x-3">
                            <button
                              onClick={() => handleRejectTask(selectedTask.id)}
                              disabled={loading}
                              className="flex-1 bg-gradient-to-r from-cartoon-red to-danger-400 text-white py-2 px-4 rounded-cartoon font-medium hover:shadow-cartoon-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              ❌ {loading ? '处理中...' : '拒绝'}
                            </button>
                            <button
                              onClick={() => handleApproveTask(selectedTask.id)}
                              disabled={loading}
                              className="flex-1 bg-gradient-to-r from-cartoon-green to-success-400 text-white py-2 px-4 rounded-cartoon font-medium hover:shadow-cartoon-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              ✅ {loading ? '处理中...' : '通过'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-cartoon-gray">
                    <div className="text-4xl mb-4">👆</div>
                    <p>请选择一个任务查看详情</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-cartoon-gray">
              <div className="text-6xl mb-4">
                {activeTab === 'pending' && '⏳'}
                {activeTab === 'approved' && '✅'}
                {activeTab === 'rejected' && '❌'}
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {activeTab === 'pending' && '暂无待审批任务'}
                {activeTab === 'approved' && '暂无已通过任务'}
                {activeTab === 'rejected' && '暂无已拒绝任务'}
              </h3>
              <p className="text-sm">
                {activeTab === 'pending' && '孩子完成任务后会出现在这里'}
                {activeTab === 'approved' && '已通过的任务会显示在这里'}
                {activeTab === 'rejected' && '已拒绝的任务会显示在这里'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskApprovalWorkflow;