@echo off
REM BAZAR HmI - Quick Start Script for Windows
REM This script starts both API server and Frontend server

setlocal enabledelayedexpansion

cls
color 0A
echo.
echo ================================================================================
echo          🛒 BAZAR HmI - Quick Start (API + Frontend)
echo ================================================================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if errorlevel 1 (
    echo ❌ ERROR: Node.js tidak ditemukan!
    echo    Silakan install Node.js dari https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js found: 
node --version
echo.

REM Kill any existing node processes on ports 3000 and 8000
echo 🔄 Memastikan port 3000 dan 8000 kosong...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000 "') do taskkill /PID %%a /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000 "') do taskkill /PID %%a /F >nul 2>&1
timeout /t 1 /nobreak

REM Start API Server in new window
echo 🚀 Memulai API Server di port 3000...
start "BAZAR HmI - API Server (Port 3000)" cmd /k "cd server && npm start"
timeout /t 2 /nobreak

REM Start Frontend Server in new window
echo 🚀 Memulai Frontend Server di port 8000...
start "BAZAR HmI - Frontend Server (Port 8000)" cmd /k "node serve.js"
timeout /t 2 /nobreak

echo.
echo ================================================================================
echo ✅ STARTUP COMPLETE!
echo ================================================================================
echo.
echo 📱 Aplikasi siap diakses:
echo    🌐 Frontend    → http://localhost:8000
echo    📝 Pesan       → http://localhost:8000/pesan.html
echo    📋 Daftar      → http://localhost:8000/daftar.html
echo    🔐 Login Admin → http://localhost:8000/admin-login.html
echo    🔌 API Server  → http://localhost:3000
echo.
echo 🔐 Admin Login:
echo    Password: admin123
echo.
echo ⚠️  Jangan tutup terminal-terminal ini! Biarkan server tetap berjalan.
echo.
echo Tekan Enter untuk menutup window ini (servers tetap aktif).
echo ================================================================================
pause

exit /b 0
