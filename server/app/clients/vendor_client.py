import httpx
from typing import Optional, Dict, Any, List
from app.contracts.request_envelope import UnifiedRequestEnvelope
from app.contracts.response_envelope import UnifiedResponseEnvelope
from app.contracts.internal_bridge_errors import (
    BridgeConnectionError, BridgeTimeoutError, BridgeContractError, BridgeDegradedModeError
)

class UniversalVendorClient:
    """
    GS FOOD Unified Vendor Target Bridge.
    This guarantees GS-FOOD operates as the Single Source of Truth
    regardless of which donor engine (Free AI, NOOR, Toga, etc.) is active. 
    """
    def __init__(self, vendor_url: str = "http://127.0.0.1:3000"):
        # The target donor is abstracted strictly to GS FOOD's OS boundary
        self.base_url = vendor_url.rstrip("/")

    async def execute_task(self, envelope: UnifiedRequestEnvelope) -> UnifiedResponseEnvelope:
        url = f"{self.base_url}/v1/infer/typed"
        timeout = envelope.timeout_ms / 1000.0 if envelope.timeout_ms else 15.0
        
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.post(
                    url,
                    json=envelope.model_dump(exclude_none=True)
                )
                
            if response.status_code >= 500:
                raise BridgeDegradedModeError(f"Vendor Harmonization Error: {response.text}")
                
            response.raise_for_status()
            
            data = response.json()
            return UnifiedResponseEnvelope(**data)
            
        except httpx.TimeoutException as e:
            raise BridgeTimeoutError(f"Vendor Bridge timeline exceeded: {str(e)}")
        except httpx.ConnectError as e:
            raise BridgeConnectionError(f"Failed to connect to active GS FOOD Vendor Bridge: {str(e)}")
        except httpx.HTTPStatusError as e:
            raise BridgeContractError(f"HTTP Contract Breach {e.response.status_code} from Vendor Bridge: {e.response.text}")

    async def health(self) -> Dict[str, Any]:
        """Validates that the donor node is properly bound to GS FOOD's V4_CYBERNETIC_OS."""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(f"{self.base_url}/health")
                resp.raise_for_status()
                return resp.json()
        except Exception as e:
            return {"status": "unreachable", "error": str(e)}

    async def get_traces(self, limit: int = 10) -> Any:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(f"{self.base_url}/admin/traces?limit={limit}")
                resp.raise_for_status()
                return resp.json()
        except Exception as e:
            return {"status": "unreachable", "error": str(e)}
            
    async def close(self):
        pass
