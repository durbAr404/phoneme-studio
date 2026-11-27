"""Phoneme Studio API."""

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from .config import get_settings
from .features import showcase_available
from .observability.logging import configure_logging
from .observability.middleware import ObservabilityMiddleware
from .observability.sentry import init_sentry
from .routers import daily, ops, play, public
from .security.middleware import CSRFMiddleware, SecurityHeadersMiddleware


def create_app() -> FastAPI:
    settings = get_settings()
    configure_logging(settings.log_level, json_logs=settings.env != "development")
    init_sentry(settings)
    app = FastAPI(
        title="Phoneme Studio API",
        version=settings.release,
        docs_url=None if settings.is_production else "/docs",
        redoc_url=None,
        openapi_url=None if settings.is_production else "/openapi.json",
    )
    # Order matters: the last added runs first. Observability wraps everything.
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(CSRFMiddleware)
    app.add_middleware(ObservabilityMiddleware)

    @app.exception_handler(RequestValidationError)
    async def validation_error(request: Request, exc: RequestValidationError) -> JSONResponse:
        first = exc.errors()[0] if exc.errors() else {}
        field = ".".join(str(x) for x in first.get("loc", [])[1:])
        message = str(first.get("msg", "Invalid request")).removeprefix("Value error, ")
        return JSONResponse({"detail": f"{field}: {message}" if field else message}, status_code=422)

    for router in (ops.router, public.router, play.router, daily.router):
        app.include_router(router)
    if showcase_available():
        from .showcase import include_routers

        include_routers(app)
    return app


app = create_app()
