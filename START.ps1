#!/usr/bin/env pwsh
# BAZAR HmI - Quick Start Script for PowerShell
# Usage: .\START.ps1

$scriptPath = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition
Set-Location $scriptPath

Write-Host ""
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "          🛒 BAZAR HmI - Quick Start (API + Frontend)" -ForegroundColor Green
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version 2>$null
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR: Node.js tidak ditemukan!" -ForegroundColor Red
    Write-Host "   Silakan install Node.js dari https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "🔄 Memastikan port 3000 dan 8000 kosong..." -ForegroundColor Yellow

# Kill existing processes on ports
Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | 
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }

Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue | 
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }

Start-Sleep -Seconds 1

# Start API Server
Write-Host "🚀 Memulai API Server di port 3000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptPath\server'; npm start" `
    -WindowStyle Normal

Start-Sleep -Seconds 2

# Start Frontend Server
Write-Host "🚀 Memulai Frontend Server di port 8000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptPath'; node serve.js" `
    -WindowStyle Normal

Start-Sleep -Seconds 2

Write-Host ""
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "✅ STARTUP COMPLETE!" -ForegroundColor Green
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📱 Aplikasi siap diakses:" -ForegroundColor Cyan
Write-Host "   🌐 Frontend    → http://localhost:8000" -ForegroundColor White
Write-Host "   📝 Pesan       → http://localhost:8000/pesan.html" -ForegroundColor White
Write-Host "   📋 Daftar      → http://localhost:8000/daftar.html" -ForegroundColor White
Write-Host "   🔐 Login Admin → http://localhost:8000/admin-login.html" -ForegroundColor White
Write-Host "   🔌 API Server  → http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "🔐 Admin Login:" -ForegroundColor Cyan
Write-Host "   Password: admin123" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  Jangan tutup terminal-terminal ini! Biarkan server tetap berjalan." -ForegroundColor Yellow
Write-Host ""
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "Tekan Ctrl+C di terminal untuk menghentikan server" -ForegroundColor Gray
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""

# Keep main window open
Read-Host "Press Enter to exit this launcher (servers tetap aktif)"
