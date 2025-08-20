#!/bin/bash

# Pre-deployment verification script for Alibaba Cloud
# This script verifies that the server environment is ready for deployment

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_step() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check system requirements
check_system() {
    print_info "Checking system requirements..."
    
    # Check OS
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        print_step "OS: $NAME $VERSION"
    else
        print_warning "Could not determine OS version"
    fi
    
    # Check memory
    local total_mem=$(free -h | awk '/^Mem:/ {print $2}')
    print_step "Total Memory: $total_mem"
    
    # Check disk space
    local disk_space=$(df -h / | awk 'NR==2 {print $4}')
    print_step "Available disk space: $disk_space"
    
    # Check CPU
    local cpu_cores=$(nproc)
    print_step "CPU cores: $cpu_cores"
}

# Check required software
check_software() {
    print_info "Checking required software..."
    
    local required_packages=("curl" "wget" "unzip" "git")
    local missing_packages=()
    
    for package in "${required_packages[@]}"; do
        if command -v $package >/dev/null 2>&1; then
            print_step "$package is installed"
        else
            print_error "$package is not installed"
            missing_packages+=($package)
        fi
    done
    
    if [ ${#missing_packages[@]} -gt 0 ]; then
        print_warning "Missing packages: ${missing_packages[*]}"
        print_info "Installing missing packages..."
        apt-get update
        apt-get install -y "${missing_packages[@]}"
    fi
}

# Install Node.js
install_nodejs() {
    print_info "Checking Node.js installation..."
    
    if command -v node >/dev/null 2>&1; then
        local node_version=$(node --version)
        print_step "Node.js is installed: $node_version"
        
        # Check if version is >= 16
        local major_version=$(echo $node_version | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$major_version" -lt 16 ]; then
            print_warning "Node.js version is too old. Installing Node.js 18..."
            install_nodejs_18
        fi
    else
        print_warning "Node.js is not installed. Installing Node.js 18..."
        install_nodejs_18
    fi
    
    # Check npm
    if command -v npm >/dev/null 2>&1; then
        local npm_version=$(npm --version)
        print_step "npm is installed: $npm_version"
    else
        print_error "npm is not installed"
        return 1
    fi
}

# Install Node.js 18
install_nodejs_18() {
    print_info "Installing Node.js 18..."
    
    # Add NodeSource repository
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    
    # Install Node.js
    apt-get install -y nodejs
    
    print_step "Node.js 18 installed successfully"
}

# Install MongoDB
install_mongodb() {
    print_info "Checking MongoDB installation..."
    
    if command -v mongod >/dev/null 2>&1; then
        print_step "MongoDB is installed"
        systemctl start mongod
        systemctl enable mongod
    else
        print_warning "MongoDB is not installed. Installing MongoDB..."
        
        # Import MongoDB public GPG key
        wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -
        
        # Add MongoDB repository
        echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
        
        # Update package database
        apt-get update
        
        # Install MongoDB
        apt-get install -y mongodb-org
        
        # Start and enable MongoDB
        systemctl start mongod
        systemctl enable mongod
        
        print_step "MongoDB installed and started"
    fi
}

# Install Nginx
install_nginx() {
    print_info "Checking Nginx installation..."
    
    if command -v nginx >/dev/null 2>&1; then
        print_step "Nginx is installed"
    else
        print_warning "Nginx is not installed. Installing Nginx..."
        
        apt-get update
        apt-get install -y nginx
        
        # Start and enable Nginx
        systemctl start nginx
        systemctl enable nginx
        
        print_step "Nginx installed and started"
    fi
}

# Install PM2
install_pm2() {
    print_info "Checking PM2 installation..."
    
    if command -v pm2 >/dev/null 2>&1; then
        print_step "PM2 is installed"
    else
        print_warning "PM2 is not installed. Installing PM2..."
        
        npm install -g pm2
        
        print_step "PM2 installed successfully"
    fi
}

# Setup project directory
setup_project_directory() {
    print_info "Setting up project directory..."
    
    local project_dir="/root/projects"
    
    if [ ! -d "$project_dir" ]; then
        mkdir -p "$project_dir"
        print_step "Created projects directory: $project_dir"
    else
        print_step "Projects directory exists: $project_dir"
    fi
    
    # Check if SummerVacationPlanning exists
    if [ -d "$project_dir/SummerVacationPlanning" ]; then
        print_step "SummerVacationPlanning directory exists"
        
        # Check if it's a git repository
        if [ -d "$project_dir/SummerVacationPlanning/.git" ]; then
            print_step "Project is a git repository"
        else
            print_warning "Project directory exists but is not a git repository"
        fi
    else
        print_warning "SummerVacationPlanning directory does not exist"
        print_info "You need to clone the repository to $project_dir/SummerVacationPlanning"
    fi
}

# Check network connectivity
check_network() {
    print_info "Checking network connectivity..."
    
    # Test internet connectivity
    if curl -s -f https://www.google.com >/dev/null 2>&1; then
        print_step "Internet connectivity is working"
    else
        print_error "No internet connectivity"
        return 1
    fi
    
    # Test npm registry
    if curl -s -f https://registry.npmjs.org >/dev/null 2>&1; then
        print_step "npm registry is accessible"
    else
        print_warning "npm registry is not accessible"
    fi
    
    # Test GitHub connectivity
    if curl -s -f https://github.com >/dev/null 2>&1; then
        print_step "GitHub is accessible"
    else
        print_warning "GitHub is not accessible"
    fi
}

# Check security settings
check_security() {
    print_info "Checking security settings..."
    
    # Check if UFW is installed
    if command -v ufw >/dev/null 2>&1; then
        print_step "UFW firewall is installed"
        local ufw_status=$(ufw status | head -1)
        print_info "UFW status: $ufw_status"
    else
        print_warning "UFW firewall is not installed"
    fi
    
    # Check SSH configuration
    if [ -f /etc/ssh/sshd_config ]; then
        print_step "SSH is configured"
        
        # Check if root login is enabled
        if grep -q "^PermitRootLogin yes" /etc/ssh/sshd_config; then
            print_warning "Root SSH login is enabled (security consideration)"
        fi
    fi
}

# Generate deployment report
generate_report() {
    print_info "Generating pre-deployment report..."
    
    local report_file="/tmp/pre-deployment-report.txt"
    
    cat > "$report_file" << EOF
Pre-deployment Verification Report
Generated on: $(date)
Server: $(hostname -I | awk '{print $1}')

System Information:
- OS: $(lsb_release -d | cut -f2)
- Kernel: $(uname -r)
- Memory: $(free -h | awk '/^Mem:/ {print $2}')
- Disk Space: $(df -h / | awk 'NR==2 {print $4}')
- CPU Cores: $(nproc)

Software Versions:
- Node.js: $(node --version 2>/dev/null || echo "Not installed")
- npm: $(npm --version 2>/dev/null || echo "Not installed")
- MongoDB: $(mongod --version 2>/dev/null | head -1 | awk '{print $3}' || echo "Not installed")
- Nginx: $(nginx -v 2>&1 | awk '{print $3}' || echo "Not installed")
- PM2: $(pm2 --version 2>/dev/null || echo "Not installed")

Network Connectivity:
- Internet: $(curl -s -f https://www.google.com >/dev/null 2>&1 && echo "OK" || echo "Failed")
- npm registry: $(curl -s -f https://registry.npmjs.org >/dev/null 2>&1 && echo "OK" || echo "Failed")
- GitHub: $(curl -s -f https://github.com >/dev/null 2>&1 && echo "OK" || echo "Failed")

Project Directory:
- /root/projects exists: $([ -d /root/projects ] && echo "Yes" || echo "No")
- SummerVacationPlanning exists: $([ -d /root/projects/SummerVacationPlanning ] && echo "Yes" || echo "No")
- Is git repository: $([ -d /root/projects/SummerVacationPlanning/.git ] && echo "Yes" || echo "No")

Services Status:
- MongoDB: $(systemctl is-active mongod 2>/dev/null || echo "Not running")
- Nginx: $(systemctl is-active nginx 2>/dev/null || echo "Not running")

Security:
- UFW installed: $(command -v ufw >/dev/null 2>&1 && echo "Yes" || echo "No")
- UFW status: $(ufw status 2>/dev/null | head -1 || echo "Not available")
EOF

    print_step "Report generated: $report_file"
    echo ""
    print_info "Report contents:"
    cat "$report_file"
}

# Main function
main() {
    echo -e "${BLUE}🔍 Pre-deployment Verification for Alibaba Cloud${NC}"
    echo "================================================="
    echo ""
    
    # Check if running as root
    if [[ $EUID -ne 0 ]]; then
        print_error "This script must be run as root"
        exit 1
    fi
    
    check_system
    check_network
    check_software
    install_nodejs
    install_mongodb
    install_nginx
    install_pm2
    setup_project_directory
    check_security
    generate_report
    
    echo ""
    print_step "🎉 Pre-deployment verification completed!"
    echo ""
    print_info "Server is ready for deployment. You can now run:"
    print_info "  ./aliyun-deploy.sh"
}

# Handle script interruption
trap 'print_error "Verification interrupted"; exit 1' INT

# Run main function
main "$@"