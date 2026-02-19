import time
from collections import defaultdict
from typing import Callable

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Simple in-memory rate limiter using a sliding window approach.

    For production, consider using Redis-based rate limiting for
    distributed deployments.
    """

    def __init__(
        self,
        app,
        requests_per_minute: int = 30,
        burst_limit: int = 5,
        excluded_paths: list[str] | None = None,
    ):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.burst_limit = burst_limit
        self.excluded_paths = excluded_paths or ["/", "/settings", "/settings/models"]
        # Track requests per client: {client_ip: [(timestamp, count), ...]}
        self.request_log: dict[str, list[float]] = defaultdict(list)
        # Track burst requests (requests in quick succession)
        self.burst_log: dict[str, list[float]] = defaultdict(list)
        self.burst_window = 2.0  # seconds

    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP from request."""
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    def _clean_old_requests(self, client_ip: str, current_time: float) -> None:
        """Remove requests older than 1 minute from the log."""
        cutoff = current_time - 60.0
        self.request_log[client_ip] = [
            ts for ts in self.request_log[client_ip] if ts > cutoff
        ]
        # Clean burst log (2 second window)
        burst_cutoff = current_time - self.burst_window
        self.burst_log[client_ip] = [
            ts for ts in self.burst_log[client_ip] if ts > burst_cutoff
        ]

    def _is_rate_limited(self, client_ip: str) -> tuple[bool, str | None]:
        """Check if client should be rate limited."""
        current_time = time.time()
        self._clean_old_requests(client_ip, current_time)

        # Check burst limit first
        if len(self.burst_log[client_ip]) >= self.burst_limit:
            return True, "Too many requests in quick succession. Please slow down."

        # Check per-minute limit
        if len(self.request_log[client_ip]) >= self.requests_per_minute:
            return True, f"Rate limit exceeded. Maximum {self.requests_per_minute} requests per minute."

        # Record this request
        self.request_log[client_ip].append(current_time)
        self.burst_log[client_ip].append(current_time)
        return False, None

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip rate limiting for excluded paths
        if request.url.path in self.excluded_paths:
            return await call_next(request)

        # Only rate limit POST requests (generation endpoints)
        if request.method != "POST":
            return await call_next(request)

        client_ip = self._get_client_ip(request)
        is_limited, message = self._is_rate_limited(client_ip)

        if is_limited:
            return JSONResponse(
                status_code=429,
                content={
                    "detail": message,
                    "error_type": "rate_limit_exceeded",
                },
                headers={"Retry-After": "60"},
            )

        return await call_next(request)
