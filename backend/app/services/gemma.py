"""Gemma inference through Hugging Face's OpenAI-compatible router endpoint."""

import json
import logging
import re
from typing import Any

import httpx
from pydantic import ValidationError

from backend.app.core.config import Settings
from backend.app.schemas.audit import AIAnalysis, AuditRequest, ComparisonResult, Competitor

logger = logging.getLogger(__name__)
HF_CHAT_COMPLETIONS_URL = "https://router.huggingface.co/v1/chat/completions"


class GemmaServiceError(Exception):
    """Safe error raised when model inference or output validation fails."""


class GemmaConfigurationError(GemmaServiceError):
    pass


class GemmaProviderError(GemmaServiceError):
    pass


class GemmaService:
    def __init__(self, settings: Settings, client: httpx.AsyncClient | None = None):
        self.settings = settings
        self.client = client or httpx.AsyncClient(timeout=settings.request_timeout_seconds)
        self._owns_client = client is None

    async def close(self) -> None:
        if self._owns_client:
            await self.client.aclose()

    @staticmethod
    def _extract_json(content: str) -> dict[str, Any]:
        cleaned = content.strip()
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s*```$", "", cleaned)
        start, end = cleaned.find("{"), cleaned.rfind("}")
        if start < 0 or end <= start:
            raise GemmaProviderError("Gemma returned a response that was not valid JSON. Please retry the audit.")
        try:
            result = json.loads(cleaned[start : end + 1])
        except json.JSONDecodeError as exc:
            raise GemmaProviderError("Gemma returned malformed JSON. Please retry the audit.") from exc
        if not isinstance(result, dict):
            raise GemmaProviderError("Gemma returned an unexpected response format. Please retry the audit.")
        return result

    async def generate_recommendations(
        self,
        owner: AuditRequest,
        comparison: ComparisonResult,
        competitors: list[Competitor],
    ) -> AIAnalysis:
        if not self.settings.hf_token:
            raise GemmaConfigurationError("Hugging Face token is not configured. Add HF_TOKEN to .env.")

        allowed_evidence = {item.id for item in comparison.evidence}
        facts = {
            "business": {
                "name": owner.business_name,
                "category": owner.business_category,
                "location": owner.location,
                "description": owner.business_description,
                "products_and_services": owner.products_and_services,
                "target_customer": owner.target_customer,
                "website_provided": bool(owner.website_url),
                "google_business_profile_provided": bool(owner.google_business_profile_url),
            },
            "comparison": comparison.model_dump(mode="json"),
            "competitors": [item.model_dump(mode="json") for item in competitors],
            "allowed_evidence_ids": sorted(allowed_evidence),
        }
        system_prompt = """You are a careful local-business visibility advisor for small businesses in Varanasi, India.
Use ONLY the supplied facts. Do not invent competitor weaknesses, customer feedback, search keywords, ranking positions, ratings, reviews, or missing business details. A missing field means unknown, not absent. Ratings and review counts do not prove service quality or Google ranking. Do not claim that any action will improve rankings or guarantee customers.
Generate a small set of specific, ethical, practical actions. Every recommendation must cite one or more exact IDs from allowed_evidence_ids. If the evidence is insufficient for a claim, do not make that claim. You may recommend that the owner verify information before publishing it. Review requests must ask genuine customers for honest feedback and must never offer incentives or selectively ask only happy customers.
Return ONLY valid JSON matching this shape:
{"recommendations":[{"title":"...","priority":"high|medium|low","reason":"...","action_steps":["..."],"evidence":["exact evidence id"],"effort":"low|medium|high","measurement":"...","confidence":"low|medium|high"}],"content_drafts":[{"title":"...","content":"...","use_case":"business_description|service_description|review_response|review_request|content_idea"}]}
Return 1-4 recommendations. Content drafts may be an empty array. Do not include markdown fences or text outside JSON."""
        user_prompt = "Analyze this factual audit data and return the requested JSON.\n" + json.dumps(facts, ensure_ascii=False)
        headers = {"Authorization": f"Bearer {self.settings.hf_token}", "Content-Type": "application/json"}
        body = {
            "model": self.settings.hf_model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.2,
            "max_tokens": 1800,
        }
        try:
            response = await self.client.post(HF_CHAT_COMPLETIONS_URL, headers=headers, json=body)
            if response.status_code == 429:
                raise GemmaProviderError("Hugging Face inference rate limit reached. Please try again shortly.")
            response.raise_for_status()
            payload = response.json()
            content = payload["choices"][0]["message"]["content"]
            if isinstance(content, list):
                content = "".join(part.get("text", "") for part in content if isinstance(part, dict))
            if not isinstance(content, str):
                raise KeyError("message content")
        except GemmaProviderError:
            raise
        except httpx.TimeoutException as exc:
            raise GemmaProviderError("Gemma inference timed out. Please retry the audit.") from exc
        except httpx.HTTPStatusError as exc:
            logger.warning("Hugging Face inference failed (status=%s)", exc.response.status_code)
            raise GemmaProviderError("Gemma inference failed. Verify model access and your Hugging Face provider configuration.") from exc
        except httpx.HTTPError as exc:
            raise GemmaProviderError("Could not connect to the Hugging Face inference provider. Please try again.") from exc
        except (ValueError, KeyError, IndexError, TypeError) as exc:
            raise GemmaProviderError("Could not read the Gemma inference response. Verify that the selected provider supports chat completions.") from exc

        data = self._extract_json(content)
        try:
            analysis = AIAnalysis.model_validate(data)
        except ValidationError as exc:
            logger.warning("Gemma output failed schema validation")
            raise GemmaProviderError("Gemma returned recommendations that did not match the required schema. Please retry.") from exc

        unsupported = {
            evidence_id
            for recommendation in analysis.recommendations
            for evidence_id in recommendation.evidence
            if evidence_id not in allowed_evidence
        }
        if unsupported:
            raise GemmaProviderError("Gemma cited evidence that was not present in the audit. Please retry.")
        return analysis