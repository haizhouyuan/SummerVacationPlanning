# 环境变量配置指南

## 前提条件
- 已完成Firebase项目设置
- 已获取Firebase Web应用配置
- 已下载Firebase Admin SDK密钥文件

## 1. 前端环境变量配置

### 步骤1：创建环境变量文件
```bash
cd frontend
cp .env.example .env.local
```

### 步骤2：编辑 .env.local 文件
用文本编辑器打开 `frontend/.env.local`，填入你的Firebase配置信息：

```bash
# 从Firebase Console的项目设置中获取这些值
REACT_APP_FIREBASE_API_KEY=AIzaSyExample123...
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef

# 如果启用了Analytics，填入这个值
REACT_APP_FIREBASE_MEASUREMENT_ID=G-ABCDEF123

# API配置（替换your-project-id）
REACT_APP_API_BASE_URL=https://us-central1-your-project-id.cloudfunctions.net/api

# 应用配置
REACT_APP_APP_NAME=Summer Vacation Planning
REACT_APP_VERSION=1.0.0
REACT_APP_ENVIRONMENT=production
```

### 如何获取Firebase配置值？
1. 打开Firebase Console
2. 点击项目设置 > 常规
3. 在"你的应用"部分找到Web应用
4. 复制 `firebaseConfig` 对象中的值

## 2. 后端环境变量配置

### 步骤1：创建环境变量文件
```bash
cd backend
cp .env.example .env
```

### 步骤2：准备Firebase Admin SDK密钥
将下载的 `firebase-admin-key.json` 文件放入 `backend/` 目录

### 步骤3：编辑 .env 文件
用文本编辑器打开 `backend/.env`，填入配置信息：

```bash
# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADA...你的私钥...\n-----END PRIVATE KEY-----\n"
FIREBASE_PRIVATE_KEY_ID=your-private-key-id

# 或者使用JSON文件路径（推荐）
# FIREBASE_ADMIN_SDK_PATH=./firebase-admin-key.json

# JWT配置（生成一个随机字符串）
JWT_SECRET=your-super-secure-jwt-secret-key-here-should-be-very-long-and-random
JWT_EXPIRES_IN=7d

# 服务器配置
NODE_ENV=production
PORT=3001

# CORS配置（替换your-project-id）
CORS_ORIGIN=https://your-project-id.web.app

# 其他配置保持默认值
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
APP_NAME=Summer Vacation Planning API
APP_VERSION=1.0.0
```

### 如何获取Firebase Admin SDK配置？
1. 打开Firebase Console
2. 点击项目设置 > 服务账户
3. 如果使用环境变量方式：
   - 查看现有的JSON文件内容
   - 复制相应的字段值
4. 如果使用JSON文件方式：
   - 确保文件路径正确
   - 注释掉单独的环境变量配置

### 如何生成JWT密钥？
在终端中运行：
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 3. 验证配置

### 前端验证
```bash
cd frontend
npm start
```
检查控制台是否有Firebase连接错误。

### 后端验证
```bash
cd backend
npm run dev
```
检查是否能正常连接到Firebase服务。

## 4. 安全注意事项

### 重要：保护你的密钥
- 永远不要将 `.env` 或 `.env.local` 文件提交到版本控制系统
- 确保 `.gitignore` 文件包含了这些文件
- 定期轮换JWT密钥和Firebase密钥

### 检查 .gitignore
确保以下文件在 `.gitignore` 中：
```
# Environment variables
.env
.env.local
.env.production
.env.staging

# Firebase
firebase-admin-key.json
```

## 5. 常见问题

**Q: 配置后前端无法连接Firebase**
A: 检查API密钥是否正确，确保域名在Firebase Console中已授权。

**Q: 后端启动时报Firebase错误**
A: 检查私钥格式是否正确，确保包含换行符 `\n`。

**Q: JWT密钥应该多长？**
A: 建议至少64个字符，包含字母、数字和特殊字符。

**Q: 可以使用相同的Firebase项目用于开发和生产吗？**
A: 建议为开发和生产环境创建不同的Firebase项目。