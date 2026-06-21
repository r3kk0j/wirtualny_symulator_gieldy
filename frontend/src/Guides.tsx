import React from 'react';
import { 
  BookOpen, ShieldCheck, BarChart3, LineChart, 
  ArrowUpRight, FileText, Info, PieChart, Landmark
} from 'lucide-react';

const Guides = () => {
  const guidesData = [
    {
      id: 1,
      title: "Podstawy Inwestowania",
      icon: <Landmark className="text-blue-500 mb-4 group-hover:scale-110 transition-transform" size={32} />,
      color: "hover:border-blue-500/50",
      description: "Zrozumienie różnicy między oszczędzaniem a inwestowaniem. Poznaj pojęcia takie jak inflacja, procent składany oraz dlaczego czas jest Twoim największym sprzymierzeńcem.",
      link: "https://www.gpw.pl/podstawy-inwestowania-na-gieldzie",
      btnText: "Portal GPW"
    },
    {
      id: 2,
      title: "Zarządzanie ryzykiem",
      icon: <ShieldCheck className="text-green-500 mb-4 group-hover:scale-110 transition-transform" size={32} />,
      color: "hover:border-green-500/50",
      description: "Nigdy nie inwestuj więcej, niż możesz stracić. Dowiedz się, jak ustawiać zlecenia Stop-Loss i dlaczego ochrona kapitału jest ważniejsza niż szybki zysk.",
      link: "https://www.gstfi.pl/blog/zarzadzanie-ryzykiem-inwestycyjnym",
      btnText: "Akademia Inwestora"
    },
    {
      id: 3,
      title: "Dywersyfikacja Portfela",
      icon: <PieChart className="text-purple-500 mb-4 group-hover:scale-110 transition-transform" size={32} />,
      color: "hover:border-purple-500/50",
      description: "Nie wkładaj wszystkich jajek do jednego koszyka. Poznaj techniki rozpraszania kapitału pomiędzy różne klasy aktywów, aby zminimalizować zmienność portfela.",
      link: "https://www.ing.pl/indywidualni/inwestycje-i-oszczednosci/nauka-inwestowania/inwestor-poczatkujacy/dywersyfikacja-inwestycji",
      btnText: "Definicja i Metody"
    },
    {
      id: 4,
      title: "Analiza Techniczna",
      icon: <BarChart3 className="text-orange-500 mb-4 group-hover:scale-110 transition-transform" size={32} />,
      color: "hover:border-orange-500/50",
      description: "Nauka czytania wykresów świecowych, rozpoznawania trendów oraz wyznaczania poziomów wsparcia i oporu. Podstawowe narzędzie każdego tradera.",
      link: "https://www.ing.pl/indywidualni/inwestycje-i-oszczednosci/nauka-inwestowania/inwestor-zaawansowany/analiza-techniczna",
      btnText: "Lekcje ING"
    },
    {
      id: 5,
      title: "Psychologia Rynku",
      icon: <LineChart className="text-red-500 mb-4 group-hover:scale-110 transition-transform" size={32} />,
      color: "hover:border-red-500/50",
      description: "Zrozum cykle rynkowe: od euforii po panikę. Dowiedz się, jak unikać pułapek emocjonalnych i dlaczego dyscyplina jest kluczem do sukcesu.",
      link: "https://www.gstfi.pl/blog/psychologia-inwestowania",
      btnText: "Analiza zachowań według GSTFI"
    },
    {
      id: 6,
      title: "Analiza Fundamentalna",
      icon: <FileText className="text-cyan-500 mb-4 group-hover:scale-110 transition-transform" size={32} />,
      color: "hover:border-cyan-500/50",
      description: "Jak oceniać realną wartość aktywa? Poznaj wpływ danych makroekonomicznych, stóp procentowych oraz wiadomości ze świata na wyceny rynkowe.",
      link: "https://www.gpw.pl/analiza-fundamentalna",
      btnText: "Fundamenty Giełdy"
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Baza Wiedzy</h2>
          <p className="text-slate-500 mt-1 font-medium text-sm">Profesjonalne poradniki dotyczące strategii inwestycyjnych w języku polskim</p>
        </div>

      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {guidesData.map((guide) => (
          <div 
            key={guide.id} 
            className={`bg-slate-900 p-8 rounded-[2rem] border border-slate-800 ${guide.color} transition-all duration-300 group flex flex-col justify-between shadow-xl shadow-black/20`}
          >
            <div>
              <div className="flex justify-between items-start">
                {guide.icon}
              </div>
              <h3 className="text-xl font-black mb-3 text-white italic uppercase tracking-tight">{guide.title}</h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-8">
                {guide.description}
              </p>
            </div>

            <a 
              href={guide.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full py-4 bg-slate-950 border border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-white group-hover:bg-blue-600 group-hover:border-blue-500 transition-all"
            >
              {guide.btnText} <ArrowUpRight size={14} />
            </a>
          </div>
        ))}
      </div>

      <div className="bg-slate-900/40 border border-slate-800/50 p-6 rounded-3xl flex items-start gap-4">
        <div className="bg-blue-500/10 p-2 rounded-lg">
          <BookOpen className="text-blue-500 shrink-0" size={20} />
        </div>
        <div className="space-y-1">
          <p className="text-[10px] text-blue-500 font-black uppercase tracking-wider">Nota prawna:</p>
          <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
            Wszystkie materiały edukacyjne (NBP, GPW, XTB) są własnością ich autorów. Kryptowaluty i instrumenty finansowe wiążą się z wysokim ryzykiem kapitałowym.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Guides;