Write-Host "Setting up permanent proxy environment variables..." -ForegroundColor Green

# 设置用户级环境变量（永久）
[Environment]::SetEnvironmentVariable("HTTPS_PROXY", "http://127.0.0.1:7890", "User")
[Environment]::SetEnvironmentVariable("HTTP_PROXY", "http://127.0.0.1:7890", "User")

Write-Host "Permanent proxy settings applied!" -ForegroundColor Green
Write-Host "HTTPS_PROXY: http://127.0.0.1:7890" -ForegroundColor Cyan
Write-Host "HTTP_PROXY: http://127.0.0.1:7890" -ForegroundColor Cyan
Write-Host ""
Write-Host "Please restart PowerShell/CMD for changes to take effect." -ForegroundColor Yellow
Write-Host "Then run: claude auth login" -ForegroundColor Yellow 