import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from backend.app.schemas.terminology import TermCreate
from backend.app.services.terminology import terminology_service
from backend.app.services.linter import linter_service
from backend.app.schemas.linter import LintRequest


def test_lint_empty_text(db: Session):
    """
    Ensures that empty or whitespace-only inputs are handled gracefully
    without invoking Gemini or raising database exceptions.
    """
    req = LintRequest(text="   ")
    response = linter_service.lint_text(db, req)
    
    assert response.original_text == "   "
    assert len(response.warnings) == 0
    assert response.quality_metrics.writing_score == 100
    assert response.quality_metrics.grammar_errors_count == 0


def test_lint_local_db_grounding_match(db: Session):
    """
    Inserts a technical term into the local database, then lints an input
    containing that exact term to verify the RAG matching engine works.
    """
    # Create a mock technical term in DB
    term_in = TermCreate(
        english_term="API",
        tamil_term="ஏபிஐ",
        pure_tamil_term="நெறிமுறை இடைமுகம்",
        confidence_score=0.95,
        is_verified=True,
        definitions=[{"definition_text": "Application Programming Interface equivalents", "tamil_definition": "செயலவி நிரலாக்க இடைமுகம்"}]
    )
    terminology_service.create_term(db, obj_in=term_in)
    
    # Analyze a sentence containing the English term "API"
    req = LintRequest(text="We need to design a secure API for our application.")
    response = linter_service.lint_text(db, req)
    
    # Even if Gemini fallback is active, our local DB scanner must catch the term "API"
    assert len(response.warnings) > 0
    
    # Verify the details of the matched warning
    warning = [w for w in response.warnings if w.original_term.upper() == "API"][0]
    assert warning.suggested_pure_term == "நெறிமுறை இடைமுகம்"
    assert warning.is_verified is True
    # Character index validation (char index of "API" in "We need to design a secure API for our application.")
    # "We need to design a secure " is 27 chars long. API should start at index 27
    assert warning.start_index == 27
    assert warning.end_index == 30


def test_linter_api_endpoint(client: TestClient, db: Session):
    """
    Verifies that the /api/v1/linter/lint API endpoint functions correctly,
    accepts the standard schema, and returns a fully conforming JSON payload.
    """
    # Insert a term to ensure we have a direct dictionary match
    term_in = TermCreate(
        english_term="Variable",
        tamil_term="வேரியபிள்",
        pure_tamil_term="மாறி",
        confidence_score=0.9,
        is_verified=True,
    )
    terminology_service.create_term(db, obj_in=term_in)
    
    payload = {
        "text": "Declare a variable for storing the count.",
    }
    
    response = client.post("/api/v1/linter/lint", json=payload)
    assert response.status_code == 200
    
    json_data = response.json()
    assert "original_text" in json_data
    assert "language_info" in json_data
    assert "warnings" in json_data
    assert "quality_metrics" in json_data
    assert "suggested_rewrite_pure" in json_data
    
    # Ensure warnings matched our local database
    warnings = json_data["warnings"]
    assert len(warnings) > 0
    assert warnings[0]["original_term"].lower() == "variable"
    assert warnings[0]["suggested_pure_term"] == "மாறி"
