# Deployment Troubleshooting Guide

This guide helps resolve common issues during deployment to Alibaba Cloud server 47.120.74.212.

## SSH Connection Issues

### Problem: SSH Connection Timeout
```bash
Connection timed out during banner exchange
Connection to 47.120.74.212 port 22 timed out
```

**Solutions:**
1. **Check Firewall Rules:**
   ```bash
   # On server, check if SSH port is open
   ufw status
   # If needed, allow SSH
   ufw allow 22/tcp
   ```

2. **Verify SSH Service:**
   ```bash
   # Check if SSH service is running
   systemctl status sshd
   # Restart SSH service if needed
   systemctl restart sshd
   ```

3. **Alternative Connection Methods:**
   ```bash
   # Try with different SSH options
   ssh -o ConnectTimeout=60 -o ServerAliveInterval=30 root@47.120.74.212
   
   # Use verbose mode for debugging
   ssh -v root@47.120.74.212
   ```

4. **Alibaba Cloud Console Access:**
   - Use Alibaba Cloud ECS console for direct access
   - Check security group rules to ensure SSH (port 22) is allowed
   - Verify ECS instance is running and accessible

### Problem: SSH Key Authentication Failed
```bash
Permission denied (publickey)
```

**Solutions:**
1. **Verify SSH Key:**
   ```bash
   # Check if SSH key exists
   ls -la ~/.ssh/
   
   # Generate new key if needed
   ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519
   ```

2. **Add Key to Server:**
   ```bash
   # Copy public key to server (using Alibaba Cloud console)
   cat ~/.ssh/id_ed25519.pub
   # Then add to /root/.ssh/authorized_keys on server
   ```

3. **Fix Permissions:**
   ```bash
   # On server
   chmod 700 ~/.ssh
   chmod 600 ~/.ssh/authorized_keys
   chown -R root:root ~/.ssh
   ```

## Deployment Script Issues

### Problem: Permission Denied When Running Scripts
```bash
bash: ./aliyun-deploy.sh: Permission denied
```

**Solution:**
```bash
# Make scripts executable
chmod +x aliyun-deploy.sh
chmod +x pre-deploy-verify.sh
chmod +x post-deploy-test.sh

# Or run with bash
bash aliyun-deploy.sh
```

### Problem: Project Directory Not Found
```bash
Project directory /root/projects/SummerVacationPlanning does not exist
```

**Solutions:**
1. **Clone Repository:**
   ```bash
   # Create projects directory
   mkdir -p /root/projects
   cd /root/projects
   
   # Clone the repository
   git clone <repository-url> SummerVacationPlanning
   ```

2. **Verify Git Configuration:**
   ```bash
   # Check git status
   cd /root/projects/SummerVacationPlanning
   git status
   git remote -v
   ```

## Node.js and npm Issues

### Problem: Node.js Version Too Old
```bash
Node.js version must be 16.0.0 or higher
```

**Solution:**
```bash
# Remove old Node.js
apt-get remove --purge nodejs npm

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### Problem: npm Install Fails
```bash
npm ERR! network request to https://registry.npmjs.org failed
```

**Solutions:**
1. **Network Issues:**
   ```bash
   # Check internet connectivity
   curl -I https://registry.npmjs.org
   
   # Try with different registry
   npm config set registry https://registry.npmmirror.com/
   ```

2. **Clear npm Cache:**
   ```bash
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

## MongoDB Issues

### Problem: MongoDB Failed to Start
```bash
Failed to start mongod.service
```

**Solutions:**
1. **Check MongoDB Logs:**
   ```bash
   journalctl -u mongod -f
   tail -f /var/log/mongodb/mongod.log
   ```

2. **Fix MongoDB Configuration:**
   ```bash
   # Check MongoDB configuration
   cat /etc/mongod.conf
   
   # Ensure data directory exists
   mkdir -p /var/lib/mongodb
   chown mongodb:mongodb /var/lib/mongodb
   ```

3. **Restart MongoDB:**
   ```bash
   systemctl stop mongod
   systemctl start mongod
   systemctl enable mongod
   ```

### Problem: Database Connection Failed
```bash
MongoServerError: connect ECONNREFUSED 127.0.0.1:27017
```

**Solutions:**
1. **Check MongoDB Status:**
   ```bash
   systemctl status mongod
   netstat -tlnp | grep 27017
   ```

2. **Update Connection String:**
   ```bash
   # In backend/.env
   MONGODB_URI=mongodb://localhost:27017/summer_vacation_planning
   ```

## Nginx Issues

### Problem: Nginx Failed to Start
```bash
nginx: [emerg] bind() to 0.0.0.0:80 failed (98: Address already in use)
```

**Solutions:**
1. **Check Port Usage:**
   ```bash
   netstat -tlnp | grep :80
   lsof -i :80
   ```

2. **Stop Conflicting Services:**
   ```bash
   # If Apache is running
   systemctl stop apache2
   systemctl disable apache2
   
   # Start Nginx
   systemctl start nginx
   ```

### Problem: Nginx Configuration Error
```bash
nginx: [emerg] unexpected "}" in /etc/nginx/sites-available/summer-vacation-planning
```

**Solution:**
```bash
# Test configuration
nginx -t

# Check syntax
nano /etc/nginx/sites-available/summer-vacation-planning

# Common issues: missing semicolons, unmatched braces
```

## PM2 Issues

### Problem: PM2 Process Failed to Start
```bash
PM2 error: script not found
```

