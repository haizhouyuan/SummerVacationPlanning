import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../components/NotificationSystem';
import { apiService } from '../services/api';

const RecurringTasksManagement: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [patterns, setPatterns] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loadingPatterns, setLoadingPatterns] = useState(true);
  const [daysAhead, setDaysAhead] = useState(7);

  useEffect(() => {
    if (user?.role === 'parent') {
      loadRecurringPatterns();
      loadRecurringStats();
    }
  }, [user]);

  const loadRecurringPatterns = async () => {
    try {
      setLoadingPatterns(true);
      const response = await apiService.getRecurringPatterns();
      setPatterns((response as any).data.patterns || []);
    } catch (error: any) {
      console.error('Error loading recurring patterns:', error);
      showError('加载失败', error.message || '加载重复任务模式失败');
    } finally {
      setLoadingPatterns(false);
    }
  };

  const loadRecurringStats = async () => {
    try {
      const response = await apiService.getRecurringTaskStats(30);
      setStats((response as any).data.stats);
    } catch (error: any) {
      console.error('Error loading recurring stats:', error);
    }
  };

  const handleGenerateRecurringTasks = async () => {
    try {
      setLoading(true);
      await apiService.generateRecurringTasks(daysAhead);
      showSuccess('生成成功', `成功生成未来 ${daysAhead} 天的重复任务！`);
      // Optionally refresh patterns or stats
      await loadRecurringPatterns();
    } catch (error: any) {
      console.error('Error generating recurring tasks:', error);
      showError('生成失败', error.message || '生成重复任务失败');
    } finally {
      setLoading(false);
    }
  };

  const getPatternDescription = (pattern: any) => {
    if (!pattern.recurringPattern) return '未知模式';
    
    switch (pattern.recurringPattern.type) {
      case 'daily':
        return '每日重复';
      case 'weekly':
        const days = pattern.recurringPattern.daysOfWeek || [];
        const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        return `每周 ${days.map((d: number) => dayNames[d]).join(', ')}`;
      case 'custom':
        return `每 ${pattern.recurringPattern.interval} 天重复`;
      default:
        return '未知模式';
    }
  };

  if (!user) {
    return <div>请先登录</div>;
  }

  if (user.role !== 'parent') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">权限不足</h2>
          <p className="text-gray-600">只有家长用户可以访问重复任务管理页面</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-100 to-secondary-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-primary-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xl font-bold">🔄</span>
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">重复任务管理</h1>
                <p className="text-sm text-gray-600">管理和生成重复任务</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.displayName}</p>
                <p className="text-xs text-gray-500">家长账户</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Generation Controls */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">生成重复任务</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    生成天数
                  </label>
                  <select
                    value={daysAhead}
                    onChange={(e) => setDaysAhead(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value={3}>未来 3 天</option>
                    <option value={7}>未来 7 天</option>
                    <option value={14}>未来 14 天</option>
                    <option value={30}>未来 30 天</option>
                  </select>
                </div>

                <button
                  onClick={handleGenerateRecurringTasks}
                  disabled={loading}
                  className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      生成中...
                    </>
                  ) : (
                    <>
                      <span className="mr-2">🚀</span>
                      生成重复任务
                    </>
                  )}
                </button>

                <div className="text-xs text-gray-500">
                  <p>此功能将根据现有的重复任务模式，自动生成未来指定天数内的任务实例。</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            {stats && (
              <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">统计信息</h3>
                <div className="space-y-3">
                  {stats.stats?.map((stat: any, index: number) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        {stat._id === 'completed' ? '已完成' :
                         stat._id === 'in_progress' ? '进行中' :
                         stat._id === 'planned' ? '计划中' : 
                         stat._id === 'skipped' ? '已跳过' : stat._id}:
                      </span>
                      <div className="text-right">
                        <span className="text-sm font-medium text-gray-900">{stat.count} 个</span>
                        {stat.totalPoints > 0 && (
                          <div className="text-xs text-gray-500">{stat.totalPoints} 积分</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Recurring Patterns */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  重复任务模式 ({patterns.length})
                </h3>
              </div>

              <div className="p-6">
                {loadingPatterns ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">加载中...</p>
                  </div>
                ) : patterns.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">📋</div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">暂无重复任务</h4>
                    <p className="text-gray-600">还没有设置重复任务模式</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {patterns.map((pattern, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <span className="text-lg mr-2">🔄</span>
                            <div>
                              <h4 className="font-medium text-gray-900">
                                任务 ID: {pattern.taskId}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {getPatternDescription(pattern)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-xs px-2 py-1 rounded-full ${
                              pattern.priority === 'high' ? 'bg-red-100 text-red-700' :
                              pattern.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {pattern.priority === 'high' ? '高' :
                               pattern.priority === 'medium' ? '中' : '低'}优先级
                            </div>
                            {pattern.timePreference && (
                              <div className="text-xs text-gray-500 mt-1">
                                偏好时间: {
                                  pattern.timePreference === 'morning' ? '上午' :
                                  pattern.timePreference === 'afternoon' ? '下午' :
                                  pattern.timePreference === 'evening' ? '晚上' : '灵活'
                                }
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Examples */}
                        {pattern.examples && pattern.examples.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-500 mb-2">最近实例:</p>
                            <div className="flex flex-wrap gap-1">
                              {pattern.examples.slice(0, 5).map((example: any, exIndex: number) => (
                                <span
                                  key={exIndex}
                                  className={`text-xs px-2 py-1 rounded ${
                                    example.status === 'completed' ? 'bg-green-100 text-green-700' :
                                    example.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                    'bg-gray-100 text-gray-700'
                                  }`}
                                >
                                  {example.date}
                                </span>
                              ))}
                            </div>
                          </div>
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
    </div>
  );
};

export default RecurringTasksManagement;