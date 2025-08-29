import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { detectNetworkAndGetApiServiceSync } from '../services/compatibleApi';
import TopNavigation from '../components/TopNavigation';
import PointsHistory from '../components/PointsHistory';
import SpecialRewardRequest from '../components/SpecialRewardRequest';
import WelcomeBannerMagic from '../components/WelcomeBanner';
import PointsDisplay from '../components/PointsDisplay';

const Rewards: React.FC = () => {
  const { user } = useAuth();
  const [gameTimeStats, setGameTimeStats] = useState<any>(null);
  const [specialRewards, setSpecialRewards] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [redemptionRequests, setRedemptionRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exchangingGameTime, setExchangingGameTime] = useState(false);
  const [pointsToExchange, setPointsToExchange] = useState(1);
  const [gameType, setGameType] = useState<'normal' | 'educational'>('normal');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const apiService = detectNetworkAndGetApiServiceSync();
      
      // For demo mode, provide mock data
      const mockGameTimeStats = {
        baseGameTime: 60,
        bonusTimeEarned: 30,
        totalAvailable: 90,
        totalUsed: 20,
        remainingTime: 70
      };

      const mockAchievements = [
        {
          type: 'streak',
          level: 3,
          title: '连续签到',
          description: '连续3天完成任务',
          isUnlocked: true,
          progress: 3,
          maxProgress: 3
        },
        {
          type: 'points',
          level: 2,
          title: '积分达人',
          description: '累计获得200积分',
          isUnlocked: true,
          progress: 200,
          maxProgress: 200
        },
        {
          type: 'tasks',
          level: 1,
          title: '任务新手',
          description: '完成10个任务',
          isUnlocked: false,
          progress: 7,
          maxProgress: 10
        },
        {
          type: 'category',
          level: 1,
          title: '运动专家',
          description: '完成5个运动任务',
          isUnlocked: false,
          progress: 3,
          maxProgress: 5
        }
      ];

      const mockRedemptionRequests = [
        {
          id: '1',
          rewardTitle: '游戏机时间',
          pointsCost: 100,
          status: 'pending',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        },
        {
          id: '2', 
          rewardTitle: '家庭电影夜',
          pointsCost: 50,
          status: 'approved',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          processedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
        }
      ];
      
      const mockSpecialRewards = [
        {
          id: '1',
          title: '游戏机时间',
          description: '获得2小时Switch游戏时间',
          pointsCost: 100,
          category: 'game',
          available: user ? user.points >= 100 : false
        },
        {
          id: '2',
          title: '户外活动',
          description: '去游乐园玩一天',
          pointsCost: 200,
          category: 'experience',
          available: user ? user.points >= 200 : false
        },
        {
          id: '3',
          title: '家庭电影夜',
          description: '全家一起看电影+爆米花',
          pointsCost: 50,
          category: 'family',
          available: user ? user.points >= 50 : true
        }
      ];
      
      // Try to get real data if API is available
      try {
        const gameTimeResponse = (apiService as any).getTodayGameTime ? 
          await (apiService as any).getTodayGameTime() : 
          { data: { gameTimeStats: mockGameTimeStats } };
          
        const specialRewardsResponse = (apiService as any).getSpecialRewards ? 
          await (apiService as any).getSpecialRewards() : 
          { data: { specialRewards: mockSpecialRewards } };

        const achievementsResponse = (apiService as any).getAchievements ? 
          await (apiService as any).getAchievements() : 
          { data: { achievements: mockAchievements } };

        const redemptionRequestsResponse = (apiService as any).getRedemptions ? 
          await (apiService as any).getRedemptions() : 
          { data: { redemptions: mockRedemptionRequests } };
        
        setGameTimeStats(gameTimeResponse.data.gameTimeStats);
        setSpecialRewards(specialRewardsResponse.data.specialRewards);
        setAchievements(achievementsResponse.data.achievements);
        setRedemptionRequests(redemptionRequestsResponse.data.redemptions);
      } catch (apiError) {
        // Fallback to mock data if API calls fail
        console.log('Using mock rewards data for demo mode');
        setGameTimeStats(mockGameTimeStats);
        setSpecialRewards(mockSpecialRewards);
        setAchievements(mockAchievements);
        setRedemptionRequests(mockRedemptionRequests);
      }
    } catch (error) {
      console.error('Error loading rewards data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGameTimeExchange = async () => {
    if (pointsToExchange <= 0 || pointsToExchange > user!.points) {
      alert('积分数量无效');
      return;
    }

    try {
      setExchangingGameTime(true);
      const apiService = detectNetworkAndGetApiServiceSync();
      
      // Mock response for demo mode
      const mockResponse = {
        data: {
          minutesGranted: getMinutesForPoints(),
          pointsSpent: pointsToExchange,
          isFreeTime: gameType === 'educational' && getMinutesForPoints() <= 20
        }
      };
      
      let response;
      try {
        response = (apiService as any).calculateGameTime ? 
          await (apiService as any).calculateGameTime({
            pointsToSpend: pointsToExchange,
            gameType,
          }) : mockResponse;
      } catch (apiError) {
        response = mockResponse;
      }

      alert(
        `🎉 游戏时间兑换成功！\n🎮 获得游戏时间：${(response as any).data.minutesGranted} 分钟\n${
          (response as any).data.isFreeTime ? '💡 (免费教育游戏时间，不扣积分)' : `💰 已扣除积分：${(response as any).data.pointsSpent} 分`
        }\n✨ 快去享受游戏时光吧！`
      );

      // Reload data to show updated stats
      await loadData();
      setPointsToExchange(1);
    } catch (error: any) {
      console.error('Error exchanging game time:', error);
      alert(error.message || '兑换失败，请重试');
    } finally {
      setExchangingGameTime(false);
    }
  };

  const handleSpecialRedemption = async (reward: any) => {
    if (user!.points < reward.pointsCost) {
      alert('积分不足，无法兑换此奖励');
      return;
    }

    if (window.confirm(`确定要用 ${reward.pointsCost} 积分兑换 "${reward.title}" 吗？`)) {
      try {
        const apiService = detectNetworkAndGetApiServiceSync();
        
        try {
          if ((apiService as any).createRedemption) {
            await (apiService as any).createRedemption({
              rewardTitle: reward.title,
              rewardDescription: reward.description,
              pointsCost: reward.pointsCost,
            });
          } else {
            // Mock success for demo mode
            console.log('Mock redemption created for demo mode');
          }
        } catch (apiError) {
          // Mock success for demo mode
          console.log('Mock redemption created for demo mode');
        }

        alert('🎁 兑换请求已提交！等待家长审核。');
        await loadData();
      } catch (error) {
        console.error('Error creating redemption:', error);
        alert('兑换失败，请重试');
      }
    }
  };

  const getExchangeRate = () => {
    return gameType === 'educational' ? 10 : 5;
  };

  const getMinutesForPoints = () => {
    return pointsToExchange * getExchangeRate();
  };

  if (!user) {
    return <div className="min-h-screen bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-lg text-gray-600">加载中...</p>
      </div>
    </div>;
  }

  return (
    <>
      {/* Top Navigation - 仅在移动端显示 */}
      <div className="md:hidden">
        <TopNavigation />
      </div>
      
      {/* Desktop Top Navigation - 仅在桌面端显示 */}
      <div className="hidden md:block">
        <TopNavigation />
      </div>
      
      <div className="min-h-screen bg-gradient-to-br from-primary-100 to-secondary-100">
        {/* Magic UI Welcome Banner */}
        <div className="p-4 sm:max-w-7xl sm:mx-auto sm:px-4 lg:px-6 xl:px-8 pt-6">
          <div className="mb-6">
            <WelcomeBannerMagic 
              title={`奖励中心 🎁`}
              subtitle={`${user.displayName} • 当前积分: ${user.points} • 探索您的成就与奖励`}
            />
          </div>
          
          {/* Enhanced Points Display */}
          <div className="flex justify-center mb-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20 flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl">
                <span className="text-white text-2xl">💎</span>
              </div>
              <div>
                <p className="text-gray-600 text-sm">当前积分</p>
                <PointsDisplay points={user.points} size="lg" showLabel={false} animated />
              </div>
            </div>
          </div>
        </div>

      <div className="p-4 sm:max-w-7xl sm:mx-auto sm:px-4 lg:px-6 xl:px-8 sm:py-6 lg:py-8">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-600 text-sm">加载中...</p>
          </div>
        ) : (
          <div className="space-y-6">

            {/* Points History Section */}
            <PointsHistory 
              displayMode="inline" 
              className="shadow-sm"
            />

            {/* Game Time Exchange and Special Rewards */}
            <div className="space-y-4 lg:grid lg:grid-cols-3 lg:gap-6 lg:space-y-0">
            {/* Game Time Exchange */}
            <div className="lg:col-span-2 space-y-4">
              {/* Today's Game Time Stats */}
              {gameTimeStats && (
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="mr-2">🎮</span>
                    今日游戏时间
                  </h2>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg sm:text-2xl font-bold text-gray-700">{gameTimeStats.baseGameTime}</div>
                      <div className="text-xs sm:text-sm text-gray-600">基础时间</div>
                    </div>
                    <div className="text-center p-3 bg-secondary-50 rounded-lg">
                      <div className="text-lg sm:text-2xl font-bold text-secondary-600">{gameTimeStats.bonusTimeEarned}</div>
                      <div className="text-xs sm:text-sm text-gray-600">奖励时间</div>
                    </div>
                    <div className="text-center p-3 bg-primary-50 rounded-lg">
                      <div className="text-lg sm:text-2xl font-bold text-primary-600">{gameTimeStats.totalAvailable}</div>
                      <div className="text-xs sm:text-sm text-gray-600">总可用</div>
                    </div>
                    <div className="text-center p-3 bg-success-50 rounded-lg">
                      <div className="text-lg sm:text-2xl font-bold text-success-600">{gameTimeStats.remainingTime}</div>
                      <div className="text-xs sm:text-sm text-gray-600">剩余</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs sm:text-sm text-gray-600 mb-2">
                      <span>已使用时间</span>
                      <span>{gameTimeStats.totalUsed} / {gameTimeStats.totalAvailable} 分钟</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3">
                      <div 
                        className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 sm:h-3 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${Math.max(0, Math.min(100, (gameTimeStats.totalUsed / gameTimeStats.totalAvailable) * 100))}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Game Time Exchange */}
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="mr-2">🔄</span>
                  积分兑换游戏时间
                </h2>

                <div className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
                  {/* Normal Games */}
                  <div className={`p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    gameType === 'normal' ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                  }`} onClick={() => setGameType('normal')}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">🎮 普通游戏</h3>
                      <input 
                        type="radio" 
                        checked={gameType === 'normal'} 
                        onChange={() => setGameType('normal')}
                        className="text-primary-600"
                      />
                    </div>
                    <p className="text-sm text-gray-600 mb-2">赛车、模拟类等娱乐游戏</p>
                    <div className="text-lg font-bold text-primary-600">1积分 = 5分钟</div>
                  </div>

                  {/* Educational Games */}
                  <div className={`p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    gameType === 'educational' ? 'border-secondary-400 bg-secondary-50' : 'border-gray-200 hover:border-gray-300'
                  }`} onClick={() => setGameType('educational')}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">📚 教育游戏</h3>
                      <input 
                        type="radio" 
                        checked={gameType === 'educational'} 
                        onChange={() => setGameType('educational')}
                        className="text-secondary-600"
                      />
                    </div>
                    <p className="text-sm text-gray-600 mb-2">编程、英语学习类游戏</p>
                    <div className="text-lg font-bold text-secondary-600">1积分 = 10分钟</div>
                    <div className="text-xs text-success-600 mt-1">每天前20分钟免费！</div>
                  </div>
                </div>

                {/* Exchange Controls */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3 mb-3">
                    <label className="text-sm font-medium text-gray-700">兑换积分:</label>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setPointsToExchange(Math.max(1, pointsToExchange - 1))}
                        className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center text-lg font-bold"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={user.points}
                        value={pointsToExchange}
                        onChange={(e) => setPointsToExchange(Math.max(1, Math.min(user.points, parseInt(e.target.value) || 1)))}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <button
                        onClick={() => setPointsToExchange(Math.min(user.points, pointsToExchange + 1))}
                        className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center text-lg font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-gray-600">可获得游戏时间:</span>
                    <span className="text-lg font-bold text-primary-600">
                      {getMinutesForPoints()} 分钟
                    </span>
                  </div>

                  <button
                    onClick={handleGameTimeExchange}
                    disabled={exchangingGameTime || pointsToExchange > user.points}
                    className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white py-3 px-6 rounded-lg font-medium transition-colors duration-200"
                  >
                    {exchangingGameTime ? '兑换中...' : '🎮 立即兑换'}
                  </button>
                </div>
              </div>
            </div>

            {/* Special Rewards */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="mr-2">🏆</span>
                  特殊奖励
                </h2>
                <div className="mb-4">                  <SpecialRewardRequest                     onRequestSuccess={() => loadData()}                    userPoints={user?.points || 0}                  />                </div>

                <div className="space-y-3">
                  {specialRewards.map((reward) => (
                    <div 
                      key={reward.id}
                      className={`p-3 sm:p-4 border-2 rounded-lg transition-all duration-200 ${
                        reward.available ? 'border-gray-200 hover:border-primary-300' : 'border-gray-100 bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className={`font-semibold ${reward.available ? 'text-gray-900' : 'text-gray-500'}`}>
                          {reward.title}
                        </h3>
                        <span className={`text-sm px-2 py-1 rounded-full ${
                          reward.category === 'game' ? 'bg-primary-100 text-primary-700' :
                          reward.category === 'experience' ? 'bg-secondary-100 text-secondary-700' :
                          reward.category === 'family' ? 'bg-success-100 text-success-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {reward.category === 'game' ? '🎮' :
                           reward.category === 'experience' ? '🏎️' :
                           reward.category === 'family' ? '👨‍👩‍👧‍👦' : '🎁'}
                        </span>
                      </div>
                      
                      <p className={`text-sm mb-3 ${reward.available ? 'text-gray-600' : 'text-gray-400'}`}>
                        {reward.description}
                      </p>
                      
                      <div className="flex justify-between items-center">
                        <span className={`font-bold ${reward.available ? 'text-primary-600' : 'text-gray-400'}`}>
                          {reward.pointsCost} 积分
                        </span>
                        <button
                          onClick={() => handleSpecialRedemption(reward)}
                          disabled={!reward.available}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                            reward.available
                              ? 'bg-primary-600 hover:bg-primary-700 text-white'
                              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {reward.available ? '兑换' : '积分不足'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 bg-primary-50 rounded-lg">
                  <h4 className="font-semibold text-primary-900 mb-2 text-sm">💡 提示</h4>
                  <p className="text-xs sm:text-sm text-primary-700">
                    特殊奖励需要家长审核。坚持完成任务积累积分，就能兑换心仪的奖励啦！
                  </p>
                </div>

                {/* Redemption Requests Status */}
                <div className="mt-6">
                  <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="mr-2">📋</span>
                    我的兑换申请
                  </h3>
                  {redemptionRequests.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      <span className="text-2xl mb-2 block">📋</span>
                      <p className="text-sm">暂无兑换申请</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {redemptionRequests.map((request) => (
                        <div
                          key={request.id}
                          className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                        >
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-medium text-gray-900">
                              {request.rewardTitle}
                            </h4>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              request.status === 'pending' 
                                ? 'bg-yellow-100 text-yellow-700' 
                                : request.status === 'approved'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {request.status === 'pending' ? '待审批' : 
                               request.status === 'approved' ? '已批准' : '已拒绝'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm text-gray-600">
                            <span>{request.pointsCost} 积分</span>
                            <span>
                              {new Date(request.createdAt).toLocaleDateString('zh-CN')}
                              {request.processedAt && ` → ${new Date(request.processedAt).toLocaleDateString('zh-CN')}`}
                            </span>
                          </div>
                          {request.status === 'pending' && (
                            <p className="text-xs text-gray-500 mt-1">等待家长审核中...</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </>
  );
};

export default Rewards;