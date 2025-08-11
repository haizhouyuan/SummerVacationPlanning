@echo off
echo ========================================
echo SSH配置修复指导
echo ========================================
echo.

echo 请按照以下步骤修复SSH配置：
echo.

echo 1. 通过阿里云控制台VNC连接到您的Linux服务器
echo    - 登录阿里云控制台
echo    - 找到您的ECS实例
echo    - 点击"远程连接" → "VNC"
echo.

echo 2. 在VNC中执行以下命令（逐行复制粘贴）：
echo.

echo # 备份配置文件
echo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak_$(date +%%Y%%m%%d_%%H%%M%%S)
echo.

echo # 修改SSH配置
echo sed -i 's/^#*PubkeyAuthentication.*/PubkeyAuthentication yes/' /etc/ssh/sshd_config
echo sed -i 's/^#*PermitRootLogin.*/PermitRootLogin yes/' /etc/ssh/sshd_config
echo sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication yes/' /etc/ssh/sshd_config
echo.

echo # 创建SSH目录和文件
echo mkdir -p /root/.ssh
echo touch /root/.ssh/authorized_keys
echo.

echo # 设置权限
echo chmod 700 /root/.ssh
echo chmod 600 /root/.ssh/authorized_keys
echo chown -R root:root /root/.ssh
echo.

echo # 验证配置
echo sshd -t
echo.

echo # 重启SSH服务
echo systemctl restart sshd
echo.

echo # 检查服务状态
echo systemctl status sshd
echo.

echo 3. 测试SSH连接：
echo    ssh -i /path/to/your/private_key.pem root@YOUR_SERVER_IP
echo.

echo ========================================
echo 如果仍然无法连接，请检查：
echo 1. 阿里云安全组是否开放22端口
echo 2. 公钥是否正确添加到authorized_keys
echo 3. 私钥文件权限是否为600
echo ========================================
echo.

pause 