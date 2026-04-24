import httpx
from typing import Optional, Dict, Any
from app.contracts.request_envelope import UnifiedRequestEnvelope
from app.contracts.response_envelope import UnifiedResponseEnvelope
from app.contracts.internal_bridge_errors import (
    BridgeConnectionError, BridgeTimeoutError, BridgeContractError, BridgeDegradedModeError
)

class FreeAIClient:
    def __init__(self, base_url: str = "http://127.0.0.1:3000"):
        self.base_url = base_url
        
    async def infer(self, envelope: UnifiedRequestEnvelope) -> UnifiedResponseEnvelope:
        url = f"{self.base_url}/v1/infer/typed"
        timeout = envelope.timeout_ms / 1000.0 if envelope.timeout_ms else 15.0
        
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.post(
                    url,
                    json=envelope.model_dump(exclude_none=True)
                )
                
            if response.status_code >= 500:
                raise BridgeDegradedModeError(f"FreeAI Internal Error: {response.text}")
                
            response.raise_for_status()
            
            data = response.json()
            return UnifiedResponseEnvelope(**data)
            
        except httpx.TimeoutException as e:
            raise BridgeTimeoutError(f"FreeAI Bridge timeout: {str(e)}")
        except httpx.ConnectError as e:
            raise BridgeConnectionError(f"Failed to connect to FreeAI Bridge: {str(e)}")
        except httpx.HTTPStatusError as e:
            raise BridgeContractError(f"HTTP Error {e.response.status_code} from FreeAI Bridge: {e.response.text}")

    async def execute_task(self, envelope: UnifiedRequestEnvelope) -> UnifiedResponseEnvelope:
        return await self.infer(envelope)

    async def health(self) -> Dict[str, Any]:
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
