import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.logging import setup_logging, logger
from app.db.base import Base
from app.db.session import engine
from app.api.v1.terminology import router as terminology_router
from app.api.v1.linter import router as linter_router

# Setup Logging
setup_logging()


# Initialize Database tables on startup
# This acts as an immediate fallback or initial database schema creator
try:
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized successfully.")
    # Seed the database with high-quality tech terminology
    from app.db.seed import seed_db
    seed_db()
except Exception as e:
    logger.error(f"Error initializing database tables: {e}")

# Initialize FastAPI App
app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for dev/sandbox ease
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(terminology_router, prefix=f"{settings.API_V1_STR}/terminology", tags=["Terminology"])
app.include_router(linter_router, prefix=f"{settings.API_V1_STR}/linter", tags=["Linter"])


@app.get("/health")
def health_check():
    return {"status": "healthy", "project": settings.PROJECT_NAME}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
