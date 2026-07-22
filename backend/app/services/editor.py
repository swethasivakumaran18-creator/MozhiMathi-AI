import os
import re
import json
import hashlib
from typing import List, Optional
import google.generativeai as genai
from sqlalchemy.orm import Session
from sqlalchemy import func

try:
    import redis
except ImportError:
    redis = None

from app.models.terminology import Term, Domain, Category, Source
from app.core.logging import logger
from app.schemas.editor import NextWordRequest, NextWordResponse, SuggestionItem

# Lazy loader for Gemini client configuration
_gemini_configured = False

def configure_gemini() -> bool:
    global _gemini_configured
    if _gemini_configured:
        return True
    
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return False
    try:
        genai.configure(api_key=api_key)
        _gemini_configured = True
        return True
    except Exception as e:
        logger.error(f"Failed to configure Gemini for Autocomplete: {e}")
        return False

# Setup Redis Client (Fail-Soft)
_redis_client = None
if redis:
    try:
        redis_host = os.environ.get("REDIS_HOST", "localhost")
        redis_port = int(os.environ.get("REDIS_PORT", 6379))
        redis_db = int(os.environ.get("REDIS_DB", 0))
        _redis_client = redis.Redis(
            host=redis_host,
            port=redis_port,
            db=redis_db,
            socket_timeout=1.0,
            socket_connect_timeout=1.0,
            decode_responses=True
        )
        _redis_client.ping()
    except Exception:
        _redis_client = None


