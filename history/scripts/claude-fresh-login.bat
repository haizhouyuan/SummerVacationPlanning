@echo off
echo Clearing previous authentication...
claude auth logout

echo.
echo Setting up proxy for fresh OAuth authentication...
set "HTTPS_PROXY=http://127.0.0.1:7890"
set "HTTP_PROXY=http://127.0.0.1:7890"

echo Proxy settings:
echo HTTPS_PROXY=%HTTPS_PROXY%
echo HTTP_PROXY=%HTTP_PROXY%
echo.

echo Starting fresh OAuth authentication...
claude auth login

echo.
echo If authentication was successful, you can now run: claude
pause 