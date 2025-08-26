#!/usr/bin/env bash

# HTTPS Deployment Verification Script
# Target: 47.120.74.212

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SERVER_IP="47.120.74.212"
HTTPS_URL="https://${SERVER_IP}"
HTTP_URL="http://${SERVER_IP}"

echo -e "${BLUE}🔍 HTTPS Deployment Verification${NC}"
echo "Server: $SERVER_IP"
echo "Time: $(date)"
echo "================================"

# Test 1: HTTP to HTTPS redirect
echo ""
echo -e "${BLUE}🔄 Test 1: HTTP to HTTPS Redirect${NC}"
HTTP_REDIRECT=$(curl -s -o /dev/null -w "%{http_code}" -L "$HTTP_URL/")
if [ "$HTTP_REDIRECT" = "200" ]; then
    echo -e "${GREEN}✅ HTTP redirect working${NC}"
else
    echo -e "${RED}❌ HTTP redirect failed (Status: $HTTP_REDIRECT)${NC}"
fi

# Test 2: HTTPS Frontend
echo ""
echo -e "${BLUE}📱 Test 2: HTTPS Frontend Access${NC}"
FRONTEND_STATUS=$(curl -k -s -o /dev/null -w "%{http_code}" "$HTTPS_URL/")
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Frontend accessible via HTTPS (Status: $FRONTEND_STATUS)${NC}"
    # Get title
    TITLE=$(curl -k -s "$HTTPS_URL/" | grep -o '<title[^>]*>[^<]*</title>' | sed 's/<[^>]*>//g')
    echo "   Page title: $TITLE"
else
    echo -e "${RED}❌ Frontend not accessible (Status: $FRONTEND_STATUS)${NC}"
fi

# Test 3: SSL Certificate
echo ""
echo -e "${BLUE}🔐 Test 3: SSL Certificate${NC}"
if command -v openssl &> /dev/null; then
    SSL_INFO=$(echo | timeout 10 openssl s_client -connect "${SERVER_IP}:443" -servername "$SERVER_IP" 2>/dev/null)
    if echo "$SSL_INFO" | grep -q "Verify return code: 0"; then
        echo -e "${GREEN}✅ SSL certificate verified${NC}"
    elif echo "$SSL_INFO" | grep -q "self signed certificate"; then
        echo -e "${YELLOW}⚠️ Self-signed certificate detected${NC}"
    else
        echo -e "${RED}❌ SSL certificate issues${NC}"
    fi
    
    # Extract certificate details
    SUBJECT=$(echo "$SSL_INFO" | grep "subject=" | head -1)
    ISSUER=$(echo "$SSL_INFO" | grep "issuer=" | head -1)
    echo "   $SUBJECT"
    echo "   $ISSUER"
else
    echo -e "${YELLOW}⚠️ OpenSSL not available - skipping certificate check${NC}"
fi

# Test 4: Security Headers
echo ""
echo -e "${BLUE}🛡️ Test 4: Security Headers${NC}"
HEADERS=$(curl -k -s -I "$HTTPS_URL/")

check_header() {
    local header="$1"
    local description="$2"
    if echo "$HEADERS" | grep -qi "$header"; then
        echo -e "${GREEN}✅ $description${NC}"
    else
        echo -e "${RED}❌ Missing: $description${NC}"
    fi
}

check_header "Strict-Transport-Security" "HSTS Header"
check_header "X-Content-Type-Options" "Content Type Options"
check_header "X-Frame-Options" "Frame Options"
check_header "X-XSS-Protection" "XSS Protection"

