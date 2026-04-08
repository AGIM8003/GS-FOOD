"""Food Guide API — health + Cook suggest stub (GS-FOOD3 §13, Phase 5).

Heavy Hugging Face / layout models belong in an offline pack pipeline or
optional worker; this service stays deterministic for core journeys.
"""

from __future__ import annotations

from typing import Any, Optional
from datetime import datetime

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field, conint, conlist
import pathlib

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
    ingredients: conlist(str, min_length=1)
    health_envelope: Optional[HealthContextEnvelope] = None
    meal_slot: Optional[str] = None
    locale: Optional[str] = None

class HealthInfluencedDecision(BaseModel):
    decision_id: str
    base_recipe_id: Optional[str] = None
    health_modifier_set: list[str] = []
    explanation_text: str
    clinical_claim_level: str = "C1" # Restricted to Wellness Personalization
    confidence_score: float

# ==========================================
# SURVIVAL MODE CORE LOGIC
# ==========================================

@app.post("/v1/cook/suggest", response_model=dict)
def cook_suggest(body: CookSuggestRequest) -> dict[str, Any]:
    """Generates recipes bound by the Health Context Envelope and Medical Claim Guard."""
    
    # MEDICAL CLAIM GUARD: Fail closed if client requests clinical/treatment behavior
    if body.health_envelope and body.health_envelope.mode not in ["H0", "H1"]:
        raise HTTPException(
            status_code=403, 
            detail="MEDICAL_GUARD_ACTIVE: Unlicensed clinical modes (H2/H3) are permanently blocked in this configuration."
        )

    # Base Deterministic Survival Logic (V3 Fallback)
    first_ingredient = body.ingredients[0]
    base_suggestion = f"Batch-prep {first_ingredient} and refrigerate."
    explanation = "Standard pantry retrieval utilized."
    modifiers = []

    # Apply H1 Wellness Context if present and fresh
    if body.health_envelope and body.health_envelope.snapshot:
        snap = body.health_envelope.snapshot
        if snap.data_freshness_seconds <= 1800 and snap.confidence_score >= 0.70:
            if snap.glucose_recent_trend_state == "rising":
                modifiers.append("reduce simple-carb bias")
                modifiers.append("increase fiber pairing score")
                base_suggestion = f"Pair {first_ingredient} with high-fiber greens to stabilize glycemic response."
                explanation = "Recipe adapted for lower glycemic load based on recent high-confidence trend signals."
        else:
            explanation = "Health data stale or low confidence. Defaulting to general culinary utility."

    decision = HealthInfluencedDecision(
        decision_id=f"dec_{int(datetime.now().timestamp())}",
        health_modifier_set=modifiers,
        explanation_text=explanation,
        clinical_claim_level="C1" if modifiers else "C0",
        confidence_score=0.95
    )

    return {
        "action": "cook_now",
        "suggestion": base_suggestion,
        "health_context_decision": decision.dict(),
        "source": "cybernetic_wellness_engine"
    }
