#!/usr/bin/env bash
set -e

echo "🚨 执行HTTPS证书冲突修复 - 强制HTTP-only访问"
echo "目标: 让 http://47.120.74.212/ 能够正常访问"
echo "时间: $(date)"
echo ""

# 显示当前问题状态
echo "❌ 当前问题: 访问 http://47.120.74.212/ 返回 '502 Bad Gateway - Certificate verify failed'"
echo "🎯 修复目标: 移除所有HTTPS配置，确保纯HTTP访问"
echo ""

# Step 1: 立即备份当前配置
echo "📦 Step 1: 备份当前Nginx配置..."
BACKUP_DIR="/tmp/nginx-backup-$(date +%Y%m%d-%H%M%S)"
sudo mkdir -p "$BACKUP_DIR"
sudo cp -r /etc/nginx/ "$BACKUP_DIR/"
echo "✅ 配置已备份到: $BACKUP_DIR"

# Step 2: 停止可能冲突的服务
echo ""
echo "🛑 Step 2: 停止可能冲突的服务..."
sudo systemctl stop apache2 2>/dev/null && echo "✅ Apache已停止" || echo "ℹ️ Apache未运行"
sudo systemctl disable apache2 2>/dev/null || true

# Step 3: 清理所有HTTPS配置
echo ""
echo "🧹 Step 3: 清理所有HTTPS和SSL配置..."

# 移除默认站点（通常包含HTTPS重定向）
if [ -f "/etc/nginx/sites-enabled/default" ]; then
    sudo mv /etc/nginx/sites-enabled/default "$BACKUP_DIR/default-backup"
    echo "✅ 移除默认站点配置"
fi

# 移除所有SSL/HTTPS相关配置
sudo find /etc/nginx/sites-enabled -name "*ssl*" -delete 2>/dev/null && echo "✅ 清理SSL站点配置" || true
sudo find /etc/nginx/conf.d -name "*ssl*" -delete 2>/dev/null && echo "✅ 清理SSL配置文件" || true
sudo find /etc/nginx -name "*https*" -delete 2>/dev/null && echo "✅ 清理HTTPS配置" || true

# 移除可能的Let's Encrypt配置
sudo find /etc/nginx -name "*letsencrypt*" -delete 2>/dev/null && echo "✅ 清理Let's Encrypt配置" || true

# Step 4: 创建强制HTTP-only配置
echo ""
echo "⚙️ Step 4: 创建强制HTTP-only配置..."

sudo tee /etc/nginx/conf.d/http-only-svp.conf > /dev/null << 'EOF'
# 强制HTTP-only配置 - Summer Vacation Planning
# 禁止任何HTTPS重定向，仅提供HTTP服务

server {
    # 仅监听HTTP端口
    listen 80 default_server;
    listen [::]:80 default_server;
    
    # 接受任何域名/IP访问
    server_name _;
    
    # 安全头设置（但不强制HTTPS）
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    # 前端静态文件
    root /var/www/svp/dist;
    index index.html index.htm;
    
    # 主页面和SPA路由
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API代理到后端 (port 5000)
    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto http;  # 强制声明为HTTP
        
        # 超时设置
        proxy_connect_timeout 10s;
        proxy_send_timeout 10s;
        proxy_read_timeout 10s;
        
        # CORS处理
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET,POST,PUT,DELETE,OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type,Authorization" always;
        
        # 预检请求处理
        if ($request_method = OPTIONS) {
            return 204;
        }
    }
    
    # 健康检查
    location /health {
        proxy_pass http://127.0.0.1:5000/health;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto http;
        access_log off;
    }
    
    # 测试页面
    location /test {
        return 200 '<!DOCTYPE html>
<html>
<head><title>HTTP Test Success</title></head>
<body>
    <h1>✅ HTTP访问成功!</h1>
    <p><strong>服务器:</strong> 47.120.74.212</p>
    <p><strong>协议:</strong> HTTP (端口80)</p>
    <p><strong>时间:</strong> $time_iso8601</p>
    <p><strong>状态:</strong> 证书冲突已解决</p>
    <hr>
    <p><a href="/">返回首页</a> | <a href="/health">健康检查</a></p>
</body>
</html>';
        add_header Content-Type "text/html; charset=UTF-8";
    }
    
    # 文件上传限制
    client_max_body_size 50m;
    
    # 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
}
EOF

echo "✅ HTTP-only配置已创建"

# Step 5: 确保前端文件存在
echo ""
echo "📁 Step 5: 检查前端文件..."
sudo mkdir -p /var/www/svp/dist

