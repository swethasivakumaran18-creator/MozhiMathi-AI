from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

# Create database engine
# SQLite requires check_same_thread=False for multi-threaded applications like FastAPI
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}
)

# SessionLocal class will yield instances of Database Session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
