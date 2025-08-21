# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a summer vacation planning application with a cartoon-style UI and gamification features. The app allows students to plan activities, track completion, and earn points that can be redeemed for rewards. Parents can monitor progress and manage their children's activities.

## Development Commands

### Frontend (React + TypeScript + Tailwind CSS)
```bash
cd frontend
npm start          # Start development server (port 3000)
npm run build      # Build for production
npm test          # Run Jest unit tests
npm test -- --coverage  # Run tests with coverage report
npm test ComponentName   # Run specific test file
```

### Backend (Node.js + Express + TypeScript + MongoDB)
```bash
cd backend
npm run dev       # Start development server with nodemon
npm run build     # Build TypeScript to JavaScript
npm start         # Start production server
npm run create-indexes  # Create MongoDB database indexes
npm run db:optimize     # Optimize database with indexes
```

### Statistics System Testing
```bash
# Run statistics logic validation
node test-statistics-logic.js  # Validate core statistics calculations

# Backend unit tests (requires Jest setup)
# cd backend && npm test (test files in backend/src/__tests__/)

# Frontend unit tests with coverage
cd frontend && npm test -- --coverage --watchAll=false
```

### End-to-End Testing (Cypress)
```bash
cd frontend
# First, start the frontend dev server (port 3000)
npm start

# In another terminal, start the backend server
cd backend && npm run dev

# Then run Cypress tests
npx cypress open   # Open Cypress test runner
npx cypress run    # Run tests headlessly
```

### Dependencies Installation
```bash
# Frontend
cd frontend && npm install

# Backend  
cd backend && npm install
```

## Code Architecture

### Frontend Structure (`frontend/src/`)
- **Components**: Reusable UI components with Tailwind CSS styling
  - `__tests__/`: Jest unit tests for components
  - Key components: TaskCard, PointsDisplay, EvidenceModal, FamilyLeaderboard
- **Pages**: Main application pages (Login, Dashboard, Tasks, Records)
- **Services**: API communication and Firebase integration
- **Config**: Firebase configuration and environment setup
- **Types**: TypeScript interfaces and type definitions (shared with backend)
- **Contexts**: React contexts for state management (AuthContext)
- **Hooks**: Custom React hooks with tests

### Backend Structure (`backend/src/`)
- **Controllers**: Handle HTTP requests and responses
  - mongoAuthController, taskController, dailyTaskController, redemptionController
- **Middleware**: Authentication (JWT), validation, and error handling
- **Routes**: API endpoint definitions
- **Config**: MongoDB database configuration
- **Services**: Business logic (recommendation service)
- **Types**: TypeScript interfaces shared with frontend
- **Utils**: Utility functions (JWT, default tasks)

### Key Components

- **Authentication System**: JWT-based auth with MongoDB, student/parent roles
- **Task Management**: CRUD operations for tasks and daily planning
- **Points System**: Gamification with earning and redemption mechanics
- **Media Upload**: File upload for task completion evidence
- **Database**: MongoDB with optimized indexes for performance

## Database Schema (MongoDB)

### Collections
- `users`: User profiles with roles (student/parent), points, parent-child relationships
- `tasks`: Task templates with categories (exercise, reading, chores, learning, creativity, other), difficulty levels, point values, evidence requirements
- `daily_tasks`: Daily task instances with completion status, evidence uploads, notes
- `redemptions`: Point redemption requests with approval workflow
- `activity_logs`: User activity tracking and analytics

### Key Data Models
- **User roles**: 'student' | 'parent' with hierarchical access
- **Task categories**: exercise, reading, chores, learning, creativity, other
- **Evidence types**: text, photo, video, audio with file size limits
- **Task status**: planned, in_progress, completed, skipped
- **Redemption status**: pending, approved, rejected

## Environment Setup

### Frontend Environment Variables
Copy `.env.example` to `.env.local` and configure:
- API endpoint URLs
- Any external service configurations

### Backend Environment Variables
Copy `.env.example` to `.env` and configure:
- MongoDB connection string
- JWT secrets and configuration
- File upload settings
- Server port configuration

## File Structure

```
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
└── .specstory/         # SpecStory extension artifacts
```

## Database Setup

### MongoDB Configuration
The project uses MongoDB with optimized indexes for performance:
- **Connection**: Configured via environment variables
- **Indexes**: Database indexes for query optimization
- **Scripts**: Automated database setup and optimization

