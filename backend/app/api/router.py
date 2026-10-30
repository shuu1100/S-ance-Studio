from fastapi import APIRouter
from app.api.v1 import (
    health,
    scenarios,
    investigations,
    messages,
    choices,
    discoveries,
    evidence,
    journal,
    complete,
    inquiries,
)

api_router = APIRouter()

# Include version 1 endpoints
api_router.include_router(health.router)
api_router.include_router(scenarios.router)
api_router.include_router(investigations.router)
api_router.include_router(messages.router)
api_router.include_router(choices.router)
api_router.include_router(discoveries.router)
api_router.include_router(evidence.router)
api_router.include_router(journal.router)
api_router.include_router(complete.router)
api_router.include_router(inquiries.router)