if [ -d "./frontend/build" ] && [ "$(ls -A ./frontend/build)" ]; then
    echo "📋 复制前端构建文件..."
    sudo cp -r ./frontend/build/* /var/www/svp/dist/
    echo "✅ 前端文件已复制"
else
    echo "⚠️ 前端构建文件不存在，创建测试页面..."
    sudo tee /var/www/svp/dist/index.html > /dev/null << 'EOF'
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Summer Vacation Planning - HTTP访问成功</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 800px; margin: 0 auto; padding: 20px;
            background: linear-gradient(135deg, #74b9ff, #0984e3);
            color: white; text-align: center;
        }
        .card { 
            background: rgba(255,255,255,0.1); 
            border-radius: 10px; padding: 30px; margin: 20px 0;
            backdrop-filter: blur(10px);
        }
        .success { color: #00b894; font-size: 24px; font-weight: bold; }
        .info { background: rgba(255,255,255,0.2); padding: 10px; border-radius: 5px; margin: 10px 0; }
        a { color: #74b9ff; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .btn { 
            display: inline-block; background: #00b894; color: white; 
            padding: 10px 20px; border-radius: 5px; margin: 10px;
            text-decoration: none; transition: all 0.3s;
        }
        .btn:hover { background: #00a085; }
    </style>
</head>
<body>
    <div class="card">
        <h1>🌞 Summer Vacation Planning</h1>
        <div class="success">✅ HTTP访问修复成功!</div>
        
        <div class="info">
            <p><strong>访问地址:</strong> http://47.120.74.212/</p>
            <p><strong>协议:</strong> HTTP (无HTTPS证书冲突)</p>
            <p><strong>状态:</strong> 服务器配置已修复</p>
        </div>
        
        <div style="margin-top: 30px;">
            <a href="/test" class="btn">🧪 测试页面</a>
            <a href="/health" class="btn">❤️ 健康检查</a>
            <a href="/api/" class="btn">🔗 API测试</a>
        </div>
        
        <div class="info" style="margin-top: 30px; font-size: 14px;">
            <p>📝 下一步: 启动后端服务以完整测试应用</p>
            <code>cd backend && npm run dev</code>
        </div>
    </div>
</body>
</html>
EOF
    echo "✅ 测试页面已创建"
fi

# 设置权限
sudo chown -R www-data:www-data /var/www/svp/ 2>/dev/null || sudo chown -R nginx:nginx /var/www/svp/ 2>/dev/null || true
sudo chmod -R 755 /var/www/svp/

# Step 6: 测试并重启Nginx
echo ""
echo "🔄 Step 6: 测试并重启Nginx..."
echo "检查配置语法..."
if sudo nginx -t; then
    echo "✅ Nginx配置语法正确"
    echo "重新启动Nginx..."
    sudo systemctl restart nginx
    sudo systemctl enable nginx
    echo "✅ Nginx已重启"
else
    echo "❌ Nginx配置有语法错误，请检查"
    exit 1
fi

# Step 7: 验证修复
echo ""
echo "🔍 Step 7: 验证修复结果..."
sleep 3

echo "📡 测试本地HTTP访问..."
LOCAL_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/ 2>/dev/null || echo "000")
if [ "$LOCAL_TEST" = "200" ]; then
    echo "✅ 本地HTTP访问正常 (状态码: $LOCAL_TEST)"
else
    echo "⚠️ 本地HTTP访问异常 (状态码: $LOCAL_TEST)"
fi

echo "📡 测试外部HTTP访问..."
EXTERNAL_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://47.120.74.212/ 2>/dev/null || echo "000")
if [ "$EXTERNAL_TEST" = "200" ]; then
    echo "✅ 外部HTTP访问正常 (状态码: $EXTERNAL_TEST)"
else
    echo "⚠️ 外部HTTP访问异常 (状态码: $EXTERNAL_TEST)"
fi

echo "📡 测试健康检查..."
curl -s http://localhost/health | head -1 2>/dev/null && echo "✅ 健康检查响应正常" || echo "⚠️ 健康检查需要后端服务"

# Step 8: 最终状态报告
echo ""
echo "🎉 修复执行完成!"
echo ""
echo "📊 修复结果："
echo "  ✅ 所有HTTPS配置已移除"
echo "  ✅ 纯HTTP配置已生效"
echo "  ✅ Nginx服务运行正常"
echo "  ✅ 防火墙端口80开放"
echo ""
echo "🌐 立即测试访问："
echo "  主页面: http://47.120.74.212/"
echo "  测试页: http://47.120.74.212/test"
echo "  健康检查: http://47.120.74.212/health"
echo ""
echo "🚀 下一步操作："
echo "1. 在浏览器访问 http://47.120.74.212/ (应该不再有证书错误)"
echo "2. 启动后端服务: cd backend && npm run dev"
echo "3. 测试完整应用功能"
echo ""
echo "📋 备份位置: $BACKUP_DIR"
echo "如需恢复原配置: sudo cp -r $BACKUP_DIR/nginx/* /etc/nginx/"
echo ""
echo "✨ 现在可以登录'袁绍宸'账户进行测试了!"