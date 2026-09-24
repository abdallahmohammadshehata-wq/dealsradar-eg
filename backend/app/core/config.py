import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "DealsRadar EG (صائد الصفقات)"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./dealsradar.db")
    
    # Web Push / VAPID Keys
    # Default development keys (can be overridden by environment variables)
    VAPID_PUBLIC_KEY: str = os.getenv(
        "VAPID_PUBLIC_KEY",
        "BCyqZ7r2o9O0jN4g6mR9B4BXZN8Q7zD1fM8N5bK4wL3vR2cT9xY7uI1oP0aE3dF5gH7jK9lZ1xC3vB5nN7mQ="
    )
    VAPID_PRIVATE_KEY: str = os.getenv(
        "VAPID_PRIVATE_KEY",
        "MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgYVb4T6J8sQ2zD1fM8N5bK4wL3vR2cT9xY7uI1oP0aEK1e"
    )
    VAPID_CLAIM_EMAIL: str = os.getenv("VAPID_CLAIM_EMAIL", "mailto:alerts@dealsradar-eg.com")
    
    # Scraper & Ingestion Settings
    SCRAPER_USER_AGENTS: List[str] = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1",
        "Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36"
    ]
    CRAWL_INTERVAL_MINUTES: int = int(os.getenv("CRAWL_INTERVAL_MINUTES", "15"))
    AUTO_SEED_ON_STARTUP: bool = True
    
    # Rate Limiting
    RATE_LIMIT_SEARCH_PER_MINUTE: int = 60
    RATE_LIMIT_MEDIA_PER_MINUTE: int = 30
    
    # Allowed CORS Origins
    CORS_ORIGINS: List[str] = ["*"]
    
    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
