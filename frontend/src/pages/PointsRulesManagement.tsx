import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { pointsConfigService } from '../services/pointsConfigService';

interface PointsRule {
  id: string;
  category: 'exercise' | 'reading' | 'chores' | 'learning' | 'creativity' | 'other';
  activity: string;
  basePoints: number;
  bonusRules?: {
    type: 'word_count' | 'duration' | 'quality' | 'completion';
    threshold: number;
    bonusPoints: number;
    maxBonus?: number;
  }[];
  dailyLimit?: number;
  multipliers?: {
    difficulty?: { [key: string]: number };
    quality?: { [key: string]: number };
    medal?: { [key: string]: number };
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface GameTimeConfig {
  id: string;
  baseGameTimeMinutes: number;
  pointsToMinutesRatio: number;
  educationalGameBonus: number;
  dailyGameTimeLimit: number;
  freeEducationalMinutes: number;
  weeklyAccumulationLimit: number;
  dailyPointsLimit: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PointsRulesManagement: React.FC = () => {
  const { user } = useAuth();
  const [pointsRules, setPointsRules] = useState<PointsRule[]>([]);
  const [gameTimeConfig, setGameTimeConfig] = useState<GameTimeConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingRule, setEditingRule] = useState<PointsRule | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // New form state for create form
  const [newRule, setNewRule] = useState({
    category: '',
    activity: '',
    basePoints: 0,
    dailyLimit: undefined as number | undefined,
    isActive: true,
    bonusRules: [] as any[],
    multipliers: undefined as any
  });

  useEffect(() => {
    fetchPointsRules();
    fetchGameTimeConfig();
  }, []);

  // Only allow parents to access this page
  if (!user || user.role !== 'parent') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">访问被拒绝</h2>
          <p className="text-gray-700">只有家长可以访问积分规则管理界面。</p>
        </div>
      </div>
    );
  }

  const fetchPointsRules = async () => {
    try {
      const data = await pointsConfigService.getPointsRules();
      
      if (data.success && data.data) {
        setPointsRules(data.data.pointsRules);
      } else {
        setError(data.error || '获取积分规则失败');
      }
    } catch (error) {
      console.error('获取积分规则失败:', error);
      setError('获取积分规则失败');
    }
  };

