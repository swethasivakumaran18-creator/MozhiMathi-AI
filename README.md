# MozhiMathi-AI Boilerplate

Full-stack boilerplate for an AI-powered Tamil Technical Linter.

## Stack
- **Frontend**: React + Vite + Tiptap rich text editor
- **Backend**: FastAPI + SQLAlchemy + PostgreSQL-ready configuration
- **Infra**: Docker + Docker Compose

## Backend APIs
- `GET /api/v1/health` - service health check
- `POST /api/v1/documents` - ingest documents for RAG context
- `POST /api/v1/lint` - lint Tamil technical content
- `POST /api/v1/ocr/extract` - OCR upload endpoint (ready for OCR engine integration)

## Local setup
### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Docker
```bash
docker compose up --build
```

Frontend: `http://localhost:5173`  
Backend docs: `http://localhost:8000/docs`
