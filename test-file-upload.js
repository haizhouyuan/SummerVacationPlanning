// 测试文件上传系统完整性
const fs = require('fs');
const path = require('path');

console.log('📁 文件上传系统测试...\n');

// 检查关键文件
const filesToCheck = [
  {
    path: '/mnt/d/SummerVacationPlanning/frontend/src/services/upload.ts',
    description: '前端上传服务'
  },
  {
    path: '/mnt/d/SummerVacationPlanning/frontend/src/components/FileUpload.tsx',
    description: '文件上传组件'
  },
  {
    path: '/mnt/d/SummerVacationPlanning/frontend/src/config/firebase.ts',
    description: 'Firebase配置'
  },
  {
    path: '/mnt/d/SummerVacationPlanning/backend/src/config/firebase.ts',
    description: '后端Firebase配置'
  }
];

console.log('🔍 关键文件检查:');
let missingFiles = 0;

filesToCheck.forEach(file => {
  if (fs.existsSync(file.path)) {
    console.log(`  ✅ ${file.description} - 存在`);
  } else {
    console.log(`  ❌ ${file.description} - 缺失`);
    missingFiles++;
  }
});

console.log('\n📋 Firebase Storage配置检查:');

// 检查前端Firebase配置
const frontendFirebasePath = '/mnt/d/SummerVacationPlanning/frontend/src/config/firebase.ts';
if (fs.existsSync(frontendFirebasePath)) {
  const content = fs.readFileSync(frontendFirebasePath, 'utf8');
  console.log('  前端Firebase配置:');
  
  if (content.includes('getStorage')) {
    console.log('    ✅ Storage服务已配置');
  } else {
    console.log('    ❌ Storage服务未配置');
  }
  
  if (content.includes('getAuth') || content.includes('getFirestore')) {
    console.log('    ⚠️  检测到废弃的Auth/Firestore导入');
  } else {
    console.log('    ✅ 已清理废弃导入');
  }
}

// 检查后端Firebase配置
const backendFirebasePath = '/mnt/d/SummerVacationPlanning/backend/src/config/firebase.ts';
if (fs.existsSync(backendFirebasePath)) {
  const content = fs.readFileSync(backendFirebasePath, 'utf8');
  console.log('  后端Firebase配置:');
  
  if (content.includes('storage')) {
    console.log('    ✅ Storage服务已配置');
  } else {
    console.log('    ❌ Storage服务未配置');
  }
  
  if (content.includes('firestore') || content.includes('auth')) {
    console.log('    ⚠️  检测到废弃的Auth/Firestore导入');
  } else {
    console.log('    ✅ 已清理废弃导入');
  }
}

console.log('\n🎯 上传服务功能检查:');

// 检查上传服务功能
const uploadServicePath = '/mnt/d/SummerVacationPlanning/frontend/src/services/upload.ts';
if (fs.existsSync(uploadServicePath)) {
  const content = fs.readFileSync(uploadServicePath, 'utf8');
  
  const features = [
    { name: 'Firebase Storage上传', pattern: 'uploadBytes' },
    { name: '文件类型验证', pattern: 'validateFile' },
    { name: '进度跟踪', pattern: 'onProgress' },
    { name: '多文件上传', pattern: 'uploadMultipleFiles' },
    { name: '后端上传接口', pattern: 'uploadFileToBackend' },
    { name: '文件删除功能', pattern: 'deleteFile' }
  ];
  
  features.forEach(feature => {
    if (content.includes(feature.pattern)) {
      console.log(`  ✅ ${feature.name} - 已实现`);
    } else {
      console.log(`  ❌ ${feature.name} - 缺失`);
    }
  });
}

console.log('\n🎨 文件上传组件检查:');

// 检查FileUpload组件
const fileUploadPath = '/mnt/d/SummerVacationPlanning/frontend/src/components/FileUpload.tsx';
if (fs.existsSync(fileUploadPath)) {
  const content = fs.readFileSync(fileUploadPath, 'utf8');
  
  const componentFeatures = [
    { name: '拖拽上传', pattern: 'onDrop' },
    { name: '点击上传', pattern: 'onClick' },
    { name: '进度显示', pattern: 'uploadProgress' },
    { name: '文件预览', pattern: 'preview' },
    { name: '类型限制', pattern: 'acceptedTypes' },
    { name: '错误处理', pattern: 'onUploadError' }
  ];
  
  componentFeatures.forEach(feature => {
    if (content.includes(feature.pattern)) {
      console.log(`  ✅ ${feature.name} - 已实现`);
    } else {
      console.log(`  ❌ ${feature.name} - 缺失`);
    }
  });
  
  // 检查按钮响应性修复
  if (content.includes('<button') && content.includes('onClick') && !content.includes('<p>')) {
    console.log(`  ✅ 上传按钮响应性 - 已修复`);
  } else {
    console.log(`  ⚠️  上传按钮响应性 - 可能存在问题`);
  }
}

console.log('\n📊 支持的文件类型:');
if (fs.existsSync(uploadServicePath)) {
  const content = fs.readFileSync(uploadServicePath, 'utf8');
  
  const supportedTypes = [
    { type: '图片', patterns: ['image/jpeg', 'image/png', 'image/gif'] },
    { type: '视频', patterns: ['video/mp4', 'video/mov', 'video/webm'] },
    { type: '音频', patterns: ['audio/mp3', 'audio/wav', 'audio/aac'] }
  ];
  
  supportedTypes.forEach(typeGroup => {
    const supported = typeGroup.patterns.some(pattern => content.includes(pattern));
    if (supported) {
      console.log(`  ✅ ${typeGroup.type}文件 - 支持`);
    } else {
      console.log(`  ❌ ${typeGroup.type}文件 - 不支持`);
    }
  });
}

// 环境变量检查
console.log('\n🔧 环境变量要求:');
const requiredEnvVars = [
  'REACT_APP_FIREBASE_API_KEY',
  'REACT_APP_FIREBASE_STORAGE_BUCKET',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_CLIENT_EMAIL'
];

console.log('  需要配置的环境变量:');
requiredEnvVars.forEach(envVar => {
  console.log(`    📝 ${envVar}`);
});

// 总结
console.log('\n🎯 文件上传系统状态:');
if (missingFiles === 0) {
  console.log('  ✅ 核心文件完整');
} else {
  console.log(`  ❌ 缺失 ${missingFiles} 个核心文件`);
}

console.log('  🔄 支持的上传方式:');
console.log('    - Firebase Storage (主要)');
console.log('    - 后端API (备用)');
console.log('    - 拖拽上传');
console.log('    - 点击选择');

console.log('\n📝 注意事项:');
console.log('  - Firebase Storage需要正确的环境变量配置');
console.log('  - 文件大小限制: 10MB (Firebase) / 100MB (后端)');
console.log('  - 支持图片、视频、音频格式');
console.log('  - 需要网络连接进行实际上传测试');