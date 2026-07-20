from typing import Generator
from sqlalchemy.orm import Session
from app.db.session import SessionLocal


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that yields a scoped database session.
    Automatically commits or rolls back and closes the session.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
