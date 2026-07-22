# கலைச்சொல் Linter API Documentation

This document provides technical reference details for the REST API endpoints exposed by the **கலைச்சொல் Linter (MozhiMathi-AI)** backend. 

All endpoints run on the default URL: `http://localhost:8000` (or `http://127.0.0.1:8000`).

---

## 1. System Health Status

### `GET /health`
Verifies if the backend server is running and healthy, and returns the project name.

* **Response Header**: `Content-Type: application/json`
* **Response Body**:
  ```json
  {
    "status": "healthy",
    "project": "கலைச்சொல் Linter (MozhiMathi-AI)"
  }
  ```

---

## 2. Text Linting Service

### `POST /api/v1/linter/lint`
Scans a block of text (English, Tamil, or Tanglish) for loan words, technical slang, or spelling errors, and generates Tamil translation suggestions.

* **Request Header**: `Content-Type: application/json`
* **Request Body**:
  ```json
  {
    "text": "Variable declare pannunga, appuram logic process panni client server ku database connect pannunga."
  }
  ```
* **Response Body (200 OK)**:
  ```json
  {
    "original_text": "Variable declare pannunga, appuram logic process panni client server ku database connect pannunga.",
    "language_info": {
      "detected_language": "ta-Latn",
      "confidence": 0.98,
      "contains_tanglish": true
    },
    "warnings": [
      {
        "original_term": "Variable",
        "suggested_pure_term": "மாறி",
        "phonetic_rendering": "வேரியபிள்",
        "start_index": 0,
        "end_index": 8,
        "confidence_score": 1.0,
        "is_verified": true,
        "explanation": "Variable represents a placeholder in code that stores data, translated to 'மாறி' under standard computing glossaries.",
        "example_usage": "மாறி அறிவிப்பை சரிபார்க்கவும்."
      },
      {
        "original_term": "server",
        "suggested_pure_term": "வழங்கி",
        "phonetic_rendering": "சர்வர்",
        "start_index": 45,
        "end_index": 51,
        "confidence_score": 1.0,
        "is_verified": true,
        "explanation": "Server refers to the central computing processor serving requests, translated to 'வழங்கி'.",
        "example_usage": "வழங்கி இணைப்பை சரிபார்க்கவும்."
      }
    ],
    "quality_metrics": {
      "writing_score": 45,
      "readability_level": "Medium",
      "grammar_errors_count": 2
    },
    "suggested_rewrite_pure": "மாறி அறிவிப்பு செய்யுங்கள், பிறகு நெறிமுறை செயல்பாடுகளை வழங்கிக்கு தரவுத்தள இணைப்பு ஏற்படுத்துங்கள்.",
    "suggested_rewrite_phonetic": "வேரியபிள் அறிவிப்பு செய்யுங்க, அப்புறம் லாஜிக் பிராசஸ் பண்ணி சர்வர் கு டேட்டாபேஸ் கனெக்ட் பண்ணுங்க."
  }
  ```

---

## 3. Glossary Term Directory APIs

### `GET /api/v1/terminology/terms`
Retrieves a paginated list of technical terminology terms in the database, filtered optionally by search query, domain, or category.

* **Query Parameters**:
  * `q` (string, optional): A text search query matching English, phonetic Tamil, or pure Tamil terms.
  * `domain_id` (integer, optional): Filter by a specific academic Domain ID.
  * `category_id` (integer, optional): Filter by a specific Category ID.
  * `is_verified` (boolean, optional): Filter verified or unverified terms.
  * `skip` (integer, default: `0`): Pagination offset (how many terms to skip).
  * `limit` (integer, default: `100`): Pagination count limit (page size).
* **Response Body (200 OK)**:
  ```json
  [
    {
      "id": 1,
      "english_term": "API",
      "tamil_term": "ஏபிஐ",
      "pure_tamil_term": "நெறிமுறை இடைமுகம்",
      "ipa_tamil": "eɪ-pi-aɪ",
      "domain_id": 1,
      "category_id": 3,
      "source_id": 1,
      "confidence_score": 0.98,
      "is_verified": true,
      "created_at": "2026-07-22T06:00:00Z",
      "updated_at": "2026-07-22T06:00:00Z"
    }
  ]
  ```

---

### `POST /api/v1/terminology/terms`
Proposes and registers a new technical term inside the glossary database.

