from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timedelta

class SurplusItemCluster(BaseModel):
    items: List[str]
    days_to_spoilage: int = Field(description="Negative implies fully spoiled")
    food_safety_confidence: float = Field(ge=0.0, le=1.0)
    quantity_surplus_kg: float

class RescueAction(BaseModel):
    route_type: str = Field(description="e.g., 'COOK_NOW', 'PREP_AND_FREEZE', 'COMMUNITY_SHARE', 'SAFE_DISCARD'")
    instructions: str
    requires_external_connector: bool = False

class SurplusRiskScorer:
    @staticmethod
    def evaluate_urgency(cluster: SurplusItemCluster) -> str:
        # V4 Rule: Safety is paramount.
        if cluster.food_safety_confidence < 0.80 or cluster.days_to_spoilage < 0:
            return "UNSAFE_CRITICAL"
        if cluster.days_to_spoilage <= 2:
            return "HIGH_URGENCY"
        return "NOMINAL"

class SafeDiscardAdvisor:
    @staticmethod
    def generate_discard_advice(cluster: SurplusItemCluster) -> RescueAction:
        return RescueAction(
            route_type="SAFE_DISCARD",
            instructions="Food safety limits exceeded or high spoilage risk. Proceed with municipal compost or safe bio-bin disposal.",
            requires_external_connector=False
        )

class RescueActionPlanner:
    @staticmethod
    def plan_rescue(cluster: SurplusItemCluster, household_capacity: str) -> RescueAction:
        urgency = SurplusRiskScorer.evaluate_urgency(cluster)

        if urgency == "UNSAFE_CRITICAL":
            return SafeDiscardAdvisor.generate_discard_advice(cluster)

        # V4 Rule: Cook and Freeze takes highest priority over external sharing.
        if urgency == "HIGH_URGENCY" and household_capacity == "has_freezer_space":
            return RescueAction(
                route_type="PREP_AND_FREEZE",
                instructions="Batch cook into a stable state (e.g., puree, soup, or blanch) and immediately freeze.",
            )
        
        return RescueAction(
            route_type="COMMUNITY_SHARE",
            instructions="Food is safe but exceeds local execution capacity. Route to connector workflow.",
            requires_external_connector=True
        )

class ConnectorPolicyRegistry:
    """
    Abstracts API connections so the system never fails if an official API is missing.
    """
    @staticmethod
    def attempt_official_listing(cluster: SurplusItemCluster) -> bool:
        # Stub: Try API like Olio. If fail, return False.
        return False 
    
    @staticmethod
    def generate_manual_qr_handoff(cluster: SurplusItemCluster) -> str:
        # V4 Rule: Always support fallback QR/Link logic.
        return f"https://gsfood.local/rescue/{datetime.now().timestamp()}"
