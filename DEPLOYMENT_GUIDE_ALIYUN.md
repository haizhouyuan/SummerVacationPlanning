# Alibaba Cloud Deployment Guide

## Overview
This guide covers the deployment of the SummerVacationPlanning project with timeline optimization features to Alibaba Cloud server (47.120.74.212).

## Deployment Status
- **Target Server**: 47.120.74.212
- **Latest Commit**: 06b62284 (Timeline optimization features)
- **Build Status**: ✅ Frontend and Backend builds completed successfully
- **Features Deployed**: 
  - 任务规划时间轴移动端优化
  - 移动端响应式设计优化
  - 时间轴功能完整移动端适配
  - TaskPlanning页面视图切换功能

## Pre-deployment Verification
✅ Server connectivity confirmed via ping
✅ Project located at `/root/projects/SummerVacationPlanning`
✅ Latest master branch with commit 06b62284
✅ Frontend dependencies installed
✅ Backend dependencies installed
✅ Production builds created successfully

## Manual Deployment Steps

Since automated SSH deployment encountered connectivity issues, follow these manual steps on the server:

### 1. Server Connection
```bash
ssh root@47.120.74.212
```

### 2. Navigate to Project Directory
```bash
cd /root/projects/SummerVacationPlanning
```

### 3. Execute Deployment Script
```bash
chmod +x deploy-aliyun.sh
./deploy-aliyun.sh
```

### 4. Alternative Manual Steps
If the script needs manual execution:

#### Pull Latest Code
```bash
git fetch origin
git reset --hard origin/master  
git pull origin master
```

#### Install Dependencies
```bash
# Frontend
cd frontend && npm install && cd ..

# Backend  
cd backend && npm install && cd ..
```

#### Build Applications
```bash
# Frontend
cd frontend && npm run build && cd ..

# Backend
cd backend && npm run build && cd ..
```

#### Deploy Frontend (Static Files)
```bash
sudo rm -rf /var/www/summervacation/html/*
sudo mkdir -p /var/www/summervacation/html
sudo cp -r frontend/build/* /var/www/summervacation/html/
sudo chown -R www-data:www-data /var/www/summervacation/html
sudo chmod -R 755 /var/www/summervacation/html
```

#### Configure Backend with PM2
```bash
cd backend

# Stop existing process
pm2 stop summervacation-backend || true
pm2 delete summervacation-backend || true

# Start new process
pm2 start ecosystem.config.js
pm2 save
```

## Architecture Overview

### Frontend Deployment
- **Location**: `/var/www/summervacation/html/`
- **Server**: Nginx static file serving
- **Build Output**: React production build with timeline features

### Backend Deployment  
- **Port**: 5000
- **Process Manager**: PM2
- **Location**: `/root/projects/SummerVacationPlanning/backend/dist/`
- **Database**: MongoDB (local instance)

### Timeline Optimization Features
The deployment includes these key timeline features:
1. **Enhanced Task Planning**: Timeline view for task scheduling
2. **Mobile Responsive Design**: One-screen dashboard experience
3. **View Toggle**: Switch between schedule and task selection views
4. **Compact Header**: Optimized mobile navigation
5. **Timeline Component**: Interactive task timeline visualization

## Configuration Files

### Nginx Configuration
Located at `/etc/nginx/sites-available/summervacation`:
- Serves static React build
- Proxies `/api/` requests to backend port 5000
- Includes security headers and gzip compression

### PM2 Ecosystem Configuration
Backend process management with:
- Auto-restart on crashes
- Memory limit: 1GB
- Log rotation
- Production environment variables

### Environment Variables
Backend `.env` configuration:
```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/summervacation
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760
CORS_ORIGIN=http://47.120.74.212
```

## Verification Steps

### Health Checks
1. **Backend Health**: `curl http://localhost:5000/api/health`
2. **Frontend Access**: `curl http://localhost/`
3. **PM2 Status**: `pm2 status`
4. **Nginx Status**: `systemctl status nginx`

### Timeline Features Verification
Access the application at `http://47.120.74.212` and verify:
1. Task Planning page loads with timeline view
2. Mobile responsive design works correctly
3. View toggle functionality works
4. Timeline component displays properly
5. Task scheduling features are operational

## Troubleshooting

### Common Issues
1. **Permission Issues**: Ensure correct file permissions for web directory
2. **PM2 Process**: Check PM2 logs if backend doesn't start
3. **Database**: Verify MongoDB is running and accessible
4. **Nginx**: Test configuration with `nginx -t`

### Logs Location
- **Backend Logs**: `/root/projects/SummerVacationPlanning/backend/logs/`
- **PM2 Logs**: `pm2 logs summervacation-backend`
- **Nginx Logs**: `/var/log/nginx/`

## Rollback Procedure
If deployment fails:
1. Restore from backup directory (created during deployment)
2. Restart previous PM2 process
3. Restore previous frontend build

## Security Considerations
- CORS configured for server IP
- Security headers implemented in Nginx
- File upload restrictions enforced
- JWT authentication configured
- Environment variables secured

## Performance Optimizations
- Frontend build minified and optimized
- Gzip compression enabled
- Static file caching configured
- PM2 memory limits set
- Database indexes created

## Post-Deployment Tasks
1. Monitor application performance
2. Check error logs
3. Verify all timeline features work correctly
4. Test user authentication flow
5. Validate task creation and completion
6. Confirm mobile responsive design

---

**Deployment Date**: $(date)
**Deployed By**: DevOps Automation Engineer
**Status**: Ready for Manual Execution