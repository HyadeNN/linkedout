from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import uvicorn
import logging

from sqlalchemy.orm import Session

from app.config import settings
from app.database import engine, Base, get_db
from app.controller import api_router

from app.utils.seed_db import seed_database
from app.database import SessionLocal

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Create uploads directory if it doesn't exist
os.makedirs(settings.UPLOADS_DIR, exist_ok=True)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION
)

# CORS Configuration with more permissive settings for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins in development
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
    expose_headers=["Content-Type", "X-Content-Type-Options", "X-Frame-Options"]
)

# Simple test endpoint
@app.get("/test-cors")
async def test_cors():
    logger.info("CORS test endpoint called")
    return {"message": "CORS is working!"}

# Mount the static files
app.mount("/media", StaticFiles(directory=settings.UPLOADS_DIR), name="media")

# Include API routers
app.include_router(api_router, prefix="/api")

# Create tables on startup
@app.on_event("startup")
async def startup_event():
    logger.info("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully")

# Root endpoint
@app.get("/")
def root():
    logger.info("Root endpoint called")
    return {
        "message": "Welcome to LinkedOut API",
        "version": settings.PROJECT_VERSION,
        "docs_url": "/docs",
        "redoc_url": "/redoc",
        "status": "running"
    }

# Health check endpoint
@app.get("/health")
def health_check():
    logger.info("Health check endpoint called")
    return {"status": "healthy"}

# Debug endpoint to see all routes
@app.get("/debug/routes")
def get_routes():
    routes = []
    for route in app.routes:
        routes.append({
            "path": route.path,
            "name": route.name,
            "methods": getattr(route, "methods", None)
        })
    return {"routes": routes}


# Create tables and seed database on startup
@app.on_event("startup")
async def startup_event():
    logger.info("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully")

    # Seed database with initial data
    db = SessionLocal()
    try:
        seed_database(db)
    except Exception as e:
        logger.error(f"Error during database seeding: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)