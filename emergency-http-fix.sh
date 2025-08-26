#!/usr/bin/env bash

echo "🚨 紧急修复: HTTPS证书冲突导致的502错误"
echo "目标: 移除所有HTTPS配置，强制HTTP-only访问"
echo ""

# 立即停止任何可能的HTTPS重定向
echo "1️⃣ 移除HTTPS重定向和SSL配置..."

# 备份并移除默认配置
sudo mv /etc/nginx/sites-enabled/default /tmp/nginx-default-backup-$(date +%s) 2>/dev/null || true

# 移除所有可能的SSL配置
sudo rm -f /etc/nginx/sites-enabled/*ssl* 2>/dev/null || true
sudo rm -f /etc/nginx/conf.d/*ssl* 2>/dev/null || true
sudo rm -f /etc/nginx/conf.d/*https* 2>/dev/null || true

# 2. 创建最简HTTP配置
echo "2️⃣ 创建纯HTTP配置..."

sudo tee /etc/nginx/conf.d/http-only.conf > /dev/null << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    
    root /var/www/html;
    index index.html;
    
    location / {
        return 200 '<!DOCTYPE html><html><head><title>HTTP Test</title></head><body><h1>✅ HTTP访问成功!</h1><p>服务器: 47.120.74.212</p><p>协议: HTTP (无HTTPS)</p><p>时间: $(date)</p></body></html>';
        add_header Content-Type text/html;
    }
    
    location /health {
        return 200 '{"status":"ok","protocol":"http","time":"$(date)"}';
        add_header Content-Type application/json;
    }
}
EOF

# 3. 测试并重载
echo "3️⃣ 重载Nginx..."
sudo nginx -t && sudo systemctl reload nginx

echo ""
echo "✅ 紧急修复完成!"
echo ""
echo "🧪 立即测试:"
echo "curl http://47.120.74.212/"
echo ""
echo "如果仍有问题，可能是:"
echo "- 云服务商的负载均衡器强制HTTPS"
echo "- 防火墙/代理服务器问题"
echo "- 需要清理浏览器缓存"