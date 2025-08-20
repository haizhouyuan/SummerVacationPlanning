# 部署后配置指南

## 数据库初始化

### 1. 创建默认任务模板

在Firebase Console的Firestore中创建默认任务：

```javascript
// 在Firestore中创建 'tasks' 集合
// 任务模板示例
{
  "id": "task-001",
  "title": "读书30分钟",
  "description": "阅读有益书籍，提升知识水平",
  "category": "学习",
  "points": 10,
  "difficulty": "easy",
  "timeRequired": 30,
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### 2. 设置用户角色

为管理员用户设置特殊角色：

```javascript
// 在用户文档中添加角色
{
  "email": "admin@example.com",
  "role": "admin",
  "permissions": ["manage_tasks", "view_all_users", "approve_redemptions"]
}
```

### 3. 创建积分兑换选项

```javascript
// 在 'rewards' 集合中创建兑换选项
{
  "id": "reward-001",
  "title": "游戏时间30分钟",
  "description": "可以玩30分钟游戏",
  "pointsCost": 50,
  "category": "entertainment",
  "isActive": true,
  "stock": -1 // -1表示无限库存
}
```

## 安全配置

### 1. 更新Firestore安全规则

检查并更新 `firestore.rules` 文件：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 用户只能访问自己的数据
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 任务模板所有人可读，只有管理员可写
    match /tasks/{taskId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // 每日任务用户只能访问自己的
    match /dailyTasks/{taskId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
  }
}
```

### 2. 更新Storage安全规则

检查并更新 `storage.rules` 文件：

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // 用户只能上传到自己的目录
    match /evidence/{userId}/{taskId}/{filename} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 头像上传
    match /profiles/{userId}/{filename} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 监控设置

### 1. 设置错误监控

在Firebase Console中：
1. 转到 "Crashlytics"
2. 点击 "启用Crashlytics"
3. 配置错误报告

### 2. 性能监控

```javascript
// 在前端代码中添加性能监控
import { getPerformance } from 'firebase/performance';

const perf = getPerformance();
// 自定义性能追踪
const trace = perf.trace('custom_trace_name');
trace.start();
// ... 你的代码 ...
trace.stop();
```

### 3. 使用量监控

创建监控脚本 `monitor.js`：

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./firebase-admin-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// 监控用户活动
async function monitorUserActivity() {
  const db = admin.firestore();
  const usersRef = db.collection('users');
  
  // 获取活跃用户数量
  const activeUsers = await usersRef.where('lastLoginAt', '>=', new Date(Date.now() - 24 * 60 * 60 * 1000)).get();
  console.log('24小时内活跃用户:', activeUsers.size);
  
  // 获取新注册用户
  const newUsers = await usersRef.where('createdAt', '>=', new Date(Date.now() - 24 * 60 * 60 * 1000)).get();
  console.log('24小时内新用户:', newUsers.size);
}

monitorUserActivity();
```

## 域名配置（可选）

### 1. 添加自定义域名

在Firebase Console中：
1. 转到 "Hosting"
2. 点击 "添加自定义域名"
3. 输入你的域名
4. 按照指示配置DNS记录

### 2. SSL证书

Firebase会自动为你的域名配置SSL证书。

## 备份策略

### 1. 数据备份

创建备份脚本 `backup.js`：

```javascript
const admin = require('firebase-admin');
const fs = require('fs');

async function backupFirestore() {
  const db = admin.firestore();
  const collections = ['users', 'tasks', 'dailyTasks', 'redemptions'];
  
  for (const collectionName of collections) {
    const snapshot = await db.collection(collectionName).get();
    const data = [];
    
    snapshot.forEach(doc => {
      data.push({
        id: doc.id,
        data: doc.data()
      });
    });
    
    fs.writeFileSync(`backup_${collectionName}_${Date.now()}.json`, JSON.stringify(data, null, 2));
    console.log(`备份完成: ${collectionName}`);
  }
}

backupFirestore();
```

### 2. 定期备份

设置cron作业自动备份：

```bash
# 编辑crontab
crontab -e

# 添加每日备份任务
0 2 * * * /path/to/your/backup.js
```

## 更新和维护

### 1. 依赖更新

创建更新脚本 `update.sh`：

```bash
#!/bin/bash

