from typing import List, Dict, Optional, Any, Literal
from pydantic import BaseModel, Field

class ValidationStatus(BaseModel):
    schema_valid: bool = False
    domain_valid: bool = False
    promotion_status: Literal["approved", "preview_only", "blocked"] = "blocked"

ResponseStatus = Literal[
    "success",
    "degraded",
    "blocked",
    "timeout",
    "bridge_error",
    "provider_unavailable"
]

class UnifiedResponseEnvelope(BaseModel):
    request_id: str
    engine_run_id: str
    selected_provider: Optional[str] = None
    selected_model: Optional[str] = None
    output_payload: Dict[str, Any] = Field(default_factory=dict)
    structured_result: Dict[str, Any] = Field(default_factory=dict)
    validation_status: ValidationStatus = Field(default_factory=ValidationStatus)
    repair_actions: List[Dict[str, Any]] = Field(default_factory=list)
    citations_or_evidence: List[Dict[str, Any]] = Field(default_factory=list)
    memory_write_candidates: List[Dict[str, Any]] = Field(default_factory=list)
    decision_trace_ref: str = ""
    latency_ms: int = 0
    status: ResponseStatus = "success"
