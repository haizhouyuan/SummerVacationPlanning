#!/usr/bin/env node

/**
 * API Endpoint Testing Script
 * 
 * This script tests the core API endpoints to ensure they're working correctly.
 * Run this after starting the backend server.
 */

const https = require('https');
const http = require('http');

// Configuration
const CONFIG = {
  baseUrl: 'http://localhost:5000',
  testTimeout: 10000
};

// Test endpoints
const TEST_ENDPOINTS = [
  {
    name: 'Health Check',
    method: 'GET',
    path: '/api/health',
    expectedStatus: 200
  },
  {
    name: 'Auth Routes Available',
    method: 'GET', 
    path: '/api/auth',
    expectedStatus: [404, 405] // Should return method not allowed or not found (routes exist)
  },
  {
    name: 'Tasks Routes Available',
    method: 'GET',
    path: '/api/tasks',
    expectedStatus: [401, 403] // Should require authentication
  },
  {
    name: 'Daily Tasks Routes Available', 
    method: 'GET',
    path: '/api/daily-tasks',
    expectedStatus: [401, 403] // Should require authentication
  },
  {
    name: 'Rewards Routes Available',
    method: 'GET',
    path: '/api/rewards/debug-test',
    expectedStatus: 200 // Debug route should work
  },
  {
    name: 'CORS Headers',
    method: 'OPTIONS',
    path: '/api/auth',
    expectedStatus: [200, 204]
  }
];

// Helper function to make HTTP request
function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const client = options.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', reject);
    req.setTimeout(CONFIG.testTimeout, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Test runner
async function runTests() {
  console.log('🧪 Starting API Endpoint Tests...\n');
  console.log('Base URL:', CONFIG.baseUrl);
  console.log('Timeout:', CONFIG.testTimeout + 'ms\n');

  const results = {
    passed: 0,
    failed: 0,
    total: TEST_ENDPOINTS.length
  };

  for (const test of TEST_ENDPOINTS) {
    try {
      console.log(`Testing: ${test.name}`);
      console.log(`  ${test.method} ${test.path}`);

      const url = new URL(test.path, CONFIG.baseUrl);
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: test.method,
        headers: {
          'User-Agent': 'API-Test-Script/1.0',
          'Accept': 'application/json'
        }
      };

      const response = await makeRequest(options);
      
      const expectedStatuses = Array.isArray(test.expectedStatus) 
        ? test.expectedStatus 
        : [test.expectedStatus];

      if (expectedStatuses.includes(response.statusCode)) {
        console.log(`  ✅ PASS - Status: ${response.statusCode}`);
        results.passed++;
      } else {
        console.log(`  ❌ FAIL - Expected: ${expectedStatuses.join(' or ')}, Got: ${response.statusCode}`);
        results.failed++;
      }

      // Additional checks
      if (test.name === 'CORS Headers' && response.headers['access-control-allow-origin']) {
        console.log(`  ✅ CORS headers present`);
      }

    } catch (error) {
      console.log(`  ❌ ERROR - ${error.message}`);
      results.failed++;
    }

    console.log('');
  }

  // Summary
  console.log('📊 Test Results Summary:');
  console.log(`  Total Tests: ${results.total}`);
  console.log(`  Passed: ${results.passed}`);
  console.log(`  Failed: ${results.failed}`);
  console.log(`  Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);

  if (results.failed === 0) {
    console.log('\n🎉 All tests passed! API endpoints are working correctly.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Please check the backend server and try again.');
    process.exit(1);
  }
}

// Additional connectivity test
async function testConnectivity() {
  console.log('🔗 Testing server connectivity...\n');
  
  try {
    const url = new URL('/', CONFIG.baseUrl);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: '/',
      method: 'GET',
      timeout: 5000
    };

    await makeRequest(options);
    console.log('✅ Server is reachable\n');
    return true;
  } catch (error) {
    console.log('❌ Server is not reachable:', error.message);
    console.log('Please ensure the backend server is running on', CONFIG.baseUrl);
    console.log('Run: cd backend && npm run dev\n');
    return false;
  }
}

// Main execution
async function main() {
  console.log('🚀 API Testing Tool for Summer Vacation Planning App\n');
  
  const isConnected = await testConnectivity();
  if (!isConnected) {
    process.exit(1);
  }

  await runTests();
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { runTests, testConnectivity };