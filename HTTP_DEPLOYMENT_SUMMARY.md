# HTTP-Only Deployment Summary

## 📋 Overview
HTTP-only deployment configuration for Summer Vacation Planning app on server **47.120.74.212**.

## 🛠 Files Created

1. **`setup-http-only.sh`** - Main deployment script
2. **`nginx-svp-config.conf`** - Nginx configuration file
3. **`verify-deployment.sh`** - Verification script
4. **`deploy-http-only.sh`** - Alternative deployment script

## 🚀 Quick Deployment

### Option 1: Automated Setup
```bash
# Make script executable
chmod +x setup-http-only.sh

# Run the setup
sudo ./setup-http-only.sh
```

### Option 2: Manual Steps
```bash
# 1. Install Nginx
sudo apt update && sudo apt install -y nginx

# 2. Setup frontend
sudo mkdir -p /var/www/svp/dist
sudo cp -r ./frontend/build/* /var/www/svp/dist/
sudo chown -R www-data:www-data /var/www/svp/
sudo chmod -R 755 /var/www/svp/

# 3. Configure Nginx
sudo cp nginx-svp-config.conf /etc/nginx/sites-available/svp-ip.conf
sudo ln -sf /etc/nginx/sites-available/svp-ip.conf /etc/nginx/sites-enabled/svp-ip.conf
sudo rm -f /etc/nginx/sites-enabled/default

# 4. Test and reload
sudo nginx -t
sudo systemctl reload nginx

# 5. Open firewall
sudo ufw allow 80/tcp
```

## 🔧 Configuration Details

### Nginx Setup
- **Frontend**: Static files served from `/var/www/svp/dist`
- **API Proxy**: `/api/*` → `http://127.0.0.1:5000`
- **Health Check**: `/health` → `http://127.0.0.1:5000/health`
- **CORS**: Enabled for cross-origin requests
- **File Upload**: Max 50MB

### Backend Requirements
- Must run on `127.0.0.1:5000`
- Health endpoint at `/health`
- API endpoints prefixed with `/api`

## 🌐 Access URLs
- **Frontend**: `http://47.120.74.212/`
- **API**: `http://47.120.74.212/api/`
- **Health**: `http://47.120.74.212/health`

## ✅ Verification

### After Deployment
```bash
# Test frontend
curl -I http://47.120.74.212/

# Test health check
curl http://47.120.74.212/health

# Test API (should return 404/405)
curl -I http://47.120.74.212/api/

# Run verification script
chmod +x verify-deployment.sh
./verify-deployment.sh
```

### Backend Startup
```bash
cd backend
npm run dev
```

## 🔍 Troubleshooting

### Common Issues
1. **502 Bad Gateway**: Backend not running on port 5000
2. **Permission Denied**: Check file permissions on `/var/www/svp/`
3. **CORS Errors**: Verify Nginx CORS headers are working
4. **404 on SPA Routes**: Ensure `try_files` directive is correct

### Log Files
```bash
# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Nginx access logs  
sudo tail -f /var/log/nginx/access.log

# Check Nginx config
sudo nginx -t
```

## 🔒 Security Notes
- HTTP only (no HTTPS/SSL)
- CORS set to "*" (adjust for production)
- No authentication on Nginx level
- File upload limit: 50MB

## ⚠️ Important Reminders
1. Backend must be running on port 5000
2. Frontend build must exist in `./frontend/build/`
3. Cloud provider security groups must allow port 80
4. SELinux may need configuration on CentOS/RHEL