# Development Server Startup Script
# Automatically kills any process using port 5000 before starting

$ErrorActionPreference = "Stop"

Write-Host "🔍 Checking for processes on port 5000..." -ForegroundColor Cyan

# Find processes using port 5000
$connections = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue

if ($connections) {
    $processes = $connections | ForEach-Object { 
        try {
            Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
        } catch {
            $null
        }
    } | Where-Object { $null -ne $_ } | Select-Object -Unique
    
    if ($processes) {
        Write-Host "⚠️  Found $($processes.Count) process(es) using port 5000:" -ForegroundColor Yellow
        foreach ($proc in $processes) {
            Write-Host "   - PID $($proc.Id): $($proc.ProcessName) ($($proc.Path))" -ForegroundColor Yellow
        }
        
        Write-Host "🛑 Stopping processes..." -ForegroundColor Yellow
        foreach ($proc in $processes) {
            try {
                Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
                Write-Host "   ✓ Stopped PID $($proc.Id)" -ForegroundColor Green
            } catch {
                Write-Host "   ✗ Failed to stop PID $($proc.Id): $($_.Exception.Message)" -ForegroundColor Red
            }
        }
        
        # Wait a moment for ports to be released
        Start-Sleep -Milliseconds 500
    }
} else {
    Write-Host "✓ Port 5000 is available" -ForegroundColor Green
}

Write-Host "`n🚀 Starting development server...`n" -ForegroundColor Cyan

# Start the dev server
npm run dev
