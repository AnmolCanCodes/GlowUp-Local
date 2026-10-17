"""HTTP API routes for GlowUp Local."""

from fastapi import APIRouter, HTTPException, Request, status

from backend.app.schemas.audit import AuditRequest, AuditResponse
from backend.app.services.gemma import GemmaConfigurationError, GemmaProviderError
from backend.app.services.places import PlacesConfigurationError, PlacesProviderError

router = APIRouter()


@router.get("/health", tags=["health"])
async def health() -> dict[str, str]:
    """Health check; intentionally does not require external credentials."""
    return {"status": "ok", "service": "glowup-local-api"}


@router.post("/api/v1/audits", response_model=AuditResponse, status_code=status.HTTP_200_OK, tags=["audits"])
async def create_audit(payload: AuditRequest, request: Request) -> AuditResponse:
    """Run a live competitor audit and return the report without persisting it."""
    service = request.app.state.audit_service_factory()
    try:
        return await service.create_audit(payload)
    except (PlacesConfigurationError, GemmaConfigurationError) as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except (PlacesProviderError, GemmaProviderError) as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    finally:
        await service.close()