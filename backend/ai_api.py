import os
import pandas as pd
import torch
import torch.nn as nn
from config import DATABASE_URL
from flask import Blueprint, jsonify, request
from sklearn.preprocessing import MinMaxScaler
from sqlalchemy import create_engine

ai_bp = Blueprint("ai", __name__)
engine = create_engine(DATABASE_URL)

class CryptoPredictor(nn.Module):
    def __init__(self, input_dim, hidden_dim, num_layers, output_dim):
        super(CryptoPredictor, self).__init__()
        self.hidden_dim = hidden_dim
        self.num_layers = num_layers
        self.lstm = nn.LSTM(input_dim, hidden_dim, num_layers, batch_first=True)
        self.fc = nn.Linear(hidden_dim, output_dim)

    def forward(self, x):
        h0 = torch.zeros(self.num_layers, x.size(0), self.hidden_dim).to(x.device)
        c0 = torch.zeros(self.num_layers, x.size(0), self.hidden_dim).to(x.device)
        out, _ = self.lstm(x, (h0, c0))
        out = self.fc(out[:, -1, :])
        return out

model = CryptoPredictor(input_dim=1, hidden_dim=64, num_layers=2, output_dim=1)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "bitcoin_model.pth")
try:
    model.load_state_dict(torch.load(MODEL_PATH, map_location=torch.device("cpu")), strict=False)
    model.eval()
except Exception as e:
    print(f"Błąd ładowania modelu: {e}")

@ai_bp.route("/ai-forecast", methods=["GET"])
def get_ai_forecast():
    try:
        req_start = request.args.get('start_date', default='2025-01-01', type=str)
        req_end = request.args.get('end_date', default='2025-12-31', type=str)

        target_start = pd.to_datetime(req_start)
        target_end = pd.to_datetime(req_end)

        df = pd.read_sql("SELECT timestamp, close_price FROM market_history ORDER BY timestamp ASC", engine)
        if df.empty:
            return jsonify({"message": "Baza danych jest pusta!"}), 400

        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df['ema_formula'] = df['close_price'].ewm(span=15, adjust=False).mean()

        forecast_start_point = df['timestamp'].iloc[-1]

        scaler = MinMaxScaler(feature_range=(0, 1))
        scaler.fit(df["close_price"].values.reshape(-1, 1))

        last_60_days = df["close_price"].tail(60).values.reshape(-1, 1)
        current_sequence = scaler.transform(last_60_days).tolist()
        total_days_to_generate = (target_end - forecast_start_point).days

        generated_forecast = {}
        last_ema = df['ema_formula'].iloc[-1]
        alpha = 2 / (15 + 1)

        loop_date = forecast_start_point

        for _ in range(max(0, total_days_to_generate)):
            input_tensor = torch.tensor([current_sequence[-60:]], dtype=torch.float32)
            with torch.no_grad():
                pred_scaled = model(input_tensor).item()

            pred_scaled = max(0, min(1, pred_scaled))
            current_sequence.append([pred_scaled])
            pred_usd = float(scaler.inverse_transform([[pred_scaled]])[0][0])

            loop_date += pd.Timedelta(days=1)
            date_str = loop_date.strftime("%Y-%m-%d")

            last_ema = (pred_usd * alpha) + (last_ema * (1 - alpha))

            generated_forecast[date_str] = {
                "price": round(pred_usd, 2),
                "ema": round(last_ema, 2)
            }
        chart_data = []
        current_date = target_start

        while current_date <= target_end:
            d_str = current_date.strftime("%Y-%m-%d")

            real_row = df[df['timestamp'] == current_date]
            real_val = float(real_row['close_price'].values[0]) if not real_row.empty else None
            math_val = float(real_row['ema_formula'].values[0]) if not real_row.empty else None
            ai_val = None
            if current_date > forecast_start_point:
                ai_data = generated_forecast.get(d_str)
                if ai_data:
                    ai_val = ai_data["price"]
                    math_val = ai_data["ema"]

            chart_data.append({
                "name": d_str,
                "RealPrice": real_val,
                "AI_Prediction": ai_val,
                "Math_Formula": round(math_val, 2) if math_val is not None else None
            })
            current_date += pd.Timedelta(days=1)
        return jsonify({"status": "success", "data": chart_data}), 200
    except Exception as e:
        return jsonify({"message": f"Błąd serwera: {str(e)}"}), 500