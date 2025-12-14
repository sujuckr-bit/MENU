@echo off
REM BAZAR HmI - Stop Servers (Windows)
setlocal
cls
echo ================================================================================
echo          BAZAR HmI - Stop Servers
echo ================================================================================

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js tidak ditemukan. Tidak ada yang dihentikan.
  pause
  exit /b 0
)

echo Menutup proses yang menggunakan port 3000 dan 8000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000 "') do (
  echo Menghentikan PID %%a (port 3000)
  taskkill /PID %%a /F >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000 "') do (
  echo Menghentikan PID %%a (port 8000)
  taskkill /PID %%a /F >nul 2>&1
)

echo Menghentikan semua proses node.exe yang tersisa (jika ada)...
taskkill /IM node.exe /F >nul 2>&1

echo.
echo Selesai.
echo ================================================================================
pause
exit /b 0

