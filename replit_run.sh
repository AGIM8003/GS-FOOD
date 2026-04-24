#!/bin/bash
set -e

echo '==================================================='
echo '  BOOTING GS FOOD CYBERNETIC OS ON REPLIT (V4) '
echo '==================================================='

# Ensure absolute source of truth environment modes
export GSFOOD_ENGINE_MODE="V4_CYBERNETIC_OS"

# 1. Setup Python Env
echo '[1] Initializing Python Backend...'
cd server
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
fi
source .venv/bin/activate
export PYTHONPATH="$(pwd)"

# Create a dummy requirements if not exists to avoid pip errors
if [ ! -f "requirements.txt" ]; then
    touch requirements.txt
fi

pip install -r requirements.txt httpx fastapi uvicorn pydantic

# 2. Dynamic Vendor Node (Detect Harvested Donors)
echo '[2] Initializing Node.js AI Vendor Proxy...'
cd ../vendor

# Auto-detect the first available vendor engine to run
VENDOR_DIR=$(ls -d */ 2>/dev/null | head -n 1)

if [ -z "$VENDOR_DIR" ]; then
    echo "ERROR: No harvested donor found in vendor/. Run the universal_harvest protocol first."
    exit 1
fi

echo "Booting Cognitive Engine: $VENDOR_DIR"
cd "$VENDOR_DIR"
if [ -f "package.json" ]; then
    npm install
fi

# Boot Node.js in background
PORT=3000 node src/server.js &
NODE_PID=$!

# 3. Boot Python FastAPI in foreground connecting them
echo '[3] Booting cybernetic orchestration API (Public 0.0.0.0:8080)'
cd ../../server
exec uvicorn app.main:app --host 0.0.0.0 --port 8080

# Clean stop trap for the vendor node on exit
trap "kill $NODE_PID" EXIT
