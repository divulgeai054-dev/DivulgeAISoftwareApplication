@echo off
echo ============================================
echo  DivulgeAI Desktop - First Time Setup
echo ============================================
echo.

:: Check Node.js is installed
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed.
    echo Please download and install Node.js from https://nodejs.org
    echo Then run this setup again.
    pause
    exit /b 1
)
echo Node.js found: 
node --version

:: Set Electron download mirror to official GitHub releases
set ELECTRON_MIRROR=https://github.com/electron/electron/releases/download/

echo.
echo Installing dependencies (downloads ~200MB, may take a few minutes)...
echo.

call npm install --legacy-peer-deps
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo First attempt failed. Trying with --force...
    call npm install --force
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo ERROR: Installation failed. Check your internet connection.
        pause
        exit /b 1
    )
)

echo.
echo ============================================
echo  Setup complete! Starting DivulgeAI...
echo ============================================
echo.
call npm run dev
