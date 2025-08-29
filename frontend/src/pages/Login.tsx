import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginDemo } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password, navigate);
      // 跳转逻辑由AuthContext处理，基于用户角色自动导航
    } catch (error: any) {
      setError(error.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (userType: 'parent' | 'student') => {
    setError('');
    setLoading(true);

    try {
      await loginDemo(userType, navigate);
    } catch (error: any) {
      setError(error.message || '演示登录失败');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-md w-full space-y-6 sm:space-y-8">
        <div>
          <div className="mx-auto h-20 w-20 bg-primary-500 rounded-full flex items-center justify-center">
            <span className="text-white text-2xl font-bold">🏖️</span>
          </div>
          <h2 className="mt-4 sm:mt-6 text-center text-2xl sm:text-3xl font-extrabold text-gray-900">
            欢迎回来！
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 px-2">
            登录您的暑假计划账户
          </p>
          
          {/* 网络兼容模式提示 */}
          <div className="mt-4 p-3 bg-primary-50 border border-primary-200 rounded-lg">
            <div className="flex items-center">
              <span className="text-primary-500 mr-2">🔧</span>
              <div className="text-xs text-primary-700">
                <strong>网络兼容模式已启用</strong>
                <br />适配受限网络环境，正常登录使用
              </div>
            </div>
          </div>
        </div>

        <form className="mt-6 sm:mt-8 space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                账号名称
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="请输入账号（袁绍宸/爸爸/妈妈）"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                密码
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="密码（可留空）"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="bg-danger-50 border border-danger-200 text-danger-800 px-4 py-3 rounded-lg animate-shake">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  登录中...
                </span>
              ) : (
                '登录'
              )}
            </button>
          </div>

          {/* 演示登录分隔线 */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gradient-to-br from-primary-100 to-secondary-100 text-gray-500">或使用演示账号</span>
            </div>
          </div>

          {/* 演示登录按钮 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleDemoLogin('student')}
              disabled={loading}
              className="group relative flex justify-center py-3 px-4 border border-primary-300 text-sm font-medium rounded-md text-primary-700 bg-primary-50 hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              data-testid="demo-student-login"
            >
              <span className="flex items-center">
                <span className="mr-2">👦</span>
                学生演示
              </span>
            </button>
            
            <button
              type="button"
              onClick={() => handleDemoLogin('parent')}
              disabled={loading}
              className="group relative flex justify-center py-3 px-4 border border-secondary-300 text-sm font-medium rounded-md text-secondary-700 bg-secondary-50 hover:bg-secondary-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              data-testid="demo-parent-login"
            >
              <span className="flex items-center">
                <span className="mr-2">👨‍👩‍👧‍👦</span>
                家长演示
              </span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default Login;