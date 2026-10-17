"""FastAPI application entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.routes import router
from backend.app.core.config import get_settings
from backend.app.services.audit import AuditService


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Release any application resources on shutdown."""
    yield


settings = get_settings()
app = FastAPI(
    title="GlowUp Local API",
    description="Evidence-based local business visibility and competitor intelligence.",
    version="0.1.0",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)
app.state.audit_service_factory = lambda: AuditService(settings)
app.include_router(router)