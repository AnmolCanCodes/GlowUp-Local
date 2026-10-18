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


def test_google_maps_key_alias_is_supported(monkeypatch):
    from backend.app.core.config import get_settings

    monkeypatch.setenv("GOOGLE_MAP_API_KEY", "demo-google-key")
    monkeypatch.delenv("GOOGLE_MAPS_API_KEY", raising=False)
    get_settings.cache_clear()

    settings = get_settings()

    assert settings.google_maps_api_key == "demo-google-key"


def test_hf_model_defaults_to_supported_gemma_3_model(monkeypatch):
    from backend.app.core.config import get_settings

    monkeypatch.delenv("HF_MODEL", raising=False)
    get_settings.cache_clear()

    settings = get_settings()

    assert settings.hf_model == "google/gemma-3-4b-it"