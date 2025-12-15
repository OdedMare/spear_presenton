
import os
import sys

# Set environment variables for testing BEFORE importing app
os.environ["CAN_CHANGE_KEYS"] = "false"
os.environ["APP_DATA_DIRECTORY"] = "/tmp/presenton_test"
os.environ["DATABASE_URL"] = "sqlite:///fastapi_test.db"

# Create test directory
if not os.path.exists("/tmp/presenton_test"):
    os.makedirs("/tmp/presenton_test")

import pytest
from fastapi.testclient import TestClient
from api.main import app
from services.database import create_db_and_tables

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    # Attempt to create tables (might need async runner but TestClient handles some async app startup)
    # Since we are using TestClient with existing app, startup events should fire.
    # But database creation logic is usually in lifespan or manual.
    pass

def test_login_flow():
    # Test valid login
    username = "testuser"
    response = client.post("/api/v1/auth/login", json={"username": username})
    assert response.status_code == 200, f"Response: {response.text}"
    data = response.json()
    assert data["username"] == username
    assert "session_token" in data
    assert "user_id" in data
    
    token = data["session_token"]
    
    # Test validate session
    response = client.get("/api/v1/auth/validate", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["valid"] is True
    assert response.json()["username"] == username
    
    # Test logout
    response = client.post("/api/v1/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["success"] is True
    
    # Test validate after logout
    response = client.get("/api/v1/auth/validate", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["valid"] is False

def test_invalid_login():
    # Test empty username
    # If Pydantic validates, it returns 422. If our service validates, it returns 400.
    # We accept either for now to verify "rejection".
    response = client.post("/api/v1/auth/login", json={"username": ""})
    assert response.status_code in [400, 422], f"Expected 400 or 422, got {response.status_code}"
    
    # Test short username
    response = client.post("/api/v1/auth/login", json={"username": "a"})
    assert response.status_code in [400, 422], f"Expected 400 or 422, got {response.status_code}"
