from flask import Flask
from flask_cors import CORS
from user import user_bp  # Moduł użytkownika
from ai_api import ai_bp  # Importujemy moduł AI
from news_api import news_bp

app = Flask(__name__)
CORS(app)

# Rejestracja blueprintu użytkownika - dostępny pod /auth/... (np. /auth/login)
app.register_blueprint(user_bp, url_prefix='/auth')

# Rejestracja blueprintu AI - po połączeniu z nową trasą da dokładnie /api/ai-forecast
app.register_blueprint(ai_bp, url_prefix='/api')
app.register_blueprint(news_bp, url_prefix="/api")
# Tutaj zostają Twoje dotychczasowe endpointy rynkowe
@app.route('/api/market-data', methods=['GET'])
def get_data():
    return {"status": "ok"}

if __name__ == '__main__':
    app.run(debug=True)