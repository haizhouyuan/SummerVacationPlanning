import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import Layout from '../components/Layout';
import PointsDisplay from '../components/PointsDisplay';
import PointsHistory from '../components/PointsHistory';
import NotificationBadge from '../components/NotificationBadge';

interface Child {
  id: string;
  name: string;
  email: string;
  points: number;
  level: number;
}

interface RedemptionRequest {
  id: string;
  userId: string;
  studentName: string;
  rewardTitle: string;
  rewardDescription: string;
  pointsCost: number;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: Date;
  processedAt?: Date;
  processedBy?: string;
  notes?: string;
}

const ParentRewardsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [children, setChildren] = useState<Child[]>([]);
  const [redemptionRequests, setRedemptionRequests] = useState<RedemptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showPointsHistory, setShowPointsHistory] = useState(false);
  const [processingRequest, setProcessingRequest] = useState<string>('');

  // Load children and redemption data
  useEffect(() => {
    const loadData = async () => {
      if (!user || user.role !== 'parent') return;
      
      try {
        setLoading(true);
        setError('');
        
        // Get children list
        const childrenResponse = await apiService.getChildren() as any;
        if (childrenResponse.success) {
          const childrenData = childrenResponse.data.children;
          setChildren(childrenData);
          
          // Set first child as selected if none selected
          if (childrenData.length > 0 && !selectedChild) {
            setSelectedChild(childrenData[0].id);
          }
        }

        // Get pending redemption requests
        await loadRedemptionRequests();
        
      } catch (error: any) {
        console.error('Error loading data:', error);
        setError(error.message || '网络错误，请重试');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, selectedChild]);

  const loadRedemptionRequests = async () => {
    try {
      const response = await apiService.getRedemptions({ status: 'pending' }) as any;
      if (response.success) {
        const requests = response.data.redemptions || [];
        setRedemptionRequests(requests);
      }
    } catch (error: any) {
      console.error('Error loading redemption requests:', error);
    }
  };

  const handleApproveRedemption = async (requestId: string) => {
    try {
      setProcessingRequest(requestId);
      
      const response = await apiService.updateRedemptionStatus(requestId, {
        status: 'approved',
        notes: '家长已批准兑换'
      }) as any;
      
      if (response.success) {
        // Remove from pending list
        setRedemptionRequests(prev => prev.filter(req => req.id !== requestId));
        
        // Update child points (refresh children data)
        const childrenResponse = await apiService.getChildren() as any;
        if (childrenResponse.success) {
          setChildren(childrenResponse.data.children);
        }
      } else {
        setError('批准失败，请重试');
      }
    } catch (error: any) {
      console.error('Error approving redemption:', error);
      setError(error.message || '批准失败，请重试');
    } finally {
      setProcessingRequest('');
    }
  };

  const handleRejectRedemption = async (requestId: string) => {
    try {
      setProcessingRequest(requestId);
      
      const response = await apiService.updateRedemptionStatus(requestId, {
        status: 'rejected',
        notes: '家长已拒绝兑换，积分已返还'
      }) as any;
      
      if (response.success) {
        // Remove from pending list
        setRedemptionRequests(prev => prev.filter(req => req.id !== requestId));
        
        // Update child points (refresh children data)
        const childrenResponse = await apiService.getChildren() as any;
        if (childrenResponse.success) {
          setChildren(childrenResponse.data.children);
        }
      } else {
        setError('拒绝失败，请重试');
      }
    } catch (error: any) {
      console.error('Error rejecting redemption:', error);
      setError(error.message || '拒绝失败，请重试');
    } finally {
      setProcessingRequest('');
    }
  };

  const getCurrentChild = () => {
    return children.find(child => child.id === selectedChild);
  };

  const getPendingRequestsForChild = () => {
    return redemptionRequests.filter(req => req.userId === selectedChild);
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return '刚刚';
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    return date.toLocaleDateString();
  };

  // Redirect non-parent users
  useEffect(() => {
    if (user && user.role !== 'parent') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  if (!user || user.role !== 'parent') {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-cartoon-light via-primary-50 to-secondary-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-cartoon-dark mb-2">访问受限</h2>
            <p className="text-cartoon-gray">此页面仅供家长用户访问</p>
          </div>
        </div>
      </Layout>
    );
  }

  const currentChild = getCurrentChild();
  const pendingRequests = getPendingRequestsForChild();

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header - Mobile-optimized */}
        <div className="bg-white rounded-cartoon-lg shadow-cartoon p-4 sm:p-6 mb-4 sm:mb-6 animate-bounce-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-cartoon-dark font-fun flex items-center">
                🎁 积分与奖励管理
                {pendingRequests.length > 0 && (
                  <NotificationBadge count={pendingRequests.length} size="md" className="ml-2 sm:ml-3" />
                )}
              </h1>
              <p className="text-cartoon-gray mt-1 sm:mt-2 text-sm sm:text-base">管理孩子的积分奖励兑换</p>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <button
                onClick={() => setShowPointsHistory(true)}
                className="bg-gradient-to-r from-cartoon-blue to-primary-400 hover:from-primary-500 hover:to-primary-600 text-white px-3 sm:px-4 py-2 rounded-cartoon text-xs sm:text-sm font-medium transition-all duration-200 shadow-cartoon hover:shadow-cartoon-lg"
              >
                📊 积分历史
              </button>
              <button
                onClick={() => loadRedemptionRequests()}
                disabled={loading}
                className="bg-gradient-to-r from-cartoon-green to-success-400 hover:from-success-500 hover:to-success-600 text-white px-3 sm:px-4 py-2 rounded-cartoon text-xs sm:text-sm font-medium transition-all duration-200 shadow-cartoon hover:shadow-cartoon-lg disabled:opacity-50"
              >
                {loading ? '🔄 刷新中...' : '🔄 刷新'}
              </button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-danger-50 border border-danger-200 rounded-cartoon-lg p-4 mb-4 sm:mb-6">
            <div className="flex items-center space-x-2">
              <span className="text-danger-600">⚠️</span>
              <p className="text-danger-800 text-sm">{error}</p>
              <button
                onClick={() => setError('')}
                className="ml-auto text-danger-600 hover:text-danger-800"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Child Selector - Mobile-optimized */}
        {children.length > 0 && (
          <div className="mb-4 sm:mb-6">
            <div className="bg-white rounded-cartoon-lg shadow-cartoon p-4 sm:p-6 animate-bounce-in">
              <h2 className="text-lg font-semibold text-cartoon-dark mb-3 sm:mb-4 font-fun">👶 选择孩子</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => setSelectedChild(child.id)}
                    className={`
                      p-3 sm:p-4 rounded-cartoon-lg border-2 transition-all duration-200 text-left
                      ${selectedChild === child.id 
                        ? 'border-cartoon-green bg-cartoon-green/10 shadow-success' 
                        : 'border-cartoon-light bg-cartoon-light hover:border-cartoon-green/50 hover:shadow-cartoon'
                      }
                    `}
                  >
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cartoon-blue to-primary-400 rounded-cartoon flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-lg sm:text-xl">👦</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-cartoon-dark text-sm sm:text-base truncate">{child.name}</h3>
                        <div className="flex items-center space-x-1 sm:space-x-2 mt-1">
                          <PointsDisplay points={child.points} size="sm" showLabel={false} />
                          <span className="text-xs text-cartoon-gray">等级 {child.level}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentChild && (
          <>
            {/* Points Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-4 sm:mb-6">
              {/* Current Points */}
              <div className="bg-white rounded-cartoon-lg shadow-cartoon p-4 sm:p-6 animate-bounce-in">
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl mb-2 animate-float">💎</div>
                  <h3 className="font-bold text-cartoon-dark font-fun text-base sm:text-lg">当前积分</h3>
                  <div className="mt-2 sm:mt-3">
                    <PointsDisplay points={currentChild.points} size="md" />
                  </div>
                </div>
              </div>

              {/* Pending Requests */}
              <div className="bg-white rounded-cartoon-lg shadow-cartoon p-4 sm:p-6 animate-bounce-in">
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl mb-2 animate-float">⏳</div>
                  <h3 className="font-bold text-cartoon-dark font-fun text-base sm:text-lg">待审兑换</h3>
                  <div className="text-2xl sm:text-3xl font-bold text-cartoon-orange mt-2">
                    {pendingRequests.length}
                  </div>
                  <p className="text-xs sm:text-sm text-cartoon-gray mt-1">个请求等待审核</p>
                </div>
              </div>

              {/* Quick Stats Placeholders */}
              <div className="bg-white rounded-cartoon-lg shadow-cartoon p-4 sm:p-6 animate-bounce-in">
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl mb-2 animate-float">📈</div>
                  <h3 className="font-bold text-cartoon-dark font-fun text-base sm:text-lg">累计获得</h3>
                  <div className="text-2xl sm:text-3xl font-bold text-cartoon-green mt-2">
                    -
                  </div>
                  <p className="text-xs sm:text-sm text-cartoon-gray mt-1">总积分</p>
                </div>
              </div>

              <div className="bg-white rounded-cartoon-lg shadow-cartoon p-4 sm:p-6 animate-bounce-in">
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl mb-2 animate-float">📉</div>
                  <h3 className="font-bold text-cartoon-dark font-fun text-base sm:text-lg">累计消费</h3>
                  <div className="text-2xl sm:text-3xl font-bold text-cartoon-red mt-2">
                    -
                  </div>
                  <p className="text-xs sm:text-sm text-cartoon-gray mt-1">总积分</p>
                </div>
              </div>
            </div>

            {/* Pending Redemption Requests */}
            <div className="bg-white rounded-cartoon-lg shadow-cartoon p-4 sm:p-6 mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-cartoon-dark font-fun mb-3 sm:mb-4">🎁 待审批兑换请求</h2>
              
              {pendingRequests.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {pendingRequests.map((request) => (
                    <div key={request.id} className="border border-cartoon-light rounded-cartoon-lg p-4 hover:shadow-cartoon transition-all duration-200">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                        <div className="flex-1">
                          <h3 className="font-semibold text-cartoon-dark text-base sm:text-lg">{request.rewardTitle}</h3>
                          <p className="text-cartoon-gray text-sm mt-1">{request.rewardDescription}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs sm:text-sm text-cartoon-gray">
                            <span>👦 {request.studentName}</span>
                            <span>💰 {request.pointsCost} 积分</span>
                            <span>⏰ {formatTimeAgo(new Date(request.requestedAt))}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <button
                            onClick={() => handleRejectRedemption(request.id)}
                            disabled={processingRequest === request.id}
                            className="bg-gradient-to-r from-cartoon-red to-danger-400 hover:from-danger-500 hover:to-danger-600 text-white px-3 sm:px-4 py-2 rounded-cartoon text-xs sm:text-sm font-medium transition-all duration-200 shadow-cartoon hover:shadow-cartoon-lg disabled:opacity-50"
                          >
                            ❌ {processingRequest === request.id ? '处理中...' : '拒绝'}
                          </button>
                          <button
                            onClick={() => handleApproveRedemption(request.id)}
                            disabled={processingRequest === request.id}
                            className="bg-gradient-to-r from-cartoon-green to-success-400 hover:from-success-500 hover:to-success-600 text-white px-3 sm:px-4 py-2 rounded-cartoon text-xs sm:text-sm font-medium transition-all duration-200 shadow-cartoon hover:shadow-cartoon-lg disabled:opacity-50"
                          >
                            ✅ {processingRequest === request.id ? '处理中...' : '批准'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12 text-cartoon-gray">
                  <div className="text-4xl sm:text-6xl mb-4">🎁</div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">暂无兑换请求</h3>
                  <p className="text-sm">孩子提交兑换请求后会出现在这里</p>
                </div>
              )}
            </div>

<<<<<<< HEAD
            {/* Special Rewards Approval */}
            <div className="bg-white rounded-cartoon-lg shadow-cartoon p-4 sm:p-6 mb-4 sm:mb-6">
              <SpecialRewardApproval 
                onRequestSuccess={() => {
                  // Refresh pending approvals
                  console.log('Special reward approval completed');
                }}
                userPoints={0} // TODO: Get from parent user context
              />
            </div>
=======
>>>>>>> origin/master
            {/* Points Management Guide */}
            <div className="bg-white rounded-cartoon-lg shadow-cartoon p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-cartoon-dark font-fun mb-3 sm:mb-4">📖 积分管理指南</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <h3 className="font-semibold text-cartoon-dark mb-2 text-sm sm:text-base">✅ 批准标准</h3>
                  <ul className="text-xs sm:text-sm text-cartoon-gray space-y-1">
                    <li>• 孩子表现良好，值得奖励</li>
                    <li>• 兑换内容合理健康</li>
                    <li>• 积分花费适度</li>
                    <li>• 有利于激励学习</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-cartoon-dark mb-2 text-sm sm:text-base">❌ 拒绝情况</h3>
                  <ul className="text-xs sm:text-sm text-cartoon-gray space-y-1">
                    <li>• 兑换内容不合适</li>
                    <li>• 近期表现需要改进</li>
                    <li>• 积分花费过度</li>
                    <li>• 不利于学习习惯培养</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Empty State */}
        {!loading && children.length === 0 && !error && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👨‍👩‍👧‍👦</div>
            <h3 className="text-xl font-semibold text-cartoon-dark mb-2">还没有孩子账户</h3>
            <p className="text-cartoon-gray mb-4">请先为您的孩子创建学生账户</p>
            <button
              onClick={() => navigate('/register')}
              className="bg-gradient-to-r from-cartoon-green to-success-400 hover:from-success-500 hover:to-success-600 text-white py-3 px-6 rounded-cartoon-lg transition-all duration-200 shadow-cartoon hover:shadow-cartoon-lg"
            >
              创建学生账户
            </button>
          </div>
        )}
      </div>

      {/* Points History Modal */}
      <PointsHistory
        isOpen={showPointsHistory}
        onClose={() => setShowPointsHistory(false)}
      />
    </Layout>
  );
};

export default ParentRewardsPage;