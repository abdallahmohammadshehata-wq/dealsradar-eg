import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.core.config import settings
from app.db.init_db import init_db
from app.services.scheduler import scheduler
from app.api.v1.router import api_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Initialize DB and Seed baseline stores/deals
    logger.info("Initializing DealsRadar EG database...")
    await init_db()
    
    # 2. Start periodic background scheduler
    logger.info("Starting background scraping & alert scheduler...")
    await scheduler.start()
    
    yield
    
    # Teardown
    logger.info("Stopping background scheduler...")
    await scheduler.stop()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Automated E-Commerce Deals Radar for the Egyptian Market with Multi-Modal Search and WebPush Alert Engine.",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "market": "Egypt (EGP)",
        "supported_stores": ["Amazon EG", "Noon EG", "Jumia EG", "Custom Extensible"]
    }

# Static file serving for PWA (if frontend/dist or static folder exists)
frontend_dist_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../frontend/dist"))
if not os.path.exists(frontend_dist_path):
    frontend_dist_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../dist"))

if os.path.exists(frontend_dist_path):
    logger.info(f"Mounting frontend static assets from {frontend_dist_path}")
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist_path, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa_frontend(full_path: str):
        file_path = os.path.join(frontend_dist_path, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist_path, "index.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
