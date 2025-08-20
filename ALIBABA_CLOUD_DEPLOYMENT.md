# Alibaba Cloud Deployment Guide

Complete deployment guide for SummerVacationPlanning application on Alibaba Cloud ECS server 47.120.74.212.

## Overview

This deployment setup includes:
- **Frontend**: React application served by Nginx
- **Backend**: Node.js/Express API managed by PM2
- **Database**: MongoDB with optimized indexes
- **File Storage**: Local file system with Nginx serving uploads
- **Process Management**: PM2 with cluster mode
- **Reverse Proxy**: Nginx with security headers and CORS

## Prerequisites

1. **Alibaba Cloud ECS Instance**
   - Server IP: 47.120.74.212
   - OS: Ubuntu 20.04 LTS or later
   - Minimum: 2 CPU cores, 4GB RAM, 20GB storage
   - Root access required

2. **Local Development Environment**
   - SSH access to the server
   - Git repository with latest code
   - SSH keys configured

## Quick Deployment

If SSH access is working, run the automated deployment:

```bash
# 1. SSH into the server
ssh root@47.120.74.212

# 2. Clone repository (if not exists)
mkdir -p /root/projects
cd /root/projects
git clone <repository-url> SummerVacationPlanning
cd SummerVacationPlanning

# 3. Run pre-deployment verification
chmod +x pre-deploy-verify.sh
./pre-deploy-verify.sh

# 4. Run deployment
chmod +x aliyun-deploy.sh
./aliyun-deploy.sh

# 5. Run post-deployment tests
chmod +x post-deploy-test.sh
./post-deploy-test.sh
```

## Step-by-Step Manual Deployment

### 1. Server Preparation

```bash
# Update system packages
apt-get update && apt-get upgrade -y

# Install basic dependencies
apt-get install -y curl wget unzip git build-essential

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Verify Node.js installation
node --version  # Should be v18.x.x
npm --version
```

### 2. Install MongoDB

```bash
# Import MongoDB public GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Update package database and install MongoDB
apt-get update
apt-get install -y mongodb-org

# Start and enable MongoDB
systemctl start mongod
systemctl enable mongod

# Verify MongoDB installation
systemctl status mongod
```

### 3. Install Nginx and PM2

```bash
# Install Nginx
apt-get install -y nginx

# Install PM2 globally
npm install -g pm2

# Start and enable Nginx
systemctl start nginx
systemctl enable nginx
```

### 4. Setup Project Directory

```bash
# Create project directory
mkdir -p /root/projects
cd /root/projects

# Clone repository (replace with actual repository URL)
git clone <repository-url> SummerVacationPlanning
cd SummerVacationPlanning

# Verify project structure
ls -la
```

### 5. Pull Latest Code and Install Dependencies

```bash
# Pull latest code
git pull origin master

# Install backend dependencies
cd backend
npm ci --production=false

# Install frontend dependencies
cd ../frontend
npm ci --production=false

cd ..
```

### 6. Configure Environment Variables

```bash
# Backend environment variables
cat > backend/.env << 'EOF'
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/summer_vacation_planning
JWT_SECRET=your-super-secure-jwt-secret-change-this-in-production
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://47.120.74.212
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=image/jpeg,image/jpg,image/png,image/gif,video/mp4,audio/mp3,text/plain
EOF

# Frontend environment variables
cat > frontend/.env.production << 'EOF'
REACT_APP_API_URL=http://47.120.74.212/api
REACT_APP_UPLOAD_URL=http://47.120.74.212/uploads
REACT_APP_MAX_FILE_SIZE=10485760
EOF
```

### 7. Build Applications

```bash
# Build backend
cd backend
npm run build

# Build frontend
cd ../frontend
npm run build

cd ..
```

### 8. Configure MongoDB Indexes

```bash
cd backend

# Create database indexes (if script exists)
if [ -f "scripts/create-indexes.js" ]; then
    node scripts/create-indexes.js
fi

cd ..
```

### 9. Configure Nginx

```bash
# Create Nginx site configuration
cat > /etc/nginx/sites-available/summer-vacation-planning << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name 47.120.74.212;

    # Frontend static files
    location / {
        root /root/projects/SummerVacationPlanning/frontend/build;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
        
        # Caching for static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            add_header X-Content-Type-Options nosniff;
        }
        
        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Referrer-Policy strict-origin-when-cross-origin;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # CORS headers
        add_header Access-Control-Allow-Origin "http://47.120.74.212" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type, Accept" always;
        
        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "http://47.120.74.212";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Authorization, Content-Type, Accept";
            add_header Access-Control-Max-Age 1728000;
            add_header Content-Type "text/plain charset=UTF-8";
            add_header Content-Length 0;
            return 204;
        }
    }

    # File upload endpoint
    location /uploads/ {
        proxy_pass http://localhost:5000/uploads/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # Increase upload size limit
        client_max_body_size 50M;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/x-javascript
        application/xml+rss
        application/javascript
        application/json;
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/summer-vacation-planning /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and restart Nginx
nginx -t
systemctl restart nginx
```

### 10. Setup Directories and Permissions

