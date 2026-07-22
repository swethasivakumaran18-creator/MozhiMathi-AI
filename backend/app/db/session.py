from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

# Create database engine
# SQLite requires check_same_thread=False for multi-threaded applications like FastAPI
engine = create_engine(
    settings.DATABASE_URL,
    pool_size=20,          # Keeps up to 20 connections open at all times
    max_overflow=10,       # Allows up to 10 extra temporary connections if pool is full
    pool_timeout=30,       # Waits 30 seconds for a free connection before throwing an error
    pool_recycle=1800,     # Refreshes connections older than 30 minutes to prevent timeouts
    connect_args={"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}
)

# SessionLocal class will yield instances of Database Session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
