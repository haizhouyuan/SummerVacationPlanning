Write-Host "Setting up proxy environment variables..." -ForegroundColor Green
$env:HTTPS_PROXY = "http://192.168.1.100:7890"
$env:HTTP_PROXY = "http://192.168.1.100:7890"

Write-Host "Proxy settings applied:" -ForegroundColor Yellow
Write-Host "HTTPS_PROXY: $env:HTTPS_PROXY" -ForegroundColor Cyan
Write-Host "HTTP_PROXY: $env:HTTP_PROXY" -ForegroundColor Cyan
Write-Host ""

Write-Host "Testing network connection..." -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri "https://api.anthropic.com" -Method HEAD -TimeoutSec 10
    Write-Host "Network connection successful!" -ForegroundColor Green
} catch {
    Write-Host "Network connection failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Now you can run: claude" -ForegroundColor Yellow 