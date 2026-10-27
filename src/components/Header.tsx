import React from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, User, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  onOpenProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenProfile }) => {
  const { activeTab, setActiveTab, currentUser } = useApp();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E5E7E2] safe-area-pt shadow-xs">
      <div className="max-w-xl mx-auto px-4 py-3">
        {/* Top row: Brand + User Profile */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo-somos-um.png"
              alt="Somos Um - Espaço Cristão"
              className="h-11 sm:h-12 w-auto max-w-[105px] object-contain shrink-0"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm sm:text-base text-[#111827] tracking-tight">Espaço Cristão</span>
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold text-[#D96B0B] bg-orange-50 rounded-full border border-orange-200">
                  <Sparkles size={10} />
                  Louvor
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-[#6B7280]">Gestão de Escalas & Repertório</p>
            </div>
          </div>

          {/* Quick Profile Access */}
          <button
            onClick={onOpenProfile}
            type="button"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-100 hover:bg-stone-200/80 active:scale-95 transition-all text-xs font-medium text-stone-700 border border-stone-200/70"
            title="Editar meu perfil e instrumentos"
          >
            <div className="w-5 h-5 rounded-full bg-[#D96B0B]/15 text-[#D96B0B] flex items-center justify-center text-[10px] font-bold">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <span className="max-w-[90px] truncate">{currentUser.name.split(' ')[0]}</span>
            <span className="text-[10px] bg-white px-1.5 py-0.5 rounded-full text-stone-500 font-semibold border border-stone-200">
              {currentUser.roles.length}
            </span>
          </button>
        </div>

        {/* View Switcher: Musician vs Pastor */}
        <div className="grid grid-cols-2 p-1 bg-stone-100 rounded-xl border border-stone-200">
          <button
            type="button"
            onClick={() => setActiveTab('musico')}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'musico'
                ? 'bg-white text-[#D96B0B] shadow-xs font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <User size={15} />
            <span>Área do Músico</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pastor')}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'pastor'
                ? 'bg-white text-[#D96B0B] shadow-xs font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <ShieldCheck size={15} />
            <span>Painel do Pastor</span>
          </button>
        </div>
      </div>
    </header>
  );
};