echo "更新前端依赖..."
cd frontend
npm update
npm audit fix

echo "更新后端依赖..."
cd ../backend
npm update
npm audit fix

echo "更新Functions依赖..."
cd ../functions
npm update
npm audit fix

echo "运行测试..."
cd ../frontend
npm test -- --watchAll=false

echo "构建检查..."
npm run build

echo "更新完成！"
```

### 2. 版本管理

在 `package.json` 中管理版本：

```json
{
  "version": "1.0.0",
  "scripts": {
    "version:patch": "npm version patch",
    "version:minor": "npm version minor",
    "version:major": "npm version major"
  }
}
```

## 用户支持

### 1. 用户反馈收集

在应用中添加反馈功能：

```javascript
// 反馈表单组件
const FeedbackForm = () => {
  const [feedback, setFeedback] = useState('');
  
  const submitFeedback = async () => {
    await db.collection('feedback').add({
      userId: auth.currentUser.uid,
      content: feedback,
      createdAt: new Date(),
      status: 'pending'
    });
  };
  
  return (
    <form onSubmit={submitFeedback}>
      <textarea 
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="请输入您的反馈..."
      />
      <button type="submit">提交反馈</button>
    </form>
  );
};
```

### 2. 用户指南

创建用户指南文档：

```markdown
# 用户使用指南

## 注册和登录
1. 访问应用网址
2. 点击"注册"创建账户
3. 选择用户类型（学生/家长）
4. 填写基本信息

## 任务管理
1. 在"任务计划"页面选择任务
2. 设置计划时间
3. 完成任务后上传证据
4. 获得积分奖励

## 积分兑换
1. 在"奖励"页面查看可兑换物品
2. 选择想要的奖励
3. 确认兑换
4. 等待家长批准（如需要）
```

## 性能优化

### 1. 图片优化

```javascript
// 图片压缩函数
const compressImage = (file, maxWidth = 800, quality = 0.8) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(resolve, 'image/jpeg', quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
};
```

### 2. 缓存策略

```javascript
// Service Worker缓存
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    // API请求缓存策略
    event.respondWith(
      caches.open('api-cache').then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response) {
            // 返回缓存的响应
            fetch(event.request).then((fetchResponse) => {
              cache.put(event.request, fetchResponse.clone());
            });
            return response;
          }
          
          // 如果没有缓存，从网络获取
          return fetch(event.request).then((fetchResponse) => {
            cache.put(event.request, fetchResponse.clone());
            return fetchResponse;
          });
        });
      })
    );
  }
});
```

## 分析和报告

### 1. 用户行为分析

```javascript
// Google Analytics集成
import { getAnalytics, logEvent } from 'firebase/analytics';

const analytics = getAnalytics();

// 跟踪用户行为
const trackUserAction = (action, category, label) => {
  logEvent(analytics, action, {
    event_category: category,
    event_label: label,
    value: 1
  });
};

// 使用示例
trackUserAction('task_completed', 'tasks', 'reading');
```

### 2. 生成报告

```javascript
// 生成用户活动报告
const generateUserReport = async (userId, startDate, endDate) => {
  const db = admin.firestore();
  
  const tasksCompleted = await db.collection('dailyTasks')
    .where('userId', '==', userId)
    .where('status', '==', 'completed')
    .where('completedAt', '>=', startDate)
    .where('completedAt', '<=', endDate)
    .get();
  
  const totalPoints = tasksCompleted.docs.reduce((sum, doc) => {
    return sum + doc.data().pointsEarned;
  }, 0);
  
  return {
    userId,
    period: { startDate, endDate },
    tasksCompleted: tasksCompleted.size,
    totalPoints,
    averagePointsPerDay: totalPoints / ((endDate - startDate) / (1000 * 60 * 60 * 24))
  };
};
```

## 下一步建议

1. **用户测试**：邀请真实用户测试应用
2. **反馈收集**：收集用户反馈并持续改进
3. **功能扩展**：根据用户需求添加新功能
4. **性能优化**：监控应用性能并进行优化
5. **安全审计**：定期进行安全审计和更新

部署完成后，建议先进行小规模测试，然后逐步扩大用户群体。