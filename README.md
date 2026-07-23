# 🧠 MozhiMathi AI 

> **An AI-Powered Tamil Technical Linter & Writing Assistant**

MozhiMathi AI is an intelligent writing assistant designed to help users write **technically accurate and standardized Tamil**. Instead of functioning as a chatbot or a generic translator, it acts as a **Tamil Technical Linter**, reviewing technical content in real time, identifying terminology inconsistencies, and recommending official Tamil technical terms backed by a curated knowledge base.

---

## 📖 Overview

Technical Tamil resources are available across government publications, glossaries, and dictionaries. However, these resources are difficult to search and cannot assist users while writing. Existing translation tools often generate inconsistent terminology and lack awareness of official technical standards.

MozhiMathi AI bridges this gap by combining **Natural Language Processing (NLP)**, **Retrieval-Augmented Generation (RAG)**, and a **structured PostgreSQL knowledge base** to provide context-aware terminology recommendations, explanations, and writing assistance.

---

## ✨ Key Features

- 🔍 **Tamil Technical Linter**
  - Detects non-standard or inconsistent technical terminology.
  - Recommends official Tamil equivalents.
  - Explains why a recommendation is suggested.

- ✍️ **Real-Time Writing Assistant**
  - Context-aware terminology suggestions.
  - Inline recommendations while typing.
  - Technical writing quality improvements.

- 📚 **Technical Knowledge Explorer**
  - Search official technical Tamil terms.
  - View definitions, examples, and related terminology.
  - Learn technical vocabulary while writing.

- 🎯 **Technical Writing Score**
  - Evaluates terminology consistency.
  - Highlights untranslated English words.
  - Generates writing quality reports.

- ⚡ **Context-Aware Next Word Recommendations**
  - Predicts technical words and phrases while typing.
  - Works similarly to GitHub Copilot for technical writing.
  - Uses knowledge-base-guided AI suggestions instead of generic autocomplete.

- 🔌 **Developer APIs**
  - Terminology Lookup
  - Document Analysis
  - Writing Assistance
  - Recommendation Engine

---

# 🏗️ Architecture

```
                React + TypeScript
                        │
                        ▼
               Rich Text Editor
                        │
                        ▼
                 FastAPI Backend
                        │
         ┌──────────────┴──────────────┐
         │                             │
         ▼                             ▼
 PostgreSQL Knowledge Base      Gemini API
         │                             │
         └──────────────┬──────────────┘
                        ▼
                Linting & Suggestions
```

---

# ⚙️ Text Processing Pipeline

```
User Input
      │
      ▼
Normalization
      │
      ▼
Language Detection
      │
      ▼
Tanglish Detection
      │
      ▼
Sentence Segmentation
      │
      ▼
Tokenization
      │
      ▼
Technical Term Detection
      │
      ▼
PostgreSQL Knowledge Base Lookup
      │
      ▼
Context Builder
      │
      ▼
Gemini API
      │
      ▼
Suggestion Ranking
      │
      ▼
Lint Results & Recommendations
```

---

# 🛠️ Tech Stack

### Frontend

- React
- TypeScript
- Tailwind CSS
- TipTap Editor

### Backend

- FastAPI
- Python

### Database

- PostgreSQL

### AI & NLP

- Google Gemini
- Retrieval-Augmented Generation (RAG)
- AI4Bharat Models (Planned)
- Sentence Transformers (Planned)

### OCR

- PaddleOCR

### Deployment

- Docker
- GitHub Actions

---

# 📂 Project Structure

```
MozhiMathi-AI/

├── backend/
├── frontend/
├── docs/
├── datasets/
├── scripts/
├── docker/
├── README.md
└── docker-compose.yml
```

---

# 🚀 Getting Started

## Clone the Repository

```bash
git clone https://github.com/tamil-selvan-k/MozhiMathi-AI.git

cd MozhiMathi-AI
```

---

## Backend

```bash
cd backend

python -m venv .venv

source .venv/bin/activate
# Windows
.venv\Scripts\activate

pip install -r requirements.txt

uvicorn app.main:app --reload
```

---

## Frontend

```bash
cd frontend

pnpm install

pnpm dev
```

---

## PostgreSQL

Create a PostgreSQL database and configure the environment variables.

```
DATABASE_URL=postgresql://user:password@localhost:5432/mozhimathi
```

---

## Gemini API

```
GEMINI_API_KEY=YOUR_API_KEY
```

---

# 📚 Documentation

Complete documentation is available in the **docs/** directory.

- Project Overview
- Architecture Documentation
- System Design
- Database Design
- AI Engine
- API Reference
- Development Guide
- Deployment Guide

---

# 🎯 Roadmap

- [x] Project Architecture
- [x] PostgreSQL Knowledge Base
- [x] OCR Dataset Pipeline
- [x] Tamil Technical Linter
- [x] Context-Aware Suggestions
- [x] AI Writing Assistant
- [ ] Knowledge Graph
- [ ] VS Code Extension
- [ ] Browser Extension
- [ ] Microsoft Word Add-in
- [ ] Offline Desktop Version

---

# 🤝 Contributing

Contributions are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Commit your changes.
4. Submit a Pull Request.

Please ensure code follows the project architecture and coding standards.

---

# 📄 License

This project is licensed under the **MIT License**.

---

# 👨‍💻 Author

**Tamil Selvan**

- GitHub: https://github.com/tamil-selvan-k
- LinkedIn: https://linkedin.com/in/tamilselvan2007

---

> **"Developers have ESLint. Writers have Grammarly. Tamil technical writers deserve MozhiMathi AI."**
````0
