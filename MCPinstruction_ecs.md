以下方案按照**诊断 → 根因分析 → 一次性修复 → 长期最佳实践**四个层次展开，力求兼顾可操作性与工程严谨性。

---

## ① 快速自检：先确认是「SSH 隧道掉线」还是「ECS 本身崩溃」

| 排查点                       | 命令                                         | 解释                                    |               |                                                                   |
| ------------------------- | ------------------------------------------ | ------------------------------------- | ------------- | ----------------------------------------------------------------- |
| **隧道是否断开**                | 在 WSL 本机：\`ss -tnlp                        | grep 8082\` <br/>若无输出，说明本地 8082 监听已中断 | 隧道不在＝MCP 连接必掉 |                                                                   |
| **ECS 还能 SSH 吗**          | `ssh -o BatchMode=yes root@<IP> 'echo ok'` | 若连不上，说明服务器本身异常                        |               |                                                                   |
| **系统是否 OOM**              | \`sudo dmesg -T                            | grep -Ei 'killed process              | oom'\`        | 若出现 “Killed process …” 则是内存不足被 OOM killer 干掉([Stack Overflow][1]) |
| **阿里云诊断 (VNC/Workbench)** | 控制台点“强制重启”看能否进 VNC；若短暂恢复后再挂，多半是内存或磁盘耗尽     | Cloud 助手自身被杀也会导致 Workbench 挂掉         |               |                                                                   |

---

## ② 高频根因与对策

| 根因                                         | 现象                       | 对策                                                                                                                                |
| ------------------------------------------ | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| **SSH 隧道空闲超时 / NAT reset**                 | MCP 10‑20 min 后掉线，但系统还活着 | ① 在 `~/.ssh/config` 给该主机加 `ServerAliveInterval 60\nServerAliveCountMax 3`；② 改用 **autossh** 守护隧道（见下）([Medium][2], [Super User][3]) |
| **`claude mcp serve` 进程随 SSH 退出而被 SIGHUP** | 关闭本地终端后立刻掉线              | 用 `tmux/screen` 或 **systemd** 让服务后台常驻（示例见③‑B）                                                                                     |
| **ECS 内存不足 (1–2 GiB)**                     | 先掉 MCP → 过会儿连 SSH/VNC 都挂 | a. 临时：增加 2–4 GiB swap；b. 限制 Node 进程用量：`NODE_OPTIONS=--max-old-space-size=256`                                                     |
| **/ 磁盘塞满**                                 | `df -h` 发现 100 %         | 清理 `/var/log`、旧版本 Docker 镜像或 npm 缓存                                                                                               |

---

## ③ 一次性修复脚本

### A. 用 autossh 让本地转发“永不断”

**WSL 安装并后台守护：**

```bash
sudo apt install autossh -y

# ~/.ssh/config （节选）
Host aliyun-tun
  HostName 47.120.74.212
  User root
  IdentityFile ~/.ssh/id_rsa_aliyun
  ServerAliveInterval 60
  ServerAliveCountMax 3
  ExitOnForwardFailure yes
  ForwardAgent yes

# systemd user 服务 (本机)
mkdir -p ~/.config/systemd/user
cat > ~/.config/systemd/user/autossh-aliyun.service <<'EOF'
[Unit]
Description=AutoSSH tunnel to Aliyun for Claude MCP
After=network-online.target

[Service]
ExecStart=/usr/bin/autossh -M 0 -N -T -L 8082:localhost:8080 aliyun-tun
Restart=always
RestartSec=5

[Install]
WantedBy=default.target
EOF

systemctl --user daemon-reload
systemctl --user enable --now autossh-aliyun.service
```

> Autossh 会在隧道断掉后自动重连，无需手动干预([Medium][2])。

---

### B. 让 `claude mcp serve` 挂到后台且自动重启

> **官方 CLI 已废弃 `--listen / --addr`，请统一使用 `claude mcp serve`** ([docs.anthropic.com][4])。

**server 端 systemd 单元：**

```bash
# 远端：/etc/systemd/system/claude-mcp.service
[Unit]
Description=Claude Code MCP server
After=network.target

