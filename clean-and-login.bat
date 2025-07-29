@echo off
echo ========================================
echo 1. 彻底删除残缺配置
echo ========================================
echo 删除 .claude 目录...
rd /s /q "%USERPROFILE%\.claude" 2>nul
echo 删除 .config\claude-code 目录...
rd /s /q "%USERPROFILE%\.config\claude-code" 2>nul
echo.

echo ========================================
echo 2. 清除认证状态
echo ========================================
echo 执行 logout...
claude auth logout
echo.

echo ========================================
echo 3. 重新登录
echo ========================================
echo 开始 OAuth 认证...
claude auth login
echo.

echo ========================================
echo 4. 验证认证状态
echo ========================================
echo 检查认证状态...
claude doctor
echo.

pause 