from typing import List, Optional
from pydantic import BaseModel, Field


class LintRequest(BaseModel):
    text: str = Field(..., description="The technical text or documentation to analyze")
    domain_id: Optional[int] = Field(None, description="Optional domain ID to filter suggestions")
    category_id: Optional[int] = Field(None, description="Optional category ID to filter suggestions")


class LintWarning(BaseModel):
    original_term: str = Field(..., description="The matched technical or foreign term in the text")
    suggested_pure_term: str = Field(..., description="Suggested pure Tamil term equivalent")
    phonetic_rendering: Optional[str] = Field(None, description="Common transliterated/phonetic Tamil rendering")
    start_index: int = Field(..., description="Starting character index in the original text")
    end_index: int = Field(..., description="Ending character index in the original text")
    confidence_score: float = Field(..., description="Confidence level of the recommendation (0.0 to 1.0)")
    is_verified: bool = Field(..., description="True if the suggestion comes from our verified knowledge base")
    explanation: str = Field(..., description="Why this term was flagged and detailed explanation of the pure Tamil choice")
    example_usage: Optional[str] = Field(None, description="An example sentence in pure Tamil demonstrating usage")


class LanguageInfo(BaseModel):
    detected_language: str = Field(..., description="Primary language: 'ta' (Tamil), 'en' (English), or 'ta-Latn' (Tanglish)")
    confidence: float = Field(..., description="Confidence of the language detection (0.0 to 1.0)")
    contains_tanglish: bool = Field(..., description="True if Romanized Tamil (Tanglish) patterns are identified")


class QualityMetrics(BaseModel):
    writing_score: int = Field(..., description="Overall score out of 100 reflecting pure Tamil technical writing quality")
    readability_level: str = Field(..., description="Readability rating (e.g., 'Easy', 'Medium', 'Complex')")
    grammar_errors_count: int = Field(..., description="Count of style, vocabulary, or syntax issues flagged")


class LintResponse(BaseModel):
    original_text: str
    language_info: LanguageInfo
    warnings: List[LintWarning] = []
    quality_metrics: QualityMetrics
    suggested_rewrite_pure: str = Field(..., description="Fully rewritten text using pure Tamil terminology")
    suggested_rewrite_phonetic: str = Field(..., description="Fully rewritten text using common phonetic/loan terminology where preferred for colloquial readability")
    suggested_rewrite_english: str = Field(..., description="Fully translated text in grammatically correct pure English")