### Database Commands
```bash
# Create database indexes
cd backend && npm run create-indexes

# Optimize database performance
cd backend && npm run db:optimize

# Run database setup script (if exists)
node create-database-indexes.js
```

### File Storage Structure
```
uploads/
├── evidence/
│   └── {userId}/
│       └── {taskId}/
│           └── {timestamp}_{filename}
└── profiles/
    └── {userId}/
        └── {filename}
```

## Testing Strategy

### Unit Tests (Jest + React Testing Library)
- **Components**: 39 tests covering UI components and interactions
- **Services**: 18 tests for API calls and backend integration
- **Hooks**: 8 tests for custom React hooks
- **Coverage**: 100% core functionality coverage
- **Mocks**: API services mocked in `setupTests.ts`

### E2E Tests (Cypress)
- **Authentication flow**: Login, registration, validation
- **Task management**: Creating, completing, evidence upload
- **Dashboard interactions**: Student and parent views
- **Test selectors**: Use `data-cy` attributes for reliable selection

### Test Commands
```bash
# Unit tests
npm test                    # Run all tests
npm test ComponentName      # Run specific test file
npm test -- --coverage     # Generate coverage report

# E2E tests
npx cypress open           # Interactive test runner
npx cypress run            # Headless execution

# Playwright tests (New Testing Standard)
npx playwright test        # Run all Playwright tests
npx playwright test --ui   # Run with UI mode
npx playwright test --debug # Run in debug mode
npx playwright show-report # View test reports
```

## Development Workflow & Standards

### Feature Development Process

#### 1. Branch Creation and Planning
```bash
# Create feature branch from master
git checkout master
git pull origin master
git checkout -b feature/feature-name

# Save development progress using TodoWrite
# Always use TodoWrite to track tasks and maintain progress
```

#### 2. Development Phases

**Phase A: Core Implementation (1-2 weeks)**
- A1: Frontend UI/UX Development
- A2: Backend API Integration  
- A3: Data Flow and State Management
- A4: Error Handling and Validation

**Phase B: Enhanced Features (1-2 weeks)**
- B1: Advanced UI Features
- B2: Performance Optimization
- B3: Security Enhancements
- B4: Accessibility Improvements

**Phase C: Visual & Interactive Features (1-2 weeks)**
- C1: Visual Components and Animations
- C2: Drag & Drop Interactions
- C3: Mobile Responsiveness
- C4: Real-time Updates

**Phase D: Analytics & Reporting (1 week)**
- D1: Data Analytics Features
- D2: Reporting and Dashboards
- D3: Advanced Statistics
- D4: Export Functionalities

#### 3. Testing Requirements (MANDATORY)

**Unit Testing Standard**
- All new components must have Jest tests
- Minimum 85% code coverage required
- Test all user interactions and edge cases
- Mock external dependencies appropriately

**Playwright E2E Testing Standard (CRITICAL)**
```bash
# Every feature MUST pass Playwright tests before merge
# Test ALL interactive elements for proper response

# Key Testing Areas:
1. Button Clicks - Every button must respond correctly
2. Form Submissions - All forms must validate and submit
3. Modal/Dialog Interactions - Open, close, form interactions
4. Navigation - All links and routing must work
5. Data Loading - Loading states and error handling
6. Mobile Responsiveness - Touch interactions on mobile
7. Cross-browser Compatibility - Chrome, Firefox, Safari, Edge
```

**Playwright Test Structure**
```typescript
// Example test file: tests/feature-name.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Login and setup
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should create new task successfully', async ({ page }) => {
    // Navigate to task planning
    await page.click('[data-testid="task-planning-link"]');
    await expect(page).toHaveURL('/task-planning');
    
    // Open create task modal
    await page.click('[data-testid="create-task-button"]');
    await expect(page.locator('[data-testid="task-creation-modal"]')).toBeVisible();
    
    // Fill form and submit
    await page.fill('[data-testid="task-title"]', 'Test Task');
    await page.selectOption('[data-testid="task-category"]', 'learning');
    await page.selectOption('[data-testid="task-activity"]', 'general_learning');
    await page.fill('[data-testid="task-time"]', '30');
    await page.click('[data-testid="submit-task"]');
    
    // Verify task created
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="task-list"]')).toContainText('Test Task');
  });

  test('should validate form inputs correctly', async ({ page }) => {
    await page.click('[data-testid="create-task-button"]');
    
    // Test empty title validation
    await page.click('[data-testid="submit-task"]');
    await expect(page.locator('[data-testid="title-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="title-error"]')).toContainText('任务名称不能为空');
    
    // Test minimum length validation
    await page.fill('[data-testid="task-title"]', 'A');
    await page.click('[data-testid="submit-task"]');
    await expect(page.locator('[data-testid="title-error"]')).toContainText('至少需要2个字符');
  });
});
```

