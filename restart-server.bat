@echo off
REM BAZAR HmI - Restart Servers (Windows)
setlocal
cls
echo ================================================================================
echo          BAZAR HmI - Restart Servers
echo ================================================================================

echo Memanggil stop-server.bat untuk menghentikan server jika berjalan...
call "%~dp0stop-server.bat"

echo Menunggu 2 detik sebelum memulai ulang...
timeout /t 2 /nobreak >nul 2>&1

echo Memulai ulang server dengan memanggil START.bat...
call "%~dp0START.bat"

echo ================================================================================
echo Restart selesai. Periksa jendela terminal yang muncul untuk log server.
echo ================================================================================
pause
exit /b 0

