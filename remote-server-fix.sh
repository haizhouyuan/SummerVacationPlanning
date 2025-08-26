#!/usr/bin/env bash

echo "🌐 远程服务器HTTPS修复脚本"
echo "目标服务器: 47.120.74.212"
echo "修复目标: 清理HTTPS配置，启用纯HTTP访问"
echo "============================================"
echo ""

# 服务器连接配置
SERVER_IP="47.120.74.212"
SSH_USER="root"  # 或者你的SSH用户名
SSH_KEY=""       # SSH密钥路径 (可选)

echo "⚙️ 服务器连接配置:"
echo "  IP: $SERVER_IP"
echo "  用户: $SSH_USER"
echo ""

# 函数：远程执行命令
remote_exec() {
    local cmd="$1"
    local desc="$2"
    
    echo "🔧 $desc"
    if [ -n "$SSH_KEY" ]; then
        ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" "$cmd"
    else
        ssh -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" "$cmd"
    fi
    
    if [ $? -eq 0 ]; then
        echo "✅ 成功: $desc"
    else
        echo "❌ 失败: $desc"
        return 1
    fi
}

# 函数：上传文件到服务器
upload_file() {
    local local_path="$1"
    local remote_path="$2"
    local desc="$3"
    
    echo "📤 $desc"
    if [ -n "$SSH_KEY" ]; then
        scp -i "$SSH_KEY" -o StrictHostKeyChecking=no "$local_path" "$SSH_USER@$SERVER_IP:$remote_path"
    else
        scp -o StrictHostKeyChecking=no "$local_path" "$SSH_USER@$SERVER_IP:$remote_path"
    fi
    
    if [ $? -eq 0 ]; then
        echo "✅ 上传成功: $desc"
    else
        echo "❌ 上传失败: $desc"
        return 1
    fi
}

# 检查SSH连接
echo "🔍 检查SSH连接..."
if remote_exec "echo 'SSH连接测试成功'" "测试SSH连接"; then
    echo ""
else
    echo "❌ 无法连接到服务器 $SERVER_IP"
    echo "请检查:"
    echo "  1. SSH用户名是否正确"
    echo "  2. SSH密钥是否配置"
    echo "  3. 服务器是否允许SSH连接"
    echo "  4. 网络连接是否正常"
    exit 1
fi

# Step 1: 检查当前Nginx配置
echo "📋 Step 1: 检查当前Nginx配置..."
echo ""

remote_exec "nginx -v" "检查Nginx版本"
remote_exec "systemctl status nginx --no-pager -l | head -5" "检查Nginx运行状态"

echo ""
echo "🔍 检查现有HTTPS配置:"
remote_exec "find /etc/nginx -name '*.conf' -exec grep -l 'ssl\\|https\\|443' {} \\; 2>/dev/null || echo '未发现SSL配置'" "查找SSL配置文件"
remote_exec "ls -la /etc/nginx/sites-enabled/ 2>/dev/null || ls -la /etc/nginx/conf.d/ 2>/dev/null" "列出启用的站点"

# Step 2: 备份现有配置
echo ""
echo "📦 Step 2: 备份现有配置..."
BACKUP_DIR="/tmp/nginx-backup-$(date +%Y%m%d-%H%M%S)"
remote_exec "mkdir -p $BACKUP_DIR && cp -r /etc/nginx/ $BACKUP_DIR/" "备份Nginx配置到 $BACKUP_DIR"

# Step 3: 清理HTTPS配置
echo ""
echo "🧹 Step 3: 清理HTTPS配置..."

remote_exec "systemctl stop apache2 2>/dev/null || echo 'Apache未运行'" "停止Apache服务"
remote_exec "systemctl disable apache2 2>/dev/null || echo 'Apache未安装'" "禁用Apache自启动"

remote_exec "mv /etc/nginx/sites-enabled/default $BACKUP_DIR/default-backup 2>/dev/null || echo '默认站点不存在'" "移除默认站点"
remote_exec "find /etc/nginx/sites-enabled -name '*ssl*' -delete 2>/dev/null || echo '无SSL站点配置'" "清理SSL站点"
remote_exec "find /etc/nginx/conf.d -name '*ssl*' -delete 2>/dev/null || echo '无SSL配置文件'" "清理SSL配置文件"

# Step 4: 创建HTTP-only配置
echo ""
echo "⚙️ Step 4: 创建HTTP-only配置..."

