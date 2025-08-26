#!/usr/bin/env bash
set -e

echo "🚀 Summer Vacation Planning - HTTP Only Setup"
echo "Target: 47.120.74.212 (HTTP port 80)"
echo "Backend: 127.0.0.1:5000"
echo "Frontend: Static files from ./frontend/build"
echo ""

# Detect Linux distribution
if [ -f /etc/debian_version ]; then
    DISTRO="debian"
    echo "🐧 Detected: Debian/Ubuntu"
elif [ -f /etc/redhat-release ]; then
    DISTRO="rhel"
    echo "🐧 Detected: CentOS/RHEL"
else
    echo "⚠️ Unknown Linux distribution, proceeding with generic setup"
    DISTRO="generic"
fi

# 1. Install Nginx
echo "📦 Step 1: Installing Nginx..."
if [ "$DISTRO" = "debian" ]; then
    sudo apt update
    sudo apt install -y nginx
elif [ "$DISTRO" = "rhel" ]; then
    sudo yum install -y epel-release
    sudo yum install -y nginx
fi

# 2. Configure firewall
echo "🔥 Step 2: Configuring firewall for port 80..."
if command -v ufw &> /dev/null; then
    echo "  🔓 Using UFW (Ubuntu/Debian)"
    sudo ufw allow 80/tcp || true
    sudo ufw status
elif command -v firewall-cmd &> /dev/null; then
    echo "  🔓 Using firewalld (CentOS/RHEL)"
    sudo firewall-cmd --permanent --add-service=http
    sudo firewall-cmd --reload
    sudo firewall-cmd --list-all
fi

# Handle SELinux for CentOS/RHEL
if [ "$DISTRO" = "rhel" ] && command -v getenforce &> /dev/null; then
    echo "  🔒 Configuring SELinux for Nginx proxy..."
    sudo setsebool -P httpd_can_network_connect 1
fi

# 3. Setup frontend directory
echo "📁 Step 3: Setting up frontend files..."
sudo mkdir -p /var/www/svp/dist

# Check if build directory exists
if [ -d "./frontend/build" ]; then
    echo "  📋 Copying build files..."
    sudo cp -r ./frontend/build/* /var/www/svp/dist/
else
    echo "  ⚠️ Build directory not found, creating placeholder..."
    echo '<!doctype html>
<html><head><meta charset="utf-8"><title>Summer Vacation Planning</title></head>
<body><h1>Summer Vacation Planning App</h1><p>Frontend loading...</p></body></html>' | sudo tee /var/www/svp/dist/index.html >/dev/null
fi

# Set permissions
if [ "$DISTRO" = "debian" ]; then
    sudo chown -R www-data:www-data /var/www/svp/
elif [ "$DISTRO" = "rhel" ]; then
    sudo chown -R nginx:nginx /var/www/svp/
fi
sudo chmod -R 755 /var/www/svp/

# 4. Create Nginx configuration
echo "⚙️ Step 4: Creating Nginx configuration..."

# Determine config path
if [ -d "/etc/nginx/sites-available" ]; then
    CONFIG_PATH="/etc/nginx/sites-available/svp-ip.conf"
    ENABLE_PATH="/etc/nginx/sites-enabled/svp-ip.conf"
    echo "  📝 Using sites-available structure"
else
    CONFIG_PATH="/etc/nginx/conf.d/svp-ip.conf"
    echo "  📝 Using conf.d structure"
fi

# Write the configuration
sudo tee "$CONFIG_PATH" > /dev/null << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    root /var/www/svp/dist;
    index index.html;

    # Frontend routing (SPA support)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API backend proxy to port 5000
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;

        # CORS headers
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET,POST,PUT,PATCH,DELETE,OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type,Authorization,X-Requested-With" always;

        if ($request_method = OPTIONS) { return 204; }
    }

    # Health check
    location /health {
        proxy_pass http://127.0.0.1:5000/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    client_max_body_size 50m;
    
    gzip on;
    gzip_types text/plain text/css application/json application/javascript application/xml image/svg+xml;
    gzip_min_length 1k;
}
EOF

# 5. Enable site (if using sites-available structure)
if [ -n "$ENABLE_PATH" ]; then
    echo "  🔗 Enabling site..."
    sudo rm -f /etc/nginx/sites-enabled/default
    sudo ln -sf "$CONFIG_PATH" "$ENABLE_PATH"
fi

# 6. Test and start Nginx
echo "🧪 Step 5: Testing and starting Nginx..."
sudo nginx -t

echo "  🔄 Starting/reloading Nginx..."
sudo systemctl enable nginx
sudo systemctl reload nginx

# 7. Verify setup
echo "✅ Setup completed!"
echo ""
echo "🌐 Application URLs:"
echo "  Frontend: http://47.120.74.212/"
echo "  Health:   http://47.120.74.212/health"
echo "  API:      http://47.120.74.212/api/"
echo ""
echo "🚨 IMPORTANT NEXT STEPS:"
echo "  1. Start your backend server:"
echo "     cd backend && npm run dev"
echo ""
echo "  2. Test the deployment:"
echo "     curl -I http://47.120.74.212/"
echo "     curl http://47.120.74.212/health"
echo ""
echo "  3. Check logs if needed:"
echo "     sudo tail -f /var/log/nginx/access.log"
echo "     sudo tail -f /var/log/nginx/error.log"