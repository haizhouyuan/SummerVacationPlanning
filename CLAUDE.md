This file provides guidance to Claude Code (claude.ai/code) when working on the project.

Project Overview

This is a summer vacation planning application with a cartoon-style UI and gamification features. The app allows students to plan activities, track completion, and earn points that can be redeemed for rewards. Parents can monitor progress and manage their children's activities.

Development Commands
Frontend (React + TypeScript + Tailwind CSS)
cd frontend
npm start          # Start development server (port 3000)
npm run build      # Build for production
npm test           # Run Jest unit tests
npm test -- --coverage  # Run tests with coverage report
npm test ComponentName   # Run specific test file

Backend (Node.js + Express + TypeScript + MongoDB)
cd backend
npm run dev       # Start development server with nodemon (port 5000)
npm run build     # Build TypeScript to JavaScript
npm start         # Start production server (built code)
npm run create-indexes  # Create MongoDB database indexes
npm run db:optimize     # Optimize database with indexes

Testing (Use test-case-designer agent for test planning and implementation)

# Simplified unit tests (RECOMMENDED - proven reliable approach)
cd frontend && npm test -- --testPathPatterns="\.simple\." --watchAll=false
cd backend && npm test -- --testPathPatterns="\.simple\."

# Statistics System Testing
node test-statistics-logic.js  # Validate core statistics calculations

# Standard unit tests (use when simplified tests are insufficient)
cd frontend && npm test -- --coverage --watchAll=false
cd backend && npm test

End-to-End Testing (Playwright)
cd frontend
# First, start the frontend dev server (port 3000)
npm start

# In another terminal, start the backend server
cd backend && npm run dev

# Then run Playwright tests
npx playwright test   # Run all tests headlessly


Note: For comprehensive test case design and E2E testing strategy, use the test-case-designer agent. During development, Claude will by default execute all Playwright E2E tests using npx playwright test. To run a single test spec, use the command /run-playwright file=frontend/tests/<specName>.ts, which will execute that specific spec and generate a report.

Dependencies Installation
# Frontend
cd frontend && npm install

# Backend
cd backend && npm install

Running Multiple Instances (Git Worktree)

Note: If you use multiple working directories via Git worktree to develop different branches simultaneously, be mindful of port conflicts. The frontend development server uses port 3000 by default, and the backend server uses port 5000 by default. Running two frontend servers or two backend servers at the same time will cause conflicts on those ports. To avoid this, stop one of the instances or assign a different port to one of them (for example, set a custom PORT environment variable for one of the backend instances).

Code Architecture
Frontend Structure (frontend/src/)

Components: Reusable UI components with Tailwind CSS styling.

__tests__/: Jest unit tests for components.

Key components: TaskCard, PointsDisplay, EvidenceModal, FamilyLeaderboard.

Pages: Main application pages (Login, Dashboard, Tasks, Records).

Services: API communication and Firebase integration.

Config: Firebase configuration and environment setup.

Types: TypeScript interfaces and type definitions (shared with backend).

Contexts: React contexts for state management (e.g., AuthContext).

Hooks: Custom React hooks (with accompanying tests).

Backend Structure (backend/src/)

Controllers: Handle HTTP requests and responses (e.g., mongoAuthController, taskController, dailyTaskController, redemptionController).

Middleware: Authentication (JWT), validation, and error handling.

Routes: API endpoint definitions.

Config: MongoDB database configuration.

Services: Business logic (e.g., recommendation service).

Types: TypeScript interfaces shared with the frontend.

Utils: Utility functions (JWT handling, default tasks).

Key Components

Authentication System: JWT-based authentication with MongoDB, supporting student/parent roles.

Task Management: CRUD operations for tasks and daily planning.

Points System: Gamification with point earning and redemption mechanics.

Media Upload: File upload for task completion evidence (with review/approval process).

Database: MongoDB with optimized indexes for performance.

Database Schema (MongoDB)

(本节不应手动编辑，若有重大变动请更新 CLAUDE.md)

Collections

users: User profiles with roles (student or parent), points, and parent-child relationships.

tasks: Task templates with categories (exercise, reading, chores, learning, creativity, other), difficulty levels, point values, and evidence requirements.

