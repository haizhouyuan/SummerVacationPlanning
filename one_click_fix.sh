#!/bin/bash
# 一键修复SSH配置脚本
# 直接在Linux服务器上执行此脚本

echo "开始修复SSH配置..."

# 备份配置文件
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak_$(date +%Y%m%d_%H%M%S)

# 修改SSH配置
sed -i 's/^#*PubkeyAuthentication.*/PubkeyAuthentication yes/' /etc/ssh/sshd_config
sed -i 's/^#*PermitRootLogin.*/PermitRootLogin yes/' /etc/ssh/sshd_config
sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication yes/' /etc/ssh/sshd_config

# 确保.ssh目录存在
mkdir -p /root/.ssh
touch /root/.ssh/authorized_keys

# 设置正确权限
chmod 700 /root/.ssh
chmod 600 /root/.ssh/authorized_keys
chown -R root:root /root/.ssh

# 验证配置
if sshd -t; then
    echo "配置验证成功，重启SSH服务..."
    systemctl restart sshd
    echo "SSH配置修复完成！"
    echo "现在可以尝试SSH连接了。"
else
    echo "配置验证失败，请检查配置文件"
    exit 1
fi  
# 修改SSH配置 
sed -i 's/#*PubkeyAuthentication.*/PubkeyAuthentication yes/' /etc/ssh/sshd_config 
sed -i 's/#*PermitRootLogin.*/PermitRootLogin yes/' /etc/ssh/sshd_config 
sed -i 's/#*PasswordAuthentication.*/PasswordAuthentication yes/' /etc/ssh/sshd_config 
 
# 确保.ssh目录存在 
mkdir -p /root/.ssh 
touch /root/.ssh/authorized_keys 
 
# 设置正确权限 
chmod 700 /root/.ssh 
chmod 600 /root/.ssh/authorized_keys 
chown -R root:root /root/.ssh 
 
# 验证配置 
if sshd -t; then 
    echo "配置验证成功，重启SSH服务..." 
    systemctl restart sshd 
    echo "SSH配置修复完成！" 
    echo "现在可以尝试SSH连接了。" 
else 
    echo "配置验证失败，请检查配置文件" 
    exit 1 
fi 
