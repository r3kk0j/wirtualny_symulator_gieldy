import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { BrainCircuit, Info, Loader2, CalendarRange, Sigma } from 'lucide-react';

interface ChartItem {
  name: string;
  RealPrice: number | null;
  AI_Prediction: number | null;
  Math_Formula: number | null;
}

const AIAnalyze = () => {
  const [data, setData] = useState<ChartItem[]>([]);
  const [startDate, setStartDate] = useState<string>('2025-01-01');
  const [endDate, setEndDate] = useState<string>('2025-06-01');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchForecastData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `http://localhost:5000/api/ai-forecast?start_date=${startDate}&end_date=${endDate}`
      );
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Nie udało się pobrać danych porównawczych.');
      }
      
      const result = await response.json();
      if (result.status === 'success') {
        setData(result.data);
      }
    } catch (err: any) {
      setError(err.message || 'Wystąpił nieoczekiwany błąd serwera.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecastData();
  }, []);

  return (
    <div className="space-y-6 text-slate-100">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 bg-slate-800 p-4 rounded-xl border border-slate-700">
        <div className="flex items-center gap-3">
          <BrainCircuit className="text-blue-400" size={32} />
          <div>
            <h2 className="text-2xl font-bold">Zestawienie Trójwariantowe: Real vs AI vs Matematyka</h2>
            <p className="text-xs text-slate-400">Analiza efektywności algorytmów predykcyjnych</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 bg-slate-900/50 p-2 rounded-lg border border-slate-700">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
            <CalendarRange size={16} className="text-blue-400" />
            <span>Wybierz zakres analizy:</span>
          </div>
          <input
            type="date"
            value={startDate}
            min="2025-01-01"
            max="2026-12-31"
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-slate-800 text-xs font-bold border border-slate-600 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-blue-500"
          />
          <span className="text-xs text-slate-500">do</span>
          <input
            type="date"
            value={endDate}
            min="2025-01-02"
            max="2026-12-31"
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-slate-800 text-xs font-bold border border-slate-600 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={fetchForecastData}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-1.5 rounded transition-colors shadow-sm"
          >
            Porównaj Algorytmy
          </button>
        </div>
      </div>

      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 h-[500px] relative">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-slate-400 text-xs sm:text-base font-medium">
            Porównanie zachowania sieci neuronowej LSTM z klasycznym wskaźnikiem statystycznym EMA
          </h3>
          <div className="bg-emerald-950/40 text-emerald-300 px-2 py-1 rounded border border-emerald-800 flex items-center gap-1.5 text-xs font-medium">
            <Sigma size={14} /> Model Odniesienia: EMA (15) Baseline
          </div>
        </div>

        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800/80 rounded-xl space-y-3 z-10">
            <Loader2 className="animate-spin text-blue-500" size={40} />
            <p className="text-sm text-slate-400">Przeliczanie struktur matematycznych i sieci neuronowej...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-[80%] text-center p-4">
            <p className="text-red-400 font-bold mb-2">Błąd pobierania danych</p>
            <p className="text-xs text-slate-400 max-w-md">{error}</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" domain={['auto', 'auto']} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                itemStyle={{ fontWeight: 'bold' }}
                labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
              />
              <Legend />
              {/* 1. Realna cena z bazy */}
              <Line 
                type="monotone" 
                dataKey="RealPrice" 
                stroke="#3b82f6" 
                strokeWidth={3} 
                dot={false} 
                name="Rzeczywista cena giełdowa (USD)"
              />
              {/* 2. Predykcja LSTM */}
              <Line 
                type="monotone" 
                dataKey="AI_Prediction" 
                stroke="#f59e0b" 
                strokeWidth={2} 
                strokeDasharray="5 5" 
                dot={false}
                name="Prognoza sieci LSTM"
              />
              {/* 3. Wzór matematyczny EMA */}
              <Line 
                type="monotone" 
                dataKey="Math_Formula" 
                stroke="#10b981" 
                strokeWidth={2} 
                dot={false}
                name="Wykładnicza Średnia Krocząca (Wzór EMA)"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h4 className="font-bold mb-2 text-sm text-slate-200">Dlaczego warto porównywać AI ze wzorem matematycznym?</h4>
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
            W analizie naukowej sama informacja, że „AI przewiduje” to za mało. Wprowadzenie linii zielonej (<span className="text-emerald-400 font-medium">Wzór EMA</span>) pozwala ocenić wartość dodaną sieci neuronowej. Jeśli linia pomarańczowa (LSTM) lepiej odwzorowuje nagłe załamania trendu na linii niebieskiej niż zwykły deterministyczny algorytm matematyczny, stanowi to dowód na wyższą użyteczność modeli uczonych maszynowo.
          </p>
        </div>
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h4 className="font-bold mb-2 text-sm text-slate-200">Charakterystyka matematyczna wskaźników</h4>
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
            Wskaźnik EMA reaguje z opóźnieniem (lagging indicator), ponieważ oblicza wagę na podstawie okna przeszłego. Sieć LSTM stara się natomiast przewidzieć dynamikę (leading indicator). Zwróć uwagę, że w długim horyzoncie czasowym (rok 2026) oba podejścia ulegną silnemu wypłaszczeniu, co wynika z braku dopływu zmiennych losowych z zewnętrznych rynków finansowych.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIAnalyze;