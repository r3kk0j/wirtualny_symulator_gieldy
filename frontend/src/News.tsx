import React, { useState, useEffect } from 'react';
import { Newspaper, Clock, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  published_on: number;
  body: string;
  imageurl?: string;
}

const News = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchNews = async () => {
    setLoading(true);
    setError(false);
    try {
      // Pobieramy bezpiecznie z Twojego lokalnego backendu Flask
      const response = await fetch('http://localhost:5000/api/crypto-news');
      if (!response.ok) {
        throw new Error('Serwer backendowy zwrócił błąd.');
      }
      
      const result = await response.json();
      if (result.status === 'success' && Array.isArray(result.data)) {
        setNews(result.data);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error("Błąd pobierania wiadomości z backendu:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const formatDate = (timestamp: number) => {
    if (!timestamp) return "Brak daty";
    try {
      const date = new Date(timestamp * 1000);
      if (isNaN(date.getTime())) return "Błędna data";

      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');

      return `${hours}:${minutes} | ${day}.${month}`;
    } catch (e) {
      return "Błąd daty";
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center bg-slate-900 p-6 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-4xl font-black text-blue-500 italic uppercase tracking-tighter">Wiadomości Rynkowe</h2>
          <p className="text-slate-500 mt-1">Najświeższe polskie doniesienia parsowane przez serwer dedykowany</p>
        </div>
        <button 
          onClick={fetchNews}
          disabled={loading}
          className="p-3 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-750 transition-all text-blue-500 disabled:opacity-50"
        >
          <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
        </button>
      </header>

      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 animate-pulse">
              <div className="h-4 w-20 bg-slate-800 rounded mb-4"></div>
              <div className="h-6 w-3/4 bg-slate-800 rounded mb-2"></div>
              <div className="h-4 w-1/2 bg-slate-800 rounded"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-3xl text-center">
          <AlertCircle className="text-red-500 mx-auto mb-4" size={40} />
          <h3 className="text-white font-bold text-xl mb-2">Nie udało się pobrać wiadomości</h3>
          <p className="text-slate-400 text-sm mb-4">Upewnij się, że Twój serwer Flask jest uruchomiony i poprawnie zarejestrował moduł news_bp.</p>
          <button onClick={fetchNews} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl font-bold transition-colors">
            Odśwież połączenie
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {news.map((item) => (
            <a 
              key={item.id} 
              href={item.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-blue-500/50 hover:bg-slate-850 transition-all group flex flex-col md:flex-row gap-6"
            >
              {item.imageurl && (
                <div className="w-full md:w-40 h-28 shrink-0 overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
                  <img 
                    src={item.imageurl} 
                    alt="" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?q=80&w=400&auto=format&fit=crop';
                    }}
                  />
                </div>
              )}
              
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] bg-blue-600/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-md font-black uppercase tracking-widest">
                      {item.source}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1 uppercase">
                      <Clock size={12} className="text-slate-600" /> {formatDate(item.published_on)}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors leading-tight">
                    {item.title}
                  </h3>
                  <p className="text-slate-400 text-sm mt-2 line-clamp-2 font-medium">
                    {item.body}
                  </p>
                </div>
                
                <div className="flex items-center gap-2 text-blue-500 text-[10px] font-black uppercase tracking-widest mt-4 group-hover:text-blue-400 transition-colors">
                  Przeczytaj artykuł na Bitcoin.pl <ExternalLink size={12} />
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default News;