**Data Test IDs Convention**
```typescript
// All interactive elements MUST have data-testid attributes
// Convention: [component]-[element]-[action?]

// Examples:
<button data-testid="create-task-button">创建任务</button>
<input data-testid="task-title-input" />
<select data-testid="task-category-select">
<div data-testid="task-creation-modal">
<span data-testid="title-error-message">
<div data-testid="task-list-container">
```

#### 4. Validation Checklist Before Merge

**Code Quality Checklist**
- [ ] All TypeScript errors resolved
- [ ] ESLint warnings addressed  
- [ ] Prettier formatting applied
- [ ] No console.log statements in production code
- [ ] Proper error handling implemented
- [ ] Loading states implemented
- [ ] Responsive design verified

**Testing Checklist (MANDATORY)**
- [ ] All Jest unit tests passing (85%+ coverage)
- [ ] All Playwright E2E tests passing
- [ ] Every clickable element responds correctly
- [ ] All forms validate and submit properly
- [ ] Modal/dialog interactions work correctly
- [ ] Mobile touch interactions tested
- [ ] Cross-browser compatibility verified
- [ ] Error scenarios tested and handled

**Performance Checklist**
- [ ] Page load times under 3 seconds
- [ ] No memory leaks in components
- [ ] Images optimized and lazy-loaded
- [ ] API calls optimized (caching, pagination)
- [ ] Bundle size impact minimized

#### 5. Testing Commands for Development

```bash
# Development Testing Workflow
cd frontend

# 1. Run unit tests with coverage
npm test -- --coverage --watchAll=false

# 2. Start development servers
npm start  # Frontend (port 3000)
# In another terminal:
cd ../backend && npm run dev  # Backend (port 3001)

# 3. Run Playwright tests
npx playwright test

# 4. Run Playwright tests with UI for debugging
npx playwright test --ui

# 5. Run specific test file
npx playwright test tests/task-creation.spec.ts

# 6. Generate and view test report
npx playwright show-report
```

#### 6. Deployment Verification

```bash
# Production Build Testing
npm run build
npm run start  # Test production build

# End-to-End Production Testing
PLAYWRIGHT_BASE_URL=https://production-url.com npx playwright test

# Performance Testing
npx lighthouse http://localhost:3000 --view

# Accessibility Testing
npx playwright test --grep="accessibility"
```

**Critical Success Criteria**
1. **Every single button/link must respond to clicks**
2. **All forms must validate and submit correctly**
3. **Modal dialogs must open/close properly**
4. **Mobile interactions must work on touch devices**
5. **Loading states must be tested**
6. **Error handling must be verified**
7. **Cross-browser compatibility confirmed**

**Failure Criteria (MERGE BLOCKED)**
- Any Playwright test failing
- Less than 85% unit test coverage
- TypeScript compilation errors
- ESLint errors (warnings are acceptable)
- Broken responsive design
- Non-functional interactive elements

#### 7. Testing Issues Documentation & Solutions

**Issue Tracking Process (MANDATORY)**
```bash
# During testing, if any issues are encountered:
# 1. Document the problem immediately
# 2. Record the solution steps
# 3. Update CLAUDE.md with the solution
# 4. Commit the documentation updates
```

**Testing Issues Log Format**
```markdown
### Testing Issue Resolution Log

#### Issue #[Date]: [Brief Description]
**Problem**: Describe the exact problem encountered
**Environment**: Browser/Device/OS where issue occurred
**Steps to Reproduce**: 
1. Step 1
2. Step 2
3. Step 3

**Error Message/Screenshot**: Include exact error messages
**Root Cause**: What caused the issue
**Solution**: 
1. Detailed solution steps
2. Code changes made
3. Configuration updates

**Prevention**: How to prevent this issue in future
**Testing Verification**: How to verify the fix works
**Related Files**: List of files modified

---
```

**Common Testing Issues Database**

*Note: This section should be updated after each testing session with new issues and solutions*

### Testing Issue Resolution Log

