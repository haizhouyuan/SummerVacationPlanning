# HTTPS 升级部署指南

## 📋 概述
将Summer Vacation Planning应用从HTTP升级到HTTPS的完整指南。

**目标服务器**: 阿里云ECS (47.120.74.212)  
**当前状态**: HTTP (80端口)  
**目标状态**: HTTPS (443端口) + HTTP重定向

## 🛠️ 准备工作

### 检查当前状态
```bash
# 检查当前HTTP部署
curl -I http://47.120.74.212/
curl http://47.120.74.212/health

# 检查Nginx状态
sudo systemctl status nginx
sudo nginx -t
```

### 备份现有配置
```bash
# 备份当前Nginx配置
sudo cp -r /etc/nginx /etc/nginx.backup.$(date +%Y%m%d)

# 备份前端文件
sudo cp -r /var/www/svp /var/www/svp.backup.$(date +%Y%m%d)
```

## 🚀 升级步骤

### 方式一：自动化脚本部署（推荐）

1. **准备脚本**
```bash
# 确保脚本可执行
chmod +x setup-https-deployment.sh
chmod +x verify-https-deployment.sh
```

2. **运行HTTPS部署脚本**
```bash
sudo ./setup-https-deployment.sh
```

3. **选择SSL证书类型**
   - **选项1**: 自签名证书（用于IP访问）
   - **选项2**: Let's Encrypt证书（需要域名）
   - **选项3**: 使用现有证书文件

4. **验证部署**
```bash
./verify-https-deployment.sh
```

### 方式二：手动部署

#### 步骤1: 安装依赖
```bash
sudo apt update
sudo apt install -y nginx openssl

# 如果使用Let's Encrypt
sudo apt install -y certbot python3-certbot-nginx
```

#### 步骤2: 生成SSL证书

**选择A: 自签名证书**
```bash
sudo mkdir -p /etc/ssl/private
sudo chmod 700 /etc/ssl/private

sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/private/svp-selfsigned.key \
    -out /etc/ssl/certs/svp-selfsigned.crt \
    -subj "/C=CN/ST=Beijing/L=Beijing/O=Summer Vacation Planning/CN=47.120.74.212"
```

**选择B: Let's Encrypt证书**
```bash
# 需要先配置域名解析到服务器IP
sudo certbot --nginx -d yourdomain.com
```

#### 步骤3: 配置防火墙
```bash
sudo ufw allow 443/tcp
sudo ufw allow 'Nginx Full'
sudo ufw status
```

#### 步骤4: 部署Nginx配置
```bash
# 复制HTTPS配置文件
sudo cp nginx-svp-https-config.conf /etc/nginx/sites-available/svp-https.conf

# 启用HTTPS站点
sudo ln -sf /etc/nginx/sites-available/svp-https.conf /etc/nginx/sites-enabled/svp-https.conf

# 删除旧的HTTP配置
sudo rm -f /etc/nginx/sites-enabled/svp-ip.conf
sudo rm -f /etc/nginx/sites-enabled/default

# 测试配置
sudo nginx -t

# 重启Nginx
sudo systemctl restart nginx
```

## 🔧 应用配置更新

### 更新环境变量

1. **Frontend环境变量**
```bash
# 备份原有文件
cp frontend/.env.production frontend/.env.production.http.backup

# 使用HTTPS版本
cp frontend/.env.production.https frontend/.env.production
```

2. **Backend环境变量**
```bash
# 备份原有文件
cp backend/.env.production backend/.env.production.http.backup

# 使用HTTPS版本
cp backend/.env.production.https backend/.env.production
```

### 重新构建前端
```bash
cd frontend
npm run build
sudo cp -r build/* /var/www/svp/dist/
sudo chown -R www-data:www-data /var/www/svp/
```

### 重启后端服务
```bash
cd backend
npm run dev
# 或使用PM2
pm2 restart summer-vacation-api
```

## ✅ 验证和测试

