import os
import sys
from pathlib import Path

# Ensure 'backend' directory is in sys.path so 'import app...' works
# whether launched from root, inside backend, or via VSCode debugger
CURRENT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = CURRENT_DIR.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine, SessionLocal
from app.models.component import Component
from app.seed import seed_database
from app.routers import components_router, learning_paths_router, evaluate_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables created and database seeded
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        count = db.query(Component).count()
        if count == 0:
            seed_database()
    finally:
        db.close()
    yield

app = FastAPI(
    title="Adaptive Learning Path Builder API",
    description="Backend API powering the visual canvas, SQLite persistence, and LangGraph adaptive workflow evaluation.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend applications
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows any local frontend port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(components_router)
app.include_router(learning_paths_router)
app.include_router(evaluate_router)

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "Adaptive Learning Path Builder API"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)

