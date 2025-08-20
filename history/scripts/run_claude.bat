@echo off
set "HTTPS_PROXY=http://127.0.0.1:7890"
set "HTTP_PROXY=http://127.0.0.1:7890"
set "NODE_TLS_REJECT_UNAUTHORIZED=0"
echo Proxy settings applied:
echo HTTPS_PROXY=%HTTPS_PROXY%
echo HTTP_PROXY=%HTTP_PROXY%
echo.
echo Starting Claude Code...
claude %* 