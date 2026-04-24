import json
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, Any

TRACE_DIR = Path("data/traces")

class DecisionTraceWriter:
    @staticmethod
    def ensure_trace_dir():
        TRACE_DIR.mkdir(parents=True, exist_ok=True)

    @staticmethod
    def write_trace(trace_id: str, request_envelope: Dict[str, Any], response_envelope: Dict[str, Any]):
        DecisionTraceWriter.ensure_trace_dir()
        
        try:
            if not trace_id:
                return
                
            trace_path = TRACE_DIR / f"{trace_id}.json"
            
            payload = {
                "timestamp": datetime.utcnow().isoformat(),
                "trace_id": trace_id,
                "request": request_envelope,
                "response": response_envelope
            }
            
            with open(trace_path, "w", encoding='utf-8') as f:
                json.dump(payload, f, indent=2)
                
            # Naive rotation to prevent disk exhaustion
            # (In production, replace with proper logrotate)
            traces = list(TRACE_DIR.glob("*.json"))
            if len(traces) > 1000:
                traces.sort(key=lambda p: p.stat().st_mtime)
                for t in traces[:-1000]:
                    try:
                        t.unlink(missing_ok=True)
                    except Exception:
                        pass
        except Exception as e:
            # Swallow telemetry failure; it must not break the critical path
            print(f"Non-critical Telemetry Error: Failed to write decision trace: {e}")
