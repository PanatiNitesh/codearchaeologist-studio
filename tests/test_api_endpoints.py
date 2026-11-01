import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

@pytest.fixture(scope="module")
def client():
    return TestClient(app)

def test_api_health_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ready"

def test_api_load_sample_endpoint(client):
    response = client.post("/api/load-sample")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["repo_id"] == "sample_enterprise_ecommerce"

def test_api_handover_endpoint(client):
    response = client.get("/api/repo/sample_enterprise_ecommerce/handover?scenario_id=atc_equipment_status")
    assert response.status_code == 200
    data = response.json()
    assert "title" in data
    assert len(data["completed_items"]) > 0
    assert len(data["incomplete_items"]) > 0
    assert len(data["safety_invariants"]) > 0
    assert "markdown_briefing" in data

def test_api_handover_generate_endpoint(client):
    payload = {
        "scenario_id": "ecommerce_auth_jwt"
    }
    response = client.post("/api/repo/sample_enterprise_ecommerce/handover/generate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["scenario_id"] == "ecommerce_auth_jwt"
    assert len(data["completed_items"]) > 0

def test_api_chesterton_endpoint(client):
    response = client.get("/api/repo/sample_enterprise_ecommerce/chesterton?target_file=src/auth/authService.ts")
    assert response.status_code == 200
    data = response.json()
    assert "fence_score" in data
    assert "provenance" in data
    assert "knowledge_loss" in data
    assert "calibrated_blast_radius" in data

def test_api_precision_matrix_endpoint(client):
    response = client.get("/api/repo/sample_enterprise_ecommerce/precision-matrix?target_symbol=login")
    assert response.status_code == 200
    data = response.json()
    assert "precision_rate_pct" in data
    assert data["precision_rate_pct"] > 60.0

def test_api_benchmark_halfdone_endpoint(client):
    response = client.get("/api/repo/sample_enterprise_ecommerce/benchmark/halfdone?tasks=3")
    assert response.status_code == 200
    data = response.json()
    assert data["benchmark_name"].startswith("HalfDone-Bench")
    assert data["mean_precision"] > 0.6
