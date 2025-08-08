import React, { useState } from 'react';
import { uploadService } from '../services/upload';

interface MediaFile {
  url: string;
  type: string;
  name: string;
  size?: number;
  path?: string;
}

interface MediaPreviewProps {
  files: MediaFile[];
  onDelete?: (fileIndex: number) => void;
  readOnly?: boolean;
  className?: string;
}

const MediaPreview: React.FC<MediaPreviewProps> = ({
  files,
  onDelete,
  readOnly = false,
  className = '',
}) => {
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [loadingStates, setLoadingStates] = useState<{ [key: number]: boolean }>({});

  const handleImageLoad = (index: number) => {
    setLoadingStates(prev => ({ ...prev, [index]: false }));
  };

  const handleImageError = (index: number) => {
    setLoadingStates(prev => ({ ...prev, [index]: false }));
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('video/')) return '🎥';
    if (type.startsWith('audio/')) return '🎵';
    return '📄';
  };

  const formatFileSize = (size?: number) => {
    if (!size) return '';
    return uploadService.formatFileSize(size);
  };

  const renderImagePreview = (file: MediaFile, index: number) => (
    <div className="relative group">
      {loadingStates[index] && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
        </div>
      )}
      <img
        src={file.url}
        alt={file.name}
        className="w-full h-32 object-cover rounded-lg cursor-pointer transition-transform duration-200 group-hover:scale-105"
        onClick={() => setFullscreenImage(file.url)}
        onLoad={() => handleImageLoad(index)}
        onError={() => handleImageError(index)}
        loading="lazy"
      />
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
        <span className="opacity-0 group-hover:opacity-100 text-white text-sm font-medium">
          点击查看大图
        </span>
      </div>
    </div>
  );

  const renderVideoPreview = (file: MediaFile, index: number) => (
    <div className="relative">
      <video
        src={file.url}
        className="w-full h-32 object-cover rounded-lg"
        controls
        preload="metadata"
      >
        您的浏览器不支持视频播放
      </video>
    </div>
  );

  const renderAudioPreview = (file: MediaFile, index: number) => (
    <div className="bg-gray-50 rounded-lg p-4 h-32 flex flex-col justify-center">
      <div className="text-center mb-2">
        <span className="text-2xl">🎵</span>
        <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
      </div>
      <audio
        src={file.url}
        className="w-full"
        controls
        preload="metadata"
      >
        您的浏览器不支持音频播放
      </audio>
    </div>
  );

  const renderFilePreview = (file: MediaFile, index: number) => {
    if (file.type.startsWith('image/')) {
      return renderImagePreview(file, index);
    } else if (file.type.startsWith('video/')) {
      return renderVideoPreview(file, index);
    } else if (file.type.startsWith('audio/')) {
      return renderAudioPreview(file, index);
    } else {
      return (
        <div className="bg-gray-50 rounded-lg p-4 h-32 flex flex-col justify-center items-center">
          <span className="text-2xl mb-2">{getFileIcon(file.type)}</span>
          <p className="text-sm font-medium text-gray-700 text-center truncate w-full">
            {file.name}
          </p>
        </div>
      );
    }
  };

  if (files.length === 0) {
    return null;
  }

  return (
    <>
      <div className={`space-y-4 ${className}`}>
        <h4 className="text-sm font-medium text-gray-700 flex items-center">
          <span className="mr-2">📎</span>
          已上传文件 ({files.length})
        </h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.map((file, index) => (
            <div key={index} className="relative bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              {renderFilePreview(file, index)}
              
              {/* File info overlay */}
              <div className="p-2 bg-white border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 truncate">
                      {file.name}
                    </p>
                    {file.size && (
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </p>
                    )}
                  </div>
                  
                  {!readOnly && onDelete && (
                    <button
                      onClick={() => onDelete(index)}
                      className="ml-2 p-1 text-danger-500 hover:text-danger-700 transition-colors duration-200"
                      title="删除文件"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>

              {/* File type badge */}
              <div className="absolute top-2 left-2">
                <span className="bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                  {getFileIcon(file.type)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fullscreen Image Modal */}
      {fullscreenImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setFullscreenImage(null)}
        >
          <div className="relative max-w-full max-h-full">
            <img
              src={fullscreenImage}
              alt="预览"
              className="max-w-full max-h-full object-contain"
            />
            <button
              onClick={() => setFullscreenImage(null)}
              className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors duration-200"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default MediaPreview;