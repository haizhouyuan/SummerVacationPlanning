import React, { useState, useRef } from 'react';
import { uploadService, UploadResult } from '../services/upload';

interface FileUploadProps {
  onUploadComplete: (files: UploadResult[]) => void;
  onUploadError: (error: string) => void;
  userId: string;
  taskId: string;
  acceptedTypes: ('image' | 'video' | 'audio')[];
  maxFiles?: number;
  className?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onUploadComplete,
  onUploadError,
  userId,
  taskId,
  acceptedTypes,
  maxFiles = 5,
  className = '',
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: number]: number }>({});
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getAcceptString = () => {
    const typeMap = {
      image: 'image/*',
      video: 'video/*',
      audio: 'audio/*',
    };
    return acceptedTypes.map(type => typeMap[type]).join(',');
  };

  const handleFiles = async (files: FileList) => {
    const fileArray = Array.from(files).slice(0, maxFiles);
    
    if (fileArray.length === 0) return;

    try {
      setUploading(true);
      setUploadProgress({});

      const results = await uploadService.uploadMultipleFiles(
        fileArray,
        userId,
        taskId,
        (fileIndex, progress) => {
          setUploadProgress(prev => ({
            ...prev,
            [fileIndex]: progress.progress,
          }));
        }
      );

      onUploadComplete(results);
      setUploadProgress({});
    } catch (error: any) {
      onUploadError(error.message || '上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const getTypeIcons = () => {
    const iconMap = {
      image: '📸',
      video: '🎥',
      audio: '🎵',
    };
    return acceptedTypes.map(type => iconMap[type]).join(' ');
  };

  const getTypeText = () => {
    const textMap = {
      image: '图片',
      video: '视频',
      audio: '音频',
    };
    return acceptedTypes.map(type => textMap[type]).join('、');
  };

  return (
    <div className={className}>
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-200 ${
          dragActive
            ? 'border-primary-400 bg-primary-50'
            : uploading
            ? 'border-secondary-400 bg-secondary-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={getAcceptString()}
          onChange={handleFileInput}
          className="hidden"
        />

        {uploading ? (
          <div className="space-y-4">
            <div className="text-4xl">⏳</div>
            <div>
              <p className="text-lg font-medium text-secondary-700">上传中...</p>
              <div className="mt-2 space-y-2">
                {Object.entries(uploadProgress).map(([fileIndex, progress]) => (
                  <div key={fileIndex} className="text-sm">
                    <div className="flex justify-between text-gray-600 mb-1">
                      <span>文件 {parseInt(fileIndex) + 1}</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-secondary-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-4xl">{getTypeIcons()}</div>
            <div>
              <p className="text-lg font-medium text-gray-900">
                上传{getTypeText()}文件
              </p>
              <p className="text-sm text-gray-500 mt-1">
                拖拽文件到这里，或者
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-primary-600 hover:text-primary-700 font-medium ml-1"
                >
                  点击选择文件
                </button>
              </p>
              <p className="text-xs text-gray-400 mt-2">
                最多{maxFiles}个文件，每个文件最大10MB
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;