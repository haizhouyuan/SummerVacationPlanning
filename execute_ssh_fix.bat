@echo off
chcp 65001 >nul
echo ========================================
echo SSH配置修复执行器
echo ========================================
echo.

echo 正在准备SSH修复脚本...
echo.

REM 检查是否存在一键修复脚本
if exist "one_click_fix.sh" (
    echo ✓ 找到一键修复脚本: one_click_fix.sh
) else (
    echo ✗ 未找到一键修复脚本
    echo 正在创建...
    echo #!/bin/bash > one_click_fix.sh
    echo # 一键修复SSH配置脚本 >> one_click_fix.sh
    echo # 直接在Linux服务器上执行此脚本 >> one_click_fix.sh
    echo. >> one_click_fix.sh
    echo echo "开始修复SSH配置..." >> one_click_fix.sh
    echo. >> one_click_fix.sh
    echo # 备份配置文件 >> one_click_fix.sh
    echo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak_$(date +%%Y%%m%%d_%%H%%M%%S) >> one_click_fix.sh
    echo. >> one_click_fix.sh
    echo # 修改SSH配置 >> one_click_fix.sh
    echo sed -i 's/^#*PubkeyAuthentication.*/PubkeyAuthentication yes/' /etc/ssh/sshd_config >> one_click_fix.sh
    echo sed -i 's/^#*PermitRootLogin.*/PermitRootLogin yes/' /etc/ssh/sshd_config >> one_click_fix.sh
    echo sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication yes/' /etc/ssh/sshd_config >> one_click_fix.sh
    echo. >> one_click_fix.sh
    echo # 确保.ssh目录存在 >> one_click_fix.sh
    echo mkdir -p /root/.ssh >> one_click_fix.sh
    echo touch /root/.ssh/authorized_keys >> one_click_fix.sh
    echo. >> one_click_fix.sh
    echo # 设置正确权限 >> one_click_fix.sh
    echo chmod 700 /root/.ssh >> one_click_fix.sh
    echo chmod 600 /root/.ssh/authorized_keys >> one_click_fix.sh
    echo chown -R root:root /root/.ssh >> one_click_fix.sh
    echo. >> one_click_fix.sh
    echo # 验证配置 >> one_click_fix.sh
    echo if sshd -t; then >> one_click_fix.sh
    echo     echo "配置验证成功，重启SSH服务..." >> one_click_fix.sh
    echo     systemctl restart sshd >> one_click_fix.sh
    echo     echo "SSH配置修复完成！" >> one_click_fix.sh
    echo     echo "现在可以尝试SSH连接了。" >> one_click_fix.sh
    echo else >> one_click_fix.sh
    echo     echo "配置验证失败，请检查配置文件" >> one_click_fix.sh
    echo     exit 1 >> one_click_fix.sh
    echo fi >> one_click_fix.sh
)

echo.
echo ========================================
echo 执行步骤说明
echo ========================================
echo.

echo 由于我无法直接访问您的Linux服务器，请按照以下步骤操作：
echo.

echo 1. 通过阿里云控制台VNC连接到您的Linux服务器
echo    - 登录阿里云控制台
echo    - 找到您的ECS实例
echo    - 点击"远程连接" → "VNC"
echo.

echo 2. 将修复脚本上传到服务器（选择一种方式）：
echo.
echo    方式A：通过VNC复制粘贴
echo    - 在VNC中右键粘贴以下命令：
echo.

echo    cat > /tmp/one_click_fix.sh << 'EOF'
type one_click_fix.sh
echo EOF
echo.

echo    方式B：通过SCP上传（如果SSH可用）
echo    - 在Windows命令行执行：
echo    scp one_click_fix.sh root@YOUR_SERVER_IP:/tmp/
echo.

echo 3. 在Linux服务器上执行修复脚本：
echo    cd /tmp
echo    chmod +x one_click_fix.sh
echo    ./one_click_fix.sh
echo.

echo 4. 测试SSH连接：
echo    ssh -i /path/to/your/private_key.pem root@YOUR_SERVER_IP
echo.

echo ========================================
echo 手动执行命令（如果脚本失败）
echo ========================================
echo.

echo 如果脚本执行失败，请手动执行以下命令：
echo.

echo # 备份配置
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

echo # 验证和重启
echo sshd -t
echo systemctl restart sshd
echo systemctl status sshd
echo.

echo ========================================
echo 故障排除
echo ========================================
echo.

echo 如果仍然无法连接：
echo 1. 检查阿里云安全组是否开放22端口
echo 2. 确认公钥已添加到authorized_keys文件
echo 3. 查看SSH服务日志：journalctl -u sshd -f
echo 4. 使用调试模式：ssh -vvv -i key.pem root@IP
echo.

echo ========================================
echo 安全加固（连接成功后）
echo ========================================
echo.

echo 连接成功后，建议执行安全加固：
echo vim /etc/ssh/sshd_config
echo # 修改为：
echo # PermitRootLogin prohibit-password
echo # PasswordAuthentication no
echo # systemctl restart sshd
echo.

pause 