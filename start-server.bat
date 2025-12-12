@echo off
REM Start Web Server untuk BAZAR HmI - Windows Batch Script

setlocal enabledelayedexpansion
set port=8000

echo.
echo ================================
echo 🚀 Memulai Server BAZAR HmI
echo ================================
echo.

REM Cek Python dulu
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Python ditemukan
    echo.
    echo 🌐 Server berjalan di: http://localhost:%port%/index.html
    echo ⏹️  Tekan Ctrl+C untuk menghentikan server
    echo.
    python -m http.server %port%
) else (
    REM Coba Node.js
    node --version >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✅ Node.js ditemukan
        echo.
        echo 🌐 Server berjalan di: http://127.0.0.1:8080
        echo ⏹️  Tekan Ctrl+C untuk menghentikan server
        echo.
        http-server -c-1
    ) else (
        echo.
        echo ❌ Python atau Node.js tidak ditemukan!
        echo.
        echo Silakan install salah satu:
        echo - Python: https://www.python.org/downloads/
        echo - Node.js: https://nodejs.org/
        echo.
        echo Alternatif: Gunakan Live Server di VS Code
        echo.
        pause
    )
)