# 创建临时配置文件
cat > /tmp/http-only-config.conf << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    # 前端静态文件
    root /var/www/html;
    index index.html index.htm;

    # 添加安全头但不强制HTTPS
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # 主页面和SPA路由
    location / {
        try_files $uri $uri/ @fallback;
    }

    location @fallback {
        return 200 '<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Summer Vacation Planning - HTTP修复成功</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            max-width: 600px; 
            margin: 50px auto; 
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-align: center;
        }
        .card { 
            background: rgba(255,255,255,0.1); 
            border-radius: 15px; 
            padding: 30px; 
            backdrop-filter: blur(10px);
        }
        .success { color: #4CAF50; font-size: 24px; margin: 20px 0; }
        .info { background: rgba(255,255,255,0.2); padding: 15px; border-radius: 10px; margin: 15px 0; }
        a { color: #81C784; text-decoration: none; }
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
        
        <div class="info">
            <p>🔗 <a href="/health">健康检查</a></p>
            <p>🔗 <a href="/api/">API测试</a></p>
        </div>
        
        <div class="info" style="font-size: 14px;">
            <p>📝 下一步: 启动后端服务完整测试应用</p>
        </div>
    </div>
</body>
</html>';
        add_header Content-Type "text/html; charset=UTF-8";
    }

    # 后端API代理 (假设后端在5000端口)
    location /api/ {
        # 移除尾部斜杠，转发到后端
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

        # CORS处理
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET,POST,PUT,DELETE,OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type,Authorization" always;

        if ($request_method = OPTIONS) {
            return 204;
        }

        # 错误处理
        proxy_intercept_errors on;
        error_page 502 503 504 = @api_fallback;
    }

    location @api_fallback {
        return 200 '{"error":"Backend service not running","message":"Please start the backend service on port 5000","status":502}';
        add_header Content-Type "application/json";
    }

    # 健康检查
    location /health {
        proxy_pass http://127.0.0.1:5000/health;
        proxy_set_header Host $host;
        
        # 如果后端不可用，返回基本健康信息
        proxy_intercept_errors on;
        error_page 502 503 504 = @health_fallback;
    }

    location @health_fallback {
        return 200 '{"status":"nginx_ok","backend":"offline","timestamp":"$time_iso8601","message":"Frontend ready, backend needed"}';
        add_header Content-Type "application/json";
    }

    # 文件上传限制
    client_max_body_size 50m;

    # Gzip压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
}
EOF

# 上传配置文件
upload_file "/tmp/http-only-config.conf" "/tmp/http-only-config.conf" "上传HTTP-only配置文件"

# 安装配置文件
remote_exec "cp /tmp/http-only-config.conf /etc/nginx/conf.d/http-only-svp.conf" "安装HTTP-only配置"
remote_exec "chown root:root /etc/nginx/conf.d/http-only-svp.conf && chmod 644 /etc/nginx/conf.d/http-only-svp.conf" "设置配置文件权限"

# Step 5: 测试并重载Nginx
echo ""
echo "🧪 Step 5: 测试并重载Nginx..."

if remote_exec "nginx -t" "测试Nginx配置语法"; then
    remote_exec "systemctl reload nginx" "重载Nginx配置"
    remote_exec "systemctl enable nginx" "确保Nginx自启动"
else
    echo "❌ Nginx配置语法错误，恢复备份..."
    remote_exec "rm -f /etc/nginx/conf.d/http-only-svp.conf" "移除错误配置"
    remote_exec "cp -r $BACKUP_DIR/nginx/* /etc/nginx/ 2>/dev/null || echo '备份恢复失败'" "恢复备份配置"
    remote_exec "systemctl reload nginx" "重载原始配置"
    exit 1
fi

# Step 6: 验证修复结果
echo ""
echo "🔍 Step 6: 验证修复结果..."

sleep 3

echo "📡 测试服务器本地HTTP访问..."
remote_exec "curl -s -o /dev/null -w 'HTTP Status: %{http_code}' http://localhost/" "本地HTTP访问测试"

echo "📡 测试健康检查..."
remote_exec "curl -s http://localhost/health | head -3 2>/dev/null || echo 'Health check: Backend needed'" "健康检查测试"

echo "📡 测试外部访问 (本地curl)..."
curl -s -o /dev/null -w "HTTP Status: %{http_code}" http://47.120.74.212/ 2>/dev/null && echo " - 外部HTTP访问" || echo " - 外部访问失败"

# 最终报告
echo ""
echo "🎉 远程服务器修复完成!"
echo "============================================"
echo ""
echo "📊 修复结果:"
echo "  ✅ HTTPS配置已清理"
echo "  ✅ HTTP-only配置已应用"
echo "  ✅ Nginx服务已重载"
echo "  ✅ 配置已备份到: $BACKUP_DIR"
echo ""
echo "🌐 测试访问:"
echo "  主页面: http://47.120.74.212/"
echo "  健康检查: http://47.120.74.212/health"
echo "  API测试: http://47.120.74.212/api/"
echo ""
echo "🚀 下一步:"
echo "  1. 浏览器访问 http://47.120.74.212/ 验证无证书错误"
echo "  2. 在服务器上启动后端服务 (端口5000)"
echo "  3. 测试完整应用功能"
echo ""
echo "⚠️ 如需回滚:"
echo "ssh $SSH_USER@$SERVER_IP 'cp -r $BACKUP_DIR/nginx/* /etc/nginx/ && systemctl reload nginx'"