# 暑假计划应用 (Summer Vacation Planning App)

一个为儿童设计的暑假活动规划和追踪应用，具有卡通风格的UI和游戏化功能。

## 📋 项目概述

这是一个全栈Web应用，帮助家庭管理和追踪孩子的暑假活动。应用具有以下特色：

- 🎨 **卡通风格UI** - 受Duolingo启发的友好界面设计
- 🎮 **游戏化系统** - 积分、等级、成就徽章和排行榜
- 👨‍👩‍👧‍👦 **家庭管理** - 家长可以监控多个孩子的进展
- 📱 **响应式设计** - 适配移动端和桌面端
- ☁️ **实时同步** - 使用Firebase进行数据同步

## 🚀 主要功能

### 学生功能
- ✅ 任务规划和完成追踪
- 📸 上传文字、图片、视频作为完成证据
- 🏆 积分系统和成就徽章
- 📊 个人进度统计和历史记录
- 🎁 积分兑换游戏时间

### 家长功能
- 👀 监控孩子的活动进展
- ✅ 审批任务完成证据
- 👨‍👩‍👧‍👦 管理家庭成员
- 📈 查看详细的进度报告
- 🏆 家庭排行榜

## 🛠 技术栈

### 前端
- **React 18** with TypeScript
- **Tailwind CSS v4** - 样式框架
- **React Router v7** - 路由管理
- **Firebase SDK** - 认证和数据存储

### 后端
- **Node.js** with Express
- **TypeScript** - 类型安全
- **Firebase Admin SDK** - 服务端Firebase操作

### 数据库和存储
- **Firestore** - NoSQL数据库
- **Firebase Storage** - 文件存储
- **Firebase Authentication** - 用户认证

### 测试
- **Jest** - 单元测试
- **React Testing Library** - React组件测试
- **Cypress** - 端到端测试

## 📦 安装和运行

### 前置要求
- Node.js 16+
- npm 8+
- Firebase CLI

### 1. 克隆项目
```bash
git clone <repository-url>
cd SummerVacationPlanning
```

### 2. 安装依赖
```bash
# 前端依赖
cd frontend
npm install

# 后端依赖
cd ../backend
npm install
```

### 3. 配置环境变量
```bash
# 前端环境变量 (frontend/.env.local)
cp frontend/.env.example frontend/.env.local

# 后端环境变量 (backend/.env)
cp backend/.env.example backend/.env
```

更新配置文件中的Firebase配置信息。

### 4. 启动开发服务器
```bash
# 启动前端 (端口 3000)
cd frontend
npm start

# 启动后端 (端口 8080)
cd ../backend
npm run dev
```

## 🧪 测试

### 运行单元测试
```bash
# 前端测试
cd frontend
npm test

# 后端测试
cd ../backend
npm test
```

### 运行端到端测试
```bash
cd frontend
npm run test:e2e
```

### 测试覆盖率
```bash
cd frontend
npm test -- --coverage
```

## 🚀 部署

### 自动部署
使用提供的部署脚本：
```bash
./deploy.sh
```

### 手动部署
```bash
# 1. 构建应用
cd frontend && npm run build
cd ../backend && npm run build

# 2. 部署到Firebase
firebase deploy --only firestore:rules,storage:rules
firebase deploy --only functions
firebase deploy --only hosting
```

## 📁 项目结构

```
SummerVacationPlanning/
├── frontend/                 # React前端应用
│   ├── src/
│   │   ├── components/       # 可复用组件
│   │   ├── pages/           # 页面组件
│   │   ├── contexts/        # React Context
│   │   ├── services/        # API服务
│   │   ├── types/           # TypeScript类型定义
│   │   └── config/          # 配置文件
│   ├── public/              # 静态资源
│   └── cypress/             # E2E测试
├── backend/                 # Node.js后端
│   ├── src/
│   │   ├── controllers/     # 控制器
│   │   ├── middleware/      # 中间件
│   │   ├── routes/          # 路由定义
│   │   ├── services/        # 业务逻辑
│   │   └── types/           # TypeScript类型
│   └── functions/           # Firebase Cloud Functions
├── firebase.json            # Firebase配置
├── firestore.rules          # Firestore安全规则
├── storage.rules            # Storage安全规则
└── deploy.sh               # 部署脚本
```

## 🔐 安全规则

### Firestore规则
- 用户只能访问自己的数据
- 家长可以访问孩子的数据
- 管理员具有完全访问权限

### Storage规则
- 文件按用户和任务ID组织
- 10MB文件大小限制
- 仅支持图片、视频和音频文件

## 🎯 核心组件

### 游戏化组件
- `PointsDisplay` - 积分显示
- `ProgressBar` - 进度条
- `AchievementBadge` - 成就徽章
- `CelebrationModal` - 庆祝动画

### 任务管理
- `DailyTaskCard` - 日常任务卡片
- `TaskCategoryIcon` - 任务分类图标
- `EvidenceModal` - 证据提交模态框

### 文件上传
- `FileUpload` - 文件上传组件
- `MediaPreview` - 媒体预览
- 支持拖拽上传和进度追踪

### 家庭管理
- `ParentDashboard` - 家长控制台
- `FamilyManagement` - 家庭成员管理
- `TaskApprovalWorkflow` - 任务审批流程
- `FamilyLeaderboard` - 家庭排行榜

## 🎨 设计系统

### 颜色方案
- **Primary**: 蓝色系 (#0ea5e9)
- **Secondary**: 黄色系 (#eab308)
- **Success**: 绿色系 (#22c55e)
- **Cartoon Colors**: 明亮的卡通色彩

### 动画效果
- 入场动画 (bounce-in, fade-in)
- 悬停效果 (pop, wiggle, scale)
- 庆祝动画 (sparkle, celebrate, float)
- 进度动画 (平滑过渡效果)

### 字体
- **主要**: Inter (现代无衬线)
- **卡通**: Comic Sans MS (友好卡通)
- **趣味**: Nunito (圆润友好)

## 📊 积分系统

### 积分规则
- 基础任务: 5-20积分
- 额外奖励: 0-10积分 (家长可设置)
- 升级阈值: 每100积分升一级

### 游戏时间兑换
- 普通游戏: 1积分 = 5分钟
- 教育游戏: 1积分 = 10分钟
- 教育游戏每日免费: 前20分钟

## 🔄 开发工作流

1. **功能开发**
   - 创建功能分支
   - 编写测试
   - 实现功能
   - 代码审查

2. **测试流程**
   - 单元测试 (Jest)
   - 集成测试 (React Testing Library)
   - E2E测试 (Cypress)

3. **部署流程**
   - 构建应用
   - 运行测试
   - 部署到Firebase
   - 验证部署

## 📝 贡献指南

1. Fork项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建Pull Request

## 📄 许可证

此项目采用MIT许可证 - 查看[LICENSE](LICENSE)文件了解详情。

## 🙋‍♂️ 支持

如有问题或建议，请：
- 创建Issue
- 发送邮件至：support@example.com
- 查看文档：[docs/](docs/)

## 🎉 致谢

- Duolingo 的UI设计灵感
- Firebase 提供的后端服务
- React 社区的优秀组件库
- 所有贡献者和测试用户

---

**Happy Coding! 让这个暑假更加精彩！** 🌟