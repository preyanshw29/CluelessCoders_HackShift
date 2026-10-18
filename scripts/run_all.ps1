# ==============================================================================
# FasalSakshi - Launch All Services (PowerShell)
# Launches ML Microservice (8001), Backend API (8000), and Next.js Frontend (3000)
# ==============================================================================

Write-Host "==============================================================================" -ForegroundColor Green
Write-Host " Starting FasalSakshi Full-Stack Ecosystem" -ForegroundColor Green
Write-Host " - ML Service:   http://localhost:8001 (Docs: /docs)" -ForegroundColor Yellow
Write-Host " - Backend API:  http://localhost:8000 (Docs: /docs)" -ForegroundColor Yellow
Write-Host " - Frontend Web: http://localhost:3000 (Crop Doctor: /disease)" -ForegroundColor Yellow
Write-Host "==============================================================================" -ForegroundColor Green

$RootDir = Split-Path -Parent $PSScriptRoot

# 1. Start ML Microservice
Write-Host "[1/3] Launching ML Microservice on port 8001..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$RootDir\ml-service'; if (Test-Path '.\venv\Scripts\python.exe') { .\venv\Scripts\python.exe run.py } else { python run.py }"

# 2. Start Backend API
Write-Host "[2/3] Launching Backend API on port 8000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$RootDir\backend'; if (Test-Path '.\venv\Scripts\python.exe') { .\venv\Scripts\python.exe -m uvicorn app.main:app --port 8000 --reload } else { python -m uvicorn app.main:app --port 8000 --reload }"

# 3. Start Next.js Frontend
Write-Host "[3/3] Launching Next.js Frontend on port 3000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:PATH = 'C:\Program Files\nodejs;' + `$env:PATH; cd '$RootDir\frontend-simulation\frontend'; & 'C:\Program Files\nodejs\npm.cmd' run dev"

Write-Host "==============================================================================" -ForegroundColor Green
Write-Host "All 3 services launched in separate windows!" -ForegroundColor Green
Write-Host "Visit http://localhost:3000/disease to test Crop Doctor AI!" -ForegroundColor Green
Write-Host "==============================================================================" -ForegroundColor Green
