# SSH配置修复工具使用说明

## 文件说明

本项目提供了三个SSH配置修复工具：

1. **`fix_ssh_config.sh`** - Linux自动化修复脚本
2. **`manual_ssh_fix.md`** - 手动修复快速指南
3. **`fix_ssh_config.bat`** - Windows批处理指导文件

## 使用方法

### 方法一：自动化脚本（推荐）

1. **上传脚本到Linux服务器**
   ```bash
   # 通过VNC或其他方式将fix_ssh_config.sh上传到服务器
   scp fix_ssh_config.sh root@YOUR_SERVER_IP:/tmp/
   ```

2. **在服务器上执行脚本**
   ```bash
   # 进入服务器（通过VNC或控制台）
   cd /tmp
   chmod +x fix_ssh_config.sh
   sudo ./fix_ssh_config.sh
   ```

3. **脚本会自动完成以下操作**：
   - 备份原配置文件
   - 修改SSH配置参数
   - 修复目录和文件权限
   - 验证配置语法
   - 重启SSH服务
   - 显示配置摘要

### 方法二：手动修复

1. **在Windows上运行指导文件**
   ```cmd
   fix_ssh_config.bat
   ```

2. **按照屏幕提示在Linux服务器上执行命令**

3. **或者直接参考 `manual_ssh_fix.md` 中的步骤**

### 方法三：直接使用快速指南

直接查看 `manual_ssh_fix.md` 文件，按照其中的命令逐步执行。

## 修复内容

脚本会自动修改以下SSH配置：

```bash
# 启用密钥认证
PubkeyAuthentication yes

# 临时允许root登录
PermitRootLogin yes

# 启用密码认证（临时）
PasswordAuthentication yes

# 设置密钥文件路径
AuthorizedKeysFile .ssh/authorized_keys
```

## 安全注意事项

1. **临时配置**：脚本会临时启用root登录和密码认证，修复成功后建议关闭
2. **权限设置**：脚本会自动设置正确的文件权限（700/600）
3. **备份保护**：每次修改前都会自动备份原配置文件
4. **配置验证**：修改后会验证配置语法正确性

## 修复后的安全加固

连接成功后，建议执行以下安全加固：

```bash
# 编辑配置文件
vim /etc/ssh/sshd_config

# 修改为更安全的配置
PermitRootLogin prohibit-password
PasswordAuthentication no

# 重启SSH服务
systemctl restart sshd
```

## 故障排除

### 如果脚本执行失败

1. **检查权限**：确保以root用户运行
2. **查看错误信息**：脚本会显示详细的错误信息
3. **手动恢复**：使用备份文件恢复配置
   ```bash
   cp /etc/ssh/sshd_config.bak_* /etc/ssh/sshd_config
   systemctl restart sshd
   ```

### 如果仍然无法连接

1. **检查安全组**：确保端口22已开放
2. **检查公钥**：确认公钥已正确添加到authorized_keys
3. **查看日志**：`journalctl -u sshd -f`
4. **使用调试模式**：`ssh -vvv -i key.pem root@IP`

## 测试连接

修复完成后，在本地测试SSH连接：

```bash
ssh -i /path/to/private_key.pem root@YOUR_SERVER_IP
```

如果连接成功，说明修复完成！

## 文件列表

- `fix_ssh_config.sh` - 自动化修复脚本
- `manual_ssh_fix.md` - 手动修复指南
- `fix_ssh_config.bat` - Windows指导文件
- `SSH_KEY_LOGIN_TROUBLESHOOTING.md` - 完整故障排除指南
- `SSH_FIX_USAGE.md` - 本使用说明

---

**注意**：这些工具仅用于修复SSH配置问题，请在受信任的环境中使用。 