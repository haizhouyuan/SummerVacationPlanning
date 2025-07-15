# Firebase 项目设置指南

## 1. 创建Firebase项目

### 步骤1：访问Firebase Console
1. 打开浏览器，访问 [Firebase Console](https://console.firebase.google.com)
2. 使用你的Google账户登录

### 步骤2：创建新项目
1. 点击 "创建项目" 或 "Add project"
2. 项目名称：`summer-vacation-planning` (或你喜欢的名称)
3. 项目ID将自动生成，记住这个ID，后面会用到
4. 选择是否启用Google Analytics（建议启用）
5. 如果启用了Analytics，选择或创建Analytics账户
6. 点击"创建项目"

## 2. 配置Firebase服务

### 步骤1：启用Authentication
1. 在Firebase Console中，点击左侧菜单的 "Authentication"
2. 点击 "Get started"
3. 切换到 "Sign-in method" 标签
4. 启用 "Email/Password" 登录方式
5. 可选：启用 "Google" 登录方式（用于社交登录）

### 步骤2：创建Firestore数据库
1. 点击左侧菜单的 "Firestore Database"
2. 点击 "Create database"
3. 选择 "Start in production mode"（我们已经有安全规则）
4. 选择数据库位置（建议选择离你用户最近的地区）
5. 点击 "Done"

### 步骤3：启用Firebase Storage
1. 点击左侧菜单的 "Storage"
2. 点击 "Get started"
3. 选择 "Start in production mode"
4. 选择存储位置（建议与Firestore相同地区）
5. 点击 "Done"

### 步骤4：启用Firebase Hosting
1. 点击左侧菜单的 "Hosting"
2. 点击 "Get started"
3. 暂时不需要安装Firebase CLI（我们稍后会做）
4. 点击 "Next" 然后 "Continue to console"

### 步骤5：启用Cloud Functions
1. 点击左侧菜单的 "Functions"
2. 点击 "Get started"
3. 选择付费计划（Blaze计划）- Functions需要付费计划
4. 点击 "Continue"

## 3. 获取配置信息

### 步骤1：获取Web应用配置
1. 点击项目设置（齿轮图标）
2. 点击 "项目设置"
3. 滚动到 "你的应用" 部分
4. 点击 "添加应用"，选择 "Web" 图标
5. 应用昵称：`summer-vacation-frontend`
6. 选择 "同时为此应用设置Firebase托管"
7. 点击 "注册应用"
8. 复制配置对象（firebaseConfig），保存到记事本中

### 步骤2：生成Admin SDK密钥
1. 在项目设置中，点击 "服务账户" 标签
2. 点击 "生成新的私钥"
3. 点击 "生成密钥"
4. 保存下载的JSON文件，重命名为 `firebase-admin-key.json`

## 4. 记录重要信息

请将以下信息记录下来，接下来会用到：

```
项目ID: [你的项目ID]
Web应用配置: [firebaseConfig对象]
Admin SDK密钥文件: firebase-admin-key.json
```

## 5. 下一步

完成以上步骤后，你就可以进行环境变量配置了。

## 常见问题

**Q: 为什么需要选择付费计划？**
A: Cloud Functions需要付费计划才能运行。你可以设置预算限制来控制费用。

**Q: 数据库位置选择什么？**
A: 建议选择离你的用户最近的地区，比如中国用户选择亚洲地区。

**Q: 如果我已经有Firebase项目怎么办？**
A: 你可以使用现有项目，只需要确保启用了所需的服务即可。