[Service]
Type=simple
Environment=NODE_OPTIONS=--max-old-space-size=256
ExecStart=/usr/local/bin/claude mcp serve
Restart=on-failure
RestartSec=3
User=root
WorkingDirectory=/root
# 若内存小，可加 MemoryMax=300M

[Install]
WantedBy=multi-user.target
```

```bash
# 远端执行
sudo systemctl daemon-reload
sudo systemctl enable --now claude-mcp
sudo systemctl status claude-mcp      # 确认 active (running)
```

---

### C. 补一块 4 GiB Swap（防 OOM）

```bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap  /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
sudo swapon -a
```

`free -h` 确认 swap 已生效。可同步调低 `vm.swappiness=10` 减少过度换页。

---

## ④ 长期最佳实践清单

1. **最小 2 CPU / 4 GiB 内存** 的实例才适合常驻 Node 服务；低配必须加 swap 并限内存。
2. **隧道用 autossh，服务用 systemd**：分离职责，隧道掉线不影响 MCP 进程，反之亦然。
3. **日志轮替**：`logrotate.d/claude-mcp` 每周切一次，防止 / 塞满。
4. **定期监控 OOM 与磁盘**：

   ```bash
   journalctl -u claude-mcp -n 100 --no-pager
   dmesg -T | grep -Ei 'killed process|oom'
   df -h /
   ```
5. **安全性**：

   * 禁止 password 登录，只留 publickey；
   * MCP 若公开端口，至少绑到 `127.0.0.1`，再由 ssh‑L 暴露；
   * `AllowTcpForwarding yes`、`PermitTunnel no`，避免被滥用。

---

## ⑤ 一张「从零到稳」流程图

```text
┌────────┐        ┌─────────────────────┐
│  本机  │        │   阿里云 ECS (1)    │
│  WSL   │        │  systemd: claude    │
│ autossh│<──────▶│  mcp serve (HTTP)   │
│ 8082   │  22    │                     │
└────────┘  SSH   └─────────────────────┘
     ▲                    ▲
     │                    │
     │  /ssh 或 MCP 调用  │
     └────────────────────┘
 (2) Cursor Remote‑SSH     (1) systemd 保活
```

---

### ⚡ 解决步骤汇总

1. **升级 CLI**：`npm i -g @anthropic-ai/claude-code@latest`。
2. **远端**：按③‑B 部署 `claude-mcp` 服务。
3. **本机**：按③‑A 部署 autossh 隧道。
4. **Claude Code**：`claude mcp add aliyun http://localhost:8082/mcp`（或 `/ide` 自动推断）。
5. **验证**：`claude /whoami` → `/mcp` → 运行几个命令观察 15 min 是否掉线。

按以上步骤，你应该可以彻底解决 **“连上后又断 / Workbench、VNC 无法打开”** 的两大痛点，同时把远端 MCP 服务运行得既**稳**又**省资源**。祝调试顺利!

[1]: https://stackoverflow.com/questions/624857/finding-which-process-was-killed-by-linux-oom-killer?utm_source=chatgpt.com "Finding which process was killed by Linux OOM killer - Stack Overflow"
[2]: https://medium.com/%40souri.rv/autossh-for-keeping-ssh-tunnels-alive-5c14207c6ba9?utm_source=chatgpt.com "Autossh for keeping ssh tunnels alive. | by Souri R Venkatesan"
[3]: https://superuser.com/questions/37738/how-to-reliably-keep-an-ssh-tunnel-open?utm_source=chatgpt.com "How to reliably keep an SSH tunnel open? - Super User"
[4]: https://docs.anthropic.com/en/docs/claude-code/mcp?utm_source=chatgpt.com "Model Context Protocol (MCP) - Anthropic API"
