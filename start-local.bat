@echo off
title Alfred Workstation - Local Bootstrapper
cls

echo ================================================================
echo           ALFRED CYBER WORKSTATION - WIN INITIALIZATION       
echo ================================================================

rem Step 1: Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [-] Error: Node.js is not installed on this machine!
    echo     Please download and install Node.js (v18 or higher) from: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo [✓] Node.js environment verified: %NODE_VERSION%

rem Step 2: Install dependencies if missing
if not exist node_modules (
    echo [*] Node modules folder empty. Bootstrapping workspace dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [-] Standard dependency alignment failed. Try running "npm install --legacy-peer-deps" manually.
        pause
        exit /b 1
    )
    echo [✓] Dependencies downloaded completely.
) else (
    echo [✓] Local dependencies cache detected.
)

rem Step 3: Compile Workstation
echo [*] Compiling workspace and bundler modules...
call npm run build
if %errorlevel% neq 0 (
    echo [-] Local build process failed!
    pause
    exit /b 1
)
echo [✓] Alfred workstation compilation succeeded!

rem Step 4: Boot local server
echo [✓] Workstation live link initialized!
echo [*] Launching Alfred Cyber Server. Access the HUD inside your browser here:
echo     ===  http://localhost:3000  ===
echo Keep this terminal window open to log local automation tasks.
echo ================================================================

call npm start
pause
