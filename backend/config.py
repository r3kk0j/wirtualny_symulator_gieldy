import urllib.parse

DB_USER = "postgres"
DB_PASSWORD = "1234qwer"
DB_HOST = "localhost"
DB_PORT = "5432"
DB_NAME = "magister"
safe_password = urllib.parse.quote_plus(DB_PASSWORD)
DATABASE_URL = f"postgresql://{DB_USER}:{safe_password}@{DB_HOST}:{DB_PORT}/{DB_NAME}"