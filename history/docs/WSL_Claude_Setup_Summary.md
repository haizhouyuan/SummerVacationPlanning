# WSL + Claude CLI 设置总结

## 设置结果

✅ **成功完成！** WSL中的Claude CLI已经正确配置并可以使用。

## 关键信息

### 网络配置
- **Windows主机IP**: 172.24.160.1
- **代理设置**: `http://172.24.160.1:7890`
- **Clash端口**: 7890 (默认HTTP代理端口)
- **Claude CLI版本**: 1.0.55

### 网络测试结果
- ✅ curl代理连接测试: 通过 (返回200状态码)
- ✅ Node.js代理连接测试: 通过 (返回403状态码，正常)
- ✅ Claude CLI网络诊断: 通过

## 已完成的设置

### 1. 代理环境变量
```bash
export HTTPS_PROXY="http://172.24.160.1:7890"
export NO_PROXY="localhost,127.0.0.1,172.24.160.1"
```

### 2. Claude CLI安装
- 已安装最新版本的 `@anthropic-ai/claude-code`
- 安装路径: `/mnt/d/nvm4w/nodejs/claude`
- 版本: 1.0.55

### 3. 永久配置
- 代理设置已添加到 `~/.bashrc`
- 每次打开WSL终端时会自动加载代理设置

## 下一步操作

### 认证方式选择

#### 方式1: OAuth登录 (推荐)
```bash
# 在WSL中运行
claude auth login
```
- 会自动打开Windows浏览器进行授权
- 无需手动管理API密钥

#### 方式2: API密钥
```bash
# 在WSL中运行
export ANTHROPIC_API_KEY="sk-xxxxxxxxxxxxxxxx"
# 永久保存
echo 'export ANTHROPIC_API_KEY="sk-xxxxxxxxxxxxxxxx"' >> ~/.bashrc
```

### 测试使用
```bash
# 简单对话测试
claude -p "hello"

# 代码相关对话
claude -p "帮我写一个Python函数"
```

## 故障排除

### 如果遇到网络问题
1. 确认Clash for Windows正在运行
2. 确认HTTP代理端口是7890
3. 运行网络测试:
   ```bash
   curl -Ik https://api.anthropic.com/v1/complete --proxy http://172.24.160.1:7890 --max-time 10
   ```

### 如果遇到认证问题
1. 运行 `claude doctor` 检查网络状态
2. 确认已正确设置API密钥或完成OAuth登录
3. 检查代理设置是否正确加载

## 重要提醒

1. **不要使用127.0.0.1**: 在WSL中必须使用Windows主机IP (172.24.160.1)
2. **每次新开WSL终端**: 代理设置会自动加载
3. **Clash端口**: 确保Clash的HTTP代理端口是7890，否则需要修改代理设置

## 设置脚本

已创建以下脚本文件:
- `setup-claude-wsl.sh`: 完整设置脚本
- `test-claude-wsl.sh`: 测试脚本
- `setup-permanent-proxy.sh`: 永久代理设置脚本

这些脚本已复制到WSL的home目录，可以重复使用。 