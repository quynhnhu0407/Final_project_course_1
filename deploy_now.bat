@echo off
title Deploy to GitHub
color 0B

echo.
echo ========================================
echo    Deploy to GitHub
echo ========================================
echo.

cd /d "%~dp0"

echo [1/4] Checking git status...
git status

echo.
echo [2/4] Adding all changes...
git add .

echo.
echo [3/4] Creating commit...
set /p COMMIT_MSG="Enter commit message (or press Enter for default): "

if "%COMMIT_MSG%"=="" (
    set COMMIT_MSG=Fix all API endpoints with filters and clean up unnecessary files
)

git commit -m "%COMMIT_MSG%"

echo.
echo [4/4] Pushing to GitHub...
git push origin main

echo.
echo ========================================
echo  Deployment Complete!
echo ========================================
echo.
pause
