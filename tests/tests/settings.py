from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        case_sensitive=True, env_file=(".env.example", ".env"))

    WEBSITE_BASE_URL: str


settings = Settings()  # type: ignore
