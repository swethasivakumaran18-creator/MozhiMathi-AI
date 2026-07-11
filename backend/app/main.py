from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import create_db_tables, router
from app.core.config import settings

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    create_db_tables()


app.include_router(router, prefix=settings.api_prefix)