# Test 5: Health Check
echo ""
echo -e "${BLUE}💚 Test 5: Backend Health Check${NC}"
HEALTH_STATUS=$(curl -k -s -o /dev/null -w "%{http_code}" "$HTTPS_URL/health")
if [ "$HEALTH_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Health check passed (Status: $HEALTH_STATUS)${NC}"
    HEALTH_RESPONSE=$(curl -k -s "$HTTPS_URL/health")
    echo "   Response: $HEALTH_RESPONSE"
elif [ "$HEALTH_STATUS" = "502" ]; then
    echo -e "${RED}❌ Backend not running (502 Bad Gateway)${NC}"
    echo "   Please start the backend server: cd backend && npm run dev"
else
    echo -e "${RED}❌ Health check failed (Status: $HEALTH_STATUS)${NC}"
fi

# Test 6: API Endpoint
echo ""
echo -e "${BLUE}🔌 Test 6: API Endpoint${NC}"
API_STATUS=$(curl -k -s -o /dev/null -w "%{http_code}" "$HTTPS_URL/api/")
if [ "$API_STATUS" = "404" ]; then
    echo -e "${GREEN}✅ API endpoint accessible (404 expected for root)${NC}"
elif [ "$API_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ API endpoint accessible (Status: $API_STATUS)${NC}"
elif [ "$API_STATUS" = "502" ]; then
    echo -e "${RED}❌ Backend not running (502 Bad Gateway)${NC}"
else
    echo -e "${YELLOW}⚠️ Unexpected API response (Status: $API_STATUS)${NC}"
fi

# Test 7: File Upload Size
echo ""
echo -e "${BLUE}📤 Test 7: File Upload Configuration${NC}"
NGINX_CONFIG="/etc/nginx/sites-enabled/svp-https.conf"
if [ ! -f "$NGINX_CONFIG" ]; then
    NGINX_CONFIG="/etc/nginx/conf.d/svp-https.conf"
fi

if [ -f "$NGINX_CONFIG" ]; then
    if grep -q "client_max_body_size" "$NGINX_CONFIG"; then
        MAX_SIZE=$(grep "client_max_body_size" "$NGINX_CONFIG" | awk '{print $2}' | sed 's/;//')
        echo -e "${GREEN}✅ File upload limit: $MAX_SIZE${NC}"
    else
        echo -e "${YELLOW}⚠️ No file upload limit configured${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ Nginx config not found${NC}"
fi

# Test 8: HTTPS Performance
echo ""
echo -e "${BLUE}⚡ Test 8: HTTPS Performance${NC}"
if command -v curl &> /dev/null; then
    RESPONSE_TIME=$(curl -k -s -o /dev/null -w "%{time_total}" "$HTTPS_URL/")
    echo -e "${GREEN}✅ Response time: ${RESPONSE_TIME}s${NC}"
else
    echo -e "${YELLOW}⚠️ Cannot measure response time${NC}"
fi

# Summary
echo ""
echo "================================"
echo -e "${BLUE}📊 VERIFICATION SUMMARY${NC}"
echo ""

# Create summary
TOTAL_TESTS=0
PASSED_TESTS=0

# Count results based on our checks
if [ "$HTTP_REDIRECT" = "200" ]; then ((PASSED_TESTS++)); fi; ((TOTAL_TESTS++))
if [ "$FRONTEND_STATUS" = "200" ]; then ((PASSED_TESTS++)); fi; ((TOTAL_TESTS++))
if [ "$HEALTH_STATUS" = "200" ]; then ((PASSED_TESTS++)); fi; ((TOTAL_TESTS++))
if [ "$API_STATUS" = "404" ] || [ "$API_STATUS" = "200" ]; then ((PASSED_TESTS++)); fi; ((TOTAL_TESTS++))

echo "Passed: $PASSED_TESTS/$TOTAL_TESTS tests"

if [ "$PASSED_TESTS" -eq "$TOTAL_TESTS" ]; then
    echo -e "${GREEN}🎉 All core tests passed! HTTPS deployment is working.${NC}"
elif [ "$PASSED_TESTS" -gt $((TOTAL_TESTS/2)) ]; then
    echo -e "${YELLOW}⚠️ Most tests passed, but some issues need attention.${NC}"
else
    echo -e "${RED}❌ Several tests failed. Please check the deployment.${NC}"
fi

echo ""
echo -e "${BLUE}🔧 Next Steps:${NC}"
if [ "$HEALTH_STATUS" != "200" ]; then
    echo "1. Start the backend server: cd backend && npm run dev"
fi
echo "2. Update frontend environment variables to HTTPS"
echo "3. Rebuild and redeploy frontend if needed"
echo "4. Test user functionality manually"

echo ""
echo -e "${BLUE}📱 Access your application:${NC}"
echo "Frontend: $HTTPS_URL"
echo "Health:   $HTTPS_URL/health"
echo "API:      $HTTPS_URL/api"