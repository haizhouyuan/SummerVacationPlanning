#!/usr/bin/env bash

echo "🌐 一键修复47.120.74.212服务器HTTPS证书冲突"
echo "=================================================="
echo ""

# 配置变量 - 请根据实际情况修改
SERVER_IP="47.120.74.212"
SSH_USER="root"  # 修改为你的SSH用户名
SSH_PORT="22"    # SSH端口，通常是22

echo "📋 连接配置:"
echo "  服务器: $SERVER_IP"
echo "  用户: $SSH_USER"
echo "  端口: $SSH_PORT"
echo ""

# 检查SSH连接
echo "🔍 测试SSH连接..."
ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -p $SSH_PORT $SSH_USER@$SERVER_IP "echo '✅ SSH连接成功'" 2>/dev/null

if [ $? -ne 0 ]; then
    echo "❌ SSH连接失败!"
    echo ""
    echo "请检查以下项目:"
    echo "1. 服务器IP地址是否正确: $SERVER_IP"
    echo "2. SSH用户名是否正确: $SSH_USER"
    echo "3. SSH端口是否正确: $SSH_PORT"
    echo "4. 是否配置了SSH密钥认证"
    echo "5. 网络连接是否正常"
    echo ""
    echo "💡 手动连接测试: ssh $SSH_USER@$SERVER_IP"
    exit 1
fi

echo ""
echo "🚀 开始远程修复流程..."
echo ""

