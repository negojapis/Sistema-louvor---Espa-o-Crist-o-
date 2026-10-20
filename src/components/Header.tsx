import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Database,
  ChevronDown,
  ShieldCheck,
  User,
  Check,
  Music,
  Info,
} from 'lucide-react';

interface Props {
  onOpenSupabaseModal: () => void;
}

export const Header: React.FC<Props> = ({ onOpenSupabaseModal }) => {
  const {
    currentUser,
    availableUsers,
    switchUser,
    isDemoMode,
    isSupabaseConnected,
    isAdmin,
  } = useApp();

  const [showUserDropdown, setShowUserDropdown] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-stone-200/80 px-4 sm:px-8 py-2.5 sm:py-3.5">
      <div className="max-w-[1720px] 2xl:max-w-[1840px] mx-auto flex items-center justify-between gap-3">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 text-white flex items-center justify-center shadow-xs shadow-amber-200 shrink-0">
            <Music size={18} className="stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-xs sm:text-base md:text-lg font-bold text-stone-900 tracking-tight leading-tight truncate">
                Ministério de Louvor
              </h1>
              {isDemoMode ? (
                <span className="hidden xs:inline-flex items-center gap-1 px-1.5 py-0.2 sm:px-2 sm:py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200/80 shrink-0">
                  <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Demo
                </span>
              ) : isSupabaseConnected ? (
                <span className="hidden xs:inline-flex items-center gap-1 px-1.5 py-0.2 sm:px-2 sm:py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200/80 shrink-0">
                  <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-emerald-500" />
                  Supabase
                </span>
              ) : (
                <span className="hidden xs:inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-stone-200 text-stone-700 shrink-0">
                  Offline
                </span>
              )}
            </div>
            <p className="text-[11px] text-stone-700 hidden sm:block truncate">
              Escalas, disponibilidades e repertório de cultos
            </p>
          </div>
        </div>

        {/* Right Actions: Persona Switcher & Database Setup */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Quick Database / Supabase Setup Button */}
          <button
            onClick={onOpenSupabaseModal}
            title="Configurar Supabase"
            className="p-2 sm:px-3 sm:py-2 min-h-[36px] sm:min-h-[40px] rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 hover:text-stone-900 text-xs font-medium flex items-center gap-1.5 transition-colors shadow-2xs touch-target"
          >
            <Database size={15} className="text-amber-600" />
            <span className="hidden md:inline">Conectar Supabase</span>
          </button>

          {/* User / Persona Selector */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:px-3 sm:py-2 min-h-[36px] sm:min-h-[40px] rounded-xl border border-stone-200/90 bg-white hover:bg-stone-50 transition-all shadow-2xs text-left touch-target"
            >
              <div
                className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                  isAdmin ? 'bg-amber-100 text-amber-800' : 'bg-stone-100 text-stone-700'
                }`}
              >
                {isAdmin ? <ShieldCheck size={14} /> : <User size={14} />}
              </div>
              <div className="text-xs font-semibold text-stone-900 leading-tight flex items-center gap-1">
                <span className="truncate">{currentUser.name.split(' ')[0]}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded font-bold shrink-0 ${
                    isAdmin ? 'bg-amber-100 text-amber-900' : 'bg-stone-100 text-stone-700'
                  }`}
                >
                  {isAdmin ? 'Pastor Admin' : 'Integrante'}
                </span>
              </div>
              <ChevronDown size={13} className="text-stone-700 ml-0.5 shrink-0" />
            </button>

            {/* Dropdown Menu */}
            {showUserDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-72 max-w-[90vw] rounded-2xl bg-white shadow-xl border border-stone-200 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 border-b border-stone-100 mb-1">
                    <p className="text-[11px] uppercase tracking-wider font-semibold text-stone-600 flex items-center gap-1">
                      <Info size={14} /> Alternar Perfil de Teste
                    </p>
                    <p className="text-xs text-stone-700 mt-0.5">
                      Troque de usuário para experimentar as permissões de cada perfil.
                    </p>
                  </div>

                  <div className="space-y-1 max-h-[300px] overflow-y-auto">
                    {availableUsers.map((u) => {
                      const isCurrent = u.id === currentUser.id;
                      const isUAdmin = u.role === 'admin';
                      return (
                        <button
                          key={u.id}
                          onClick={() => {
                            switchUser(u.id);
                            setShowUserDropdown(false);
                          }}
                          className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between transition-colors min-h-[44px] ${
                            isCurrent
                              ? 'bg-amber-50 text-amber-950 font-semibold'
                              : 'hover:bg-stone-50 text-stone-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                                isUAdmin ? 'bg-amber-200 text-amber-900' : 'bg-stone-200 text-stone-700'
                              }`}
                            >
                              {isUAdmin ? 'A' : 'M'}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-stone-900 truncate">{u.name}</p>
                              <p className="text-[10px] text-stone-600 truncate">{u.email}</p>
                            </div>
                          </div>
                          {isCurrent && <Check size={16} className="text-amber-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
