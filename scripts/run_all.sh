#!/usr/bin/env bash
# FasalSakshi - Run All Services (M2)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=================================================="
echo " Starting FasalSakshi Full-Stack Services"
echo "=================================================="

# 1. Start Backend (Port 8000)
echo "[1/3] Starting Backend API on http://localhost:8000..."
cd "$ROOT_DIR/backend"
if [ ! -d "venv" ]; then
    python3 -m venv venv || python -m venv venv
fi
source venv/bin/activate || source venv/Scripts/activate
pip install -q -r requirements.txt || true
uvicorn app.main:app --port 8000 --host 0.0.0.0 &
BACKEND_PID=$!

# 2. Start ML Service (Port 8001, if exists)
if [ -d "$ROOT_DIR/ml" ] && [ -f "$ROOT_DIR/ml/main.py" ]; then
    echo "[2/3] Starting ML Service on http://localhost:8001..."
    cd "$ROOT_DIR/ml"
    if [ ! -d "venv" ]; then
        python3 -m venv venv || python -m venv venv
    fi
    source venv/bin/activate || source venv/Scripts/activate
    pip install -q -r requirements.txt || true
    uvicorn main:app --port 8001 --host 0.0.0.0 &
    ML_PID=$!
else
    echo "[2/3] ML service not yet present; running with MOCK_ML=1."
fi

# 3. Start Frontend (Port 3000)
echo "[3/3] Starting Frontend on http://localhost:3000..."
if [ -d "$ROOT_DIR/frontend-simulation/frontend" ]; then
    cd "$ROOT_DIR/frontend-simulation/frontend"
elif [ -d "$ROOT_DIR/frontend" ]; then
    cd "$ROOT_DIR/frontend"
fi

npm run dev -p 3000 &
FRONTEND_PID=$!

echo "=================================================="
echo " FasalSakshi is LIVE!"
echo " Frontend: http://localhost:3000"
echo " Backend:  http://localhost:8000"
echo " Docs:     http://localhost:8000/docs"
echo "=================================================="

wait
