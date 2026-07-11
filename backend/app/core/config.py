from pydantic import computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "MozhiMathi Tamil Technical Linter"
    database_url: str | None = None
    db_user: str = "mozhi"
    db_password: str = "mozhi"
    db_host: str = "db"
    db_port: int = 5432
    db_name: str = "mozhi"
    api_prefix: str = "/api/v1"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @computed_field
    @property
    def sqlalchemy_database_url(self) -> str:
        if self.database_url:
            return self.database_url
        return (
            f"postgresql+psycopg2://{self.db_user}:{self.db_password}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}"
        )


settings = Settings()