#### Issue #2025-08-21-001: TypeScript Compilation Errors During Development
**Problem**: Multiple TypeScript errors in TaskPlanning.tsx when integrating TaskCreationForm component due to unused/missing state variables and functions
**Environment**: Windows 10, Node.js 18, React 19.1.0, TypeScript
**Steps to Reproduce**: 
1. Add TaskCreationForm import to TaskPlanning.tsx
2. Comment out unused state variables and functions 
3. Run npm start - compilation fails with errors

**Error Messages**: 
- TS2304: Cannot find name 'setError', 'setPlanningTask', 'setLoadingRecommendations', 'setRecommendedTasks'
- TS2448: Block-scoped variable 'loadDailyTasks' used before its declaration
- ESLint warnings about unused variables and missing dependencies

**Root Cause**: 
1. Partial commenting of state variables left references to undefined setters
2. useEffect dependency array issues with function definitions
3. Incomplete cleanup of unused code when integrating new component

**Solution**: 
1. When commenting out state variables, also comment out all their usages
2. Use useCallback for functions referenced in useEffect dependencies
3. Remove unused functions completely rather than commenting them
4. Add proper TypeScript type annotations for API responses

**Prevention**: 
1. Always use TypeScript strict mode during development
2. Implement eslint-disable comments for temporary unused variables
3. Use TODO comments to mark incomplete refactoring
4. Test compilation after each significant change

**Testing Verification**: 
- npm start compiles without errors
- No TypeScript compilation errors
- ESLint warnings reduced to acceptable level
- Browser loads application without console errors

**Related Files**: 
- frontend/src/pages/TaskPlanning.tsx
- frontend/src/components/TaskCreationForm.tsx

---

#### Issue #2025-08-21-002: Port Conflicts During Development Server Startup
**Problem**: Default port 3000 already in use, causing frontend development server startup failure
**Environment**: Windows 10, npm start command
**Steps to Reproduce**: 
1. Run `cd frontend && npm start`
2. Server fails with "Something is already running on port 3000"

**Error Message**: "Something is already running on port 3000"

**Root Cause**: Another development server or application already using port 3000

**Solution**: 
1. Use alternative port: `PORT=3002 npm start`
2. Kill existing process on port 3000 if not needed
3. Configure permanent port in .env file

**Prevention**: 
1. Always check for running processes before starting servers
2. Use consistent port configuration across team
3. Document port usage in project README

**Testing Verification**: 
- Development server starts successfully on alternative port
- Application accessible at http://localhost:3002
- No port conflict warnings

**Related Files**: 
- package.json (scripts section)
- .env.local (PORT configuration)

---

**Post-Testing Documentation Process**
```bash
# After completing any testing session:
# 1. Review all issues encountered
# 2. Update the Testing Issues Log in CLAUDE.md
# 3. Add solutions to prevent future occurrences
# 4. Commit documentation changes with message:
git add CLAUDE.md
git commit -m "docs: update testing issues log with [feature] solutions"

# 5. Create preventive measures in test setup if needed
# 6. Update test selectors or test data as required
```

**Knowledge Base Categories**
- **Environment Setup Issues**: Port conflicts, service startup problems
- **API Integration Issues**: Authentication, CORS, endpoint problems
- **UI/UX Testing Issues**: Element selectors, timing issues, responsive design
- **Data Handling Issues**: Form validation, database connections, state management
- **Browser Compatibility Issues**: Cross-browser differences, mobile-specific problems
- **Performance Issues**: Load times, memory leaks, optimization needs

**Documentation Standards for Solutions**
1. **Clear Problem Statement**: What exactly went wrong
2. **Reproducible Steps**: Anyone should be able to reproduce the issue
3. **Precise Solution**: Step-by-step fix that works
4. **Verification Method**: How to confirm the fix works
5. **Prevention Strategy**: How to avoid the issue in future development

## Development Notes

### Key Technologies
- **Frontend**: React 19.1.0, TypeScript, Tailwind CSS v3
- **Backend**: Node.js 18, Express, MongoDB
- **Database**: MongoDB with optimized indexes
- **Authentication**: JWT-based authentication with role-based access
- **Storage**: Local file storage with 10MB file limit
- **Testing**: Jest, React Testing Library, Cypress