  const fetchGameTimeConfig = async () => {
    try {
      const data = await pointsConfigService.getGameTimeConfig();
      
      if (data.success && data.data) {
        setGameTimeConfig(data.data.gameTimeConfig);
      }
    } catch (error) {
      console.error('获取游戏时间配置失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePointsRule = async (ruleId: string, updates: Partial<PointsRule>) => {
    try {
      const data = await pointsConfigService.updatePointsRule(ruleId, updates);
      
      if (data.success) {
        setSuccess('积分规则更新成功！');
        setEditingRule(null);
        fetchPointsRules();
      } else {
        setError(data.error || '更新积分规则失败');
      }
    } catch (error) {
      console.error('更新积分规则失败:', error);
      setError('更新积分规则失败');
    }
  };

  const createPointsRule = async () => {
    try {
      // Validate required fields
      if (!newRule.category || !newRule.activity || newRule.basePoints < 0) {
        setError('请填写所有必填字段：类别、活动名称和基础积分');
        return;
      }

      const ruleData = {
        category: newRule.category as 'exercise' | 'reading' | 'chores' | 'learning' | 'creativity' | 'other',
        activity: newRule.activity,
        basePoints: newRule.basePoints,
        dailyLimit: newRule.dailyLimit,
        isActive: newRule.isActive,
        bonusRules: newRule.bonusRules,
        multipliers: newRule.multipliers
      };

      const data = await pointsConfigService.createPointsRule(ruleData);
      
      if (data.success) {
        setSuccess('积分规则创建成功！');
        setShowCreateForm(false);
        // Reset form
        setNewRule({
          category: '',
          activity: '',
          basePoints: 0,
          dailyLimit: undefined,
          isActive: true,
          bonusRules: [],
          multipliers: undefined
        });
        fetchPointsRules();
      } else {
        setError(data.error || '创建积分规则失败');
      }
    } catch (error) {
      console.error('创建积分规则失败:', error);
      setError('创建积分规则失败');
    }
  };

  const updateGameTimeConfig = async (updates: Partial<GameTimeConfig>) => {
    try {
      const data = await pointsConfigService.updateGameTimeConfig(updates);
      
      if (data.success) {
        setSuccess('游戏时间配置更新成功！');
        fetchGameTimeConfig();
      } else {
        setError(data.error || '更新游戏时间配置失败');
      }
    } catch (error) {
      console.error('更新游戏时间配置失败:', error);
      setError('更新游戏时间配置失败');
    }
  };

  const toggleRuleStatus = async (ruleId: string, currentStatus: boolean) => {
    try {
      const data = await pointsConfigService.updatePointsRule(ruleId, { isActive: !currentStatus });
      
      if (data.success) {
        setSuccess(`规则已${!currentStatus ? '启用' : '禁用'}！`);
        fetchPointsRules();
      } else {
        setError(data.error || '更新规则状态失败');
      }
    } catch (error) {
      console.error('更新规则状态失败:', error);
      setError('更新规则状态失败');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">积分规则管理</h1>
          <p className="text-gray-600">家长可以在这里调整各类任务的积分规则和每日上限设置</p>
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm">
              ⚠️ <strong>重要提示：</strong>请慎重设置积分规则，这将直接影响孩子的积分获得和游戏时间兑换。建议在修改前与孩子沟通。
            </p>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
            <button onClick={() => setError(null)} className="float-right text-red-500 hover:text-red-700">×</button>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            {success}
            <button onClick={() => setSuccess(null)} className="float-right text-green-500 hover:text-green-700">×</button>
          </div>
        )}

        {/* Game Time Configuration */}
        {gameTimeConfig && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">游戏时间配置</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">每日积分上限</label>
                <input
                  type="number"
                  value={gameTimeConfig.dailyPointsLimit || 20}
                  onChange={(e) => updateGameTimeConfig({ dailyPointsLimit: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">基础游戏时间(分钟)</label>
                <input
                  type="number"
                  value={gameTimeConfig.baseGameTimeMinutes}
                  onChange={(e) => updateGameTimeConfig({ baseGameTimeMinutes: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">积分兑换比例(分钟/积分)</label>
                <input
                  type="number"
                  value={gameTimeConfig.pointsToMinutesRatio}
                  onChange={(e) => updateGameTimeConfig({ pointsToMinutesRatio: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Points Rules */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">积分规则列表</h2>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {showCreateForm ? '取消' : '新增规则'}
            </button>
          </div>

          {/* Create Form */}
          {showCreateForm && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-semibold mb-4">创建新积分规则</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <select 
                  value={newRule.category}
                  onChange={(e) => setNewRule({...newRule, category: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">选择类别</option>
                  <option value="exercise">运动</option>
                  <option value="reading">阅读</option>
                  <option value="chores">家务</option>
                  <option value="learning">学习</option>
                  <option value="creativity">创意</option>
                  <option value="other">其他</option>
                </select>
                <input
                  type="text"
                  placeholder="活动名称"
                  value={newRule.activity}
                  onChange={(e) => setNewRule({...newRule, activity: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="number"
                  placeholder="基础积分"
                  value={newRule.basePoints}
                  onChange={(e) => setNewRule({...newRule, basePoints: parseInt(e.target.value) || 0})}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  min="0"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input
                  type="number"
                  placeholder="每日上限 (可选)"
                  value={newRule.dailyLimit || ''}
                  onChange={(e) => setNewRule({...newRule, dailyLimit: e.target.value ? parseInt(e.target.value) : undefined})}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  min="1"
                />
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newRule.isActive}
                    onChange={(e) => setNewRule({...newRule, isActive: e.target.checked})}
                    className="rounded border-gray-300 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">启用规则</span>
                </label>
              </div>
              <div className="mt-4 flex gap-2">
                <button 
                  onClick={createPointsRule}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                >
                  创建
                </button>
                <button 
                  onClick={() => setShowCreateForm(false)}
                  className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          )}

          {/* Rules Table */}
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left">类别</th>
                  <th className="px-4 py-2 text-left">活动</th>
                  <th className="px-4 py-2 text-left">基础积分</th>
                  <th className="px-4 py-2 text-left">每日上限</th>
                  <th className="px-4 py-2 text-left">奖励规则</th>
                  <th className="px-4 py-2 text-left">状态</th>
                  <th className="px-4 py-2 text-left">操作</th>
                </tr>
              </thead>
              <tbody>
                {pointsRules.map((rule) => (
                  <tr key={rule.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {getCategoryName(rule.category)}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-medium">{rule.activity}</td>
                    <td className="px-4 py-2">
                      {editingRule?.id === rule.id ? (
                        <input
                          type="number"
                          value={editingRule.basePoints}
                          onChange={(e) => setEditingRule({ ...editingRule, basePoints: parseInt(e.target.value) })}
                          className="w-20 px-2 py-1 border border-gray-300 rounded"
                        />
                      ) : (
                        rule.basePoints
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {editingRule?.id === rule.id ? (
                        <input
                          type="number"
                          value={editingRule.dailyLimit || ''}
                          onChange={(e) => setEditingRule({ ...editingRule, dailyLimit: e.target.value ? parseInt(e.target.value) : undefined })}
                          className="w-20 px-2 py-1 border border-gray-300 rounded"
                          placeholder="无限制"
                        />
                      ) : (
                        rule.dailyLimit || '无限制'
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {rule.bonusRules && rule.bonusRules.length > 0 ? (
                        <div className="text-xs text-gray-600">
                          {rule.bonusRules.map((bonus, idx) => (
                            <div key={idx}>
                              {bonus.type === 'word_count' && `每${bonus.threshold}字 +${bonus.bonusPoints}分`}
                              {bonus.type === 'duration' && `每${bonus.threshold}分钟 +${bonus.bonusPoints}分`}
                              {bonus.type === 'quality' && `优秀表现 +${bonus.bonusPoints}分`}
                              {bonus.type === 'completion' && `完成奖励 +${bonus.bonusPoints}分`}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">无</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {editingRule?.id === rule.id ? (
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={editingRule.isActive}
                            onChange={(e) => setEditingRule({ ...editingRule, isActive: e.target.checked })}
                            className="rounded border-gray-300 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700">启用</span>
                        </label>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                            rule.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {rule.isActive ? '启用' : '禁用'}
                          </span>
                          <button
                            onClick={() => toggleRuleStatus(rule.id, rule.isActive)}
                            className={`text-xs px-2 py-1 rounded transition-colors ${
                              rule.isActive 
                                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                            title={rule.isActive ? '点击禁用' : '点击启用'}
                          >
                            {rule.isActive ? '禁用' : '启用'}
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {editingRule?.id === rule.id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => updatePointsRule(rule.id, editingRule)}
                            className="text-green-600 hover:text-green-800 text-sm"
                          >
                            保存
                          </button>
                          <button
                            onClick={() => setEditingRule(null)}
                            className="text-gray-600 hover:text-gray-800 text-sm"
                          >
                            取消
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingRule(rule)}
                          className="text-indigo-600 hover:text-indigo-800 text-sm"
                        >
                          编辑
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const getCategoryName = (category: string): string => {
  const categoryMap: { [key: string]: string } = {
    exercise: '运动',
    reading: '阅读',
    chores: '家务',
    learning: '学习',
    creativity: '创意',
    other: '其他',
  };
  return categoryMap[category] || category;
};

export default PointsRulesManagement;