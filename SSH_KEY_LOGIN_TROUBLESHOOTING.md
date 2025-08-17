# Linux ECS SSH密钥登录故障排除指南

## 故障根因思路

Linux ECS 实例无法使用 **SSH 密钥** 登录，最常见的原因就是 **`/etc/ssh/sshd_config` 中关闭了 PubkeyAuthentication**，或公钥未正确写入 `authorized_keys`。因此，我们要先通过 **VNC/控制台** 进入服务器，恢复 SSH 服务对密钥认证的支持，再核对密钥文件与权限，最后重启 `sshd`。

---

## 详细排查与修复步骤

> 以下操作均以 **root** 身份执行，服务器信息：`root@172.28.148.156:22`，实例 ID：`i-f8z3uu2ea9wt48g6j5yo`。

### 1. 通过 VNC 或会话管理进入实例

1. 登录 **阿里云控制台 → ECS → 实例列表**。
2. 找到 `launch-advisor-20240321`，单击 **远程连接 → VNC**。
3. 若忘记密码，可在实例 **更多 → 重置实例密码** 设置一个临时密码后再 VNC 登录。
4. 成功进入系统提示符后继续下一步。

> 若控制台支持 **ECS Instance Connect**，也可以直接使用浏览器终端进入，无需密码。

---

### 2. 检查并修改 `/etc/ssh/sshd_config`

```bash
# 备份旧配置
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak_$(date +%F)

# 打开配置文件
vim /etc/ssh/sshd_config
```

确保以下关键参数为 **yes/允许**：

```plain
PubkeyAuthentication yes        # 启用密钥认证
PermitRootLogin yes             # 暂时允许 root，用完可改回 prohibit-password
AuthorizedKeysFile .ssh/authorized_keys
# 如需保留密码登录，可设 PasswordAuthentication yes；若仅想用密钥，改为 no
```

保存并退出（`:wq`）。

> 任何改动都建议保留注释并记录变更原因，便于后续审计。

---

### 3. 核对公钥与文件权限

```bash
# 确认密钥目录及文件存在
ls -ld /root/.ssh
ls -l  /root/.ssh/authorized_keys

# 如果公钥缺失，可从本地复制或直接粘贴
echo "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQ..." >> /root/.ssh/authorized_keys
```

严格权限要求（过宽会被 sshd 拒绝）：

```bash
chmod 700 /root/.ssh
chmod 600 /root/.ssh/authorized_keys
chown -R root:root /root/.ssh
```

---

### 4. 重启 SSH 服务并验证

```bash
systemctl restart sshd     # 或 service sshd restart
systemctl status  sshd -l  # 确认运行正常
```

随后在本地执行 **调试登录**：

```bash
ssh -i /path/to/private_key.pem -vvv root@172.28.148.156
```

* 如仍拒绝，请留意 `-vvv` 输出中的 **Authentication**, **Permission denied** 等信息定位。
* 若安全组/防火墙阻断，请确认 **22/TCP** 已放行。

---

### 5. 可选：一键重置 / 注入新密钥

若仍无法恢复，可在控制台 **更多 → 更换/重置实例 SSH 密钥对**，系统会自动注入新公钥并重启实例，适用于不方便手动编辑磁盘的场景。

---

## 安全加固建议

1. **验证通过后**，建议再次将 `PermitRootLogin` 调整为 `prohibit-password` 或 `without-password`，并为日常运维创建普通用户。
2. 关闭未使用的登录方式，例如设置 `PasswordAuthentication no` 以避免暴力密码破解。
3. 配置 **Fail2ban / sshguard** 或使用 **云安全中心** 提供的防护策略，限制异常登录尝试。
4. 定期轮换密钥并保持私钥离线安全存储。

---

## 常见错误及解决方案

### 错误1: "No supported authentication methods available"
- **原因**: SSH配置中禁用了所有认证方式
- **解决**: 检查并启用 `PubkeyAuthentication yes`

### 错误2: "Permission denied (publickey)"
- **原因**: 公钥未正确配置或权限设置错误
- **解决**: 检查 `authorized_keys` 文件内容和权限

### 错误3: "Connection refused"
- **原因**: SSH服务未运行或防火墙阻止
- **解决**: 启动SSH服务并检查安全组配置

---

## 参考链接

- [阿里云帮助中心 - SSH连接问题排查](https://help.aliyun.com/zh/ecs/user-guide/the-disconnected-no-supported-authentication-methods-available-error-occurs-when-you-log-on-to-a-linux-instance-by-ssh)

---

按照以上流程操作后，您即可重新使用公钥正常 SSH 登录。如遇特殊错误提示，可提供 `ssh -vvv` 输出的关键行，我再帮您进一步分析。祝一切顺利！ 