### Architecture Patterns
- **Role-based access**: Student/parent hierarchy with JWT-based authorization
- **RESTful API**: Clean API design with Express.js routes
- **Type safety**: Shared TypeScript interfaces between frontend/backend
- **Component testing**: Comprehensive test coverage with mocks
- **Evidence workflow**: File upload with validation and approval process

### Security Features
- **JWT authentication**: Secure token-based authentication
- **Role-based authorization**: User-specific data access control
- **File upload security**: File type/size restrictions, user-specific folders
- **Input validation**: Express-validator middleware
- **Rate limiting**: Express rate limiting for API endpoints
- **Password hashing**: bcrypt for secure password storage

## Production Deployment (Alibaba Cloud)

### Server Configuration
- **Production server**: 47.120.74.212
- **Project directory**: `/root/projects/SummerVacationPlanning`
- **Frontend**: Nginx serving static files (port 80)
- **Backend**: Node.js API server (port 3001)
- **Database**: MongoDB (default port 27017)

### Deployment Commands
```bash
# Connect to production server
ssh root@47.120.74.212
cd /root/projects/SummerVacationPlanning

# Sync latest code
git pull origin master

# Frontend deployment
cd frontend
npm install
npm run build
# Copy build files to nginx document root

# Backend deployment
cd ../backend
npm install
npm run build
pm2 restart backend  # or pm2 start npm --name "backend" -- run dev
```

### Common Deployment Issues and Solutions

#### Issue 1: Backend API Server Not Responding (Port 3001)
**Symptoms**: 
- Frontend loads correctly (HTTP 200)
- Backend API timeouts or connection refused
- Application functions appear broken

**Diagnosis**:
```bash
# Check if backend is running
pm2 list
pm2 logs backend

# Test API endpoint
curl http://localhost:3001/api/tasks

# Check port availability
netstat -tlnp | grep 3001
```

**Solutions**:
```bash
# Restart backend service
pm2 restart backend
# or completely redeploy
pm2 delete backend
cd /root/projects/SummerVacationPlanning/backend
npm install
npm run build
pm2 start npm --name "backend" -- run dev

# Check environment variables
cat .env
# Ensure PORT=3001, MONGODB_URI, JWT_SECRET are set

# Verify dependencies
npm list
node --version
```

#### Issue 2: SSH Connection Timeouts
**Symptoms**: SSH commands hang or timeout after 2+ minutes

**Solutions**:
- Use direct HTTP testing: `curl -I http://47.120.74.212`
- Check network connectivity: `ping 47.120.74.212`
- Consider using web-based terminal or alternative connection methods
- Implement auto-restart mechanisms with PM2

#### Issue 3: Intermittent Service Availability
**Symptoms**: Service works sometimes, fails other times

**Solutions**:
```bash
# Set up PM2 auto-restart
pm2 startup
pm2 save

# Create health check script
#!/bin/bash
curl -f http://localhost:3001/api/tasks > /dev/null 2>&1
if [ $? -ne 0 ]; then
    pm2 restart backend
    echo "$(date): Backend restarted" >> /var/log/health-check.log
fi

# Add to crontab for regular checks
crontab -e
# Add: */5 * * * * /root/health-check.sh
```

### Production Monitoring

#### Service Status Checks
```bash
# Check all services
pm2 monit
systemctl status nginx
systemctl status mongod

# View logs
pm2 logs backend --lines 50
tail -f /var/log/nginx/error.log
tail -f /var/log/mongodb/mongod.log
```

#### Performance Monitoring
```bash
# Server resources
htop
df -h
free -m

# Application metrics
pm2 show backend
curl -w "@curl-format.txt" -s http://localhost:3001/api/tasks
```

### Emergency Recovery Procedure

If the application becomes completely unresponsive:

```bash
# Full service restart
pm2 stop all
pm2 delete all
systemctl restart nginx
systemctl restart mongod

# Redeploy from scratch
cd /root/projects/SummerVacationPlanning
git pull origin master
cd frontend && npm install && npm run build
cd ../backend && npm install && npm run build
pm2 start npm --name "backend" -- run dev

# Verify deployment
curl http://localhost/
curl http://localhost:3001/api/tasks
```

### Network Configuration

#### Nginx Configuration
Ensure proper proxy setup for API calls:
```nginx
location /api {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}
```

#### Firewall Settings
```bash
# Check firewall status
ufw status

# Open required ports
ufw allow 80
ufw allow 443
ufw allow 3001  # Backend API
ufw allow 27017  # MongoDB (if external access needed)
```
```