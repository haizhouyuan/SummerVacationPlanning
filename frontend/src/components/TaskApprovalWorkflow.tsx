import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
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
  evidence: Array<{
    type: 'text' | 'photo' | 'video' | 'audio';
    content: string;
    fileName?: string;
    fileSize?: number;
    timestamp: Date;
  }>;
  notes: string;
  submittedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
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

  // Mock pending tasks data
  const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([
    {
      id: '1',
      studentId: '1',
      studentName: '小明',
      task: {
        id: 't1',
        title: '读书30分钟',
        description: '阅读课外书籍并写读后感',
        category: 'reading',
        points: 10,
      },
      evidence: [
        {
          type: 'text',
          content: '今天我读了《小王子》的第一章，很有趣！小王子来自一个很小的星球，他遇到了很多奇怪的大人。我学到了要保持童心，用心去看世界。',
          timestamp: new Date(),
        },
        {
          type: 'photo',
          content: 'https://example.com/book-photo.jpg',
          fileName: 'reading-photo.jpg',
          fileSize: 1024000,
          timestamp: new Date(),
        },
      ],
      notes: '读得很认真，还做了笔记！',
      submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      status: 'pending',
    },
    {
      id: '2',
      studentId: '2',
      studentName: '小红',
      task: {
        id: 't2',
        title: '户外运动30分钟',
        description: '进行户外体育活动',
        category: 'exercise',
        points: 15,
      },
      evidence: [
        {
          type: 'text',
          content: '今天和爸爸一起去公园跑步了，跑了3圈，大概30分钟。还做了一些拉伸运动。',
          timestamp: new Date(),
        },
        {
          type: 'video',
          content: 'https://example.com/exercise-video.mp4',
          fileName: 'running-video.mp4',
          fileSize: 5120000,
          timestamp: new Date(),
        },
      ],
      notes: '今天天气很好，运动完感觉很舒服！',
      submittedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      status: 'pending',
    },
  ]);

  const [approvedTasks] = useState<PendingTask[]>([
    {
      id: '3',
      studentId: '1',
      studentName: '小明',
      task: {
        id: 't3',
        title: '练习书法',
        description: '练习汉字书写',
        category: 'art',
        points: 12,
      },
      evidence: [
        {
          type: 'text',
          content: '今天练习了"静心"两个字，写了20遍。',
          timestamp: new Date(),
        },
      ],
      notes: '字写得越来越好看了！',
      submittedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      status: 'approved',
    },
  ]);

  const [rejectedTasks] = useState<PendingTask[]>([]);

  const handleApproveTask = (taskId: string) => {
    const task = pendingTasks.find(t => t.id === taskId);
    if (task) {
      // In a real app, this would call an API
      console.log('Approving task:', taskId, 'with bonus points:', bonusPoints, 'notes:', approvalNotes);
      setPendingTasks(prev => prev.filter(t => t.id !== taskId));
      setSelectedTask(null);
      setApprovalNotes('');
      setBonusPoints(0);
    }
  };

  const handleRejectTask = (taskId: string) => {
    const task = pendingTasks.find(t => t.id === taskId);
    if (task) {
      // In a real app, this would call an API
      console.log('Rejecting task:', taskId, 'notes:', approvalNotes);
      setPendingTasks(prev => prev.filter(t => t.id !== taskId));
      setSelectedTask(null);
      setApprovalNotes('');
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return '刚刚';
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    return date.toLocaleDateString();
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
                            提交于 {formatTimeAgo(task.submittedAt)}
                          </span>
                          <span className="text-xs bg-cartoon-blue/10 text-cartoon-blue px-2 py-1 rounded-cartoon">
                            {task.evidence.length} 个证据
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
                        {selectedTask.evidence.map((evidence, index) => (
                          <div key={index} className="bg-white rounded-cartoon p-4">
                            {evidence.type === 'text' && (
                              <div>
                                <h5 className="text-sm font-medium text-cartoon-dark mb-2">📝 文字描述</h5>
                                <p className="text-sm text-cartoon-gray">{evidence.content}</p>
                              </div>
                            )}
                            {(evidence.type === 'photo' || evidence.type === 'video' || evidence.type === 'audio') && (
                              <div>
                                <h5 className="text-sm font-medium text-cartoon-dark mb-2">
                                  {evidence.type === 'photo' && '📸 照片证据'}
                                  {evidence.type === 'video' && '🎥 视频证据'}
                                  {evidence.type === 'audio' && '🎵 音频证据'}
                                </h5>
                                <MediaPreview
                                  files={[{
                                    url: evidence.content,
                                    type: evidence.type === 'photo' ? 'image/jpeg' : evidence.type === 'video' ? 'video/mp4' : 'audio/mp3',
                                    name: evidence.fileName || `${evidence.type}.${evidence.type === 'photo' ? 'jpg' : evidence.type === 'video' ? 'mp4' : 'mp3'}`,
                                    size: evidence.fileSize
                                  }]}
                                  readOnly={true}
                                />
                              </div>
                            )}
                          </div>
                        ))}
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
                              className="flex-1 bg-gradient-to-r from-cartoon-red to-danger-400 text-white py-2 px-4 rounded-cartoon font-medium hover:shadow-cartoon-lg transition-all duration-200"
                            >
                              ❌ 拒绝
                            </button>
                            <button
                              onClick={() => handleApproveTask(selectedTask.id)}
                              className="flex-1 bg-gradient-to-r from-cartoon-green to-success-400 text-white py-2 px-4 rounded-cartoon font-medium hover:shadow-cartoon-lg transition-all duration-200"
                            >
                              ✅ 通过
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