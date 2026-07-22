# கலைச்சொல் Linter (MozhiMathi-AI)
## Classical Tamil Technical Terminology & Lexical Linter Suite

This documentation provides a comprehensive overview of the **கலைச்சொல் Linter (MozhiMathi-AI)** project, detailing its purpose, functional behaviors, technical architecture, and algorithmic mechanics from both a non-technical and technical perspective.

---

## 1. Non-Technical Perspective

### What is the கலைச்சொல் Linter?
In modern technology, engineering, and digital communications, the Tamil language is frequently blended with English words (resulting in "Tanglish") or written using heavy phonetic loan words. While this facilitates quick expression, it dilutes linguistic purity and creates a barrier for formal technical education, localization, and standardized translations.

The **கலைச்சொல் Linter** is an intelligent web suite designed to scan, analyze, and clean Tamil technical writing. It acts as an automated editor that flags technical jargon, colloquial slangs, and English loan words, suggesting pure, verified classical Tamil equivalents approved by recognized academic bodies (such as Anna University and the University of Madras).

### Core Features & Value Propositions
*   **Linguistic Rich Text Editor**: An interactive word-processor style interface that checks your text in real time. It underlines flagged words and displays definitions, correct usage example sentences, and suggestions upon hovering.
*   **University Glossary Directory**: A searchable database containing verified technical terms. Users can browse, filter, and propose new technical words.
*   **Hybrid Search Analyzer**: A diagnostics panel that visualizes exactly how the search engine matches terms. Users can modify weights and observe the mathematical breakdown of how a query is calculated.
*   **Multi-Translation Draft Output**: The linter provides three versions of rewrites:
    1.  *Pure Tamil*: Replaces all foreign words with formal, classical Tamil equivalents (excellent for official documents, academic papers, and textbooks).
    2.  *Phonetic/Common Tamil*: Replaces words while preserving natural sentence flow and using phonetic transliterations where pure terms feel too complex (ideal for casual blogs, subtitles, and user interfaces).
    3.  *Pure English*: Translates the entire text into grammatically correct English (perfect for technical writers translating drafts back to English repositories).

---

## 2. Technical Perspective

### High-Level System Architecture
The suite operates under a standard client-server paradigm, leveraging a PostgreSQL/SQLite database for structured glossary lookups, Redis for caching responses, and Google's Gemini models for advanced linguistic analysis.

```mermaid
graph TD
    A[React 19 Frontend Web UI] -->|1. POST /lint request| B[FastAPI Backend Engine]
    B -->|2. Check cache| C[(Redis Cache)]
    B -->|3. Scans phrase subsets| D[(PostgreSQL/SQLite Database)]
    D -->|4. Retrieves matched terms| B
    B -->|5. Formulates RAG Context| E[Gemini Generative AI API]
    E -->|6. Structured JSON Analysis| B
    B -->|7. Write cache & return payload| A
    
    A -->|Browse & Filter| F[Terminology API CRUD]
    F -->|Read / Write| D
```

---

### Backend Architecture
The backend is built with **FastAPI**, providing high performance, auto-generated OpenAPI documentation, and asynchronous capability. 

*   **Database**: PostgreSQL or SQLite via **SQLAlchemy** ORM. Database schemas are designed for standard relational integrity, separating domains, categories, sources, and definitions.
*   **Caching Layer**: A fail-soft **Redis** cache. It caches responses for queries with an expiration time of 3600 seconds to bypass LLM token latency on duplicate texts.
*   **Seed Module**: Pre-loaded with normalized domains (e.g., Software Engineering, Data Science) and sources (e.g., Anna University Glossary, University of Madras).

