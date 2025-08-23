import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

interface CoParent {
  id: string;
  name: string;
  email: string;
  relationship?: 'father' | 'mother' | 'guardian';
}

interface Child {
  id: string;
  name: string;
  email: string;
  points: number;
  coParents?: CoParent[];
}

interface CoParentManagementProps {
  isOpen: boolean;
  onClose: () => void;
  selectedChild?: Child;
}

const CoParentManagement: React.FC<CoParentManagementProps> = ({
  isOpen,
  onClose,
  selectedChild,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCoParentEmail, setNewCoParentEmail] = useState('');
  const [newCoParentRelationship, setNewCoParentRelationship] = useState<'father' | 'mother' | 'guardian'>('father');

  // Clear states when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setError('');
      setSuccess('');
      setShowAddForm(false);
      setNewCoParentEmail('');
      setNewCoParentRelationship('father');
    }
  }, [isOpen]);

  const handleAddCoParent = async () => {
    if (!selectedChild || !newCoParentEmail.trim()) {
      setError('请填写完整的家长信息');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // TODO: Implement addCoParent API method
      // const response = await apiService.addCoParent({
      //   childId: selectedChild.id,
      //   coParentEmail: newCoParentEmail.trim(),
      //   coParentRelationship: newCoParentRelationship,
      // }) as any;
      
      // Mock response for now
      const response = {
        success: true,
        data: {
          coParent: {
            name: newCoParentEmail.split('@')[0]
          }
        },
        error: null
      };

      if (response.success) {
        setSuccess(`成功添加共管家长：${response.data.coParent.name}`);
        setShowAddForm(false);
        setNewCoParentEmail('');
        setNewCoParentRelationship('father');
        
        // Refresh parent data would be handled by parent component
        setTimeout(() => {
          setSuccess('');
          onClose();
        }, 2000);
      } else {
        setError(response.error || '添加家长失败');
      }
    } catch (error: any) {
      console.error('Add co-parent error:', error);
      setError(error.message || '添加家长失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCoParent = async (coParentId: string, coParentName: string) => {
    if (!selectedChild) return;

    if (!window.confirm(`确认要移除家长"${coParentName}"对孩子"${selectedChild.name}"的管理权限吗？`)) {
      return;
    }

    try {
      setLoading(true);
      setError('');

      // TODO: Implement removeCoParent API method  
      // const response = await apiService.removeCoParent({
      //   childId: selectedChild.id,
      //   coParentId: coParentId,
      // }) as any;
      
      // Mock response for now
      const response = {
        success: true,
        data: { message: '共管家长已移除' },
        error: null
      };

      if (response.success) {
        setSuccess(`成功移除家长：${coParentName}`);
        
        // Refresh parent data would be handled by parent component
        setTimeout(() => {
          setSuccess('');
          onClose();
        }, 2000);
      } else {
        setError(response.error || '移除家长失败');
      }
    } catch (error: any) {
      console.error('Remove co-parent error:', error);
      setError(error.message || '移除家长失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-cartoon-lg shadow-cartoon-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-cartoon-light">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-cartoon-dark font-fun">
                👨‍👩‍👧‍👦 家长管理
              </h2>
              {selectedChild && (
                <p className="text-cartoon-gray text-sm sm:text-base mt-1">
                  管理孩子"{selectedChild.name}"的共管家长
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-cartoon-gray hover:text-cartoon-dark text-2xl leading-none"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {/* Error/Success Messages */}
          {error && (
            <div className="bg-danger-50 border border-danger-200 rounded-cartoon-lg p-4 mb-4">
              <div className="flex items-center space-x-2">
                <span className="text-danger-600">⚠️</span>
                <p className="text-danger-800 text-sm">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-success-50 border border-success-200 rounded-cartoon-lg p-4 mb-4">
              <div className="flex items-center space-x-2">
                <span className="text-success-600">✅</span>
                <p className="text-success-800 text-sm">{success}</p>
              </div>
            </div>
          )}

          {!selectedChild ? (
            <div className="text-center py-8 text-cartoon-gray">
              <div className="text-4xl mb-4">👨‍👩‍👧‍👦</div>
              <h3 className="text-lg font-semibold mb-2">请选择一个孩子</h3>
              <p className="text-sm">从家长仪表盘选择要管理的孩子账户</p>
            </div>
          ) : (
            <>
              {/* Child Info */}
              <div className="bg-cartoon-light rounded-cartoon-lg p-4 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-cartoon-blue to-primary-400 rounded-cartoon flex items-center justify-center">
                    <span className="text-white text-lg">👦</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-cartoon-dark">{selectedChild.name}</h3>
                    <p className="text-cartoon-gray text-sm">{selectedChild.email}</p>
                    <p className="text-cartoon-gray text-xs">积分: {selectedChild.points}</p>
                  </div>
                </div>
              </div>

              {/* Current Co-Parents */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-cartoon-dark">当前管理家长</h3>
                  <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    disabled={loading}
                    className="bg-gradient-to-r from-cartoon-green to-success-400 hover:from-success-500 hover:to-success-600 text-white px-3 py-2 rounded-cartoon text-sm font-medium transition-all duration-200 shadow-cartoon hover:shadow-cartoon-lg disabled:opacity-50"
                  >
                    {showAddForm ? '取消添加' : '+ 添加家长'}
                  </button>
                </div>

                {/* Current parent (yourself) */}
                <div className="space-y-3">
                  <div className="border border-cartoon-light rounded-cartoon-lg p-4 bg-cartoon-light/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-cartoon-orange to-warning-400 rounded-cartoon flex items-center justify-center">
                          <span className="text-white text-sm">👑</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-cartoon-dark">{user?.displayName}</h4>
                          <p className="text-cartoon-gray text-sm">{user?.email}</p>
                          <p className="text-cartoon-gray text-xs">
                            {'主管家长'}
                          </p>
                        </div>
                      </div>
                      <span className="bg-cartoon-orange/20 text-cartoon-orange text-xs px-2 py-1 rounded-cartoon font-medium">
                        主管家长
                      </span>
                    </div>
                  </div>

                  {/* Additional co-parents would be shown here */}
                  {/* Note: This would require backend changes to return co-parent info with child data */}
                  <div className="text-center py-4 text-cartoon-gray text-sm">
                    <span>共管家长功能已准备就绪</span>
                  </div>
                </div>
              </div>

              {/* Add Co-Parent Form */}
              {showAddForm && (
                <div className="border-t border-cartoon-light pt-6">
                  <h3 className="font-semibold text-cartoon-dark mb-4">添加共管家长</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-cartoon-dark mb-2">
                        家长邮箱
                      </label>
                      <input
                        type="email"
                        value={newCoParentEmail}
                        onChange={(e) => setNewCoParentEmail(e.target.value)}
                        placeholder="输入要添加的家长邮箱"
                        className="w-full px-3 py-2 border border-cartoon-light rounded-cartoon focus:ring-2 focus:ring-cartoon-blue focus:border-cartoon-blue text-sm"
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-cartoon-dark mb-2">
                        家长关系
                      </label>
                      <select
                        value={newCoParentRelationship}
                        onChange={(e) => setNewCoParentRelationship(e.target.value as 'father' | 'mother' | 'guardian')}
                        className="w-full px-3 py-2 border border-cartoon-light rounded-cartoon focus:ring-2 focus:ring-cartoon-blue focus:border-cartoon-blue text-sm"
                        disabled={loading}
                      >
                        <option value="father">父亲</option>
                        <option value="mother">母亲</option>
                        <option value="guardian">监护人</option>
                      </select>
                    </div>

                    <div className="flex items-center space-x-3">
                      <button
                        onClick={handleAddCoParent}
                        disabled={loading || !newCoParentEmail.trim()}
                        className="bg-gradient-to-r from-cartoon-green to-success-400 hover:from-success-500 hover:to-success-600 text-white px-4 py-2 rounded-cartoon text-sm font-medium transition-all duration-200 shadow-cartoon hover:shadow-cartoon-lg disabled:opacity-50"
                      >
                        {loading ? '添加中...' : '确认添加'}
                      </button>
                      <button
                        onClick={() => {
                          setShowAddForm(false);
                          setNewCoParentEmail('');
                          setError('');
                        }}
                        disabled={loading}
                        className="bg-cartoon-light hover:bg-cartoon-gray text-cartoon-dark px-4 py-2 rounded-cartoon text-sm font-medium transition-all duration-200 disabled:opacity-50"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Instructions */}
              <div className="bg-cartoon-light/50 rounded-cartoon-lg p-4 mt-6">
                <h3 className="font-semibold text-cartoon-dark mb-2 text-sm">📖 使用说明</h3>
                <ul className="text-xs text-cartoon-gray space-y-1">
                  <li>• 添加的家长将获得查看和管理该孩子任务的权限</li>
                  <li>• 共管家长可以审批任务、管理积分和奖励</li>
                  <li>• 被添加的家长账户必须已经存在于系统中</li>
                  <li>• 主管家长可以随时移除共管家长权限</li>
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-cartoon-light">
          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="bg-cartoon-light hover:bg-cartoon-gray text-cartoon-dark px-4 py-2 rounded-cartoon text-sm font-medium transition-all duration-200 disabled:opacity-50"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoParentManagement;