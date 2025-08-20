// Simple verification script for summer vacation planning app
const { exec } = require('child_process');
const https = require('http');

console.log('🔍 Starting verification of summer vacation planning app...');

function checkUrl(url) {
    return new Promise((resolve) => {
        const req = https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({ status: res.statusCode, data });
            });
        });
        req.on('error', (err) => {
            resolve({ status: 'error', error: err.message });
        });
        req.setTimeout(5000, () => {
            req.destroy();
            resolve({ status: 'timeout' });
        });
    });
}

async function runVerification() {
    console.log('\n1️⃣ Testing main application accessibility...');
    
    // Test port 3000
    const result3000 = await checkUrl('http://localhost:3000');
    console.log(`Port 3000: ${result3000.status === 200 ? '✅ OK' : '❌ FAIL - ' + result3000.status}`);
    
    // Test port 3001  
    const result3001 = await checkUrl('http://localhost:3001');
    console.log(`Port 3001: ${result3001.status === 200 ? '✅ OK' : '❌ FAIL - ' + result3001.status}`);
    
    const workingPort = result3000.status === 200 ? 3000 : (result3001.status === 200 ? 3001 : null);
    
    if (!workingPort) {
        console.log('❌ CRITICAL: No working port found. Application may not be running.');
        return;
    }
    
    console.log(`\n✅ Using port ${workingPort} for testing`);
    
    // Test specific routes
    const routes = ['/history', '/planning', '/rewards'];
    
    for (const route of routes) {
        const url = `http://localhost:${workingPort}${route}`;
        const result = await checkUrl(url);
        
        if (result.status === 200) {
            console.log(`✅ ${route}: Accessible`);
            
            // Check for specific error patterns in the response
            const data = result.data.toLowerCase();
            
            if (data.includes('fail to fetch')) {
                console.log(`❌ ${route}: Contains "fail to fetch" errors`);
            } else if (data.includes('正在加载统计数据') && route === '/') {
                console.log(`⚠️ ${route}: May have infinite loading issue`);
            } else {
                console.log(`✅ ${route}: No obvious errors detected`);
            }
        } else {
            console.log(`❌ ${route}: Not accessible (${result.status})`);
        }
    }
    
    console.log('\n🎉 Basic verification completed!');
    console.log('📋 Summary:');
    console.log('- Application accessibility: tested');
    console.log('- Key routes: tested');
    console.log('- Error patterns: checked');
    console.log('\n💡 For detailed UI testing, manual verification is recommended.');
}

runVerification().catch(console.error);