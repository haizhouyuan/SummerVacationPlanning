import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import PointsDisplay from '../components/PointsDisplay';
import ProgressBar from '../components/ProgressBar';
import CelebrationModal from '../components/CelebrationModal';
import AchievementBadge from '../components/AchievementBadge';
import TaskCategoryIcon from '../components/TaskCategoryIcon';
import DailyTaskCard from '../components/DailyTaskCard';
import FamilyManagement from '../components/FamilyManagement';
import TaskApprovalWorkflow from '../components/TaskApprovalWorkflow';
import FamilyLeaderboard from '../components/FamilyLeaderboard';

interface Child {
  id: string;
  name: string;
  email: string;
  points: number;
  level: number;
  avatar?: string;
  streakDays: number;
  tasksCompleted: number;
  weeklyGoal: number;
  weeklyProgress: number;
}

interface ChildStats {
  dailyTasks: any[];
  weeklyStats: {
    completed: number;
    planned: number;
    skipped: number;
  };
  categoryBreakdown: { [key: string]: number };
  achievements: any[];
}

const ParentDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [showCelebration, setShowCelebration] = useState(false);
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month'>('week');
  const [showFamilyManagement, setShowFamilyManagement] = useState(false);
  const [showTaskApproval, setShowTaskApproval] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');


  const [children, setChildren] = useState<Child[]>([]);
  const [childStats, setChildStats] = useState<{ [key: string]: ChildStats }>({});

  // Load children data from API
  useEffect(() => {
    const loadChildrenData = async () => {
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
          
          // Load stats for each child
          const statsPromises = childrenData.map(async (child: Child) => {
            try {
              const statsResponse = await apiService.getChildStats(child.id) as any;
              if (statsResponse.success) {
                return { childId: child.id, stats: statsResponse.data.stats };
              }
            } catch (error) {
              console.error(`Failed to load stats for child ${child.id}:`, error);
            }
            return null;
          });
          
          const allStats = await Promise.all(statsPromises);
          const statsMap: { [key: string]: ChildStats } = {};
          
          allStats.forEach((result: any) => {
            if (result) {
              statsMap[result.childId] = result.stats;
            }
          });
          
          setChildStats(statsMap);
        } else {
          setError('加载孩子数据失败');
        }
      } catch (error: any) {
        console.error('Error loading children data:', error);
        setError(error.message || '网络错误，请重试');
      } finally {
        setLoading(false);
      }
    };

    loadChildrenData();
  }, [user, selectedChild]);

  useEffect(() => {
    if (children.length > 0 && !selectedChild) {
      setSelectedChild(children[0].id);
    }
  }, [children, selectedChild]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getCurrentChildData = () => {
    return children.find(child => child.id === selectedChild);
  };

  const getCurrentChildStats = () => {
    return childStats[selectedChild] || { dailyTasks: [], weeklyStats: { completed: 0, planned: 0, skipped: 0 }, categoryBreakdown: {}, achievements: [] };
  };

  const getTimeFilterText = () => {
    const textMap = {
      today: '今日',
      week: '本周',
      month: '本月',
    };
    return textMap[timeFilter];
  };

  if (!user || user.role !== 'parent') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cartoon-light via-primary-50 to-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-cartoon-dark mb-2">访问受限</h2>
          <p className="text-cartoon-gray">此页面仅供家长用户访问</p>
        </div>
      </div>
    );
  }

  const currentChild = getCurrentChildData();
  const currentStats = getCurrentChildStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-cartoon-light via-primary-50 to-secondary-50">
      {/* Header */}
      <div className="bg-white shadow-cartoon">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-gradient-to-br from-cartoon-purple to-primary-400 rounded-cartoon flex items-center justify-center animate-float">
                <span className="text-white text-xl font-bold">👨‍👩‍👧‍👦</span>
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-cartoon-dark font-fun">家长控制台</h1>
                <p className="text-sm text-cartoon-gray">监控孩子的学习进展 📊</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Management Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowTaskApproval(true)}
                  className="bg-gradient-to-r from-cartoon-orange to-secondary-400 hover:from-secondary-500 hover:to-secondary-600 text-white px-3 py-2 rounded-cartoon text-sm font-medium transition-all duration-200 shadow-cartoon hover:shadow-cartoon-lg"
                >
                  ✅ 任务审批
                </button>
                <button
                  onClick={() => setShowFamilyManagement(true)}
                  className="bg-gradient-to-r from-cartoon-purple to-primary-400 hover:from-primary-500 hover:to-primary-600 text-white px-3 py-2 rounded-cartoon text-sm font-medium transition-all duration-200 shadow-cartoon hover:shadow-cartoon-lg"
                >
                  👨‍👩‍👧‍👦 家庭管理
                </button>
              </div>
              
              <div className="text-right">
                <p className="text-sm font-medium text-cartoon-dark">{user.displayName}</p>
                <p className="text-xs text-cartoon-gray">👨‍👩‍👧‍👦 家长账户</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-gradient-to-r from-cartoon-red to-danger-500 hover:from-cartoon-red hover:to-danger-600 text-white px-4 py-2 rounded-cartoon text-sm font-medium transition-all duration-200 shadow-cartoon hover:shadow-cartoon-lg"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error State */}
        {error && (
          <div className="mb-6 bg-danger-50 border border-danger-200 rounded-cartoon-lg p-4">
            <div className="flex items-center space-x-2">
              <span className="text-danger-600">⚠️</span>
              <p className="text-danger-800">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="ml-auto bg-danger-600 hover:bg-danger-700 text-white px-3 py-1 rounded-cartoon text-sm"
              >
                重试
              </button>
            </div>
          </div>
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

        {/* Child Selector */}
        {children.length > 0 && (
          <div className="mb-6">
            <div className="bg-white rounded-cartoon-lg shadow-cartoon p-6 animate-bounce-in">
              <h2 className="text-lg font-semibold text-cartoon-dark mb-4 font-fun">👶 选择孩子</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => setSelectedChild(child.id)}
                    className={`
                      p-4 rounded-cartoon-lg border-2 transition-all duration-200 text-left
                      ${selectedChild === child.id 
                        ? 'border-cartoon-green bg-cartoon-green/10 shadow-success' 
                        : 'border-cartoon-light bg-cartoon-light hover:border-cartoon-green/50 hover:shadow-cartoon'
                      }
                    `}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-cartoon-blue to-primary-400 rounded-cartoon flex items-center justify-center">
                        <span className="text-white text-xl">👦</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-cartoon-dark">{child.name}</h3>
                        <div className="flex items-center space-x-2 mt-1">
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
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {/* Child Overview */}
              <div className="bg-white rounded-cartoon-lg shadow-cartoon p-6 animate-bounce-in">
                <div className="text-center">
                  <div className="text-4xl mb-2 animate-float">👦</div>
                  <h3 className="font-bold text-cartoon-dark font-fun">{currentChild.name}</h3>
                  <div className="mt-3">
                    <PointsDisplay points={currentChild.points} size="md" />
                  </div>
                  <div className="mt-2 text-sm text-cartoon-gray">
                    等级 {currentChild.level} • {currentChild.tasksCompleted} 个任务完成
                  </div>
                </div>
              </div>

              {/* Weekly Progress */}
              <div className="bg-white rounded-cartoon-lg shadow-cartoon p-6 animate-bounce-in">
                <h3 className="font-semibold text-cartoon-dark mb-3 font-fun">📅 本周进度</h3>
                <ProgressBar
                  current={currentChild.weeklyProgress}
                  max={currentChild.weeklyGoal}
                  label="任务完成"
                  size="md"
                  animated={true}
                />
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center p-2 bg-cartoon-green/10 rounded-cartoon">
                    <div className="font-bold text-cartoon-green">{currentStats.weeklyStats.completed}</div>
                    <div className="text-cartoon-gray">已完成</div>
                  </div>
                  <div className="text-center p-2 bg-cartoon-orange/10 rounded-cartoon">
                    <div className="font-bold text-cartoon-orange">{currentStats.weeklyStats.planned}</div>
                    <div className="text-cartoon-gray">计划中</div>
                  </div>
                  <div className="text-center p-2 bg-cartoon-red/10 rounded-cartoon">
                    <div className="font-bold text-cartoon-red">{currentStats.weeklyStats.skipped}</div>
                    <div className="text-cartoon-gray">已跳过</div>
                  </div>
                </div>
              </div>

              {/* Streak */}
              <div className="bg-white rounded-cartoon-lg shadow-cartoon p-6 animate-bounce-in">
                <h3 className="font-semibold text-cartoon-dark mb-3 font-fun">🔥 连续记录</h3>
                <div className="text-center">
                  <div className="text-3xl font-bold text-cartoon-orange mb-1">
                    {currentChild.streakDays}
                  </div>
                  <div className="text-sm text-cartoon-gray">连续天数</div>
                  <div className="mt-3 flex justify-center space-x-1">
                    {Array.from({ length: 7 }, (_, i) => (
                      <div
                        key={i}
                        className={`
                          w-6 h-6 rounded-cartoon text-xs flex items-center justify-center
                          ${i < currentChild.streakDays 
                            ? 'bg-cartoon-orange text-white' 
                            : 'bg-cartoon-light text-cartoon-gray'
                          }
                        `}
                      >
                        {i < currentChild.streakDays ? '🔥' : '○'}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="bg-white rounded-cartoon-lg shadow-cartoon p-6 animate-bounce-in">
                <h3 className="font-semibold text-cartoon-dark mb-3 font-fun">📊 分类统计</h3>
                <div className="space-y-2">
                  {Object.entries(currentStats.categoryBreakdown).map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <TaskCategoryIcon category={category} size="sm" animated={false} />
                        <span className="text-sm text-cartoon-gray capitalize">{category}</span>
                      </div>
                      <span className="font-bold text-cartoon-green">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Time Filter */}
            <div className="mb-6">
              <div className="bg-white rounded-cartoon-lg shadow-cartoon p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-cartoon-dark font-fun">⏱️ 时间筛选</h3>
                  <div className="flex space-x-2">
                    {(['today', 'week', 'month'] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setTimeFilter(filter)}
                        className={`
                          px-4 py-2 rounded-cartoon text-sm font-medium transition-all duration-200
                          ${timeFilter === filter
                            ? 'bg-cartoon-green text-white shadow-cartoon'
                            : 'bg-cartoon-light text-cartoon-gray hover:bg-cartoon-green/10'
                          }
                        `}
                      >
                        {getTimeFilterText()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Today's Tasks */}
              <div className="bg-white rounded-cartoon-lg shadow-cartoon p-6">
                <h3 className="font-semibold text-cartoon-dark mb-4 font-fun">📋 {getTimeFilterText()}任务</h3>
                <div className="space-y-4">
                  {currentStats.dailyTasks.length > 0 ? (
                    currentStats.dailyTasks.map((dailyTask) => (
                      <DailyTaskCard
                        key={dailyTask.id}
                        dailyTask={dailyTask}
                        showActions={false}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8 text-cartoon-gray">
                      <div className="text-4xl mb-2">📋</div>
                      <p>暂无{getTimeFilterText()}任务</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Achievements */}
              <div className="bg-white rounded-cartoon-lg shadow-cartoon p-6">
                <h3 className="font-semibold text-cartoon-dark mb-4 font-fun">🏆 成就徽章</h3>
                <div className="grid grid-cols-2 gap-4">
                  {currentStats.achievements.map((achievement, index) => (
                    <AchievementBadge
                      key={index}
                      type={achievement.type}
                      level={achievement.level}
                      title={achievement.title}
                      description={achievement.description}
                      isUnlocked={achievement.isUnlocked}
                      size="sm"
                    />
                  ))}
                </div>
              </div>

              {/* Family Leaderboard */}
              <FamilyLeaderboard />
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <CelebrationModal
        isOpen={showCelebration}
        onClose={() => setShowCelebration(false)}
        type="achievement"
        title="孩子完成了新成就！"
        message="恭喜您的孩子达成新的里程碑！"
        emoji="🎊"
      />

      <FamilyManagement
        isOpen={showFamilyManagement}
        onClose={() => setShowFamilyManagement(false)}
      />

      <TaskApprovalWorkflow
        isOpen={showTaskApproval}
        onClose={() => setShowTaskApproval(false)}
      />
    </div>
  );
};

export default ParentDashboard;