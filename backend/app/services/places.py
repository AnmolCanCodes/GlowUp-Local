"""Google Places API (New) integration using official HTTP endpoints."""

import logging
import re
from typing import Any

import httpx

from backend.app.core.config import Settings
from backend.app.schemas.audit import AuditRequest, Competitor, Coordinates

logger = logging.getLogger(__name__)
GEOCODING_URL = "https://maps.googleapis.com/maps/api/geocode/json"
TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"
FIELD_MASK = ",".join([
    "places.id", "places.displayName", "places.formattedAddress", "places.location",
    "places.primaryType", "places.types", "places.rating", "places.userRatingCount",
    "places.websiteUri", "places.googleMapsUri",
])


class PlacesServiceError(Exception):
    """A safe, user-facing error from Google Maps Platform."""


class PlacesConfigurationError(PlacesServiceError):
    pass


class PlacesProviderError(PlacesServiceError):
    pass


class PlacesService:
    def __init__(self, settings: Settings, client: httpx.AsyncClient | None = None):
        self.settings = settings
        self.client = client or httpx.AsyncClient(timeout=settings.request_timeout_seconds)
        self._owns_client = client is None

    async def close(self) -> None:
        if self._owns_client:
            await self.client.aclose()

    async def resolve_location(self, request: AuditRequest) -> Coordinates:
        if request.latitude is not None and request.longitude is not None:
            return Coordinates(latitude=request.latitude, longitude=request.longitude)
        if not self.settings.google_maps_api_key:
            raise PlacesConfigurationError("Google Maps API key is not configured. Add GOOGLE_MAPS_API_KEY to .env.")
        try:
            response = await self.client.get(
                GEOCODING_URL,
                params={"address": request.location, "key": self.settings.google_maps_api_key},
            )
            response.raise_for_status()
            payload = response.json()
        except (httpx.HTTPError, ValueError) as exc:
            raise PlacesProviderError("Google location lookup failed. Please try again.") from exc
        if payload.get("status") != "OK" or not payload.get("results"):
            status = payload.get("status", "UNKNOWN_ERROR")
            raise PlacesProviderError(f"Google could not resolve this location (status: {status}). Try a more specific address or provide coordinates.")
        location = payload["results"][0]["geometry"]["location"]
        return Coordinates(latitude=location["lat"], longitude=location["lng"])

    @staticmethod
    def _normalized_name(value: str) -> str:
        return re.sub(r"[^a-z0-9]+", "", value.casefold())

    async def find_competitors(self, request: AuditRequest, coordinates: Coordinates) -> list[Competitor]:
        if not self.settings.google_maps_api_key:
            raise PlacesConfigurationError("Google Maps API key is not configured. Add GOOGLE_MAPS_API_KEY to .env.")
        body: dict[str, Any] = {
            "textQuery": f"{request.business_category} near {coordinates.latitude},{coordinates.longitude}",
            "locationBias": {
                "circle": {
                    "center": {"latitude": coordinates.latitude, "longitude": coordinates.longitude},
                    "radius": float(self.settings.places_search_radius_m),
                }
            },
            "maxResultCount": self.settings.places_max_results,
        }
        headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": self.settings.google_maps_api_key,
            "X-Goog-FieldMask": FIELD_MASK,
        }
        try:
            response = await self.client.post(TEXT_SEARCH_URL, json=body, headers=headers)
            if response.status_code == 429:
                raise PlacesProviderError("Google Places rate limit reached. Please wait and try again.")
            response.raise_for_status()
            payload = response.json()
        except PlacesProviderError:
            raise
        except (httpx.TimeoutException, httpx.NetworkError) as exc:
            raise PlacesProviderError("Google Places request timed out or could not connect. Please try again.") from exc
        except httpx.HTTPStatusError as exc:
            logger.warning("Google Places request failed (status=%s)", exc.response.status_code)
            raise PlacesProviderError("Google Places could not complete the competitor search. Check API access and billing.") from exc
        except ValueError as exc:
            raise PlacesProviderError("Google Places returned an invalid response. Please retry.") from exc
        except httpx.HTTPError as exc:
            raise PlacesProviderError("Could not connect to Google Places. Please try again.") from exc

        if payload.get("error"):
            raise PlacesProviderError("Google Places returned an API error. Check your API key, enabled APIs, and billing.")

        results: list[Competitor] = []
        owner_name = self._normalized_name(request.business_name)
        for place in payload.get("places", []):
            display_name = place.get("displayName") or {}
            name = display_name.get("text")
            if not name:
                continue
            if owner_name and self._normalized_name(name) == owner_name:
                continue
            location = place.get("location") or {}
            try:
                results.append(Competitor(
                    place_id=place.get("id"),
                    name=name,
                    address=place.get("formattedAddress"),
                    primary_type=place.get("primaryType"),
                    types=place.get("types") or [],
                    latitude=location.get("latitude"),
                    longitude=location.get("longitude"),
                    rating=place.get("rating"),
                    review_count=place.get("userRatingCount"),
                    website_uri=place.get("websiteUri"),
                    google_maps_uri=place.get("googleMapsUri"),
                ))
            except (TypeError, ValueError):
                # Ignore an individual malformed record; never fill in missing facts.
                logger.info("Skipping malformed Places result")
        return results