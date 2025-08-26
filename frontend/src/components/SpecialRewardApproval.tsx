import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

interface SpecialRewardApprovalProps {
  onRequestSuccess: () => void;
  userPoints: number;
}

interface SpecialRewardRequest {
  id: string;
  studentId: string;
  studentName: string;
  rewardTitle: string;
  rewardDescription?: string;
  pointsCost: number;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  approvalNotes?: string;
  rejectionReason?: string;
}

const SpecialRewardApproval: React.FC<SpecialRewardApprovalProps> = ({ onRequestSuccess }) => {
  const [requests, setRequests] = useState<SpecialRewardRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [approvalNotes, setApprovalNotes] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [activeAction, setActiveAction] = useState<{id: string, type: 'approve' | 'reject'} | null>(null);

  const loadPendingRequests = async () => {
    try {
      setLoading(true);
      const response = await apiService.getSpecialRewardRequests({ status: 'pending' });
      setRequests(response.data || []);
    } catch (error) {
      console.error('Failed to load pending requests:', error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingRequests();
  }, []);

  const handleApprove = async (requestId: string) => {
    if (!approvalNotes.trim()) {
      alert('请填写审批说明');
      return;
    }

    try {
      setProcessingId(requestId);
      await apiService.approveSpecialRedemption(requestId, { 
        approvalNotes: approvalNotes.trim() 
      });
      
      setApprovalNotes('');
      setActiveAction(null);
      onRequestSuccess();
      await loadPendingRequests();
      alert('特殊奖励已批准！');
    } catch (error) {
      console.error('Approval failed:', error);
      alert('批准失败，请重试');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!rejectionReason.trim()) {
      alert('请填写拒绝原因');
      return;
    }

    try {
      setProcessingId(requestId);
      await apiService.rejectSpecialRedemption(requestId, { 
        rejectionReason: rejectionReason.trim() 
      });
      
      setRejectionReason('');
      setActiveAction(null);
      onRequestSuccess();
      await loadPendingRequests();
      alert('特殊奖励申请已拒绝');
    } catch (error) {
      console.error('Rejection failed:', error);
      alert('拒绝失败，请重试');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="text-gray-600 mt-2">加载待审批申请...</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
        <span className="mr-2">⭐</span>
        特殊奖励审批
        {requests.length > 0 && (
          <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
            {requests.length}
          </span>
        )}
      </h2>

      {requests.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">✨</div>
          <p>暂无待审批的特殊奖励申请</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div key={request.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{request.rewardTitle}</h3>
                  <p className="text-sm text-gray-600">申请人: {request.studentName}</p>
                  <p className="text-sm text-gray-600">
                    申请时间: {new Date(request.submittedAt).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-purple-600">
                    {request.pointsCost} 积分
                  </span>
                </div>
              </div>

              {request.rewardDescription && (
                <div className="mb-3">
                  <p className="text-sm text-gray-700">
                    <strong>详细描述:</strong> {request.rewardDescription}
                  </p>
                </div>
              )}

              {request.notes && (
                <div className="mb-3">
                  <p className="text-sm text-gray-700">
                    <strong>学生备注:</strong> {request.notes}
                  </p>
                </div>
              )}

              {activeAction?.id === request.id ? (
                <div className="mt-4 p-3 bg-white rounded border">
                  {activeAction.type === 'approve' ? (
                    <>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        审批说明 *
                      </label>
                      <textarea
                        value={approvalNotes}
                        onChange={(e) => setApprovalNotes(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        rows={3}
                        placeholder="批准的原因和建议..."
                        maxLength={200}
                      />
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleApprove(request.id)}
                          disabled={processingId === request.id}
                          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                        >
                          {processingId === request.id ? '处理中...' : '确认批准'}
                        </button>
                        <button
                          onClick={() => setActiveAction(null)}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                        >
                          取消
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        拒绝原因 *
                      </label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        rows={3}
                        placeholder="拒绝的原因..."
                        maxLength={200}
                      />
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleReject(request.id)}
                          disabled={processingId === request.id}
                          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                        >
                          {processingId === request.id ? '处理中...' : '确认拒绝'}
                        </button>
                        <button
                          onClick={() => setActiveAction(null)}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                        >
                          取消
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setActiveAction({id: request.id, type: 'approve'})}
                    disabled={processingId === request.id}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 flex-1"
                  >
                    ✓ 批准
                  </button>
                  <button
                    onClick={() => setActiveAction({id: request.id, type: 'reject'})}
                    disabled={processingId === request.id}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 flex-1"
                  >
                    ✗ 拒绝
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-800 mb-2">💡 审批建议</h3>
        <div className="text-sm text-blue-700 space-y-1">
          <p>• 考虑奖励的合理性和教育价值</p>
          <p>• 检查学生的积分余额是否足够</p>
          <p>• 给出明确的审批理由帮助学生理解</p>
          <p>• 鼓励学生通过努力获得应得的奖励</p>
        </div>
      </div>
    </div>
  );
};

export default SpecialRewardApproval;