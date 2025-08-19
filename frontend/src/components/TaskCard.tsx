import React from 'react';
import { Task } from '../types';

interface TaskCardProps {
  task: Task;
  onSelect?: (task: Task) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  isSelected?: boolean;
  showActions?: boolean;
  className?: string;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onSelect,
  onEdit,
  onDelete,
  isSelected = false,
  showActions = true,
  className = '',
}) => {
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

  const getDifficultyColor = (difficulty: string) => {
    const colorMap = {
      easy: 'text-success-600 bg-success-100',
      medium: 'text-secondary-600 bg-secondary-100',
      hard: 'text-danger-600 bg-danger-100',
    };
    return colorMap[difficulty as keyof typeof colorMap] || 'text-gray-600 bg-gray-100';
  };

  const getDifficultyText = (difficulty: string) => {
    const textMap = {
      easy: '简单',
      medium: '中等',
      hard: '困难',
    };
    return textMap[difficulty as keyof typeof textMap] || difficulty;
  };

  return (
    <div
      className={`
        bg-white rounded-xl shadow-sm border-2 transition-all duration-200 cursor-pointer
        ${isSelected ? 'border-primary-400 shadow-md transform scale-[1.01] sm:scale-[1.02]' : 'border-gray-200 hover:border-primary-200 hover:shadow-md'}
        ${className}
      `}
      onClick={() => onSelect?.(task)}
    >
      <div className="p-3 sm:p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-2 flex-1">
            <span className="text-xl sm:text-2xl flex-shrink-0">{getCategoryEmoji(task.category)}</span>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base lg:text-lg leading-tight truncate">
                {task.title}
              </h3>
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 mt-1 gap-1 sm:gap-0">
                <span className={`px-2 py-1 rounded-full text-xs font-medium self-start ${getDifficultyColor(task.difficulty)}`}>
                  {getDifficultyText(task.difficulty)}
                </span>
                <span className="text-xs text-gray-500">
                  {task.estimatedTime}分钟
                </span>
              </div>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-1 text-primary-600">
              <span className="text-base sm:text-lg font-bold">{task.points}</span>
              <span className="text-xs sm:text-sm">积分</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-xs sm:text-sm mb-3 line-clamp-2">
          {task.description}
        </p>

        {/* Tags */}
        {task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {task.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
            {task.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                +{task.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Evidence requirement */}
        {task.requiresEvidence && (
          <div className="flex items-center space-x-1 mb-3">
            <span className="text-xs text-gray-500">需要提交:</span>
            <div className="flex space-x-1">
              {task.evidenceTypes.includes('text') && (
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">📝文字</span>
              )}
              {task.evidenceTypes.includes('photo') && (
                <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">📸照片</span>
              )}
              {task.evidenceTypes.includes('video') && (
                <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded">🎥视频</span>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex justify-between items-center pt-3 border-t border-gray-100">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect?.(task);
              }}
              className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2.5 sm:py-2 px-3 sm:px-4 rounded-lg text-sm font-medium transition-colors duration-200 mr-2 min-h-[44px] sm:min-h-[auto]"
            >
              选择任务
            </button>
            
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(task);
                }}
                className="p-3 sm:p-2 text-gray-500 hover:text-primary-600 transition-colors duration-200 min-h-[44px] sm:min-h-[auto] min-w-[44px] sm:min-w-[auto] flex items-center justify-center"
                title="编辑任务"
              >
                ✏️
              </button>
            )}
            
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(task);
                }}
                className="p-3 sm:p-2 text-gray-500 hover:text-danger-600 transition-colors duration-200 min-h-[44px] sm:min-h-[auto] min-w-[44px] sm:min-w-[auto] flex items-center justify-center"
                title="删除任务"
              >
                🗑️
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;