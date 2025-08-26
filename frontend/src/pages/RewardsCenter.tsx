import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../components/NotificationSystem';
import TopNavigation from '../components/TopNavigation';
import PointsDisplay from '../components/PointsDisplay';
import PointsHistory from '../components/PointsHistory';
import GameTimeExchange from '../components/GameTimeExchange';
import SpecialRewardRequest from '../components/SpecialRewardRequest';
import { detectNetworkAndGetApiServiceSync } from '../services/compatibleApi';

interface TaskCompletionRecord {
  id: string;
  taskTitle: string;
  pointsEarned: number;
  completedAt: string;
  category: string;
}

interface RedemptionRecord {
  id: string;
  type: 'game_time' | 'special_reward';
  description: string;
  pointsCost: number;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
}

const RewardsCenter: React.FC = () => {
  const { user, logout } = useAuth();
  const { showSuccess, showError } = useNotifications();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [pointsStats, setPointsStats] = useState<any>(null);
  const [gameTimeStats, setGameTimeStats] = useState<any>(null);
  const [taskRecords, setTaskRecords] = useState<TaskCompletionRecord[]>([]);
  const [redemptionHistory, setRedemptionHistory] = useState<RedemptionRecord[]>([]);
  const [error, setError] = useState<string>('');

  // 加载积分统计
  const loadPointsStats = async () => {
    try {
      const apiService = detectNetworkAndGetApiServiceSync();
      const response = await apiService.getUserPoints();
      if (response.success) {
        setPointsStats(response.data);
      }
    } catch (error: any) {
      console.error('Error loading points stats:', error);
    }
  };

  // 加载游戏时间统计
  const loadGameTimeStats = async () => {
    try {
      const apiService = detectNetworkAndGetApiServiceSync();
      const response = await apiService.getGameTimeStats();
      if (response.success) {
        setGameTimeStats(response.data);
      }
    } catch (error: any) {
      console.error('Error loading game time stats:', error);
    }
  };

  // 加载任务完成记录
  const loadTaskRecords = async () => {
    try {
      const apiService = detectNetworkAndGetApiServiceSync();
      const response = await apiService.getTaskCompletionHistory();
      if (response.success) {
        setTaskRecords(response.data.records || []);
      }
    } catch (error: any) {
      console.error('Error loading task records:', error);
    }
  };

  // 加载兑换历史
  const loadRedemptionHistory = async () => {
    try {
      const apiService = detectNetworkAndGetApiServiceSync();
      const response = await apiService.getRedemptionHistory();
      if (response.success) {
        setRedemptionHistory(response.data.history || []);
      }
    } catch (error: any) {
      console.error('Error loading redemption history:', error);
    }
  };

  useEffect(() => {
    loadPointsStats();
    loadGameTimeStats();
    loadTaskRecords();
    loadRedemptionHistory();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-100 to-secondary-100">
      <TopNavigation 
        user={user} 
        onLogout={handleLogout}
        currentPath="/rewards-center"
      />
      
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* 页面标题 */}
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-primary-800 mb-2">
            🌟 成长与奖励中心
          </h1>
          <p className="text-gray-600">
            查看你的积分、兑换奖励、回顾成长历程
          </p>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-600 text-sm">加载中...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 积分概览 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">💎</span>
                积分概览
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="text-center p-4 bg-primary-50 rounded-lg">
                  <div className="text-2xl lg:text-3xl font-bold text-primary-700">
                    {user.points || 0}
                  </div>
                  <div className="text-sm text-gray-600">当前积分</div>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl lg:text-3xl font-bold text-green-700">
                    {pointsStats?.weeklyEarned || 0}
                  </div>
                  <div className="text-sm text-gray-600">本周获得</div>
                </div>
                
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl lg:text-3xl font-bold text-blue-700">
                    {pointsStats?.monthlyEarned || 0}
                  </div>
                  <div className="text-sm text-gray-600">本月获得</div>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl lg:text-3xl font-bold text-purple-700">
                    {pointsStats?.totalEarned || 0}
                  </div>
                  <div className="text-sm text-gray-600">累计获得</div>
                </div>
              </div>

              {/* 积分趋势图表 */}
              {pointsStats?.weeklyTrend && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">近7日积分变化</h3>
                  <div className="h-20 flex items-end space-x-1">
                    {pointsStats.weeklyTrend.map((points: number, index: number) => (
                      <div
                        key={index}
                        className="bg-primary-200 flex-1 rounded-t"
                        style={{
                          height: `${Math.max(4, (points / Math.max(...pointsStats.weeklyTrend)) * 80)}px`
                        }}
                        title={`${points} 积分`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 奖励兑换区域 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 游戏时间兑换 */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">🎮</span>
                  游戏时间兑换
                </h2>
                
                <GameTimeExchange 
                  currentPoints={user.points || 0}
                  gameTimeStats={gameTimeStats}
                  onExchange={loadGameTimeStats}
                />
              </div>

              {/* 特殊奖励兑换 */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">🎁</span>
                  特殊奖励兑换
                </h2>
                
                <SpecialRewardRequest 
                  currentPoints={user.points || 0}
                  onRequest={() => {
                    loadPointsStats();
                    loadRedemptionHistory();
                  }}
                />
              </div>
            </div>

            {/* 历史记录区域 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 任务完成记录 */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">📝</span>
                  任务完成记录
                </h2>
                
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {taskRecords.length > 0 ? (
                    taskRecords.map((record) => (
                      <div key={record.id} className="flex justify-between items-center p-3 border border-gray-100 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{record.taskTitle}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(record.completedAt).toLocaleDateString()} • {record.category}
                          </div>
                        </div>
                        <div className="text-green-600 font-semibold">
                          +{record.pointsEarned}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-2xl mb-2">📋</div>
                      <p className="text-sm">暂无任务完成记录</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 兑换历史记录 */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">🛍️</span>
                  兑换历史记录
                </h2>
                
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {redemptionHistory.length > 0 ? (
                    redemptionHistory.map((record) => (
                      <div key={record.id} className="flex justify-between items-center p-3 border border-gray-100 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{record.description}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(record.requestedAt).toLocaleDateString()} • 
                            <span className={`ml-1 px-2 py-0.5 rounded text-xs ${
                              record.status === 'approved' ? 'bg-green-100 text-green-800' :
                              record.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {record.status === 'approved' ? '已批准' : 
                               record.status === 'rejected' ? '已拒绝' : '待审批'}
                            </span>
                          </div>
                        </div>
                        <div className="text-primary-600 font-semibold">
                          -{record.pointsCost}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-2xl mb-2">🛒</div>
                      <p className="text-sm">暂无兑换历史记录</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 积分详细历史 */}
            <PointsHistory 
              displayMode="inline" 
              className="shadow-sm"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default RewardsCenter;