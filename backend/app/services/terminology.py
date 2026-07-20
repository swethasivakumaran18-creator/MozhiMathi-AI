from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.terminology import Term, Definition, Example, Synonym, Domain, Category, Source, TermRelationship
from app.repositories.terminology import term_repo, domain_repo, category_repo, source_repo
from app.schemas.terminology import (
    TermCreate, TermUpdate,
    DomainCreate, CategoryCreate, SourceCreate,
    DefinitionCreate, ExampleCreate, SynonymCreate,
    TermRelationshipCreate
)


class TerminologyService:
    def get_term(self, db: Session, term_id: int) -> Optional[Term]:
        return term_repo.get_detailed(db, term_id)

    def list_terms(
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
        return term_repo.search_terms(
            db,
            q=q,
            domain_id=domain_id,
            category_id=category_id,
            is_verified=is_verified,
            skip=skip,
            limit=limit
        )

    def create_term(self, db: Session, *, obj_in: TermCreate) -> Term:
        # Check if english term already exists
        existing_term = term_repo.get_by_english_term(db, obj_in.english_term)
        if existing_term:
            raise ValueError(f"Term '{obj_in.english_term}' already exists.")

        # Resolve Domain, Category, Source relations if specified
        domain_id = obj_in.domain_id
        category_id = obj_in.category_id
        source_id = obj_in.source_id

        # Prepare base model values
        db_obj = Term(
            english_term=obj_in.english_term,
            tamil_term=obj_in.tamil_term,
            pure_tamil_term=obj_in.pure_tamil_term,
            ipa_tamil=obj_in.ipa_tamil,
            domain_id=domain_id,
            category_id=category_id,
            source_id=source_id,
            confidence_score=obj_in.confidence_score,
            is_verified=obj_in.is_verified
        )

        db.add(db_obj)
        db.flush()  # Flushes to DB to get db_obj.id before adding sub-relations

        # Add sub-relations
        if obj_in.definitions:
            for d in obj_in.definitions:
                defn = Definition(
                    term_id=db_obj.id,
                    tamil_definition=d.tamil_definition,
                    english_definition=d.english_definition,
                    author=d.author,
                    version=d.version
                )
                db.add(defn)

        if obj_in.examples:
            for e in obj_in.examples:
                ex = Example(
                    term_id=db_obj.id,
                    tamil_example=e.tamil_example,
                    english_example=e.english_example
                )
                db.add(ex)

        if obj_in.synonyms:
            for s in obj_in.synonyms:
                syn = Synonym(
                    term_id=db_obj.id,
                    synonym_term=s.synonym_term,
                    language=s.language
                )
                db.add(syn)

        db.commit()
        db.refresh(db_obj)
        return term_repo.get_detailed(db, db_obj.id)  # type: ignore

    def update_term(self, db: Session, *, id: int, obj_in: TermUpdate) -> Optional[Term]:
        db_obj = term_repo.get(db, id)
        if not db_obj:
            return None
        
        updated_obj = term_repo.update(db, db_obj=db_obj, obj_in=obj_in)
        return term_repo.get_detailed(db, updated_obj.id)

    def delete_term(self, db: Session, *, id: int) -> Optional[Term]:
        return term_repo.remove(db, id=id)  # type: ignore


    # --- DOMAIN SERVICES ---
    def get_domain(self, db: Session, domain_id: int) -> Optional[Domain]:
        return domain_repo.get(db, domain_id)

    def list_domains(self, db: Session, skip: int = 0, limit: int = 100) -> List[Domain]:
        return domain_repo.get_multi(db, skip=skip, limit=limit)

    def create_domain(self, db: Session, *, obj_in: DomainCreate) -> Domain:
        existing = domain_repo.get_by_name(db, obj_in.name)
        if existing:
            raise ValueError(f"Domain with name '{obj_in.name}' already exists.")
        return domain_repo.create(db, obj_in=obj_in)


    # --- CATEGORY SERVICES ---
    def get_category(self, db: Session, category_id: int) -> Optional[Category]:
        return category_repo.get(db, category_id)

    def list_categories(self, db: Session, skip: int = 0, limit: int = 100) -> List[Category]:
        return category_repo.get_multi(db, skip=skip, limit=limit)

    def create_category(self, db: Session, *, obj_in: CategoryCreate) -> Category:
        existing = category_repo.get_by_name(db, obj_in.name)
        if existing:
            raise ValueError(f"Category with name '{obj_in.name}' already exists.")
        return category_repo.create(db, obj_in=obj_in)


    # --- SOURCE SERVICES ---
    def get_source(self, db: Session, source_id: int) -> Optional[Source]:
        return source_repo.get(db, source_id)

    def list_sources(self, db: Session, skip: int = 0, limit: int = 100) -> List[Source]:
        return source_repo.get_multi(db, skip=skip, limit=limit)

    def create_source(self, db: Session, *, obj_in: SourceCreate) -> Source:
        existing = source_repo.get_by_name(db, obj_in.name)
        if existing:
            raise ValueError(f"Source with name '{obj_in.name}' already exists.")
        return source_repo.create(db, obj_in=obj_in)


    # --- RELATIONSHIP SERVICES ---
    def add_relationship(self, db: Session, *, obj_in: TermRelationshipCreate) -> TermRelationship:
        # Check source and target terms exist
        source_term = term_repo.get(db, obj_in.source_term_id)
        target_term = term_repo.get(db, obj_in.target_term_id)
        if not source_term or not target_term:
            raise ValueError("Both source and target terms must exist to form a relationship.")

        db_obj = TermRelationship(
            source_term_id=obj_in.source_term_id,
            target_term_id=obj_in.target_term_id,
            relationship_type=obj_in.relationship_type
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj


# Instantiate singleton service
terminology_service = TerminologyService()
