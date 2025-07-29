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
```

### Backend (Node.js + Express + TypeScript)
```bash
cd backend
npm run dev       # Start development server with nodemon
npm run build     # Build TypeScript to JavaScript
npm start         # Start production server
```

### Firebase Functions
```bash
cd functions
npm run build     # Build TypeScript functions
npm run serve     # Start local emulator
npm run deploy    # Deploy to Firebase
```

### End-to-End Testing
```bash
cd frontend
# Start dev server first, then run:
npx cypress open   # Open Cypress test runner
npx cypress run    # Run tests headlessly
```

### Dependencies Installation
```bash
# Frontend
cd frontend && npm install

# Backend
cd backend && npm install

# Functions
cd functions && npm install
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
  - authController, taskController, dailyTaskController, redemptionController
- **Middleware**: Authentication, validation, and error handling
- **Routes**: API endpoint definitions
- **Config**: Firebase Admin SDK and database configuration
- **Types**: TypeScript interfaces shared with frontend
- **Utils**: Utility functions (JWT, default tasks)

### Key Components

- **Authentication System**: Firebase Auth with student/parent roles
- **Task Management**: CRUD operations for tasks and daily planning
- **Points System**: Gamification with earning and redemption mechanics
- **Media Upload**: File upload for task completion evidence
- **Real-time Updates**: Firestore for live data synchronization

## Database Schema (Firestore)

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
- Firebase configuration keys
- API endpoint URLs

### Backend Environment Variables
Copy `.env.example` to `.env` and configure:
- Firebase Admin SDK credentials
- JWT secrets
- Database connection strings

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
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── config/
│   │   └── types/
│   └── tsconfig.json
└── .specstory/         # SpecStory extension artifacts
```

## Firebase Configuration

### Security Rules
The project includes comprehensive Firebase security rules:
- **Firestore Rules**: `firestore.rules` - Role-based access control
- **Storage Rules**: `storage.rules` - File upload restrictions and user-specific access
- **Indexes**: `firestore.indexes.json` - Query optimization for performance

### Deployment Commands
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy security rules
firebase deploy --only firestore:rules,storage:rules

# Deploy functions (backend)
firebase deploy --only functions

# Deploy hosting (frontend)
firebase deploy --only hosting

# Deploy all
firebase deploy
```

### Firebase Storage Structure
```
storage/
├── evidence/
│   └── {userId}/
│       └── {taskId}/
│           └── {timestamp}_{filename}
├── profiles/
│   └── {userId}/
│       └── {filename}
└── public/
    └── {assets}
```

## Testing Strategy

### Unit Tests (Jest + React Testing Library)
- **Components**: 39 tests covering UI components and interactions
- **Services**: 18 tests for API calls and Firebase integration
- **Hooks**: 8 tests for custom React hooks
- **Coverage**: 100% core functionality coverage
- **Mocks**: Firebase services mocked in `setupTests.ts`

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
- **Backend**: Node.js 18, Express, Firebase Admin SDK
- **Database**: Firestore with security rules
- **Authentication**: Firebase Auth with custom claims
- **Storage**: Firebase Storage with 10MB file limit
- **Testing**: Jest, React Testing Library, Cypress

### Architecture Patterns
- **Role-based access**: Student/parent hierarchy with security rules
- **Real-time sync**: Firestore listeners for live updates
- **Type safety**: Shared TypeScript interfaces between frontend/backend
- **Component testing**: Comprehensive test coverage with mocks
- **Evidence workflow**: File upload with validation and approval process

### Security Features
- **Firestore rules**: User-specific data access control
- **Storage rules**: File type/size restrictions, user-specific folders
- **Authentication**: Firebase Auth with role-based permissions
- **Input validation**: Express-validator middleware
- **Rate limiting**: Express rate limiting for API endpoints