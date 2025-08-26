#!/usr/bin/env bash

echo "🔍 Verifying HTTP-only deployment..."

# Test local connections first
echo "📍 Testing local connections:"

echo "  🧪 Testing frontend (port 80)..."
curl -I http://localhost/ 2>/dev/null | head -1 || echo "  ❌ Frontend not accessible locally"

echo "  🧪 Testing API health check..."
curl -s http://localhost/health | jq . 2>/dev/null || echo "  ❌ Health check failed"

echo "  🧪 Testing API endpoint..."
curl -I http://localhost/api/ 2>/dev/null | head -1 || echo "  ⚠️ API endpoint test (expected 404/405)"

# Test external access
echo ""
echo "🌐 Testing external access (47.120.74.212):"

echo "  🧪 Testing frontend..."
curl -I http://47.120.74.212/ 2>/dev/null | head -1 || echo "  ❌ Frontend not accessible externally"

echo "  🧪 Testing health check..."
curl -s http://47.120.74.212/health | jq . 2>/dev/null || echo "  ❌ External health check failed"

echo "  🧪 Testing API CORS..."
curl -H "Origin: http://localhost:3000" -I http://47.120.74.212/api/ 2>/dev/null | grep -i access-control || echo "  ⚠️ CORS headers test"

# Check services
echo ""
echo "📋 Service status:"
echo "  📦 Nginx status:"
sudo systemctl is-active nginx || echo "  ❌ Nginx not running"

echo "  🔍 Checking if backend is running on port 5000:"
ss -tulpn | grep :5000 || echo "  ❌ No service on port 5000"

echo ""
echo "📝 Next steps if there are issues:"
echo "  1. Start backend: cd backend && npm run dev"
echo "  2. Check Nginx config: sudo nginx -t"
echo "  3. View Nginx logs: sudo tail -f /var/log/nginx/error.log"
echo "  4. Check backend logs for connection issues"