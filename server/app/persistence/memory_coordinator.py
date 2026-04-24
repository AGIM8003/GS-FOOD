import json
from typing import List, Dict, Any
from app.database import db

class MemoryCoordinator:
    @staticmethod
    def process_memory_candidates(user_id: str, candidates: List[Dict[str, Any]]):
        """
        Accepts memory_write_candidates from the AI engine and persists them 
        into the database for the user's Behavioral Memory.
        """
        if not user_id or user_id == "anonymous":
            return
            
        for candidate in candidates:
            # Enforce Three-Tier Truth-Gated Memory
            write_tier = candidate.get("write_tier", "tier1")
            memory_key = candidate.get("key")
            memory_value = candidate.get("value")
            confidence = candidate.get("confidence", 0.0)
            confirmed = candidate.get("confirmed_by_user", False)
            
            if not memory_key or not memory_value:
                continue
                
            # Gate 5: Memory Write Safety Constraints
            if write_tier == "tier3" and not confirmed:
                print(f"[Memory Blocked] Tier 3 identity write '{memory_key}' rejected: User confirmation missing.")
                continue
                
            if write_tier == "tier2" and confidence < 0.75:
                print(f"[Memory Blocked] Tier 2 inferred write '{memory_key}' rejected: Confidence {confidence} too low.")
                continue
                
            # Gate 5 Passed: Commit to durable behavior graph
            db.record_affinity(user_id, memory_key, str(memory_value), tier=write_tier)
