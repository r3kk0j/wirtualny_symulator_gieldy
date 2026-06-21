from sqlalchemy import create_engine, text
from config import DATABASE_URL

def get_db_connection():
    return create_engine(DATABASE_URL)

def check_db_health():
    engine = get_db_connection()
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False