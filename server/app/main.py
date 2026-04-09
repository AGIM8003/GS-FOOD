"""Food Guide API — health + Cook suggest stub (GS-FOOD3 §13, Phase 5).

Heavy Hugging Face / layout models belong in an offline pack pipeline or
optional worker; this service stays deterministic for core journeys.
"""

from __future__ import annotations

from typing import Any, Optional
from datetime import datetime

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field, conlist
import pathlib

from .meal_agent import MealAgent

STATIC_DIR = pathlib.Path(__file__).resolve().parent.parent / "static"

app = FastAPI(title="GS FOOD V4 Cybernetic API", version="4.0.0")

app.mount("/static", StaticFiles(directory=str(STATIC_DIR), html=True), name="static")

@app.get("/", include_in_schema=False)
def root_redirect():
    return RedirectResponse(url="/static/index.html")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "mode": "V4_CYBERNETIC_OS"}

# ==========================================
# PART 2: HEALTH CONTEXT LAYER (H1 WELLNESS)
# ==========================================

class HealthSignalSnapshot(BaseModel):
    snapshot_id: str
    user_id: str
    source_type: str = Field(description="e.g., 'HealthKit', 'HealthConnect'")
    glucose_recent_trend_state: str = Field(description="e.g., 'steady', 'rising', 'falling'")
    glucose_variability_band: str = Field(description="e.g., 'low', 'moderate', 'high'")
    exercise_context: Optional[str] = None
    confidence_score: float = Field(ge=0.0, le=1.0)
    data_freshness_seconds: int

class HealthContextEnvelope(BaseModel):
    mode: str = Field(default="H1", description="Must be H0 or H1. C3 clinical mode fails closed.")
    snapshot: Optional[HealthSignalSnapshot] = None
    user_energy_window: Optional[str] = None
    hydration_proxy: Optional[str] = None

class CookSuggestRequest(BaseModel):
    ingredients: list[str] = Field(min_length=1)
    health_envelope: Optional[HealthContextEnvelope] = None
    meal_slot: Optional[str] = None
    locale: Optional[str] = None
    chef_persona: Optional[str] = "Professional Chef"
    
    # LEVEL A: Behavioral Learning Memory
    positive_affinities: list[str] = Field(default_factory=list, description="Top-K liked cuisines, saved ingredients")
    negative_affinities: list[str] = Field(default_factory=list, description="Top-K rejected/abandoned elements")

# ==========================================
# RESPONSE CONTRACTS (V4 MACHINE PARSABLE)
# ==========================================

class StructuredIngredient(BaseModel):
    name: str
    quantity: float
    unit: str
    category: str
    is_substitution: bool = False
    substitution_for: Optional[str] = None

class SanctityComplianceResult(BaseModel):
    is_compliant: bool
    violated_rules: list[str]
    blocked_ingredients: list[str]
    warning_level: str
    explanation: str

class StructuredMealCard(BaseModel):
    title: str
    time: str
    cuisine: str
    match_type: str
    used_inventory_ingredients: list[StructuredIngredient]
    missing_shopping_deficits: list[StructuredIngredient]
    compliance: SanctityComplianceResult
    ai_explanation_trace: list[str]

class CookSuggestResponse(BaseModel):
    action: str
    suggestion: str
    cards: list[StructuredMealCard]
    source: str

# ==========================================
# NOOR AI SWARM ORCHESTRATOR LOGIC
# ==========================================

from app.auth import get_current_user

@app.post("/v1/cook/suggest", response_model=CookSuggestResponse)
async def cook_suggest(body: CookSuggestRequest, current_user: dict = Depends(get_current_user)) -> CookSuggestResponse:
    """Generates structured recipes using the cybernetic FREE AI engine."""
    
    # MEDICAL CLAIM GUARD: Fail closed if client requests clinical/treatment behavior
    if body.health_envelope and body.health_envelope.mode not in ["H0", "H1"]:
        raise HTTPException(
            status_code=403, 
            detail="MEDICAL_GUARD_ACTIVE: Unlicensed clinical modes (H2/H3) are permanently blocked in this configuration."
        )

    modifiers = []
    
    # Apply H1 Wellness Context if present and fresh
    if body.health_envelope and body.health_envelope.snapshot:
        snap = body.health_envelope.snapshot
        if snap.data_freshness_seconds <= 1800 and snap.confidence_score >= 0.70:
            if snap.glucose_recent_trend_state == "rising":
                modifiers.append("Low Glycemic Load")
                modifiers.append("High Fiber")
            elif snap.glucose_recent_trend_state == "falling":
                modifiers.append("Stable Carb Energy")

    agent = MealAgent()
    payload = await agent.process_cooking_intent(
        available_ingredients=body.ingredients,
        chef_persona=body.chef_persona,
        health_modifiers=modifiers,
        current_user=current_user,
        positive_affinities=body.positive_affinities,
        negative_affinities=body.negative_affinities
    )

    return CookSuggestResponse(
        action="cook_now",
        suggestion="Swarm Orchestrator active.",
        cards=payload.get("cards", []),
        source="cybernetic_swarm_orchestrator"
    )

# ==========================================
from app.database import db
from app.auth import get_current_user, require_internal_service
from fastapi import Depends

@app.get("/api/internal/pantry/inventory")
async def get_internal_pantry_inventory(target_user_id: str, service_context: dict = Depends(require_internal_service)):
    """
    Internal endpoint called by the `gs_food_pantry_lookup` skill 
    running inside the vendored FREE AI engine locally.
    Uses SQLite implementation from database.py.
    Requires internal service scopes via Bearer token to prevent public access.
    """
    inventory_items = db.get_inventory(target_user_id)
    return {
        "status": "success",
        "data": {
            "inventory": inventory_items
        }
    }

# ==========================================
# GS FOOD OPERATOR / ADMIN INTEGRATION
# ==========================================

from app.free_ai_client import FreeAIClient

@app.get("/api/admin/ai_health")
async def get_ai_health():
    """
    Reports the health of the GS FOOD backend alongside the vendored FREE AI.
    """
    client = FreeAIClient()
    try:
        ai_health_result = await client.health()
    finally:
        await client.close()

    return {
        "python_backend": "ok",
        "vendored_free_ai": ai_health_result
    }

@app.get("/api/admin/traces")
async def get_ai_traces(limit: int = 10):
    """
    Proxies FreeAI decision traces to the GS FOOD operator dashboard.
    """
    client = FreeAIClient()
    try:
        traces = await client.get_traces(limit)
    finally:
        await client.close()

    return traces
