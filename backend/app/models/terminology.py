from datetime import datetime
from typing import List, Optional
from sqlalchemy import Boolean, Float, ForeignKey, Integer, String, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class Domain(Base):
    __tablename__ = "domains"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    terms: Mapped[List["Term"]] = relationship("Term", back_populates="domain", cascade="all, delete-orphan")


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    terms: Mapped[List["Term"]] = relationship("Term", back_populates="category", cascade="all, delete-orphan")


class Source(Base):
    __tablename__ = "sources"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(150), unique=True, index=True, nullable=False)
    url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    terms: Mapped[List["Term"]] = relationship("Term", back_populates="source", cascade="all, delete-orphan")


class Term(Base):
    __tablename__ = "terms"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    english_term: Mapped[str] = mapped_column(String(150), index=True, nullable=False)
    tamil_term: Mapped[str] = mapped_column(String(150), index=True, nullable=False)  # Phonetic / Tanglish
    pure_tamil_term: Mapped[str] = mapped_column(String(150), index=True, nullable=False)  # Pure Tamil translation
    ipa_tamil: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)  # International Phonetic Alphabet / phonetics
    
    domain_id: Mapped[Optional[int]] = mapped_column(ForeignKey("domains.id", ondelete="SET NULL"), nullable=True)
    category_id: Mapped[Optional[int]] = mapped_column(ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    source_id: Mapped[Optional[int]] = mapped_column(ForeignKey("sources.id", ondelete="SET NULL"), nullable=True)
    
    confidence_score: Mapped[float] = mapped_column(Float, default=1.0)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    domain: Mapped[Optional[Domain]] = relationship("Domain", back_populates="terms")
    category: Mapped[Optional[Category]] = relationship("Category", back_populates="terms")
    source: Mapped[Optional[Source]] = relationship("Source", back_populates="terms")
    
    definitions: Mapped[List["Definition"]] = relationship("Definition", back_populates="term", cascade="all, delete-orphan")
    examples: Mapped[List["Example"]] = relationship("Example", back_populates="term", cascade="all, delete-orphan")
    synonyms: Mapped[List["Synonym"]] = relationship("Synonym", back_populates="term", cascade="all, delete-orphan")
    embeddings: Mapped[List["TermEmbedding"]] = relationship("TermEmbedding", back_populates="term", cascade="all, delete-orphan")


class Definition(Base):
    __tablename__ = "definitions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    term_id: Mapped[int] = mapped_column(ForeignKey("terms.id", ondelete="CASCADE"), nullable=False)
    tamil_definition: Mapped[str] = mapped_column(Text, nullable=False)
    english_definition: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    author: Mapped[str] = mapped_column(String(100), default="System")
    version: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    term: Mapped[Term] = relationship("Term", back_populates="definitions")


class Example(Base):
    __tablename__ = "examples"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    term_id: Mapped[int] = mapped_column(ForeignKey("terms.id", ondelete="CASCADE"), nullable=False)
    tamil_example: Mapped[str] = mapped_column(Text, nullable=False)
    english_example: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    term: Mapped[Term] = relationship("Term", back_populates="examples")


class Synonym(Base):
    __tablename__ = "synonyms"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    term_id: Mapped[int] = mapped_column(ForeignKey("terms.id", ondelete="CASCADE"), nullable=False)
    synonym_term: Mapped[str] = mapped_column(String(150), nullable=False)
    language: Mapped[str] = mapped_column(String(10), default="ta")  # "ta" or "en"

    term: Mapped[Term] = relationship("Term", back_populates="synonyms")


class TermEmbedding(Base):
    __tablename__ = "term_embeddings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    term_id: Mapped[int] = mapped_column(ForeignKey("terms.id", ondelete="CASCADE"), nullable=False)
    embedding_vector: Mapped[str] = mapped_column(Text, nullable=False)  # Stored as a serialized JSON string / list of floats
    model_name: Mapped[str] = mapped_column(String(100), default="text-embedding-004")

    term: Mapped[Term] = relationship("Term", back_populates="embeddings")


class TermRelationship(Base):
    __tablename__ = "term_relationships"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    source_term_id: Mapped[int] = mapped_column(ForeignKey("terms.id", ondelete="CASCADE"), nullable=False)
    target_term_id: Mapped[int] = mapped_column(ForeignKey("terms.id", ondelete="CASCADE"), nullable=False)
    relationship_type: Mapped[str] = mapped_column(String(50), nullable=False)  # "meronym", "holonym", "antonym", etc.
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