#### Database Schema Model Relationships
*   `Term`: The main terminology entity (`english_term`, `tamil_term` [phonetic], `pure_tamil_term`, `confidence_score`, `is_verified`).
*   `Domain` & `Category`: For logical domain categorization.
*   `Source`: Represents the origin authority (e.g., "Anna University Glossary").
*   `TermEmbedding`: Caches high-dimensional vectors generated from Gemini embeddings model.
*   `Definition`, `Example`, `Synonym`: Enrichment tables to store definitions and sentence mappings.

---

### Algorithmic Mechanics

The core value of the backend linter is its multi-layered matching and cleaning pipeline.

#### 1. Advanced Hybrid Search Strategy
When text is input, the engine tokenizes the content into words and sliding window phrases (1, 2, and 3-word combinations) to capture multi-word technical concepts (e.g., "Data Structure"). For each candidate phrase, the engine calculates a composite match score against the entire dictionary:

$$\text{Composite Score} = w_{\text{exact}} \cdot M_{\text{exact}} + w_{\text{trigram}} \cdot M_{\text{trigram}} + w_{\text{vector}} \cdot M_{\text{vector}} \cdot C_{\text{source}}$$

Where:
*   **Exact Match Score ($M_{\text{exact}}$)**: Returns `1.0` if the phrase matches either `english_term` or `tamil_term` exactly (case-insensitive); otherwise `0.0`. Default weight $w_{\text{exact}} = 0.5$.
*   **Trigram Fuzzy Score ($M_{\text{trigram}}$)**: Computed using char-level trigram sets to match typos or slight spelling variations. Default weight $w_{\text{trigram}} = 0.3$.
*   **Vector Semantic Score ($M_{\text{vector}}$)**: Evaluates semantic similarity by generating dense embeddings utilizing Gemini’s embeddings model and computing Cosine Similarity. Caches vectors locally in the `TermEmbedding` table. Default weight $w_{\text{vector}} = 0.2$.
*   **Source Authority Coefficient ($C_{\text{source}}$)**: A scaling coefficient multiplier representing trust levels of the term source:
    *   *Anna University*: `1.0`
    *   *University of Madras*: `0.9`
    *   *Community Proposed*: `0.7`

#### 2. Deduplication & Overlap Resolution
Because sliding windows create overlapping candidates (e.g., for the phrase "Fast API compiler", candidates include "Fast", "API", "compiler", "Fast API", and "API compiler"), the engine resolves overlaps using an interval schedule sorting approach:
1.  Candidates are sorted by starting position index, then by span length (descending), and then by composite match confidence (descending).
2.  The engine iterates through the sorted candidates, keeping the highest-scoring candidate and pruning any overlapping intervals.

#### 3. RAG and Gemini AI Reasoning Pipeline
Once local database matches are identified, they are formatted as **Ground Truth Reference Context** (Retrieval-Augmented Generation pattern) and injected into a strict system prompt sent to Gemini.

The prompt instructs the model to:
*   Perform language identification (`en`, `ta`, or `ta-Latn` [Tanglish]).
*   Augment/prioritize database-verified terms.
*   Generate `suggested_rewrite_pure` (formal classical Tamil), `suggested_rewrite_phonetic` (common phonetic Tamil), and `suggested_rewrite_english` (pure English translation).

---

### Frontend Architecture
The user interface is powered by **React 19**, styled using a glassmorphic color palette with **Tailwind CSS v4** and **Motion** animations.

#### 1. Real-Time TipTap ProseMirror Editor
The main editor utilizes the **TipTap** editor framework. To enable real-time linting highlights, a custom TipTap extension was engineered:

*   **`LinterHighlighter` ProseMirror Plugin**:
    *   Listens to document updates.
    *   Constructs a dynamic `DecorationSet` wrapping identified loan terms.
    *   Applies a dashed underline style: green for officially verified database matches (`linter-verified`) and amber for AI-proposed matches (`linter-ai`).
    *   Hooks into ProseMirror `handleDOMEvents` (specifically `mouseover`) to capture the element's bounding rect and pass the flagged warning details to the React state.
*   **Simplified Formatting Toolbar**:
    *   The toolbar is restricted to **Bold**, **Italic**, and **Code Block** options. Headers (H1, H2) and bullet lists are kept hidden to focus strictly on pure text content editing.

#### 2. Custom UX Tooltips & Select Options
*   **Viewport Clamping tooltips**: Tooltip popover coordinates are calculated dynamically. The card is clamped inside the screen boundary margins (`Math.min(288, window.innerWidth - 24)`), and the pointing arrow's left offset is recalculated dynamically (`arrowOffsetPercent = 50 + (delta / cardWidth) * 100`) to always point directly to the center of the hovered word.
*   **Custom Select Dropdowns**: Standard native HTML select options are replaced with custom React dropdown panels styled with custom hover backgrounds, active selection checkmarks, and full viewport click-away dismiss actions to ensure perfect design consistency.

---

### API Specifications

#### 1. Text Linting Endpoint
*   **URL**: `/api/v1/linter/lint`
*   **Method**: `POST`
*   **Payload**:
    ```json
    {
      "text": "Iniki programming loop romba complex ah iruku."
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "original_text": "Iniki programming loop romba complex ah iruku.",
      "language_info": {
        "detected_language": "ta-Latn",
        "confidence": 0.95,
        "contains_tanglish": true
      },
      "warnings": [
        {
          "original_term": "programming",
          "suggested_pure_term": "நிரலாக்கம்",
          "phonetic_rendering": "புரோகிராமிங்",
          "start_index": 6,
          "end_index": 17,
          "confidence_score": 0.98,
          "is_verified": true,
          "explanation": "English technical loan word; maps to pure Tamil 'நிரலாக்கம்'.",
          "example_usage": "நிரலாக்கம் கற்க எளிதானது."
        }
      ],
      "quality_metrics": {
        "writing_score": 70,
        "readability_level": "Easy",
        "grammar_errors_count": 1
      },
      "suggested_rewrite_pure": "இன்றைய நிரலாக்க மடக்கு மிகவும் சிக்கலாக இருக்கிறது.",
      "suggested_rewrite_phonetic": "இன்றைய புரோகிராமிங் லூப் மிகவும் சிக்கலாக இருக்கிறது.",
      "suggested_rewrite_english": "Today the programming loop is very complex."
    }
    ```

#### 2. Glossary Query Endpoint
*   **URL**: `/api/v1/terminology/terms`
*   **Method**: `GET`
*   **Query Parameters**:
    *   `q` (string, optional) - Fuzzy search term query.
    *   `domain_id` (integer, optional) - Filter by domain ID.
    *   `category_id` (integer, optional) - Filter by category ID.
    *   `skip` (integer, default: 0) - Pagination offset.
    *   `limit` (integer, default: 15) - Page size limit.
*   **Response (200 OK)**: A list of terms containing linguistic structures, definitions, and relationships.

---

### How to Run Locally

#### Prerequisites
*   Python 3.10+ installed.
*   Node.js 18+ (with `pnpm` or `npm`) installed.
*   Redis server installed and running (optional, system falls back to database directly if Redis is offline).

#### 1. Setup Backend
1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Create a virtual environment and activate it:
    ```bash
    python -m venv .venv
    # Windows:
    .venv\Scripts\activate
    # macOS/Linux:
    source .venv/bin/activate
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Configure environment variables by copying `.env.example` to `.env`:
    ```bash
    copy .env.example .env
    ```
    *Open `.env` and fill in your `GEMINI_API_KEY` and optional Redis configurations.*
5.  Launch the FastAPI server:
    ```bash
    uvicorn app.main:app --reload --port 8000
    ```

#### 2. Setup Frontend
1.  Navigate to the `frontend` directory:
    ```bash
    cd ../frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Launch Vite developer server:
    ```bash
    npm run dev
    ```
    *The web UI will be accessible at `http://localhost:3000` (proxied to port 8000).*
