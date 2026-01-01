import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

DATABASE_URL = os.environ.get("DATABASE_URL")

engine = None
SessionLocal = None

if DATABASE_URL:
    engine = create_engine(
        DATABASE_URL,
        pool_recycle=300,
        pool_pre_ping=True,
    )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def is_db_available() -> bool:
    return engine is not None and SessionLocal is not None


def get_db():
    if not is_db_available():
        raise RuntimeError("Database not configured. Set DATABASE_URL environment variable.")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    if not is_db_available():
        print("Warning: DATABASE_URL not set. Session persistence disabled.")
        return
    from server import models
    Base.metadata.create_all(bind=engine)
    print("Database initialized successfully.")
