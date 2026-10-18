@echo off
REM ==============================================================================
REM FasalSakshi - Launch All Services (Windows Batch)
REM Launches ML Microservice (8001), Backend API (8000), and Next.js Frontend (3000)
REM ==============================================================================

echo ==============================================================================
echo  Starting FasalSakshi Full-Stack Ecosystem
echo  - ML Service:   http://localhost:8001 (Docs: /docs)
echo  - Backend API:  http://localhost:8000 (Docs: /docs)
echo  - Frontend Web: http://localhost:3000 (Crop Doctor: /disease)
echo ==============================================================================

set SCRIPT_DIR=%~dp0
set ROOT_DIR=%SCRIPT_DIR%..

REM 1. Start ML Microservice in a new window
echo [1/3] Launching ML Microservice on port 8001...
start "FasalSakshi - ML Microservice [Port 8001]" cmd /k "cd /d "%ROOT_DIR%\ml-service" && .\venv\Scripts\python.exe run.py"

REM 2. Start Backend API in a new window
echo [2/3] Launching Backend API on port 8000...
start "FasalSakshi - Backend API [Port 8000]" cmd /k "cd /d "%ROOT_DIR%\backend" && .\venv\Scripts\python.exe -m uvicorn app.main:app --port 8000 --reload"

REM 3. Start Next.js Frontend in a new window
echo [3/3] Launching Next.js Frontend on port 3000...
start "FasalSakshi - Next.js Frontend [Port 3000]" cmd /k "cd /d "%ROOT_DIR%\frontend-simulation\frontend" && set PATH=C:\Program Files\nodejs;%PATH% && npm run dev"

echo ==============================================================================
echo All 3 services launched in separate windows!
echo Visit http://localhost:3000/disease to test Crop Doctor AI!
echo ==============================================================================
