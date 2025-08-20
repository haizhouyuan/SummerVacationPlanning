Write-Host "=== Claude代理修复脚本 ===" -ForegroundColor Green

# 步骤1：验证代理端口
Write-Host "`n步骤1: 验证代理端口是否通畅..." -ForegroundColor Yellow
$port = 7890

Write-Host "测试 127.0.0.1:$port..." -ForegroundColor Cyan
try {
    $response = curl.exe -v --proxy "http://127.0.0.1:$port" https://api.anthropic.com/v1/complete --max-time 10 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ 127.0.0.1:$port 代理正常" -ForegroundColor Green
        $proxyUrl = "http://127.0.0.1:$port"
    } else {
        Write-Host "❌ 127.0.0.1:$port 代理失败" -ForegroundColor Red
        Write-Host "测试 192.168.1.100:$port..." -ForegroundColor Cyan
        $response = curl.exe -v --proxy "http://192.168.1.100:$port" https://api.anthropic.com/v1/complete --max-time 10 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ 192.168.1.100:$port 代理正常" -ForegroundColor Green
            $proxyUrl = "http://192.168.1.100:$port"
        } else {
            Write-Host "❌ 所有代理端口都失败" -ForegroundColor Red
            Write-Host "请检查UpNet是否开启了HTTP代理端口" -ForegroundColor Yellow
            exit 1
        }
    }
} catch {
    Write-Host "❌ 代理测试失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 步骤2：设置会话级环境变量
Write-Host "`n步骤2: 设置会话级环境变量..." -ForegroundColor Yellow
$env:HTTPS_PROXY = $proxyUrl
$env:HTTP_PROXY = $proxyUrl
Write-Host "🔍 HTTPS_PROXY in this session → $env:HTTPS_PROXY" -ForegroundColor Green

# 步骤3：测试Claude连接
Write-Host "`n步骤3: 测试Claude连接..." -ForegroundColor Yellow
try {
    $result = claude -p "ping" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Claude连接成功！" -ForegroundColor Green
    } else {
        Write-Host "❌ Claude连接失败: $result" -ForegroundColor Red
        if ($result -like "*Invalid API key*" -or $result -like "*Please run /login*") {
            Write-Host "✅ 网络已OK，只差认证" -ForegroundColor Green
        }
    }
} catch {
    Write-Host "❌ Claude测试失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 步骤4：写入用户级永久环境变量
Write-Host "`n步骤4: 写入用户级永久环境变量..." -ForegroundColor Yellow
[Environment]::SetEnvironmentVariable("HTTPS_PROXY", $proxyUrl, "User")
[Environment]::SetEnvironmentVariable("HTTP_PROXY", $proxyUrl, "User")
Write-Host "✅ 已写入用户级代理；重新开PowerShell生效" -ForegroundColor Green

# 步骤5：显示当前状态
Write-Host "`n步骤5: 当前状态..." -ForegroundColor Yellow
Write-Host "会话级 HTTPS_PROXY: $env:HTTPS_PROXY"
Write-Host "用户级 HTTPS_PROXY: $([Environment]::GetEnvironmentVariable('HTTPS_PROXY', 'User'))"

Write-Host "`n修复完成！" -ForegroundColor Green
Write-Host "请重新打开PowerShell并运行: claude doctor" -ForegroundColor Cyan
Write-Host "如果显示Network OK，则运行: claude auth" -ForegroundColor Cyan 