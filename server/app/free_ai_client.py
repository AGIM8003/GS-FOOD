import httpx
import logging
from typing import Dict, Any, Optional
from pydantic import BaseModel, ValidationError

logger = logging.getLogger(__name__)

class InferRequest(BaseModel):
    text: str
    context: Optional[Dict[str, Any]] = None
    forced_persona: Optional[str] = None

class FreeAIClient:
    """
    GS FOOD Python Client for authenticating and communicating with the locally vendored FREE AI Engine.
    Hardened with Pydantic validation and HTTP tracking.
    """
    def __init__(self, base_url: str = "http://localhost:3000"):
        self.base_url = base_url
        self.client = httpx.AsyncClient(base_url=self.base_url, timeout=30.0)

    async def infer(self, text: str, context: Optional[Dict[str, Any]] = None, forced_persona: Optional[str] = None) -> Dict[str, Any]:
        """
        Sends a request to the FREE AI reasoning pipeline.
        """
        try:
            # Validate Outgoing Schema
            req = InferRequest(text=text, context=context, forced_persona=forced_persona)
            payload = req.model_dump(exclude_unset=True)
            
            response = await self.client.post("/v1/infer", json=payload)
            response.raise_for_status()
            
            # Simple assumption of valid returned JSON structure
            return response.json()
        
        except ValidationError as ve:
            logger.error(f"FreeAI Request Validation Error: {ve}")
            return {"error": "Invalid request schema", "details": str(ve)}
        except httpx.HTTPStatusError as e:
            logger.error(f"FreeAI Inference Error: {e.response.text}")
            return {"error": str(e), "status_code": e.response.status_code}
        except httpx.RequestError as e:
            logger.error(f"FreeAI Connection Error: {e}")
            return {"error": "Failed to reach AI Engine", "details": str(e)}

    async def health(self) -> Dict[str, Any]:
        try:
            response = await self.client.get("/health")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            return {"status": "down", "error": str(e)}

    async def get_traces(self, limit: int = 10) -> Dict[str, Any]:
        try:
            response = await self.client.get(f"/admin/traces?limit={limit}")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            return {"status": "error", "message": str(e)}

    async def close(self):
        await self.client.aclose()
