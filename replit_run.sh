#!/bin/bash
echo '===================================='
echo '  STARTING GS FOOD SYSTEM ON REPLIT '
echo '===================================='

# 1. Setup Python Env
echo '[1] Initializing Python Backend...'
cd server
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
fi
source .venv/bin/activate
pip install -r requirements.txt httpx fastapi uvicorn pydantic

# 2. Setup Node Env (FREE AI Sidecar)
echo '[2] Initializing Node.js AI Sidecar...'
cd ../vendor/free-ai
npm install

# 3. Boot Node.js in background
PORT=3000 node src/server.js &
NODE_PID=$!

# 4. Boot Python FastAPI in foreground
echo '[3] Booting cybernetic orchestration API (Public 0.0.0.0:8080)'
cd ../../server
uvicorn app.main:app --host 0.0.0.0 --port 8080

# Clean stop trap
trap "kill $NODE_PID" EXIT