**Solutions:**
1. **Check Script Path:**
   ```bash
   # Verify backend build exists
   ls -la /root/projects/SummerVacationPlanning/backend/dist/
   
   # Check ecosystem.config.js
   cat ecosystem.config.js
   ```

2. **Manual PM2 Start:**
   ```bash
   cd /root/projects/SummerVacationPlanning/backend
   pm2 start dist/server.js --name summer-vacation-backend
   ```

### Problem: Application Crashes
```bash
PM2 process status: errored
```

**Solutions:**
1. **Check Logs:**
   ```bash
   pm2 logs summer-vacation-backend
   pm2 describe summer-vacation-backend
   ```

2. **Environment Variables:**
   ```bash
   # Check if .env file exists
   ls -la /root/projects/SummerVacationPlanning/backend/.env
   
   # Verify environment variables
   pm2 env 0
   ```

## Build Issues

### Problem: Frontend Build Failed
```bash
npm ERR! Build failed with errors
```

**Solutions:**
1. **Check Build Logs:**
   ```bash
   cd frontend
   npm run build 2>&1 | tee build.log
   ```

2. **Memory Issues:**
   ```bash
   # Increase Node.js memory
   export NODE_OPTIONS="--max-old-space-size=4096"
   npm run build
   ```

3. **TypeScript Errors:**
   ```bash
   # Check TypeScript configuration
   npx tsc --noEmit
   
   # Fix type errors in source files
   ```

### Problem: Backend Build Failed
```bash
TypeScript compilation failed
```

**Solutions:**
1. **Check TypeScript Configuration:**
   ```bash
   cd backend
   cat tsconfig.json
   npx tsc --noEmit
   ```

2. **Install Type Dependencies:**
   ```bash
   npm install --save-dev @types/node @types/express
   ```

## Network and Firewall Issues

### Problem: API Requests Fail from Frontend
```bash
ERR_CONNECTION_REFUSED
```

**Solutions:**
1. **Check Firewall Rules:**
   ```bash
   ufw status verbose
   
   # Allow necessary ports
   ufw allow 80/tcp
   ufw allow 5000/tcp
   ```

2. **Verify Service Ports:**
   ```bash
   netstat -tlnp | grep -E ':(80|5000|27017)'
   ```

3. **CORS Configuration:**
   ```bash
   # Check backend CORS settings
   grep -r "cors" backend/src/
   ```

## File Upload Issues

### Problem: File Upload Failed
```bash
413 Request Entity Too Large
```

**Solutions:**
1. **Nginx Configuration:**
   ```bash
   # Add to nginx config
   client_max_body_size 50M;
   ```

2. **Backend Configuration:**
   ```bash
   # Check upload limits in backend
   grep -r "upload" backend/src/
   ```

## Performance Issues

### Problem: Slow Response Times
**Solutions:**
1. **Enable Gzip Compression:**
   ```bash
   # Add to nginx config
   gzip on;
   gzip_types text/plain application/json application/javascript text/css;
   ```

2. **PM2 Cluster Mode:**
   ```bash
   # Update ecosystem.config.js
   instances: 'max',
   exec_mode: 'cluster'
   ```

3. **Database Optimization:**
   ```bash
   cd backend
   node scripts/create-indexes.js
   ```

## Monitoring and Debugging

### Essential Commands
```bash
# System status
systemctl status nginx mongod
pm2 status

# View logs
journalctl -u nginx -f
journalctl -u mongod -f
pm2 logs

# Resource usage
htop
df -h
free -h

# Network testing
curl -I http://47.120.74.212
curl http://47.120.74.212/api/health

# Process monitoring
netstat -tlnp
lsof -i :80
lsof -i :5000
```

### Log Locations
- Nginx: `/var/log/nginx/`
- MongoDB: `/var/log/mongodb/mongod.log`
- PM2: `~/.pm2/logs/`
- Application: `/root/projects/SummerVacationPlanning/logs/`

## Emergency Recovery

### Quick Recovery Steps
1. **Restart All Services:**
   ```bash
   systemctl restart nginx mongod
   pm2 restart all
   ```

2. **Reset to Known Good State:**
   ```bash
   cd /root/projects/SummerVacationPlanning
   git reset --hard HEAD
   git pull origin master
   ```

3. **Full Redeployment:**
   ```bash
   ./pre-deploy-verify.sh
   ./aliyun-deploy.sh
   ./post-deploy-test.sh
   ```

## Getting Help

### Collect Diagnostic Information
```bash
# Create diagnostic report
bash << 'EOF'
echo "=== System Information ===" > diagnostic.txt
uname -a >> diagnostic.txt
lsb_release -a >> diagnostic.txt

echo -e "\n=== Service Status ===" >> diagnostic.txt
systemctl status nginx mongod >> diagnostic.txt

echo -e "\n=== PM2 Status ===" >> diagnostic.txt
pm2 list >> diagnostic.txt

echo -e "\n=== Network ===" >> diagnostic.txt
netstat -tlnp >> diagnostic.txt

echo -e "\n=== Disk Space ===" >> diagnostic.txt
df -h >> diagnostic.txt

echo -e "\n=== Memory ===" >> diagnostic.txt
free -h >> diagnostic.txt

echo -e "\n=== Recent Logs ===" >> diagnostic.txt
tail -50 /var/log/nginx/error.log >> diagnostic.txt 2>/dev/null
tail -50 /var/log/mongodb/mongod.log >> diagnostic.txt 2>/dev/null

echo "Diagnostic report saved to diagnostic.txt"
EOF
```

This diagnostic information will help identify issues quickly and provide context for troubleshooting.