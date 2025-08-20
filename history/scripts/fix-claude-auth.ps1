Write-Host "=== Claude认证修复脚本 ===" -ForegroundColor Green

# 1. 清理所有Node进程
Write-Host "`n1. 终止所有Node进程..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Write-Host "Node进程已清理" -ForegroundColor Green

# 2. 设置环境变量
Write-Host "`n2. 设置代理环境变量..." -ForegroundColor Yellow
[Environment]::SetEnvironmentVariable("HTTPS_PROXY", "http://192.168.1.100:7890", "User")
[Environment]::SetEnvironmentVariable("HTTP_PROXY", "http://192.168.1.100:7890", "User")
[Environment]::SetEnvironmentVariable("NO_PROXY", "localhost,127.0.0.1", "User")

# 3. 刷新环境变量
Write-Host "`n3. 刷新环境变量..." -ForegroundColor Yellow
$env:HTTPS_PROXY = "http://192.168.1.100:7890"
$env:HTTP_PROXY = "http://192.168.1.100:7890"
$env:NO_PROXY = "localhost,127.0.0.1"

# 4. 清理Claude配置
Write-Host "`n4. 清理Claude配置..." -ForegroundColor Yellow
$claudeConfigPath = "$env:APPDATA\claude"
if (Test-Path $claudeConfigPath) {
    Remove-Item -Path $claudeConfigPath -Recurse -Force
    Write-Host "已清理Claude配置目录" -ForegroundColor Green
}

# 5. 测试网络连接
Write-Host "`n5. 测试网络连接..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://api.anthropic.com/api/hello" -Proxy "http://192.168.1.100:7890" -TimeoutSec 10 -ErrorAction Stop
    Write-Host "网络连接成功: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "网络连接失败: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "请检查UpNet代理是否正常运行" -ForegroundColor Yellow
}

# 6. 显示当前环境变量
Write-Host "`n6. 当前环境变量:" -ForegroundColor Yellow
Write-Host "HTTPS_PROXY: $env:HTTPS_PROXY"
Write-Host "HTTP_PROXY: $env:HTTP_PROXY"
Write-Host "NO_PROXY: $env:NO_PROXY"

Write-Host "`n修复完成！现在可以尝试运行: claude auth" -ForegroundColor Green
Write-Host "如果仍然失败，请尝试:" -ForegroundColor Yellow
Write-Host "1. 确保UpNet代理正常运行在端口7890" -ForegroundColor Cyan
Write-Host "2. 尝试使用API密钥认证: claude auth --api-key YOUR_API_KEY" -ForegroundColor Cyan
Write-Host "3. 或者尝试不同的OAuth端口: claude auth --port 8080" -ForegroundColor Cyan 