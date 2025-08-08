import React, { useState, useEffect } from 'react';
import { Task, DailyTask } from '../types';
import FileUpload from './FileUpload';
import MediaPreview from './MediaPreview';
import { UploadResult } from '../services/upload';
import { useAuth } from '../contexts/AuthContext';

interface EvidenceModalProps {
  task: Task;
  dailyTask?: DailyTask;
  onClose: () => void;
  onSubmit: (evidenceData: {
    evidenceText: string;
    evidenceMedia: any[];
    notes: string;
    isPublic: boolean;
  }) => void;
}

const EvidenceModal: React.FC<EvidenceModalProps> = ({
  task,
  dailyTask,
  onClose,
  onSubmit,
}) => {
  const { user } = useAuth();
  const [textEvidence, setTextEvidence] = useState('');
  const [notes, setNotes] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadResult[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [viewMode, setViewMode] = useState<'edit' | 'view'>('edit');

  // Initialize with existing evidence if available
  useEffect(() => {
    if (dailyTask) {
      setTextEvidence(dailyTask.evidenceText || '');
      setIsPublic((dailyTask as any).isPublic || false);
      setNotes(dailyTask.notes || '');
      
      // Set existing media files
      if ((dailyTask as any).evidenceMedia) {
        setUploadedFiles((dailyTask as any).evidenceMedia.map((media: any) => ({
          url: media.url,
          filename: media.filename,
          type: media.type as 'image' | 'video' | 'audio',
          size: media.size,
        })));
      }
      
      // If task is already completed and has evidence, show in view mode
      if (dailyTask.status === 'completed' && (dailyTask.evidenceText || (dailyTask as any).evidenceMedia?.length > 0)) {
        setViewMode('view');
      }
    }
  }, [dailyTask]);

  const handleFileUploadComplete = (files: UploadResult[]) => {
    setUploadedFiles(prev => [...prev, ...files]);
    setUploadError('');
  };

  const handleFileUploadError = (error: string) => {
    setUploadError(error);
  };

  const handleDeleteFile = (fileIndex: number) => {
    setUploadedFiles(prev => prev.filter((_, index) => index !== fileIndex));
  };

  const handleSubmit = () => {
    if (!textEvidence.trim() && uploadedFiles.length === 0) {
      setUploadError('请至少提供一种证据');
      return;
    }
    onSubmit({
      evidenceText: textEvidence.trim(),
      evidenceMedia: uploadedFiles,
      notes,
      isPublic,
    });
    handleClose();
  };

  const handleClose = () => {
    if (!dailyTask) {
      setTextEvidence('');
      setNotes('');
      setUploadedFiles([]);
      setUploadError('');
    }
    setViewMode('edit');
    onClose();
  };

  const getAcceptedFileTypes = (): ('image' | 'video' | 'audio')[] => {
    const types: ('image' | 'video' | 'audio')[] = [];
    
    if (task.evidenceTypes.includes('photo')) {
      types.push('image');
    }
    if (task.evidenceTypes.includes('video')) {
      types.push('video');
    }
    // Add audio support for music practice tasks
    if (task.category === 'other' && task.tags.includes('音乐')) {
      types.push('audio');
    }
    
    return types.length > 0 ? types : ['image'];
  };

  const getEvidenceTypeText = () => {
    const typeMap: { [key: string]: string } = {
      text: '文字描述',
      photo: '照片',
      video: '视频',
    };
    return task.evidenceTypes.map(type => typeMap[type] || type).join('、');
  };

  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {viewMode === 'view' ? '📋 查看任务证据' : '📎 提交任务证据'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                任务: {task.title}
              </p>
              {viewMode === 'edit' && (
                <p className="text-xs text-primary-600 mt-1">
                  需要提交: {getEvidenceTypeText()}
                </p>
              )}
              {viewMode === 'view' && dailyTask && (
                <div className="flex items-center space-x-4 mt-2 text-xs">
                  <span className={`px-2 py-1 rounded-full ${
                    dailyTask.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {dailyTask.status === 'completed' ? '✅ 已完成' : dailyTask.status}
                  </span>
                  {dailyTask.pointsEarned > 0 && (
                    <span className="text-green-600 font-medium">
                      🎉 获得 {dailyTask.pointsEarned} 积分
                    </span>
                  )}
                  {dailyTask.completedAt && (
                    <span className="text-gray-500">
                      完成时间: {new Date(dailyTask.completedAt).toLocaleString('zh-CN')}
                    </span>
                  )}
                </div>
              )}
            </div>
            
            {viewMode === 'view' && (
              <button
                onClick={() => setViewMode('edit')}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                编辑证据
              </button>
            )}
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 text-xl font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Text Evidence */}
          {task.evidenceTypes.includes('text') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📝 任务描述或心得 {viewMode === 'edit' && <span className="text-danger-500">*</span>}
              </label>
              <textarea
                value={textEvidence}
                onChange={(e) => setTextEvidence(e.target.value)}
                placeholder={viewMode === 'view' ? '暂无文字证据' : "请详细描述你完成任务的过程、遇到的困难、学到的知识或收获的感受..."}
                className={`w-full px-3 py-2 border rounded-lg resize-none ${
                  viewMode === 'view' 
                    ? 'border-gray-200 bg-gray-50 text-gray-700 cursor-default' 
                    : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                }`}
                rows={viewMode === 'view' ? (textEvidence ? Math.min(Math.ceil(textEvidence.length / 50), 6) : 2) : 4}
                readOnly={viewMode === 'view'}
              />
              {viewMode === 'edit' && (
                <p className="text-xs text-gray-500 mt-1">
                  详细的描述可以获得更好的学习效果哦！
                </p>
              )}
            </div>
          )}

          {/* File Upload */}
          {(task.evidenceTypes.includes('photo') || task.evidenceTypes.includes('video')) && viewMode === 'edit' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🖼️ 图片或视频证据
              </label>
              <FileUpload
                onUploadComplete={handleFileUploadComplete}
                onUploadError={handleFileUploadError}
                userId={user.id}
                taskId={dailyTask?.id || 'new'}
                acceptedTypes={getAcceptedFileTypes()}
                maxFiles={3}
              />
              
              {uploadError && (
                <p className="text-sm text-danger-600 mt-2">
                  {uploadError}
                </p>
              )}
            </div>
          )}

          {/* File Preview */}
          {uploadedFiles.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🖼️ 媒体文件
              </label>
              <MediaPreview
                files={uploadedFiles}
                onDelete={viewMode === 'edit' ? handleDeleteFile : undefined}
                readOnly={viewMode === 'view'}
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              💭 额外备注
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={viewMode === 'view' ? '暂无备注' : "可选的额外说明..."}
              className={`w-full px-3 py-2 border rounded-lg ${
                viewMode === 'view' 
                  ? 'border-gray-200 bg-gray-50 text-gray-700 cursor-default' 
                  : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
              }`}
              readOnly={viewMode === 'view'}
            />
          </div>

          {/* Public Toggle */}
          <div className="flex items-center mt-2">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={e => setIsPublic(e.target.checked)}
              className="mr-2"
              disabled={viewMode === 'view'}
            />
            <label htmlFor="isPublic" className={`text-sm cursor-pointer ${
              viewMode === 'view' ? 'text-gray-500' : 'text-gray-600'
            }`}>
              公开本次打卡内容（可展示在成就页/排行榜/家庭圈）
            </label>
          </div>

          {/* Task Completion Tips or Stats */}
          {viewMode === 'edit' ? (
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-primary-800 mb-2">
                💡 任务完成提示
              </h4>
              <div className="text-sm text-primary-700 space-y-1">
                <p>• 提供详细的文字描述可以帮助巩固学习成果</p>
                <p>• 照片或视频证据能证明你真正完成了任务</p>
                <p>• 分享你的感受和收获是最重要的部分</p>
                <p>• 完成任务后将获得 <strong>{task.points} 积分</strong> 奖励！</p>
              </div>
            </div>
          ) : dailyTask && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-green-800 mb-2">
                🎉 任务完成情况
              </h4>
              <div className="text-sm text-green-700 space-y-1">
                <p>• 任务状态: <strong>{dailyTask.status === 'completed' ? '已完成' : '进行中'}</strong></p>
                {dailyTask.pointsEarned > 0 && (
                  <p>• 获得积分: <strong>{dailyTask.pointsEarned} 分</strong></p>
                )}
                {dailyTask.completedAt && (
                  <p>• 完成时间: <strong>{new Date(dailyTask.completedAt).toLocaleString('zh-CN')}</strong></p>
                )}
                {(dailyTask as any).approvalStatus && (
                  <p>• 审批状态: <strong>
                    {(dailyTask as any).approvalStatus === 'approved' ? '✅ 已通过' : 
                     (dailyTask as any).approvalStatus === 'rejected' ? '❌ 未通过' : '⏳ 待审批'}
                  </strong></p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 px-4 rounded-lg text-sm font-medium transition-colors duration-200"
            >
              {viewMode === 'view' ? '关闭' : '取消'}
            </button>
            {viewMode === 'edit' && (
              <button
                onClick={handleSubmit}
                disabled={uploading || (!textEvidence.trim() && uploadedFiles.length === 0)}
                className="flex-1 bg-success-600 hover:bg-success-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg text-sm font-medium transition-colors duration-200"
              >
                {uploading ? '提交中...' : dailyTask ? '更新证据' : '🎉 完成任务'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvidenceModal;