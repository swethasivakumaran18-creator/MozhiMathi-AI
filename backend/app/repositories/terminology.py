from typing import Any, List, Optional
from sqlalchemy import select, or_
from sqlalchemy.orm import Session, joinedload
from app.models.terminology import Domain, Category, Source, Term, Definition, Example, Synonym, TermRelationship
from app.repositories.base import BaseRepository
from app.schemas.terminology import (
    DomainCreate, DomainUpdate,
    CategoryCreate, CategoryUpdate,
    SourceCreate, SourceUpdate,
    TermCreate, TermUpdate
)


class DomainRepository(BaseRepository[Domain, DomainCreate, DomainUpdate]):
    def get_by_name(self, db: Session, name: str) -> Optional[Domain]:
        query = select(self.model).where(self.model.name == name)
        return db.execute(query).scalar_one_or_none()


class CategoryRepository(BaseRepository[Category, CategoryCreate, CategoryUpdate]):
    def get_by_name(self, db: Session, name: str) -> Optional[Category]:
        query = select(self.model).where(self.model.name == name)
        return db.execute(query).scalar_one_or_none()


class SourceRepository(BaseRepository[Source, SourceCreate, SourceUpdate]):
    def get_by_name(self, db: Session, name: str) -> Optional[Source]:
        query = select(self.model).where(self.model.name == name)
        return db.execute(query).scalar_one_or_none()


class TermRepository(BaseRepository[Term, TermCreate, TermUpdate]):
    def get_by_english_term(self, db: Session, english_term: str) -> Optional[Term]:
        query = select(self.model).where(self.model.english_term == english_term)
        return db.execute(query).scalar_one_or_none()

    def get_detailed(self, db: Session, id: int) -> Optional[Term]:
        # Pre-fetch all relations cleanly to avoid N+1 query patterns
        query = (
            select(self.model)
            .options(
                joinedload(self.model.domain),
                joinedload(self.model.category),
                joinedload(self.model.source),
                joinedload(self.model.definitions),
                joinedload(self.model.examples),
                joinedload(self.model.synonyms),
            )
            .where(self.model.id == id)
        )
        return db.execute(query).unique().scalar_one_or_none()

    def search_terms(
        self,
        db: Session,
        *,
        q: Optional[str] = None,
        domain_id: Optional[int] = None,
        category_id: Optional[int] = None,
        is_verified: Optional[bool] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Term]:
        query = select(self.model).options(
            joinedload(self.model.domain),
            joinedload(self.model.category),
            joinedload(self.model.source)
        )
        
        conditions = []
        if q:
            # Multi-field search across English, Tamil phonetic, pure Tamil, and synonyms (via joins)
            search_pattern = f"%{q}%"
            conditions.append(
                or_(
                    self.model.english_term.ilike(search_pattern),
                    self.model.tamil_term.ilike(search_pattern),
                    self.model.pure_tamil_term.ilike(search_pattern)
                )
            )
            
        if domain_id is not None:
            conditions.append(self.model.domain_id == domain_id)
            
        if category_id is not None:
            conditions.append(self.model.category_id == category_id)
            
        if is_verified is not None:
            conditions.append(self.model.is_verified == is_verified)
            
        if conditions:
            query = query.where(*conditions)
            
        query = query.offset(skip).limit(limit)
        return list(db.execute(query).scalars().all())


# Instantiate repo singleton objects
domain_repo = DomainRepository(Domain)
category_repo = CategoryRepository(Category)
source_repo = SourceRepository(Source)
term_repo = TermRepository(Term)
