import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import generate, settings
from app.core.rate_limit import RateLimitMiddleware

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

app = FastAPI(title="vodnik-backend", version="0.1.0")

# Add rate limiting middleware (before CORS)
app.add_middleware(
    RateLimitMiddleware,
    requests_per_minute=30,  # 30 generation requests per minute
    burst_limit=5,           # Max 5 requests in quick succession (2 seconds)
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(generate.router, prefix="/generate", tags=["generation"])
app.include_router(settings.router, prefix="/settings", tags=["settings"])


@app.get("/")
def read_root():
    return {"message": "Welcome to Vodnik API"}
