@echo off
title Sales Dashboard - Ngrok Launcher
color 0A

echo.
echo ========================================
echo    Sales Dashboard - Ngrok Setup
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH!
    echo Please install Python first.
    pause
    exit /b 1
)

REM Check if ngrok is installed
where ngrok >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Ngrok not found in PATH!
    echo.
    echo Quick Setup:
    echo 1. Download: https://ngrok.com/download
    echo 2. Extract ngrok.exe to this folder
    echo 3. Sign up: https://dashboard.ngrok.com/signup
    echo 4. Run: ngrok config add-authtoken YOUR_TOKEN
    echo.
    pause
    exit /b 1
)

echo [1/3] Starting Flask API Server...
start "Flask API Server" cmd /k "cd /d "%~dp0" && python app.py"

echo Waiting for Flask to start...
timeout /t 5 /nobreak >nul

echo.
echo [2/3] Starting Ngrok Tunnel...
start "Ngrok Tunnel" cmd /k "ngrok http 5000"

echo.
echo [3/3] Waiting for Ngrok URL...
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo    Setup Complete!
echo ========================================
echo.
echo  Local:           http://localhost:5000
echo  Ngrok Dashboard: http://localhost:4040
echo.
echo ========================================
echo.
echo NEXT STEPS:
echo 1. Check the Ngrok window for the URL
echo 2. Copy the "Forwarding" URL (https://xxxx.ngrok-free.app)
echo.
set /p UPDATE_URL="Do you want to update report.js now? (y/n): "

if /i "%UPDATE_URL%"=="y" (
    echo.
    set /p NGROK_URL="Paste your Ngrok URL: "
    
    if not "!NGROK_URL!"=="" (
        echo.
        echo Updating report.js...
        copy report.js report.js.backup >nul 2>&1
        powershell -Command "(Get-Content report.js) -replace \"const API_BASE = '.*';\", \"const API_BASE = '!NGROK_URL!';\" | Set-Content report.js"
        echo.
        echo [SUCCESS] API_BASE updated to: !NGROK_URL!
        echo Backup saved as: report.js.backup
        echo.
        echo Open your browser: !NGROK_URL!
    )
)

echo.
echo Press any key to exit...
pause >nul
