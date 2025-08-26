#!/usr/bin/env bash
set -e

echo "🔍 HTTP-only部署故障诊断与修复"
echo "问题: 502 Bad Gateway - Certificate verify failed: IP address mismatch"
echo "目标: 确保 http://47.120.74.212/ 可通过HTTP访问"
echo ""

# 1. 检查现有Nginx配置
echo "📋 Step 1: 检查现有Nginx配置..."

echo "  🔍 查找所有HTTPS相关配置:"
sudo find /etc/nginx -name "*.conf" -exec grep -l "ssl\|https\|443" {} \; 2>/dev/null || echo "  ✅ 未找到SSL配置文件"

echo "  🔍 检查默认站点配置:"
if [ -f "/etc/nginx/sites-enabled/default" ]; then
    echo "  ⚠️ 发现默认站点配置 - 可能包含HTTPS重定向"
    sudo grep -n "listen.*443\|return.*https\|ssl" /etc/nginx/sites-enabled/default || true
else
    echo "  ✅ 默认站点配置已移除"
fi

echo "  🔍 检查现有站点配置:"
sudo ls -la /etc/nginx/sites-enabled/ 2>/dev/null || sudo ls -la /etc/nginx/conf.d/ 2>/dev/null

# 2. 备份现有配置
echo ""
echo "💾 Step 2: 备份现有配置..."
sudo mkdir -p /tmp/nginx-backup-$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="/tmp/nginx-backup-$(date +%Y%m%d-%H%M%S)"
sudo cp -r /etc/nginx/ "$BACKUP_DIR/"
echo "  ✅ 配置备份至: $BACKUP_DIR"

# 3. 移除所有HTTPS配置和重定向
echo ""
echo "🧹 Step 3: 清理HTTPS配置..."

# 禁用默认站点
sudo rm -f /etc/nginx/sites-enabled/default
echo "  ✅ 移除默认站点配置"

# 移除可能的SSL站点配置
sudo find /etc/nginx/sites-enabled -name "*ssl*" -delete 2>/dev/null || true
sudo find /etc/nginx/conf.d -name "*ssl*" -delete 2>/dev/null || true
echo "  ✅ 清理SSL相关配置"

# 4. 强制应用HTTP-only配置
echo ""
echo "⚙️ Step 4: 应用HTTP-only配置..."

# 确定配置文件路径
if [ -d "/etc/nginx/sites-available" ]; then
    CONFIG_PATH="/etc/nginx/sites-available/svp-http-only.conf"
    ENABLED_PATH="/etc/nginx/sites-enabled/svp-http-only.conf"
    echo "  📝 使用 sites-available 结构"
else
    CONFIG_PATH="/etc/nginx/conf.d/svp-http-only.conf"
    echo "  📝 使用 conf.d 结构"
fi

# 写入纯HTTP配置
sudo tee "$CONFIG_PATH" > /dev/null << 'EOF'
# HTTP-only configuration for Summer Vacation Planning
# 强制仅HTTP访问，无HTTPS重定向

