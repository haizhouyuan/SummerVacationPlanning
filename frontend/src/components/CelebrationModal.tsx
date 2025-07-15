import React, { useEffect, useState } from 'react';

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'task_complete' | 'level_up' | 'streak' | 'achievement';
  title: string;
  message: string;
  points?: number;
  emoji?: string;
  duration?: number;
}

const CelebrationModal: React.FC<CelebrationModalProps> = ({
  isOpen,
  onClose,
  type,
  title,
  message,
  points = 0,
  emoji = '🎉',
  duration = 3000,
}) => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowContent(true);
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [isOpen, duration, onClose]);

  const getBackgroundColor = () => {
    const colorMap = {
      task_complete: 'bg-gradient-to-br from-cartoon-green to-success-400',
      level_up: 'bg-gradient-to-br from-cartoon-purple to-primary-400',
      streak: 'bg-gradient-to-br from-cartoon-orange to-secondary-400',
      achievement: 'bg-gradient-to-br from-cartoon-pink to-danger-400',
    };
    return colorMap[type];
  };

  const getAnimationClass = () => {
    const animationMap = {
      task_complete: 'animate-bounce-in',
      level_up: 'animate-celebrate',
      streak: 'animate-wiggle',
      achievement: 'animate-float',
    };
    return animationMap[type];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 20 }, (_, i) => (
          <div
            key={i}
            className={`
              absolute w-2 h-2 bg-cartoon-yellow rounded-full animate-sparkle
              ${i % 2 === 0 ? 'bg-cartoon-pink' : 'bg-cartoon-blue'}
            `}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${1 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div
        className={`
          relative max-w-md w-full mx-auto text-center p-8 rounded-cartoon-lg text-white
          ${getBackgroundColor()}
          ${showContent ? getAnimationClass() : ''}
          shadow-cartoon-lg
        `}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/80 hover:text-white text-xl"
        >
          ✕
        </button>

        {/* Main emoji */}
        <div className="text-6xl mb-4 animate-float">
          {emoji}
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold mb-2 font-fun animate-bounce-in">
          {title}
        </h2>

        {/* Message */}
        <p className="text-lg mb-4 opacity-90">
          {message}
        </p>

        {/* Points display */}
        {points > 0 && (
          <div className="bg-white/20 rounded-cartoon px-4 py-2 mb-4 inline-block animate-pop">
            <span className="text-xl font-bold">+{points} 积分!</span>
          </div>
        )}

        {/* Additional decorative elements */}
        <div className="flex justify-center space-x-2 mb-4">
          <span className="text-2xl animate-bounce" style={{ animationDelay: '0.1s' }}>⭐</span>
          <span className="text-2xl animate-bounce" style={{ animationDelay: '0.2s' }}>🎊</span>
          <span className="text-2xl animate-bounce" style={{ animationDelay: '0.3s' }}>🎈</span>
        </div>

        {/* Action button */}
        <button
          onClick={onClose}
          className="bg-white/20 hover:bg-white/30 text-white font-bold py-2 px-6 rounded-cartoon transition-all duration-200 animate-pulse-slow"
        >
          太棒了! 🎉
        </button>

        {/* Progress indicator */}
        <div className="mt-4">
          <div className="w-full bg-white/20 rounded-full h-1">
            <div 
              className="bg-white h-1 rounded-full transition-all ease-linear"
              style={{ 
                width: '100%',
                animation: `shrink ${duration}ms linear forwards`
              }}
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

export default CelebrationModal;