### 基础功能测试
```bash
# HTTP重定向测试
curl -I http://47.120.74.212/

# HTTPS访问测试
curl -k -I https://47.120.74.212/

# API健康检查
curl -k https://47.120.74.212/health

# 运行完整验证
./verify-https-deployment.sh
```

### 浏览器测试
1. 访问 `https://47.120.74.212/`
2. 检查是否显示安全锁图标（自签名证书会有警告）
3. 测试登录功能
4. 测试API调用

### SSL证书检查
```bash
# 检查证书信息
echo | openssl s_client -connect 47.120.74.212:443 -servername 47.120.74.212 2>/dev/null | openssl x509 -noout -dates

# 检查SSL评级（需要域名）
# curl -s "https://api.ssllabs.com/api/v3/analyze?host=yourdomain.com"
```

## 🔒 安全配置

### Nginx安全头配置
配置文件已包含以下安全头：
- `Strict-Transport-Security` (HSTS)
- `X-Content-Type-Options`
- `X-Frame-Options`
- `X-XSS-Protection`
- `Referrer-Policy`

### 后端安全配置
- 启用 `SECURE_COOKIES=true`
- 设置 `TRUST_PROXY=true`
- CORS配置为HTTPS源

## 🔄 证书管理

### Let's Encrypt自动续期
```bash
# 添加续期定时任务
sudo crontab -e
# 添加以下行：
0 12 * * * /usr/bin/certbot renew --quiet --nginx

# 测试续期
sudo certbot renew --dry-run
```

### 自签名证书更新
```bash
# 生成新的自签名证书（365天有效期）
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/private/svp-selfsigned.key \
    -out /etc/ssl/certs/svp-selfsigned.crt \
    -subj "/C=CN/ST=Beijing/L=Beijing/O=Summer Vacation Planning/CN=47.120.74.212"

sudo systemctl reload nginx
```

## 🚨 故障排除

### 常见问题

1. **502 Bad Gateway**
   - 检查后端服务是否运行在5000端口
   - 检查防火墙设置

2. **SSL证书错误**
   - 检查证书文件路径
   - 确认证书权限正确

3. **CORS错误**
   - 检查后端CORS设置
   - 确认环境变量正确

### 日志查看
```bash
# Nginx错误日志
sudo tail -f /var/log/nginx/svp_error.log

# Nginx访问日志
sudo tail -f /var/log/nginx/svp_access.log

# 系统日志
sudo journalctl -u nginx -f
```

### 回滚到HTTP
如果需要回滚到HTTP部署：
```bash
# 启用HTTP配置
sudo ln -sf /etc/nginx/sites-available/svp-ip.conf /etc/nginx/sites-enabled/svp-ip.conf
sudo rm -f /etc/nginx/sites-enabled/svp-https.conf

# 恢复环境变量
cp frontend/.env.production.http.backup frontend/.env.production
cp backend/.env.production.http.backup backend/.env.production

# 重启服务
sudo nginx -t && sudo systemctl reload nginx
```

## 📊 性能优化

### Nginx性能配置
- 启用HTTP/2
- 配置Gzip压缩
- 设置浏览器缓存

### 监控建议
```bash
# 监控SSL证书过期
curl -s https://47.120.74.212 | openssl x509 -noout -dates

# 监控HTTPS响应时间
curl -w "@curl-format.txt" -o /dev/null -s https://47.120.74.212/
```

## 📝 维护检查清单

- [ ] SSL证书有效期检查（每月）
- [ ] 安全头配置验证
- [ ] HTTPS重定向测试
- [ ] API功能测试
- [ ] 性能监控检查
- [ ] 日志文件清理
- [ ] 备份配置更新

## 📞 支持信息

如有问题，请检查：
1. 运行验证脚本：`./verify-https-deployment.sh`
2. 查看Nginx日志
3. 检查后端服务状态
4. 验证防火墙设置

**重要**: 自签名证书会在浏览器中显示安全警告，这是正常的。用户需要手动接受证书例外。推荐使用域名和Let's Encrypt证书以获得最佳用户体验。