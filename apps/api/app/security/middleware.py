"""Request-level protections: CSRF checks and security headers."""

from urllib.parse import urlparse

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from ..config import get_settings

SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}
CSRF_HEADER = "x-requested-with"
CSRF_VALUE = "phonemestudio"
CSRF_EXEMPT_PREFIXES = ("/internal/",)


class CSRFMiddleware(BaseHTTPMiddleware):
    """Blocks cross-site form posts.

    Every state-changing request must carry a custom header (which a cross-site form or
    image tag cannot send without a CORS preflight we never allow), and, if the browser
    sends an Origin, it must be one of ours.
    """

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        if request.method not in SAFE_METHODS and not request.url.path.startswith(CSRF_EXEMPT_PREFIXES):
            if request.headers.get(CSRF_HEADER) != CSRF_VALUE:
                return JSONResponse({"detail": "Missing request header."}, status_code=403)
            origin = request.headers.get("origin")
            if origin:
                allowed = {urlparse(o).netloc for o in get_settings().allowed_origins}
                if urlparse(origin).netloc not in allowed:
                    return JSONResponse({"detail": "Request origin not allowed."}, status_code=403)
        return await call_next(request)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        response = await call_next(request)
        h = response.headers
        h.setdefault("X-Content-Type-Options", "nosniff")
        h.setdefault("X-Frame-Options", "DENY")
        h.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        h.setdefault("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'")
        h.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
        path = request.url.path
        if path.startswith(("/auth", "/admin", "/me", "/saves")):
            h["Cache-Control"] = "no-store"
            h["X-Robots-Tag"] = "noindex"
        if get_settings().is_production:
            h.setdefault("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload")
        return response
