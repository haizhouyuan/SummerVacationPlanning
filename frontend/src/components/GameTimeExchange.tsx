import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import PointsDisplay from './PointsDisplay';

interface GameTimeExchangeProps {
  onExchangeSuccess?: () => void;
}

const GameTimeExchange: React.FC<GameTimeExchangeProps> = ({ onExchangeSuccess }) => {
  const { user, refreshUser } = useAuth();
  const [selectedGameType, setSelectedGameType] = useState<'normal' | 'educational'>('normal');
  const [pointsToExchange, setPointsToExchange] = useState(5);
  const [loading, setLoading] = useState(false);

  const getExchangeRate = () => {
    return selectedGameType === 'normal' ? 5 : 10; // 1 point = 5 minutes normal, 1 point = 10 minutes educational
  };

  const getMinutesFromPoints = () => {
    return pointsToExchange * getExchangeRate();
  };

  const handleExchange = async () => {
    if (!user || user.points < pointsToExchange) {
      alert('积分不足，无法兑换！');
      return;
    }

    if (pointsToExchange <= 0) {
      alert('兑换积分必须大于0！');
      return;
    }

    try {
      setLoading(true);
      
      await apiService.exchangeGameTime({
        gameType: selectedGameType,
        points: pointsToExchange,
      });

      // The backend should provide updated points balance which refreshUser() will fetch

      // Refresh user data to show updated points (this should now get real data)
      await refreshUser();

      // Call success callback
      if (onExchangeSuccess) {
        onExchangeSuccess();
      }

      // Show success message with actual remaining points
      const remainingPoints = user.points - pointsToExchange;
      alert(`🎉 兑换成功！获得 ${getMinutesFromPoints()} 分钟${selectedGameType === 'normal' ? '普通' : '教育'}游戏时间！剩余积分：${remainingPoints}`);
      
      // Reset form
      setPointsToExchange(5);
    } catch (error) {
      console.error('Exchange failed:', error);
      alert('兑换失败，请重试！');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">🎮 游戏时间兑换</h3>
      
      {/* Current Points Display */}
      <div className="mb-6">
        <p className="text-sm text-gray-600 mb-2">当前积分：</p>
        <PointsDisplay
          points={user.points}
          size="sm"
          currentStreak={user.currentStreak}
          medals={user.medals}
          showMedalMultiplier={false}
          showStreak={false}
        />
      </div>

      {/* Game Type Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          选择游戏类型：
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setSelectedGameType('normal')}
            className={`p-3 rounded-lg border-2 transition-all ${
              selectedGameType === 'normal'
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-2xl mb-1">🎮</div>
            <div className="font-medium">普通游戏</div>
            <div className="text-xs text-gray-500">1积分 = 5分钟</div>
          </button>
          <button
            type="button"
            onClick={() => setSelectedGameType('educational')}
            className={`p-3 rounded-lg border-2 transition-all ${
              selectedGameType === 'educational'
                ? 'border-success-500 bg-success-50 text-success-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-2xl mb-1">📚</div>
            <div className="font-medium">教育游戏</div>
            <div className="text-xs text-gray-500">1积分 = 10分钟</div>
          </button>
        </div>
      </div>

      {/* Points Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          兑换积分：
        </label>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setPointsToExchange(Math.max(1, pointsToExchange - 1))}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
            disabled={pointsToExchange <= 1}
          >
            −
          </button>
          <input
            type="number"
            value={pointsToExchange}
            onChange={(e) => setPointsToExchange(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-20 text-center border border-gray-300 rounded-lg px-2 py-1"
            min="1"
            max={user.points}
          />
          <button
            type="button"
            onClick={() => setPointsToExchange(Math.min(user.points, pointsToExchange + 1))}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
            disabled={pointsToExchange >= user.points}
          >
            +
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          最多可兑换 {user.points} 积分
        </p>
      </div>

      {/* Exchange Preview */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">消耗积分：</span>
          <span className="font-semibold text-gray-900">{pointsToExchange}</span>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-sm text-gray-600">获得时间：</span>
          <span className="font-semibold text-primary-600">
            {getMinutesFromPoints()} 分钟
          </span>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-sm text-gray-600">剩余积分：</span>
          <span className="font-semibold text-gray-900">
            {user.points - pointsToExchange}
          </span>
        </div>
      </div>

      {/* Exchange Button */}
      <button
        onClick={handleExchange}
        disabled={loading || user.points < pointsToExchange || pointsToExchange <= 0}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
          loading || user.points < pointsToExchange || pointsToExchange <= 0
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-primary-600 hover:bg-primary-700 text-white'
        }`}
      >
        {loading ? '兑换中...' : '确认兑换'}
      </button>

      {/* Educational Game Bonus Info */}
      {selectedGameType === 'educational' && (
        <div className="mt-4 p-3 bg-success-50 border border-success-200 rounded-lg">
          <div className="flex items-center text-success-700">
            <span className="text-sm">💡 教育游戏有额外福利：每天免费获得20分钟时间！</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameTimeExchange;