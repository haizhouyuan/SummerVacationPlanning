#!/usr/bin/env bash
set -e

echo "🔒 Summer Vacation Planning - HTTPS Deployment Setup"
echo "Target: 47.120.74.212 (HTTPS port 443)"
echo "Backend: 127.0.0.1:5000"
echo "Frontend: Static files from ./frontend/build"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ Please run this script with sudo${NC}"
    exit 1
fi

# Detect Linux distribution
if [ -f /etc/debian_version ]; then
    DISTRO="debian"
    echo -e "${BLUE}🐧 Detected: Debian/Ubuntu${NC}"
elif [ -f /etc/redhat-release ]; then
    DISTRO="rhel"
    echo -e "${BLUE}🐧 Detected: CentOS/RHEL${NC}"
else
    echo -e "${YELLOW}⚠️ Unknown Linux distribution, proceeding with generic setup${NC}"
    DISTRO="generic"
fi

echo ""
echo -e "${YELLOW}📋 HTTPS Deployment Options:${NC}"
echo "1. Self-signed certificate (for IP access)"
echo "2. Let's Encrypt certificate (requires domain name)"
echo "3. Use existing certificate files"
echo ""
read -p "Select option (1/2/3): " SSL_OPTION

case $SSL_OPTION in
    1)
        echo -e "${BLUE}🔧 Setting up self-signed certificate...${NC}"
        USE_SELFSIGNED=true
        ;;
    2)
        echo -e "${BLUE}🔧 Setting up Let's Encrypt certificate...${NC}"
        read -p "Enter your domain name: " DOMAIN_NAME
        if [ -z "$DOMAIN_NAME" ]; then
            echo -e "${RED}❌ Domain name is required for Let's Encrypt${NC}"
            exit 1
        fi
        USE_LETSENCRYPT=true
        ;;
    3)
        echo -e "${BLUE}🔧 Using existing certificate files...${NC}"
        read -p "Enter certificate file path: " CERT_PATH
        read -p "Enter private key file path: " KEY_PATH
        if [ ! -f "$CERT_PATH" ] || [ ! -f "$KEY_PATH" ]; then
            echo -e "${RED}❌ Certificate or key file not found${NC}"
            exit 1
        fi
        USE_EXISTING=true
        ;;
    *)
        echo -e "${RED}❌ Invalid option${NC}"
        exit 1
        ;;
esac

# Step 1: Install dependencies
echo -e "${GREEN}📦 Step 1: Installing dependencies...${NC}"
if [ "$DISTRO" = "debian" ]; then
    apt update
    apt install -y nginx openssl
    if [ "$USE_LETSENCRYPT" = true ]; then
        apt install -y certbot python3-certbot-nginx
    fi
elif [ "$DISTRO" = "rhel" ]; then
    yum install -y epel-release
    yum install -y nginx openssl
    if [ "$USE_LETSENCRYPT" = true ]; then
        yum install -y certbot python3-certbot-nginx
    fi
fi

# Step 2: Configure firewall
echo -e "${GREEN}🔥 Step 2: Configuring firewall...${NC}"
if command -v ufw &> /dev/null; then
    echo "  🔓 Using UFW (Ubuntu/Debian)"
    ufw allow 80/tcp || true
    ufw allow 443/tcp || true
    ufw allow 'Nginx Full' || true
    ufw status
elif command -v firewall-cmd &> /dev/null; then
    echo "  🔓 Using firewalld (CentOS/RHEL)"
    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https
    firewall-cmd --reload
    firewall-cmd --list-all
fi

# Handle SELinux for CentOS/RHEL
if [ "$DISTRO" = "rhel" ] && command -v getenforce &> /dev/null; then
    echo "  🔒 Configuring SELinux for Nginx proxy..."
    setsebool -P httpd_can_network_connect 1
fi

# Step 3: Setup SSL certificate
echo -e "${GREEN}🔐 Step 3: Setting up SSL certificate...${NC}"
if [ "$USE_SELFSIGNED" = true ]; then
    # Create self-signed certificate
    mkdir -p /etc/ssl/private
    chmod 700 /etc/ssl/private
    
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/ssl/private/svp-selfsigned.key \
        -out /etc/ssl/certs/svp-selfsigned.crt \
        -subj "/C=CN/ST=Beijing/L=Beijing/O=Summer Vacation Planning/CN=47.120.74.212"
    
    CERT_FILE="/etc/ssl/certs/svp-selfsigned.crt"
    KEY_FILE="/etc/ssl/private/svp-selfsigned.key"
    
elif [ "$USE_LETSENCRYPT" = true ]; then
    # Use Let's Encrypt
    certbot --nginx -d "$DOMAIN_NAME" --non-interactive --agree-tos --email admin@$DOMAIN_NAME
    CERT_FILE="/etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem"
    KEY_FILE="/etc/letsencrypt/live/$DOMAIN_NAME/privkey.pem"
    
    # Setup auto-renewal
    crontab -l 2>/dev/null | { cat; echo "0 12 * * * /usr/bin/certbot renew --quiet"; } | crontab -
    
elif [ "$USE_EXISTING" = true ]; then
    CERT_FILE="$CERT_PATH"
    KEY_FILE="$KEY_PATH"
fi

# Step 4: Setup frontend directory
echo -e "${GREEN}📁 Step 4: Setting up frontend files...${NC}"
mkdir -p /var/www/svp/dist

if [ -d "./frontend/build" ]; then
    echo "  📋 Copying build files..."
    cp -r ./frontend/build/* /var/www/svp/dist/
else
    echo -e "${YELLOW}  ⚠️ Build directory not found, creating placeholder...${NC}"
    cat > /var/www/svp/dist/index.html << 'EOF'
<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Summer Vacation Planning</title>
</head>
<body>
    <h1>🌟 Summer Vacation Planning App</h1>
    <p>HTTPS frontend loading...</p>
    <p>Please build the frontend and redeploy.</p>
</body>
</html>
EOF
fi

# Set permissions
if [ "$DISTRO" = "debian" ]; then
    chown -R www-data:www-data /var/www/svp/
elif [ "$DISTRO" = "rhel" ]; then
    chown -R nginx:nginx /var/www/svp/
fi
chmod -R 755 /var/www/svp/

# Step 5: Create Nginx HTTPS configuration
echo -e "${GREEN}⚙️ Step 5: Creating Nginx HTTPS configuration...${NC}"

# Determine config path
if [ -d "/etc/nginx/sites-available" ]; then
    CONFIG_PATH="/etc/nginx/sites-available/svp-https.conf"
    ENABLE_PATH="/etc/nginx/sites-enabled/svp-https.conf"
    echo "  📝 Using sites-available structure"
else
    CONFIG_PATH="/etc/nginx/conf.d/svp-https.conf"
    echo "  📝 Using conf.d structure"
fi

# Create the HTTPS configuration
cat > "$CONFIG_PATH" << EOF
# HTTPS Configuration for Summer Vacation Planning
# Generated by setup-https-deployment.sh

# HTTP Server - Redirect to HTTPS
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    return 301 https://\$server_name\$request_uri;
}

# HTTPS Server - Main Configuration
server {
    listen 443 ssl http2 default_server;
    listen [::]:443 ssl http2 default_server;
    server_name _;

    # SSL Certificate
    ssl_certificate $CERT_FILE;
    ssl_certificate_key $KEY_FILE;
    
    # SSL Security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options DENY always;
    add_header X-XSS-Protection "1; mode=block" always;

    root /var/www/svp/dist;
    index index.html;

    # Frontend routing
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # API backend proxy
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_read_timeout 60s;

        # CORS headers
        add_header Access-Control-Allow-Origin "https://\$server_name" always;
        add_header Access-Control-Allow-Methods "GET,POST,PUT,PATCH,DELETE,OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type,Authorization,X-Requested-With" always;

        if (\$request_method = OPTIONS) { return 204; }
    }

    # Health check
    location /health {
        proxy_pass http://127.0.0.1:5000/health;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }

    client_max_body_size 50m;
    
    gzip on;
    gzip_types text/plain text/css application/json application/javascript application/xml image/svg+xml;
    gzip_min_length 1k;
}
EOF

# Step 6: Enable site and remove old config
echo -e "${GREEN}🔗 Step 6: Enabling HTTPS site...${NC}"
if [ -n "$ENABLE_PATH" ]; then
    rm -f /etc/nginx/sites-enabled/default
    rm -f /etc/nginx/sites-enabled/svp-ip.conf
    ln -sf "$CONFIG_PATH" "$ENABLE_PATH"
else
    rm -f /etc/nginx/conf.d/svp-ip.conf
fi

# Step 7: Test and start Nginx
echo -e "${GREEN}🧪 Step 7: Testing and starting Nginx...${NC}"
nginx -t

if [ $? -eq 0 ]; then
    echo "  🔄 Restarting Nginx..."
    systemctl enable nginx
    systemctl restart nginx
    echo -e "${GREEN}✅ Nginx started successfully!${NC}"
else
    echo -e "${RED}❌ Nginx configuration test failed!${NC}"
    exit 1
fi

# Step 8: Final verification
echo ""
echo -e "${GREEN}🎉 HTTPS Setup completed successfully!${NC}"
echo ""
echo -e "${BLUE}🌐 Application URLs:${NC}"
echo "  Frontend: https://47.120.74.212/"
echo "  Health:   https://47.120.74.212/health"
echo "  API:      https://47.120.74.212/api/"
echo ""
echo -e "${YELLOW}🚨 IMPORTANT NEXT STEPS:${NC}"
echo "  1. Update environment variables to use HTTPS"
echo "  2. Rebuild and redeploy frontend with HTTPS URLs"
echo "  3. Start/restart backend server:"
echo "     cd backend && npm run dev"
echo ""
echo "  4. Test the HTTPS deployment:"
echo "     curl -I https://47.120.74.212/"
echo "     curl https://47.120.74.212/health"
echo ""
if [ "$USE_SELFSIGNED" = true ]; then
    echo -e "${YELLOW}  ⚠️ Using self-signed certificate - browsers will show security warning${NC}"
    echo "  Add certificate exception or use curl with -k flag for testing"
fi
echo ""
echo -e "${BLUE}📊 Check logs if needed:${NC}"
echo "  sudo tail -f /var/log/nginx/svp_access.log"
echo "  sudo tail -f /var/log/nginx/svp_error.log"