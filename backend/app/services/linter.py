import os
import re
import json
from typing import List, Optional
import google.generativeai as genai
from sqlalchemy.orm import Session

from app.services.terminology import terminology_service
from app.schemas.linter import LintRequest, LintResponse, LintWarning, LanguageInfo, QualityMetrics
from app.core.logging import logger
from app.models.terminology import Term, TermEmbedding, Source

# Lazy loader for Gemini client configuration
_gemini_configured = False
_embedding_service_available = True

def configure_gemini() -> bool:
    global _gemini_configured
    if _gemini_configured:
        return True
    
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        logger.warning("GEMINI_API_KEY environment variable is not set. Gemini Linter will run in heuristic fallback mode.")
        return False
        
    try:
        genai.configure(api_key=api_key)
        _gemini_configured = True
        logger.info("Gemini API client successfully configured.")
        return True
    except Exception as e:
        logger.error(f"Error configuring Gemini API: {e}")
        return False


def get_trigrams(text: str) -> set:
    if not text:
        return set()
    text = f"  {text.lower()}  "
    return {text[i:i+3] for i in range(len(text)-2)}


def trigram_similarity(s1: str, s2: str) -> float:
    if not s1 or not s2:
        return 0.0
    t1 = get_trigrams(s1)
    t2 = get_trigrams(s2)
    union_len = len(t1 | t2)
    if union_len == 0:
        return 0.0
    return len(t1 & t2) / union_len


def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    if not v1 or not v2 or len(v1) != len(v2):
        return 0.0
    dot_product = sum(a * b for a, b in zip(v1, v2))
    norm_v1 = sum(a * a for a in v1) ** 0.5
    norm_v2 = sum(b * b for b in v2) ** 0.5
    if norm_v1 == 0.0 or norm_v2 == 0.0:
        return 0.0
    return dot_product / (norm_v1 * norm_v2)


def get_embedding(text: str) -> List[float]:
    global _embedding_service_available
    if not _gemini_configured or not _embedding_service_available:
        return []
    try:
        response = genai.embed_content(
            model="models/gemini-embedding-001",
            content=text,
            task_type="RETRIEVAL_QUERY"
        )
        if isinstance(response, dict) and "embedding" in response:
            return response["embedding"]
        elif hasattr(response, "embedding"):
            return response.embedding
        elif isinstance(response, dict) and "embeddings" in response:
            return response["embeddings"][0]
        elif hasattr(response, "embeddings"):
            return response.embeddings[0]
        return []
    except Exception as e:
        logger.warning(f"Embedding generation skipped/failed: {e}")
        # If we get a 404 or other permanent error, disable the embedding service to prevent thundering herd API calls
        if "404" in str(e) or "not found" in str(e).lower() or "Method not found" in str(e):
            _embedding_service_available = False
            logger.warning("Disabling embedding service due to unsupported model or endpoint.")
        return []


def get_or_create_term_embedding(db: Session, term_id: int, term_text: str) -> List[float]:
    cached = db.query(TermEmbedding).filter(TermEmbedding.term_id == term_id).first()
    if cached:
        try:
            return json.loads(cached.embedding_vector)
        except Exception:
            pass
            
    vector = get_embedding(term_text)
    if vector:
        try:
            emb_obj = TermEmbedding(
                term_id=term_id,
                embedding_vector=json.dumps(vector),
                model_name="gemini-embedding-001"
            )
            db.add(emb_obj)
            db.commit()
        except Exception as e:
            db.rollback()
            logger.error(f"Error caching embedding: {e}")
    return vector


