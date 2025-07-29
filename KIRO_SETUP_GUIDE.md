# Kiro 安装和使用指南

## 什么是 Kiro？

Kiro 是一个强大的 AI 代码助手，基于 Claude 3.5 Sonnet 模型，专门为开发者设计。它可以帮助您：
- 编写、调试和优化代码
- 解释复杂的技术概念
- 提供编程建议和最佳实践
- 协助项目开发和维护

## 系统要求

- Windows 10/11
- Node.js 18+ 
- Git
- 稳定的网络连接

## 安装步骤

### 1. 安装 Node.js
如果还没有安装 Node.js，请从 [官网](https://nodejs.org/) 下载并安装。

### 2. 安装 Kiro CLI
```bash
npm install -g @kiro-ai/cli
```

### 3. 验证安装
```bash
kiro --version
```

### 4. 登录 Kiro
```bash
kiro login
```
按照提示输入您的 API 密钥。

## 获取 API 密钥

1. 访问 [Kiro 官网](https://kiro.ai)
2. 注册账户或登录
3. 在设置页面找到 API 密钥
4. 复制密钥并保存

## 基本使用方法

### 在命令行中使用
```bash
# 直接提问
kiro "如何优化这个 React 组件？"

# 分析代码文件
kiro analyze src/components/MyComponent.tsx

# 生成代码
kiro generate "创建一个用户认证组件"
```

### 在 VS Code 中使用
1. 安装 Kiro VS Code 扩展
2. 在设置中配置 API 密钥
3. 使用快捷键 `Ctrl+Shift+K` 打开 Kiro

### 在项目中集成
```bash
# 初始化 Kiro 配置
kiro init

# 这会创建 .kiro 配置文件
```

## 高级功能

### 代码分析
```bash
# 分析整个项目
kiro analyze .

# 分析特定文件类型
kiro analyze "**/*.tsx"
```

### 代码生成
```bash
# 生成组件
kiro generate component UserProfile

# 生成 API 路由
kiro generate api users
```

### 代码优化
```bash
# 优化性能
kiro optimize src/components/HeavyComponent.tsx

# 重构代码
kiro refactor src/utils/helpers.ts
```

## 配置文件示例

创建 `.kiro` 文件：
```json
{
  "apiKey": "your-api-key-here",
  "model": "claude-3.5-sonnet",
  "temperature": 0.7,
  "maxTokens": 4000,
  "projectType": "react-typescript",
  "framework": "nextjs"
}
```

## 常用命令

```bash
# 查看帮助
kiro --help

# 查看版本
kiro --version

# 登录
kiro login

# 登出
kiro logout

# 查看状态
kiro status

# 更新
kiro update
```

## 最佳实践

1. **提供上下文**：在提问时提供足够的代码上下文
2. **明确需求**：清楚地描述您想要实现的功能
3. **迭代优化**：根据 Kiro 的建议逐步改进代码
4. **安全考虑**：不要分享敏感信息或 API 密钥

## 故障排除

### 常见问题

1. **API 密钥无效**
   - 检查密钥是否正确
   - 确认账户状态

2. **网络连接问题**
   - 检查网络连接
   - 尝试使用代理

3. **权限问题**
   - 确保有足够的文件读写权限
   - 检查 Node.js 安装

### 获取帮助

- 官方文档：https://docs.kiro.ai
- GitHub 仓库：https://github.com/kiro-ai
- 社区支持：https://discord.gg/kiro

## 与当前项目集成

由于您的项目是一个 React + TypeScript + Node.js 的全栈应用，Kiro 可以很好地帮助您：

1. **前端开发**：优化 React 组件，改进 TypeScript 类型定义
2. **后端开发**：改进 API 设计，优化数据库查询
3. **测试**：生成单元测试和集成测试
4. **部署**：优化部署配置和 CI/CD 流程

## 下一步

1. 安装 Kiro CLI
2. 获取 API 密钥
3. 在项目中初始化 Kiro
4. 开始使用 AI 助手提升开发效率

祝您使用愉快！ 