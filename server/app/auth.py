from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import logging

logger = logging.getLogger(__name__)

security = HTTPBearer()

# Fake mapping for demonstration of production-readiness JWT claims
TOKEN_DB = {
    "dev-token-user1": {"user_id": "user1", "role": "user", "scopes": ["read", "write"]},
    "service-token-ai-sidecar": {"user_id": "system_ai_orchestrator", "role": "service", "scopes": ["internal_read"]},
}

async def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    """
    Validates JWT token against Auth server.
    Currently uses static lookup for integration hardening representation.
    """
    token = credentials.credentials
    user_data = TOKEN_DB.get(token)
    if not user_data:
        logger.warning(f"Failed authentication attempt with token: {token[:5]}...")
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication credentials"
        )
    return user_data

async def require_internal_service(user_data: dict = Depends(verify_token)):
    if "internal_read" not in user_data.get("scopes", []):
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Internal Service Scope Required"
        )
    return user_data

async def get_current_user(user_data: dict = Depends(verify_token)):
    return user_data
