from flask import Flask
from flask_cors import CORS
from user import user_bp
from ai_api import ai_bp
from news_api import news_bp

app = Flask(__name__)
CORS(app)
app.register_blueprint(user_bp, url_prefix='/auth')
app.register_blueprint(ai_bp, url_prefix='/api')
app.register_blueprint(news_bp, url_prefix="/api")
@app.route('/api/market-data', methods=['GET'])
def get_data():
    return {"status": "ok"}
if __name__ == '__main__':
    app.run(debug=True)