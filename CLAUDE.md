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
```

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
```