#!/usr/bin/env pwsh

# Restoplan Local Development Startup Script
Write-Host "🚀 Starting Restoplan Local Development Environment" -ForegroundColor Green

# Clean up any processes using our ports
Write-Host "🧹 Cleaning up any processes using ports 3100-3102 and 5173..." -ForegroundColor Yellow
$portsToCheck = @(3100, 3101, 3102, 5173)
foreach ($port in $portsToCheck) {
    try {
        $connections = netstat -ano | Select-String ":$port "
        if ($connections) {
            Write-Host "   Found processes using port $port, attempting to free it..." -ForegroundColor Yellow
            $connections | ForEach-Object {
                $line = $_.Line
                if ($line -match "\s+(\d+)$") {
                    $processId = $matches[1]
                    try {
                        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                        Write-Host "   Stopped process $processId using port $port" -ForegroundColor Green
                    } catch {
                        Write-Host "   Could not stop process $processId (may already be stopped)" -ForegroundColor Yellow
                    }
                }
            }
        }
    } catch {
        # Port not in use, continue
    }
}

# Check if Cosmos DB Emulator is running
Write-Host "📊 Checking Cosmos DB Emulator status..." -ForegroundColor Yellow
try {
    $null = Invoke-WebRequest -Uri "https://localhost:8081/_explorer/index.html" -SkipCertificateCheck -TimeoutSec 5
    Write-Host "✅ Cosmos DB Emulator is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Cosmos DB Emulator is not running" -ForegroundColor Red
    Write-Host "🔧 Starting Cosmos DB Emulator..." -ForegroundColor Yellow
    Start-Process "C:\Program Files\Azure Cosmos DB Emulator\Microsoft.Azure.Cosmos.Emulator.exe" -ArgumentList "/EnableMongoDbEndpoint=4.0", "/MongoPort=65200"
    Write-Host "⏳ Waiting for Cosmos DB Emulator to start (this may take 1-2 minutes)..." -ForegroundColor Yellow
    
    $timeout = 120 # 2 minutes
    $elapsed = 0
    do {
        Start-Sleep -Seconds 5
        $elapsed += 5
        try {
            $null = Invoke-WebRequest -Uri "https://localhost:8081/_explorer/index.html" -SkipCertificateCheck -TimeoutSec 5
            Write-Host "✅ Cosmos DB Emulator is now running" -ForegroundColor Green
            break
        } catch {
            Write-Host "⏳ Still waiting... ($elapsed seconds)" -ForegroundColor Yellow
        }
    } while ($elapsed -lt $timeout)
    
    if ($elapsed -ge $timeout) {
        Write-Host "❌ Timeout waiting for Cosmos DB Emulator. Please start it manually." -ForegroundColor Red
        Write-Host "   Open: C:\Program Files\Azure Cosmos DB Emulator\Microsoft.Azure.Cosmos.Emulator.exe" -ForegroundColor Red
        exit 1
    }
}

# Build API
Write-Host "🔨 Building API..." -ForegroundColor Yellow
Set-Location "src/api"
dotnet build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ API build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ API built successfully" -ForegroundColor Green

# Install web dependencies
Write-Host "📦 Installing web dependencies..." -ForegroundColor Yellow
Set-Location "../web"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Web dependencies installation failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Web dependencies installed successfully" -ForegroundColor Green

# Return to root
Set-Location "../.."

Write-Host "🎉 Setup complete! Now you can:" -ForegroundColor Green
Write-Host "   1. Create the 'restoplan' database in Cosmos DB Emulator UI (https://localhost:8081/_explorer/index.html)" -ForegroundColor Cyan
Write-Host "   2. Start the API: Press Ctrl+Shift+P, type 'Tasks: Run Task', select 'Start API'" -ForegroundColor Cyan
Write-Host "   3. Start the Web: Press Ctrl+Shift+P, type 'Tasks: Run Task', select 'Start Web'" -ForegroundColor Cyan
Write-Host "   4. Or use the debug configurations in launch.json" -ForegroundColor Cyan

Write-Host ""
Write-Host "🌐 URLs when running:" -ForegroundColor Yellow
Write-Host "   API: http://localhost:3100" -ForegroundColor Cyan
Write-Host "   Web: http://localhost:5173" -ForegroundColor Cyan
Write-Host "   Cosmos DB UI: https://localhost:8081/_explorer/index.html" -ForegroundColor Cyan
