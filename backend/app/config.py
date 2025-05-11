import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(os.path.join(BASE_DIR, ".env"))


class Settings:
    PROJECT_NAME: str = "LinkedOut API"
    PROJECT_VERSION: str = "1.0.0"

    # Firebase Configuration
    FIREBASE_CREDENTIALS_PATH: str = os.path.join(BASE_DIR, "firebase-credentials.json")
    FIREBASE_PROJECT_ID: str = "linkedincopy-3423b"
    FIREBASE_STORAGE_BUCKET: str = "linkedincopy-3423b.firebasestorage.app"

    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    MAIL_USERNAME: str = os.getenv("MAIL_USERNAME", "")
    MAIL_PASSWORD: str = os.getenv("MAIL_PASSWORD", "")
    MAIL_FROM: str = os.getenv("MAIL_FROM", "info@linkedout.com")
    MAIL_PORT: int = int(os.getenv("MAIL_PORT", "587"))
    MAIL_SERVER: str = os.getenv("MAIL_SERVER", "")
    MAIL_FROM_NAME: str = os.getenv("MAIL_FROM_NAME", "LinkedOut")

    UPLOADS_DIR: str = os.path.join(BASE_DIR, "uploads")
    MEDIA_URL: str = "/media/"

    # Updated CORS settings with more permissive defaults for development
    CORS_ORIGINS: list = [
        "http://localhost:3000",  # React default port
        "http://127.0.0.1:3000",
        "http://localhost:8000",  # FastAPI port
        "http://127.0.0.1:8000",
        "http://localhost",
    ]


settings = Settings()