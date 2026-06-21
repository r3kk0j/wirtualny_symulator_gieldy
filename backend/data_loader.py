import urllib.parse
from datetime import datetime  # NOWOŚĆ: do pobierania aktualnej daty
from sqlalchemy import create_engine
import pandas as pd
import yfinance as yf
from config import DATABASE_URL

engine = create_engine(DATABASE_URL)


def fetch_and_save_data(ticker="BTC-USD"):
    # Dynamicznie pobieramy dzisiejszą datę w formacie YYYY-MM-DD
    today_str = datetime.today().strftime('%Y-%m-%d')
    print(f"Rozpoczynam pobieranie danych historycznych dla {ticker} (od 2022-01-01 do {today_str})...")

    try:
        # Zmieniamy 'end' na dynamiczną datę dzisiejszą
        df = yf.download(
            ticker,
            start="2022-01-01",
            end=today_str,
            interval="1d"
        )

        if df.empty:
            print(f"Błąd: Nie znaleziono danych dla symbolu {ticker}")
            return

        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)

        df.reset_index(inplace=True)
        df.columns = [str(col).lower().strip() for col in df.columns]

        df = df.rename(columns={
            'date': 'timestamp',
            'open': 'open_price',
            'high': 'high_price',
            'low': 'low_price',
            'close': 'close_price'
        })

        required_columns = ['timestamp', 'open_price', 'high_price', 'low_price', 'close_price']
        df = df[required_columns].copy()
        df['symbol'] = ticker

        print("\n--- Podgląd skrajnych rekordów w bazie danych ---")
        print("Pierwsze dni (2022):")
        print(df[['timestamp', 'close_price']].head(2))
        print("Ostatnie dni (Aktualne):")
        print(df[['timestamp', 'close_price']].tail(2))
        print("--------------------------------------------------\n")

        df.to_sql('market_history', engine, if_exists='replace', index=False)
        print(f"Sukces! Baza została zasilona historią od 2022 do {today_str}.")

    except Exception as e:
        print(f"Wystąpił krytyczny błąd: {e}")


if __name__ == "__main__":
    fetch_and_save_data("BTC-USD")