from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.responses import JSONResponse

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.models import *  # noqa: F401, F403 Ensure all models registered
from app.engine.seed_data import seed_scenario_catalog
from app.api.router import api_router
from app.schemas.common import ApiResponse


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Safe application startup: ensure schema tables exist and catalog is seeded."""
    settings.ensure_data_directory()
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_scenario_catalog(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Offline-first authoritative mystery game engine for Séance Studio",
    lifespan=lifespan,
)

# Strict CORS restriction to loopback origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Sanitized validation error response avoiding internal leaks."""
    details = {}
    for err in exc.errors():
        loc = ".".join(str(p) for p in err.get("loc", []))
        details[loc] = err.get("msg", "Invalid value")

    response_payload = ApiResponse.fail(
        code="VALIDATION_ERROR",
        message="The request payload failed schema validation.",
        details=details,
    )
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=response_payload.model_dump(),
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Standardized HTTP error envelope with structured domain codes."""
    code = f"HTTP_{exc.status_code}"
    message = str(exc.detail)
    details = None

    if isinstance(exc.detail, dict):
        code = exc.detail.get("code", code)
        message = str(exc.detail.get("message", message))
        details = exc.detail.get("details", None)
    else:
        detail_str = str(exc.detail).lower()
        if exc.status_code == 400:
            if "completed" in detail_str or "session is" in detail_str:
                code = "SESSION_COMPLETED"
            elif "character" in detail_str:
                code = "INVALID_CHARACTER"
        elif exc.status_code == 404:
            if "session" in detail_str or "investigation" in detail_str:
                code = "SESSION_NOT_FOUND"
        elif exc.status_code == 503:
            if "not installed" in detail_str or "model" in detail_str:
                code = "MODEL_NOT_INSTALLED"
            elif "unreachable" in detail_str or "cannot connect" in detail_str or "ollama" in detail_str:
                code = "OLLAMA_UNAVAILABLE"
        elif exc.status_code == 504:
            code = "MODEL_TIMEOUT"
        elif exc.status_code == 502:
            code = "EMPTY_MODEL_RESPONSE"

    response_payload = ApiResponse.fail(
        code=code,
        message=message,
        details=details,
    )
    return JSONResponse(
        status_code=exc.status_code,
        content=response_payload.model_dump(),
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """Defense-in-depth handler: never leak stack traces or server paths."""
    response_payload = ApiResponse.fail(
        code="INTERNAL_SERVER_ERROR",
        message="A server error occurred while processing the inquest.",
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=response_payload.model_dump(),
    )


# Mount versioned API routes
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/")
def read_root():
    """Root metadata probe."""
    return ApiResponse.ok({
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "api_docs": "/docs",
        "api_prefix": settings.API_V1_PREFIX,
        "offline_strict": settings.OFFLINE_STRICT_MODE,
    })
