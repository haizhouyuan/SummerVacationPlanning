#!/usr/bin/env bash

echo "🔍 诊断HTTPS证书冲突问题"
echo "分析为什么访问 http://47.120.74.212/ 会出现证书错误"
echo ""

# 1. 检查系统服务
echo "📋 1. 检查系统服务状态:"
echo "  Nginx状态:"
sudo systemctl status nginx --no-pager -l | grep -E "Active:|Main PID:|Tasks:" || echo "    Nginx未运行"

echo "  端口占用情况:"
sudo ss -tlnp | grep -E ":80 |:443 " || echo "    无服务监听80/443端口"

# 2. 检查Nginx配置
echo ""
echo "📋 2. 检查Nginx配置:"
echo "  主配置文件:"
sudo nginx -T 2>/dev/null | grep -E "listen.*443|ssl|https|return.*https" | head -10 || echo "    未发现HTTPS配置"

echo "  活动站点:"
sudo ls -la /etc/nginx/sites-enabled/ 2>/dev/null || sudo ls -la /etc/nginx/conf.d/ 2>/dev/null

# 3. 检查证书文件
echo ""
echo "📋 3. 检查SSL证书:"
sudo find /etc -name "*.crt" -o -name "*.pem" 2>/dev/null | grep -v "/proc" | head -5 || echo "  未发现证书文件"

# 4. 检查Let's Encrypt
echo ""
echo "📋 4. 检查Let's Encrypt:"
if [ -d "/etc/letsencrypt" ]; then
    echo "  发现Let's Encrypt目录"
    sudo ls -la /etc/letsencrypt/live/ 2>/dev/null || true
else
    echo "  未安装Let's Encrypt"
fi

# 5. 检查其他可能的代理服务
echo ""
echo "📋 5. 检查其他服务:"
echo "  Apache状态:"
sudo systemctl is-active apache2 2>/dev/null || echo "    Apache未运行"

echo "  Cloudflare/CDN代理:"
curl -s -I http://47.120.74.212/ | grep -i "cloudflare\|cdn\|proxy" || echo "    未检测到CDN"

# 6. 直接测试HTTP访问
echo ""
echo "📋 6. 直接测试HTTP访问:"
echo "  本地测试:"
curl -s -I http://localhost/ 2>&1 | head -3 || echo "    本地HTTP测试失败"

echo "  外部测试:"
curl -s -I http://47.120.74.212/ 2>&1 | head -3 || echo "    外部HTTP测试失败"

echo "  强制HTTP测试（忽略重定向）:"
curl -s --max-redirs 0 -I http://47.120.74.212/ 2>&1 | head -3 || echo "    强制HTTP测试失败"

# 7. 检查防火墙
echo ""
echo "📋 7. 检查防火墙:"
if command -v ufw &> /dev/null; then
    sudo ufw status | grep -E "80|443" || echo "  防火墙未开放HTTP端口"
elif command -v firewall-cmd &> /dev/null; then
    sudo firewall-cmd --list-services | grep -E "http|https" || echo "  防火墙未开放HTTP服务"
fi

echo ""
echo "📋 诊断建议:"
echo "如果发现："
echo "1. 有HTTPS配置 -> 运行 fix-https-conflict.sh"
echo "2. 有Let's Encrypt -> 可能需要禁用自动更新"
echo "3. 有CDN代理 -> 检查云服务商控制台"
echo "4. Apache运行 -> 停止Apache，确保Nginx独占80端口"
echo ""
echo "快速修复命令："
echo "sudo bash emergency-http-fix.sh"