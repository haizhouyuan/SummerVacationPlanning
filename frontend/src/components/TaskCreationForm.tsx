import React, { useState } from 'react';
import { Task } from '../types';
import { detectNetworkAndGetApiServiceSync } from '../services/compatibleApi';

interface TaskCreationFormProps {
  onClose: () => void;
  onTaskCreated: (task: Task) => void;
  className?: string;
}

interface TaskFormData {
  title: string;
  description: string;
  category: Task['category'];
  activity: string;
  difficulty: Task['difficulty'];
  estimatedTime: number;
  requiresEvidence: boolean;
  evidenceTypes: Task['evidenceTypes'];
  tags: string[];
  isPublic: boolean;
}

const TaskCreationForm: React.FC<TaskCreationFormProps> = ({
  onClose,
  onTaskCreated,
  className = '',
}) => {
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    category: 'other',
    activity: '',
    difficulty: 'easy',
    estimatedTime: 30,
    requiresEvidence: false,
    evidenceTypes: [],
    tags: [],
    isPublic: false,
  });

  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const categories = [
    { value: 'reading', label: '语文阅读', emoji: '📚' },
    { value: 'learning', label: '学习', emoji: '🧠' },
    { value: 'exercise', label: '运动', emoji: '🏃‍♂️' },
    { value: 'chores', label: '家务', emoji: '🧹' },
    { value: 'creativity', label: '创意', emoji: '🎨' },
    { value: 'other', label: '其他', emoji: '⭐' },
  ];

  const difficulties = [
    { value: 'easy', label: '简单', color: 'text-green-600 bg-green-100' },
    { value: 'medium', label: '中等', color: 'text-yellow-600 bg-yellow-100' },
    { value: 'hard', label: '困难', color: 'text-red-600 bg-red-100' },
  ];

  const evidenceOptions = [
    { value: 'text', label: '文字描述', emoji: '📝' },
    { value: 'photo', label: '照片', emoji: '📸' },
    { value: 'video', label: '视频', emoji: '🎥' },
  ];

  // Activity options based on category
  const getActivityOptions = (category: Task['category']) => {
    const activityMap = {
      reading: [
        { value: 'diary', label: '写日记' },
        { value: 'reading_book', label: '阅读课外书' },
        { value: 'reading_textbook', label: '阅读课本' },
        { value: 'general_reading', label: '其他阅读' },
      ],
      learning: [
        { value: 'math_video', label: '数学网课' },
        { value: 'math_problems', label: '奥数题' },
        { value: 'english_study', label: '英语学习' },
        { value: 'science_study', label: '科学学习' },
        { value: 'general_learning', label: '其他学习' },
      ],
      exercise: [
        { value: 'general_exercise', label: '日常运动' },
        { value: 'sports', label: '体育运动' },
        { value: 'outdoor_activity', label: '户外活动' },
      ],
      creativity: [
        { value: 'music_practice', label: '音乐练习' },
        { value: 'art_creation', label: '美术创作' },
        { value: 'diy_project', label: 'DIY项目' },
        { value: 'general_creativity', label: '其他创意' },
      ],
      chores: [
        { value: 'household_chores', label: '家务劳动' },
        { value: 'organization', label: '整理收纳' },
        { value: 'cleaning', label: '清洁打扫' },
      ],
      other: [
        { value: 'general_task', label: '通用任务' },
        { value: 'special_activity', label: '特殊活动' },
      ],
    };
    return activityMap[category] || [];
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = '任务名称不能为空';
    } else if (formData.title.length < 2) {
      newErrors.title = '任务名称至少需要2个字符';
    } else if (formData.title.length > 50) {
      newErrors.title = '任务名称不能超过50个字符';
    }

    if (formData.description.length > 500) {
      newErrors.description = '任务描述不能超过500个字符';
    }

    if (!formData.activity.trim()) {
      newErrors.activity = '请选择具体活动类型';
    }

    if (formData.estimatedTime < 5) {
      newErrors.estimatedTime = '预计时长至少5分钟';
    } else if (formData.estimatedTime > 300) {
      newErrors.estimatedTime = '预计时长不能超过300分钟';
    }

    if (formData.requiresEvidence && formData.evidenceTypes.length === 0) {
      newErrors.evidenceTypes = '需要证据时请至少选择一种证据类型';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof TaskFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Reset activity when category changes
    if (field === 'category') {
      setFormData(prev => ({
        ...prev,
        activity: '',
      }));
    }
  };

  const handleEvidenceTypeToggle = (type: 'text' | 'photo' | 'video') => {
    setFormData(prev => ({
      ...prev,
      evidenceTypes: prev.evidenceTypes.includes(type)
        ? prev.evidenceTypes.filter(t => t !== type)
        : [...prev.evidenceTypes, type],
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const apiService = detectNetworkAndGetApiServiceSync();
      const response: any = await apiService.createTask({
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        activity: formData.activity,
        difficulty: formData.difficulty,
        estimatedTime: formData.estimatedTime,
        requiresEvidence: formData.requiresEvidence,
        evidenceTypes: formData.evidenceTypes,
        tags: formData.tags,
        isPublic: formData.isPublic,
      });

      const newTask = response.data?.task || response.data;
      onTaskCreated(newTask);
      onClose();
    } catch (error: any) {
      console.error('Error creating task:', error);
      setErrors({ submit: error.message || '创建任务失败，请重试' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentActivityOptions = getActivityOptions(formData.category);

  return (
    <div className={`bg-white rounded-xl shadow-lg ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">创建新任务</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            type="button"
          >
            <span className="text-2xl">×</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Task Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            任务名称 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="输入任务名称（2-50字符）"
            maxLength={50}
          />
          {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            任务描述
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="描述任务的具体内容和要求（可选，最多500字符）"
            rows={3}
            maxLength={500}
          />
          {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
          <p className="mt-1 text-xs text-gray-500">
            {formData.description.length}/500 字符
          </p>
        </div>

        {/* Category and Activity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              任务分类 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value as Task['category'])}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.emoji} {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              具体活动 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.activity}
              onChange={(e) => handleInputChange('activity', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.activity ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={currentActivityOptions.length === 0}
            >
              <option value="">请选择活动类型</option>
              {currentActivityOptions.map(activity => (
                <option key={activity.value} value={activity.value}>
                  {activity.label}
                </option>
              ))}
            </select>
            {errors.activity && <p className="mt-1 text-sm text-red-500">{errors.activity}</p>}
          </div>
        </div>

        {/* Difficulty and Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              难度等级
            </label>
            <div className="flex space-x-2">
              {difficulties.map(diff => (
                <button
                  key={diff.value}
                  type="button"
                  onClick={() => handleInputChange('difficulty', diff.value)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    formData.difficulty === diff.value
                      ? diff.color
                      : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {diff.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              预计时长（分钟）
            </label>
            <input
              type="number"
              value={formData.estimatedTime}
              onChange={(e) => handleInputChange('estimatedTime', parseInt(e.target.value) || 0)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.estimatedTime ? 'border-red-500' : 'border-gray-300'
              }`}
              min={5}
              max={300}
              step={5}
            />
            {errors.estimatedTime && <p className="mt-1 text-sm text-red-500">{errors.estimatedTime}</p>}
          </div>
        </div>

        {/* Evidence Requirements */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              是否需要提交证据
            </label>
            <button
              type="button"
              onClick={() => handleInputChange('requiresEvidence', !formData.requiresEvidence)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                formData.requiresEvidence ? 'bg-primary-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  formData.requiresEvidence ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {formData.requiresEvidence && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                证据类型 <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {evidenceOptions.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleEvidenceTypeToggle(option.value as 'text' | 'photo' | 'video')}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      formData.evidenceTypes.includes(option.value as 'text' | 'photo' | 'video')
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span>{option.emoji}</span>
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
              {errors.evidenceTypes && <p className="mt-1 text-sm text-red-500">{errors.evidenceTypes}</p>}
            </div>
          )}
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            标签（可选）
          </label>
          <div className="flex flex-wrap gap-1 mb-2">
            {formData.tags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary-100 text-primary-800"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 text-primary-600 hover:text-primary-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex space-x-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="输入标签后按回车添加"
              maxLength={20}
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              添加
            </button>
          </div>
        </div>

        {/* Public Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              公开任务
            </label>
            <p className="text-xs text-gray-500">
              其他用户可以看到并使用这个任务
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleInputChange('isPublic', !formData.isPublic)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
              formData.isPublic ? 'bg-primary-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                formData.isPublic ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{errors.submit}</p>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            disabled={isSubmitting}
          >
            取消
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? '创建中...' : '创建任务'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskCreationForm;