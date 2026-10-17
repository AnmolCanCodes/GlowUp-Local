"""Pure deterministic comparison functions; no AI-generated factual metrics."""

from statistics import mean
from typing import Iterable

from backend.app.schemas.audit import (
    AuditRequest,
    Competitor,
    ComparisonResult,
    EvidenceItem,
    MetricComparison,
)


def haversine_distance_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate great-circle distance between two coordinates in metres."""
    from math import asin, cos, radians, sin, sqrt

    if not (-90 <= lat1 <= 90 and -90 <= lat2 <= 90):
        raise ValueError("latitude must be between -90 and 90")
    if not (-180 <= lon1 <= 180 and -180 <= lon2 <= 180):
        raise ValueError("longitude must be between -180 and 180")

    earth_radius_m = 6_371_000
    phi1, phi2 = radians(lat1), radians(lat2)
    delta_phi = radians(lat2 - lat1)
    delta_lambda = radians(lon2 - lon1)
    a = sin(delta_phi / 2) ** 2 + cos(phi1) * cos(phi2) * sin(delta_lambda / 2) ** 2
    return 2 * earth_radius_m * asin(sqrt(a))


def _build_metric(owner_value: float | int | None, values: list[float | int | None]) -> MetricComparison:
    available = [float(value) for value in values if value is not None]
    if not available:
        return MetricComparison(owner_value=owner_value, competitors_with_data=0, status="unavailable")
    average = mean(available)
    return MetricComparison(
        owner_value=owner_value,
        competitor_average=round(average, 2),
        competitor_min=round(min(available), 2),
        competitor_max=round(max(available), 2),
        difference_from_average=round(float(owner_value) - average, 2) if owner_value is not None else None,
        competitors_with_data=len(available),
        status="available" if len(available) == len(values) else "partial",
    )


def compare_business(
    owner: AuditRequest,
    owner_coordinates: tuple[float, float],
    competitors: list[Competitor],
) -> ComparisonResult:
    """Compare only owner-supplied and Places-returned fields."""
    owner_lat, owner_lon = owner_coordinates
    competitor_distances: list[float | None] = []
    for competitor in competitors:
        if competitor.latitude is not None and competitor.longitude is not None:
            distance = haversine_distance_m(owner_lat, owner_lon, competitor.latitude, competitor.longitude)
            competitor.distance_meters = round(distance, 1)
            competitor_distances.append(distance)
        else:
            competitor_distances.append(None)

    rating = _build_metric(owner.google_rating, [item.rating for item in competitors])
    reviews = _build_metric(owner.review_count, [item.review_count for item in competitors])
    distance = _build_metric(None, competitor_distances)

    evidence: list[EvidenceItem] = [
        EvidenceItem(id="competitor_count", description=f"Google Places returned {len(competitors)} matching competitor results", source="calculation")
    ] if competitors else []
    if owner.google_rating is not None:
        evidence.append(EvidenceItem(id="owner_rating", description=f"Owner supplied Google rating: {owner.google_rating}/5", source="owner_input"))
    if owner.review_count is not None:
        evidence.append(EvidenceItem(id="owner_review_count", description=f"Owner supplied review count: {owner.review_count}", source="owner_input"))
    if owner.business_description:
        evidence.append(EvidenceItem(id="owner_description", description="The owner supplied a business description for review", source="owner_input"))
    if owner.website_url:
        evidence.append(EvidenceItem(id="owner_website", description="The owner supplied a website URL", source="owner_input"))
    if owner.products_and_services:
        evidence.append(EvidenceItem(id="owner_products_services", description=f"The owner supplied {len(owner.products_and_services)} product or service details", source="owner_input"))
    if rating.competitors_with_data:
        evidence.append(EvidenceItem(id="competitor_ratings", description=f"{rating.competitors_with_data} discovered competitors have rating data; average {rating.competitor_average}/5", source="google_places"))
    if reviews.competitors_with_data:
        evidence.append(EvidenceItem(id="competitor_review_counts", description=f"{reviews.competitors_with_data} discovered competitors have review-count data; average {reviews.competitor_average}", source="google_places"))
    if distance.competitors_with_data:
        evidence.append(EvidenceItem(id="competitor_distances", description=f"Distance calculated for {distance.competitors_with_data} competitors with coordinates", source="calculation"))
    if any(item.website_uri for item in competitors):
        evidence.append(EvidenceItem(id="competitor_websites", description=f"A website URL is available for {sum(bool(item.website_uri) for item in competitors)} discovered competitors", source="google_places"))
    if any(item.address for item in competitors):
        evidence.append(EvidenceItem(id="competitor_addresses", description="Address information is available for discovered competitors", source="google_places"))

    def coverage(values: list[object | None]) -> str:
        found = sum(value is not None for value in values)
        if not values or found == 0:
            return "unavailable"
        return "complete" if found == len(values) else "partial"

    return ComparisonResult(
        competitor_count=len(competitors),
        rating=rating,
        review_count=reviews,
        distance=distance,
        data_coverage={
            "owner_rating": "available" if owner.google_rating is not None else "not_provided",
            "owner_review_count": "available" if owner.review_count is not None else "not_provided",
            "competitor_ratings": coverage([item.rating for item in competitors]),
            "competitor_review_counts": coverage([item.review_count for item in competitors]),
            "competitor_coordinates": coverage([item.latitude if item.latitude is not None and item.longitude is not None else None for item in competitors]),
            "competitor_websites": coverage([item.website_uri for item in competitors]),
        },
        evidence=evidence,
    )