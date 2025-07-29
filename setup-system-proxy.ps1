# 需要管理员权限运行
Write-Host "Setting up system environment variables..." -ForegroundColor Green

# 设置用户级环境变量
[Environment]::SetEnvironmentVariable("HTTPS_PROXY", "http://127.0.0.1:7890", "User")
[Environment]::SetEnvironmentVariable("HTTP_PROXY", "http://127.0.0.1:7890", "User")
[Environment]::SetEnvironmentVariable("NODE_TLS_REJECT_UNAUTHORIZED", "0", "User")

Write-Host "Environment variables set successfully!" -ForegroundColor Green
Write-Host "HTTPS_PROXY: http://127.0.0.1:7890" -ForegroundColor Cyan
Write-Host "HTTP_PROXY: http://127.0.0.1:7890" -ForegroundColor Cyan
Write-Host "NODE_TLS_REJECT_UNAUTHORIZED: 0" -ForegroundColor Cyan
Write-Host ""
Write-Host "Please restart your terminal/PowerShell for changes to take effect." -ForegroundColor Yellow
Write-Host "Then run: claude auth login" -ForegroundColor Yellow 