daily_tasks: Daily task instances with completion status, evidence uploads, and notes.

redemptions: Point redemption requests with an approval workflow.

activity_logs: User activity tracking and analytics logs.

Key Data Models

User roles: 'student' or 'parent' (with hierarchical parent-child access control).

Task categories: exercise, reading, chores, learning, creativity, other.

Evidence types: text, photo, video, audio (with file size limits).

Task status: planned, in_progress, completed, skipped.

Redemption status: pending, approved, rejected.

Environment Setup
Frontend Environment Variables

Copy .env.example to .env.local and configure the values:

API endpoint URLs (point these to the backend API).

Any external service keys or configurations (e.g., Firebase credentials).

Backend Environment Variables

Copy .env.example to .env and configure the values:

MongoDB connection string (MONGODB_URI).

JWT secret and configuration.

File upload settings (upload paths, size limits).

Server port (PORT, defaults to 5000).

File Structure

(本节不应手动编辑，若有重大变动请更新 CLAUDE.md)

├── frontend/           # React TypeScript frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── config/
│   │   └── types/
│   ├── public/
│   └── tailwind.config.js
├── backend/            # Node.js Express backend
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── config/
│   │   ├── types/
│   │   └── utils/
│   ├── scripts/        # Database scripts
│   └── tsconfig.json
└── .specstory/         # SpecStory extension artifacts (conversation history, etc.)

Database Setup
MongoDB Configuration

The project uses MongoDB with optimized indexes for performance:

Connection: Configured via environment variables (e.g., MONGODB_URI).

Indexes: Database indexes are created for query optimization.

Scripts: Scripts are available to automate database setup and index creation.

Database Commands
# Create database indexes
cd backend && npm run create-indexes

# Optimize database performance
cd backend && npm run db:optimize

# (Optional) Run any database setup script if present
node create-database-indexes.js

File Storage Structure
uploads/
├── evidence/
│   └── {userId}/
│       └── {taskId}/
│           └── {timestamp}_{filename}
└── profiles/
    └── {userId}/
        └── {filename}

Testing Strategy

**IMPORTANT: Use the test-case-designer agent for all testing tasks**

For comprehensive test case design, testing strategy, and test implementation guidance, use the specialized test-case-designer agent (`.claude/agents/test-case-designer.md`). This agent contains proven testing best practices and lessons learned from this project.

**When to use test-case-designer:**
- Planning test cases for new features
- Identifying testing gaps and edge cases
- Designing test strategies for complex components
- Creating comprehensive test coverage plans
- Implementing simplified vs complex testing approaches

**Quick Testing Approach Guide (see test-case-designer.md for details):**

Simplified Unit Tests (RECOMMENDED for new components):
- Focus on basic rendering and core functionality
- Use minimal mocking to avoid dependency issues
- Test actual component behavior, not assumed behavior
- Example: TaskTimeline.simple.test.tsx (15/15 pass rate)

Complex Integration Tests (use selectively):
- For critical business logic and complete workflows
- Require more setup but provide comprehensive coverage
- Use when simple tests are insufficient

Test Commands
# Simplified unit tests (RECOMMENDED for development)
cd frontend && npm test -- --testPathPatterns="\.simple\." --watchAll=false
cd backend && npm test -- --testPathPatterns="\.simple\."

# Standard unit tests
npm test                    # Run all unit tests
npm test ComponentName      # Run tests for a specific component/file
npm test -- --coverage      # Run tests with coverage report

# E2E tests (Playwright)
npx playwright test         # Run all end-to-end tests headlessly

Playwright MCP 配置与使用规范

**重要说明：** 项目已配置专用的 Playwright MCP 隔离机制，确保多终端并行工作且强制使用 Edge 浏览器。

**启动方式：**
```bash
# Windows (推荐)
scripts\start-claude-isolated.bat

# Linux/macOS
bash scripts/start-claude-isolated.sh

# 手动生成配置
node scripts/playwright-config-generator.js generate
```

**MCP 使用硬性规则（MUST FOLLOW）：**

