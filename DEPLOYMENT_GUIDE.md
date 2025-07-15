# 部署执行指南

## 前提条件检查

在开始部署之前，请确保完成以下准备工作：

### ✅ 已完成的步骤
1. [x] Firebase项目设置
2. [x] 环境变量配置
3. [x] 部署脚本准备

### 🔧 系统要求
- Node.js 18 或更高版本
- npm 或 yarn
- Firebase CLI
- 稳定的网络连接

## 部署步骤

### 步骤1：安装Firebase CLI
```bash
npm install -g firebase-tools
```

### 步骤2：登录Firebase
```bash
firebase login
```

### 步骤3：设置环境变量
```bash
# 运行环境变量设置向导
./setup-env.sh
```

### 步骤4：部署前检查
```bash
# 运行部署前检查
./pre-deploy-check.sh
```

### 步骤5：执行部署
```bash
# 运行部署脚本
./deploy.sh
```

## 部署过程说明

### 自动化部署流程
1. **依赖安装**：自动安装前端和后端依赖
2. **测试执行**：运行所有测试用例
3. **构建应用**：构建前端和后端应用
4. **Firebase部署**：部署到Firebase托管和云函数
5. **部署验证**：验证部署结果

### 手动部署选项

如果需要手动控制部署过程，可以分步执行：

#### 1. 安装依赖
```bash
# 前端依赖
cd frontend
npm install
cd ..

# 后端依赖
cd backend
npm install
cd ..

# Functions依赖
cd functions
npm install
cd ..
```

#### 2. 运行测试
```bash
# 前端测试
cd frontend
npm test -- --coverage --watchAll=false
cd ..

# 后端测试（如果有）
cd backend
npm test
cd ..
```

#### 3. 构建应用
```bash
# 构建前端
cd frontend
npm run build
cd ..

# 构建后端
cd backend
npm run build
cd ..
```

#### 4. 部署到Firebase
```bash
# 设置项目
firebase use your-project-id

# 部署Firestore规则
firebase deploy --only firestore:rules

# 部署Storage规则
firebase deploy --only storage:rules

# 部署Functions
firebase deploy --only functions

# 部署Hosting
firebase deploy --only hosting

# 或者一次性部署所有
firebase deploy
```

## 部署配置说明

### 项目配置 (config.sh)
```bash
# 更新以下配置
export PROJECT_ID="your-firebase-project-id"
export PROJECT_NAME="Summer Vacation Planning"
export REGION="us-central1"
```

### Firebase配置 (firebase.json)
```json
{
  "hosting": {
    "public": "frontend/build",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{"source": "**", "destination": "/index.html"}]
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "storage": {
    "rules": "storage.rules"
  },
  "functions": {
    "source": "functions",
    "predeploy": ["npm --prefix \"$RESOURCE_DIR\" run build"],
    "runtime": "nodejs18"
  }
}
```

## 常见问题解决

### 1. 部署失败："Permission denied"
```bash
# 重新登录Firebase
firebase logout
firebase login

# 检查项目权限
firebase projects:list
```

### 2. 构建失败：依赖问题
```bash
# 清理并重新安装依赖
rm -rf frontend/node_modules backend/node_modules functions/node_modules
npm install --prefix frontend
npm install --prefix backend
npm install --prefix functions
```

### 3. 函数部署失败
```bash
# 检查函数代码
cd functions
npm run build
npm run serve

# 检查环境变量
cat .env
```

### 4. 前端无法访问API
- 检查CORS配置
- 确认API URL正确
- 检查Firebase Functions的触发器设置

## 部署后验证

### 1. 前端验证
- 访问 `https://your-project-id.web.app`
- 测试登录/注册功能
- 检查页面加载和路由

### 2. 后端验证
- 测试API端点：`https://us-central1-your-project-id.cloudfunctions.net/api/health`
- 检查数据库连接
- 验证用户认证

### 3. 数据库验证
- 在Firebase Console中查看Firestore数据
- 检查安全规则是否正确应用
- 测试文件上传到Storage

## 监控和维护

### 1. 错误监控
```bash
# 查看Functions日志
firebase functions:log

# 查看特定函数日志
firebase functions:log --only api
```

### 2. 性能监控
- 在Firebase Console中查看性能指标
- 监控用户活动和错误率
- 设置预算提醒

### 3. 更新部署
```bash
# 更新代码后重新部署
git pull
./deploy.sh
```

## 回滚方案

如果部署出现问题，可以回滚：

```bash
# 回滚到上一个版本
firebase hosting:rollback

# 回滚特定函数
firebase functions:rollback api
```

## 安全最佳实践

1. **定期更新依赖**
2. **监控安全漏洞**
3. **限制API访问**
4. **使用环境变量保护敏感信息**
5. **定期备份数据**

## 获取帮助

如果遇到问题：
1. 查看Firebase文档
2. 检查函数日志
3. 查看浏览器控制台错误
4. 联系技术支持