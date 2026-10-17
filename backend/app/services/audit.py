"""Orchestrates location lookup, competitor discovery, comparison, and AI analysis."""

from datetime import datetime, timezone
from uuid import uuid4

from backend.app.core.config import Settings
from backend.app.schemas.audit import AuditRequest, AuditResponse
from backend.app.services.comparison import compare_business
from backend.app.services.gemma import GemmaService
from backend.app.services.places import PlacesService


class AuditService:
    def __init__(self, settings: Settings):
        self.places = PlacesService(settings)
        self.gemma = GemmaService(settings)

    async def close(self) -> None:
        await self.places.close()
        await self.gemma.close()

    async def create_audit(self, request: AuditRequest) -> AuditResponse:
        coordinates = await self.places.resolve_location(request)
        competitors = await self.places.find_competitors(request, coordinates)
        comparison = compare_business(
            request,
            (coordinates.latitude, coordinates.longitude),
            competitors,
        )
        ai_analysis = await self.gemma.generate_recommendations(request, comparison, competitors)

        missing_notes: list[str] = []
        if request.google_rating is None:
            missing_notes.append("Your Google rating was not supplied, so an owner-versus-competitor rating comparison is unavailable.")
        if request.review_count is None:
            missing_notes.append("Your review count was not supplied, so an owner-versus-competitor review-count comparison is unavailable.")
        if not competitors:
            missing_notes.append("No matching competitors were returned for this search. Try a more specific category or a different search location.")
        for field, status in comparison.data_coverage.items():
            if status in {"partial", "unavailable", "not_provided"}:
                missing_notes.append(f"{field.replace('_', ' ').capitalize()} data is {status.replace('_', ' ')}.")

        limitations = [
            "Google Places results are a sample of businesses matching this query and search area, not a complete list of competitors.",
            "Public ratings and review counts do not explain Google ranking positions or prove service quality.",
            "AI recommendations are decision support, not guarantees of higher rankings, traffic, customers, or revenue.",
            "Business owners should verify generated content and all business details before publishing.",
            "Google Places data is returned live for this audit and is not persisted by this application.",
        ]
        return AuditResponse(
            audit_id=uuid4(),
            business_name=request.business_name,
            business_category=request.business_category,
            location_searched=request.location,
            competitors=competitors,
            comparison=comparison,
            recommendations=ai_analysis.recommendations,
            content_drafts=ai_analysis.content_drafts,
            data_sources=["Google Places API (New)", f"Hugging Face Inference API ({self.gemma.settings.hf_model})", "Deterministic Python calculations"],
            limitations=limitations,
            missing_data_notes=missing_notes,
            generated_at=datetime.now(timezone.utc).isoformat(),
        )