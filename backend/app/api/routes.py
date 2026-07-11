from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app.core.database import Base, engine, get_db
from app.models.lint_request import LintRequest
from app.schemas.lint import LintInput, LintResponse
from app.services.linter import linter_service
from app.services.rag import rag_service

router = APIRouter()


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.post("/documents")
def add_document(payload: LintInput) -> dict[str, str]:
    rag_service.ingest_document(payload.content)
    return {"message": "Document ingested for RAG context retrieval."}


@router.post("/lint", response_model=LintResponse)
def lint_content(payload: LintInput, db: Session = Depends(get_db)) -> LintResponse:
    issues = linter_service.lint(payload.content)
    rag_context = rag_service.retrieve_context(payload.content)

    db.add(LintRequest(source_text=payload.content, issues=[issue.model_dump() for issue in issues]))
    db.commit()

    return LintResponse(issues=issues, rag_context=rag_context)


@router.post("/ocr/extract")
async def ocr_extract(file: UploadFile = File(...)) -> dict[str, str | int]:
    content = await file.read()
    decoded_text = content.decode("utf-8", errors="ignore")
    return {
        "filename": file.filename or "uploaded-file",
        "size": len(content),
        "extracted_text": decoded_text[:500],
        "note": "OCR-ready endpoint. Replace extraction logic with Tesseract/EasyOCR in production.",
    }


def create_db_tables() -> None:
    Base.metadata.create_all(bind=engine)
