import React, { useState } from 'react';
import { DailyTask } from '../types';
import EvidenceModal from './EvidenceModal';
import MediaPreview from './MediaPreview';
import TaskCategoryIcon from './TaskCategoryIcon';

interface DailyTaskCardProps {
  dailyTask: DailyTask & { task?: any };
  onStatusUpdate?: (
    dailyTaskId: string,
    status: string,
    evidenceText?: string,
    evidenceMedia?: any[],
    isPublic?: boolean,
    notes?: string
  ) => void;
  onDelete?: (dailyTaskId: string) => void;
  showActions?: boolean;
}

const DailyTaskCard: React.FC<DailyTaskCardProps> = ({
  dailyTask,
  onStatusUpdate,
  onDelete,
  showActions = true,
}) => {
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);

  const getStatusColor = (status: string) => {
    const colorMap = {
      planned: 'bg-cartoon-light text-cartoon-gray border-cartoon-gray/20',
      in_progress: 'bg-cartoon-yellow/20 text-cartoon-orange border-cartoon-orange/20',
      completed: 'bg-cartoon-green/20 text-cartoon-green border-cartoon-green/20',
      skipped: 'bg-cartoon-red/20 text-cartoon-red border-cartoon-red/20',
    };
    return colorMap[status as keyof typeof colorMap] || 'bg-cartoon-light text-cartoon-gray border-cartoon-gray/20';
  };

  const getStatusText = (status: string) => {
    const textMap = {
      planned: '计划中',
      in_progress: '进行中',
      completed: '已完成',
      skipped: '已跳过',
    };
    return textMap[status as keyof typeof textMap] || status;
  };

  const getStatusEmoji = (status: string) => {
    const emojiMap = {
      planned: '📋',
      in_progress: '⏳',
      completed: '✅',
      skipped: '⏭️',
    };
    return emojiMap[status as keyof typeof emojiMap] || '📋';
  };

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === 'completed' && dailyTask.task?.requiresEvidence) {
      setShowEvidenceModal(true);
    } else {
      onStatusUpdate?.(dailyTask.id, newStatus, '', [], false, '');
    }
  };

  const handleSubmitEvidence = (
    evidenceText: string,
    evidenceMedia: any[],
    isPublic: boolean,
    notes: string
  ) => {
    onStatusUpdate?.(dailyTask.id, 'completed', evidenceText, evidenceMedia, isPublic, notes);
    setShowEvidenceModal(false);
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <div className={`bg-white rounded-cartoon-lg shadow-cartoon border-2 transition-all duration-200 ${getStatusColor(dailyTask.status)} ${dailyTask.status === 'completed' ? 'animate-bounce-in' : ''}`}>
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="flex items-center">
                <TaskCategoryIcon 
                  category={dailyTask.task?.category || 'other'} 
                  size="sm" 
                  animated={true}
                />
                <span className="text-2xl ml-2 animate-float">{getStatusEmoji(dailyTask.status)}</span>
              </div>
              <div>
                <h3 className="font-semibold text-cartoon-dark text-lg font-fun">
                  {dailyTask.task?.title || '未知任务'}
                </h3>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`px-3 py-1 rounded-cartoon text-xs font-medium border ${getStatusColor(dailyTask.status)}`}>
                    {getStatusText(dailyTask.status)}
                  </span>
                  {dailyTask.plannedTime && (
                    <span className="text-xs text-cartoon-gray">
                      ⏰ {dailyTask.plannedTime}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-gradient-to-r from-cartoon-green to-success-400 text-white rounded-cartoon px-3 py-1 shadow-cartoon">
                <span className="text-lg font-bold">{dailyTask.pointsEarned || dailyTask.task?.points || 0}</span>
                <span className="text-sm ml-1">积分</span>
              </div>
              {dailyTask.completedAt && (
                <div className="text-xs text-cartoon-gray mt-1">
                  完成于 {formatTime(dailyTask.completedAt.toString())}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {dailyTask.task?.description && (
            <p className="text-cartoon-gray text-sm mb-3 bg-cartoon-light p-3 rounded-cartoon">
              {dailyTask.task.description}
            </p>
          )}

          {/* Evidence */}
          {dailyTask.evidence && dailyTask.evidence.length > 0 && (
            <div className="mb-3">
              <h4 className="text-sm font-medium text-gray-700 mb-2">📎 提交的证据:</h4>
              <div className="space-y-2">
                {dailyTask.evidence.map((evidence, index) => (
                  <div key={index} className="p-2 bg-gray-50 rounded-lg">
                    {evidence.type === 'text' && (
                      <p className="text-sm text-gray-700">{evidence.content}</p>
                    )}
                    {(evidence.type === 'photo' || evidence.type === 'video' || evidence.type === 'audio') && (
                      <MediaPreview 
                        files={[{
                          url: evidence.content,
                          type: evidence.type === 'photo' ? 'image/jpeg' : evidence.type === 'video' ? 'video/mp4' : 'audio/mp3',
                          name: evidence.fileName || `${evidence.type}.${evidence.type === 'photo' ? 'jpg' : evidence.type === 'video' ? 'mp4' : 'mp3'}`,
                          size: evidence.fileSize
                        }]}
                        readOnly={true}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {dailyTask.notes && (
            <div className="mb-3">
              <h4 className="text-sm font-medium text-gray-700 mb-1">💭 备注:</h4>
              <p className="text-sm text-gray-600">{dailyTask.notes}</p>
            </div>
          )}

          {/* Actions */}
          {showActions && dailyTask.status !== 'completed' && (
            <div className="flex gap-2 pt-3 border-t border-cartoon-light">
              {dailyTask.status === 'planned' && (
                <>
                  <button
                    onClick={() => handleStatusChange('in_progress')}
                    className="flex-1 bg-gradient-to-r from-cartoon-orange to-secondary-400 hover:from-secondary-500 hover:to-secondary-600 text-white py-2 px-3 rounded-cartoon text-sm font-medium transition-all duration-200 shadow-cartoon hover:shadow-cartoon-lg"
                  >
                    🚀 开始任务
                  </button>
                  <button
                    onClick={() => handleStatusChange('completed')}
                    className="flex-1 bg-gradient-to-r from-cartoon-green to-success-400 hover:from-success-500 hover:to-success-600 text-white py-2 px-3 rounded-cartoon text-sm font-medium transition-all duration-200 shadow-cartoon hover:shadow-cartoon-lg"
                  >
                    ✅ 标记完成
                  </button>
                </>
              )}
              
              {dailyTask.status === 'in_progress' && (
                <>
                  <button
                    onClick={() => handleStatusChange('completed')}
                    className="flex-1 bg-gradient-to-r from-cartoon-green to-success-400 hover:from-success-500 hover:to-success-600 text-white py-2 px-3 rounded-cartoon text-sm font-medium transition-all duration-200 shadow-cartoon hover:shadow-cartoon-lg"
                  >
                    🎉 完成任务
                  </button>
                  <button
                    onClick={() => handleStatusChange('planned')}
                    className="px-3 py-2 text-cartoon-gray hover:text-cartoon-dark text-sm rounded-cartoon hover:bg-cartoon-light transition-all duration-200"
                  >
                    ⏸️ 暂停
                  </button>
                </>
              )}
              
              <button
                onClick={() => handleStatusChange('skipped')}
                className="px-3 py-2 text-cartoon-red hover:text-cartoon-red/80 text-sm rounded-cartoon hover:bg-cartoon-red/10 transition-all duration-200"
              >
                ⏭️ 跳过
              </button>
              
              {onDelete && (
                <button
                  onClick={() => onDelete(dailyTask.id)}
                  className="px-3 py-2 text-cartoon-gray hover:text-cartoon-red text-sm rounded-cartoon hover:bg-cartoon-red/10 transition-all duration-200"
                  title="删除任务"
                >
                  🗑️
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Evidence Modal */}
      {showEvidenceModal && dailyTask.task && (
        <EvidenceModal
          isOpen={showEvidenceModal}
          onClose={() => setShowEvidenceModal(false)}
          onSubmit={handleSubmitEvidence}
          task={dailyTask.task}
          dailyTaskId={dailyTask.id}
        />
      )}
    </>
  );
};

export default DailyTaskCard;