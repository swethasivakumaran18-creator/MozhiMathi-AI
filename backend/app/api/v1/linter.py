from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.linter import LintRequest, LintResponse
from app.services.linter import linter_service
from app.core.logging import logger

router = APIRouter()


@router.post("/lint", response_model=LintResponse)
def lint_text(request: LintRequest, db: Session = Depends(get_db)):
    """
    Lints technical text, source comments, or documentation.
    Performs language detection, identifies technical terms, queries the local verified DB,
    queries Gemini AI with grounding context (RAG), scores the text, and produces
    two structured rewrites: pure Tamil and phonetic colloquial Tamil.
    """
    try:
        return linter_service.lint_text(db, request)
    except Exception as e:
        logger.error(f"Error in lint_text endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Linter service failed: {str(e)}"
        )
