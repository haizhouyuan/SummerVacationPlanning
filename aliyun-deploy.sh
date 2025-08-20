#!/bin/bash

# Alibaba Cloud Server Deployment Script for SummerVacationPlanning
# Target Server: 47.120.74.212
# Project Directory: /root/projects/SummerVacationPlanning

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/root/projects/SummerVacationPlanning"
FRONTEND_DIR="$PROJECT_DIR/frontend"
BACKEND_DIR="$PROJECT_DIR/backend"
NGINX_SITES_DIR="/etc/nginx/sites-available"
NGINX_ENABLED_DIR="/etc/nginx/sites-enabled"
LOG_DIR="$PROJECT_DIR/logs"
UPLOAD_DIR="$PROJECT_DIR/uploads"

# Function to print colored output
print_step() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check if script is run as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "This script must be run as root"
        exit 1
    fi
}

# Pre-deployment checks
pre_deployment_checks() {
    print_info "Running pre-deployment checks..."
    
    # Check if project directory exists
    if [ ! -d "$PROJECT_DIR" ]; then
        print_error "Project directory $PROJECT_DIR does not exist"
        exit 1
    fi
    
    # Check if required commands are available
    local required_commands=("node" "npm" "nginx" "mongod" "pm2")
    for cmd in "${required_commands[@]}"; do
        if ! command -v $cmd &> /dev/null; then
            print_error "$cmd is not installed"
            exit 1
        fi
    done
    
    # Check Node.js version
    local node_version=$(node --version | cut -d'v' -f2)
    if [[ $(echo "$node_version 16.0.0" | tr " " "\n" | sort -V | head -n 1) != "16.0.0" ]]; then
        print_error "Node.js version must be 16.0.0 or higher (current: $node_version)"
        exit 1
    fi
    
    print_step "Pre-deployment checks completed"
}

# Pull latest code from repository
sync_latest_code() {
    print_info "Syncing latest code from repository..."
    
    cd "$PROJECT_DIR"
    
    # Check if it's a git repository
    if [ ! -d ".git" ]; then
        print_error "Project directory is not a git repository"
        exit 1
    fi
    
    # Stash any local changes
    git stash push -m "Pre-deployment stash $(date)"
    
    # Pull latest code
    git pull origin master
    
    print_step "Latest code synced successfully"
}

# Install dependencies
install_dependencies() {
    print_info "Installing dependencies..."
    
    # Create necessary directories
    mkdir -p "$LOG_DIR" "$UPLOAD_DIR/evidence" "$UPLOAD_DIR/profiles"
    
    # Install backend dependencies
    print_info "Installing backend dependencies..."
    cd "$BACKEND_DIR"
    npm ci --production=false
    
    # Install frontend dependencies
    print_info "Installing frontend dependencies..."
    cd "$FRONTEND_DIR"
    npm ci --production=false
    
    print_step "Dependencies installed successfully"
}

# Build applications
build_applications() {
    print_info "Building applications..."
    
    # Build backend (TypeScript compilation)
    print_info "Building backend..."
    cd "$BACKEND_DIR"
    npm run build
    
    # Build frontend (React production build)
    print_info "Building frontend..."
    cd "$FRONTEND_DIR"
    npm run build
    
    print_step "Applications built successfully"
}

# Configure MongoDB
configure_mongodb() {
    print_info "Configuring MongoDB..."
    
    # Start MongoDB service
    systemctl start mongod
    systemctl enable mongod
    
    # Create database indexes
    cd "$BACKEND_DIR"
    if [ -f "scripts/create-indexes.js" ]; then
        node scripts/create-indexes.js
        print_step "Database indexes created"
    fi
    
    print_step "MongoDB configured successfully"
}

# Configure Nginx
configure_nginx() {
    print_info "Configuring Nginx..."
    
    # Create Nginx configuration
    cat > "$NGINX_SITES_DIR/summer-vacation-planning" << 'EOF'
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
    ln -sf "$NGINX_SITES_DIR/summer-vacation-planning" "$NGINX_ENABLED_DIR/"
    
    # Remove default site if exists
    rm -f "$NGINX_ENABLED_DIR/default"
    
    # Test Nginx configuration
    nginx -t
    
    # Restart Nginx
    systemctl restart nginx
    systemctl enable nginx
    
    print_step "Nginx configured successfully"
}

# Configure environment variables
configure_environment() {
    print_info "Configuring environment variables..."
    
    # Backend environment variables
    cat > "$BACKEND_DIR/.env" << 'EOF'
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
    cat > "$FRONTEND_DIR/.env.production" << 'EOF'
REACT_APP_API_URL=http://47.120.74.212/api
REACT_APP_UPLOAD_URL=http://47.120.74.212/uploads
REACT_APP_MAX_FILE_SIZE=10485760
EOF

    print_step "Environment variables configured"
}