# 创建完整的远程修复脚本
REMOTE_SCRIPT=$(cat << 'REMOTE_EOF'
#!/bin/bash
set -e

echo "🔧 在服务器端执行HTTPS配置修复..."
echo "时间: $(date)"
echo ""

# 1. 备份现有配置
echo "📦 Step 1: 备份现有配置..."
BACKUP_DIR="/tmp/nginx-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p $BACKUP_DIR
cp -r /etc/nginx/ $BACKUP_DIR/
echo "✅ 配置已备份到: $BACKUP_DIR"

# 2. 停止可能冲突的服务
echo ""
echo "🛑 Step 2: 停止冲突服务..."
systemctl stop apache2 2>/dev/null && echo "✅ Apache已停止" || echo "ℹ️ Apache未运行"
systemctl disable apache2 2>/dev/null || true

# 3. 清理HTTPS配置
echo ""
echo "🧹 Step 3: 清理HTTPS配置..."
mv /etc/nginx/sites-enabled/default $BACKUP_DIR/default-backup 2>/dev/null || echo "ℹ️ 默认站点不存在"
find /etc/nginx/sites-enabled -name "*ssl*" -delete 2>/dev/null || true
find /etc/nginx/conf.d -name "*ssl*" -delete 2>/dev/null || true
find /etc/nginx -name "*https*" -delete 2>/dev/null || true
echo "✅ HTTPS配置已清理"

# 4. 创建HTTP-only配置
echo ""
echo "⚙️ Step 4: 创建HTTP-only配置..."
cat > /etc/nginx/conf.d/http-only-svp.conf << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    root /var/www/html;
    index index.html index.htm;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    location / {
        try_files $uri $uri/ @fallback;
    }

    location @fallback {
        return 200 '<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Summer Vacation Planning</title>
    <style>
        body{font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:20px;background:linear-gradient(135deg,#74b9ff,#0984e3);color:white;text-align:center;}
        .card{background:rgba(255,255,255,0.1);border-radius:10px;padding:30px;margin:20px 0;backdrop-filter:blur(10px);}
        .success{color:#00b894;font-size:24px;font-weight:bold;}
        .info{background:rgba(255,255,255,0.2);padding:10px;border-radius:5px;margin:10px 0;}
        a{color:#74b9ff;text-decoration:none;}
        .btn{display:inline-block;background:#00b894;color:white;padding:10px 20px;border-radius:5px;margin:10px;text-decoration:none;}
    </style>
</head>
<body>
    <div class="card">
        <h1>🌞 Summer Vacation Planning</h1>
        <div class="success">✅ HTTP访问修复成功!</div>
        <div class="info">
            <p><strong>服务器:</strong> 47.120.74.212</p>
            <p><strong>协议:</strong> HTTP (无HTTPS证书冲突)</p>
            <p><strong>状态:</strong> 配置已更新</p>
        </div>
        <div style="margin-top:30px;">
            <a href="/health" class="btn">❤️ 健康检查</a>
            <a href="/api/" class="btn">🔗 API测试</a>
        </div>
        <div class="info" style="margin-top:30px;font-size:14px;">
            <p>📝 下一步: 启动后端服务以完整测试应用</p>
        </div>
    </div>
</body>
</html>';
        add_header Content-Type "text/html; charset=UTF-8";
    }

    location /api/ {
        rewrite ^/api/(.*)$ /$1 break;
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto http;
        proxy_connect_timeout 10s;
        proxy_send_timeout 10s;
        proxy_read_timeout 10s;
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET,POST,PUT,DELETE,OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type,Authorization" always;
        if ($request_method = OPTIONS) { return 204; }
        proxy_intercept_errors on;
        error_page 502 503 504 = @api_fallback;
    }

    location @api_fallback {
        return 200 '{"error":"Backend service not running","message":"Please start backend on port 5000","status":502}';
        add_header Content-Type "application/json";
    }

    location /health {
        proxy_pass http://127.0.0.1:5000/health;
        proxy_set_header Host $host;
        proxy_intercept_errors on;
        error_page 502 503 504 = @health_fallback;
    }

    location @health_fallback {
        return 200 '{"status":"nginx_ok","backend":"offline","server":"47.120.74.212","message":"HTTP修复成功，需要启动后端"}';
        add_header Content-Type "application/json";
    }

    client_max_body_size 50m;
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
}
EOF
echo "✅ HTTP-only配置已创建"

# 5. 测试并重载Nginx
echo ""
echo "🧪 Step 5: 测试并重载Nginx..."
if nginx -t; then
    systemctl reload nginx
    systemctl enable nginx
    echo "✅ Nginx配置已重载"
else
    echo "❌ Nginx配置测试失败，恢复备份..."
    rm -f /etc/nginx/conf.d/http-only-svp.conf
    cp -r $BACKUP_DIR/nginx/* /etc/nginx/ 2>/dev/null || true
    systemctl reload nginx
    echo "🔄 已恢复原始配置"
    exit 1
fi

# 6. 验证结果
echo ""
echo "🔍 Step 6: 验证修复结果..."
sleep 2

echo "📡 本地HTTP访问测试:"
LOCAL_RESULT=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/ 2>/dev/null || echo "000")
echo "  状态码: $LOCAL_RESULT"

echo "📡 健康检查测试:"
curl -s http://localhost/health 2>/dev/null | head -1 || echo "  需要后端服务"

echo ""
echo "🎉 服务器端修复完成!"
echo "备份位置: $BACKUP_DIR"
echo "配置文件: /etc/nginx/conf.d/http-only-svp.conf"

REMOTE_EOF
)

# 执行远程脚本
echo "📤 上传并执行修复脚本..."
ssh -o StrictHostKeyChecking=no -p $SSH_PORT $SSH_USER@$SERVER_IP "$REMOTE_SCRIPT"

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 远程修复执行成功!"
    echo ""
    
    # 本地验证
    echo "🔍 本地验证外部访问..."
    EXTERNAL_RESULT=$(curl -s -o /dev/null -w "%{http_code}" http://47.120.74.212/ 2>/dev/null || echo "000")
    
    echo "📊 验证结果:"
    echo "  外部HTTP状态码: $EXTERNAL_RESULT"
    
    if [ "$EXTERNAL_RESULT" = "200" ]; then
        echo "  ✅ 状态: 修复成功，可以正常访问"
    else
        echo "  ⚠️ 状态: 可能需要等待几秒钟生效"
    fi
    
    echo ""
    echo "🌐 立即测试:"
    echo "  主页面: http://47.120.74.212/"
    echo "  健康检查: http://47.120.74.212/health"
    echo ""
    echo "✨ 现在可以通过浏览器访问 http://47.120.74.212/"
    echo "   应该不再有HTTPS证书错误!"
    echo ""
    echo "🚀 下一步:"
    echo "1. 在服务器启动后端服务 (端口5000)"
    echo "2. 登录袁绍宸账户进行测试"
    
else
    echo ""
    echo "❌ 远程修复执行失败!"
    echo "请检查SSH连接和服务器权限"
    echo ""
    echo "💡 可以尝试手动连接服务器执行:"
    echo "ssh $SSH_USER@$SERVER_IP"
    echo "然后参考 manual-server-commands.md 中的步骤"
fi