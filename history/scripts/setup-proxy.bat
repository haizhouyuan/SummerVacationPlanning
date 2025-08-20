@echo off
echo Setting up proxy environment variables...
set HTTPS_PROXY=http://192.168.1.100:7890
set HTTP_PROXY=http://192.168.1.100:7890
echo Proxy settings applied:
echo HTTPS_PROXY=%HTTPS_PROXY%
echo HTTP_PROXY=%HTTP_PROXY%
echo.
echo Now you can run: claude
pause 