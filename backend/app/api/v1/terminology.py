from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.services.terminology import terminology_service
from app.schemas.terminology import (
    TermCreate, TermUpdate, TermResponse, TermDetailedResponse,
    DomainCreate, DomainResponse,
    CategoryCreate, CategoryResponse,
    SourceCreate, SourceResponse,
    TermRelationshipCreate, TermRelationshipResponse
)

router = APIRouter()


# --- DOMAIN ENDPOINTS ---
@router.post("/domains", response_model=DomainResponse, status_code=status.HTTP_201_CREATED)
def create_domain(domain_in: DomainCreate, db: Session = Depends(get_db)):
    try:
        return terminology_service.create_domain(db, obj_in=domain_in)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/domains", response_model=List[DomainResponse])
def read_domains(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return terminology_service.list_domains(db, skip=skip, limit=limit)


@router.get("/domains/{domain_id}", response_model=DomainResponse)
def read_domain(domain_id: int, db: Session = Depends(get_db)):
    domain = terminology_service.get_domain(db, domain_id=domain_id)
    if not domain:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Domain not found")
    return domain


# --- CATEGORY ENDPOINTS ---
@router.post("/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(category_in: CategoryCreate, db: Session = Depends(get_db)):
    try:
        return terminology_service.create_category(db, obj_in=category_in)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/categories", response_model=List[CategoryResponse])
def read_categories(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return terminology_service.list_categories(db, skip=skip, limit=limit)


@router.get("/categories/{category_id}", response_model=CategoryResponse)
def read_category(category_id: int, db: Session = Depends(get_db)):
    category = terminology_service.get_category(db, category_id=category_id)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    return category


# --- SOURCE ENDPOINTS ---
@router.post("/sources", response_model=SourceResponse, status_code=status.HTTP_201_CREATED)
def create_source(source_in: SourceCreate, db: Session = Depends(get_db)):
    try:
        return terminology_service.create_source(db, obj_in=source_in)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/sources", response_model=List[SourceResponse])
def read_sources(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return terminology_service.list_sources(db, skip=skip, limit=limit)


@router.get("/sources/{source_id}", response_model=SourceResponse)
def read_source(source_id: int, db: Session = Depends(get_db)):
    source = terminology_service.get_source(db, source_id=source_id)
    if not source:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source not found")
    return source


# --- TERM ENDPOINTS ---
@router.post("/terms", response_model=TermDetailedResponse, status_code=status.HTTP_201_CREATED)
def create_term(term_in: TermCreate, db: Session = Depends(get_db)):
    try:
        return terminology_service.create_term(db, obj_in=term_in)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/terms", response_model=List[TermResponse])
def read_terms(
    q: Optional[str] = None,
    domain_id: Optional[int] = None,
    category_id: Optional[int] = None,
    is_verified: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return terminology_service.list_terms(
        db,
        q=q,
        domain_id=domain_id,
        category_id=category_id,
        is_verified=is_verified,
        skip=skip,
        limit=limit
    )


@router.get("/terms/{term_id}", response_model=TermDetailedResponse)
def read_term(term_id: int, db: Session = Depends(get_db)):
    term = terminology_service.get_term(db, term_id=term_id)
    if not term:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Term not found")
    return term


@router.put("/terms/{term_id}", response_model=TermDetailedResponse)
def update_term(term_id: int, term_in: TermUpdate, db: Session = Depends(get_db)):
    term = terminology_service.update_term(db, id=term_id, obj_in=term_in)
    if not term:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Term not found")
    return term


@router.delete("/terms/{term_id}", response_model=TermDetailedResponse)
def delete_term(term_id: int, db: Session = Depends(get_db)):
    term = terminology_service.delete_term(db, id=term_id)
    if not term:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Term not found")
    return term


# --- RELATIONSHIP ENDPOINTS ---
@router.post("/relationships", response_model=TermRelationshipResponse, status_code=status.HTTP_201_CREATED)
def create_relationship(relationship_in: TermRelationshipCreate, db: Session = Depends(get_db)):
    try:
        return terminology_service.add_relationship(db, obj_in=relationship_in)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
