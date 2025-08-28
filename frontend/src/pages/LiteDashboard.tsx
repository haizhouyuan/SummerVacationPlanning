import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { detectNetworkAndGetApiServiceSync } from '../services/compatibleApi';

interface TaskItem {
  id: string;
  title: string;
  category: string;
  points: number;
  status: 'pending' | 'completed';
  completedAt?: string;
}

const LiteDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    try {
      // Mock data for lite version
      setTasks([
        { id: '1', title: '阅读30分钟', category: 'reading', points: 10, status: 'pending' },
        { id: '2', title: '完成数学练习', category: 'learning', points: 15, status: 'completed', completedAt: new Date().toISOString() }
      ]);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTask = () => {
    if (!newTaskTitle.trim()) return;
    
    const newTask: TaskItem = {
      id: Date.now().toString(),
      title: newTaskTitle,
      category: 'other',
      points: 5,
      status: 'pending'
    };
    
    setTasks(prev => [...prev, newTask]);
    setNewTaskTitle('');
  };

  const completeTask = (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, status: 'completed' as const, completedAt: new Date().toISOString() }
        : task
    ));
  };

  const getCategoryEmoji = (category: string) => {
    const emojiMap = {
      reading: '📚',
      learning: '🧠',
      exercise: '🏃‍♂️',
      chores: '🧹',
      creativity: '🎨',
      other: '⭐',
    };
    return emojiMap[category as keyof typeof emojiMap] || '📋';
  };

  // 使用用户的总积分，而不是只计算今日任务积分
  const totalPoints = user?.points || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">🏖️</span>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold text-gray-900">暑假计划 Lite</h1>
                <p className="text-sm text-gray-600">简化版任务管理</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.displayName}</p>
                <p className="text-sm text-blue-600 font-bold">{totalPoints} 积分</p>
              </div>
              <button
                onClick={() => logout()}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm transition-colors"
              >
                退出
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Task Planning */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">📋</span>
              任务规划
            </h2>
            
            {/* Add Task */}
            <div className="mb-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="输入新任务..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && addTask()}
                />
                <button
                  onClick={addTask}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  添加
                </button>
              </div>
            </div>

            {/* Task List */}
            <div className="space-y-2">
              {tasks.filter(task => task.status === 'pending').map(task => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{getCategoryEmoji(task.category)}</span>
                    <span className="font-medium text-gray-900">{task.title}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-blue-600 font-medium">{task.points}分</span>
                    <button
                      onClick={() => completeTask(task.id)}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      完成
                    </button>
                  </div>
                </div>
              ))}
              {tasks.filter(task => task.status === 'pending').length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-2xl mb-2">✨</div>
                  <p>暂无待完成任务</p>
                </div>
              )}
            </div>
          </div>

          {/* Completed Tasks & Points */}
          <div className="space-y-6">
            {/* Points Summary */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">💎</span>
                积分统计
              </h2>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">{totalPoints}</div>
                <div className="text-sm text-gray-600 mb-4">今日累计积分</div>
                
                {/* Simple Redemption Options */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                    <span className="text-sm">🎮 游戏时间 (10分钟)</span>
                    <button 
                      disabled={totalPoints < 5}
                      className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      5积分
                    </button>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
                    <span className="text-sm">🍫 零食奖励</span>
                    <button 
                      disabled={totalPoints < 20}
                      className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      20积分
                    </button>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                    <span className="text-sm">🎬 看电影</span>
                    <button 
                      disabled={totalPoints < 50}
                      className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      50积分
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Completed Tasks */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">✅</span>
                已完成任务
              </h2>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {tasks.filter(task => task.status === 'completed').map(task => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{getCategoryEmoji(task.category)}</span>
                      <span className="text-gray-900 line-through">{task.title}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-green-600 font-medium">+{task.points}</span>
                      <span className="text-xs text-gray-500">✓</span>
                    </div>
                  </div>
                ))}
                {tasks.filter(task => task.status === 'completed').length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-2xl mb-2">🎯</div>
                    <p>开始完成任务赚取积分吧！</p>
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

export default LiteDashboard;