const fetch = require('node-fetch');

async function testUserAuthentication() {
  console.log('🧪 开始用户认证测试...\n');
  
  const API_BASE = 'http://localhost:5000';
  
  try {
    // Test 1: Health check
    console.log('1️⃣ 测试API健康状态...');
    const healthResponse = await fetch(`${API_BASE}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ 健康检查:', healthData.message || healthData);
    console.log('');

    // Test 2: Login with empty password for 袁绍宸
    console.log('2️⃣ 测试用户"袁绍宸"登录（空密码）...');
    const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: '袁绍宸',
        password: ''  // 空密码
      }),
    });

    const loginData = await loginResponse.json();
    
    if (loginResponse.ok) {
      console.log('✅ 登录成功!');
      console.log('📋 用户信息:', {
        displayName: loginData.data.user.displayName,
        role: loginData.data.user.role,
        points: loginData.data.user.points
      });
      
      const token = loginData.data.token;
      console.log('🔑 JWT Token:', token.slice(0, 50) + '...');
      
      // Verify this is NOT a demo token
      if (token.startsWith('demo-token')) {
        console.log('❌ 错误: 仍然收到demo-token!');
        return false;
      } else {
        console.log('✅ 正确: 收到真实JWT token!');
      }
      console.log('');

      // Test 3: Verify token with dashboard stats
      console.log('3️⃣ 验证JWT token有效性...');
      const statsResponse = await fetch(`${API_BASE}/api/auth/dashboard-stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        console.log('✅ JWT验证成功!');
        console.log('📊 用户统计:', {
          name: statsData.data.stats.user.name,
          points: statsData.data.stats.user.points,
          level: statsData.data.stats.user.level
        });
        console.log('');
        return true;
      } else {
        console.log('❌ JWT验证失败:', await statsResponse.text());
        return false;
      }
    } else {
      console.log('❌ 登录失败:', loginData.error || loginData);
      return false;
    }

  } catch (error) {
    console.log('💥 测试过程中发生错误:', error.message);
    return false;
  }
}

// 运行测试
testUserAuthentication()
  .then((success) => {
    console.log('\n🎯 测试结果:', success ? '✅ 全部通过' : '❌ 存在问题');
    console.log('\n📝 总结:');
    console.log('- API服务器连接:', success ? '✅' : '❌');
    console.log('- 用户认证功能:', success ? '✅' : '❌');  
    console.log('- JWT token生成:', success ? '✅' : '❌');
    console.log('- Demo模式绕过:', success ? '✅' : '❌');
    
    if (success) {
      console.log('\n🎉 用户"袁绍宸"现在可以正常登录并获得真实JWT token!');
      console.log('💡 建议用户清理浏览器localStorage后重新登录测试');
    } else {
      console.log('\n⚠️ 还需要进一步检查认证配置');
    }
  })
  .catch((error) => {
    console.log('💥 测试执行失败:', error);
  });