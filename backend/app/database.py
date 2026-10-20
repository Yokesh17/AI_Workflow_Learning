import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Ensure backend directory is in sys.path
CURRENT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = CURRENT_DIR.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

# Load .env from backend directory
env_path = BACKEND_DIR / ".env"
load_dotenv(env_path if env_path.exists() else None)

default_sqlite_path = (BACKEND_DIR / "learning_path.db").as_posix()
default_db_url = f"sqlite:///{default_sqlite_path}"
DATABASE_URL = os.getenv("DATABASE_URL", default_db_url)

# For SQLite, connect_args must disable same thread check
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

