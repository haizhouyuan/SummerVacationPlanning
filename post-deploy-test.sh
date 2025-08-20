#!/bin/bash

# Post-deployment testing script for SummerVacationPlanning
# Tests all major functionality after deployment

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SERVER_URL="http://47.120.74.212"
API_URL="$SERVER_URL/api"
TIMEOUT=30

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

# Test frontend accessibility
test_frontend() {
    print_info "Testing frontend accessibility..."
    
    local response=$(curl -s -w "%{http_code}" -o /dev/null --connect-timeout $TIMEOUT "$SERVER_URL")
    
    if [ "$response" = "200" ]; then
        print_step "Frontend is accessible (HTTP 200)"
    else
        print_error "Frontend is not accessible (HTTP $response)"
        return 1
    fi
    
    # Test if HTML content is served
    local content=$(curl -s --connect-timeout $TIMEOUT "$SERVER_URL" | head -c 100)
    if [[ $content == *"<!DOCTYPE html>"* ]]; then
        print_step "Frontend serves HTML content"
    else
        print_warning "Frontend might not be serving proper HTML"
    fi
}

# Test backend API health
test_backend_health() {
    print_info "Testing backend API health..."
    
    local response=$(curl -s -w "%{http_code}" -o /dev/null --connect-timeout $TIMEOUT "$API_URL/health")
    
    if [ "$response" = "200" ]; then
        print_step "Backend API health check passed"
    else
        print_error "Backend API health check failed (HTTP $response)"
        return 1
    fi
}

# Test authentication endpoints
test_auth_endpoints() {
    print_info "Testing authentication endpoints..."
    
    # Test registration endpoint
    local reg_response=$(curl -s -w "%{http_code}" -o /dev/null \
        --connect-timeout $TIMEOUT \
        -X POST \
        -H "Content-Type: application/json" \
        -d '{"username":"test_user_' "$(date +%s)" '","email":"test@example.com","password":"testpass123","role":"student"}' \
        "$API_URL/auth/register")
    
    if [ "$reg_response" = "201" ] || [ "$reg_response" = "409" ]; then
        print_step "Registration endpoint is working"
    else
        print_warning "Registration endpoint returned HTTP $reg_response"
    fi
    
    # Test login endpoint
    local login_response=$(curl -s -w "%{http_code}" -o /dev/null \
        --connect-timeout $TIMEOUT \
        -X POST \
        -H "Content-Type: application/json" \
        -d '{"username":"testuser","password":"wrongpassword"}' \
        "$API_URL/auth/login")
    
    if [ "$login_response" = "401" ] || [ "$login_response" = "404" ]; then
        print_step "Login endpoint is working (correctly rejected bad credentials)"
    else
        print_warning "Login endpoint returned HTTP $login_response"
    fi
}

