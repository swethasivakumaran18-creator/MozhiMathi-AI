import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
os.environ["DATABASE_URL"] = "sqlite:///./test.db"

from fastapi.testclient import TestClient

from app.api.routes import create_db_tables
from app.main import app

create_db_tables()
client = TestClient(app)


def test_health() -> None:
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_lint_endpoint_returns_structure() -> None:
    response = client.post("/api/v1/lint", json={"content": "TODO 123"})
    assert response.status_code == 200
    body = response.json()
    assert "issues" in body
    assert "rag_context" in body


def test_ocr_extract_endpoint() -> None:
    response = client.post(
        "/api/v1/ocr/extract",
        files={"file": ("sample.txt", "தமிழ் தொழில்நுட்ப உரை".encode("utf-8"), "text/plain")},
    )
    assert response.status_code == 200
    assert response.json()["filename"] == "sample.txt"
