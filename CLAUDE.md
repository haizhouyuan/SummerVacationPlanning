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

Deployment
Aliyun DevOps Deployer

Use the aliyun-devops-deployer agent (see .claude/agents/aliyun-devops-deployer.md) to deploy this application to the Alibaba Cloud production server (IP: 47.120.74.212). This specialized agent automates building and deploying both the React frontend and the Node.js backend on the server.

Deployment Process: Ensure all code changes are committed and pushed. Trigger the deployer agent, which will pull the latest code on the server, install dependencies, run the production builds, and restart the services. The backend runs under a process manager (e.g., PM2) and the frontend is served as static files (via Nginx or a similar web server).

Production Environment: The production environment is centralized on an Alibaba Cloud (Aliyun) ECS server. Environment variables (for database URI, JWT secrets, etc.) are configured on the server. (Security aspects such as HTTPS, CORS configuration, and secret management are handled in the server setup and deployment process.)

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