1. **数据返回限制：** 任何 Playwright 操作禁止返回 DOM、数组或大对象；只返回 "OK"/"FAIL"/简短字符串
2. **选择器优先级：** 优先使用 `getByTestId` / `getByRole` / locator，避免 `page.evaluate`
3. **evaluate 限制：** 若必须使用 evaluate，只返回标量，且不得超过 64 字符
4. **资源过滤：** 自动阻断 image/media/font 和第三方资源以提升性能
5. **静默模式：** 默认开启静默模式 (`silent=true`)，除非明确要求详细输出
6. **超时控制：** 所有操作默认 30 秒超时，避免长时间等待
7. **会话隔离：** 每个终端使用独立的用户数据目录和端口，避免冲突

**推荐使用模式：**

```javascript
// ✅ 推荐 - 使用 testid
await page.getByTestId('student-demo').click();

// ✅ 推荐 - 使用角色选择器
await page.getByRole('button', { name: '学生演示' }).click();

// ✅ 推荐 - 受限的 evaluate
const result = await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')]
    .find(b => b.textContent.includes('学生演示'));
  if (btn) { btn.click(); return 'OK'; }
  return 'NOT_FOUND';
});

// ❌ 避免 - 返回大对象
// await page.evaluate(() => document.querySelector(...)) // 会被序列化成超大 JSON

// ❌ 避免 - jQuery 风格选择器
// button:contains("学生演示") // 不是标准 CSS 选择器
```

**性能优化工具：**
- 使用 `tools/playwright-helpers.js` 中的优化方法
- 自动资源过滤和数据截断
- 智能重试和错误处理

**Edge 浏览器配置：**
- 强制使用 Microsoft Edge 而非 Chrome
- 优化启动参数提升性能
- 支持调试端口和用户数据隔离

Recommended Playwright Workflow with Claude Code

Use MCP for interactive debugging. Run step-by-step actions like navigation, clicking, resizing the viewport, or taking screenshots. For example:

playwright - Navigate to a URL (MCP)
playwright - Click (MCP)
playwright - Resize browser window (MCP)(width: 375, height: 667)
playwright - Take a screenshot (MCP)(filename: "mobile-view.png")


This approach is ideal for inspecting UI state, debugging layout issues, or verifying elements in different viewports. It allows fast iteration without rerunning full test suites.

Use /run-playwright for running specific E2E test specs. To avoid timeouts and delays, run a single test file when possible (for example, /run-playwright file=frontend/tests/auth-flow.spec.ts). This avoids running all tests (which could be hundreds of specs) and returns concise feedback. Claude will show assertion errors and stack traces inline in the output for quick debugging.

Avoid manual installs of Playwright. Claude Code comes with Playwright preconfigured. Do not run npm install @playwright/test or npx playwright install unless necessary. Use MCP and /run-playwright commands instead of manually invoking npx playwright test during development.

Follow project conventions. Always start the backend (npm run dev) and frontend (npm start) servers before running tests. Watch for port conflicts when using Git worktrees (e.g., two frontends both trying to use port 3000). Use npm test -- --coverage for frontend unit tests to generate coverage reports.

Combine strategies. Start with unit tests to verify logic. Use /run-playwright to run failing specs or verify fixes. Use MCP to visually inspect the UI for issues not covered by tests (for example, changed selectors). Take screenshots to verify UI state after a failure. This blended approach ensures both automated and manual verification of changes.

Tips: Don’t run all E2E tests unless necessary, as they may hit Claude’s timeout. Run one spec at a time to iterate quickly. If needed, reduce the number of parallel workers via Playwright config for stability.

Summary: Use MCP for fast, visual debugging, and /run-playwright for automated test specs. Avoid full-suite runs during development to save time. This workflow aligns with the project’s CLAUDE.md guidelines and ensures stable, efficient testing.

## Deployment Pre-flight Checklist 🚀

**CRITICAL**: Execute this checklist BEFORE any production deployment to prevent deployment failures.

### **Step 1: Local Git Status Verification**
```bash
# 1. Check for uncommitted changes
git status
# Expected: "nothing to commit, working tree clean"
# If modified files exist, commit them first

# 2. Verify latest commits
git log --oneline -5
# Confirm your intended changes are in recent commits
```

### **Step 2: Code Synchronization (Dual Push)**
```bash
# 3. Push to GitHub (primary)
git push origin master
# Expected: "Everything up-to-date" or successful push

# 4. Push to Gitee (deployment source)  
git push gitee master
# Expected: "Everything up-to-date" or successful push
```

### **Step 3: Pre-deployment Validation**
```bash
# 5. Final status check
git status
# MUST show: "Your branch is up to date with 'origin/master'"

# 6. Verify no pending changes
git diff HEAD
# Expected: No output (no differences)
```

### **Step 4: Deployment Readiness Confirmation**
- ✅ All intended code changes are committed
- ✅ Working tree is clean (no unstaged changes)
- ✅ Latest commits pushed to BOTH GitHub and Gitee
- ✅ Local branch is synced with remote master
- ✅ No merge conflicts exist

**⚠️ DEPLOYMENT RULE: If ANY checklist item fails, STOP and resolve issues before proceeding.**

---

## Deployment
Aliyun DevOps Deployer

Use the aliyun-devops-deployer agent (see .claude/agents/aliyun-devops-deployer.md) to deploy this application to the Alibaba Cloud production server (IP: 47.120.74.212). This specialized agent automates building and deploying both the React frontend and the Node.js backend on the server.

**Deployment Process**: **STRICTLY FOLLOW the Pre-flight Checklist above before deployment**. After completing all checklist verification steps, trigger the aliyun-devops-deployer agent, which will:

1. **Verify code synchronization**: Confirm latest code is available on Gitee (deployment source)
2. **Pull latest changes**: Fetch the most recent commit from the configured remote repository  
3. **Install dependencies**: Update both frontend and backend package dependencies
4. **Run production builds**: Compile TypeScript and build optimized React bundles
5. **Restart services**: Deploy new builds and restart PM2-managed backend services

**Critical Requirement**: The deployer agent assumes code synchronization is complete. If the Pre-flight Checklist is skipped, deployment may fail or deploy outdated code.

**Infrastructure**: Backend runs under PM2 process manager, frontend served as static files via Nginx reverse proxy.

## Agent Responsibility Matrix and Failure Escalation

### **Standard Deployment Workflow**
```
1. 本地修改代码 (Local Code Changes)
2. 完成Pre-flight Checklist验证 (Complete Pre-flight Checklist)  
3. 双推送到远程 (Push to GitHub + Gitee)  
4. aliyun-devops-deployer agent执行部署 (Agent Deploy)
   ├─ 成功：执行POST-DEPLOYMENT VERIFICATION并报告
   └─ 失败：记录到deploy-log.md并退出 → general-purpose处理
```

### **Agent Responsibility Boundaries**

**aliyun-devops-deployer Agent职责范围:**
- ✅ 执行标准部署步骤 (pull, build, deploy, verify)
- ✅ 基础服务管理 (PM2, Nginx restart)  
- ✅ 执行POST-DEPLOYMENT VERIFICATION检查
- ✅ **双日志记录系统** (deploy-log.md append-only + deploy-log-latest.md实时状态)
- ✅ **遇到问题及时退出** (总时长≤10分钟，单阶段≤3分钟)

**agent禁止执行的操作:**
- ❌ 复杂调试和故障排除 
- ❌ 多轮troubleshooting或长时间silent工作
- ❌ 架构更改或配置决策
- ❌ 基于部署分析的代码修改
- ❌ **读取历史部署日志** (deploy-log.md禁止读取)

### **部署失败升级机制 (Escalation Protocol)**

**agent遇到部署失败时必须:**
1. **立即记录**: 向deploy-log.md追加具体失败详情 (不读取文件)
2. **结构化退出**: 返回明确错误报告:
   ```markdown
   ## DEPLOYMENT FAILED - EXITING TO GENERAL-PURPOSE AGENT
   **Stage**: [失败阶段] | **Error**: [详细错误]
   **Recommended Action**: [general-purpose的具体下一步]
   ```
3. **控制权移交**: 交回general-purpose agent进行复杂问题解决

**general-purpose Agent负责:**
- 🔧 复杂调试和根因分析
- 🔧 配置更改和架构决策  
- 🔧 基于部署失败的代码修改
- 🔧 多步骤troubleshooting和调查
- 🔧 修复问题后重新触发部署

## Agent交互协议和状态文件管理

### **双日志系统架构**

**主日志文件 (.logs/deploy-log.md):**
- 📚 **用途**: 历史部署记录归档
- 🔒 **访问**: aliyun-devops-deployer仅可append，禁止读取
- 👀 **读取者**: general-purpose agent可读取完整历史
- 📝 **内容**: 简洁的部署会话摘要和结果

**实时状态文件 (.logs/deploy-log-latest.md):**
- ⚡ **用途**: 当前部署会话的实时状态
- 🔄 **更新**: aliyun-devops-deployer实时更新
- 📊 **大小限制**: 最大5KB，确保快速读取
- 🎯 **目标读者**: general-purpose agent进行failure分析

### **Agent切换工作流程**

**正常部署流程:**
```
User → aliyun-devops-deployer → 成功部署 → 更新latest文件 → append主日志 → 完成
```

**失败升级流程:**
```
User → aliyun-devops-deployer → 遇到问题 → 更新latest文件(failure详情) → append主日志(summary) → 退出
     ↓
general-purpose agent → 读取latest文件 → 分析问题 → 修复 → 重新触发deployer
```

### **General-Purpose Agent使用指南**

**当接收到部署失败移交时:**

1. **读取实时状态**: 首先读取 `.logs/deploy-log-latest.md` 获取完整failure context
2. **分析失败原因**: 基于latest文件中的诊断信息进行根因分析  
3. **执行修复操作**: 根据建议采取配置更改、代码修复等操作
4. **验证修复效果**: 确认问题已解决
5. **重新触发部署**: 使用aliyun-devops-deployer重新部署

**状态文件读取优先级:**
- 🥇 **优先**: `.logs/deploy-log-latest.md` (最新session详情)
- 🥈 **补充**: `.logs/deploy-log.md` (历史context，如需要)

**交互最佳实践:**
- ✅ 总是先检查latest文件了解当前状态
- ✅ 基于failure details中的建议行动
- ✅ 修复问题后清晰记录所做的更改
- ✅ 重新部署前确认Pre-flight Checklist完成
- ❌ 避免重复deployer已执行的基础检查

Production Environment: The production environment is centralized on an Alibaba Cloud (Aliyun) ECS server. Environment variables (for database URI, JWT secrets, etc.) are configured on the server. (Security aspects such as HTTPS, CORS configuration, and secret management are handled in the server setup and deployment process.)

## Deployment Troubleshooting 🔧

### **Common Failure Patterns and Solutions**

#### **1. Code Synchronization Failures**
**Symptoms**: Deployed application doesn't reflect recent code changes
**Root Cause**: Local modifications not committed/pushed to remote repository
**Diagnostic Steps**:
```bash
# On local machine
git status                    # Check for uncommitted changes
git log --oneline -3         # Verify latest commits
git remote -v                # Confirm remote repositories

# On server (SSH to 47.120.74.212)
cd /root/projects/SummerVacationPlanning
git log --oneline -3         # Compare with local commits
git status                   # Check server repository state
```
**Solution**: Execute complete Pre-flight Checklist before redeployment

#### **2. React Version Compatibility Issues**
**Symptoms**: Frontend buttons unresponsive, JavaScript events not triggering
**Root Cause**: React version changes breaking event system compatibility
**Diagnostic Commands**:
```bash
# Check current React version in build
grep "react" frontend/package.json
grep "react" frontend/build/static/js/main.*.js

# Verify event listeners in browser
# Browser console: check for React-related errors
```
**Solution**: Use stable React versions (18.x), test event binding after upgrades

#### **3. Build Artifact Staleness**
**Symptoms**: Old UI/functionality persists after deployment
**Root Cause**: Build process using cached/old source files
**Diagnostic Steps**:
```bash
# On server
ls -la frontend/build/        # Check build timestamps
ls -la backend/dist/          # Check compiled backend timestamps
npm cache clean --force       # Clear npm cache
```
**Solution**: Force clean build with cache clearing

