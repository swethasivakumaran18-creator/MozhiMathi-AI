from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.schemas.editor import NextWordRequest, NextWordResponse
from app.services.editor import editor_service
from app.core.logging import logger

router = APIRouter()

@router.post("/next-word", response_model=NextWordResponse)
def get_next_word(request: NextWordRequest, db: Session = Depends(get_db)):
    """
    Predicts the next technical word or phrase based on the context before the cursor
    and verified terminology database reference patterns (RAG).
    """
    try:
        return editor_service.get_next_word_recommendations(db, request)
    except Exception as e:
        logger.error(f"Error in next-word recommendation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Autocomplete service error: {str(e)}"
        )
