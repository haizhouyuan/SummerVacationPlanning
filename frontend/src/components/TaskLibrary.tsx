import React, { useState, useEffect, useMemo } from 'react';
import { Task } from '../types';
import { detectNetworkAndGetApiServiceSync } from '../services/compatibleApi';
import TaskCard from './TaskCard';
import { useAuth } from '../contexts/AuthContext';

interface TaskLibraryProps {
  onTaskSelect?: (task: Task) => void;
  selectedTasks?: Task[];
  showSelectionMode?: boolean;
  maxSelections?: number;
  className?: string;
}

interface TaskFilters {
  category: string;
  difficulty: string;
  points: { min: number; max: number };
  estimatedTime: { min: number; max: number };
  requiresEvidence: boolean | null;
  tags: string[];
  searchQuery: string;
  isPublic: boolean | null;
  sortBy: 'newest' | 'points' | 'time' | 'difficulty' | 'popular';
  sortOrder: 'asc' | 'desc';
}

const TaskLibrary: React.FC<TaskLibraryProps> = ({
  onTaskSelect,
  selectedTasks = [],
  showSelectionMode = false,
  maxSelections = 10,
  className = '',
}) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    category: 'learning' as Task['category'],
    activity: 'homework', // 必需的activity字段，默认为学习类的作业
    difficulty: 'medium' as Task['difficulty'],
    estimatedTime: 30,
    points: 10,
    requiresEvidence: true,
    evidenceTypes: ['text'] as ('text' | 'photo' | 'video')[],
    tags: [] as string[],
    isPublic: true,
  });
  
  const [filters, setFilters] = useState<TaskFilters>({
    category: 'all',
    difficulty: 'all',
    points: { min: 0, max: 100 },
    estimatedTime: { min: 0, max: 180 },
    requiresEvidence: null,
    tags: [],
    searchQuery: '',
    isPublic: null,
    sortBy: 'newest',
    sortOrder: 'desc',
  });

  const categories = [
    { key: 'all', label: '全部', emoji: '📋', color: 'bg-gray-100 text-gray-700' },
    { key: 'reading', label: '语文阅读', emoji: '📚', color: 'bg-primary-100 text-primary-700' },
    { key: 'learning', label: '学习', emoji: '🧠', color: 'bg-purple-100 text-purple-700' },
    { key: 'exercise', label: '运动', emoji: '🏃‍♂️', color: 'bg-green-100 text-green-700' },
    { key: 'creativity', label: '创意', emoji: '🎨', color: 'bg-pink-100 text-pink-700' },
    { key: 'chores', label: '家务', emoji: '🧹', color: 'bg-yellow-100 text-yellow-700' },
    { key: 'other', label: '其他', emoji: '⭐', color: 'bg-primary-50 text-primary-700' },
  ];

  const difficulties = [
    { key: 'all', label: '全部难度', color: 'bg-gray-100 text-gray-700' },
    { key: 'easy', label: '简单', color: 'bg-green-100 text-green-700' },
    { key: 'medium', label: '中等', color: 'bg-yellow-100 text-yellow-700' },
    { key: 'hard', label: '困难', color: 'bg-red-100 text-red-700' },
  ];

  const sortOptions = [
    { key: 'newest', label: '最新创建' },
    { key: 'points', label: '积分值' },
    { key: 'time', label: '预计时间' },
    { key: 'difficulty', label: '难度' },
    { key: 'popular', label: '受欢迎程度' },
  ];

  useEffect(() => {
    loadTasks();
    loadAvailableTags();
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      loadTasks();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [filters]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError('');
      
      const queryParams: any = {};
      
      if (filters.category !== 'all') {
        queryParams.category = filters.category;
      }
      if (filters.difficulty !== 'all') {
        queryParams.difficulty = filters.difficulty;
      }
      if (filters.points.min > 0) {
        queryParams.minPoints = filters.points.min;
      }
      if (filters.points.max < 100) {
        queryParams.maxPoints = filters.points.max;
      }
      if (filters.estimatedTime.min > 0) {
        queryParams.minTime = filters.estimatedTime.min;
      }
      if (filters.estimatedTime.max < 180) {
        queryParams.maxTime = filters.estimatedTime.max;
      }
      if (filters.requiresEvidence !== null) {
        queryParams.requiresEvidence = filters.requiresEvidence;
      }
      if (filters.tags.length > 0) {
        queryParams.tags = filters.tags.join(',');
      }
      if (filters.isPublic !== null) {
        queryParams.isPublic = filters.isPublic;
      }

      const apiService = detectNetworkAndGetApiServiceSync();
      const response = await apiService.getTasks(queryParams);
      let tasksData = (response as any).data.tasks || [];

      // Apply search filter (client-side for now)
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        tasksData = tasksData.filter((task: Task) =>
          task.title.toLowerCase().includes(query) ||
          task.description.toLowerCase().includes(query) ||
          task.tags.some(tag => tag.toLowerCase().includes(query))
        );
      }

      // Apply sorting
      tasksData = sortTasks(tasksData);

      setTasks(tasksData);
    } catch (error: any) {
      console.error('Error loading tasks:', error);
      setError(error.message || '加载任务失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableTags = async () => {
    try {
      const apiService = detectNetworkAndGetApiServiceSync();
      const response = await apiService.getTasks({ limit: 1000 });
      const allTasks = (response as any).data.tasks || [];
      const tags = new Set<string>();
      
      allTasks.forEach((task: Task) => {
        task.tags.forEach(tag => tags.add(tag));
      });
      
      setAvailableTags(Array.from(tags).sort());
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };

  const sortTasks = (tasksData: Task[]) => {
    const sorted = [...tasksData].sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'newest':
          comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          break;
        case 'points':
          comparison = a.points - b.points;
          break;
        case 'time':
          comparison = a.estimatedTime - b.estimatedTime;
          break;
        case 'difficulty':
          const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
          comparison = difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
          break;
        case 'popular':
          // For now, sort by points as a proxy for popularity
          comparison = b.points - a.points;
          break;
        default:
          comparison = 0;
      }
      
      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });
    
    return sorted;
  };

  const handleFilterChange = (key: keyof TaskFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleRangeChange = (key: 'points' | 'estimatedTime', type: 'min' | 'max', value: number) => {
    setFilters(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [type]: value,
      },
    }));
  };

  const handleTagToggle = (tag: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const clearFilters = () => {
    setFilters({
      category: 'all',
      difficulty: 'all',
      points: { min: 0, max: 100 },
      estimatedTime: { min: 0, max: 180 },
      requiresEvidence: null,
      tags: [],
      searchQuery: '',
      isPublic: null,
      sortBy: 'newest',
      sortOrder: 'desc',
    });
  };

  const filteredTasksCount = tasks.length;
  const isTaskSelected = (task: Task) => selectedTasks.some(t => t.id === task.id);
  const canSelectMore = selectedTasks.length < maxSelections;

  const handleTaskClick = (task: Task) => {
    if (showSelectionMode && onTaskSelect) {
      if (isTaskSelected(task) || canSelectMore) {
        onTaskSelect(task);
      }
    } else if (onTaskSelect) {
      onTaskSelect(task);
    }
  };

  const handleDeleteTask = async (task: Task) => {
    if (!user || user.role !== 'parent') {
      setError('只有家长可以删除任务');
      return;
    }

    if (!window.confirm(`确定要删除任务"${task.title}"吗？此操作不可撤销。`)) {
      return;
    }

    try {
      setLoading(true);
      const apiService = detectNetworkAndGetApiServiceSync();
      await apiService.deleteTask(task.id);
      
      // 从本地任务列表中移除
      setTasks(prevTasks => prevTasks.filter(t => t.id !== task.id));
      
      // 如果任务在选中列表中，也移除
      if (isTaskSelected(task) && onTaskSelect) {
        onTaskSelect(task);
      }
    } catch (error: any) {
      setError(error.message || '删除任务失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim() || !newTask.description.trim()) {
      setError('请填写任务标题和描述');
      return;
    }

    try {
      setCreating(true);
      setError('');
      
      const taskData = {
        ...newTask,
        tags: newTask.tags.filter(tag => tag.trim() !== ''),
      };

      const apiService = detectNetworkAndGetApiServiceSync();
      await apiService.createTask(taskData);
      
      // 重新加载任务列表
      await loadTasks();
      
      // 重置表单并关闭模态框
      resetCreateForm();
      setShowCreateModal(false);
      
    } catch (error: any) {
      console.error('Error creating task:', error);
      setError(error.message || '创建任务失败，请重试');
    } finally {
      setCreating(false);
    }
  };

  // 映射category到默认activity
  const getDefaultActivityForCategory = (category: Task['category']): string => {
    const activityMap: Record<Task['category'], string> = {
      reading: 'textbook_reading',
      learning: 'homework',
      exercise: 'running',
      creativity: 'art_creation',
      chores: 'cleaning',
      other: 'general_task'
    };
    return activityMap[category] || 'general_task';
  };

  const resetCreateForm = () => {
    setNewTask({
      title: '',
      description: '',
      category: 'learning',
      activity: 'homework', // 必需的activity字段，默认为学习类的作业
      difficulty: 'medium',
      estimatedTime: 30,
      points: 10,
      requiresEvidence: true,
      evidenceTypes: ['text'],
      tags: [],
      isPublic: true,
    });
    setError('');
  };

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const input = e.target as HTMLInputElement;
      const tag = input.value.trim();
      if (tag && !newTask.tags.includes(tag)) {
        setNewTask(prev => ({
          ...prev,
          tags: [...prev.tags, tag]
        }));
        input.value = '';
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setNewTask(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <span className="text-2xl mr-3">📚</span>
            <div>
              <h2 className="text-xl font-bold text-gray-900">任务库</h2>
              <p className="text-sm text-gray-600">
                发现和选择适合的任务 ({filteredTasksCount} 个任务)
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* Add New Task Button - visible to parents only */}
            {user && user.role === 'parent' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors duration-200"
              >
                <span className="mr-2">➕</span>
                新增任务
              </button>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                showFilters
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="mr-2">🔍</span>
              高级筛选
            </button>
            {showSelectionMode && (
              <div className="text-sm text-gray-600">
                已选择: {selectedTasks.length}/{maxSelections}
              </div>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="搜索任务标题、描述或标签..."
            value={filters.searchQuery}
            onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            🔍
          </span>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">分类</label>
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <button
                    key={category.key}
                    onClick={() => handleFilterChange('category', category.key)}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-200 ${
                      filters.category === category.key
                        ? 'bg-primary-600 text-white'
                        : category.color
                    }`}
                  >
                    <span>{category.emoji}</span>
                    <span>{category.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">难度</label>
              <div className="flex flex-wrap gap-2">
                {difficulties.map(difficulty => (
                  <button
                    key={difficulty.key}
                    onClick={() => handleFilterChange('difficulty', difficulty.key)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-200 ${
                      filters.difficulty === difficulty.key
                        ? 'bg-primary-600 text-white'
                        : difficulty.color
                    }`}
                  >
                    {difficulty.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Points Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                积分范围: {filters.points.min} - {filters.points.max}
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filters.points.min}
                  onChange={(e) => handleRangeChange('points', 'min', parseInt(e.target.value))}
                  className="w-full"
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filters.points.max}
                  onChange={(e) => handleRangeChange('points', 'max', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            {/* Time Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                时间范围: {filters.estimatedTime.min} - {filters.estimatedTime.max} 分钟
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="180"
                  step="15"
                  value={filters.estimatedTime.min}
                  onChange={(e) => handleRangeChange('estimatedTime', 'min', parseInt(e.target.value))}
                  className="w-full"
                />
                <input
                  type="range"
                  min="0"
                  max="180"
                  step="15"
                  value={filters.estimatedTime.max}
                  onChange={(e) => handleRangeChange('estimatedTime', 'max', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            {/* Evidence Requirement */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">证据要求</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleFilterChange('requiresEvidence', null)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium ${
                    filters.requiresEvidence === null
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  全部
                </button>
                <button
                  onClick={() => handleFilterChange('requiresEvidence', true)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium ${
                    filters.requiresEvidence === true
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  需要证据
                </button>
                <button
                  onClick={() => handleFilterChange('requiresEvidence', false)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium ${
                    filters.requiresEvidence === false
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  无需证据
                </button>
              </div>
            </div>

            {/* Sort Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">排序</label>
              <div className="flex space-x-2">
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {sortOptions.map(option => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                >
                  {filters.sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>

          {/* Tags Filter */}
          {availableTags.length > 0 && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">标签</label>
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                {availableTags.slice(0, 20).map(tag => (
                  <button
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors duration-200 ${
                      filters.tags.includes(tag)
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Clear Filters */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors duration-200"
            >
              清除所有筛选条件
            </button>
          </div>
        </div>
      )}

      {/* Task Grid */}
      <div className="p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <span className="text-red-500 mr-2">⚠️</span>
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">加载任务中...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {filters.searchQuery || filters.category !== 'all' || filters.difficulty !== 'all' || filters.tags.length > 0
                ? '未找到匹配的任务'
                : '暂无任务'
              }
            </h3>
            <p className="text-gray-600 mb-4">
              {filters.searchQuery || filters.category !== 'all' || filters.difficulty !== 'all' || filters.tags.length > 0
                ? '请尝试调整筛选条件'
                : '还没有可用的任务'
              }
            </p>
            {(filters.searchQuery || filters.category !== 'all' || filters.difficulty !== 'all' || filters.tags.length > 0) && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
              >
                清除筛选条件
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onSelect={handleTaskClick}
                onDelete={user?.role === 'parent' ? handleDeleteTask : undefined}
                isSelected={isTaskSelected(task)}
                showActions={!showSelectionMode}
                className={`${
                  showSelectionMode
                    ? isTaskSelected(task)
                      ? 'ring-2 ring-primary-500 ring-offset-2'
                      : !canSelectMore
                      ? 'opacity-50 pointer-events-none'
                      : 'hover:ring-2 hover:ring-primary-300 hover:ring-offset-1'
                    : ''
                } transition-all duration-200`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">创建新任务</h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetCreateForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    任务标题 *
                  </label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="输入任务标题"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    任务描述 *
                  </label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="详细描述任务内容和要求"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Category and Difficulty */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">分类</label>
                  <select
                    value={newTask.category}
                    onChange={(e) => {
                      const newCategory = e.target.value as Task['category'];
                      setNewTask(prev => ({
                        ...prev,
                        category: newCategory,
                        activity: getDefaultActivityForCategory(newCategory) // 自动更新对应的activity
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="reading">语文阅读</option>
                    <option value="learning">学习</option>
                    <option value="exercise">运动</option>
                    <option value="creativity">创意</option>
                    <option value="chores">家务</option>
                    <option value="other">其他</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">难度</label>
                  <select
                    value={newTask.difficulty}
                    onChange={(e) => setNewTask(prev => ({ ...prev, difficulty: e.target.value as Task['difficulty'] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="easy">简单</option>
                    <option value="medium">中等</option>
                    <option value="hard">困难</option>
                  </select>
                </div>
              </div>

              {/* Time and Points */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    预计时间 (分钟)
                  </label>
                  <input
                    type="number"
                    value={newTask.estimatedTime}
                    onChange={(e) => setNewTask(prev => ({ ...prev, estimatedTime: parseInt(e.target.value) || 0 }))}
                    min="5"
                    max="300"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    奖励积分
                  </label>
                  <input
                    type="number"
                    value={newTask.points}
                    onChange={(e) => setNewTask(prev => ({ ...prev, points: parseInt(e.target.value) || 0 }))}
                    min="1"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Evidence Settings */}
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="requiresEvidence"
                    checked={newTask.requiresEvidence}
                    onChange={(e) => setNewTask(prev => ({ ...prev, requiresEvidence: e.target.checked }))}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="requiresEvidence" className="ml-2 text-sm text-gray-700">
                    需要提交证据
                  </label>
                </div>

                {newTask.requiresEvidence && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      证据类型
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {(['text', 'photo', 'video'] as const).map(type => (
                        <label key={type} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={newTask.evidenceTypes.includes(type)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewTask(prev => ({
                                  ...prev,
                                  evidenceTypes: [...prev.evidenceTypes, type]
                                }));
                              } else {
                                setNewTask(prev => ({
                                  ...prev,
                                  evidenceTypes: prev.evidenceTypes.filter(t => t !== type)
                                }));
                              }
                            }}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mr-2"
                          />
                          <span className="text-sm text-gray-700">
                            {type === 'text' ? '文字' : type === 'photo' ? '图片' : '视频'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  标签 (按回车添加)
                </label>
                <input
                  type="text"
                  placeholder="输入标签并按回车"
                  onKeyDown={handleTagInput}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                {newTask.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {newTask.tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary-100 text-primary-700"
                      >
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="ml-1 text-primary-500 hover:text-primary-700"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Public/Private */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={newTask.isPublic}
                  onChange={(e) => setNewTask(prev => ({ ...prev, isPublic: e.target.checked }))}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="isPublic" className="ml-2 text-sm text-gray-700">
                  公开任务 (其他用户可见)
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetCreateForm();
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateTask}
                disabled={creating || !newTask.title.trim() || !newTask.description.trim()}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {creating ? '创建中...' : '创建任务'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskLibrary;