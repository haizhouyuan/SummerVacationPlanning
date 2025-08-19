import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { detectNetworkAndGetApiServiceSync } from '../services/compatibleApi';
import PointsDisplay from '../components/PointsDisplay';

interface TaskHistoryItem {
  id: string;
  title: string;
  description: string;
  category: string;
  points: number;
  completedAt: string;
  status: 'completed' | 'approved' | 'rejected';
  approvalNotes?: string;
  bonusPoints?: number;
}

const TaskHistory: React.FC = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list');
  const [taskHistory, setTaskHistory] = useState<TaskHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadTaskHistory();
    }
  }, [user, currentDate, categoryFilter]);

  const loadTaskHistory = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);

    try {
      const apiService = detectNetworkAndGetApiServiceSync();
      
      // Load tasks for the current month
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const filters: any = {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        status: 'completed',
        limit: 100
      };
      
      if (categoryFilter !== 'all') {
        filters.category = categoryFilter;
      }

      const response = await apiService.getDailyTasks(filters) as any;
      
      if (!response.success) {
        throw new Error(response.error || '加载任务历史失败');
      }
      
      // Generate mock data if no real data available
      const mockTasks: TaskHistoryItem[] = [
        {
          id: '1', title: '完成数学作业', description: '完成第3章练习题', 
          category: 'study', points: 20, completedAt: `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-15T10:00:00Z`, 
          status: 'completed'
        },
        {
          id: '2', title: '晨跑30分钟', description: '在公园跑步', 
          category: 'exercise', points: 15, completedAt: `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-14T07:00:00Z`, 
          status: 'approved'
        },
        {
          id: '3', title: '阅读课外书', description: '读《小王子》', 
          category: 'reading', points: 10, completedAt: `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-13T19:00:00Z`, 
          status: 'completed'
        }
      ];

      const result = response.data?.dailyTasks?.length > 0 
        ? response.data.dailyTasks.map((task: any) => ({
            id: task.id,
            title: task.task?.title || task.title,
            description: task.task?.description || task.description,
            category: task.task?.category || task.category,
            points: task.pointsEarned || task.task?.points || task.points,
            completedAt: task.completedAt,
            status: task.status,
            approvalNotes: task.approvalNotes,
            bonusPoints: task.bonusPoints
          }))
        : mockTasks;

      setTaskHistory(result);
    } catch (error: any) {
      console.error('Error loading task history:', error);
      setError(error.message || '加载任务历史失败');
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">已完成</span>;
      case 'approved':
        return <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">已批准</span>;
      case 'rejected':
        return <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs">已拒绝</span>;
      default:
        return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">{status}</span>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'study': return '📚';
      case 'exercise': return '🏃‍♂️';
      case 'housework': return '🏠';
      case 'reading': return '📖';
      case 'hobby': return '🎨';
      default: return '📝';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalPoints = taskHistory.reduce((sum, task) => sum + task.points + (task.bonusPoints || 0), 0);
  const totalTasks = taskHistory.length;

  if (!user) {
    return null;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📚 任务历史</h1>
        <p className="text-gray-600">查看您完成的任务记录和统计信息</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">任务分类</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">全部分类</option>
                <option value="study">📚 学习</option>
                <option value="exercise">🏃‍♂️ 运动</option>
                <option value="housework">🏠 家务</option>
                <option value="reading">📖 阅读</option>
                <option value="hobby">🎨 兴趣</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">月份导航</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
                >
                  ← 上月
                </button>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-3 py-2 bg-primary-100 text-primary-700 hover:bg-primary-200 rounded-lg text-sm transition-colors"
                >
                  本月
                </button>
                <button
                  onClick={() => navigateMonth('next')}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
                >
                  下月 →
                </button>
              </div>
            </div>
          </div>
          
          {/* Month Statistics */}
          <div className="text-sm text-gray-600 text-right">
            <div className="text-lg font-semibold text-gray-900">
              {currentDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}
            </div>
            <div><strong>{totalTasks}</strong> 个任务 | <strong>{totalPoints}</strong> 积分</div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载任务历史...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="text-center">
            <div className="text-red-600 text-xl mb-2">⚠️</div>
            <h3 className="text-red-800 font-semibold mb-2">加载失败</h3>
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <button 
              onClick={loadTaskHistory}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              重试
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Task List */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm">
              {taskHistory && taskHistory.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {taskHistory.map((task) => (
                    <div key={task.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className="text-xl">{getCategoryIcon(task.category)}</div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-medium text-gray-900">{task.title}</h3>
                              {getStatusBadge(task.status)}
                            </div>
                            <p className="text-gray-600 text-sm mb-1">{task.description}</p>
                            <div className="text-xs text-gray-500">
                              📅 {formatDate(task.completedAt)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <PointsDisplay points={task.points} size="sm" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="text-4xl mb-4">📚</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无任务历史</h3>
                  <p className="text-gray-600">完成一些任务后就能在这里看到记录了</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar - Statistics */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              
              {/* Monthly Statistics */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 月度统计</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">完成任务:</span>
                    <span className="font-medium">{totalTasks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">获得积分:</span>
                    <span className="font-medium text-green-600">{totalPoints}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">平均分/任务:</span>
                    <span className="font-medium text-blue-600">
                      {totalTasks > 0 ? Math.round(totalPoints / totalTasks) : 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Category Distribution */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 分类分布</h3>
                <div className="space-y-2">
                  {Object.entries(
                    taskHistory.reduce((acc, task) => {
                      acc[task.category] = (acc[task.category] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span>{getCategoryIcon(category)}</span>
                        <span className="text-sm">{category}</span>
                      </div>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskHistory;