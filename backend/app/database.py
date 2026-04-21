import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL, echo=True)

SessionLocal = sessionmaker(bind=engine)

Base = declarative_base()

try:
  with engine.connect() as conn:
    conn.execute(text("SELECT 1"))
    print("Database connection successful!")
except Exception as e:
  print(f"Database connection failed: {e}")