# Deploy backend with PM2
deploy_backend() {
    print_info "Deploying backend with PM2..."
    
    # Stop existing PM2 processes
    pm2 stop summer-vacation-backend 2>/dev/null || true
    pm2 delete summer-vacation-backend 2>/dev/null || true
    
    # Start backend with PM2
    cd "$PROJECT_DIR"
    pm2 start ecosystem.config.js
    pm2 save
    pm2 startup
    
    print_step "Backend deployed with PM2"
}

# Set up file permissions
setup_permissions() {
    print_info "Setting up file permissions..."
    
    # Set ownership
    chown -R root:root "$PROJECT_DIR"
    
    # Set directory permissions
    find "$PROJECT_DIR" -type d -exec chmod 755 {} \;
    
    # Set file permissions
    find "$PROJECT_DIR" -type f -exec chmod 644 {} \;
    
    # Make scripts executable
    chmod +x "$PROJECT_DIR"/*.sh
    
    # Upload directory permissions
    chmod -R 755 "$UPLOAD_DIR"
    
    # Log directory permissions
    chmod -R 755 "$LOG_DIR"
    
    print_step "File permissions configured"
}

# Health checks
perform_health_checks() {
    print_info "Performing health checks..."
    
    # Wait for services to start
    sleep 10
    
    # Check MongoDB
    if mongosh --eval "db.adminCommand('ping')" >/dev/null 2>&1; then
        print_step "MongoDB is running"
    else
        print_error "MongoDB health check failed"
        return 1
    fi
    
    # Check backend API
    local max_attempts=30
    local attempt=1
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s http://localhost:5000/api/health >/dev/null 2>&1; then
            print_step "Backend API is responding"
            break
        else
            print_warning "Backend API not ready, attempt $attempt/$max_attempts"
            sleep 2
            ((attempt++))
        fi
    done
    
    if [ $attempt -gt $max_attempts ]; then
        print_error "Backend API health check failed"
        return 1
    fi
    
    # Check Nginx
    if curl -f -s http://localhost/ >/dev/null 2>&1; then
        print_step "Nginx is serving frontend"
    else
        print_error "Nginx health check failed"
        return 1
    fi
    
    # Check PM2 processes
    if pm2 list | grep -q "summer-vacation-backend.*online"; then
        print_step "PM2 processes are running"
    else
        print_error "PM2 process health check failed"
        return 1
    fi
    
    print_step "All health checks passed"
}

# Configure firewall
configure_firewall() {
    print_info "Configuring firewall..."
    
    # Install and enable UFW if not present
    if ! command -v ufw &> /dev/null; then
        apt-get update
        apt-get install -y ufw
    fi
    
    # Configure UFW rules
    ufw --force reset
    ufw default deny incoming
    ufw default allow outgoing
    
    # Allow SSH
    ufw allow 22/tcp
    
    # Allow HTTP and HTTPS
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # Allow MongoDB (local only)
    ufw allow from 127.0.0.1 to any port 27017
    
    # Enable firewall
    ufw --force enable
    
    print_step "Firewall configured"
}

# Main deployment function
main() {
    echo -e "${BLUE}🚀 Alibaba Cloud Deployment - Summer Vacation Planning${NC}"
    echo "========================================================"
    echo "Target Server: 47.120.74.212"
    echo "Project Directory: $PROJECT_DIR"
    echo ""
    
    check_root
    pre_deployment_checks
    sync_latest_code
    install_dependencies
    build_applications
    configure_mongodb
    configure_environment
    configure_nginx
    setup_permissions
    deploy_backend
    configure_firewall
    perform_health_checks
    
    echo ""
    print_step "🎉 Deployment completed successfully!"
    echo ""
    echo "Application URLs:"
    echo "Frontend: http://47.120.74.212"
    echo "Backend API: http://47.120.74.212/api"
    echo ""
    echo "Next steps:"
    echo "1. Test the application thoroughly"
    echo "2. Configure HTTPS with SSL certificate"
    echo "3. Set up monitoring and log rotation"
    echo "4. Configure backup procedures"
    echo "5. Set up alerting for critical issues"
    echo ""
    echo "Monitoring commands:"
    echo "- PM2 status: pm2 list"
    echo "- View logs: pm2 logs summer-vacation-backend"
    echo "- Nginx status: systemctl status nginx"
    echo "- MongoDB status: systemctl status mongod"
}

# Handle script interruption
trap 'print_error "Deployment interrupted"; exit 1' INT

# Run main function
main "$@"