#!/bin/bash

echo "🧪 Testing Summer Vacation Planning App Deployment"
echo "================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SERVER_IP="47.120.74.212"
BASE_URL="http://${SERVER_IP}"

# Test 1: Frontend accessibility
echo -e "\n${YELLOW}Test 1: Frontend Accessibility${NC}"
if curl -s "${BASE_URL}" | grep -q "React App"; then
    echo -e "${GREEN}✅ Frontend is accessible${NC}"
else
    echo -e "${RED}❌ Frontend is not accessible${NC}"
fi

# Test 2: API Health Check
echo -e "\n${YELLOW}Test 2: API Health Check${NC}"
if curl -s "${BASE_URL}/api/health" | grep -q '"status":"OK"'; then
    echo -e "${GREEN}✅ API health check passed${NC}"
else
    echo -e "${RED}❌ API health check failed${NC}"
fi

# Test 3: User Registration
echo -e "\n${YELLOW}Test 3: User Registration${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/auth/register" \
    -H "Content-Type: application/json" \
    -d '{"email":"testuser@example.com","password":"password123","displayName":"Test User","role":"parent"}')

if echo "$REGISTER_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ User registration successful${NC}"
else
    echo -e "${RED}❌ User registration failed${NC}"
    echo "Response: $REGISTER_RESPONSE"
fi

# Test 4: User Login
echo -e "\n${YELLOW}Test 4: User Login${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"testuser@example.com","password":"password123"}')

if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ User login successful${NC}"
    # Extract token for further tests
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    echo -e "${GREEN}Token extracted: ${TOKEN:0:20}...${NC}"
else
    echo -e "${RED}❌ User login failed${NC}"
    echo "Response: $LOGIN_RESPONSE"
fi

# Test 5: Protected Route Access
echo -e "\n${YELLOW}Test 5: Protected Route Access${NC}"
if [ ! -z "$TOKEN" ]; then
    PROFILE_RESPONSE=$(curl -s "${BASE_URL}/api/auth/profile" \
        -H "Authorization: Bearer $TOKEN")
    
    if echo "$PROFILE_RESPONSE" | grep -q '"success":true'; then
        echo -e "${GREEN}✅ Protected route access successful${NC}"
    else
        echo -e "${RED}❌ Protected route access failed${NC}"
        echo "Response: $PROFILE_RESPONSE"
    fi
else
    echo -e "${YELLOW}⚠️  Skipping protected route test (no token)${NC}"
fi

# Test 6: Service Status
echo -e "\n${YELLOW}Test 6: Service Status${NC}"
echo "MongoDB Status:"
systemctl is-active mongod && echo -e "${GREEN}✅ MongoDB is running${NC}" || echo -e "${RED}❌ MongoDB is not running${NC}"

echo "Nginx Status:"
systemctl is-active nginx && echo -e "${GREEN}✅ Nginx is running${NC}" || echo -e "${RED}❌ Nginx is not running${NC}"

echo "PM2 Status:"
pm2 describe api-server | grep -q "online" && echo -e "${GREEN}✅ PM2 api-server is online${NC}" || echo -e "${RED}❌ PM2 api-server is not online${NC}"

echo -e "\n${GREEN}🎉 Deployment test completed!${NC}"
echo -e "${YELLOW}Access the app at: ${BASE_URL}${NC}"
echo -e "${YELLOW}API endpoint: ${BASE_URL}/api/health${NC}"