import React from 'react';
import PointsDisplay from '../PointsDisplay';
import Card from '../Card';

interface WelcomeBannerProps {
  user: {
    displayName: string;
    role: 'student' | 'parent';
    points: number;
  };
  userLevel: number;
  className?: string;
}

const WelcomeBanner: React.FC<WelcomeBannerProps> = ({
  user,
  userLevel,
  className = ''
}) => {
  // Get time-based greeting
  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '🌅 早上好！新的一天，新的开始！';
    if (hour < 18) return '☀️ 下午好！继续保持优秀！';
    return '🌙 晚上好！今天辛苦了！';
  };

  return (
    <Card className={`col-span-full ${className}`} animate={true}>
      <div className="text-center">
        {/* Main Icon */}
        <div className="text-4xl sm:text-6xl mb-3 sm:mb-4 animate-float">
          {user?.role === 'student' ? '🎓' : '👨‍👩‍👧‍👦'}
        </div>
        
        {/* Welcome Message */}
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-cartoon-dark mb-2 font-fun animate-bounce-in px-2">
          欢迎回来，{user?.displayName}！
        </h2>
        
        {/* Role-based Description */}
        <p className="text-sm sm:text-base text-cartoon-gray mb-4 sm:mb-6 animate-bounce-in px-2">
          {user?.role === 'student' 
            ? '准备好开始今天的冒险了吗？ 🚀' 
            : '查看您孩子的精彩进展 📊'}
        </p>
        
        {/* Time-based Greeting */}
        <div className="inline-block bg-cartoon-blue/10 text-cartoon-blue px-3 sm:px-4 py-2 rounded-cartoon font-medium text-xs sm:text-sm mb-3 sm:mb-4 animate-pop">
          {getTimeGreeting()}
        </div>
        
        {/* Points and Level Display */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:space-x-4 mb-4">
          <div className="bg-gradient-to-r from-cartoon-green to-success-400 rounded-cartoon-lg px-4 sm:px-6 py-2 sm:py-3 animate-pop">
            <PointsDisplay points={user?.points || 0} size="md" />
          </div>
          <div className="bg-gradient-to-r from-cartoon-purple to-primary-400 rounded-cartoon-lg px-4 sm:px-6 py-2 sm:py-3 text-white animate-pop">
            <span className="font-bold text-sm sm:text-base">
              🌟 等级 {userLevel}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default WelcomeBanner;