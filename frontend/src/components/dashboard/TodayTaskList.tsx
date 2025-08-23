import React from 'react';
import Card from '../Card';

interface Task {
  id: string;
  title: string;
  description: string;
  points: number;
  status: 'pending' | 'in_progress' | 'completed';
  category: string;
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
  const getStatusConfig = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return {
          label: '✓ 已完成',
          bgColor: 'bg-cartoon-green',
          textColor: 'text-white',
          buttonText: '完成',
          buttonColor: 'bg-cartoon-green hover:bg-success-500',
          cardOpacity: 'opacity-75'
        };
      case 'in_progress':
        return {
          label: '进行中',
          bgColor: 'bg-cartoon-orange',
          textColor: 'text-white', 
          buttonText: '继续',
          buttonColor: 'bg-cartoon-orange hover:bg-warning-500',
          cardOpacity: ''
        };
      default:
        return {
          label: '未完成',
          bgColor: 'bg-gray-400',
          textColor: 'text-white',
          buttonText: '开始',
          buttonColor: 'bg-cartoon-blue hover:bg-primary-500',
          cardOpacity: ''
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
            const statusConfig = getStatusConfig(task.status);
            return (
              <div 
                key={task.id} 
                className={`bg-cartoon-light rounded-cartoon p-4 transition-all duration-300 ${statusConfig.cardOpacity}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-cartoon-dark flex items-center">
                    <span className="mr-2">{getCategoryIcon(task.category)}</span>
                    {task.title}
                  </h4>
                  <span className={`text-xs px-2 py-1 rounded-full ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                    {statusConfig.label}
                  </span>
                </div>
                
                <p className="text-sm text-cartoon-gray mb-3">{task.description}</p>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs text-cartoon-purple flex items-center">
                    ⭐ {task.points} 积分
                  </span>
                  
                  {task.status === 'completed' ? (
                    <span className="text-xs text-cartoon-green flex items-center">
                      ✓ 完成
                    </span>
                  ) : (
                    <button 
                      onClick={() => task.status === 'pending' ? onTaskComplete(task.id) : onTaskContinue(task.id)}
                      className={`${statusConfig.buttonColor} text-white px-3 py-1 rounded-cartoon text-xs transition-colors`}
                    >
                      {statusConfig.buttonText}
                    </button>
                  )}
                </div>
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
      
      {/* Today's Progress Summary */}
      <div className="bg-gradient-to-r from-cartoon-blue/10 to-cartoon-green/10 rounded-cartoon p-4">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h4 className="font-medium text-cartoon-dark">今日进度</h4>
            <p className="text-sm text-cartoon-gray">已完成 {completedTasks}/{totalTasks} 个任务</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-cartoon-green">{completedPoints} / {totalPoints}</p>
            <p className="text-xs text-cartoon-gray">今日积分</p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-cartoon-green to-success-400 h-3 rounded-full transition-all duration-500 ease-out"
            style={{width: `${progressPercentage}%`}}
          ></div>
        </div>
        
        <div className="text-center mt-2">
          <span className="text-xs text-cartoon-gray">{progressPercentage}% 完成</span>
        </div>
      </div>
    </Card>
  );
};

export default TodayTaskList;