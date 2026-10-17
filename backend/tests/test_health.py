from fastapi.testclient import TestClient

from backend.app.main import app


def test_health_does_not_require_api_credentials():
    with TestClient(app) as client:
        response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "glowup-local-api"}


def test_api_starts_without_external_credentials():
    with TestClient(app) as client:
        response = client.get("/openapi.json")
    assert response.status_code == 200
    assert "/api/v1/audits" in response.json()["paths"]