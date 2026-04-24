from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

def require_internal_service(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Validates that the incoming request is from a trusted internal service 
    (e.g., the local Free AI engine node)
    """
    token = credentials.credentials
    # In production, this would be validated against a shared secret or public key
    if token != "internal_gs_food_bridge_token_2026":
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Invalid internal service token"
        )
    return {"service": "free_ai"}

def verify_public_request(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Normal public user JWT validation stub
    """
    token = credentials.credentials
    if not token:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return {"user_id": "authenticated_user", "tier": "registered"}
