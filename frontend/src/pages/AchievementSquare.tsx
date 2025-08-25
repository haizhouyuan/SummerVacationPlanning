import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import MediaPreview from '../components/MediaPreview';

const PAGE_SIZE = 20;

const AchievementSquare: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPublicTasks(1);
    // eslint-disable-next-line
  }, []);

  const loadPublicTasks = async (pageNum: number) => {
    setLoading(true);
    try {
      const res = await apiService.getPublicDailyTasks({ page: pageNum, limit: PAGE_SIZE, sort: 'createdAt' }) as any;
      setTasks(pageNum === 1 ? res.data.tasks : prev => [...prev, ...res.data.tasks]);
      setTotal(res.data.total);
      setPage(pageNum);
    } catch (e) {
      // 可加错误提示
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (tasks.length < total) {
      loadPublicTasks(page + 1);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-100 to-secondary-100">
      {/* Compact Header for mobile */}
      <div className="bg-white shadow-sm">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-primary-500 rounded-full flex items-center justify-center">
                <span className="text-white text-lg sm:text-xl font-bold">🏆</span>
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-primary-700">成就广场</h1>
                <p className="text-xs sm:text-sm text-gray-600">公开打卡分享</p>
              </div>
            </div>
            
            {/* Authentication buttons */}
            <div className="flex items-center space-x-2">
              {user ? (
                <div className="flex items-center space-x-2">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-gray-900">{user.displayName}</p>
                    <p className="text-xs text-gray-500">积分: {user.points || 0}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-xs font-medium transition-colors duration-200"
                  >
                    退出
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleLogin}
                  className="bg-primary-500 hover:bg-primary-600 text-white px-3 py-1 rounded-lg text-xs font-medium transition-colors duration-200"
                >
                  登录
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Header - Hidden on mobile */}
      <div className="hidden sm:block py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-primary-700">🌟 成就广场 · 公开打卡</h1>
            
            {/* Desktop Authentication buttons */}
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{user.displayName}</p>
                    <p className="text-xs text-gray-500">
                      {user.role === 'student' ? '👨‍🎓 学生' : '👨‍👩‍👧‍👦 家长'} • 积分: {user.points || 0}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                  >
                    返回首页
                  </button>
                  <button
                    onClick={handleLogout}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                  >
                    退出登录
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <p className="text-sm text-gray-600">游客身份浏览</p>
                  <button
                    onClick={handleLogin}
                    className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                  >
                    登录账户
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:max-w-3xl sm:mx-auto">
        <div className="space-y-4 sm:space-y-6">
          {tasks.map((task, idx) => (
            <div key={task.id || idx} className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-primary-200 flex items-center justify-center text-lg font-bold text-primary-700">
                  {task.userDisplayName?.[0] || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-primary-800 truncate">{task.userDisplayName || '匿名用户'}</div>
                  <div className="text-xs text-gray-400">{new Date(task.createdAt).toLocaleString()}</div>
                </div>
                <div className="text-primary-600 font-bold text-sm">+{task.pointsEarned || 0}分</div>
              </div>
              {task.evidenceText && (
                <div className="bg-primary-50 rounded-lg p-3 text-sm text-gray-800 mb-3">{task.evidenceText}</div>
              )}
              {task.evidenceMedia && task.evidenceMedia.length > 0 && (
                <div className="mb-3">
                  <MediaPreview files={task.evidenceMedia} readOnly={true} />
                </div>
              )}
              <div className="flex gap-2 text-xs text-gray-500 mt-2 hidden sm:flex">
                <span>任务ID: {task.taskId}</span>
                <span>用户ID: {task.userId}</span>
              </div>
            </div>
          ))}
        </div>
        {tasks.length < total && (
          <div className="flex justify-center mt-6">
            <button
              onClick={handleLoadMore}
              disabled={loading}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg shadow hover:bg-primary-700 disabled:opacity-50 text-sm"
            >
              {loading ? '加载中...' : '加载更多'}
            </button>
          </div>
        )}
        {tasks.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🏆</div>
            <div className="text-gray-400 text-sm">暂无公开打卡内容</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AchievementSquare; 