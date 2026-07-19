import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Settings:
    supabase_url: str = os.getenv("SUPABASE_URL", "")
    supabase_service_role_key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    tavily_api_key: str = os.getenv("TAVILY_API_KEY", "")
    # Optional: raises the GitHub REST API's unauthenticated rate limit
    # (60/hr per IP) to 5000/hr. The code-style review works without it.
    github_token: str = os.getenv("GITHUB_TOKEN", "")


settings = Settings()
