import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Lock, UserPlus, LayoutDashboard, BrainCircuit, TrendingUp, 
  Wallet, RefreshCcw, LogOut, ArrowRight, Newspaper, BookOpen, 
  History as HistoryIcon, Search, Settings as SettingsIcon,
  User, Activity, Globe, Zap
} from 'lucide-react';
import AIAnalyze from './AI_analyze';
import News from './News';
import Guides from './Guides';
import Settings from './Settings';

// Typy danych
interface TradeRecord {
  user: string;
  type: 'KUPNO' | 'SPRZEDAŻ';
  amount: number;
  price: number;
  value: number;
  date: string;
}

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const savedSession = localStorage.getItem('userSession');
    if (savedSession) {
      const { timestamp } = JSON.parse(savedSession);
      if (Date.now() - timestamp < 86400000) return true;
    }
    return false;
  });

  const [isRegistering, setIsRegistering] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [loginData, setLoginData] = useState({ user: '', pass: '' });
  
  const [balances, setBalances] = useState({ usd: 0, btc: 0 });
  const [tradeAmount, setTradeAmount] = useState('');
  const [btcPrice, setBtcPrice] = useState<number>(0);
  
  // Kąt obrotu ikony oraz flaga blokady ponownego kliknięcia w trakcie pobierania
  const [rotation, setRotation] = useState(0);
  const [isFetching, setIsFetching] = useState(false);

  // Referencja do przechowywania identyfikatora timera (umożliwia jego resetowanie)
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [tradeHistory, setTradeHistory] = useState<TradeRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  const currentUser = useMemo(() => {
    const session = localStorage.getItem('userSession');
    if (!session) return 'Trader';
    try {
      const parsed = JSON.parse(session);
      return parsed.username || parsed.user || 'Trader';
    } catch {
      return 'Trader';
    }
  }, [isLoggedIn]);

  const fetchHistory = async () => {
    const sessionStr = localStorage.getItem('userSession');
    if (!sessionStr) return;
    const session = JSON.parse(sessionStr);

    try {
      const res = await fetch('http://127.0.0.1:5000/auth/history', {
        headers: { 'Authorization': `Bearer ${session.token}` }
      });
      const data = await res.json();
      if (res.ok) setTradeHistory(data);
    } catch (e) {
      console.error("Błąd historii:", e);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      const session = JSON.parse(localStorage.getItem('userSession') || '{}');
      setBalances({ usd: session.wallet || 0, btc: session.walletBTC || 0 });
      fetchHistory();
    }
  }, [isLoggedIn]);

  // Główna funkcja pobierania ceny z Binance i planowania kolejnego cyklu
  const fetchBtcPrice = useCallback(async () => {
    // Czyścimy poprzedni zaplanowany timer, aby zapobiec nakładaniu się żądań
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setIsFetching(true);
    setRotation(prev => prev + 360);

    try {
      const res = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
      const data = await res.json();
      if (data && data.price) {
        setBtcPrice(parseFloat(data.price));
      }
    } catch (e) {
      console.error("Binance API Error:", e);
    } finally {
      setIsFetching(false);
      // Rejestrujemy kolejne automatyczne odświeżenie dokładnie za 5 sekund od momentu zakończenia pobierania
      if (isLoggedIn) {
        timerRef.current = setTimeout(fetchBtcPrice, 5000);
      }
    }
  }, [isLoggedIn]);

  // Uruchomienie pierwszego pobrania po zalogowaniu oraz sprzątanie przy odmontowaniu
  useEffect(() => {
    if (isLoggedIn) {
      fetchBtcPrice();
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isLoggedIn, fetchBtcPrice]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = isRegistering ? '/auth/register' : '/auth/login';
    try {
      const response = await fetch(`http://127.0.0.1:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });
      const result = await response.json();
      if (response.ok) {
        if (isRegistering) {
          alert("Konto utworzone!");
          setIsRegistering(false);
        } else {
          localStorage.setItem('userSession', JSON.stringify({ ...result, timestamp: Date.now() }));
          setBalances({ usd: result.wallet, btc: result.walletBTC });
          setIsLoggedIn(true);
        }
      } else { alert(result.message); }
    } catch (error) { alert("Błąd: Uruchom backend!"); }
  };

  const handleTrade = async (type: 'buy' | 'sell') => {
    const sessionStr = localStorage.getItem('userSession');
    if (!sessionStr) return;
    const session = JSON.parse(sessionStr);
    const amount = parseFloat(tradeAmount);
    if (!amount || amount <= 0) return alert("Podaj poprawną ilość BTC");

    try {
      const res = await fetch('http://127.0.0.1:5000/auth/trade', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.token}` 
        },
        body: JSON.stringify({ type, amount, price: btcPrice })
      });
      const data = await res.json();
      if (res.ok) {
        setBalances({ usd: data.wallet, btc: data.walletBTC });
        localStorage.setItem('userSession', JSON.stringify({ ...session, wallet: data.wallet, walletBTC: data.walletBTC }));
        setTradeAmount('');
        fetchHistory();
      } else { alert(data.message); }
    } catch (e) { alert("Błąd transakcji."); }
  };

  const filteredHistory = useMemo(() => {
    return tradeHistory.filter(item => {
      const matchesType = filterType === 'ALL' || item.type === filterType;
      const matchesSearch = item.user.toLowerCase().includes(searchTerm.toLowerCase()) || item.date.includes(searchTerm);
      return matchesType && matchesSearch;
    });
  }, [tradeHistory, filterType, searchTerm]);

  const estimatedCost = (parseFloat(tradeAmount) || 0) * btcPrice;

  const renderContent = () => {
    switch(activeTab) {
      case 'home':
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex justify-between items-end">
              <div>
                <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Rynek Główny</h2>
                <p className="text-slate-500 mt-1">Bieżący stan Twojego portfela inwestycyjnego</p>
              </div>
              <div className="flex gap-4">
                <div className="bg-slate-900 p-4 px-6 rounded-2xl border border-slate-800 flex items-center gap-4">
                  <Wallet className="text-green-500" size={24} />
                  <div><p className="text-[10px] text-slate-500 uppercase font-bold">Saldo USD</p><span className="text-xl font-mono font-bold">${balances.usd.toFixed(2)}</span></div>
                </div>
                <div className="bg-slate-900 p-4 px-6 rounded-2xl border border-slate-800 flex items-center gap-4">
                  <TrendingUp className="text-orange-500" size={24} />
                  <div><p className="text-[10px] text-slate-500 uppercase font-bold">Saldo BTC</p><span className="text-xl font-mono font-bold">{balances.btc.toFixed(8)}</span></div>
                </div>
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden group">
                {/* PRZYCISK: Kliknięcie wykonuje obrót o kolejne 360st i całkowicie resetuje interwał 5 sekund */}
                <button 
                  onClick={fetchBtcPrice}
                  disabled={isFetching}
                  title="Odśwież cenę Bitcoin"
                  className="absolute top-6 right-6 p-2 bg-slate-950/40 border border-slate-800 hover:border-slate-700 rounded-xl transition-all cursor-pointer disabled:opacity-50 text-blue-500 hover:text-blue-400 active:scale-95"
                >
                  <RefreshCcw 
                    size={16} 
                    className="transition-transform duration-700 ease-out"
                    style={{ transform: `rotate(${rotation}deg)` }} 
                  />
                </button>
                
                <h3 className="text-slate-500 font-black uppercase text-[10px] tracking-widest mb-6">Bitcoin (BTC/USDT)</h3>
                <p className="text-5xl font-mono font-black text-white tracking-tighter">${btcPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                
                {/* STAŁY PANEL: Niezmienna zielona kropka i tekst */}
                <div className="mt-6 flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  DANE LIVE: BINANCE API
                </div>
              </div>

              <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 col-span-2 shadow-xl">
                <h3 className="mb-6 font-black text-xl flex items-center gap-3 italic"><TrendingUp className="text-blue-500" /> Wykonaj Zlecenie</h3>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <input 
                      type="number" 
                      value={tradeAmount} 
                      onChange={(e) => setTradeAmount(e.target.value)} 
                      className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none w-full bg-slate-950 p-5 rounded-2xl border border-slate-800 focus:border-blue-600 outline-none text-white font-mono text-2xl" 
                      placeholder="0.00000000" 
                    />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-700 font-black pointer-events-none">BTC</span>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => handleTrade('buy')} className="bg-green-600 px-10 py-5 rounded-2xl font-black hover:bg-green-500 active:scale-95 text-lg transition-all">KUP</button>
                    <button onClick={() => handleTrade('sell')} className="bg-red-600 px-10 py-5 rounded-2xl font-black hover:bg-red-500 active:scale-95 text-lg transition-all">SPRZEDAJ</button>
                  </div>
                </div>
                <div className="mt-4 flex justify-between text-[11px] text-slate-500 font-bold uppercase tracking-widest">
                  <span>Szacowany koszt: <span className="text-blue-500 font-mono">${estimatedCost.toFixed(2)}</span></span>
                  <span>Prowizja: <span className="text-white">0.00%</span></span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-900/50">
                <div className="flex items-center gap-3"><HistoryIcon className="text-blue-500" size={20} /><h3 className="font-black uppercase text-sm tracking-wider">Historia Operacji</h3></div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="relative flex-1 md:w-64">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"><Search size={16} /></span>
                    <input type="text" placeholder="Szukaj..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs focus:border-blue-600 outline-none" />
                  </div>
                  <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs font-bold outline-none focus:border-blue-600">
                    <option value="ALL">WSZYSTKO</option>
                    <option value="KUPNO">KUPNO</option>
                    <option value="SPRZEDAŻ">SPRZEDAŻ</option>
                  </select>
                </div>
              </div>

              <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
                <table className="w-full text-left text-sm relative">
                  <thead className="bg-slate-950/80 sticky top-0 z-10 text-slate-500 uppercase text-[10px] tracking-widest">
                    <tr>
                      <th className="p-5">Użytkownik</th>
                      <th className="p-5">Typ</th>
                      <th className="p-5">Ilość</th>
                      <th className="p-5">Wartość USD</th>
                      <th className="p-5">Kurs</th>
                      <th className="p-5">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredHistory.length > 0 ? (
                      filteredHistory.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/30 transition-colors group">
                          <td className="p-5 font-bold text-slate-300">{row.user}</td>
                          <td className={`p-5 font-black ${row.type === 'KUPNO' ? 'text-green-500' : 'text-red-500'}`}>{row.type}</td>
                          <td className="p-5 font-mono">{row.amount} BTC</td>
                          <td className="p-5 font-mono text-white">${row.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td className="p-5 font-mono text-slate-500">${row.price.toLocaleString()}</td>
                          <td className="p-5 text-slate-500 text-xs">{row.date}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={6} className="p-10 text-center text-slate-600 font-bold uppercase tracking-widest">Brak danych</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case 'ai': return <AIAnalyze />;
      case 'news': return <News />;
      case 'guides': return <Guides />;
      case 'settings': return <Settings />;
      default: return null;
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white p-4 font-sans">
        <form onSubmit={handleAuth} className="p-8 bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md border border-slate-800">
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="bg-blue-600 p-4 rounded-2xl mb-4 shadow-lg shadow-blue-500/20">
              {isRegistering ? <UserPlus size={32} /> : <Lock size={32} />}
            </div>
            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-blue-500">CryptoTerminal</h2>
          </div>
          <div className="space-y-4">
            <input className="w-full p-4 bg-slate-950 rounded-xl border border-slate-800 outline-none focus:border-blue-600" placeholder="Użytkownik" onChange={e => setLoginData({...loginData, user: e.target.value})} required />
            <input type="password" className="w-full p-4 bg-slate-950 rounded-xl border border-slate-800 outline-none focus:border-blue-600" placeholder="Hasło" onChange={e => setLoginData({...loginData, pass: e.target.value})} required />
          </div>
          <button className="w-full bg-blue-600 hover:bg-blue-500 p-4 rounded-xl font-black mt-8 transition-all flex items-center justify-center gap-2">
            {isRegistering ? 'Zarejestruj' : 'Zaloguj'} <ArrowRight size={18} />
          </button>
          <p className="text-center mt-6 text-sm text-slate-500">
            <button type="button" onClick={() => setIsRegistering(!isRegistering)} className="text-blue-500 font-bold hover:underline">
              {isRegistering ? 'Powrót do logowania' : 'Załóż nowe konto'}
            </button>
          </p>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      <nav className="w-72 bg-slate-900 border-r border-slate-800 p-6 flex flex-col fixed h-full shadow-2xl z-50">
        {/* LOGO */}
        <div className="mb-10 flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <TrendingUp size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white italic uppercase tracking-tighter leading-none">Crypto</h1>
            <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">Terminal AI</p>
          </div>
        </div>

        {/* PROFIL UŻYTKOWNIKA */}
        <div className="mb-8 p-4 bg-slate-950/50 rounded-2xl border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-blue-500 border border-slate-700">
            <User size={20} />
          </div>
          <div className="overflow-hidden">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Zalogowany jako</p>
            <p className="text-sm font-black text-white truncate italic">{currentUser}</p>
          </div>
        </div>

        {/* MENU GŁÓWNE */}
        <div className="space-y-1 mb-8">
          <p className="px-4 text-[10px] text-slate-600 font-black uppercase tracking-[0.2em] mb-3">Menu Główne</p>
          {[
            { id: 'home', icon: LayoutDashboard, label: 'Panel głowny' }, 
            { id: 'ai', icon: BrainCircuit, label: 'Analiza AI ' }, 
            { id: 'news', icon: Newspaper, label: 'Nowości z rynku' }, 
            { id: 'guides', icon: BookOpen, label: 'Poradniki' },
            { id: 'settings', icon: SettingsIcon, label: 'Ustawienia' }
          ].map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 p-3.5 rounded-xl font-bold transition-all ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-300'}`}>
              <item.icon size={18} /> {item.label}
            </button>
          ))}
        </div>

        {/* PANEL STATYSTYK RYNKOWYCH */}
        <div className="mt-auto space-y-4">
          <div className="bg-slate-950/50 border border-slate-800 p-5 rounded-2xl space-y-4">
            <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest border-b border-slate-800 pb-2">Dane Systemowe</p>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-slate-400">
                <Globe size={14} className="text-blue-500" />
                <span className="text-[11px] font-bold">Region</span>
              </div>
              <span className="text-[11px] font-mono text-white uppercase">Europe/PL</span>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-slate-400">
                <Zap size={14} className="text-yellow-500" />
                <span className="text-[11px] font-bold">Latency</span>
              </div>
              <span className="text-[11px] font-mono text-green-500">24ms</span>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-slate-400">
                <Activity size={14} className="text-blue-500" />
                <span className="text-[11px] font-bold">Market</span>
              </div>
              <span className="text-[11px] font-mono text-green-500 uppercase tracking-tighter">Open</span>
            </div>
          </div>

          <div className="px-4 py-2 flex flex-col gap-3">
             <button onClick={() => {localStorage.removeItem('userSession'); setIsLoggedIn(false);}} className="flex items-center gap-3 py-2 text-slate-500 hover:text-red-500 font-bold text-xs transition-colors group">
               <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" /> Wyloguj
             </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 ml-72 p-10 overflow-auto bg-slate-950">
        <div className="max-w-6xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;