```bash
# Create necessary directories
mkdir -p /root/projects/SummerVacationPlanning/logs
mkdir -p /root/projects/SummerVacationPlanning/uploads/evidence
mkdir -p /root/projects/SummerVacationPlanning/uploads/profiles

# Set proper permissions
chown -R root:root /root/projects/SummerVacationPlanning
find /root/projects/SummerVacationPlanning -type d -exec chmod 755 {} \;
find /root/projects/SummerVacationPlanning -type f -exec chmod 644 {} \;
chmod +x /root/projects/SummerVacationPlanning/*.sh
chmod -R 755 /root/projects/SummerVacationPlanning/uploads
chmod -R 755 /root/projects/SummerVacationPlanning/logs
```

### 11. Deploy Backend with PM2

```bash
# Navigate to project root
cd /root/projects/SummerVacationPlanning

# Stop any existing PM2 processes
pm2 stop summer-vacation-backend 2>/dev/null || true
pm2 delete summer-vacation-backend 2>/dev/null || true

# Start application with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
```

### 12. Configure Firewall

```bash
# Install and configure UFW
apt-get install -y ufw

# Reset firewall rules
ufw --force reset

# Set default policies
ufw default deny incoming
ufw default allow outgoing

# Allow SSH, HTTP, and HTTPS
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp

# Allow MongoDB locally only
ufw allow from 127.0.0.1 to any port 27017

# Enable firewall
ufw --force enable

# Check status
ufw status verbose
```

## Post-Deployment Verification

### 1. Service Status Check

```bash
# Check all services
systemctl status nginx
systemctl status mongod
pm2 status

# Check process ports
netstat -tlnp | grep -E ':(80|5000|27017)'
```

### 2. Application Testing

```bash
# Test frontend
curl -I http://47.120.74.212

# Test backend API
curl http://47.120.74.212/api/health

# Test MongoDB connection
mongosh --eval "db.adminCommand('ping')"

# Test PM2 processes
pm2 list
pm2 logs summer-vacation-backend --lines 20
```

### 3. Performance Testing

```bash
# Test response times
time curl -s http://47.120.74.212 > /dev/null
time curl -s http://47.120.74.212/api/health > /dev/null

# Check resource usage
htop
df -h
free -h
```

## Monitoring and Maintenance

### Log Locations

- **Nginx Logs**: `/var/log/nginx/access.log`, `/var/log/nginx/error.log`
- **MongoDB Logs**: `/var/log/mongodb/mongod.log`
- **PM2 Logs**: `~/.pm2/logs/`
- **Application Logs**: `/root/projects/SummerVacationPlanning/logs/`

### Essential Commands

```bash
# View real-time logs
tail -f /var/log/nginx/access.log
tail -f /var/log/mongodb/mongod.log
pm2 logs summer-vacation-backend

# Restart services
systemctl restart nginx
systemctl restart mongod
pm2 restart summer-vacation-backend

# Update application
cd /root/projects/SummerVacationPlanning
git pull origin master
npm run build
pm2 restart all
```

### Backup Procedures

```bash
# MongoDB backup
mongodump --db summer_vacation_planning --out /root/backups/$(date +%Y%m%d_%H%M%S)

# Application backup
tar -czf /root/backups/app_backup_$(date +%Y%m%d_%H%M%S).tar.gz \
    /root/projects/SummerVacationPlanning \
    --exclude=node_modules \
    --exclude=.git
```

## Security Considerations

### HTTPS Setup (Recommended)

```bash
# Install Certbot
apt-get install -y certbot python3-certbot-nginx

# Obtain SSL certificate
certbot --nginx -d your-domain.com

# Auto-renewal
crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Additional Security Measures

1. **Regular Updates**:
   ```bash
   apt-get update && apt-get upgrade -y
   npm update -g pm2
   ```

2. **Monitor Failed Login Attempts**:
   ```bash
   # Install fail2ban
   apt-get install -y fail2ban
   ```

3. **Database Security**:
   ```bash
   # Enable MongoDB authentication if needed
   # Configure in /etc/mongod.conf
   ```

## Troubleshooting

For common issues and solutions, see [DEPLOYMENT_TROUBLESHOOTING.md](./DEPLOYMENT_TROUBLESHOOTING.md).

### Quick Health Check

```bash
# Run the automated post-deployment test
./post-deploy-test.sh
```

### Emergency Recovery

```bash
# Quick restart all services
systemctl restart nginx mongod
pm2 restart all

# Full redeployment
./aliyun-deploy.sh
```

## Support

If you encounter issues during deployment:

1. Check the troubleshooting guide
2. Review service logs
3. Run the diagnostic script from the troubleshooting guide
4. Contact system administrator with diagnostic information

## Application URLs

After successful deployment:

- **Frontend**: http://47.120.74.212
- **Backend API**: http://47.120.74.212/api
- **Health Check**: http://47.120.74.212/api/health

## Next Steps

1. **Domain Setup**: Configure DNS to point to 47.120.74.212
2. **SSL Certificate**: Set up HTTPS with Let's Encrypt
3. **Monitoring**: Implement application performance monitoring
4. **Backups**: Set up automated backup procedures
5. **CDN**: Consider using Alibaba Cloud CDN for static assets