### **Deployment Rollback Procedure**

#### **Emergency Rollback Steps**
```bash
# 1. SSH to production server
ssh root@47.120.74.212

# 2. Stop current services
pm2 stop summer-vacation-backend
pm2 delete summer-vacation-backend

# 3. Restore previous backup
# (Requires backup created during deployment process)

# 4. Restart with previous version
pm2 start previous-ecosystem.config.js

# 5. Verify rollback success
curl http://localhost:5000/health
```

### **Prevention Measures**
- ✅ Always execute Pre-flight Checklist completely
- ✅ Test critical functionality after React/dependency upgrades
- ✅ Maintain deployment backups for quick rollback
- ✅ Use staging environment for high-risk changes
- ✅ Document all deployment modifications in .logs/deploy-log.md

---

## Development-Deployment Best Practices 🏆

### **The Four-Step Development Workflow**

#### **1. MODIFY → 2. COMMIT → 3. PUSH → 4. DEPLOY**

**Never skip or reorder these steps. Each step has mandatory validation.**

```bash
# Step 1: MODIFY (Local Development)
# - Make code changes
# - Test locally (npm test, npm start)
# - Verify functionality works as expected

# Step 2: COMMIT (Local Version Control)
git add [modified-files]
git commit -m "descriptive commit message"
# - Document changes in commit message
# - Reference issue numbers if applicable

# Step 3: PUSH (Remote Synchronization) 
git push origin master    # Primary repository (GitHub)
git push gitee master     # Deployment source (Gitee)
# - BOTH pushes must succeed
# - Verify git status shows "up to date"

# Step 4: DEPLOY (Production Release)
# - Execute CLAUDE.md Pre-flight Checklist
# - Use aliyun-devops-deployer agent
# - Monitor deployment logs and health checks
```

### **Multi-Environment Code Management**

#### **Environment Hierarchy**
```
LOCAL DEV → REMOTE STAGING → PRODUCTION
    ↓           ↓               ↓
Individual  Integration   Live Users
Testing     Testing       Zero Downtime
```

