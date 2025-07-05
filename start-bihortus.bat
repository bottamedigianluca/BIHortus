@echo off
title BiHortus - Banking Intelligence System
echo.
echo ========================================
echo   BiHortus - Banking Intelligence
echo ========================================
echo.
echo Starting BiHortus development server...
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:5000
echo.

cd /D "%~dp0"
npm run dev

pause