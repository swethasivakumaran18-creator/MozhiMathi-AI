from pydantic import BaseModel
from typing import List, Optional

class NextWordRequest(BaseModel):
    text: str
    cursorPosition: int
    tier: Optional[str] = "llm" # "db" or "llm"

class SuggestionItem(BaseModel):
    text: str
    confidence: float

class NextWordResponse(BaseModel):
    suggestions: List[SuggestionItem]