#### **Branch Strategy**
- **master**: Production-ready code only
- **feature/***: Individual feature development
- **staging**: Integration testing branch (optional)

#### **Deployment Gates**
- ✅ **Local Dev**: All tests pass, functionality verified
- ✅ **Remote Staging**: Integration tests, performance validation  
- ✅ **Production**: Full checklist, monitoring, rollback ready

### **Framework Upgrade Risk Management**

#### **React Version Upgrade Protocol**
```bash
# 1. Pre-upgrade Assessment
npm outdated react react-dom @types/react @types/react-dom

# 2. Create Backup Branch
git checkout -b backup-before-react-upgrade
git push origin backup-before-react-upgrade

# 3. Upgrade in Controlled Steps
# - Upgrade patch versions first (18.2.0 → 18.3.1)
# - Test thoroughly before major upgrades (18.x → 19.x)
# - Validate event binding, hooks, and lifecycle methods

# 4. Validation Testing
npm test -- --coverage
npm run build
# - Test login/registration functionality specifically
# - Verify button event handlers work correctly
# - Check browser console for errors

# 5. Staged Deployment
# - Deploy to staging first
# - Run E2E tests against staging
# - Monitor for 24-48 hours before production
```

#### **High-Risk Change Indicators**
- 🔴 **Major version upgrades** (React 18→19, Node 16→18)
- 🔴 **Event system changes** (onClick, onSubmit handlers)
- 🔴 **Authentication system modifications**
- 🔴 **Database schema changes**
- 🔴 **API endpoint restructuring**

**For high-risk changes: Use staging environment and extended testing periods**

---

## Deployment Failure Case Studies 📚

### **Case Study 1: React 19 Event Binding Failure (2025-08-28)**

#### **Incident Summary**
**Problem**: Frontend login/registration buttons became unresponsive after deployment
**Root Cause**: Local React 19→18 downgrade not committed/pushed before deployment
**Impact**: User authentication completely non-functional

#### **Failure Chain Analysis**
```
1. ❌ LOCAL: Modified package.json (React 19→18) + Login.tsx
2. ❌ COMMIT: Changes not committed to git
3. ❌ PUSH: Modifications not pushed to remote repositories  
4. ❌ DEPLOY: Deployer used old React 19 code from server
5. 🔥 RESULT: Production deployed with incompatible React version
```

#### **Technical Deep Dive**
**Event System Incompatibility**:
- React 19.1.0 event binding mechanism changed
- `onClick` and `onSubmit` handlers not attaching to DOM
- Browser testing revealed no event listeners on form elements
- Manual `dispatchEvent` calls failed

**Diagnostic Commands Used**:
```javascript
// Browser console diagnostics
document.querySelector('form').onsubmit        // null (should have handler)
document.querySelector('button').onclick      // null (should have handler)
form.dispatchEvent(new Event('submit'))      // false (event blocked)
```

#### **Resolution Steps**
1. ✅ **Root Cause Analysis**: Used MCP browser testing to identify event binding failure
2. ✅ **Code Review**: Confirmed React version discrepancy between local/remote
3. ✅ **Proper Fix Process**: 
   - Commit React 18 downgrade locally
   - Push to both GitHub and Gitee repositories  
   - Redeploy using aliyun-devops-deployer
   - Verify button event handlers working

#### **Lessons Learned**
- ✅ **Never skip Pre-flight Checklist**: Git status must be clean before deployment
- ✅ **React major upgrades are high-risk**: Require extensive testing and staged rollout
- ✅ **Event system testing critical**: Manual browser testing needed for UI interactions
- ✅ **Deployer agent limitations**: Cannot fix source code issues, only deployment process

#### **Prevention Measures Implemented**
- 📋 **Enhanced CLAUDE.md Pre-flight Checklist** with strict validation
- 🤖 **Deployer Agent Updates** with mandatory user confirmation
- 📚 **Best Practices Documentation** for framework upgrades
- 🔧 **Troubleshooting Guide** for common failure patterns

### **Deployment Failure Prevention Matrix**

| **Failure Type** | **Prevention** | **Detection** | **Recovery** |
|------------------|----------------|---------------|--------------|
| Code Sync Issues | Pre-flight Checklist | Git status comparison | Recommit and redeploy |
| Framework Incompatibility | Staged upgrades, testing | Browser console errors | Version rollback |
| Build Cache Problems | Clean builds | Timestamp verification | Cache clearing |
| Service Conflicts | Port checks, PM2 status | Service monitoring | Process restart |
| Configuration Errors | Environment validation | Health checks | Config rollback |

### **ULTRATHINK Problem Analysis Framework**

When deployment failures occur, use this systematic approach:

1. **🔍 SURFACE SYMPTOMS**: What is the user-visible problem?
2. **🏗️ INFRASTRUCTURE LAYER**: Are servers, databases, networks working?
3. **🔄 PROCESS LAYER**: Was the deployment workflow followed correctly?
4. **💾 CODE LAYER**: Are the deployed artifacts correct and current?
5. **🧠 ROOT CAUSE**: What is the underlying architectural or process issue?
6. **🛠️ FIX + PREVENT**: Immediate resolution + systemic prevention measures

**This framework ensures deep analysis rather than surface-level fixes.**

Development Notes
Key Technologies

Frontend: React 19.1.0, TypeScript, Tailwind CSS v3

Backend: Node.js 18, Express, MongoDB

Database: MongoDB with optimized indexes

Authentication: JWT-based auth with role-based access control

Storage: Local file storage (10 MB max upload size)

Testing: Jest + React Testing Library (simplified approach), Playwright E2E tests

Architecture Patterns

Role-based access: Separate student/parent roles enforced with JWT and Express middleware.

RESTful API: Organized Express routes for clean, resource-based endpoints.

Type safety: Shared TypeScript interfaces and types between frontend and backend for consistency.

Component testing: Emphasis on simplified, reliable tests that focus on actual component behavior rather than complex mocking scenarios.

Evidence workflow: Uploaded evidence files are tied to tasks with a review/approval process.

Development Record Management

MANDATORY DEVELOPMENT LOGGING:
Claude Code MUST automatically append development records to .logs/dev-notes.md in the following situations:

**REQUIRED LOGGING TRIGGERS:**
1. **Before any git commit** - Document what was accomplished and any lessons learned
2. **When encountering and resolving critical issues** - Record the problem, solution, and prevention measures
3. **When making architectural decisions** - Document the decision rationale and alternatives considered
4. **When completing significant TodoWrite tasks** - Summarize outcomes and any surprises encountered
5. **When discovering important insights** - Record knowledge that would help future development

**MANDATORY LOG FORMAT:**
```markdown
### [YYYY-MM-DD HH:mm] - [COMMIT/ISSUE/DECISION/INSIGHT]
- **Context**: Brief description of what was being worked on
- **Key Actions**: What was done (files changed, problems solved)
- **Lessons Learned**: Critical insights, gotchas, or best practices discovered
- **Impact**: Files affected, potential future considerations
- **Status**: ✅ Complete / ⚠️ Needs follow-up / ❌ Blocked
```

**CRITICAL FOCUS AREAS:**
- Authentication and security implementations
- Database schema changes and migration issues  
- Build and deployment problems and solutions
- Performance bottlenecks and optimization strategies
- Integration challenges between frontend/backend/database
- Testing failures and debugging insights

This logging is MANDATORY, not optional. Every development session that results in code changes must produce at least one dev-notes.md entry before committing.

Claude Memory Markers: In conversations with Claude (the AI coding assistant), mark important information or decisions as memory points. This helps the assistant recall crucial context across sessions. (For example, you might explicitly instruct Claude to remember a summary of new requirements or a design decision, so it can be easily referenced later in the development process.)

Git Worktree Parallel Development and Merge Guide

To enable parallel development of multiple features without polluting the main branch, you can use Git worktrees to create multiple independent working directories, each checked out to a different feature branch. The following best practices will help keep the master branch history clean and ensure all worktrees stay in sync when merging:

Develop on independent branches. Each Git worktree should use its own feature branch, and the branch name should clearly describe the feature being developed (e.g., feature/feature-name). You can create a new worktree with the git worktree add command. For example, use:

git worktree add ../<repo-name>-<feature-code> -b feature/<feature-code> origin/master


This creates a new folder alongside the main repo (e.g., repo-name-feature-code) and checks out a new branch feature/<feature-code> based on master. Each feature then has its own isolated environment, preventing interference between parallel developments.

Merge only one feature branch into master at a time. At any given moment, only one feature branch should be merged into master. Developers should manually control the order of merges according to priority. Merging branches sequentially keeps the master history clear and reduces the risk of conflicts caused by interleaved feature changes.

Sync other worktrees after a merge. Once a feature branch has been merged into master, all other worktrees that are still in development must be synced with the updated main branch. To do this, run git fetch in each of those worktree directories, then update your current feature branch with the latest changes from master (using git rebase origin/master or, if necessary, git merge origin/master). Keeping feature branches up-to-date with the latest master reduces the likelihood of conflicts during later merges.

Update documentation and handle architecture changes. After merging a feature branch, if it introduced changes to the database schema, workflows, or overall architecture, make sure to update the project documentation (this file, CLAUDE.md) to reflect the new changes. Additionally, developers working on other feature branches should promptly adjust their code to align with these updates (or temporarily comment out conflicting parts) to avoid difficult conflicts later.

Record merge summaries. Each time a feature branch is merged into master, it’s recommended to use Claude Code to record a summary of the merge. The summary should include the feature name, the modules/files updated, and whether CLAUDE.md needed updates. These records should be stored in .logs/dev-notes.md so the team can easily track the history of merged changes and their impacts.

Updating CLAUDE.md

Keep this document up-to-date as the project evolves. Update the CLAUDE.md file whenever:

The database schema changes (e.g., adding or modifying collections, models, or significant fields).

The API routes or overall backend/frontend structure changes (for instance, adjusting endpoint URLs or reorganizing major modules).

The file/directory structure of the project is significantly altered (such as adding new top-level directories or moving important files).

Development workflows change or new tools are introduced (for example, adopting a new testing framework or updating deployment processes).

Major new features are added that affect the application's architecture or core functionality (anything that would change the high-level overview or other sections of this document).