import React, { useState } from 'react';
import { Task } from '../types';
import FileUpload from './FileUpload';
import MediaPreview from './MediaPreview';
import { UploadResult } from '../services/upload';
import { useAuth } from '../contexts/AuthContext';

interface EvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (evidence: any[], notes: string) => void;
  task: Task;
  dailyTaskId: string;
}

const EvidenceModal: React.FC<EvidenceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  task,
  dailyTaskId,
}) => {
  const { user } = useAuth();
  const [textEvidence, setTextEvidence] = useState('');
  const [notes, setNotes] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadResult[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

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
    const evidence: any[] = [];

    // Add text evidence
    if (textEvidence.trim()) {
      evidence.push({
        type: 'text',
        content: textEvidence.trim(),
        timestamp: new Date(),
      });
    }

    // Add file evidence
    uploadedFiles.forEach(file => {
      let type: 'photo' | 'video' | 'audio' = 'photo';
      if (file.type.startsWith('video/')) type = 'video';
      else if (file.type.startsWith('audio/')) type = 'audio';

      evidence.push({
        type,
        content: file.url,
        fileName: file.name,
        fileSize: file.size,
        filePath: file.path,
        timestamp: new Date(),
      });
    });

    if (evidence.length === 0) {
      setUploadError('请至少提供一种证据');
      return;
    }

    onSubmit(evidence, notes);
    handleClose();
  };

  const handleClose = () => {
    setTextEvidence('');
    setNotes('');
    setUploadedFiles([]);
    setUploadError('');
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

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                📎 提交任务证据
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                任务: {task.title}
              </p>
              <p className="text-xs text-primary-600 mt-1">
                需要提交: {getEvidenceTypeText()}
              </p>
            </div>
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
                📝 任务描述或心得 <span className="text-danger-500">*</span>
              </label>
              <textarea
                value={textEvidence}
                onChange={(e) => setTextEvidence(e.target.value)}
                placeholder="请详细描述你完成任务的过程、遇到的困难、学到的知识或收获的感受..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                rows={4}
              />
              <p className="text-xs text-gray-500 mt-1">
                详细的描述可以获得更好的学习效果哦！
              </p>
            </div>
          )}

          {/* File Upload */}
          {(task.evidenceTypes.includes('photo') || task.evidenceTypes.includes('video')) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🖼️ 图片或视频证据
              </label>
              <FileUpload
                onUploadComplete={handleFileUploadComplete}
                onUploadError={handleFileUploadError}
                userId={user.id}
                taskId={dailyTaskId}
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
            <MediaPreview
              files={uploadedFiles}
              onDelete={handleDeleteFile}
              readOnly={false}
            />
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
              placeholder="可选的额外说明..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Task Completion Tips */}
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
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 px-4 rounded-lg text-sm font-medium transition-colors duration-200"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={uploading || (!textEvidence.trim() && uploadedFiles.length === 0)}
              className="flex-1 bg-success-600 hover:bg-success-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg text-sm font-medium transition-colors duration-200"
            >
              {uploading ? '提交中...' : '🎉 完成任务'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvidenceModal;