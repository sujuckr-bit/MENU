@echo off
REM Start BAZAR HMI Servers

echo Starting BAZAR HMI Servers...
echo.

REM Kill any existing node processes
taskkill /F /IM node.exe >nul 2>&1

REM Start Backend Server on port 3000
echo [1/2] Starting Backend Server on http://localhost:3000
start "Backend Server (Port 3000)" cmd /k "cd /d c:\Users\DELL\Desktop\MENU\server && node index.js"

REM Wait for backend to start
timeout /t 3 /nobreak

REM Start Frontend Server on port 8000
echo [2/2] Starting Frontend Server on http://localhost:8000
start "Frontend Server (Port 8000)" cmd /k "cd /d c:\Users\DELL\Desktop\MENU && node serve.js"

timeout /t 2 /nobreak

echo.
echo ===================================
echo SERVERS STARTED SUCCESSFULLY!
echo ===================================
echo.
echo Backend:  http://localhost:3000
echo Frontend: http://localhost:8000
echo Login:    http://localhost:8000/admin-login.html
echo.
echo Username: admin
echo Password: Bazar@Secure123!
echo.
pause
