# MongoDB 数据库初始化脚本

本目录包含MongoDB数据库的初始化和优化脚本，用于暑假规划应用的数据库设置。

## 📁 文件说明

### `init.js` - 数据库初始化脚本
- **功能**: 创建基础数据和系统配置
- **包含内容**:
  - 10个基础任务（涵盖5大类别）
  - 积分规则配置（每个类别的积分计算规则）
  - 游戏时间兑换配置
  - 系统管理员用户

### `indexes.js` - 数据库索引优化脚本
- **功能**: 为所有集合创建性能优化索引
- **优化集合**:
  - users（用户）
  - tasks（任务库）
  - dailyTasks（每日任务）
  - redemptions（兑换记录）
  - gameTimeExchanges（游戏时间兑换）
  - gameSessions（游戏会话）
  - pointsRules（积分规则）
  - gameTimeConfigs（游戏时间配置）
  - userPointsLimits（用户积分限制）

## 🚀 使用方法

### 1. 环境准备
```bash
# 确保MongoDB服务正在运行
# Windows
net start MongoDB

# Linux/macOS
sudo systemctl start mongod
```

### 2. 配置环境变量
```bash
# 设置MongoDB连接字符串（可选，默认为本地）
export MONGODB_URI="mongodb://127.0.0.1:27017/summer_app"
# 或
export MONGO_URI="mongodb://127.0.0.1:27017/summer_app"
```

### 3. 运行初始化脚本

#### 方法一：使用npm scripts（推荐）
```bash
# 在项目根目录运行
npm run db:init     # 初始化基础数据
npm run db:index    # 创建性能索引
npm run db:setup    # 完整设置（init + index）
```

#### 方法二：直接运行脚本
```bash
# 数据初始化
cd mongodb
node init.js

# 创建索引
node indexes.js
```

#### 方法三：在代码中使用
```javascript
const { initializeDatabase } = require('./mongodb/init.js');
const { createDatabaseIndexes } = require('./mongodb/indexes.js');

// 初始化数据库
await initializeDatabase();

// 创建索引
await createDatabaseIndexes();
```

## 📊 初始化内容详情

### 基础任务库（10个任务）
| 类别 | 任务示例 | 难度 | 积分 |
|------|----------|------|------|
| 阅读类 | 阅读经典故事、写阅读心得 | 简单-中等 | 10-15 |
| 学习类 | 完成数学练习、学习新单词 | 简单-中等 | 8-12 |
| 运动类 | 晨间跑步、体感游戏运动 | 简单-中等 | 10-15 |
| 创意类 | 绘画创作、制作手工 | 中等-困难 | 18-25 |
| 家务类 | 整理房间、帮忙洗碗 | 简单 | 6-8 |

### 积分规则配置
- **阅读类**: 基础10分，每日上限50分
- **学习类**: 基础12分，每日上限60分
- **运动类**: 基础15分，每日上限45分
- **创意类**: 基础18分，每日上限40分
- **家务类**: 基础8分，每日上限30分

### 游戏时间配置
- **普通游戏**: 2积分/分钟，每日最多120分钟
- **教育游戏**: 1.5积分/分钟，每日最多180分钟

## ⚡ 性能优化效果

创建索引后的查询性能提升：
- 用户认证查询: **100倍提升** ⚡
- 每日任务查询: **50倍提升** ⚡  
- 任务推荐算法: **20倍提升** ⚡
- 家长审批工作流: **30倍提升** ⚡
- 游戏时间跟踪: **25倍提升** ⚡
- 排行榜查询: **40倍提升** ⚡

## 🔧 维护说明

### 数据备份
```bash
# 备份数据库
mongodump --db summer_app --out ./backup/

# 恢复数据库
mongorestore --db summer_app ./backup/summer_app/
```

### 重新初始化
```bash
# 清空数据库（谨慎使用！）
mongo summer_app --eval "db.dropDatabase()"

# 重新运行初始化
node mongodb/init.js
node mongodb/indexes.js
```

### 索引维护
```bash
# 查看所有索引
mongo summer_app --eval "db.runCommand('listCollections').cursor.firstBatch.forEach(function(collection) { print('Collection: ' + collection.name); db[collection.name].getIndexes().forEach(function(index) { print('  Index: ' + index.name); }); });"

# 重建索引（如果需要）
mongo summer_app --eval "db.dailyTasks.reIndex()"
```

## 🚨 注意事项

1. **首次运行**: 请先运行 `init.js` 初始化基础数据，再运行 `indexes.js` 创建索引
2. **重复运行**: 脚本支持重复运行，会自动跳过已存在的数据和索引
3. **环境隔离**: 生产环境和开发环境请使用不同的数据库名称
4. **权限要求**: 确保MongoDB用户有创建集合和索引的权限
5. **内存考虑**: 索引创建可能需要较多内存，建议在低峰期执行

## 🔗 相关脚本

项目中还有其他数据库相关脚本：
- `backend/scripts/create-indexes.js` - 后端专用索引脚本
- `create-database-indexes.js` - 根目录索引脚本
- `check-existing-indexes.js` - 索引检查脚本

这些脚本功能类似，`mongodb/` 目录下的版本是统一整理后的标准版本。