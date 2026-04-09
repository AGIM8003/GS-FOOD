# GS FOOD Orchestration Runbook

## Overview
This runbook describes how to operate the fully orchestrated GS FOOD system, which consists of two tightly coupled local applications:
1. **GS FOOD Python Backend**: The host, running FastAPI (in `server/app`).
2. **Vendored FREE AI Engine**: The core intelligence sidecar, running Node.js (in `vendor/free-ai`).

## Startup Sequence
To run the full end-to-end application, **both** servers must be running locally.
1. Start the FREE AI Sidecar:
   ```bash
   cd vendor/free-ai
   node src/server.js
   # Expected: Runs on port 3000
   ```
2. Start the GS FOOD Backend:
   ```bash
   cd server
   uvicorn app.main:app --reload --port 8000
   # Expected: Runs on port 8000
   ```

## Architecture Map
- **Frontend / Client** hits `http://localhost:8000`
- **GS FOOD** acts as the Domain Orchestrator and exposes `/v1/cook/suggest`, `/api/admin/ai_health`, and internal APIs.
- **GS FOOD Agent Logic** uses `FreeAIClient` (via REST) to defer to the intelligent Engine.
- **FREE AI** consumes `/v1/infer` requests from GS FOOD, applies the `gs_food_culinary_guide` persona, executes reasoning, and if necessary uses the `gs_food_pantry_lookup` skill to ping backwards to `http://localhost:8000/api/internal/pantry/inventory`.

## Operator Commands
**Check Combined Health:**
`curl http://localhost:8000/api/admin/ai_health`

**Check AI Reasoning Traces:**
`curl http://localhost:8000/api/admin/traces?limit=10`

**Run E2E Integrity Test:**
```bash
python server/test_orchestration.py
```
