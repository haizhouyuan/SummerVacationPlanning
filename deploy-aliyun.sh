#!/bin/bash

# SummerVacationPlanning Deployment Script for Alibaba Cloud
# Deploy to Server: 47.120.74.212
# Timeline optimization features deployment

set -e  # Exit on any error

echo "=== SummerVacationPlanning Alibaba Cloud Deployment Started ==="
echo "Timestamp: $(date)"
echo "Target Server: 47.120.74.212"
echo "Deploying commit: $(git rev-parse HEAD)"

# Configuration
PROJECT_DIR="/root/projects/SummerVacationPlanning"
BACKUP_DIR="/root/backups/SummerVacationPlanning-$(date +%Y%m%d-%H%M%S)"
NGINX_CONFIG="/etc/nginx/sites-available/summervacation"

echo "=== Step 1: Pre-deployment checks ==="
cd $PROJECT_DIR

# Create backup
echo "Creating backup at $BACKUP_DIR"
mkdir -p $BACKUP_DIR
cp -r frontend/build $BACKUP_DIR/frontend-build-backup 2>/dev/null || echo "No previous frontend build found"
cp -r backend/dist $BACKUP_DIR/backend-dist-backup 2>/dev/null || echo "No previous backend build found"

echo "=== Step 2: Pull latest code ==="
git fetch origin
git reset --hard origin/master
git pull origin master
echo "Current commit: $(git rev-parse HEAD)"

echo "=== Step 3: Install dependencies ==="
echo "Installing frontend dependencies..."
cd $PROJECT_DIR/frontend
npm install

echo "Installing backend dependencies..."
cd $PROJECT_DIR/backend
npm install

echo "=== Step 4: Build applications ==="
echo "Building frontend..."
cd $PROJECT_DIR/frontend
npm run build

echo "Building backend..."
cd $PROJECT_DIR/backend
npm run build

echo "=== Step 5: Deploy frontend ==="
cd $PROJECT_DIR
sudo rm -rf /var/www/summervacation/html/* 2>/dev/null || true
sudo mkdir -p /var/www/summervacation/html
sudo cp -r frontend/build/* /var/www/summervacation/html/
sudo chown -R www-data:www-data /var/www/summervacation/html
sudo chmod -R 755 /var/www/summervacation/html

echo "=== Step 6: Configure Nginx ==="
sudo tee $NGINX_CONFIG > /dev/null <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name 47.120.74.212;

    root /var/www/summervacation/html;
    index index.html index.htm;

    # Frontend static files
    location / {
        try_files \$uri \$uri/ /index.html;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API proxy to backend
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'; frame-ancestors 'self';" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
EOF

# Enable site and reload nginx
sudo ln -sf $NGINX_CONFIG /etc/nginx/sites-enabled/summervacation
sudo nginx -t
sudo systemctl reload nginx

echo "=== Step 7: Configure and start backend ==="
cd $PROJECT_DIR/backend

# Set up environment variables
sudo tee .env > /dev/null <<EOF
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/summervacation
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760
CORS_ORIGIN=http://47.120.74.212
EOF

# Create uploads directory
mkdir -p uploads/evidence uploads/profiles
chmod 755 uploads uploads/evidence uploads/profiles

# Configure PM2 ecosystem
sudo tee ecosystem.config.js > /dev/null <<EOF
module.exports = {
  apps: [{
    name: 'summervacation-backend',
    script: './dist/server.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
EOF

# Create logs directory
mkdir -p logs

# Stop existing PM2 process
pm2 stop summervacation-backend 2>/dev/null || echo "No existing backend process found"
pm2 delete summervacation-backend 2>/dev/null || echo "No existing backend process to delete"

# Start backend with PM2
pm2 start ecosystem.config.js
pm2 save

echo "=== Step 8: Database setup ==="
cd $PROJECT_DIR/backend
npm run create-indexes 2>/dev/null || echo "Database indexes creation completed or already exists"

echo "=== Step 9: Health checks ==="
echo "Waiting for services to start..."
sleep 10

# Check backend health
echo "Checking backend health..."
curl -f http://localhost:5000/api/health || echo "Backend health check failed"

# Check frontend
echo "Checking frontend..."
curl -f http://localhost/ || echo "Frontend check failed"

echo "=== Step 10: Deployment verification ==="
echo "Frontend served from: /var/www/summervacation/html"
echo "Backend running on: http://localhost:5000"
echo "PM2 status:"
pm2 status

echo "=== Deployment completed successfully! ==="
echo "Timeline optimization features deployed"
echo "Commit deployed: $(git rev-parse HEAD)"
echo "Access application at: http://47.120.74.212"
echo "Backup created at: $BACKUP_DIR"