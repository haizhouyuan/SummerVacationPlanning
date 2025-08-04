import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import PointsDisplay from './PointsDisplay';

interface PointsTransaction {
  id: string;
  type: 'earn' | 'spend';
  amount: number;
  source: string;
  description: string;
  date: Date;
  details?: {
    taskTitle?: string;
    taskCategory?: string;
    difficulty?: string;
    originalPoints?: number;
    bonusPoints?: number;
    limitTruncated?: boolean;
    gameType?: 'normal' | 'educational';
    rewardTitle?: string;
  };
}

interface PointsHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

const PointsHistory: React.FC<PointsHistoryProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'all'>('week');
  const [typeFilter, setTypeFilter] = useState<'all' | 'earn' | 'spend'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadPointsHistory();
    }
  }, [isOpen, timeFilter, typeFilter]);

  const loadPointsHistory = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Since we don't have a specific points history API, 
      // we'll simulate by combining data from various sources
      const [dailyTasksResponse, exchangesResponse, redemptionsResponse] = await Promise.all([
        apiService.getDailyTasks({ 
          date: getDateRange().start,
          endDate: getDateRange().end,
          status: 'completed' 
        }).catch(() => ({ data: { dailyTasks: [] } })),
        apiService.getGameTimeExchanges({ 
          startDate: getDateRange().start,
          endDate: getDateRange().end 
        }).catch(() => ({ data: { exchanges: [] } })),
        apiService.getRedemptions({ 
          startDate: getDateRange().start,
          endDate: getDateRange().end 
        }).catch(() => ({ data: { redemptions: [] } }))
      ]);

      const allTransactions: PointsTransaction[] = [];

      // Add earning transactions from completed tasks
      if ((dailyTasksResponse as any).data?.dailyTasks) {
        (dailyTasksResponse as any).data.dailyTasks.forEach((dailyTask: any) => {
          if (dailyTask.pointsEarned > 0) {
            allTransactions.push({
              id: `task-${dailyTask.id}`,
              type: 'earn',
              amount: dailyTask.pointsEarned,
              source: 'task_completion',
              description: `完成任务: ${dailyTask.task?.title || '未知任务'}`,
              date: new Date(dailyTask.completedAt || dailyTask.updatedAt),
              details: {
                taskTitle: dailyTask.task?.title,
                taskCategory: dailyTask.task?.category,
                difficulty: dailyTask.task?.difficulty,
                originalPoints: dailyTask.task?.points,
              }
            });
          }
        });
      }

      // Add spending transactions from game time exchanges
      if ((exchangesResponse as any).data?.exchanges) {
        (exchangesResponse as any).data.exchanges.forEach((exchange: any) => {
          allTransactions.push({
            id: `exchange-${exchange.id}`,
            type: 'spend',
            amount: exchange.pointsSpent,
            source: 'game_time_exchange',
            description: `兑换游戏时间: ${exchange.minutesGranted}分钟${exchange.gameType === 'normal' ? '普通' : '教育'}游戏`,
            date: new Date(exchange.createdAt),
            details: {
              gameType: exchange.gameType,
            }
          });
        });
      }

      // Add spending transactions from redemptions
      if ((redemptionsResponse as any).data?.redemptions) {
        (redemptionsResponse as any).data.redemptions.forEach((redemption: any) => {
          if (redemption.status === 'approved') {
            allTransactions.push({
              id: `redemption-${redemption.id}`,
              type: 'spend',
              amount: redemption.pointsCost,
              source: 'reward_redemption',
              description: `兑换奖励: ${redemption.rewardTitle}`,
              date: new Date(redemption.processedAt || redemption.requestedAt),
              details: {
                rewardTitle: redemption.rewardTitle,
              }
            });
          }
        });
      }

      // Sort by date (newest first)
      allTransactions.sort((a, b) => b.date.getTime() - a.date.getTime());

      setTransactions(allTransactions);
    } catch (error: any) {
      console.error('Error loading points history:', error);
      setError('加载积分历史失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (timeFilter) {
      case 'today':
        return {
          start: today.toISOString().split('T')[0],
          end: today.toISOString().split('T')[0]
        };
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 7);
        return {
          start: weekStart.toISOString().split('T')[0],
          end: today.toISOString().split('T')[0]
        };
      case 'month':
        const monthStart = new Date(today);
        monthStart.setDate(today.getDate() - 30);
        return {
          start: monthStart.toISOString().split('T')[0],
          end: today.toISOString().split('T')[0]
        };
      default:
        return {
          start: '2024-01-01',
          end: today.toISOString().split('T')[0]
        };
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
    const matchesSearch = searchTerm === '' || 
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.source.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesType && matchesSearch;
  });

  const getTransactionIcon = (transaction: PointsTransaction) => {
    if (transaction.type === 'earn') {
      switch (transaction.details?.taskCategory) {
        case 'exercise': return '🏃‍♂️';
        case 'reading': return '📚';
        case 'chores': return '🧹';
        case 'learning': return '🧠';
        case 'creativity': return '🎨';
        default: return '⭐';
      }
    } else {
      switch (transaction.source) {
        case 'game_time_exchange': return '🎮';
        case 'reward_redemption': return '🎁';
        default: return '💰';
      }
    }
  };

  const getTransactionColor = (transaction: PointsTransaction) => {
    return transaction.type === 'earn' 
      ? 'text-green-600 bg-green-50 border-green-200'
      : 'text-red-600 bg-red-50 border-red-200';
  };

  const getSummaryStats = () => {
    const earned = filteredTransactions
      .filter(t => t.type === 'earn')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const spent = filteredTransactions
      .filter(t => t.type === 'spend')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      earned,
      spent,
      net: earned - spent,
      totalTransactions: filteredTransactions.length
    };
  };

  const stats = getSummaryStats();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-cartoon-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-cartoon-lg">
        {/* Header */}
        <div className="p-6 border-b border-cartoon-light">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-cartoon-dark font-fun">💎 积分历史记录</h2>
              <p className="text-cartoon-gray">查看积分的获得和使用详情</p>
            </div>
            <button
              onClick={onClose}
              className="text-cartoon-gray hover:text-cartoon-dark text-xl font-bold p-2 rounded-cartoon hover:bg-cartoon-light transition-all duration-200"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-cartoon-light">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.earned}</div>
              <div className="text-sm text-gray-600">总获得</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.spent}</div>
              <div className="text-sm text-gray-600">总消费</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${stats.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.net >= 0 ? '+' : ''}{stats.net}
              </div>
              <div className="text-sm text-gray-600">净收益</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalTransactions}</div>
              <div className="text-sm text-gray-600">总记录</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-cartoon-light">
          <div className="flex flex-wrap items-center gap-4">
            {/* Time Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">时间:</span>
              <div className="flex space-x-1">
                {[
                  { key: 'today', label: '今天' },
                  { key: 'week', label: '本周' },
                  { key: 'month', label: '本月' },
                  { key: 'all', label: '全部' }
                ].map(option => (
                  <button
                    key={option.key}
                    onClick={() => setTimeFilter(option.key as any)}
                    className={`px-3 py-1 rounded-cartoon text-sm font-medium transition-colors ${
                      timeFilter === option.key
                        ? 'bg-cartoon-blue text-white'
                        : 'bg-cartoon-light text-cartoon-gray hover:bg-cartoon-gray hover:text-white'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Type Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">类型:</span>
              <div className="flex space-x-1">
                {[
                  { key: 'all', label: '全部', color: 'bg-cartoon-gray' },
                  { key: 'earn', label: '获得', color: 'bg-green-500' },
                  { key: 'spend', label: '消费', color: 'bg-red-500' }
                ].map(option => (
                  <button
                    key={option.key}
                    onClick={() => setTypeFilter(option.key as any)}
                    className={`px-3 py-1 rounded-cartoon text-sm font-medium text-white transition-colors ${
                      typeFilter === option.key
                        ? option.color
                        : 'bg-cartoon-light text-cartoon-gray hover:bg-cartoon-gray'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="搜索交易记录..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-cartoon-light rounded-cartoon focus:outline-none focus:ring-2 focus:ring-cartoon-blue"
              />
            </div>
          </div>
        </div>

        {/* Transaction List */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-cartoon">
              <div className="flex items-center text-red-700">
                <span className="mr-2">⚠️</span>
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cartoon-blue mx-auto"></div>
              <p className="mt-4 text-cartoon-gray">加载积分记录中...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-cartoon-dark mb-2">暂无积分记录</h3>
              <p className="text-cartoon-gray">
                {timeFilter !== 'all' ? '尝试选择更长的时间范围' : '开始完成任务来获得积分吧！'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className={`border rounded-cartoon-lg p-4 transition-all duration-200 hover:shadow-cartoon ${getTransactionColor(transaction)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="text-2xl">
                        {getTransactionIcon(transaction)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-cartoon-dark">
                            {transaction.description}
                          </h4>
                          <div className={`text-lg font-bold ${
                            transaction.type === 'earn' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'earn' ? '+' : '-'}{transaction.amount} 分
                          </div>
                        </div>
                        
                        <div className="text-sm text-cartoon-gray mb-2">
                          {transaction.date.toLocaleString('zh-CN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>

                        {/* Transaction Details */}
                        {transaction.details && (
                          <div className="text-xs text-cartoon-gray bg-white bg-opacity-50 rounded p-2 mt-2">
                            {transaction.type === 'earn' && transaction.details.taskCategory && (
                              <div className="flex items-center space-x-4">
                                <span>类别: {
                                  {
                                    exercise: '运动', reading: '阅读', chores: '家务',
                                    learning: '学习', creativity: '创意', other: '其他'
                                  }[transaction.details.taskCategory] || transaction.details.taskCategory
                                }</span>
                                {transaction.details.difficulty && (
                                  <span>难度: {
                                    {
                                      easy: '简单(×1.0)', medium: '中等(×1.2)', hard: '困难(×1.5)'
                                    }[transaction.details.difficulty] || transaction.details.difficulty
                                  }</span>
                                )}
                                {transaction.details.originalPoints && (
                                  <span>基础: {transaction.details.originalPoints}分</span>
                                )}
                              </div>
                            )}
                            {transaction.type === 'spend' && transaction.details.gameType && (
                              <span>游戏类型: {transaction.details.gameType === 'normal' ? '普通游戏' : '教育游戏'}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PointsHistory;