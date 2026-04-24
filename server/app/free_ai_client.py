import httpx
import logging
from typing import Dict, Any, Optional, List, Union
from pydantic import BaseModel, Field, ValidationError

logger = logging.getLogger(__name__)

# ===============================================
# UNIFIED REQUEST CONTRACT (GS FOOD Blueprint)
# ===============================================

class TraceFlags(BaseModel):
    emit_detailed_trace: bool = True
    preview_allowed: bool = False
    admin_request: bool = False

class PantryContext(BaseModel):
    items: List[str] = Field(default_factory=list)
    freshness: Dict[str, Any] = Field(default_factory=dict)
    source: str = "user"  # user|memory|system

class DietaryContext(BaseModel):
    restrictions: List[str] = Field(default_factory=list)
    allergies: List[str] = Field(default_factory=list)
    preferences: List[str] = Field(default_factory=list)
    confidence: Dict[str, Any] = Field(default_factory=dict)

class RetrievalContext(BaseModel):
    enabled: bool = True
    sources: List[str] = Field(default_factory=list)
    top_k: int = 0
    filters: Dict[str, Any] = Field(default_factory=dict)

class MemoryContext(BaseModel):
    session_memory_refs: List[str] = Field(default_factory=list)
    durable_memory_refs: List[str] = Field(default_factory=list)
    write_policy_tier: str = "tier1"  # tier1|tier2|tier3

class BudgetPolicy(BaseModel):
    max_cost_tier: str = "standard"  # free|low|standard
    latency_class: str = "balanced"  # fast|balanced|deep
    repair_budget: int = 0

class UnifiedRequestEnvelope(BaseModel):
    request_id: str
    session_id: str
    user_id: Optional[str] = None
    anonymous_id: Optional[str] = None
    task_type: str
    task_intent: str
    user_input: str
    pantry_context: PantryContext = Field(default_factory=PantryContext)
    dietary_context: DietaryContext = Field(default_factory=DietaryContext)
    retrieval_context: RetrievalContext = Field(default_factory=RetrievalContext)
    memory_context: MemoryContext = Field(default_factory=MemoryContext)
    budget_policy: BudgetPolicy = Field(default_factory=BudgetPolicy)
    response_schema_id: str
    trace_flags: TraceFlags = Field(default_factory=TraceFlags)
    timeout_ms: int = 15000

# ===============================================
# UNIFIED RESPONSE CONTRACT (GS FOOD Blueprint)
# ===============================================

class ValidationStatus(BaseModel):
    schema_valid: bool = False
    domain_valid: bool = False
    promotion_status: str = "blocked"  # approved|preview_only|blocked

class UnifiedResponseEnvelope(BaseModel):
    request_id: str
    engine_run_id: Optional[str] = None
    selected_provider: Optional[str] = None
    selected_model: Optional[str] = None
    output_payload: Any = None
    structured_result: Optional[Dict[str, Any]] = None
    validation_status: ValidationStatus = Field(default_factory=ValidationStatus)
    repair_actions: List[str] = Field(default_factory=list)
    citations_or_evidence: List[str] = Field(default_factory=list)
    memory_write_candidates: List[Dict[str, Any]] = Field(default_factory=list)
    decision_trace_ref: Optional[str] = None
    latency_ms: int = 0
    status: str = "unknown"  # success|degraded|blocked|timeout|bridge_error|provider_unavailable
    error: Optional[str] = None

# ===============================================
# BRIDGE CLIENT
# ===============================================

class FreeAIClient:
    """
    GS FOOD Python Client for authenticating and communicating with the locally vendored FREE AI Engine.
    Hardened with absolute Non-Throw Bridge Semantics and Typed Contracts.
    """
    def __init__(self, base_url: str = "http://localhost:3000"):
        self.base_url = base_url
        self.client = httpx.AsyncClient(base_url=self.base_url, timeout=30.0)

    async def execute_task(self, request_envelope: UnifiedRequestEnvelope) -> UnifiedResponseEnvelope:
        fallback_response = UnifiedResponseEnvelope(
            request_id=request_envelope.request_id,
            status="bridge_error"
        )
        try:
            payload = request_envelope.model_dump(exclude_unset=True)
            
            response = await self.client.post("/v1/infer/typed", json=payload, timeout=request_envelope.timeout_ms / 1000.0)
            response.raise_for_status()
            
            resp_data = response.json()
            return UnifiedResponseEnvelope(**resp_data)
        
        except ValidationError as ve:
            logger.error(f"FreeAI Contract Violation: {ve}")
            fallback_response.error = f"Contract Violation: {ve}"
            return fallback_response
            
        except httpx.HTTPStatusError as e:
            logger.error(f"FreeAI Inference Bridge HTTP Error: {e.response.text}")
            fallback_response.error = f"HTTP {e.response.status_code}: {e.response.text}"
            return fallback_response
            
        except httpx.RequestError as e:
            logger.error(f"FreeAI Connection Gateway Error: {e}")
            fallback_response.status = "provider_unavailable"
            fallback_response.error = f"Gateway Connection Error: {str(e)}"
            return fallback_response
            
        except Exception as e:
            logger.error(f"FreeAI Unexpected Execution Failure: {e}")
            fallback_response.error = f"Expected Failure: {str(e)}"
            return fallback_response

    async def health(self) -> Dict[str, Any]:
        try:
            response = await self.client.get("/health", timeout=5.0)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.warning(f"FREE AI is degraded or unreachable: {e}")
            return {"status": "down", "error": str(e)}

    async def get_traces(self, limit: int = 10) -> Dict[str, Any]:
        try:
            response = await self.client.get(f"/admin/traces?limit={limit}", timeout=10.0)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            return {"status": "error", "message": str(e)}

    async def close(self):
        await self.client.aclose()
