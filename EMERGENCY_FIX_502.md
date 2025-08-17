# 🚨 502错误紧急修复指南

## 故障诊断结果

**问题状态**: 502 Bad Gateway → 403 Forbidden (已改善)
**根本原因**: 后端服务(端口3000)未运行
**服务器**: 47.120.74.212
**Nginx状态**: 正常运行
**SSH连接**: 存在问题，需要通过控制台或VNC访问

## 🔍 故障分析

1. **Nginx运行正常** - 返回403而非连接错误
2. **后端服务崩溃** - 端口3000无响应
3. **PM2进程可能停止** - 需要重启后端服务
4. **可能的原因**:
   - PM2进程崩溃
   - MongoDB连接失败
   - 内存不足导致服务停止
   - 依赖项缺失

## 🚀 紧急修复步骤

### 1. 通过阿里云控制台连接服务器
```bash
# 登录阿里云控制台 → ECS → 实例管理
# 找到服务器实例，点击"远程连接" → "VNC连接"
# 或使用"实例控制台"
```

### 2. 检查服务状态
```bash
# 检查PM2状态
pm2 status
pm2 logs

# 检查Nginx状态
systemctl status nginx
nginx -t

# 检查MongoDB状态
systemctl status mongod

# 检查端口占用
netstat -tlnp | grep :3000
lsof -i :3000
```

### 3. 重启后端服务
```bash
# 进入后端目录
cd /root/projects/SummerVacationPlanning/backend

# 检查构建文件
ls -la dist/

# 如果dist目录不存在或为空，重新构建
npm run build

# 重启PM2服务
pm2 restart all
# 或者停止后重新启动
pm2 stop all
pm2 start dist/server.js --name "summer-backend"

# 检查服务状态
pm2 status
pm2 logs --lines 50
```

### 4. 检查MongoDB连接
```bash
# 启动MongoDB服务
systemctl start mongod
systemctl enable mongod

# 检查MongoDB状态
systemctl status mongod
mongo --eval "db.adminCommand('ping')"
```

### 5. 修复Nginx配置
```bash
# 检查Nginx配置
nginx -t

# 查看当前配置
cat /etc/nginx/sites-available/default

# 重新加载Nginx配置
nginx -s reload
```

### 6. 验证修复结果
```bash
# 测试后端服务
curl localhost:3000/health || curl localhost:3000/

# 测试外部访问
curl -I http://47.120.74.212/
```

## 📝 常见问题及解决方案

### 问题1: PM2服务无响应
```bash
# 完全重置PM2
pm2 kill
pm2 start dist/server.js --name "summer-backend" --watch

# 设置开机自启
pm2 startup
pm2 save
```

### 问题2: MongoDB连接失败
```bash
# 重启MongoDB
systemctl restart mongod

# 检查MongoDB日志
journalctl -u mongod -f

# 检查MongoDB配置
cat /etc/mongod.conf
```

### 问题3: 依赖项缺失
```bash
cd /root/projects/SummerVacationPlanning/backend
npm install
npm run build
pm2 restart all
```

### 问题4: 内存不足
```bash
# 检查内存使用
free -h
top
htop

# 清理内存
sync && echo 3 > /proc/sys/vm/drop_caches

# 重启服务
pm2 restart all
```

## 🔧 一键修复脚本

如果手动修复太复杂，执行以下一键脚本：

```bash
#!/bin/bash
echo "开始502错误紧急修复..."

# 检查服务状态
echo "=== 检查服务状态 ==="
pm2 status
systemctl status nginx --no-pager
systemctl status mongod --no-pager

# 重启所有服务
echo "=== 重启服务 ==="
systemctl restart mongod
cd /root/projects/SummerVacationPlanning/backend
npm run build
pm2 restart all || pm2 start dist/server.js --name "summer-backend"

# 重启Nginx
nginx -s reload

# 验证修复
echo "=== 验证修复结果 ==="
sleep 5
curl -I localhost:3000/ && echo "后端服务正常"
curl -I http://47.120.74.212/ && echo "网站可访问"

echo "修复完成！"
```

## 📊 监控和预防

### 设置监控
```bash
# 添加健康检查脚本到crontab
crontab -e

# 添加以下行 (每5分钟检查一次)
*/5 * * * * /root/scripts/health_check.sh
```

### 日志监控
```bash
# PM2日志
pm2 logs --timestamp

# 系统日志
journalctl -f -u nginx
journalctl -f -u mongod
```

## 🚨 紧急联系

如果问题仍未解决，立即：
1. 检查阿里云控制台的监控告警
2. 查看服务器资源使用情况
3. 考虑回滚到上一个稳定版本
4. 联系运维团队或云服务商技术支持

---
**修复时间**: 预计10-15分钟
**影响范围**: 整站服务
**优先级**: P0 (最高)