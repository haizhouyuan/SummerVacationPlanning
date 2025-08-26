#!/usr/bin/env bash
set -e

echo "🚀 Starting HTTP-only deployment for Summer Vacation Planning App"
echo "📍 Target server: 47.120.74.212"

# 1) Install Nginx if not present
echo "📦 Installing Nginx..."
if command -v apt-get &> /dev/null; then
    sudo apt update
    sudo apt install -y nginx
elif command -v yum &> /dev/null; then
    sudo yum install -y epel-release
    sudo yum install -y nginx
else
    echo "❌ Unsupported package manager. Please install Nginx manually."
    exit 1
fi

# 2) Open firewall for port 80
echo "🔓 Opening port 80 in firewall..."
if command -v ufw &> /dev/null; then
    sudo ufw allow 80/tcp || true
elif command -v firewall-cmd &> /dev/null; then
    sudo firewall-cmd --permanent --add-service=http
    sudo firewall-cmd --reload
fi

# 3) Create frontend directory and copy build files
echo "📁 Setting up frontend files..."
sudo mkdir -p /var/www/svp/dist
sudo cp -r ./frontend/build/* /var/www/svp/dist/
sudo chown -R www-data:www-data /var/www/svp/ 2>/dev/null || sudo chown -R nginx:nginx /var/www/svp/ 2>/dev/null || true
sudo chmod -R 755 /var/www/svp/

# 4) Create Nginx configuration
echo "⚙️ Creating Nginx configuration..."
cat <<'EOF' | sudo tee /etc/nginx/sites-available/svp-ip.conf >/dev/null || sudo tee /etc/nginx/conf.d/svp-ip.conf >/dev/null
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    # Frontend static files
    root /var/www/svp/dist;
    index index.html;

    # Frontend routing (SPA support)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API backend proxy (port 5000)
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;

        # Forward headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;

        # CORS headers
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET,POST,PUT,PATCH,DELETE,OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type,Authorization,X-Requested-With" always;

        # Handle preflight requests
        if ($request_method = OPTIONS) {
            return 204;
        }
    }

    # Health check endpoint (direct backend access)
    location /health {
        proxy_pass http://127.0.0.1:5000/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # File upload settings
    client_max_body_size 50m;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript application/xml image/svg+xml;
    gzip_min_length 1k;
}
EOF

# 5) Enable site and remove default
echo "🔗 Enabling site configuration..."
sudo rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
if [ -d "/etc/nginx/sites-available" ]; then
    sudo ln -sf /etc/nginx/sites-available/svp-ip.conf /etc/nginx/sites-enabled/svp-ip.conf
fi

# 6) Test and reload Nginx
echo "🧪 Testing Nginx configuration..."
sudo nginx -t

echo "🔄 Reloading Nginx..."
sudo systemctl enable nginx
sudo systemctl reload nginx

echo "✅ HTTP-only deployment completed!"
echo "🌐 Access the application at: http://47.120.74.212/"
echo "🏥 Health check: http://47.120.74.212/health"
echo "📡 API endpoint: http://47.120.74.212/api/"
echo ""
echo "⚠️ IMPORTANT: Make sure your backend is running on port 5000"
echo "   Backend start command: cd backend && npm run dev"