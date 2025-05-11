import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(os.path.join(BASE_DIR, ".env"))


class Settings:
    PROJECT_NAME: str = "LinkedOut API"
    PROJECT_VERSION: str = "1.0.0"

    # MySQL Configuration (commented out for now)
    MYSQL_USER: str = os.getenv("MYSQL_USER", "linkedout_user")
    MYSQL_PASSWORD: str = os.getenv("MYSQL_PASSWORD", "linkedout_password")
    MYSQL_SERVER: str = os.getenv("MYSQL_SERVER", "localhost")
    MYSQL_PORT: str = os.getenv("MYSQL_PORT", "3306")
    MYSQL_DB: str = os.getenv("MYSQL_DB", "linkedout_db")

    # Use SQLite for simplicity and troubleshooting
    SQLITE_DB_FILE = os.path.join(BASE_DIR, "sqlite_linkedout.db")
    DATABASE_URL: str = f"sqlite:///{SQLITE_DB_FILE}"

    # Uncomment the MySQL connection string when ready to switch back
    # DATABASE_URL: str = f"mysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_SERVER}:{MYSQL_PORT}/{MYSQL_DB}"

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

    # Updated CORS settings
    CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://localhost",
    ]


settings = Settings()