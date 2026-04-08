from enum import Enum
from pydantic import BaseModel
from typing import Optional

class ClaimLevel(Enum):
    C0_GENERAL_UTILITY = "C0"
    C1_WELLNESS_PERSONALIZATION = "C1"
    C2_CONDITION_AWARE_SUPPORT = "C2" 
    C3_CLINICAL_DECISION_INFLUENCE = "C3"

class EscalationPolicyEngine:
    """
    V4 Rule: Ensure the app NEVER acts as a clinical physician. 
    Limits bounds strictly to C0-C2.
    """
    @staticmethod
    def is_claim_authorized(requested_level: ClaimLevel) -> bool:
        if requested_level == ClaimLevel.C3_CLINICAL_DECISION_INFLUENCE:
            # FATAL: Fails closed. App is not FDA/Medical cleared in this branch.
            return False
        return True

class AuditReceipt(BaseModel):
    decision_id: str
    timestamp_utc: str
    claim_level: str
    user_id: str
    explanation: Optional[str] = None

class PrivacyRetentionEnforcer:
    @staticmethod
    def requires_purge(health_data_timestamp: float) -> bool:
        # V4 Rule: Purge raw health telemetry rapidly (e.g., 7 days max).
        import time
        SEVEN_DAYS_SECONDS = 7 * 24 * 60 * 60
        return (time.time() - health_data_timestamp) > SEVEN_DAYS_SECONDS
