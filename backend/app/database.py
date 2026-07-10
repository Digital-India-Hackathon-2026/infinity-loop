import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Default to Postgres if running locally, fallback to SQLite
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/farmer2gov")

# Calculate absolute directory path for backend root (Farmer2Gov/backend/)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SQLITE_URL = f"sqlite:///{os.path.join(BASE_DIR, 'farmer2gov.db')}"

engine = None

try:
    # Try connecting to postgres first with a short timeout to prevent hanging
    if DATABASE_URL.startswith("postgresql"):
        engine = create_engine(DATABASE_URL, connect_args={"connect_timeout": 3})
        # Test connection
        conn = engine.connect()
        conn.close()
        print("Successfully connected to PostgreSQL database.")
    else:
        raise ValueError("Non-Postgres DATABASE_URL")
except Exception as e:
    print(f"PostgreSQL connection failed: {e}. Falling back to SQLite at {SQLITE_URL}.")
    engine = create_engine(
        SQLITE_URL, 
        # check_same_thread needed only for SQLite
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
