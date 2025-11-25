import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app import models
from app.routers import auth, projects, documents, refinement

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Document Platform API",
    description="API for AI-powered document generation and refinement",
    version="1.0.0"
)

# CORS middleware
frontend_origin = os.getenv("FRONTEND_URL", "http://localhost:3000")
# Allow all localhost ports for development
allow_origins = [frontend_origin]
if "localhost" in frontend_origin:
    # Add common localhost ports for development
    allow_origins.extend([
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:3003",
        "http://localhost:3004",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ])
app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(documents.router, prefix="/api/documents", tags=["documents"])
app.include_router(refinement.router, prefix="/api/refinement", tags=["refinement"])

@app.get("/")
async def root():
    return {"message": "AI Document Platform API"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