* **Request Header**: `Content-Type: application/json`
* **Request Body**:
  ```json
  {
    "english_term": "Repository",
    "tamil_term": "ரெப்பாசிட்டரி",
    "pure_tamil_term": "பதிவகம்",
    "ipa_tamil": "rɪˈpɒzɪt(ə)ri",
    "domain_id": 1,
    "category_id": 1,
    "source_id": 3,
    "confidence_score": 1.0,
    "is_verified": true,
    "definitions": [
      {
        "tamil_definition": "கோப்புகள் மற்றும் தரவுகளை சேமித்து வைக்கும் ஒரு மத்திய சேமிப்பகம்.",
        "english_definition": "A central location in which data is stored and managed, e.g., in git.",
        "author": "Community"
      }
    ],
    "examples": [
      {
        "tamil_example": "புதிய பதிவகத்தை உருவாக்கவும்.",
        "english_example": "Create a new repository."
      }
    ],
    "synonyms": []
  }
  ```
* **Response Body (201 Created)**:
  ```json
  {
    "id": 13,
    "english_term": "Repository",
    "tamil_term": "ரெப்பாசிட்டரி",
    "pure_tamil_term": "பதிவகம்",
    "ipa_tamil": "rɪˈpɒzɪt(ə)ri",
    "domain_id": 1,
    "category_id": 1,
    "source_id": 3,
    "confidence_score": 1.0,
    "is_verified": true,
    "created_at": "2026-07-22T06:55:00Z",
    "updated_at": "2026-07-22T06:55:00Z",
    "domain": {
      "id": 1,
      "name": "Software Engineering",
      "description": "Core concepts in software engineering and application development."
    },
    "category": {
      "id": 1,
      "name": "Programming Concepts",
      "description": "Terms related to coding, syntax, and logic."
    },
    "source": {
      "id": 3,
      "name": "Community Proposed",
      "url": null,
      "description": "Terms suggested by open-source Tamil developers."
    },
    "definitions": [
      {
        "id": 13,
        "term_id": 13,
        "tamil_definition": "கோப்புகள் மற்றும் தரவுகளை சேமித்து வைக்கும் ஒரு மத்திய சேமிப்பகம்.",
        "english_definition": "A central location in which data is stored and managed, e.g., in git.",
        "author": "Community",
        "version": 1,
        "created_at": "2026-07-22T06:55:00Z"
      }
    ],
    "examples": [
      {
        "id": 13,
        "term_id": 13,
        "tamil_example": "புதிய பதிவகத்தை உருவாக்கவும்.",
        "english_example": "Create a new repository.",
        "created_at": "2026-07-22T06:55:00Z"
      }
    ],
    "synonyms": []
  }
  ```

---

### `GET /api/v1/terminology/terms/{term_id}`
Retrieves full relational details for a single term, including its definitions, examples, and synonyms.

* **Response Body (200 OK)**: Returns the detailed term structure (identical to the Response model of `POST /terms`).

---

### `PUT /api/v1/terminology/terms/{term_id}`
Updates details of an existing term.

* **Request Header**: `Content-Type: application/json`
* **Request Body**:
  ```json
  {
    "pure_tamil_term": "புதிய தமிழாக்கம்",
    "is_verified": true
  }
  ```
* **Response Body (200 OK)**: Returns the detailed updated term structure.

---

### `DELETE /api/v1/terminology/terms/{term_id}`
Removes a term from the database.

* **Response Body (200 OK)**: Returns details of the deleted term.

---

## 4. Glossary Metadata Options

These helper endpoints return lookup parameters for dropdowns and filters in the user interface.

### `GET /api/v1/terminology/domains`
* **Response Body (200 OK)**:
  ```json
  [
    {
      "id": 1,
      "name": "Software Engineering",
      "description": "Core concepts in software engineering and application development."
    }
  ]
  ```

### `GET /api/v1/terminology/categories`
* **Response Body (200 OK)**:
  ```json
  [
    {
      "id": 1,
      "name": "Programming Concepts",
      "description": "Terms related to coding, syntax, and logic."
    }
  ]
  ```

### `GET /api/v1/terminology/sources`
* **Response Body (200 OK)**:
  ```json
  [
    {
      "id": 1,
      "name": "Anna University Glossary",
      "url": "https://www.annauniv.edu",
      "description": "Standard technical vocabulary curated by Anna University."
    }
  ]
  ```
