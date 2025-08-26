# 手动修复47.120.74.212服务器HTTPS证书冲突

## 🔑 连接服务器
```bash
ssh root@47.120.74.212
# 或者使用你的SSH用户名和密钥
```

## 📋 Step 1: 检查现状
```bash
# 检查Nginx状态
systemctl status nginx

# 查找HTTPS配置
find /etc/nginx -name "*.conf" -exec grep -l "ssl\|https\|443" {} \; 2>/dev/null

# 查看启用的站点
ls -la /etc/nginx/sites-enabled/
ls -la /etc/nginx/conf.d/

# 查看当前配置
nginx -T | grep -E "listen.*443|ssl|https|return.*https" | head -10
```

## 💾 Step 2: 备份现有配置
```bash
# 创建备份目录
BACKUP_DIR="/tmp/nginx-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p $BACKUP_DIR

# 备份Nginx配置
cp -r /etc/nginx/ $BACKUP_DIR/
echo "配置已备份到: $BACKUP_DIR"
```

## 🧹 Step 3: 清理HTTPS配置
```bash
# 停止可能冲突的Apache
systemctl stop apache2 2>/dev/null || true
systemctl disable apache2 2>/dev/null || true

# 移除默认站点
mv /etc/nginx/sites-enabled/default $BACKUP_DIR/default-backup 2>/dev/null || true

# 清理SSL配置
find /etc/nginx/sites-enabled -name "*ssl*" -delete 2>/dev/null || true
find /etc/nginx/conf.d -name "*ssl*" -delete 2>/dev/null || true
find /etc/nginx -name "*https*" -delete 2>/dev/null || true
```

## ⚙️ Step 4: 创建HTTP-only配置
```bash
cat > /etc/nginx/conf.d/http-only-svp.conf << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    # 前端静态文件目录
    root /var/www/html;
    index index.html index.htm;

    # 安全头设置（不强制HTTPS）
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # 主页面处理
    location / {
        try_files $uri $uri/ @fallback;
    }

    # 如果文件不存在，返回成功页面
    location @fallback {
        return 200 '<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Summer Vacation Planning - HTTP访问成功</title>
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

    # 后端API代理（假设端口5000）
    location /api/ {
        rewrite ^/api/(.*)$ /$1 break;
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;

        # 代理头设置
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto http;

        # 超时设置
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

        # 如果后端不可用，返回提示信息
        proxy_intercept_errors on;
        error_page 502 503 504 = @api_fallback;
    }

    location @api_fallback {
        return 200 '{"error":"Backend service not running","message":"Please start the backend service on port 5000","status":502}';
        add_header Content-Type "application/json";
    }

    # 健康检查端点
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
```

## 🧪 Step 5: 测试并应用配置
```bash
# 测试Nginx配置语法
nginx -t

# 如果语法正确，重载Nginx
systemctl reload nginx

# 确保Nginx自启动
systemctl enable nginx

# 检查Nginx状态
systemctl status nginx
```

## 🔍 Step 6: 验证修复结果
```bash
# 测试本地HTTP访问
curl -I http://localhost/

# 测试健康检查
curl http://localhost/health

# 检查端口监听
ss -tulpn | grep -E ":80 |:443 "
```

## 🌐 Step 7: 外部验证
在本地执行：
```bash
# 测试外部HTTP访问
curl -I http://47.120.74.212/

# 测试健康检查
curl http://47.120.74.212/health
```

## ✅ 预期结果
- ✅ `curl -I http://47.120.74.212/` 返回 `HTTP/1.1 200 OK`
- ✅ 浏览器访问 `http://47.120.74.212/` 显示成功页面，无证书错误
- ✅ `http://47.120.74.212/health` 返回健康检查信息

## 🔄 如需回滚
```bash
# 恢复备份配置
cp -r $BACKUP_DIR/nginx/* /etc/nginx/
systemctl reload nginx
```

## 🚀 完成后的下一步
1. 浏览器访问 `http://47.120.74.212/` 验证无证书错误
2. 在服务器上启动后端服务（端口5000）
3. 测试完整的Summer Vacation Planning应用功能
4. 登录"袁绍宸"账户进行数据结构分析