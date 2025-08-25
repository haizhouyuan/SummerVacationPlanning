import React, { useState } from 'react';
import { apiService } from '../services/api';

interface SpecialRewardRequestProps {
  onRequestSuccess: () => void;
  userPoints: number;
}

const SpecialRewardRequest: React.FC<SpecialRewardRequestProps> = ({ onRequestSuccess, userPoints }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    rewardTitle: '',
    rewardDescription: '',
    pointsCost: 0,
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.pointsCost > userPoints) {
      alert('积分不足！');
      return;
    }

    try {
      setLoading(true);
      await apiService.requestSpecialReward(formData);
      
      // Reset form
      setFormData({
        rewardTitle: '',
        rewardDescription: '',
        pointsCost: 0,
        notes: ''
      });
      
      setIsOpen(false);
      onRequestSuccess();
      alert('特殊奖励申请已提交，等待家长审批！');
    } catch (error) {
      console.error('Special reward request failed:', error);
      alert('申请失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
      >
        申请特殊奖励 ✨
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">
              申请特殊奖励 🎁
            </h3>
            
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                当前积分: <span className="font-bold">{userPoints} 分</span>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  奖励名称 *
                </label>
                <input
                  type="text"
                  required
                  value={formData.rewardTitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, rewardTitle: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="例如：周末游戏时间延长"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  详细描述
                </label>
                <textarea
                  value={formData.rewardDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, rewardDescription: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                  placeholder="详细说明你想要的奖励内容"
                  maxLength={300}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  愿意花费的积分 *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={userPoints}
                  value={formData.pointsCost || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, pointsCost: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="输入积分数量"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  备注说明
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={2}
                  placeholder="向家长说明为什么申请这个奖励"
                  maxLength={200}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.rewardTitle || formData.pointsCost <= 0}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? '提交中...' : '提交申请'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default SpecialRewardRequest;