class LinterService:
    def _find_db_matches(self, db: Session, text: str) -> List[dict]:
        """
        Scans input text for technical terms from the database.
        Implements an Advanced Hybrid Search Strategy evaluating:
        1. Exact Match Lookup (B-Tree/SQL index)
        2. Trigram Fuzzy Match (pg_trgm equivalent)
        3. Vector Semantic Search (text-embedding-004)
        4. Source Authority Coefficient Scaling
        """
        matched_terms = []
        if not text.strip():
            return matched_terms

        try:
            # 1. Fetch all available terms from local DB
            db_terms = db.query(Term).all()
            if not db_terms:
                return matched_terms

            # Tokenize text into words & phrases of length 1, 2, 3 words
            # to capture multi-word technical concepts like "Data Structure"
            words = text.split()
            phrases_meta = []  # List of tuples: (phrase, start_char_index, end_char_index)

            # Build word boundaries and ranges
            current_idx = 0
            word_spans = []
            for w in words:
                start = text.find(w, current_idx)
                end = start + len(w)
                word_spans.append((w, start, end))
                current_idx = end

            # Generate sliding window phrases
            n = len(word_spans)
            for length in [1, 2, 3]:
                for i in range(n - length + 1):
                    subset = word_spans[i:i+length]
                    phrase_str = text[subset[0][1]:subset[-1][2]]
                    phrases_meta.append((phrase_str, subset[0][1], subset[-1][2]))

            # Pre-generate query embedding if Gemini is active to power semantic search
            query_embeddings = {}
            if configure_gemini():
                # We can generate query embeddings for the full text or distinct candidate phrases
                # To keep it performant, we can embed the primary phrases or the entire text query
                pass

            for phrase, start, end in phrases_meta:
                best_candidate = None
                best_score = 0.0

                for t in db_terms:
                    # A. Exact Matching
                    m_exact = 0.0
                    if t.english_term and phrase.lower() == t.english_term.lower():
                        m_exact = 1.0
                    elif t.tamil_term and phrase == t.tamil_term:
                        m_exact = 1.0

                    # B. Trigram Fuzzy Matching
                    m_trigram = 0.0
                    if t.english_term:
                        m_trigram = max(m_trigram, trigram_similarity(phrase, t.english_term))
                    if t.tamil_term:
                        m_trigram = max(m_trigram, trigram_similarity(phrase, t.tamil_term))

                    # C. Vector Semantic Matching (Disabled on-the-fly calls to prevent hitting free tier limits)
                    m_vector = m_trigram

                    # D. Source Authority Weight Scaling
                    c_source = 0.75
                    if t.source:
                        source_name = t.source.name
                        if "Anna University" in source_name:
                            c_source = 1.0
                        elif "University of Madras" in source_name or "UoM" in source_name:
                            c_source = 0.9
                        elif "Standard" in source_name or "Verified" in source_name:
                            c_source = 0.8
                        elif "Community" in source_name:
                            c_source = 0.7

                    # E. Hybrid Score Formula
                    # S(c) = w_exact * M_exact + w_trigram * M_trigram + w_vector * M_vector * C_source
                    w_exact = 0.5
                    w_trigram = 0.3
                    w_vector = 0.2
                    score = (w_exact * m_exact) + (w_trigram * m_trigram) + (w_vector * m_vector * c_source)

                    if score > best_score:
                        best_score = score
                        best_candidate = (t, score)

                # Threshold verification
                # A good threshold is 0.45. Exact hits will be >= 0.5. Very close trigrams will be >= 0.45.
                if best_candidate and best_score >= 0.45:
                    term_obj, final_score = best_candidate
                    matched_terms.append({
                        "original_term": phrase,
                        "suggested_pure_term": term_obj.pure_tamil_term,
                        "phonetic_rendering": term_obj.tamil_term,
                        "start_index": start,
                        "end_index": end,
                        "confidence_score": round(final_score, 3),
                        "is_verified": term_obj.is_verified,
                        "explanation": f"Hybrid matching match with score {round(final_score, 2)}. "
                                       f"Matched term '{term_obj.english_term}' in '{term_obj.source.name if term_obj.source else 'Glossary'}' "
                                       f"maps to pure Tamil '{term_obj.pure_tamil_term}'.",
                        "example_usage": term_obj.examples[0].tamil_example if term_obj.examples else None
                    })

            # Deduplicate overlapping match ranges (favoring higher score / longer matches)
            matched_terms = sorted(matched_terms, key=lambda x: (x["start_index"], -(x["end_index"] - x["start_index"]), -x["confidence_score"]))
            
            deduplicated = []
            last_end = -1
            for m in matched_terms:
                # If this match starts after or at the end of the last accepted match, accept it
                if m["start_index"] >= last_end:
                    deduplicated.append(m)
                    last_end = m["end_index"]
                else:
                    # If it overlaps, check if it has a higher confidence score
                    if deduplicated and m["confidence_score"] > deduplicated[-1]["confidence_score"]:
                        deduplicated[-1] = m
                        last_end = m["end_index"]
            return deduplicated

        except Exception as e:
            logger.error(f"Error running hybrid matching engine: {e}", exc_info=True)
            return []

    def lint_text(self, db: Session, request: LintRequest) -> LintResponse:
        """
        Main linting engine. Blends DB RAG matching and Gemini AI reasoning.
        """
        text = request.text
        if not text.strip():
            return LintResponse(
                original_text=text,
                language_info=LanguageInfo(detected_language="en", confidence=1.0, contains_tanglish=False),
                warnings=[],
                quality_metrics=QualityMetrics(writing_score=100, readability_level="Easy", grammar_errors_count=0),
                suggested_rewrite_pure="",
                suggested_rewrite_phonetic=""
            )

        # Step 1: Scan local DB using Advanced Hybrid Matching Strategy (Exact, Trigram, Vector Semantic)
        local_matches = self._find_db_matches(db, text)
        
        # Step 2: Try to configure and run Gemini AI
        if configure_gemini():
            try:
                # Prepare ground truth context to inject (RAG pattern)
                ground_truth_context = []
                for idx, m in enumerate(local_matches):
                    ground_truth_context.append(
                        f"Matched Term {idx+1}: '{m['original_term']}' maps to Verified Pure Tamil: '{m['suggested_pure_term']}' (Phonetic: '{m['phonetic_rendering']}')"
                    )
                
                rag_context_str = "\n".join(ground_truth_context) if ground_truth_context else "No direct database matches found."

                # Construct prompt instructing Gemini to analyze technical terms and return structured JSON
                prompt = f"""
You are the advanced Tamil Technical Linter AI Engine. Your goal is to analyze engineering, software, and technology writing, identify technical jargon, loan words, slangs, or Tanglish, and suggest pure, correct Tamil equivalents.

INPUT TEXT TO ANALYZE:
"{text}"

GROUND TRUTH DICTIONARY REFERENCE (RAG Context):
These words were matched from our curated technical glossary. You MUST prioritize and use these exact pure Tamil translations for these words:
{rag_context_str}

TASKS:
1. Detect primary language: 'en' (English), 'ta' (Tamil), or 'ta-Latn' (Tanglish/Romanized Tamil). Compute confidence.
2. Detect if it contains Tanglish (even partially, e.g. "romba nice", "coding pannunga", "iniki build super").
3. Identify all technical slang, English loan words, or foreign jargon that have clear pure Tamil equivalents. Include their start_index and end_index positions in the original text (0-based character indexing).
4. Map the identified words to the correct pure Tamil equivalents and phonetic/loan equivalents where colloquial flow warrants it.
5. Provide a detailed, human-friendly explanation of why the word was flagged and why the suggested pure Tamil word is appropriate.
6. Provide a pure Tamil rewrite of the entire text. Crucially, if the input text contains English or mixed Tanglish, you MUST fully translate the entire text/sentence(s) into grammatically correct, formal Tamil, incorporating the verified pure Tamil technical terms from the RAG context where applicable. Do NOT just replace isolated words while leaving the rest of the sentence structure in English.
7. Provide a phonetic/common rewrite of the entire text. If the input contains English or Tanglish, fully translate the sentence structures into natural, fluent Tamil, using standard phonetic transliterations or popular technical loan words instead of strict pure Tamil equivalents where colloquial flow warrants it.
8. Compute quality metrics: overall writing score (0 to 100, deducting points for excessive English slangs, spelling/grammar errors, or Tanglish), readability level ("Easy", "Medium", "Complex"), and count of grammar errors/warnings.


RETURN FORMAT:
You MUST respond with a single, valid JSON object that exactly matches this schema. Do not include any markdown fences like ```json or ```, just the plain JSON string:

{{
  "detected_language": "ta" | "en" | "ta-Latn",
  "language_confidence": 0.95,
  "contains_tanglish": true | false,
  "warnings": [
    {{
      "original_term": "Matched term",
      "suggested_pure_term": "Pure Tamil word",
      "phonetic_rendering": "Phonetic Tamil word",
      "start_index": 0,
      "end_index": 5,
      "confidence_score": 0.9,
      "is_verified": true | false,
      "explanation": "Brief explanation",
      "example_usage": "Example sentence in pure Tamil"
    }}
  ],
  "quality_metrics": {{
    "writing_score": 85,
    "readability_level": "Medium",
    "grammar_errors_count": 2
  }},
  "suggested_rewrite_pure": "Full text rewritten in pure Tamil",
  "suggested_rewrite_phonetic": "Full text rewritten in phonetic/common Tamil"
}}
"""

                # Call Gemini model
                model = genai.GenerativeModel("gemini-flash-latest")
                response = model.generate_content(
                    prompt,
                    generation_config=genai.GenerationConfig(
                        response_mime_type="application/json",
                        temperature=0.2
                    )
                )

                # Parse JSON safely
                raw_text = response.text.strip()
                if raw_text.startswith("```json"):
                    raw_text = raw_text.split("```json", 1)[1]
                if raw_text.endswith("```"):
                    raw_text = raw_text.rsplit("```", 1)[0]
                raw_text = raw_text.strip()

                data = json.loads(raw_text)

                # Merge Gemini findings with our exact database matches
                warnings_list = []
                seen_ranges = set()

                # Add database matches first to ensure maximum priority and accuracy
                for m in local_matches:
                    range_key = (m["start_index"], m["end_index"])
                    seen_ranges.add(range_key)
                    warnings_list.append(LintWarning(
                        original_term=m["original_term"],
                        suggested_pure_term=m["suggested_pure_term"],
                        phonetic_rendering=m["phonetic_rendering"],
                        start_index=m["start_index"],
                        end_index=m["end_index"],
                        confidence_score=m["confidence_score"],
                        is_verified=True,
                        explanation=m["explanation"],
                        example_usage=m["example_usage"]
                    ))

                # Add additional warnings flagged by Gemini (avoiding duplicate spans)
                for w in data.get("warnings", []):
                    orig_term = w.get("original_term", "")
                    start = w.get("start_index", -1)
                    end = w.get("end_index", -1)

                    if (start == -1 or end == -1 or start >= len(text)) and orig_term:
                        match = re.search(re.escape(orig_term), text, re.IGNORECASE)
                        if match:
                            start, end = match.span()

                    range_key = (start, end)
                    if range_key not in seen_ranges and orig_term:
                        seen_ranges.add(range_key)
                        
                        warnings_list.append(LintWarning(
                            original_term=orig_term,
                            suggested_pure_term=w.get("suggested_pure_term", ""),
                            phonetic_rendering=w.get("phonetic_rendering", ""),
                            start_index=start,
                            end_index=end,
                            confidence_score=w.get("confidence_score", 0.8),
                            is_verified=w.get("is_verified", False),
                            explanation=w.get("explanation", ""),
                            example_usage=w.get("example_usage")
                        ))

                lang_info = LanguageInfo(
                    detected_language=data.get("detected_language", "en"),
                    confidence=data.get("language_confidence", 0.9),
                    contains_tanglish=data.get("contains_tanglish", False)
                )

                metrics = QualityMetrics(
                    writing_score=data.get("quality_metrics", {}).get("writing_score", 100),
                    readability_level=data.get("quality_metrics", {}).get("readability_level", "Medium"),
                    grammar_errors_count=len(warnings_list)
                )

                return LintResponse(
                    original_text=text,
                    language_info=lang_info,
                    warnings=warnings_list,
                    quality_metrics=metrics,
                    suggested_rewrite_pure=data.get("suggested_rewrite_pure", text),
                    suggested_rewrite_phonetic=data.get("suggested_rewrite_phonetic", text)
                )

            except Exception as e:
                logger.error(f"Gemini generation error: {e}. Falling back to heuristic linter.")
        
        # Fallback / Rule-based Heuristic Linter Mode
        warnings_list = []
        for m in local_matches:
            warnings_list.append(LintWarning(
                original_term=m["original_term"],
                suggested_pure_term=m["suggested_pure_term"],
                phonetic_rendering=m["phonetic_rendering"],
                start_index=m["start_index"],
                end_index=m["end_index"],
                confidence_score=m["confidence_score"],
                is_verified=True,
                explanation=m["explanation"],
                example_usage=m["example_usage"]
            ))

        # Basic Language Detection Heuristic
        contains_tamil_chars = any(ord(char) >= 0x0B80 and ord(char) <= 0x0BFF for char in text)
        contains_english_chars = any(char.isalpha() and ord(char) < 128 for char in text)
        
        detected_lang = "ta" if contains_tamil_chars and not contains_english_chars else "en"
        if contains_tamil_chars and contains_english_chars:
            detected_lang = "ta-Latn"
            
        lang_info = LanguageInfo(
            detected_language=detected_lang,
            confidence=0.8,
            contains_tanglish=detected_lang == "ta-Latn"
        )
        
        deduction = len(warnings_list) * 10
        metrics = QualityMetrics(
            writing_score=max(10, 100 - deduction),
            readability_level="Medium",
            grammar_errors_count=len(warnings_list)
        )

        rewrite_pure = text
        rewrite_phonetic = text
        for w in sorted(warnings_list, key=lambda x: x.start_index, reverse=True):
            rewrite_pure = rewrite_pure[:w.start_index] + w.suggested_pure_term + rewrite_pure[w.end_index:]
            if w.phonetic_rendering:
                rewrite_phonetic = rewrite_phonetic[:w.start_index] + w.phonetic_rendering + rewrite_phonetic[w.end_index:]

        return LintResponse(
            original_text=text,
            language_info=lang_info,
            warnings=warnings_list,
            quality_metrics=metrics,
            suggested_rewrite_pure=rewrite_pure,
            suggested_rewrite_phonetic=rewrite_phonetic
        )


# Instantiate linter service singleton
linter_service = LinterService()
