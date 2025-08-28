import React from 'react';
import Card from '../Card';

interface Task {
  id: string;
  title: string;
  description: string;
  points: number;
  status: 'pending' | 'in_progress' | 'completed';
  category: string;
  // 审批相关字段
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: Date;
  approvalNotes?: string;
  bonusPoints?: number;
}

interface TodayTaskListProps {
  tasks: Task[];
  onTaskComplete: (taskId: string) => void;
  onTaskContinue: (taskId: string) => void;
  onAddTask: () => void;
  className?: string;
}

const TodayTaskList: React.FC<TodayTaskListProps> = ({
  tasks,
  onTaskComplete,
  onTaskContinue,
  onAddTask,
  className = ''
}) => {
  const getStatusConfig = (status: Task['status'], approvalStatus?: Task['approvalStatus']) => {
    // 已完成任务根据审批状态显示不同信息
    if (status === 'completed') {
      switch (approvalStatus) {
        case 'pending':
          return {
            label: '⏳ 等待审批',
            bgColor: 'bg-yellow-500',
            textColor: 'text-white',
            buttonText: '已提交',
            buttonColor: 'bg-yellow-500 cursor-not-allowed',
            cardOpacity: '',
            pulseAnimation: 'animate-pulse',
            borderColor: 'border-yellow-300'
          };
        case 'approved':
          return {
            label: '✅ 已通过',
            bgColor: 'bg-cartoon-green',
            textColor: 'text-white',
            buttonText: '已通过',
            buttonColor: 'bg-cartoon-green cursor-not-allowed',
            cardOpacity: 'opacity-90',
            pulseAnimation: '',
            borderColor: 'border-green-300'
          };
        case 'rejected':
          return {
            label: '❌ 被拒绝',
            bgColor: 'bg-red-500',
            textColor: 'text-white',
            buttonText: '被拒绝',
            buttonColor: 'bg-red-500 cursor-not-allowed',
            cardOpacity: 'opacity-75',
            pulseAnimation: '',
            borderColor: 'border-red-300'
          };
        default:
          return {
            label: '✓ 已完成',
            bgColor: 'bg-cartoon-green',
            textColor: 'text-white',
            buttonText: '完成',
            buttonColor: 'bg-cartoon-green hover:bg-success-500',
            cardOpacity: 'opacity-75',
            pulseAnimation: '',
            borderColor: 'border-green-300'
          };
      }
    }
    
    // 其他状态保持原有逻辑
    switch (status) {
      case 'in_progress':
        return {
          label: '进行中',
          bgColor: 'bg-cartoon-orange',
          textColor: 'text-white', 
          buttonText: '继续',
          buttonColor: 'bg-cartoon-orange hover:bg-warning-500',
          cardOpacity: '',
          pulseAnimation: '',
          borderColor: 'border-orange-300'
        };
      default:
        return {
          label: '未完成',
          bgColor: 'bg-gray-400',
          textColor: 'text-white',
          buttonText: '开始',
          buttonColor: 'bg-cartoon-blue hover:bg-primary-500',
          cardOpacity: '',
          pulseAnimation: '',
          borderColor: 'border-gray-300'
        };
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      exercise: '🏃',
      reading: '📚',
      chores: '🧹',
      learning: '📖',
      creativity: '🎨',
      other: '📝'
    };
    return icons[category] || '📝';
  };

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalTasks = tasks.length;
  const completedPoints = tasks.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.points, 0);
  const totalPoints = tasks.reduce((sum, t) => sum + t.points, 0);
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <Card className={`col-span-full ${className}`} animate={true}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-cartoon-dark font-fun">✅ 今日任务</h3>
        <button 
          onClick={onAddTask}
          className="bg-cartoon-blue hover:bg-primary-500 text-white px-3 py-1 rounded-cartoon text-sm transition-colors flex items-center"
        >
          ➕ 添加任务
        </button>
      </div>

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {tasks.length > 0 ? (
          tasks.map((task) => {
            const statusConfig = getStatusConfig(task.status, task.approvalStatus);
            return (
              <div 
                key={task.id} 
                className={`bg-cartoon-light rounded-cartoon p-4 transition-all duration-300 h-auto min-h-32 flex flex-col justify-between border-2 ${statusConfig.cardOpacity} ${statusConfig.pulseAnimation} ${statusConfig.borderColor}`}
              >
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-cartoon-dark flex items-center">
                      <span className="mr-2">{getCategoryIcon(task.category)}</span>
                      {task.title}
                    </h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                      {statusConfig.label}
                    </span>
                  </div>
                  
                  <p className="text-sm text-cartoon-gray mb-3 line-clamp-2">{task.description}</p>
                </div>
                
                <div className="flex justify-between items-center mt-auto">
                  <div className="flex flex-col">
                    <span className="text-xs text-cartoon-purple flex items-center">
                      ⭐ {task.points} 积分
                    </span>
                    {task.bonusPoints && task.approvalStatus === 'approved' && (
                      <span className="text-xs text-green-600 flex items-center mt-1">
                        🎁 奖励 +{task.bonusPoints}
                      </span>
                    )}
                  </div>
                  
                  <span className={`text-xs flex items-center ${
                    task.status === 'completed' 
                      ? (task.approvalStatus === 'approved' ? 'text-cartoon-green' : 
                         task.approvalStatus === 'pending' ? 'text-yellow-600' :
                         task.approvalStatus === 'rejected' ? 'text-red-600' : 'text-cartoon-green')
                      : task.status === 'in_progress' 
                        ? 'text-cartoon-orange' 
                        : 'text-gray-500'
                  }`}>
                    {task.status === 'completed' ? (
                      task.approvalStatus === 'approved' ? '✅ 已通过' :
                      task.approvalStatus === 'pending' ? '⏳ 待审批' :
                      task.approvalStatus === 'rejected' ? '❌ 被拒绝' : '✓ 完成'
                    ) : task.status === 'in_progress' ? '进行中' : '待开始'}
                  </span>
                </div>
                
                {/* 审批状态详细信息 */}
                {task.status === 'completed' && task.approvalStatus && (
                  <div className="mt-3 pt-2 border-t border-gray-200">
                    {task.approvalStatus === 'rejected' && task.approvalNotes && (
                      <div className="text-xs text-red-700 bg-red-50 border border-red-200 p-2 rounded-md shadow-sm">
                        <div className="flex items-start">
                          <span className="text-red-500 mr-1">❌</span>
                          <div>
                            <span className="font-medium">拒绝原因：</span>
                            <p className="mt-1">{task.approvalNotes}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {task.approvalStatus === 'pending' && (
                      <div className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 p-2 rounded-md shadow-sm">
                        <div className="flex items-center">
                          <span className="text-yellow-500 mr-2 animate-spin">⏳</span>
                          <span className="font-medium">任务已提交，等待家长审批</span>
                        </div>
                      </div>
                    )}
                    {task.approvalStatus === 'approved' && (
                      <div className="text-xs text-green-700 bg-green-50 border border-green-200 p-2 rounded-md shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="text-green-500 mr-2">🎉</span>
                            <span className="font-medium">任务已通过审批</span>
                          </div>
                          {task.bonusPoints && (
                            <div className="flex items-center bg-green-100 px-2 py-1 rounded-full">
                              <span className="text-green-600 text-xs font-bold">
                                🎁 +{task.bonusPoints}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-8 text-cartoon-gray">
            <div className="text-4xl mb-4">📋</div>
            <p className="mb-4">今天还没有安排任务</p>
            <button 
              onClick={onAddTask}
              className="bg-cartoon-blue hover:bg-primary-500 text-white px-4 py-2 rounded-cartoon transition-colors"
            >
              📅 添加第一个任务
            </button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default TodayTaskList;