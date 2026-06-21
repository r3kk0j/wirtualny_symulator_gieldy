import React, { useState } from 'react';
import { ShieldCheck, RefreshCw, Trash2, AlertTriangle, Lock } from 'lucide-react';

const Settings = () => {
  const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [deletePassword, setDeletePassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [delLoading, setDelLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (passwords.newPassword !== passwords.confirmPassword) {
      return setMessage({ type: 'error', text: 'Nowe hasła nie są identyczne' });
    }

    setLoading(true);
    const session = JSON.parse(localStorage.getItem('userSession') || '{}');

    try {
      const res = await fetch('http://127.0.0.1:5000/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.token}`
        },
        body: JSON.stringify({
          oldPassword: passwords.oldPassword,
          newPassword: passwords.newPassword
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Hasło zostało pomyślnie zmienione!' });
        setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Błąd połączenia z serwerem' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!deletePassword) {
      alert("Musisz podać hasło, aby usunąć konto.");
      return;
    }

    if (!window.confirm("CZY NA PEWNO CHCESZ USUNĄĆ KONTO? Te operacji nie da się cofnąć.")) {
      return;
    }

    setDelLoading(true);
    const session = JSON.parse(localStorage.getItem('userSession') || '{}');

    try {
      const res = await fetch('http://127.0.0.1:5000/auth/delete-account', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: deletePassword })
      });

      if (res.ok) {
        localStorage.removeItem('userSession');
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.message);
      }
    } catch (err) {
      alert("Błąd podczas usuwania konta.");
    } finally {
      setDelLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-2xl space-y-8">
      <header>
        <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Ustawienia</h2>
        <p className="text-slate-500 mt-1">Zarządzaj bezpieczeństwem swojego konta</p>
      </header>

      {/* SEKCJA ZMIANY HASŁA */}
      <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl">
        <div className="flex items-center gap-3 mb-8 border-b border-slate-800 pb-4">
          <ShieldCheck className="text-blue-500" size={24} />
          <h3 className="text-xl font-bold text-white">Zmiana hasła</h3>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-6">
          <div>
            <label className="block text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2">Obecne hasło</label>
            <input 
              type="password" 
              required
              className="w-full bg-slate-950 p-4 rounded-xl border border-slate-800 focus:border-blue-600 outline-none text-white transition-all"
              value={passwords.oldPassword}
              onChange={e => setPasswords({...passwords, oldPassword: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2">Nowe hasło</label>
              <input 
                type="password" 
                required
                className="w-full bg-slate-950 p-4 rounded-xl border border-slate-800 focus:border-blue-600 outline-none text-white transition-all"
                value={passwords.newPassword}
                onChange={e => setPasswords({...passwords, newPassword: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2">Potwierdź nowe hasło</label>
              <input 
                type="password" 
                required
                className="w-full bg-slate-950 p-4 rounded-xl border border-slate-800 focus:border-blue-600 outline-none text-white transition-all"
                value={passwords.confirmPassword}
                onChange={e => setPasswords({...passwords, confirmPassword: e.target.value})}
              />
            </div>
          </div>

          {message.text && (
            <div className={`p-4 rounded-xl font-bold text-sm ${message.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
              {message.text}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 p-4 rounded-xl font-black text-white transition-all flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw className="animate-spin" size={20} /> : 'Zaktualizuj Hasło'}
          </button>
        </form>
      </div>

      {/* SEKCJA USUWANIA KONTA */}
      <div className="bg-red-950/10 p-8 rounded-3xl border border-red-900/20 shadow-xl">
        <div className="flex items-center gap-3 mb-4 text-red-500">
          <AlertTriangle size={24} />
          <h3 className="text-xl font-bold italic uppercase"></h3>
        </div>
        <p className="text-slate-400 text-sm mb-6">
          Aby usunąć konto, wprowadź swoje aktualne hasło. Ta operacja jest nieodwracalna.
        </p>
        
        <form onSubmit={handleDeleteAccount} className="space-y-4">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600">
              <Lock size={18} />
            </span>
            <input 
              type="password"
              placeholder="Wpisz hasło profilu"
              required
              className="w-full bg-slate-950 py-4 pl-12 pr-4 rounded-xl border border-red-900/20 focus:border-red-600 outline-none text-white transition-all"
              value={deletePassword}
              onChange={e => setDeletePassword(e.target.value)}
            />
          </div>
          <button 
            type="submit"
            disabled={delLoading}
            className="w-full flex items-center justify-center gap-2 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-600/20 px-6 py-4 rounded-xl font-black transition-all active:scale-95"
          >
            {delLoading ? <RefreshCw className="animate-spin" size={18} /> : <Trash2 size={18} />}
            POTWIERDZAM USUNIĘCIE KONTA
          </button>
        </form>
      </div>
    </div>
  );
};

export default Settings;