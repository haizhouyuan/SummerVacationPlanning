import React from 'react';

interface TaskCategoryIconProps {
  category: string;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
}

const TaskCategoryIcon: React.FC<TaskCategoryIconProps> = ({
  category,
  size = 'md',
  animated = true,
  className = '',
}) => {
  const getCategoryData = () => {
    const categoryMap: { [key: string]: { emoji: string; color: string; bgColor: string } } = {
      // Study categories
      study: { emoji: '📚', color: 'text-primary-600', bgColor: 'bg-primary-100' },
      homework: { emoji: '✏️', color: 'text-cartoon-purple', bgColor: 'bg-purple-100' },
      reading: { emoji: '📖', color: 'text-cartoon-green', bgColor: 'bg-green-100' },
      math: { emoji: '🧮', color: 'text-cartoon-orange', bgColor: 'bg-orange-100' },
      science: { emoji: '🔬', color: 'text-primary-600', bgColor: 'bg-primary-100' },
      language: { emoji: '🗣️', color: 'text-cartoon-pink', bgColor: 'bg-pink-100' },
      
      // Physical activities
      exercise: { emoji: '🏃', color: 'text-cartoon-green', bgColor: 'bg-green-100' },
      sports: { emoji: '⚽', color: 'text-cartoon-orange', bgColor: 'bg-orange-100' },
      swimming: { emoji: '🏊', color: 'text-primary-600', bgColor: 'bg-primary-100' },
      cycling: { emoji: '🚴', color: 'text-cartoon-green', bgColor: 'bg-green-100' },
      walking: { emoji: '🚶', color: 'text-cartoon-purple', bgColor: 'bg-purple-100' },
      
      // Creative activities
      art: { emoji: '🎨', color: 'text-cartoon-pink', bgColor: 'bg-pink-100' },
      music: { emoji: '🎵', color: 'text-cartoon-purple', bgColor: 'bg-purple-100' },
      drawing: { emoji: '✏️', color: 'text-cartoon-orange', bgColor: 'bg-orange-100' },
      crafts: { emoji: '🧸', color: 'text-cartoon-yellow', bgColor: 'bg-yellow-100' },
      photography: { emoji: '📸', color: 'text-primary-600', bgColor: 'bg-primary-100' },
      
      // Life skills
      cooking: { emoji: '👨‍🍳', color: 'text-cartoon-orange', bgColor: 'bg-orange-100' },
      cleaning: { emoji: '🧽', color: 'text-cartoon-green', bgColor: 'bg-green-100' },
      organizing: { emoji: '📦', color: 'text-cartoon-purple', bgColor: 'bg-purple-100' },
      gardening: { emoji: '🌱', color: 'text-cartoon-green', bgColor: 'bg-green-100' },
      
      // Social activities
      family: { emoji: '👨‍👩‍👧‍👦', color: 'text-cartoon-pink', bgColor: 'bg-pink-100' },
      friends: { emoji: '👫', color: 'text-cartoon-yellow', bgColor: 'bg-yellow-100' },
      community: { emoji: '🏘️', color: 'text-primary-600', bgColor: 'bg-primary-100' },
      volunteer: { emoji: '🤝', color: 'text-cartoon-green', bgColor: 'bg-green-100' },
      
      // Entertainment
      gaming: { emoji: '🎮', color: 'text-cartoon-purple', bgColor: 'bg-purple-100' },
      movies: { emoji: '🎬', color: 'text-cartoon-red', bgColor: 'bg-red-100' },
      travel: { emoji: '✈️', color: 'text-primary-600', bgColor: 'bg-primary-100' },
      
      // Default/Other
      other: { emoji: '📋', color: 'text-cartoon-gray', bgColor: 'bg-gray-100' },
    };

    return categoryMap[category.toLowerCase()] || categoryMap.other;
  };

  const getSizeClasses = () => {
    const sizeMap = {
      sm: 'text-xl w-8 h-8',
      md: 'text-2xl w-12 h-12',
      lg: 'text-3xl w-16 h-16',
    };
    return sizeMap[size];
  };

  const categoryData = getCategoryData();

  return (
    <div
      className={`
        ${getSizeClasses()}
        ${categoryData.bgColor}
        ${categoryData.color}
        rounded-cartoon
        flex items-center justify-center
        shadow-cartoon
        transition-all duration-200
        ${animated ? 'hover:animate-pop hover:shadow-cartoon-lg' : ''}
        ${className}
      `}
    >
      <span 
        className={`
          ${animated ? 'animate-float' : ''}
          ${size === 'lg' ? 'filter drop-shadow-lg' : ''}
        `}
        style={{ animationDelay: `${Math.random() * 2}s` }}
      >
        {categoryData.emoji}
      </span>
    </div>
  );
};

export default TaskCategoryIcon;