class EditorService:
    def get_next_word_recommendations(self, db: Session, req: NextWordRequest) -> NextWordResponse:
        text = req.text
        cursor_pos = req.cursorPosition
        
        # 1. Slice text before the cursor
        context = text[:cursor_pos]
        if not context.strip():
            return NextWordResponse(suggestions=[])
            
        # Parse context and partial word
        words = context.split()
        if not words:
            return NextWordResponse(suggestions=[])
            
        ends_with_space = len(context) > 0 and context[-1].isspace()
        
        if ends_with_space:
            partial_word = ""
            last_words = words[-5:]
        else:
            partial_word = words[-1]
            last_words = words[:-1][-5:] if len(words) > 1 else []
            
        # 2. Check Cache
        cache_key = None
        if _redis_client:
            try:
                # Cache key is hashed by text prefix and cursor pos
                hash_val = hashlib.md5(f"{context}:{cursor_pos}".encode("utf-8")).hexdigest()
                cache_key = f"autocomplete:cache:{hash_val}"
                cached_res = _redis_client.get(cache_key)
                if cached_res:
                    data = json.loads(cached_res)
                    return NextWordResponse(**data)
            except Exception as e:
                logger.warning(f"Autocomplete cache read failed: {e}")

        # 3. Tier 1: Instant DB Autocomplete
        if req.tier == "db":
            suggestions = []
            try:
                context_search_keys = {w.lower().strip() for w in last_words}
                domain_ids = []
                if context_search_keys:
                    matched_context_terms = db.query(Term.domain_id).filter(
                        (func.lower(Term.english_term).in_(context_search_keys)) |
                        (func.lower(Term.tamil_term).in_(context_search_keys))
                    ).all()
                    domain_ids = [t[0] for t in matched_context_terms if t[0]]

                if partial_word:
                    prefix_query = f"{partial_word.lower()}%"
                    matched = db.query(Term).filter(
                        (func.lower(Term.english_term).like(prefix_query)) |
                        (func.lower(Term.tamil_term).like(prefix_query))
                    ).limit(5).all()
                    for t in matched:
                        if t.english_term.lower().startswith(partial_word.lower()):
                            suggestions.append(SuggestionItem(text=t.english_term, confidence=0.95))
                        else:
                            suggestions.append(SuggestionItem(text=t.tamil_term, confidence=0.92))
                else:
                    if domain_ids:
                        matched = db.query(Term).filter(
                            Term.domain_id.in_(domain_ids)
                        ).limit(5).all()
                        for t in matched:
                            suggestions.append(SuggestionItem(text=t.english_term, confidence=0.88))
            except Exception as db_err:
                logger.error(f"Tier-1 DB Autocomplete failed: {db_err}")

            if not suggestions:
                fallbacks = ["connect", "database", "server", "configure", "system", "table", "process", "variable", "function", "interface"]
                if partial_word:
                    matches = [f for f in fallbacks if f.startswith(partial_word.lower())]
                    suggestions = [SuggestionItem(text=m, confidence=0.7) for m in matches[:5]]
                else:
                    suggestions = [SuggestionItem(text=f, confidence=0.6) for f in fallbacks[:5]]

            return NextWordResponse(suggestions=suggestions[:5])

        # 4. Tier 2: AI Reasoning (RAG) Retrieval from DB
        db_terms = []
        try:
            # Query exact matches for context words to find active domains
            context_search_keys = {w.lower().strip() for w in last_words}
            matched_context_terms = []
            if context_search_keys:
                matched_context_terms = db.query(Term).filter(
                    (func.lower(Term.english_term).in_(context_search_keys)) |
                    (func.lower(Term.tamil_term).in_(context_search_keys))
                ).all()
            
            # Fetch active domain IDs
            domain_ids = {t.domain_id for t in matched_context_terms if t.domain_id}
            
            # If the user is typing a word, fetch terms starting with that prefix
            if partial_word:
                prefix_query = f"{partial_word.lower()}%"
                db_terms = db.query(Term).filter(
                    (func.lower(Term.english_term).like(prefix_query)) |
                    (func.lower(Term.tamil_term).like(prefix_query))
                ).limit(20).all()
            
            # If we don't have enough matching prefix terms, fetch related terms from active domains
            if len(db_terms) < 15 and domain_ids:
                domain_terms = db.query(Term).filter(
                    Term.domain_id.in_(list(domain_ids))
                ).limit(20 - len(db_terms)).all()
                db_terms.extend(domain_terms)
                
            # Deduplicate by ID
            seen_ids = set()
            db_terms = [t for t in db_terms if not (t.id in seen_ids or seen_ids.add(t.id))]
        except Exception as e:
            logger.error(f"Database error in next-word recommendation: {e}")
            db_terms = []

        # 4. Construct RAG Context list
        rag_glossary_lines = []
        for t in db_terms[:25]:
            rag_glossary_lines.append(
                f"- English: '{t.english_term}' -> Tamil: '{t.pure_tamil_term}' (Phonetic: '{t.tamil_term}')"
            )
        rag_context_str = "\n".join(rag_glossary_lines) if rag_glossary_lines else "No direct database matches found."

        # 5. Build AI Prompt
        prompt = f"""
You are a Context-Aware Next Word Recommendation Engine for technical Tamil writing.
Your goal is to suggest the next technical word or phrase to complete what the user is typing, based on writing style (Tamil, English, or Tanglish) and the official glossary.

CONTEXT BEFORE CURSOR:
"{context}"

CURRENT PARTIAL WORD BEING TYPED:
"{partial_word}"

VERIFIED TECHNICAL GLOSSARY (RAG Context):
{rag_context_str}

INSTRUCTIONS:
1. Detect whether the user is writing in Tamil, English, or mixed Tanglish (e.g. "server ku", "database connect").
2. Predict the top 5 most relevant next technical words or phrases.
3. If partial_word is not empty (e.g. "con"), the suggestions MUST complete it (e.g. "connectivity", "configure"). Prioritize terms from the verified glossary.
4. Recommend ONLY the next technical word or phrase, NOT the entire sentence.
5. Suggest in the matching language context. For example, if they write in English/Tanglish, English or phonetic Tamil words are highly relevant.
6. Rank suggestions by relevance and official priority.
7. Return a single, valid JSON object matching the following structure. Do not include markdown wraps:
{{
  "suggestions": [
    {{"text": "suggested_word", "confidence": 0.95}},
    {{"text": "word2", "confidence": 0.88}}
  ]
}}
"""

        # 6. Execute AI call with Groq fallback
        response_data = None
        try:
            if configure_gemini():
                model = genai.GenerativeModel("gemini-flash-latest")
                response = model.generate_content(
                    prompt,
                    generation_config=genai.GenerationConfig(
                        response_mime_type="application/json",
                        temperature=0.2
                    )
                )
                response_data = response.text
            else:
                raise Exception("Gemini is not configured")
        except Exception as e:
            logger.warning(f"Gemini next-word autocomplete failed: {e}. Trying Groq fallback...")
            groq_key = os.environ.get("GROQ_API_KEY")
            if groq_key:
                try:
                    import httpx
                    headers = {
                        "Authorization": f"Bearer {groq_key}",
                        "Content-Type": "application/json"
                    }
                    payload = {
                        "model": "llama-3.3-70b-versatile",
                        "messages": [
                            {
                                "role": "user",
                                "content": prompt
                            }
                        ],
                        "response_format": {
                            "type": "json_object"
                        },
                        "temperature": 0.2
                    }
                    with httpx.Client(timeout=5.0) as client:
                        res = client.post(
                            "https://api.groq.com/openai/v1/chat/completions",
                            json=payload,
                            headers=headers
                        )
                        if res.status_code == 200:
                            res_json = res.json()
                            response_data = res_json["choices"][0]["message"]["content"]
                        else:
                            raise Exception(f"Groq API returned status {res.status_code}")
                except Exception as groq_err:
                    logger.error(f"Groq autocomplete fallback failed: {groq_err}")

        # 7. Parse output and return response
        suggestions = []
        if response_data:
            try:
                raw_text = response_data.strip()
                if raw_text.startswith("```json"):
                    raw_text = raw_text.split("```json", 1)[1]
                if raw_text.endswith("```"):
                    raw_text = raw_text.rsplit("```", 1)[0]
                raw_text = raw_text.strip()
                
                data = json.loads(raw_text)
                for item in data.get("suggestions", []):
                    txt = item.get("text", "").strip()
                    conf = float(item.get("confidence", 0.5))
                    if txt:
                        suggestions.append(SuggestionItem(text=txt, confidence=conf))
            except Exception as parse_err:
                logger.error(f"Failed to parse autocomplete JSON response: {parse_err}")

        # 8. Fallback suggestions if AI failed or returned empty list
        if not suggestions:
            # Heuristic default fallback suggestions based on partial word
            fallbacks = ["connect", "database", "server", "configure", "system", "table", "process", "variable", "function", "interface"]
            if partial_word:
                matches = [f for f in fallbacks if f.startswith(partial_word.lower())]
                suggestions = [SuggestionItem(text=m, confidence=0.7) for m in matches[:5]]
            else:
                suggestions = [SuggestionItem(text=f, confidence=0.6) for f in fallbacks[:5]]

        # Limit to top 5
        suggestions = suggestions[:5]
        result = NextWordResponse(suggestions=suggestions)

        # 9. Cache in Redis
        if cache_key and _redis_client:
            try:
                _redis_client.setex(cache_key, 600, json.dumps(result.model_dump()))
            except Exception as cache_err:
                logger.warning(f"Autocomplete cache write failed: {cache_err}")

        return result

editor_service = EditorService()
