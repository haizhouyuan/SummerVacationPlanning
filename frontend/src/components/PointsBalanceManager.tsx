import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface PointsSummary {
  dailyStats: {
    totalToday: number;
    dailyLimit: number;
    dailyRemaining: number;
    activitiesBreakdown: { [activity: string]: { current: number; limit?: number } };
  };
  weeklyStats: {
    totalThisWeek: number;
    weeklyLimit: number;
    weeklyRemaining: number;
    weekStartDate: string;
    weekEndDate: string;
  };
  userTotalPoints: number;
}

interface PointsLimitCheck {
  canAdd: boolean;
  maxCanAdd: number;
  limitedBy: 'daily' | 'weekly' | 'activity' | 'none';
  reason?: string;
  dailyCheck: {
    currentDailyTotal: number;
    dailyLimit: number;
  };
  weeklyCheck: {
    currentWeeklyTotal: number;
    weeklyLimit: number;
  };
}

const PointsBalanceManager: React.FC = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<PointsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any>(null);
  
  // 测试积分添加表单
  const [testForm, setTestForm] = useState({
    pointsToAdd: 5,
    activityType: 'diary',
    reason: '完成日记任务',
    date: new Date().toISOString().split('T')[0],
  });

  const loadSummary = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getUserPointsSummary();
      setSummary(response.data);
    } catch (err: any) {
      setError(err.message || '加载积分摘要失败');
      console.error('积分摘要加载失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, [user]);

  const handleTestPointsLimit = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.checkPointsLimits({
        date: testForm.date,
        pointsToAdd: testForm.pointsToAdd,
        activityType: testForm.activityType,
      });
      setTestResult({
        type: 'check',
        data: response.data,
        message: response.message,
      });
    } catch (err: any) {
      setError(err.message || '检查积分限制失败');
      console.error('检查积分限制失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPoints = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.addPointsWithLimits({
        date: testForm.date,
        pointsToAdd: testForm.pointsToAdd,
        activityType: testForm.activityType,
        reason: testForm.reason,
      });
      setTestResult({
        type: 'add',
        data: response.data,
        message: response.message,
        success: response.success,
      });
      
      // 重新加载摘要
      if (response.success) {
        await loadSummary();
      }
    } catch (err: any) {
      setError(err.message || '添加积分失败');
      console.error('添加积分失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN');
  };

  const getProgressPercentage = (current: number, limit: number) => {
    return Math.min((current / limit) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (!user) {
    return <div className="text-center text-gray-500">请先登录</div>;
  }

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">🎯 积分平衡管理</h2>
        <button
          onClick={loadSummary}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {loading ? '刷新中...' : '🔄 刷新'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="text-red-400">⚠️</div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">错误</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* 积分摘要 */}
      {summary && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 每日积分状态 */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📅 每日积分状态</h3>
            
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">今日获得积分</span>
                <span className="font-medium text-gray-900">
                  {summary.dailyStats.totalToday}/{summary.dailyStats.dailyLimit}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    getProgressColor(getProgressPercentage(summary.dailyStats.totalToday, summary.dailyStats.dailyLimit))
                  }`}
                  style={{
                    width: `${getProgressPercentage(summary.dailyStats.totalToday, summary.dailyStats.dailyLimit)}%`
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                剩余: {summary.dailyStats.dailyRemaining} 积分
              </p>
            </div>

            {/* 活动明细 */}
            {Object.keys(summary.dailyStats.activitiesBreakdown).length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">活动明细</h4>
                {Object.entries(summary.dailyStats.activitiesBreakdown).map(([activity, data]) => (
                  <div key={activity} className="flex justify-between text-sm">
                    <span className="text-gray-600">{activity}</span>
                    <span className="text-gray-900">
                      {data.current}{data.limit ? `/${data.limit}` : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 周累积积分状态 */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 周累积状态</h3>
            
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">本周累积积分</span>
                <span className="font-medium text-gray-900">
                  {summary.weeklyStats.totalThisWeek}/{summary.weeklyStats.weeklyLimit}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    getProgressColor(getProgressPercentage(summary.weeklyStats.totalThisWeek, summary.weeklyStats.weeklyLimit))
                  }`}
                  style={{
                    width: `${getProgressPercentage(summary.weeklyStats.totalThisWeek, summary.weeklyStats.weeklyLimit)}%`
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                剩余: {summary.weeklyStats.weeklyRemaining} 积分
              </p>
            </div>

            <div className="text-sm text-gray-600">
              <p>周期: {formatDate(summary.weeklyStats.weekStartDate)} - {formatDate(summary.weeklyStats.weekEndDate)}</p>
              <p className="mt-1">总积分: <span className="font-medium text-gray-900">{summary.userTotalPoints}</span></p>
            </div>
          </div>
        </div>
      )}

      {/* 测试工具 */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🧪 积分系统测试</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">日期</label>
            <input
              type="date"
              value={testForm.date}
              onChange={(e) => setTestForm({...testForm, date: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">积分数量</label>
            <input
              type="number"
              min="1"
              max="50"
              value={testForm.pointsToAdd}
              onChange={(e) => setTestForm({...testForm, pointsToAdd: parseInt(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">活动类型</label>
            <select
              value={testForm.activityType}
              onChange={(e) => setTestForm({...testForm, activityType: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="diary">日记</option>
              <option value="math_video">数学视频</option>
              <option value="olympiad_problem">奥数题</option>
              <option value="general_exercise">运动</option>
              <option value="programming_game">编程游戏</option>
              <option value="music_practice">音乐练习</option>
              <option value="chores">家务劳动</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">原因</label>
            <input
              type="text"
              value={testForm.reason}
              onChange={(e) => setTestForm({...testForm, reason: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="完成任务"
            />
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleTestPointsLimit}
            disabled={loading}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            🔍 检查限制
          </button>
          <button
            onClick={handleAddPoints}
            disabled={loading}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            ➕ 添加积分
          </button>
        </div>

        {/* 测试结果 */}
        {testResult && (
          <div className={`mt-4 p-4 rounded-lg ${
            testResult.success === false ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'
          }`}>
            <h4 className="font-medium mb-2">
              {testResult.type === 'check' ? '🔍 限制检查结果' : '➕ 积分添加结果'}
            </h4>
            <p className="text-sm mb-2">{testResult.message}</p>
            
            {testResult.data && (
              <div className="text-xs space-y-1">
                {testResult.type === 'check' && (
                  <>
                    <p>可以添加: {testResult.data.canAdd ? '是' : '否'}</p>
                    <p>最大可添加: {testResult.data.maxCanAdd}</p>
                    <p>限制原因: {testResult.data.limitedBy}</p>
                    {testResult.data.reason && <p>详情: {testResult.data.reason}</p>}
                  </>
                )}
                
                {testResult.type === 'add' && (
                  <>
                    <p>实际添加: {testResult.data.pointsAdded} 积分</p>
                    <p>新的每日总数: {testResult.data.newDailyTotal}</p>
                    <p>新的周总数: {testResult.data.newWeeklyTotal}</p>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PointsBalanceManager;