import pytest
from typing import Generator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from backend.app.db.base import Base
from backend.app.models.terminology import Term, Domain, Category, Source, Definition, Example, Synonym, TermRelationship, TermEmbedding
from backend.app.api.deps import get_db
from backend.app.main import app

from sqlalchemy.pool import StaticPool

# Use an in-memory SQLite database for fast unit testing with StaticPool to keep connection alive
TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db() -> Generator[Session, None, None]:
    # Ensure tables are registered
    print("RECOGNIZED TABLES IN METADATA:", Base.metadata.tables.keys())
    # Create all tables for the test database on setup
    Base.metadata.create_all(bind=engine)
    
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        # Drop all tables after the test finishes to keep tests isolated
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db: Session) -> Generator[TestClient, None, None]:
    # Override get_db dependency to use the test database session
    def override_get_db():
        try:
            yield db
        finally:
            pass
            
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
