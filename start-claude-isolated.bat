@echo off
echo Starting Claude Code with isolated MCP configuration for login-overhaul worktree...

rem Set environment variables for isolated browser instance
set MCP_PLAYWRIGHT_USER_DATA_DIR=%~dp0.playwright-user-data
set MCP_PLAYWRIGHT_INSTANCE_ID=login-overhaul-worktree
set CLAUDE_CONFIG_PATH=%~dp0.claude\config.json
set PLAYWRIGHT_BROWSERS_PATH=0
set PLAYWRIGHT_LAUNCH_OPTIONS={"channel":"msedge","executablePath":"C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"}

echo Using isolated user data directory: %MCP_PLAYWRIGHT_USER_DATA_DIR%
echo Using isolated instance ID: %MCP_PLAYWRIGHT_INSTANCE_ID%
echo Using config path: %CLAUDE_CONFIG_PATH%
echo Using Edge browser: C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe

rem Create the user data directory if it doesn't exist
if not exist "%MCP_PLAYWRIGHT_USER_DATA_DIR%" (
    echo Creating isolated user data directory...
    mkdir "%MCP_PLAYWRIGHT_USER_DATA_DIR%"
)

echo.
echo Claude Code will now use isolated browser instances for this worktree.
echo You can now safely run Playwright commands without conflicts with other worktrees.
echo.
pause

rem Optionally start Claude Code with the specific config
rem claude --config "%CLAUDE_CONFIG_PATH%"