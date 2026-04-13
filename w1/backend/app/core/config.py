from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_name: str = "Project Alpha API"
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/project_alpha"
    cors_origins: list[str] = ["http://localhost:15173"]


settings = Settings()
