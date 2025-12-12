# Start Web Server untuk BAZAR HmI
# Jalankan file ini dengan: powershell -ExecutionPolicy Bypass -File start-server.ps1

$port = 8000

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "🚀 Memulai Server BAZAR HmI" -ForegroundColor Green
Write-Host "================================`n" -ForegroundColor Cyan

# Cek apakah port sudah digunakan
$netstat = netstat -ano | findstr ":$port"
if ($netstat) {
    Write-Host "⚠️  Port $port sudah digunakan!" -ForegroundColor Yellow
    Write-Host "Coba port lain? (tekan Ctrl+C untuk batal)`n"
    $port = Read-Host "Masukkan port yang diinginkan (default: 8000)"
    if (!$port) { $port = 8000 }
}

Write-Host "📂 Direktori: $(Get-Location)" -ForegroundColor Cyan
Write-Host "🌐 Server akan dijalankan di: http://localhost:$port" -ForegroundColor Green
Write-Host ""

# Coba Python dulu
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python tersedia: $pythonVersion" -ForegroundColor Green
    Write-Host "`n🔗 Akses aplikasi di: http://localhost:$port/index.html" -ForegroundColor Green
    Write-Host "⏹️  Tekan Ctrl+C untuk menghentikan server`n"
    
    python -m http.server $port
} catch {
    # Jika Python tidak ada, coba Node.js
    try {
        $nodeVersion = node --version 2>&1
        Write-Host "✅ Node.js tersedia: $nodeVersion" -ForegroundColor Green
        
        # Cek apakah http-server sudah install
        $httpServer = npm list -g http-server 2>&1
        if ($httpServer -like "*empty*" -or $httpServer -like "*not installed*") {
            Write-Host "`n📦 Menginstall http-server..." -ForegroundColor Yellow
            npm install -g http-server
        }
        
        Write-Host "`n🔗 Akses aplikasi di: http://127.0.0.1:8080" -ForegroundColor Green
        Write-Host "⏹️  Tekan Ctrl+C untuk menghentikan server`n"
        http-server -p $port -c-1
    } catch {
        Write-Host "`n❌ Python dan Node.js tidak ditemukan!" -ForegroundColor Red
        Write-Host "Silakan install salah satu:
        - Python: https://www.python.org/downloads/
        - Node.js: https://nodejs.org/" -ForegroundColor Yellow
        Write-Host "`nAltarnatif: Gunakan Live Server di VS Code" -ForegroundColor Cyan
        Read-Host "Tekan Enter untuk keluar"
    }
}
