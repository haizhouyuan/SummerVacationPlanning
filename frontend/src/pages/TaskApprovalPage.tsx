import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import Layout from '../components/Layout';
import TaskApprovalWorkflow from '../components/TaskApprovalWorkflow';
import NotificationBadge from '../components/NotificationBadge';
import { usePendingApprovalCount } from '../hooks/usePendingApprovalCount';

const TaskApprovalPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const { pendingCount, loading, error, refetch } = usePendingApprovalCount();

  // Redirect non-parent users
  useEffect(() => {
    if (user && user.role !== 'parent') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleOpenApproval = () => {
    setShowApprovalModal(true);
  };

  const handleCloseApproval = () => {
    setShowApprovalModal(false);
    // Refetch count after modal closes to update badges
    refetch();
  };

  if (!user || user.role !== 'parent') {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-cartoon-light via-primary-50 to-secondary-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-cartoon-dark mb-2">访问受限</h2>
            <p className="text-cartoon-gray">此页面仅供家长用户访问</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-cartoon-lg shadow-cartoon p-6 mb-6 animate-bounce-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-cartoon-dark font-fun flex items-center">
                ✅ 任务审批
                <NotificationBadge count={pendingCount} size="md" className="ml-3" />
              </h1>
              <p className="text-cartoon-gray mt-2">审核和管理孩子提交的任务完成证据</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={refetch}
                disabled={loading}
                className="bg-gradient-to-r from-cartoon-blue to-primary-400 hover:from-primary-500 hover:to-primary-600 text-white px-4 py-2 rounded-cartoon text-sm font-medium transition-all duration-200 shadow-cartoon hover:shadow-cartoon-lg disabled:opacity-50"
              >
                {loading ? '🔄 刷新中...' : '🔄 刷新'}
              </button>
              <button
                onClick={handleOpenApproval}
                className="bg-gradient-to-r from-cartoon-green to-success-400 hover:from-success-500 hover:to-success-600 text-white px-6 py-2 rounded-cartoon text-sm font-medium transition-all duration-200 shadow-cartoon hover:shadow-cartoon-lg"
              >
                📋 打开审批面板
              </button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-danger-50 border border-danger-200 rounded-cartoon-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <span className="text-danger-600">⚠️</span>
              <p className="text-danger-800">{error}</p>
              <button
                onClick={refetch}
                className="ml-auto bg-danger-600 hover:bg-danger-700 text-white px-3 py-1 rounded-cartoon text-sm"
              >
                重试
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Quick Stats */}
          <div className="bg-white rounded-cartoon-lg shadow-cartoon p-6 animate-bounce-in">
            <div className="text-center">
              <div className="text-4xl mb-2 animate-float">⏳</div>
              <h3 className="font-bold text-cartoon-dark font-fun">待审批任务</h3>
              <div className="text-3xl font-bold text-cartoon-orange mt-2">
                {pendingCount}
              </div>
              <p className="text-sm text-cartoon-gray mt-1">个任务等待审核</p>
            </div>
          </div>

          {/* Quick Action Card */}
          <div className="bg-white rounded-cartoon-lg shadow-cartoon p-6 animate-bounce-in">
            <div className="text-center">
              <div className="text-4xl mb-2 animate-float">📋</div>
              <h3 className="font-bold text-cartoon-dark font-fun">快速审批</h3>
              <p className="text-sm text-cartoon-gray mt-2 mb-4">
                快速审核孩子提交的任务证据
              </p>
              <button
                onClick={handleOpenApproval}
                className="w-full bg-gradient-to-r from-cartoon-green to-success-400 hover:from-success-500 hover:to-success-600 text-white py-2 px-4 rounded-cartoon font-medium transition-all duration-200 shadow-cartoon hover:shadow-cartoon-lg"
              >
                开始审批
              </button>
            </div>
          </div>

          {/* Help Card */}
          <div className="bg-white rounded-cartoon-lg shadow-cartoon p-6 animate-bounce-in">
            <div className="text-center">
              <div className="text-4xl mb-2 animate-float">💡</div>
              <h3 className="font-bold text-cartoon-dark font-fun">审批提示</h3>
              <div className="text-sm text-cartoon-gray mt-2 space-y-2 text-left">
                <p>• 仔细查看孩子提交的证据</p>
                <p>• 给予鼓励和建设性反馈</p>
                <p>• 表现优秀可给予额外奖励</p>
                <p>• 及时审批保持积极性</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="mt-8 bg-white rounded-cartoon-lg shadow-cartoon p-6">
          <h2 className="text-xl font-bold text-cartoon-dark font-fun mb-4">📊 审批概览</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-cartoon-orange/10 rounded-cartoon">
              <div className="text-2xl font-bold text-cartoon-orange">{pendingCount}</div>
              <div className="text-sm text-cartoon-gray">待审批</div>
            </div>
            <div className="text-center p-4 bg-cartoon-green/10 rounded-cartoon">
              <div className="text-2xl font-bold text-cartoon-green">-</div>
              <div className="text-sm text-cartoon-gray">已通过</div>
            </div>
            <div className="text-center p-4 bg-cartoon-red/10 rounded-cartoon">
              <div className="text-2xl font-bold text-cartoon-red">-</div>
              <div className="text-sm text-cartoon-gray">已拒绝</div>
            </div>
          </div>
          <div className="mt-4 text-center">
            <button
              onClick={handleOpenApproval}
              className="bg-gradient-to-r from-cartoon-purple to-primary-400 hover:from-primary-500 hover:to-primary-600 text-white px-6 py-2 rounded-cartoon text-sm font-medium transition-all duration-200 shadow-cartoon hover:shadow-cartoon-lg"
            >
              查看详细统计
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-white rounded-cartoon-lg shadow-cartoon p-6">
          <h2 className="text-xl font-bold text-cartoon-dark font-fun mb-4">📖 审批指南</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-cartoon-dark mb-2">✅ 通过标准</h3>
              <ul className="text-sm text-cartoon-gray space-y-1">
                <li>• 证据清晰完整</li>
                <li>• 任务确实完成</li>
                <li>• 达到预期质量</li>
                <li>• 体现努力程度</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-cartoon-dark mb-2">❌ 拒绝情况</h3>
              <ul className="text-sm text-cartoon-gray space-y-1">
                <li>• 证据不符合要求</li>
                <li>• 任务未真实完成</li>
                <li>• 质量明显不达标</li>
                <li>• 敷衍了事的态度</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Task Approval Modal */}
        <TaskApprovalWorkflow
          isOpen={showApprovalModal}
          onClose={handleCloseApproval}
        />
      </div>
    </Layout>
  );
};

export default TaskApprovalPage;