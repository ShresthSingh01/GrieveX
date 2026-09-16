import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.database import init_db
from .routes import grievances, demo

app = FastAPI(
    title="ResolveGraph API",
    description="Intelligent Agentic Decision Support & Resolution Graph Orchestrator for Complex Public Grievances",
    version="1.0.0"
)

# Enable CORS for Next.js web frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(grievances.router)
app.include_router(demo.router)

@app.on_event("startup")
def on_startup():
    init_db()

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "ResolveGraph Resolution Engine",
        "mode": "hybrid_deterministic_agentic",
        "version": "1.0.0"
    }
