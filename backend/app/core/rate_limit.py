import time
from collections import defaultdict
from fastapi import HTTPException, Request, status

class InMemoryRateLimiter:
    """
    Sliding window rate limiter using in-memory timestamps per client IP.
    Ensures safe operation without requiring Redis for prototype/production single-instance setup.
    """
    def __init__(self):
        self.requests = defaultdict(list)

    def check_rate_limit(self, request: Request, max_requests: int = 60, window_seconds: int = 60):
        client_ip = request.client.host if request.client else "127.0.0.1"
        # Check X-Forwarded-For if behind a reverse proxy
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()

        now = time.time()
        window_start = now - window_seconds
        
        # Clean older entries
        self.requests[client_ip] = [t for t in self.requests[client_ip] if t > window_start]
        
        if len(self.requests[client_ip]) >= max_requests:
            retry_after = int(window_seconds - (now - self.requests[client_ip][0]))
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Try again in {max(1, retry_after)} seconds.",
                headers={"Retry-After": str(max(1, retry_after))}
            )
            
        self.requests[client_ip].append(now)

rate_limiter = InMemoryRateLimiter()
