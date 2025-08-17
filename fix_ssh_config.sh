#!/bin/bash

# SSH配置文件修复脚本
# 用于修复Linux ECS实例的SSH密钥登录问题
# 作者: AI Assistant
# 日期: $(date +%Y-%m-%d)

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否为root用户
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "此脚本需要root权限运行"
        log_info "请使用: sudo $0"
        exit 1
    fi
}

# 备份SSH配置文件
backup_ssh_config() {
    local config_file="/etc/ssh/sshd_config"
    local backup_file="/etc/ssh/sshd_config.bak_$(date +%Y%m%d_%H%M%S)"
    
    log_info "备份SSH配置文件..."
    if cp "$config_file" "$backup_file"; then
        log_success "配置文件已备份到: $backup_file"
    else
        log_error "备份失败"
        exit 1
    fi
}

# 修改SSH配置文件
modify_ssh_config() {
    local config_file="/etc/ssh/sshd_config"
    
    log_info "修改SSH配置文件..."
    
    # 创建临时配置文件
    local temp_file=$(mktemp)
    
    # 读取原配置文件并修改关键参数
    while IFS= read -r line; do
        case "$line" in
            # 注释掉或修改PubkeyAuthentication
            "PubkeyAuthentication no"|"#PubkeyAuthentication yes")
                echo "PubkeyAuthentication yes"
                log_info "启用密钥认证"
                ;;
            # 注释掉或修改PermitRootLogin
            "PermitRootLogin no"|"PermitRootLogin prohibit-password"|"#PermitRootLogin yes")
                echo "PermitRootLogin yes"
                log_warning "临时允许root登录（修复完成后建议改回prohibit-password）"
                ;;
            # 注释掉或修改PasswordAuthentication
            "PasswordAuthentication no"|"#PasswordAuthentication yes")
                echo "PasswordAuthentication yes"
                log_info "启用密码认证（临时）"
                ;;
            # 确保AuthorizedKeysFile配置正确
            "AuthorizedKeysFile"*)
                echo "AuthorizedKeysFile .ssh/authorized_keys"
                log_info "设置授权密钥文件路径"
                ;;
            # 保持其他行不变
            *)
                echo "$line"
                ;;
        esac
    done < "$config_file" > "$temp_file"
    
    # 检查是否找到了需要修改的配置项
    if ! grep -q "PubkeyAuthentication yes" "$temp_file"; then
        echo "" >> "$temp_file"
        echo "# 自动添加的SSH配置修复" >> "$temp_file"
        echo "PubkeyAuthentication yes" >> "$temp_file"
        log_info "添加密钥认证配置"
    fi
    
    if ! grep -q "PermitRootLogin yes" "$temp_file"; then
        echo "PermitRootLogin yes" >> "$temp_file"
        log_warning "添加root登录配置"
    fi
    
    # 替换原配置文件
    if mv "$temp_file" "$config_file"; then
        log_success "SSH配置文件修改完成"
    else
        log_error "配置文件替换失败"
        exit 1
    fi
}

# 检查并修复SSH目录和文件权限
fix_ssh_permissions() {
    log_info "检查SSH目录和文件权限..."
    
    # 创建.ssh目录（如果不存在）
    if [[ ! -d "/root/.ssh" ]]; then
        mkdir -p /root/.ssh
        log_info "创建.ssh目录"
    fi
    
    # 创建authorized_keys文件（如果不存在）
    if [[ ! -f "/root/.ssh/authorized_keys" ]]; then
        touch /root/.ssh/authorized_keys
        log_info "创建authorized_keys文件"
    fi
    
    # 设置正确的权限
    chmod 700 /root/.ssh
    chmod 600 /root/.ssh/authorized_keys
    chown -R root:root /root/.ssh
    
    log_success "SSH目录和文件权限已修复"
}

# 验证SSH配置
validate_ssh_config() {
    log_info "验证SSH配置..."
    
    if sshd -t; then
        log_success "SSH配置语法正确"
    else
        log_error "SSH配置语法错误，请检查配置文件"
        exit 1
    fi
}

# 重启SSH服务
restart_ssh_service() {
    log_info "重启SSH服务..."
    
    if systemctl restart sshd; then
        log_success "SSH服务重启成功"
    else
        log_error "SSH服务重启失败"
        exit 1
    fi
    
    # 检查服务状态
    if systemctl is-active --quiet sshd; then
        log_success "SSH服务运行正常"
    else
        log_error "SSH服务未正常运行"
        exit 1
    fi
}

# 显示配置摘要
show_config_summary() {
    log_info "配置修改摘要:"
    echo "=================================="
    echo "PubkeyAuthentication: $(grep '^PubkeyAuthentication' /etc/ssh/sshd_config || echo '未找到')"
    echo "PermitRootLogin: $(grep '^PermitRootLogin' /etc/ssh/sshd_config || echo '未找到')"
    echo "PasswordAuthentication: $(grep '^PasswordAuthentication' /etc/ssh/sshd_config || echo '未找到')"
    echo "AuthorizedKeysFile: $(grep '^AuthorizedKeysFile' /etc/ssh/sshd_config || echo '未找到')"
    echo "=================================="
}

# 显示后续步骤
show_next_steps() {
    log_info "后续步骤:"
    echo "1. 在本地测试SSH连接:"
    echo "   ssh -i /path/to/private_key.pem -vvv root@YOUR_SERVER_IP"
    echo ""
    echo "2. 连接成功后，建议进行安全加固:"
    echo "   - 将PermitRootLogin改回prohibit-password"
    echo "   - 关闭PasswordAuthentication"
    echo "   - 配置Fail2ban等安全工具"
    echo ""
    echo "3. 如果仍有问题，请检查:"
    echo "   - 安全组配置（端口22）"
    echo "   - 公钥是否正确添加到authorized_keys"
    echo "   - 私钥文件权限（600）"
}

# 主函数
main() {
    echo "=================================="
    echo "SSH配置文件修复脚本"
    echo "=================================="
    echo ""
    
    check_root
    backup_ssh_config
    modify_ssh_config
    fix_ssh_permissions
    validate_ssh_config
    restart_ssh_service
    show_config_summary
    show_next_steps
    
    echo ""
    log_success "SSH配置修复完成！"
}

# 运行主函数
main "$@" 