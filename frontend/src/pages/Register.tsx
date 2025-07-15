import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'student' | 'parent'>('student');
  const [parentEmail, setParentEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('密码确认不匹配');
      return;
    }

    if (password.length < 6) {
      setError('密码长度至少为6位');
      return;
    }

    if (role === 'student' && !parentEmail) {
      setError('学生注册需要提供家长邮箱');
      return;
    }

    setLoading(true);

    try {
      await register(email, password, displayName, role, parentEmail || undefined);
      navigate('/dashboard');
    } catch (error: any) {
      setError(error.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-20 w-20 bg-primary-500 rounded-full flex items-center justify-center">
            <span className="text-white text-2xl font-bold">🏖️</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            创建新账户
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            加入我们的暑假计划社区
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                姓名
              </label>
              <input
                id="displayName"
                name="displayName"
                type="text"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="请输入您的姓名"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                邮箱地址
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="邮箱地址"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                密码
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="密码 (至少6位)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                确认密码
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="再次输入密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                账户类型
              </label>
              <div className="mt-1 flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio text-primary-600 focus:ring-primary-500"
                    name="role"
                    value="student"
                    checked={role === 'student'}
                    onChange={(e) => setRole(e.target.value as 'student' | 'parent')}
                  />
                  <span className="ml-2 text-sm text-gray-700">学生</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio text-primary-600 focus:ring-primary-500"
                    name="role"
                    value="parent"
                    checked={role === 'parent'}
                    onChange={(e) => setRole(e.target.value as 'student' | 'parent')}
                  />
                  <span className="ml-2 text-sm text-gray-700">家长</span>
                </label>
              </div>
            </div>

            {role === 'student' && (
              <div>
                <label htmlFor="parentEmail" className="block text-sm font-medium text-gray-700">
                  家长邮箱
                </label>
                <input
                  id="parentEmail"
                  name="parentEmail"
                  type="email"
                  required
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="家长的邮箱地址"
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                />
                <p className="mt-1 text-xs text-gray-500">
                  需要提供已注册的家长邮箱地址
                </p>
              </div>
            )}
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
                  注册中...
                </span>
              ) : (
                '注册'
              )}
            </button>
          </div>

          <div className="text-center">
            <span className="text-sm text-gray-600">
              已有账户？{' '}
              <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500 transition-colors duration-200">
                立即登录
              </Link>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;