# Test CORS configuration
test_cors() {
    print_info "Testing CORS configuration..."
    
    local cors_response=$(curl -s -I \
        --connect-timeout $TIMEOUT \
        -H "Origin: $SERVER_URL" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: Content-Type" \
        -X OPTIONS \
        "$API_URL/auth/login")
    
    if echo "$cors_response" | grep -q "Access-Control-Allow-Origin"; then
        print_step "CORS is properly configured"
    else
        print_warning "CORS headers not found"
    fi
}

# Test file upload endpoint
test_file_upload() {
    print_info "Testing file upload endpoint..."
    
    # Create a small test file
    local test_file="/tmp/test_upload.txt"
    echo "Test file for upload validation" > "$test_file"
    
    local upload_response=$(curl -s -w "%{http_code}" -o /dev/null \
        --connect-timeout $TIMEOUT \
        -X POST \
        -F "file=@$test_file" \
        "$API_URL/upload/evidence")
    
    # Cleanup test file
    rm -f "$test_file"
    
    # File upload should fail without authentication (401) or work (200)
    if [ "$upload_response" = "401" ] || [ "$upload_response" = "200" ]; then
        print_step "File upload endpoint is working"
    else
        print_warning "File upload endpoint returned HTTP $upload_response"
    fi
}

# Test database connectivity
test_database() {
    print_info "Testing database connectivity..."
    
    # Test if MongoDB is running
    if systemctl is-active --quiet mongod; then
        print_step "MongoDB service is running"
    else
        print_error "MongoDB service is not running"
        return 1
    fi
    
    # Test database connection via API
    local db_response=$(curl -s -w "%{http_code}" -o /dev/null \
        --connect-timeout $TIMEOUT \
        "$API_URL/tasks")
    
    if [ "$db_response" = "200" ] || [ "$db_response" = "401" ]; then
        print_step "Database connectivity through API is working"
    else
        print_warning "Database API returned HTTP $db_response"
    fi
}

# Test PM2 processes
test_pm2_processes() {
    print_info "Testing PM2 processes..."
    
    local pm2_status=$(pm2 jlist 2>/dev/null)
    
    if echo "$pm2_status" | grep -q "summer-vacation-backend"; then
        local app_status=$(echo "$pm2_status" | jq -r '.[] | select(.name=="summer-vacation-backend") | .pm2_env.status' 2>/dev/null)
        
        if [ "$app_status" = "online" ]; then
            print_step "PM2 backend process is online"
        else
            print_error "PM2 backend process status: $app_status"
            return 1
        fi
    else
        print_error "PM2 backend process not found"
        return 1
    fi
    
    # Check process uptime
    local uptime=$(echo "$pm2_status" | jq -r '.[] | select(.name=="summer-vacation-backend") | .pm2_env.pm_uptime' 2>/dev/null)
    if [ -n "$uptime" ] && [ "$uptime" != "null" ]; then
        local uptime_seconds=$(( ($(date +%s) * 1000 - $uptime) / 1000 ))
        print_step "Backend uptime: ${uptime_seconds}s"
    fi
}

# Test Nginx configuration
test_nginx() {
    print_info "Testing Nginx configuration..."
    
    # Test Nginx service status
    if systemctl is-active --quiet nginx; then
        print_step "Nginx service is running"
    else
        print_error "Nginx service is not running"
        return 1
    fi
    
    # Test Nginx configuration syntax
    if nginx -t 2>/dev/null; then
        print_step "Nginx configuration is valid"
    else
        print_error "Nginx configuration has syntax errors"
        return 1
    fi
    
    # Test proxy functionality
    local proxy_response=$(curl -s -w "%{http_code}" -o /dev/null \
        --connect-timeout $TIMEOUT \
        "$SERVER_URL/api/health")
    
    if [ "$proxy_response" = "200" ]; then
        print_step "Nginx proxy to backend is working"
    else
        print_warning "Nginx proxy returned HTTP $proxy_response"
    fi
}

# Test security headers
test_security_headers() {
    print_info "Testing security headers..."
    
    local headers=$(curl -s -I --connect-timeout $TIMEOUT "$SERVER_URL")
    
    local security_headers=("X-Frame-Options" "X-Content-Type-Options" "X-XSS-Protection")
    local missing_headers=()
    
    for header in "${security_headers[@]}"; do
        if echo "$headers" | grep -qi "$header"; then
            print_step "$header header is present"
        else
            missing_headers+=("$header")
        fi
    done
    
    if [ ${#missing_headers[@]} -gt 0 ]; then
        print_warning "Missing security headers: ${missing_headers[*]}"
    else
        print_step "All security headers are present"
    fi
}

# Test performance metrics
test_performance() {
    print_info "Testing performance metrics..."
    
    # Test response times
    local start_time=$(date +%s.%N)
    curl -s --connect-timeout $TIMEOUT "$SERVER_URL" >/dev/null
    local end_time=$(date +%s.%N)
    local response_time=$(echo "$end_time - $start_time" | bc 2>/dev/null || echo "unknown")
    
    if [[ $response_time =~ ^[0-9]+\.[0-9]+$ ]]; then
        print_step "Frontend response time: ${response_time}s"
        
        if (( $(echo "$response_time > 2" | bc -l 2>/dev/null || echo 0) )); then
            print_warning "Response time is slow (>2s)"
        fi
    else
        print_info "Response time: $response_time"
    fi
    
    # Test API response time
    start_time=$(date +%s.%N)
    curl -s --connect-timeout $TIMEOUT "$API_URL/health" >/dev/null 2>&1
    end_time=$(date +%s.%N)
    response_time=$(echo "$end_time - $start_time" | bc 2>/dev/null || echo "unknown")
    
    if [[ $response_time =~ ^[0-9]+\.[0-9]+$ ]]; then
        print_step "API response time: ${response_time}s"
    else
        print_info "API response time: $response_time"
    fi
}

# Test log files
test_logs() {
    print_info "Testing log files..."
    
    local log_dir="/root/projects/SummerVacationPlanning/logs"
    
    if [ -d "$log_dir" ]; then
        print_step "Log directory exists"
        
        # Check for log files
        local log_files=$(find "$log_dir" -name "*.log" -type f 2>/dev/null)
        if [ -n "$log_files" ]; then
            print_step "Log files are being created"
            
            # Check recent log entries
            local recent_logs=$(find "$log_dir" -name "*.log" -type f -mmin -5 2>/dev/null)
            if [ -n "$recent_logs" ]; then
                print_step "Recent log entries found"
            else
                print_warning "No recent log entries (last 5 minutes)"
            fi
        else
            print_warning "No log files found"
        fi
    else
        print_warning "Log directory does not exist"
    fi
}

# Generate test report
generate_test_report() {
    print_info "Generating post-deployment test report..."
    
    local report_file="/tmp/post-deployment-test-report.txt"
    local timestamp=$(date)
    
    cat > "$report_file" << EOF
Post-deployment Test Report
Generated on: $timestamp
Server: $SERVER_URL

Test Results Summary:
$(echo "$test_results")

Detailed Information:
- Frontend URL: $SERVER_URL
- Backend API URL: $API_URL
- Test Duration: $(date -d "$start_time" +'%H:%M:%S') - $(date +'%H:%M:%S')

System Status:
- Nginx: $(systemctl is-active nginx 2>/dev/null || echo "unknown")
- MongoDB: $(systemctl is-active mongod 2>/dev/null || echo "unknown")
- PM2 Backend: $(pm2 jlist 2>/dev/null | jq -r '.[] | select(.name=="summer-vacation-backend") | .pm2_env.status' 2>/dev/null || echo "unknown")

Performance:
- Frontend response time: $(curl -s -w "%{time_total}" -o /dev/null --connect-timeout 10 "$SERVER_URL" 2>/dev/null || echo "timeout")s
- API response time: $(curl -s -w "%{time_total}" -o /dev/null --connect-timeout 10 "$API_URL/health" 2>/dev/null || echo "timeout")s

Security:
- Security headers present: $(curl -s -I "$SERVER_URL" 2>/dev/null | grep -c -i "x-frame-options\|x-content-type-options\|x-xss-protection" || echo "0")

Recommendations:
1. Monitor application logs regularly
2. Set up automated backups for MongoDB
3. Configure SSL/TLS certificate for HTTPS
4. Implement log rotation for application logs
5. Set up monitoring and alerting system
EOF

    print_step "Test report generated: $report_file"
    echo ""
    print_info "Report contents:"
    cat "$report_file"
}

# Main function
main() {
    local start_time=$(date)
    local test_results=""
    local failed_tests=0
    
    echo -e "${BLUE}🧪 Post-deployment Testing for SummerVacationPlanning${NC}"
    echo "======================================================="
    echo "Server: $SERVER_URL"
    echo "Started: $start_time"
    echo ""
    
    # Run all tests and collect results
    local tests=(
        "test_frontend:Frontend Accessibility"
        "test_backend_health:Backend Health"
        "test_auth_endpoints:Authentication Endpoints"
        "test_cors:CORS Configuration"
        "test_file_upload:File Upload"
        "test_database:Database Connectivity"
        "test_pm2_processes:PM2 Processes"
        "test_nginx:Nginx Configuration"
        "test_security_headers:Security Headers"
        "test_performance:Performance Metrics"
        "test_logs:Log Files"
    )
    
    for test_info in "${tests[@]}"; do
        local test_func="${test_info%%:*}"
        local test_name="${test_info##*:}"
        
        echo ""
        if $test_func; then
            test_results="${test_results}✓ $test_name: PASSED\n"
        else
            test_results="${test_results}✗ $test_name: FAILED\n"
            ((failed_tests++))
        fi
    done
    
    echo ""
    echo "======================================================="
    
    if [ $failed_tests -eq 0 ]; then
        print_step "🎉 All tests passed! Deployment is successful."
    else
        print_warning "⚠ $failed_tests test(s) failed. Please review the issues above."
    fi
    
    generate_test_report
    
    echo ""
    print_info "Access your application at: $SERVER_URL"
    print_info "API documentation available at: $API_URL"
    
    exit $failed_tests
}

# Handle script interruption
trap 'print_error "Testing interrupted"; exit 1' INT

# Run main function
main "$@"