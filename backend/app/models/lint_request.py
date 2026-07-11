from sqlalchemy import JSON, Column, DateTime, Integer, Text, func

from app.core.database import Base


class LintRequest(Base):
    __tablename__ = "lint_requests"

    id = Column(Integer, primary_key=True, index=True)
    source_text = Column(Text, nullable=False)
    issues = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
