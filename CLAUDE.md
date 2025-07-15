# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a summer vacation planning application with a cartoon-style UI and gamification features. The app allows students to plan activities, track completion, and earn points that can be redeemed for rewards. Parents can monitor progress and manage their children's activities.

## Development Commands

### Frontend (React + TypeScript + Tailwind CSS)
```bash
cd frontend
npm start          # Start development server
npm run build      # Build for production
npm test          # Run tests
```

### Backend (Node.js + Express + TypeScript)
```bash
cd backend
npm run dev       # Start development server with nodemon
npm run build     # Build TypeScript to JavaScript
npm start         # Start production server
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
- **Pages**: Main application pages (Login, Dashboard, Tasks, Records)
- **Services**: API communication and Firebase integration
- **Config**: Firebase configuration and environment setup
- **Types**: TypeScript interfaces and type definitions

### Backend Structure (`backend/src/`)
- **Controllers**: Handle HTTP requests and responses
- **Middleware**: Authentication, validation, and error handling
- **Models**: Data models and business logic
- **Routes**: API endpoint definitions
- **Services**: Business logic and external service integration
- **Config**: Firebase Admin SDK and database configuration

### Key Components

- **Authentication System**: Firebase Auth with student/parent roles
- **Task Management**: CRUD operations for tasks and daily planning
- **Points System**: Gamification with earning and redemption mechanics
- **Media Upload**: File upload for task completion evidence
- **Real-time Updates**: Firestore for live data synchronization

## Database Schema (Firestore)

### Collections
- `users`: User profiles with roles (student/parent)
- `tasks`: Task templates with categories and point values
- `dailyTasks`: Daily task instances with completion status
- `redemptions`: Point redemption requests and approvals

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

## Development Notes

- Frontend uses Tailwind CSS v4 with custom Duolingo-inspired color scheme
- Backend uses Firebase Admin SDK for authentication and Firestore operations
- TypeScript is used throughout for type safety
- Environment variables are required for Firebase configuration
- The app supports role-based access (student/parent)
- Media uploads are stored in Firebase Storage with 10MB limit
- Real-time updates are handled through Firestore listeners
- Security rules enforce user-specific access and file type restrictions