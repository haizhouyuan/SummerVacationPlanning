import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import MediaPreview from '../components/MediaPreview';

const PAGE_SIZE = 20;

const AchievementSquare: React.FC = () => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-100 to-secondary-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-center mb-6 text-primary-700">🌟 成就广场 · 公开打卡</h1>
        <div className="space-y-6">
          {tasks.map((task, idx) => (
            <div key={task.id || idx} className="bg-white rounded-xl shadow p-5 flex flex-col gap-2">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-primary-200 flex items-center justify-center text-lg font-bold text-primary-700">
                  {task.userDisplayName?.[0] || 'U'}
                </div>
                <div>
                  <div className="font-semibold text-primary-800">{task.userDisplayName || '匿名用户'}</div>
                  <div className="text-xs text-gray-400">{new Date(task.createdAt).toLocaleString()}</div>
                </div>
                <div className="ml-auto text-primary-600 font-bold">+{task.pointsEarned || 0} 积分</div>
              </div>
              {task.evidenceText && (
                <div className="bg-primary-50 rounded p-3 text-sm text-gray-800 mb-2">{task.evidenceText}</div>
              )}
              {task.evidenceMedia && task.evidenceMedia.length > 0 && (
                <MediaPreview files={task.evidenceMedia} readOnly={true} />
              )}
              <div className="flex gap-2 text-xs text-gray-500 mt-2">
                <span>任务ID: {task.taskId}</span>
                <span>用户ID: {task.userId}</span>
              </div>
            </div>
          ))}
        </div>
        {tasks.length < total && (
          <div className="flex justify-center mt-8">
            <button
              onClick={handleLoadMore}
              disabled={loading}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg shadow hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? '加载中...' : '加载更多'}
            </button>
          </div>
        )}
        {tasks.length === 0 && !loading && (
          <div className="text-center text-gray-400 mt-12">暂无公开打卡内容</div>
        )}
      </div>
    </div>
  );
};

export default AchievementSquare; 