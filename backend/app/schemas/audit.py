"""Pydantic request and response schemas for business visibility audits."""

from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, model_validator


class AuditRequest(BaseModel):
    """Information supplied by a business owner to start an audit."""

    model_config = ConfigDict(str_strip_whitespace=True)

    business_name: str = Field(min_length=2, max_length=120)
    business_category: str = Field(min_length=2, max_length=100)
    location: str = Field(min_length=2, max_length=250)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    google_rating: float | None = Field(default=None, ge=0, le=5)
    review_count: int | None = Field(default=None, ge=0)
    business_description: str | None = Field(default=None, max_length=2000)
    website_url: HttpUrl | None = None
    google_business_profile_url: HttpUrl | None = None
    products_and_services: list[str] = Field(default_factory=list, max_length=30)
    target_customer: str | None = Field(default=None, max_length=500)

    @model_validator(mode="after")
    def coordinates_must_be_paired(self) -> "AuditRequest":
        if (self.latitude is None) != (self.longitude is None):
            raise ValueError("latitude and longitude must be provided together")
        return self


class Coordinates(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


class Competitor(BaseModel):
    """Public Places API fields actually returned for one nearby business."""

    place_id: str | None = None
    name: str
    address: str | None = None
    primary_type: str | None = None
    types: list[str] = Field(default_factory=list)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    rating: float | None = Field(default=None, ge=0, le=5)
    review_count: int | None = Field(default=None, ge=0)
    website_uri: str | None = None
    google_maps_uri: str | None = None
    distance_meters: float | None = Field(default=None, ge=0)


class EvidenceItem(BaseModel):
    id: str
    description: str
    source: Literal["owner_input", "google_places", "calculation"]


class MetricComparison(BaseModel):
    owner_value: float | int | None = None
    competitor_average: float | None = None
    competitor_min: float | None = None
    competitor_max: float | None = None
    difference_from_average: float | None = None
    competitors_with_data: int = Field(ge=0)
    status: Literal["available", "partial", "unavailable"]


class ComparisonResult(BaseModel):
    competitor_count: int = Field(ge=0)
    rating: MetricComparison
    review_count: MetricComparison
    distance: MetricComparison
    data_coverage: dict[str, str]
    evidence: list[EvidenceItem]


class Recommendation(BaseModel):
    title: str = Field(min_length=3, max_length=160)
    priority: Literal["high", "medium", "low"]
    reason: str = Field(min_length=10, max_length=1000)
    action_steps: list[str] = Field(min_length=1, max_length=6)
    evidence: list[str] = Field(min_length=1, max_length=8)
    effort: Literal["low", "medium", "high"]
    measurement: str = Field(min_length=5, max_length=500)
    confidence: Literal["low", "medium", "high"]


class ContentDraft(BaseModel):
    title: str = Field(min_length=3, max_length=120)
    content: str = Field(min_length=5, max_length=1500)
    use_case: Literal[
        "business_description",
        "service_description",
        "review_response",
        "review_request",
        "content_idea",
    ]


class AIAnalysis(BaseModel):
    recommendations: list[Recommendation] = Field(min_length=1, max_length=6)
    content_drafts: list[ContentDraft] = Field(default_factory=list, max_length=5)


class AuditResponse(BaseModel):
    audit_id: UUID
    business_name: str
    business_category: str
    location_searched: str
    competitors: list[Competitor]
    comparison: ComparisonResult
    recommendations: list[Recommendation]
    content_drafts: list[ContentDraft]
    data_sources: list[str]
    limitations: list[str]
    missing_data_notes: list[str]
    generated_at: str