import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import torch
import torch.nn as nn
from sqlalchemy import create_engine
from sklearn.preprocessing import MinMaxScaler
from config import DATABASE_URL

# --- 1. POBIERANIE I ANALIZA DANYCH ---
engine = create_engine(DATABASE_URL)
df = pd.read_sql("SELECT timestamp, close_price FROM market_history ORDER BY timestamp ASC", engine)

print("--- Statystyki Opisowe ---")
print(df['close_price'].describe())

# --- 2. PREPROCESING (PRZYGOTOWANIE POD AI) ---
scaler = MinMaxScaler(feature_range=(0, 1))
# Skalujemy tylko ceny zamknięcia
scaled_data = scaler.fit_transform(df['close_price'].values.reshape(-1, 1))


def create_sequences(data, seq_length):
    xs, ys = [], []
    for i in range(len(data) - seq_length):
        x = data[i:(i + seq_length)]
        y = data[i + seq_length]
        xs.append(x)
        ys.append(y)
    return np.array(xs), np.array(ys)


# Okno 60 dni
window_size = 60
X, y = create_sequences(scaled_data, window_size)

# Podział na zbiór treningowy (80%) i testowy (20%)
train_size = int(len(X) * 0.8)
X_train, X_test = X[:train_size], X[train_size:]
y_train, y_test = y[:train_size], y[train_size:]

# Konwersja na tensory PyTorch
X_train = torch.from_numpy(X_train).float()
y_train = torch.from_numpy(y_train).float()
X_test = torch.from_numpy(X_test).float()
y_test = torch.from_numpy(y_test).float()


# --- 3. ARCHITEKTURA MODELU LSTM ---
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


# Inicjalizacja modelu
model = CryptoPredictor(input_dim=1, hidden_dim=64, num_layers=2, output_dim=1)
criterion = nn.MSELoss()  # Błąd średniokwadratowy
optimizer = torch.optim.Adam(model.parameters(), lr=0.001)

# --- 4. TRENOWANIE MODELU ---
epochs = 50
print("\n--- Rozpoczynam trening ---")
for epoch in range(epochs):
    model.train()
    optimizer.zero_grad()

    y_pred = model(X_train)
    loss = criterion(y_pred, y_train)

    loss.backward()
    optimizer.step()

    if (epoch + 1) % 10 == 0:
        print(f'Epoch [{epoch + 1}/{epochs}], Loss: {loss.item():.6f}')

# --- 5. PROGNOZA I WIZUALIZACJA ---
model.eval()
with torch.no_grad():
    predictions = model(X_test)
    predictions = scaler.inverse_transform(predictions.numpy())
    actual = scaler.inverse_transform(y_test.numpy())

# Wykres wyników
plt.figure(figsize=(12, 6))
plt.plot(actual, label='Prawdziwe ceny (Test)')
plt.plot(predictions, label='Prognoza AI')
plt.title('Bitcoin: Prawdziwe ceny vs Przewidywania modelu LSTM')
plt.xlabel('Dni (Zbiór testowy)')
plt.ylabel('Cena USD')
plt.legend()
plt.show()

torch.save(model.state_dict(), "bitcoin_model.pth")
print("\nModel zapisany jako bitcoin_model.pth")