from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from app.core.config import settings
from app.core.database import connect_db, close_db
from app.api.routes import auth, research, agents, websocket


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_db()
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    yield
    # Shutdown
    await close_db()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Multi-Agent AI Research Platform API",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for uploads
if os.path.exists(settings.UPLOAD_DIR):
    app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

from app.api.routes import auth, research, agents, websocket, export

# Routes
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(research.router, prefix="/research", tags=["Research"])
app.include_router(agents.router, prefix="/agents", tags=["Agents"])
app.include_router(export.router, prefix="/research", tags=["Export"])
app.include_router(websocket.router, prefix="/ws", tags=["WebSocket"])


@app.get("/")
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "operational",
        "docs": "/docs",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
