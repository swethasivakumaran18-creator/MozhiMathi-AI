from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


# --- DOMAIN SCHEMAS ---
class DomainBase(BaseModel):
    name: str = Field(..., max_length=100, description="The domain name, e.g., Computing")
    description: Optional[str] = Field(None, description="Optional description of the domain")


class DomainCreate(DomainBase):
    pass


class DomainUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None


class DomainResponse(DomainBase):
    id: int

    class Config:
        from_attributes = True


# --- CATEGORY SCHEMAS ---
class CategoryBase(BaseModel):
    name: str = Field(..., max_length=100, description="The category name, e.g., Programming")
    description: Optional[str] = Field(None, description="Optional description of the category")


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None


class CategoryResponse(CategoryBase):
    id: int

    class Config:
        from_attributes = True


# --- SOURCE SCHEMAS ---
class SourceBase(BaseModel):
    name: str = Field(..., max_length=150, description="The dictionary/glossary source name")
    url: Optional[str] = Field(None, max_length=500, description="Optional URL of the source")
    description: Optional[str] = None


class SourceCreate(SourceBase):
    pass


class SourceUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=150)
    url: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = None


class SourceResponse(SourceBase):
    id: int

    class Config:
        from_attributes = True


# --- SYNONYM SCHEMAS ---
class SynonymBase(BaseModel):
    synonym_term: str = Field(..., max_length=150)
    language: str = Field("ta", max_length=10, description="ta or en")


class SynonymCreate(SynonymBase):
    pass


class SynonymResponse(SynonymBase):
    id: int
    term_id: int

    class Config:
        from_attributes = True


# --- DEFINITION SCHEMAS ---
class DefinitionBase(BaseModel):
    tamil_definition: str = Field(..., description="Explanation of the term in Tamil")
    english_definition: Optional[str] = Field(None, description="Explanation in English")
    author: str = Field("System", max_length=100)
    version: int = Field(1)


class DefinitionCreate(DefinitionBase):
    pass


class DefinitionResponse(DefinitionBase):
    id: int
    term_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# --- EXAMPLE SCHEMAS ---
class ExampleBase(BaseModel):
    tamil_example: str = Field(..., description="Tamil usage example sentence")
    english_example: Optional[str] = Field(None, description="English usage example sentence")


class ExampleCreate(ExampleBase):
    pass


class ExampleResponse(ExampleBase):
    id: int
    term_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# --- RELATIONSHIP SCHEMAS ---
class TermRelationshipBase(BaseModel):
    target_term_id: int = Field(..., description="ID of the target term")
    relationship_type: str = Field(..., max_length=50, description="meronym, holonym, synonym, antonym, related")


class TermRelationshipCreate(TermRelationshipBase):
    source_term_id: int


class TermRelationshipResponse(TermRelationshipBase):
    id: int
    source_term_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# --- TERM SCHEMAS ---
class TermBase(BaseModel):
    english_term: str = Field(..., max_length=150)
    tamil_term: str = Field(..., max_length=150, description="Phonetic / common Tamil rendering")
    pure_tamil_term: str = Field(..., max_length=150, description="Strict/pure Tamil translation")
    ipa_tamil: Optional[str] = Field(None, max_length=150, description="Phonetic alphabet representation")
    domain_id: Optional[int] = None
    category_id: Optional[int] = None
    source_id: Optional[int] = None
    confidence_score: float = Field(1.0, ge=0.0, le=1.0)
    is_verified: bool = Field(False)


class TermCreate(TermBase):
    definitions: Optional[List[DefinitionCreate]] = Field(default_factory=list)
    examples: Optional[List[ExampleCreate]] = Field(default_factory=list)
    synonyms: Optional[List[SynonymCreate]] = Field(default_factory=list)


class TermUpdate(BaseModel):
    english_term: Optional[str] = Field(None, max_length=150)
    tamil_term: Optional[str] = Field(None, max_length=150)
    pure_tamil_term: Optional[str] = Field(None, max_length=150)
    ipa_tamil: Optional[str] = Field(None, max_length=150)
    domain_id: Optional[int] = None
    category_id: Optional[int] = None
    source_id: Optional[int] = None
    confidence_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    is_verified: Optional[bool] = None


class TermResponse(TermBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TermDetailedResponse(TermResponse):
    domain: Optional[DomainResponse] = None
    category: Optional[CategoryResponse] = None
    source: Optional[SourceResponse] = None
    definitions: List[DefinitionResponse] = []
    examples: List[ExampleResponse] = []
    synonyms: List[SynonymResponse] = []

    class Config:
        from_attributes = True
