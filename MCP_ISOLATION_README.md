# MCP 隔离配置说明

## 问题背景
当多个 Claude Code 实例在不同的 git worktree 中同时运行时，会出现 Playwright 浏览器实例冲突的问题：
```
Error: Browser is already in use for C:\Users\admin\AppData\Local\ms-playwright\mcp-chrome-99cb506, use --isolated to run multiple instances of the same browser
```

## 解决方案
为当前的 `login-overhaul` worktree 创建了隔离的 MCP 配置，确保与其他 worktree 不冲突。

## 配置文件

### 1. `.claude/config.json`
- 独立的 MCP 服务器配置
- Playwright 使用独立的用户数据目录：`D:/login-overhaul/.playwright-user-data`
- 唯一的实例 ID：`login-overhaul-worktree`

### 2. `frontend/playwright.config.ts`
- 添加了独立的 `userDataDir` 配置：`./test-user-data-login-overhaul`
- 确保测试运行时使用隔离的浏览器环境

### 3. `.gitignore`
- 排除了 Playwright 生成的用户数据目录
- 防止临时文件被提交到仓库

## 使用方法

### 方法1：自动启动脚本
运行 `start-claude-isolated.bat` 会：
- 设置必要的环境变量
- 创建隔离的用户数据目录
- 准备独立的 MCP 配置环境

### 方法2：手动设置环境变量
```bash
set MCP_PLAYWRIGHT_USER_DATA_DIR=D:/login-overhaul/.playwright-user-data
set MCP_PLAYWRIGHT_INSTANCE_ID=login-overhaul-worktree
set CLAUDE_CONFIG_PATH=D:/login-overhaul/.claude/config.json
```

## 验证配置
现在可以安全地使用 Playwright MCP 工具：
- `mcp__playwright__browser_navigate`
- `mcp__playwright__browser_click`  
- `mcp__playwright__browser_take_screenshot`
- 等等...

## 目录结构
```
D:/login-overhaul/
├── .claude/
│   └── config.json                 # 独立MCP配置
├── .playwright-user-data/          # Playwright用户数据（隔离）
├── frontend/
│   ├── playwright.config.ts        # 修改的Playwright配置
│   └── test-user-data-login-overhaul/  # 测试用户数据
├── start-claude-isolated.bat       # 启动脚本
└── MCP_ISOLATION_README.md         # 本说明文件
```

## 注意事项
1. 每个 git worktree 都应该有自己的独立配置
2. 用户数据目录会自动创建，无需手动创建
3. 隔离配置不影响阿里云 MCP 服务器的正常使用
4. 如果仍然有冲突，请确保其他 worktree 也使用了类似的隔离配置