server {
    listen 80 default_server;
    listen [::]:80 default_server;
    
    # 匹配任意Host头，包括IP地址
    server_name _;
    
    # 前端静态文件目录
    root /var/www/svp/dist;
    index index.html;
    
    # 添加安全头但不强制HTTPS
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # 前端SPA路由处理
    location / {
        try_files $uri $uri/ /index.html;
        
        # 缓存静态资源
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # 后端API代理 (端口5000)
    location /api/ {
        # 移除尾部斜杠避免路径问题
        rewrite ^/api/(.*)$ /$1 break;
        
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        
        # 代理头设置
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
        
        # 超时设置
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        
        # CORS处理
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET,POST,PUT,PATCH,DELETE,OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type,Authorization,X-Requested-With" always;
        add_header Access-Control-Max-Age "3600" always;
        
        # OPTIONS预检处理
        if ($request_method = OPTIONS) {
            add_header Access-Control-Allow-Origin "*";
            add_header Access-Control-Allow-Methods "GET,POST,PUT,PATCH,DELETE,OPTIONS";
            add_header Access-Control-Allow-Headers "Content-Type,Authorization,X-Requested-With";
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }
    }
    
    # 健康检查端点
    location /health {
        proxy_pass http://127.0.0.1:5000/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        access_log off;
    }
    
    # 文件上传限制
    client_max_body_size 50m;
    client_body_timeout 30s;
    client_header_timeout 30s;
    
    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;
    
    # 错误页面
    error_page 404 /index.html;
    error_page 500 502 503 504 /50x.html;
    
    location = /50x.html {
        internal;
        return 200 '<!DOCTYPE html><html><head><title>Service Unavailable</title></head><body><h1>Service Unavailable</h1><p>Backend service is not running. Please start the backend server.</p></body></html>';
        add_header Content-Type text/html;
    }
}
EOF

# 启用配置
if [ -n "$ENABLED_PATH" ]; then
    sudo ln -sf "$CONFIG_PATH" "$ENABLED_PATH"
    echo "  🔗 启用HTTP-only配置"
fi

# 5. 确保前端文件存在
echo ""
echo "📁 Step 5: 检查前端文件..."
sudo mkdir -p /var/www/svp/dist

if [ ! -f "/var/www/svp/dist/index.html" ]; then
    if [ -d "./frontend/build" ]; then
        echo "  📋 复制前端构建文件..."
        sudo cp -r ./frontend/build/* /var/www/svp/dist/
    else
        echo "  ⚠️ 创建临时前端页面..."
        sudo tee /var/www/svp/dist/index.html > /dev/null << 'EOF'
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Summer Vacation Planning</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .status { color: #28a745; font-size: 18px; }
        .info { color: #6c757d; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🌞 Summer Vacation Planning</h1>
        <div class="status">✅ HTTP服务器运行正常</div>
        <div class="info">
            <p>访问地址: <code>http://47.120.74.212/</code></p>
            <p>API地址: <code>http://47.120.74.212/api/</code></p>
            <p>健康检查: <code>http://47.120.74.212/health</code></p>
        </div>
        <div class="info">
            <small>注意: 此应用仅通过HTTP(80端口)提供服务，不使用HTTPS</small>
        </div>
    </div>
</body>
</html>
EOF
    fi
fi

# 设置权限
if command -v www-data &> /dev/null; then
    sudo chown -R www-data:www-data /var/www/svp/
elif command -v nginx &> /dev/null; then
    sudo chown -R nginx:nginx /var/www/svp/
fi
sudo chmod -R 755 /var/www/svp/

# 6. 测试并重载Nginx
echo ""
echo "🧪 Step 6: 测试并重载Nginx..."
sudo nginx -t
if [ $? -eq 0 ]; then
    sudo systemctl reload nginx
    echo "  ✅ Nginx配置已重载"
else
    echo "  ❌ Nginx配置测试失败，请检查语法"
    exit 1
fi

# 7. 验证访问
echo ""
echo "🔍 Step 7: 验证HTTP访问..."

sleep 2

echo "  🧪 测试本地HTTP访问:"
curl -s -I http://localhost/ | head -1 || echo "  ⚠️ 本地访问测试失败"

echo "  🧪 测试健康检查:"
curl -s http://localhost/health | head -3 2>/dev/null || echo "  ⚠️ 健康检查失败（后端可能未运行）"

echo "  🧪 测试外部HTTP访问:"
curl -s -I http://47.120.74.212/ | head -1 || echo "  ⚠️ 外部访问测试失败"

echo ""
echo "✅ HTTP-only配置修复完成!"
echo ""
echo "🌐 测试访问:"
echo "   http://47.120.74.212/ （应该显示页面，不再有证书错误）"
echo ""
echo "⚠️ 如果仍有问题:"
echo "1. 确保后端运行: cd backend && npm run dev"
echo "2. 检查防火墙: sudo ufw status"
echo "3. 查看日志: sudo tail -f /var/log/nginx/error.log"
echo ""
echo "📋 配置备份位置: $BACKUP_DIR"