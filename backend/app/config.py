import os
from pathlib import Path
from typing import List
from dotenv import load_dotenv

# Locate project root and load .env if available
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
ENV_PATH = ROOT_DIR / ".env"
if ENV_PATH.exists():
    load_dotenv(ENV_PATH)
else:
    load_dotenv()


class Settings:
    PROJECT_NAME: str = "Séance Studio Backend"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    
    # Network and loopback binding
    HOST: str = os.getenv("BACKEND_HOST", "127.0.0.1")
    PORT: int = int(os.getenv("BACKEND_PORT", "8000"))
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "info")
    
    # CORS
    raw_cors: str = os.getenv("CORS_ORIGINS", "http://127.0.0.1:3000,http://localhost:3000")
    CORS_ORIGINS: List[str] = [origin.strip() for origin in raw_cors.split(",") if origin.strip()]
    
    # Database
    # Canonical persistence in backend/data/seance_studio.db
    BACKEND_DIR = Path(__file__).resolve().parent.parent
    DEFAULT_DB_PATH = BACKEND_DIR / "data" / "seance_studio.db"
    
    @staticmethod
    def _resolve_database_url() -> str:
        backend_dir = Path(__file__).resolve().parent.parent
        default_path = backend_dir / "data" / "seance_studio.db"
        raw_url = os.getenv("DATABASE_URL", "").strip()
        if not raw_url:
            return f"sqlite:///{default_path.as_posix()}"
        if raw_url.startswith("sqlite:///"):
            path_str = raw_url[len("sqlite:///"):]
            p = Path(path_str)
            if not p.is_absolute():
                # If relative to root or backend, resolve canonical location
                if p.parts and p.parts[0] == "backend":
                    p = (backend_dir.parent / p).resolve()
                else:
                    p = (backend_dir / p).resolve()
            return f"sqlite:///{p.as_posix()}"
        return raw_url

    DATABASE_URL: str = _resolve_database_url.__func__()
    
    # Ollama Local Service
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "qwen3:4b")
    OLLAMA_VISION_MODEL: str = os.getenv("OLLAMA_VISION_MODEL", "qwen3-vl:8b")
    OLLAMA_TIMEOUT_SECONDS: float = float(os.getenv("OLLAMA_TIMEOUT_SECONDS", "120.0"))
    OLLAMA_KEEP_ALIVE: str = os.getenv("OLLAMA_KEEP_ALIVE", "5m")
    ALLOW_MODEL_AUTO_DOWNLOAD: bool = os.getenv("ALLOW_MODEL_AUTO_DOWNLOAD", "false").lower() == "true"
    
    # Air-gap & Offline Strict Mode
    OFFLINE_STRICT_MODE: bool = os.getenv("OFFLINE_STRICT_MODE", "true").lower() == "true"
    ENABLE_TELEMETRY: bool = False
    ENABLE_ANALYTICS: bool = False

    def ensure_data_directory(self) -> None:
        """Ensure SQLite directory exists prior to engine connection."""
        if self.DATABASE_URL.startswith("sqlite:///"):
            db_path_str = self.DATABASE_URL.replace("sqlite:///", "")
            db_path = Path(db_path_str)
            db_path.parent.mkdir(parents=True, exist_ok=True)


settings = Settings()
