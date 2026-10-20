import React from 'react';
import { Calendar, Users, Database, Sparkles, Send } from 'lucide-react';
import { useApp } from '../context/AppContext';

export type TabType =
  | 'painel-pastor'
  | 'disponibilidade-mensal'
  | 'cultos'
  | 'minha-escala'
  | 'equipe'
  | 'ajuda';

interface Props {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  pendingCount?: number;
}

export const Navigation: React.FC<Props> = ({ activeTab, onChangeTab, pendingCount = 0 }) => {
  const { isAdmin, getServiceConflicts, services } = useApp();

  // Calcula conflitos pendentes no mês atual para o badge do pastor
  const conflictsCount = React.useMemo(() => {
    if (!isAdmin) return 0;
    let count = 0;
    services.forEach((s) => {
      count += getServiceConflicts(s.id).length;
    });
    return count;
  }, [isAdmin, services, getServiceConflicts]);

  const tabs = React.useMemo(() => {
    if (isAdmin) {
      return [
        {
          id: 'painel-pastor' as TabType,
          label: 'Painel do Pastor',
          shortLabel: 'Painel',
          icon: Sparkles,
          badge: conflictsCount > 0 ? `! ${conflictsCount}` : null,
          badgeColor: 'bg-rose-600',
        },
        {
          id: 'cultos' as TabType,
          label: 'Escalas dos Cultos',
          shortLabel: 'Escalas',
          icon: Calendar,
          badge: null,
          badgeColor: 'bg-amber-500',
        },
        {
          id: 'equipe' as TabType,
          label: 'Integrantes da Equipe',
          shortLabel: 'Equipe',
          icon: Users,
          badge: null,
          badgeColor: 'bg-amber-500',
        },
        {
          id: 'ajuda' as TabType,
          label: 'Segurança & RLS',
          shortLabel: 'Banco/RLS',
          icon: Database,
          badge: null,
          badgeColor: 'bg-amber-500',
        },
      ];
    }

    // Para integrantes da equipe: tela simples e direta, sem burocracia ou menus administrativos
    return [
      {
        id: 'disponibilidade-mensal' as TabType,
        label: 'Minha Disponibilidade',
        shortLabel: 'Disponibilidade',
        icon: Send,
        badge: pendingCount > 0 ? `${pendingCount}` : null,
        badgeColor: 'bg-amber-500',
      },
      {
        id: 'cultos' as TabType,
        label: 'Escalas dos Cultos',
        shortLabel: 'Escalas',
        icon: Calendar,
        badge: null,
        badgeColor: 'bg-amber-500',
      },
    ];
  }, [isAdmin, conflictsCount, pendingCount]);

  return (
    <>
      {/* Desktop / Tablet Nav Tabs */}
      <div className="hidden sm:flex border-b border-stone-200/90 bg-white/70 mb-6">
        <div className="max-w-[1720px] 2xl:max-w-[1840px] mx-auto w-full flex items-center gap-1 px-4 sm:px-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onChangeTab(tab.id)}
                className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-xs sm:text-sm transition-all relative ${
                  isActive
                    ? 'border-amber-600 text-amber-900 font-bold bg-amber-50/50'
                    : 'border-transparent text-stone-600 hover:text-stone-900 hover:border-stone-300'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-amber-700' : 'text-stone-500'} />
                <span>{tab.label}</span>
                {tab.badge !== null && (
                  <span
                    className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold text-white leading-none ${
                      tab.badgeColor || 'bg-amber-500'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Fixed Bottom Navigation */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-stone-200/90 shadow-lg px-2 py-1.5 safe-area-pb">
        <div
          className={`grid gap-1 ${
            tabs.length === 5 ? 'grid-cols-5' : 'grid-cols-4'
          }`}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onChangeTab(tab.id)}
                className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all relative active:scale-95 min-h-[44px] ${
                  isActive
                    ? 'text-amber-900 font-bold'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <div className="relative">
                  <Icon
                    size={19}
                    className={isActive ? 'text-amber-700' : 'text-stone-500'}
                  />
                  {tab.badge !== null && (
                    <span
                      className={`absolute -top-1 -right-2.5 px-1 py-0.2 min-w-[14px] text-center rounded-full text-[9px] font-black text-white leading-none shadow-2xs ${
                        tab.badgeColor || 'bg-amber-500'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-0.5 leading-tight truncate max-w-full">
                  {tab.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
