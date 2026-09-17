import os
from typing import List

# Environment Modes: production | development | test
APP_MODE = os.getenv("APP_MODE", "development").strip().lower()

# AI Modes: live | offline
AI_MODE = os.getenv("AI_MODE", "offline").strip().lower()

# Gemini API Key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()

# Allowed CORS Origins
_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
ALLOWED_ORIGINS: List[str] = [origin.strip() for origin in _raw_origins.split(",") if origin.strip()]

def require_live_ai():
    """
    Validates operational constraints on startup.
    In production mode, live AI is strictly enforced with zero silent degradation.
    """
    if APP_MODE == "production":
        if AI_MODE != "live":
            raise RuntimeError(
                f"Configuration Error: APP_MODE=production requires AI_MODE=live. Currently AI_MODE='{AI_MODE}'."
            )
        if not GEMINI_API_KEY:
            raise RuntimeError(
                "Configuration Error: GEMINI_API_KEY environment variable is required when running in production with live AI."
            )

def is_production() -> bool:
    return APP_MODE == "production"

def is_live_ai() -> bool:
    return AI_MODE == "live"
