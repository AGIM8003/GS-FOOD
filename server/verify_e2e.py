from fastapi.testclient import TestClient
from app.main import app

def run_tests():
    print("Testing GS FOOD FastAPI Implementation...")
    client = TestClient(app)

    # Test 1: Public endpoint
    print("1. Health Endpoint...")
    resp = client.get("/health")
    assert resp.status_code == 200, f"Health failed: {resp.status_code}"
    print("[OK] Health ok")

    # Test 2: Internal endpoint with no token (should fail)
    print("2. Internal Route Security (No Auth)...")
    resp = client.get("/api/internal/pantry/inventory?target_user_id=user1")
    assert resp.status_code == 403, f"Expected 403, got {resp.status_code}"
    print("[OK] Internal routes securely block unauthenticated traffic")

    # Test 3: Internal endpoint with valid service token
    print("3. Internal Route Security (Valid Auth)...")
    resp = client.get(
        "/api/internal/pantry/inventory?target_user_id=user1",
        headers={"Authorization": "Bearer service-token-ai-sidecar"}
    )
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
    assert resp.json()["status"] == "success"
    print("[OK] Internal routes allow internal service tokens")

    # Test 4: Main intent flow with no token
    print("4. User Flow Security (No Auth)...")
    payload = {
        "ingredients": ["Tomato", "Pasta"],
        "chef_persona": "Professional Chef"
    }
    resp = client.post("/v1/cook/suggest", json=payload)
    assert resp.status_code == 403, f"Expected 403, got {resp.status_code}"
    print("[OK] Main logic securely blocks unauthenticated users")

    # Final report
    print("\nEnd-to-End Auth and Flow Verification Success.")

if __name__ == "__main__":
    run_tests()
