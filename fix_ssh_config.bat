@echo off
REM SSH配置文件修复脚本 - Windows批处理版本
REM 用于在Linux服务器上执行SSH配置修复

echo ==================================
echo SSH配置文件修复脚本
echo ==================================
echo.

echo 此脚本将帮助您在Linux服务器上修复SSH配置
echo 请在Linux服务器上执行以下命令：
echo.

echo 1. 首先备份SSH配置文件：
echo    cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak_$(date +%%F)
echo.

echo 2. 编辑SSH配置文件：
echo    vim /etc/ssh/sshd_config
echo.

echo 3. 在vim中修改以下配置项：
echo    - 找到 PubkeyAuthentication 行，改为：PubkeyAuthentication yes
echo    - 找到 PermitRootLogin 行，改为：PermitRootLogin yes
echo    - 找到 PasswordAuthentication 行，改为：PasswordAuthentication yes
echo.

echo 4. 保存并退出vim（按ESC，然后输入 :wq）
echo.

echo 5. 检查SSH目录和权限：
echo    mkdir -p /root/.ssh
echo    touch /root/.ssh/authorized_keys
echo    chmod 700 /root/.ssh
echo    chmod 600 /root/.ssh/authorized_keys
echo    chown -R root:root /root/.ssh
echo.

echo 6. 验证配置并重启SSH服务：
echo    sshd -t
echo    systemctl restart sshd
echo    systemctl status sshd
echo.

echo 7. 测试SSH连接：
echo    ssh -i /path/to/private_key.pem -vvv root@YOUR_SERVER_IP
echo.

echo ==================================
echo 或者，您可以直接在Linux服务器上运行：
echo bash fix_ssh_config.sh
echo ==================================
echo.

pause 