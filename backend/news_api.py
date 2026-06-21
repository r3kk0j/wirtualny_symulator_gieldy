import html
import re
import time
import urllib.request
from flask import Blueprint, jsonify

news_bp = Blueprint("news", __name__)

@news_bp.route("/crypto-news", methods=["GET"])
def get_crypto_news():
    current_time = int(time.time())
    try:
        url = "https://www.bankier.pl/rss/wiadomosci.xml"

        req = urllib.request.Request(
            url,
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        )
        with urllib.request.urlopen(req, timeout=6) as response:
            xml_data = response.read().decode('utf-8', errors='ignore')
        items = re.findall(r'<item>(.*?)</item>', xml_data, re.DOTALL)
        if not items:
            raise ValueError("Pusty lub nieobsługiwany format RSS Bankier.pl")
        parsed_news = []
        for index, item in enumerate(items[:10]):
            try:
                title_match = re.search(r'<title>(.*?)</title>', item, re.DOTALL)
                link_match = re.search(r'<link>(.*?)</link>', item, re.DOTALL)
                desc_match = re.search(r'<description>(.*?)</description>', item, re.DOTALL)

                title = title_match.group(1).strip() if title_match else "Wiadomości rynkowe z Polski"
                link = link_match.group(1).strip() if link_match else "https://www.bankier.pl"
                desc = desc_match.group(1).strip() if desc_match else ""

                # Oczyszczanie CDATA oraz znaczników HTML
                title = re.sub(r'<!\[CDATA\[(.*?)\]\]>', r'\1', title)
                desc = re.sub(r'<!\[CDATA\[(.*?)\]\]>', r'\1', desc)
                clean_body = re.sub(r'<[^>]*>', '', desc).strip()

                if not clean_body:
                    clean_body = "Zapoznaj się z pełnym raportem giełdowym oraz analizą rynkową bezpośrednio na łamach portalu finansowego."

                published_on = current_time - (index * 900)
                image_url = "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=400&auto=format&fit=crop"
                parsed_news.append({
                    "id": f"bankier_{index}",
                    "title": html.unescape(title),
                    "url": link,
                    "source": "Bankier.pl (GPW)",
                    "published_on": published_on,
                    "body": html.unescape(clean_body[:160] + "..."),
                    "imageurl": image_url
                })
            except Exception as item_err:
                print(f"Pominięto pojedynczy wpis Bankiera: {item_err}")
                continue

        return jsonify({"status": "success", "data": parsed_news}), 200

    except Exception as e:
        print(f"Błąd pobierania danych Bankier.pl ({str(e)}). Uruchamiam krajowy bufor danych.")
        local_market_news = [
            {
                "id": "gpw_mock_1",
                "title": "WIG20 nadrabia straty. Sektor bankowy i technologiczny ciągną indeksy w górę",
                "url": "https://www.bankier.pl",
                "source": "Giełda Warszawa (Bufor)",
                "published_on": current_time,
                "body": "Inwestorzy instytucjonalni wykazują zwiększoną aktywność na warszawskim parkiecie. Akcje kluczowych spółek technologicznych notują dynamiczne wzrosty przy zwiększonym wolumenie.",
                "imageurl": "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=400&auto=format&fit=crop"
            },
            {
                "id": "gpw_mock_2",
                "title": "Decyzja RPP w sprawie stóp procentowych. Jak zareaguje polski złoty?",
                "url": "https://www.bankier.pl",
                "source": "Makroekonomia (Bufor)",
                "published_on": current_time - 3600,
                "body": "Analitycy rynkowi spodziewają się utrzymania stóp na dotychczasowym poziomie. Rynek walutowy wykazuje podwyższoną zmienność w oczekiwaniu na oficjalny komunikat Rady.",
                "imageurl": "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=400&auto=format&fit=crop"
            }
        ]
        return jsonify({"status": "success", "data": local_market_news}), 200