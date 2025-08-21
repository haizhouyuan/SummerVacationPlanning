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

  const getPriorityColor = (priority?: string) => {
    const colorMap = {
      high: 'text-red-600 bg-red-100',
      medium: 'text-yellow-600 bg-yellow-100',
      low: 'text-green-600 bg-green-100',
    };
    return colorMap[priority as keyof typeof colorMap] || 'text-gray-600 bg-gray-100';
  };

  const getPriorityText = (priority?: string) => {
    const textMap = {
      high: '高',
      medium: '中',
      low: '低',
    };
    return textMap[priority as keyof typeof textMap] || '中';
  };

  const getTimePreferenceEmoji = (timePreference?: string) => {
    const emojiMap = {
      morning: '🌅',
      afternoon: '☀️',
      evening: '🌙',
      flexible: '⏰',
    };
    return emojiMap[timePreference as keyof typeof emojiMap] || '⏰';
  };

  const getTimePreferenceText = (timePreference?: string) => {
    const textMap = {
      morning: '上午',
      afternoon: '下午',
      evening: '晚上',
      flexible: '灵活',
    };
    return textMap[timePreference as keyof typeof textMap] || '灵活';
  };

  return (
    <div
      className={`
        bg-white rounded-xl shadow-sm border-2 transition-all duration-200 cursor-pointer
        ${isSelected ? 'border-primary-400 shadow-md scale-[1.02]' : 'border-gray-200 hover:border-primary-200 hover:shadow-md'}
        ${className}
      `}
      onClick={() => onSelect?.(task)}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{getCategoryEmoji(task.category)}</span>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg leading-tight">
                {task.title}
              </h3>
              <div className="flex items-center space-x-2 mt-1 flex-wrap">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(task.difficulty)}`}>
                  {getDifficultyText(task.difficulty)}
                </span>
                <span className="text-xs text-gray-500">
                  {task.estimatedTime}分钟
                </span>
                {(task as any).priority && (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor((task as any).priority)}`}>
                    {getPriorityText((task as any).priority)}优先级
                  </span>
                )}
                {(task as any).timePreference && (
                  <span className="text-xs text-gray-600 flex items-center">
                    <span className="mr-1">{getTimePreferenceEmoji((task as any).timePreference)}</span>
                    {getTimePreferenceText((task as any).timePreference)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-1 text-primary-600">
              <span className="text-lg font-bold">{task.points}</span>
              <span className="text-sm">积分</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
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
              className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-200 mr-2"
            >
              选择任务
            </button>
            
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(task);
                }}
                className="p-2 text-gray-500 hover:text-primary-600 transition-colors duration-200"
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
                className="p-2 text-gray-500 hover:text-danger-600 transition-colors duration-200"
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