import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import PointsDisplay from '../components/PointsDisplay';
import ProgressBar from '../components/ProgressBar';
import CelebrationModal from '../components/CelebrationModal';
import AchievementBadge from '../components/AchievementBadge';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showCelebration, setShowCelebration] = useState(false);

  // Mock data for demonstration
  const mockStats = {
    weeklyTasks: 5,
    weeklyGoal: 7,
    streak: 3,
    level: Math.floor((user?.points || 0) / 100) + 1,
    achievements: [
      { type: 'streak' as const, level: 1, title: '连续达人', description: '连续3天完成任务', isUnlocked: true, progress: undefined, maxProgress: undefined },
      { type: 'points' as const, level: 2, title: '积分收集者', description: '获得200积分', isUnlocked: (user?.points || 0) >= 200, progress: undefined, maxProgress: undefined },
      { type: 'tasks' as const, level: 1, title: '任务完成者', description: '完成10个任务', isUnlocked: false, progress: 7, maxProgress: 10 },
    ],
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cartoon-light via-primary-50 to-secondary-50">
      <div className="bg-white shadow-cartoon">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-gradient-to-br from-cartoon-green to-success-400 rounded-cartoon flex items-center justify-center animate-float">
                <span className="text-white text-xl font-bold">🏖️</span>
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-cartoon-dark font-fun">暑假计划</h1>
                <p className="text-sm text-cartoon-gray">让假期更精彩 ✨</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-cartoon-dark">{user.displayName}</p>
                <p className="text-xs text-cartoon-gray">
                  {user.role === 'student' ? '👨‍🎓 学生' : '👨‍👩‍👧‍👦 家长'} • 等级 {mockStats.level}
                </p>
              </div>
              <PointsDisplay points={user.points} size="sm" />
              <button
                onClick={handleLogout}
                className="bg-gradient-to-r from-cartoon-red to-danger-500 hover:from-cartoon-red hover:to-danger-600 text-white px-4 py-2 rounded-cartoon text-sm font-medium transition-all duration-200 shadow-cartoon hover:shadow-cartoon-lg animate-pop"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Welcome Card */}
          <div className="bg-white rounded-cartoon-lg shadow-cartoon-lg p-6 col-span-full animate-bounce-in">
            <div className="text-center">
              <div className="text-6xl mb-4 animate-float">
                {user.role === 'student' ? '🎓' : '👨‍👩‍👧‍👦'}
              </div>
              <h2 className="text-3xl font-bold text-cartoon-dark mb-2 font-fun">
                欢迎回来，{user.displayName}！
              </h2>
              <p className="text-cartoon-gray mb-6">
                {user.role === 'student' 
                  ? '准备好开始今天的冒险了吗？ 🚀' 
                  : '查看您孩子的精彩进展 📊'}
              </p>
              <div className="flex justify-center items-center space-x-4 mb-4">
                <div className="bg-gradient-to-r from-cartoon-green to-success-400 rounded-cartoon-lg px-6 py-3 animate-pop">
                  <PointsDisplay points={user.points} size="md" />
                </div>
                <div className="bg-gradient-to-r from-cartoon-purple to-primary-400 rounded-cartoon-lg px-6 py-3 text-white animate-pop">
                  <span className="font-bold">
                    🌟 等级 {mockStats.level}
                  </span>
                </div>
              </div>
              
              {/* Weekly Progress */}
              <div className="bg-cartoon-light rounded-cartoon p-4 max-w-md mx-auto">
                <h3 className="text-sm font-medium text-cartoon-dark mb-2">本周进度</h3>
                <ProgressBar 
                  current={mockStats.weeklyTasks} 
                  max={mockStats.weeklyGoal}
                  label="任务完成"
                  size="md"
                  animated={true}
                />
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-cartoon-lg shadow-cartoon p-6 animate-bounce-in">
            <h3 className="text-lg font-semibold text-cartoon-dark mb-4 font-fun">🚀 快速操作</h3>
            <div className="space-y-3">
              <button 
                onClick={() => navigate('/today')}
                className="w-full bg-gradient-to-r from-cartoon-green to-success-400 hover:from-success-500 hover:to-success-600 text-white py-3 px-4 rounded-cartoon-lg transition-all duration-200 shadow-cartoon hover:shadow-cartoon-lg animate-pop font-medium"
              >
                ✅ 今日任务
              </button>
              <button 
                onClick={() => navigate('/planning')}
                className="w-full bg-gradient-to-r from-cartoon-blue to-primary-400 hover:from-primary-500 hover:to-primary-600 text-white py-3 px-4 rounded-cartoon-lg transition-all duration-200 shadow-cartoon hover:shadow-cartoon-lg animate-pop font-medium"
              >
                📅 任务规划
              </button>
              <button 
                onClick={() => navigate('/rewards')}
                className="w-full bg-gradient-to-r from-cartoon-purple to-secondary-400 hover:from-secondary-500 hover:to-secondary-600 text-white py-3 px-4 rounded-cartoon-lg transition-all duration-200 shadow-cartoon hover:shadow-cartoon-lg animate-pop font-medium"
              >
                🎁 奖励中心
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white rounded-cartoon-lg shadow-cartoon p-6 animate-bounce-in">
            <h3 className="text-lg font-semibold text-cartoon-dark mb-4 font-fun">📊 统计信息</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-cartoon-light rounded-cartoon">
                <span className="text-cartoon-gray">本周完成</span>
                <span className="font-semibold text-cartoon-green flex items-center">
                  <span className="mr-1">✅</span>
                  {mockStats.weeklyTasks} 个任务
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-cartoon-light rounded-cartoon">
                <span className="text-cartoon-gray">累计积分</span>
                <PointsDisplay points={user.points} size="sm" showLabel={false} />
              </div>
              <div className="flex justify-between items-center p-3 bg-cartoon-light rounded-cartoon">
                <span className="text-cartoon-gray">连续天数</span>
                <span className="font-semibold text-cartoon-orange flex items-center">
                  <span className="mr-1">🔥</span>
                  {mockStats.streak} 天
                </span>
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div className="bg-white rounded-cartoon-lg shadow-cartoon p-6 animate-bounce-in">
            <h3 className="text-lg font-semibold text-cartoon-dark mb-4 font-fun">🏆 成就徽章</h3>
            <div className="grid grid-cols-3 gap-4">
              {mockStats.achievements.map((achievement, index) => (
                <AchievementBadge
                  key={index}
                  type={achievement.type}
                  level={achievement.level}
                  title={achievement.title}
                  description={achievement.description}
                  isUnlocked={achievement.isUnlocked}
                  progress={achievement.progress}
                  maxProgress={achievement.maxProgress}
                  size="sm"
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Celebration Modal */}
      <CelebrationModal
        isOpen={showCelebration}
        onClose={() => setShowCelebration(false)}
        type="task_complete"
        title="任务完成！"
        message="恭喜你完成了今天的任务！"
        points={10}
        emoji="🎉"
      />
    </div>
  );
};

export default Dashboard;