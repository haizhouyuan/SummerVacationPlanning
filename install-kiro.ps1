# Kiro Installation Script (PowerShell)
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "           Kiro Auto Installer" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Node.js installed: $nodeVersion" -ForegroundColor Green
    } else {
        throw "Node.js not installed"
    }
} catch {
    Write-Host "❌ Node.js not installed, please install Node.js first" -ForegroundColor Red
    Write-Host "Download: https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press any key to exit"
    exit 1
}

# Check npm
Write-Host ""
Write-Host "Checking npm installation..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ npm installed: $npmVersion" -ForegroundColor Green
    } else {
        throw "npm not installed"
    }
} catch {
    Write-Host "❌ npm not installed" -ForegroundColor Red
    Read-Host "Press any key to exit"
    exit 1
}

# Install Kiro
Write-Host ""
Write-Host "Installing Kiro CLI..." -ForegroundColor Yellow
try {
    npm install -g @kiro-ai/cli
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Kiro installed successfully" -ForegroundColor Green
    } else {
        throw "Installation failed"
    }
} catch {
    Write-Host "❌ Kiro installation failed" -ForegroundColor Red
    Write-Host "Please check network connection or try running as administrator" -ForegroundColor Yellow
    Read-Host "Press any key to exit"
    exit 1
}

# Verify installation
Write-Host ""
Write-Host "Verifying installation..." -ForegroundColor Yellow
try {
    $kiroVersion = kiro --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Kiro verified successfully: $kiroVersion" -ForegroundColor Green
    } else {
        throw "Verification failed"
    }
} catch {
    Write-Host "❌ Kiro verification failed" -ForegroundColor Red
    Read-Host "Press any key to exit"
    exit 1
}

# Installation complete
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "           Installation Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Visit https://kiro.ai to register" -ForegroundColor White
Write-Host "2. Get your API key" -ForegroundColor White
Write-Host "3. Run: kiro login" -ForegroundColor White
Write-Host "4. Run: kiro init in your project" -ForegroundColor White
Write-Host ""
Write-Host "View detailed guide: KIRO_SETUP_GUIDE.md" -ForegroundColor Cyan
Write-Host ""

# Ask if user wants to initialize project
$initProject = Read-Host "Do you want to initialize Kiro in current project? (y/n)"
if ($initProject -eq "y" -or $initProject -eq "Y") {
    Write-Host ""
    Write-Host "Initializing Kiro project configuration..." -ForegroundColor Yellow
    try {
        kiro init
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Kiro project initialized successfully" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Project initialization may require login first" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠️  Project initialization failed, please login first" -ForegroundColor Yellow
    }
}

Read-Host "Press any key to exit" 