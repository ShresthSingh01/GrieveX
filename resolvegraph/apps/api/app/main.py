import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from .core.database import init_db
from .core.config import ALLOWED_ORIGINS, require_live_ai, APP_MODE, AI_MODE
from .routes import grievances, demo

app = FastAPI(
    title="ResolveGraph API",
    description="Intelligent Agentic Decision Support & Resolution Graph Orchestrator for Complex Public Grievances",
    version="1.0.0"
)

# Enable CORS for Next.js web frontend (Explicit origins + Vercel preview domains)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(grievances.router)
app.include_router(demo.router)

@app.on_event("startup")
def on_startup():
    require_live_ai()
    init_db()

@app.get("/")
def root():
    return {
        "message": "ResolveGraph API is running",
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "ResolveGraph Resolution Engine",
        "mode": "hybrid_deterministic_agentic",
        "version": "1.0.0"
    }
