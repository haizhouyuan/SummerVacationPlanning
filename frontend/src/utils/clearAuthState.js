/**
 * 清理localStorage中的认证状态工具
 * 用于解决token损坏或过期导致的401错误
 */

// 需要清理的认证相关键名
const AUTH_KEYS = [
  'token',
  'auth_token', 
  'user',
  'currentUser',
  'user_email',
  'user_role',
  'isDemo',
  'api_mode',
  'use_compatible_api',
  // 添加其他可能的认证相关键名
];

/**
 * 清理所有认证相关的localStorage数据
 */
function clearAllAuthState() {
  console.log('🧹 开始清理localStorage认证状态...');
  
  let clearedCount = 0;
  
  AUTH_KEYS.forEach(key => {
    const value = localStorage.getItem(key);
    if (value !== null) {
      localStorage.removeItem(key);
      console.log(`🗑️ 已清理: ${key} = ${value.substring(0, 50)}${value.length > 50 ? '...' : ''}`);
      clearedCount++;
    }
  });
  
  console.log(`✅ 认证状态清理完成，共清理了 ${clearedCount} 个项目`);
  console.log('🔄 请重新登录获取新的认证token');
  
  return clearedCount;
}

/**
 * 诊断当前认证状态
 */
function diagnoseAuthState() {
  console.log('🔍 当前localStorage认证状态:');
  
  const authState = {};
  AUTH_KEYS.forEach(key => {
    const value = localStorage.getItem(key);
    if (value !== null) {
      authState[key] = {
        exists: true,
        length: value.length,
        preview: value.substring(0, 30) + (value.length > 30 ? '...' : ''),
        isJWT: value.includes('.') && value.length > 50
      };
    } else {
      authState[key] = { exists: false };
    }
  });
  
  console.table(authState);
  return authState;
}

/**
 * 在浏览器控制台中使用的便捷函数
 */
if (typeof window !== 'undefined') {
  // 将函数添加到全局对象，方便在控制台调用
  window.clearAuthState = clearAllAuthState;
  window.diagnoseAuthState = diagnoseAuthState;
  
  console.log(`
🛠️ 认证状态清理工具已加载
在浏览器控制台中可以使用以下命令:

clearAuthState()     - 清理所有认证数据
diagnoseAuthState()  - 诊断当前认证状态

使用步骤:
1. 在控制台运行: diagnoseAuthState()  // 查看当前状态
2. 在控制台运行: clearAuthState()     // 清理认证数据
3. 刷新页面，重新登录
  `);
}

export { clearAllAuthState, diagnoseAuthState };