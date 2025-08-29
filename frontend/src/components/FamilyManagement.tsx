import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import PointsDisplay from './PointsDisplay';
// import TaskCategoryIcon from './TaskCategoryIcon';

interface FamilyMember {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'parent';
  points: number;
  level: number;
  avatar?: string;
  isActive: boolean;
  lastActive: Date;
  permissions: string[];
}

interface FamilyManagementProps {
  isOpen: boolean;
  onClose: () => void;
  pageMode?: boolean;
}

const FamilyManagement: React.FC<FamilyManagementProps> = ({ isOpen, onClose, pageMode = false }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'members' | 'invites' | 'settings'>('members');
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'student' | 'parent'>('student');

  // Mock family data
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([
    {
      id: '1',
      name: '小明',
      email: 'xiaoming@example.com',
      role: 'student',
      points: 250,
      level: 3,
      isActive: true,
      lastActive: new Date(),
      permissions: ['view_tasks', 'complete_tasks'],
    },
    {
      id: '2',
      name: '小红',
      email: 'xiaohong@example.com',
      role: 'student',
      points: 180,
      level: 2,
      isActive: true,
      lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      permissions: ['view_tasks', 'complete_tasks'],
    },
    {
      id: '3',
      name: '妈妈',
      email: 'mother@example.com',
      role: 'parent',
      points: 0,
      level: 1,
      isActive: false,
      lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      permissions: ['manage_tasks', 'view_progress', 'manage_rewards'],
    },
  ]);

  const [pendingInvites] = useState([
    {
      id: '1',
      email: 'xiaoli@example.com',
      role: 'student',
      invitedBy: user?.displayName || '您',
      invitedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      status: 'pending',
    },
  ]);

  const handleAddMember = () => {
    if (newMemberEmail && newMemberName) {
      // In a real app, this would send an invitation email
      console.log('Sending invitation to:', newMemberEmail);
      setShowAddMember(false);
      setNewMemberEmail('');
      setNewMemberName('');
      setNewMemberRole('student');
    }
  };

  const handleRemoveMember = (memberId: string) => {
    setFamilyMembers(prev => prev.filter(member => member.id !== memberId));
  };

  const handleToggleMemberStatus = (memberId: string) => {
    setFamilyMembers(prev => 
      prev.map(member => 
        member.id === memberId 
          ? { ...member, isActive: !member.isActive }
          : member
      )
    );
  };

  const formatLastActive = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return '刚刚活跃';
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    return date.toLocaleDateString();
  };

  const getRoleIcon = (role: string) => {
    return role === 'student' ? '👨‍🎓' : '👨‍👩‍👧‍👦';
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-cartoon-green' : 'bg-cartoon-gray';
  };

  if (!isOpen) return null;

  const content = (
    <div className={pageMode ? "w-full" : "bg-white rounded-cartoon-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-cartoon-lg"}>
      {/* Header */}
      {!pageMode && (
        <div className="p-6 border-b border-cartoon-light">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-cartoon-dark font-fun">👨‍👩‍👧‍👦 家庭管理</h2>
              <p className="text-cartoon-gray">管理家庭成员和权限设置</p>
            </div>
            <button
              onClick={onClose}
              className="text-cartoon-gray hover:text-cartoon-dark text-xl font-bold p-2 rounded-cartoon hover:bg-cartoon-light transition-all duration-200"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className={pageMode ? "px-0 py-4 border-b border-cartoon-light" : "px-6 py-4 border-b border-cartoon-light"}>
          <div className="flex space-x-1">
            {[
              { id: 'members', label: '👥 成员管理', icon: '👥' },
              { id: 'invites', label: '📧 邀请管理', icon: '📧' },
              { id: 'settings', label: '⚙️ 家庭设置', icon: '⚙️' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  px-4 py-2 rounded-cartoon text-sm font-medium transition-all duration-200
                  ${activeTab === tab.id
                    ? 'bg-cartoon-green text-white shadow-cartoon'
                    : 'text-cartoon-gray hover:bg-cartoon-light hover:text-cartoon-dark'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

      {/* Content */}
      <div className={pageMode ? "px-0 py-6" : "p-6"}>
          {/* Members Tab */}
          {activeTab === 'members' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-cartoon-dark font-fun">家庭成员</h3>
                <button
                  onClick={() => setShowAddMember(true)}
                  className="bg-gradient-to-r from-cartoon-green to-success-400 text-white px-4 py-2 rounded-cartoon text-sm font-medium hover:shadow-cartoon-lg transition-all duration-200"
                >
                  ➕ 添加成员
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {familyMembers.map((member) => (
                  <div
                    key={member.id}
                    className="bg-cartoon-light rounded-cartoon-lg p-4 hover:shadow-cartoon transition-all duration-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-br from-cartoon-blue to-primary-400 rounded-cartoon flex items-center justify-center">
                            <span className="text-white text-xl">{getRoleIcon(member.role)}</span>
                          </div>
                          <div 
                            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(member.isActive)}`}
                            title={member.isActive ? '在线' : '离线'}
                          />
                        </div>
                        <div>
                          <h4 className="font-semibold text-cartoon-dark">{member.name}</h4>
                          <p className="text-xs text-cartoon-gray">{member.email}</p>
                          <p className="text-xs text-cartoon-gray">
                            {member.role === 'student' ? '👨‍🎓 学生' : '👨‍👩‍👧‍👦 家长'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {member.role === 'student' && (
                          <PointsDisplay points={member.points} size="sm" showLabel={false} />
                        )}
                        <p className="text-xs text-cartoon-gray mt-1">
                          {formatLastActive(member.lastActive)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-3">
                      {member.permissions.map((permission) => (
                        <span
                          key={permission}
                          className="px-2 py-1 bg-cartoon-green/10 text-cartoon-green text-xs rounded-cartoon"
                        >
                          {permission}
                        </span>
                      ))}
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleToggleMemberStatus(member.id)}
                        className={`
                          flex-1 py-2 px-3 rounded-cartoon text-sm font-medium transition-all duration-200
                          ${member.isActive
                            ? 'bg-cartoon-orange/10 text-cartoon-orange hover:bg-cartoon-orange/20'
                            : 'bg-cartoon-green/10 text-cartoon-green hover:bg-cartoon-green/20'
                          }
                        `}
                      >
                        {member.isActive ? '⏸️ 暂停' : '▶️ 激活'}
                      </button>
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="px-3 py-2 bg-cartoon-red/10 text-cartoon-red hover:bg-cartoon-red/20 rounded-cartoon text-sm transition-all duration-200"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Member Modal */}
              {showAddMember && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-cartoon-lg p-6 max-w-md w-full mx-4">
                    <h3 className="text-lg font-semibold text-cartoon-dark mb-4 font-fun">➕ 添加家庭成员</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-cartoon-dark mb-1">
                          姓名
                        </label>
                        <input
                          type="text"
                          value={newMemberName}
                          onChange={(e) => setNewMemberName(e.target.value)}
                          className="w-full px-3 py-2 border border-cartoon-light rounded-cartoon focus:outline-none focus:ring-2 focus:ring-cartoon-green"
                          placeholder="输入姓名"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-cartoon-dark mb-1">
                          邮箱
                        </label>
                        <input
                          type="email"
                          value={newMemberEmail}
                          onChange={(e) => setNewMemberEmail(e.target.value)}
                          className="w-full px-3 py-2 border border-cartoon-light rounded-cartoon focus:outline-none focus:ring-2 focus:ring-cartoon-green"
                          placeholder="输入邮箱地址"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-cartoon-dark mb-1">
                          角色
                        </label>
                        <select
                          value={newMemberRole}
                          onChange={(e) => setNewMemberRole(e.target.value as 'student' | 'parent')}
                          className="w-full px-3 py-2 border border-cartoon-light rounded-cartoon focus:outline-none focus:ring-2 focus:ring-cartoon-green"
                        >
                          <option value="student">👨‍🎓 学生</option>
                          <option value="parent">👨‍👩‍👧‍👦 家长</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex space-x-3 mt-6">
                      <button
                        onClick={() => setShowAddMember(false)}
                        className="flex-1 bg-cartoon-light text-cartoon-gray py-2 px-4 rounded-cartoon hover:bg-cartoon-gray/10 transition-all duration-200"
                      >
                        取消
                      </button>
                      <button
                        onClick={handleAddMember}
                        className="flex-1 bg-gradient-to-r from-cartoon-green to-success-400 text-white py-2 px-4 rounded-cartoon hover:shadow-cartoon-lg transition-all duration-200"
                      >
                        发送邀请
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Invites Tab */}
          {activeTab === 'invites' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-cartoon-dark font-fun">📧 待处理邀请</h3>
              
              {pendingInvites.length > 0 ? (
                <div className="space-y-3">
                  {pendingInvites.map((invite) => (
                    <div
                      key={invite.id}
                      className="bg-cartoon-light rounded-cartoon-lg p-4 flex items-center justify-between"
                    >
                      <div>
                        <h4 className="font-semibold text-cartoon-dark">{invite.email}</h4>
                        <p className="text-sm text-cartoon-gray">
                          {invite.role === 'student' ? '👨‍🎓 学生' : '👨‍👩‍👧‍👦 家长'} • 
                          由 {invite.invitedBy} 邀请 • 
                          {formatLastActive(invite.invitedAt)}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button className="px-3 py-1 bg-cartoon-green/10 text-cartoon-green rounded-cartoon text-sm">
                          重新发送
                        </button>
                        <button className="px-3 py-1 bg-cartoon-red/10 text-cartoon-red rounded-cartoon text-sm">
                          撤销
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-cartoon-gray">
                  <div className="text-4xl mb-2">📧</div>
                  <p>暂无待处理邀请</p>
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-cartoon-dark font-fun">⚙️ 家庭设置</h3>
              
              <div className="space-y-4">
                <div className="bg-cartoon-light rounded-cartoon-lg p-4">
                  <h4 className="font-semibold text-cartoon-dark mb-2">🏠 家庭信息</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-cartoon-dark mb-1">
                        家庭名称
                      </label>
                      <input
                        type="text"
                        defaultValue="幸福之家"
                        className="w-full px-3 py-2 border border-cartoon-light rounded-cartoon focus:outline-none focus:ring-2 focus:ring-cartoon-green"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-cartoon-dark mb-1">
                        家庭描述
                      </label>
                      <textarea
                        defaultValue="我们是一个快乐的家庭，一起学习一起成长！"
                        className="w-full px-3 py-2 border border-cartoon-light rounded-cartoon focus:outline-none focus:ring-2 focus:ring-cartoon-green"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-cartoon-light rounded-cartoon-lg p-4">
                  <h4 className="font-semibold text-cartoon-dark mb-2">🎯 默认设置</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-cartoon-dark">学生默认每周任务目标</span>
                      <input
                        type="number"
                        defaultValue={7}
                        min={1}
                        max={14}
                        className="w-16 px-2 py-1 border border-cartoon-light rounded-cartoon text-center"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-cartoon-dark">自动审批任务完成</span>
                      <input type="checkbox" className="rounded" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-cartoon-dark">发送进度通知</span>
                      <input type="checkbox" defaultChecked className="rounded" />
                    </div>
                  </div>
                </div>

                <div className="bg-cartoon-light rounded-cartoon-lg p-4">
                  <h4 className="font-semibold text-cartoon-dark mb-2">🔒 隐私设置</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-cartoon-dark">允许孩子查看彼此进度</span>
                      <input type="checkbox" defaultChecked className="rounded" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-cartoon-dark">允许孩子互相点赞</span>
                      <input type="checkbox" defaultChecked className="rounded" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-cartoon-dark">家庭排行榜可见</span>
                      <input type="checkbox" defaultChecked className="rounded" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button className="bg-gradient-to-r from-cartoon-green to-success-400 text-white px-6 py-2 rounded-cartoon font-medium hover:shadow-cartoon-lg transition-all duration-200">
                  保存设置
                </button>
              </div>
            </div>
          )}
      </div>
    </div>
  );

  if (pageMode) {
    return content;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {content}
    </div>
  );
};

export default FamilyManagement;