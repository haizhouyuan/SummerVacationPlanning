# 手动SSH配置修改快速指南

## 快速修复步骤

### 1. 备份配置文件
```bash
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak_$(date +%F)
```

### 2. 编辑SSH配置文件
```bash
vim /etc/ssh/sshd_config
```

### 3. 修改关键配置项

找到并修改以下配置项：

```bash
# 启用密钥认证
PubkeyAuthentication yes

# 临时允许root登录（修复后可改回prohibit-password）
PermitRootLogin yes

# 启用密码认证（临时，修复后可关闭）
PasswordAuthentication yes

# 确保密钥文件路径正确
AuthorizedKeysFile .ssh/authorized_keys
```

### 4. 检查SSH目录和权限
```bash
# 创建.ssh目录（如果不存在）
mkdir -p /root/.ssh

# 创建authorized_keys文件（如果不存在）
touch /root/.ssh/authorized_keys

# 设置正确权限
chmod 700 /root/.ssh
chmod 600 /root/.ssh/authorized_keys
chown -R root:root /root/.ssh
```

### 5. 验证配置
```bash
# 检查配置语法
sshd -t

# 重启SSH服务
systemctl restart sshd

# 检查服务状态
systemctl status sshd
```

### 6. 测试连接
```bash
# 在本地执行
ssh -i /path/to/private_key.pem -vvv root@YOUR_SERVER_IP
```

## 常用vim命令

```bash
# 搜索配置项
/PubkeyAuthentication

# 修改行
:s/PubkeyAuthentication no/PubkeyAuthentication yes/

# 保存并退出
:wq

# 不保存退出
:q!
```

## 安全加固（连接成功后）

```bash
# 编辑配置文件
vim /etc/ssh/sshd_config

# 修改为更安全的配置
PermitRootLogin prohibit-password
PasswordAuthentication no

# 重启服务
systemctl restart sshd
```

## 故障排除

### 如果修改后无法连接
1. 通过VNC重新进入服务器
2. 检查配置文件语法：`sshd -t`
3. 查看SSH服务日志：`journalctl -u sshd -f`
4. 恢复备份：`cp /etc/ssh/sshd_config.bak_* /etc/ssh/sshd_config`

### 常见错误
- **Permission denied**: 检查authorized_keys文件权限
- **Connection refused**: 检查SSH服务是否运行
- **No supported authentication methods**: 检查PubkeyAuthentication配置 