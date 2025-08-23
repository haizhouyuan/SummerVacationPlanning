import React, { useState, useEffect } from 'react';
import CelebrationModal from '../CelebrationModal';

interface AnimationState {
  type: 'task_complete' | 'level_up' | 'streak_milestone' | 'achievement_unlock';
  isVisible: boolean;
  data?: any;
}

interface FeedbackAnimationsProps {
  showTaskComplete?: boolean;
  showLevelUp?: boolean;
  showStreakMilestone?: boolean;
  showAchievement?: boolean;
  taskData?: {
    title: string;
    points: number;
  };
  levelData?: {
    newLevel: number;
    oldLevel: number;
  };
  streakData?: {
    days: number;
    milestone: string;
  };
  achievementData?: {
    title: string;
    description: string;
    icon: string;
  };
  onAnimationComplete?: (type: string) => void;
}

const FeedbackAnimations: React.FC<FeedbackAnimationsProps> = ({
  showTaskComplete = false,
  showLevelUp = false,
  showStreakMilestone = false,
  showAchievement = false,
  taskData,
  levelData,
  streakData,
  achievementData,
  onAnimationComplete
}) => {
  const [currentAnimation, setCurrentAnimation] = useState<AnimationState | null>(null);
  const [encouragingMessages] = useState([
    "继续保持优秀，加油！",
    "每一步都在进步！",
    "你的努力正在发光！",
    "坚持就是胜利！",
    "今天的你比昨天更棒！",
    "小小的进步，大大的成就！"
  ]);

  // Handle different animation triggers
  useEffect(() => {
    if (showTaskComplete && taskData) {
      setCurrentAnimation({
        type: 'task_complete',
        isVisible: true,
        data: taskData
      });
    }
  }, [showTaskComplete, taskData]);

  useEffect(() => {
    if (showLevelUp && levelData) {
      setCurrentAnimation({
        type: 'level_up',
        isVisible: true,
        data: levelData
      });
    }
  }, [showLevelUp, levelData]);

  useEffect(() => {
    if (showStreakMilestone && streakData) {
      setCurrentAnimation({
        type: 'streak_milestone',
        isVisible: true,
        data: streakData
      });
    }
  }, [showStreakMilestone, streakData]);

  useEffect(() => {
    if (showAchievement && achievementData) {
      setCurrentAnimation({
        type: 'achievement_unlock',
        isVisible: true,
        data: achievementData
      });
    }
  }, [showAchievement, achievementData]);

  const handleAnimationClose = () => {
    if (currentAnimation) {
      onAnimationComplete?.(currentAnimation.type);
      setCurrentAnimation(null);
    }
  };

  // Get random encouraging message
  const getEncouragingMessage = () => {
    return encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];
  };

  // Render appropriate modal based on animation type
  const renderAnimation = () => {
    if (!currentAnimation?.isVisible) return null;

    switch (currentAnimation.type) {
      case 'task_complete':
        return (
          <CelebrationModal
            isOpen={true}
            onClose={handleAnimationClose}
            type="task_complete"
            title="任务完成！"
            message={`恭喜完成"${currentAnimation.data?.title}"！`}
            points={currentAnimation.data?.points || 0}
            emoji="🎉"
          />
        );

      case 'level_up':
        return (
          <CelebrationModal
            isOpen={true}
            onClose={handleAnimationClose}
            type="level_up"
            title="等级提升！"
            message={`恭喜升级到等级 ${currentAnimation.data?.newLevel}！你的努力得到了回报！`}
            points={0}
            emoji="🌟"
          />
        );

      case 'streak_milestone':
        return (
          <CelebrationModal
            isOpen={true}
            onClose={handleAnimationClose}
            type="streak"
            title="连击里程碑！"
            message={`连续学习 ${currentAnimation.data?.days} 天！${currentAnimation.data?.milestone} - 坚持的力量！`}
            points={0}
            emoji="🔥"
          />
        );

      case 'achievement_unlock':
        return (
          <CelebrationModal
            isOpen={true}
            onClose={handleAnimationClose}
            type="achievement"
            title="解锁成就！"
            message={`${currentAnimation.data?.title} - ${currentAnimation.data?.description}`}
            points={0}
            emoji={currentAnimation.data?.icon || "🏆"}
          />
        );

      default:
        return null;
    }
  };

  return (
    <>
      {renderAnimation()}
      
      {/* Floating Points Animation */}
      {currentAnimation?.type === 'task_complete' && currentAnimation.data?.points && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50">
          <div className="animate-bounce text-2xl font-bold text-cartoon-green">
            +{currentAnimation.data.points}
          </div>
        </div>
      )}
      
      {/* Sparkle Effects for Level Up */}
      {currentAnimation?.type === 'level_up' && (
        <div className="fixed inset-0 pointer-events-none z-40">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="absolute text-2xl animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: '2s'
              }}
            >
              ⭐
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default FeedbackAnimations;