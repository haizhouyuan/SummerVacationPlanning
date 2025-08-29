import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import FamilyManagement from '../components/FamilyManagement';

const FamilyManagementPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect non-parent users
  React.useEffect(() => {
    if (user && user.role !== 'parent') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

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
        {/* Page Title */}
        <div className="bg-white rounded-cartoon-lg shadow-cartoon p-6 mb-6 animate-bounce-in">
          <div className="flex items-center">
            <div className="h-12 w-12 bg-gradient-to-br from-cartoon-purple to-primary-400 rounded-cartoon flex items-center justify-center animate-float">
              <span className="text-white text-xl font-bold">👨‍👩‍👧‍👦</span>
            </div>
            <div className="ml-4">
              <h1 className="text-3xl font-bold text-cartoon-dark font-fun">家庭管理</h1>
              <p className="text-cartoon-gray mt-2">管理家庭成员、邀请和设置</p>
            </div>
          </div>
        </div>

        {/* Family Management Content */}
        <div className="bg-white rounded-cartoon-lg shadow-cartoon p-6">
          <FamilyManagement isOpen={true} onClose={() => {}} pageMode={true} />
        </div>
      </div>
    </Layout>
  );
};

export default FamilyManagementPage;