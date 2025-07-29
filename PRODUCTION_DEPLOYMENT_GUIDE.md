# 🚀 生产部署指南

## 📍 项目地址和访问信息

### 代码仓库
- **项目路径**: `/mnt/d/SummerVacationPlanning`
- **Git状态**: `feature/evidence-upload` 分支
- **远程仓库**: 需要推送到您的生产Git仓库

### 应用结构
```
/mnt/d/SummerVacationPlanning/
├── frontend/          # React前端应用
├── backend/           # Node.js后端API
├── functions/         # Firebase Functions (已废弃)
└── 部署配置文件
```

## 🌐 部署地址配置

### 1. 阿里云ECS部署
基于您之前提到的ECS服务器配置：

**服务器信息**:
- ECS IP: `47.120.74.212` (从API配置推断)
- 后端端口: `5000` (默认)
- 前端端口: `3000` (开发) / `80` (生产)

**访问地址**:
- 生产环境: `http://47.120.74.212`
- API基础地址: `http://47.120.74.212:5000/api`
- 健康检查: `http://47.120.74.212:5000/health`

### 2. 域名配置 (推荐)
建议配置域名以提供更好的用户体验：
- 主域名: `yourdomain.com`
- API子域名: `api.yourdomain.com`
- 管理后台: `admin.yourdomain.com`

## 🛠 快速部署步骤

### 步骤1: 环境准备
```bash
# 1. 确保Node.js环境 (推荐v18+)
node --version
npm --version

# 2. 确保MongoDB运行
systemctl status mongod
# 或
sudo service mongod start

# 3. 确保Git可用
git --version
```

### 步骤2: 代码部署
```bash
# 1. 创建生产目录
sudo mkdir -p /var/www/summer-vacation-planning
cd /var/www/summer-vacation-planning

# 2. 克隆或复制代码
# 方式A: 从当前位置复制
sudo cp -r /mnt/d/SummerVacationPlanning/* .

# 方式B: 从Git仓库克隆 (推荐)
# git clone https://your-repo-url.git .
# git checkout feature/evidence-upload
```

### 步骤3: 后端部署
```bash
# 1. 安装后端依赖
cd backend
sudo npm install --production

# 2. 配置环境变量
sudo nano .env
```

**后端环境变量配置** (`.env`):
```env
# 服务器配置
NODE_ENV=production
PORT=5000

# MongoDB配置
MONGODB_URI=mongodb://localhost:27017/summer_vacation_planning

# JWT配置
JWT_SECRET=your-super-secure-jwt-secret-key-here

# Firebase配置 (仅用于Storage)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_STORAGE_BUCKET=your-project.appspot.com

# CORS配置
CORS_ORIGIN=http://47.120.74.212

# 速率限制
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

```bash
# 3. 构建后端
npm run build

# 4. 数据库优化
npm run db:optimize

# 5. 使用PM2启动后端
sudo npm install -g pm2
pm2 start dist/server.js --name "summer-vacation-api"
pm2 startup
pm2 save
```

### 步骤4: 前端部署
```bash
# 1. 切换到前端目录
cd ../frontend

# 2. 配置环境变量
sudo nano .env.production
```

**前端环境变量配置** (`.env.production`):
```env
# API配置
REACT_APP_API_URL=http://47.120.74.212:5000

# Firebase配置 (仅用于Storage)
REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-firebase-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdefghijklmnop

# 应用配置  
REACT_APP_VERSION=1.0.0
REACT_APP_ENVIRONMENT=production
```

```bash
# 3. 安装前端依赖
sudo npm install

# 4. 构建前端
npm run build

# 5. 配置Nginx (推荐)
sudo apt update
sudo apt install nginx -y

# 6. 配置Nginx站点
sudo nano /etc/nginx/sites-available/summer-vacation-planning
```

**Nginx配置**:
```nginx
server {
    listen 80;
    server_name 47.120.74.212;
    
    # 前端静态文件
    location / {
        root /var/www/summer-vacation-planning/frontend/build;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
        
        # 缓存静态资源
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API代理
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # 健康检查
    location /health {
        proxy_pass http://localhost:5000/health;
    }
    
    # 文件上传大小限制
    client_max_body_size 100M;
}
```

```bash
# 7. 启用站点
sudo ln -s /etc/nginx/sites-available/summer-vacation-planning /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## 🔐 SSL证书配置 (推荐)

### 使用Certbot获取免费SSL证书
```bash
# 1. 安装Certbot
sudo apt install certbot python3-certbot-nginx -y

# 2. 如果有域名，获取SSL证书
sudo certbot --nginx -d yourdomain.com

# 3. 设置自动续期
sudo crontab -e
# 添加: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 监控和日志

### 1. PM2监控
```bash
# 查看应用状态
pm2 status

# 查看日志
pm2 logs summer-vacation-api

# 监控面板
pm2 monit
```

### 2. Nginx日志
```bash
# 访问日志
sudo tail -f /var/log/nginx/access.log

# 错误日志
sudo tail -f /var/log/nginx/error.log
```

### 3. MongoDB监控
```bash
# 连接MongoDB
mongo summer_vacation_planning

# 查看集合状态
db.stats()
db.users.count()
db.daily_tasks.count()
```

## 🧪 部署验证

### 1. 健康检查
```bash
# 后端健康检查
curl http://47.120.74.212:5000/health

# 前端访问测试
curl -I http://47.120.74.212
```

### 2. API测试
```bash
# 测试认证API
curl -X POST http://47.120.74.212/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@example.com","password":"testpass123"}'

# 测试推荐API (需要认证)
curl http://47.120.74.212/api/tasks/recommended?limit=3 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. 功能验证清单
- [ ] 前端页面正常加载
- [ ] 用户注册登录功能
- [ ] 任务创建和管理
- [ ] 智能推荐显示
- [ ] 文件上传功能
- [ ] 积分系统运行
- [ ] 兑换审批流程

## 🔧 故障排除

### 常见问题和解决方案

1. **MongoDB连接失败**
   ```bash
   sudo systemctl status mongod
   sudo systemctl start mongod
   ```

2. **PM2应用崩溃**
   ```bash
   pm2 restart summer-vacation-api
   pm2 logs summer-vacation-api --lines 50
   ```

3. **Nginx配置错误**
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

4. **端口占用**
   ```bash
   sudo netstat -tulpn | grep :5000
   sudo fuser -k 5000/tcp
   ```

## 📱 访问地址总结

### 生产环境访问地址
- **主应用**: `http://47.120.74.212`
- **API文档**: `http://47.120.74.212/api`
- **健康检查**: `http://47.120.74.212/health`

### 管理地址
- **PM2监控**: `pm2 monit` (服务器本地)
- **MongoDB**: `mongo summer_vacation_planning`
- **日志**: `pm2 logs summer-vacation-api`

### 测试用户账号
- **学生演示**: `student@example.com` / `testpass123`
- **家长演示**: `parent@example.com` / `testpass123`

## 🎯 部署后检查事项

1. ✅ 数据库索引是否创建成功 (`npm run db:optimize`)
2. ✅ 文件上传是否正常工作
3. ✅ 智能推荐是否显示
4. ✅ 认证系统是否在各种网络环境下工作
5. ✅ 所有API端点是否响应正常
6. ✅ 前端路由是否正确配置
7. ✅ 静态资源是否正确加载

完成这些步骤后，您的Summer Vacation Planning应用就可以在生产环境中正常运行了！🚀