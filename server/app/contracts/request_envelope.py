from typing import List, Dict, Optional, Any, Literal
from pydantic import BaseModel, Field
import uuid

TaskType = Literal[
    "pantry_match",
    "recipe_generation",
    "meal_plan",
    "dietary_reasoning",
    "substitution_reasoning",
    "structured_extraction",
    "admin_evaluation"
]

class PantryContext(BaseModel):
    items: List[str] = Field(default_factory=list)
    freshness: Dict[str, str] = Field(default_factory=dict)
    source: Literal["user", "memory", "system"] = "user"

class DietaryContext(BaseModel):
    restrictions: List[str] = Field(default_factory=list)
    allergies: List[str] = Field(default_factory=list)
    preferences: List[str] = Field(default_factory=list)
    confidence: Dict[str, float] = Field(default_factory=dict)

class RetrievalContext(BaseModel):
    enabled: bool = True
    sources: List[str] = Field(default_factory=list)
    top_k: int = 0
    filters: Dict[str, Any] = Field(default_factory=dict)

class MemoryContext(BaseModel):
    session_memory_refs: List[str] = Field(default_factory=list)
    durable_memory_refs: List[str] = Field(default_factory=list)
    write_policy_tier: Literal["tier1", "tier2", "tier3"] = "tier1"

class BudgetPolicy(BaseModel):
    max_cost_tier: Literal["free", "low", "standard"] = "free"
    latency_class: Literal["fast", "balanced", "deep"] = "fast"
    repair_budget: int = 0

class TraceFlags(BaseModel):
    emit_detailed_trace: bool = True
    preview_allowed: bool = False
    admin_request: bool = False

class UnifiedRequestEnvelope(BaseModel):
    request_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    user_id: Optional[str] = None
    anonymous_id: Optional[str] = None
    task_type: TaskType
    task_intent: str = ""
    user_input: str = ""
    pantry_context: PantryContext = Field(default_factory=PantryContext)
    dietary_context: DietaryContext = Field(default_factory=DietaryContext)
    retrieval_context: RetrievalContext = Field(default_factory=RetrievalContext)
    memory_context: MemoryContext = Field(default_factory=MemoryContext)
    budget_policy: BudgetPolicy = Field(default_factory=BudgetPolicy)
    response_schema_id: str = ""
    trace_flags: TraceFlags = Field(default_factory=TraceFlags)
    timeout_ms: int = 15000

class ValidationStatus(BaseModel):
    schema_valid: bool = False
    domain_valid: bool = False
    promotion_status: Literal["approved", "preview_only", "blocked"] = "blocked"
    persistence_allowed: bool = False
    display_allowed: bool = False

class UnifiedResponseEnvelope(BaseModel):
    request_id: str
    engine_run_id: Optional[str] = None
    selected_provider: Optional[str] = None
    selected_model: Optional[str] = None
    output_payload: Dict[str, Any] = Field(default_factory=dict)
    structured_result: Dict[str, Any] = Field(default_factory=dict)
    validation_status: ValidationStatus = Field(default_factory=ValidationStatus)
    repair_actions: List[Dict[str, Any]] = Field(default_factory=list)
    citations_or_evidence: List[Dict[str, Any]] = Field(default_factory=list)
    memory_write_candidates: List[Dict[str, Any]] = Field(default_factory=list)
    decision_trace_ref: Optional[str] = None
    latency_ms: int = 0
    status: Literal["success", "degraded", "blocked", "timeout", "bridge_error", "provider_unavailable"]
