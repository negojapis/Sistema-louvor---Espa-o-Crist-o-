import React, { useState } from 'react';
import type { Service } from '../types';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  List as ListIcon,
  Clock,
} from 'lucide-react';

interface Props {
  services: Service[];
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
  onOpenServiceDetails?: (service: Service) => void;
}

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const WEEKDAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const CalendarView: React.FC<Props> = ({
  services,
  selectedDate,
  onSelectDate,
  onOpenServiceDetails,
}) => {
  const [currentDate, setCurrentDate] = useState(() => {
    if (selectedDate) return new Date(selectedDate + 'T12:00:00');
    return new Date();
  });

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
      today.getDate()
    ).padStart(2, '0')}`;
    onSelectDate(todayStr);
  };

  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Mapear cultos por data
  const servicesByDate = services.reduce<Record<string, Service[]>>((acc, s) => {
    if (!acc[s.date]) acc[s.date] = [];
    acc[s.date].push(s);
    return acc;
  }, {});

  // Cultos do mês atual para a visualização em lista
  const currentMonthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const monthDatesWithServices = Object.keys(servicesByDate)
    .filter((dateStr) => dateStr.startsWith(currentMonthPrefix))
    .sort();

  const days = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(d);
  }

  const todayStr = (() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(
      2,
      '0'
    )}`;
  })();

  return (
    <div className="bg-white rounded-3xl p-3.5 sm:p-5 border border-stone-200/90 shadow-xs mb-6 overflow-hidden">
      {/* Calendar Header with Navigation and View Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center justify-between sm:justify-start gap-2">
          <div className="flex items-center gap-2">
            <CalendarIcon size={18} className="text-amber-600 shrink-0" />
            <h2 className="text-sm sm:text-base font-bold text-stone-900 capitalize truncate">
              {MONTH_NAMES[month]} {year}
            </h2>
          </div>

          <div className="flex items-center gap-1 sm:hidden">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-600 transition-colors"
              aria-label="Mês anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-600 transition-colors"
              aria-label="Próximo mês"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* View Switcher and Navigation Controls */}
        <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
          {/* Segmented Control: Grade vs Lista por Data */}
          <div className="flex items-center bg-stone-100 p-0.5 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-stone-900 shadow-2xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Visualização em Grade Mensal"
            >
              <CalendarIcon size={14} />
              <span className="text-[11px]">Grade</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-amber-900 shadow-2xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Visualização em Lista por Data"
            >
              <ListIcon size={14} />
              <span className="text-[11px]">Lista de Datas</span>
            </button>
          </div>

          {/* Desktop arrows & Hoje */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleToday}
              className="px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
            >
              Hoje
            </button>
            <div className="hidden sm:flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-600 transition-colors"
                aria-label="Mês anterior"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-600 transition-colors"
                aria-label="Próximo mês"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODE 1: MONTHLY GRID */}
      {viewMode === 'grid' && (
        <div className="animate-in fade-in duration-100">
          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {WEEKDAY_NAMES.map((w, idx) => (
              <span
                key={w}
                className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider ${
                  idx === 0 ? 'text-amber-700' : 'text-stone-600'
                }`}
              >
                {w}
              </span>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="h-9 sm:h-12" />;
              }

              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(
                2,
                '0'
              )}`;
              const isSelected = selectedDate === dateStr;
              const isToday = todayStr === dateStr;
              const dayServices = servicesByDate[dateStr] || [];
              const hasServices = dayServices.length > 0;

              return (
                <button
                  key={dateStr}
                  onClick={() => onSelectDate(isSelected ? null : dateStr)}
                  className={`h-9 sm:h-12 min-h-[36px] rounded-xl flex flex-col items-center justify-center relative transition-all active:scale-95 ${
                    isSelected
                      ? 'bg-amber-600 text-white font-bold shadow-sm'
                      : hasServices
                      ? 'bg-amber-50/90 hover:bg-amber-100 text-stone-900 font-semibold border border-amber-200/70'
                      : isToday
                      ? 'border border-amber-500 font-bold text-amber-800'
                      : 'hover:bg-stone-50 text-stone-700'
                  }`}
                >
                  <span className="text-[11px] sm:text-xs leading-none">{day}</span>

                  {hasServices && (
                    <div className="flex items-center gap-0.5 mt-0.5">
                      {dayServices.slice(0, 3).map((s, i) => (
                        <span
                          key={s.id || i}
                          className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${
                            isSelected
                              ? 'bg-white'
                              : s.status === 'published'
                              ? 'bg-emerald-500'
                              : 'bg-amber-500'
                          }`}
                        />
                      ))}
                      {dayServices.length > 3 && (
                        <span
                          className={`text-[8px] leading-none ${
                            isSelected ? 'text-white' : 'text-amber-800 font-bold'
                          }`}
                        >
                          +
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* MODE 2: LIST BY DATE (Perfect for mobile 360px and 390px) */}
      {viewMode === 'list' && (
        <div className="animate-in fade-in duration-100 space-y-2">
          {monthDatesWithServices.length === 0 ? (
            <p className="text-xs text-stone-700 text-center py-6 italic bg-stone-50 rounded-2xl border border-stone-200/80">
              Nenhum culto agendado para o mês de {MONTH_NAMES[month]} de {year}.
            </p>
          ) : (
            <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
              {monthDatesWithServices.map((dateStr) => {
                const dayServices = servicesByDate[dateStr] || [];
                const isSelected = selectedDate === dateStr;

                // Formatar data em português
                const [y, m, d] = dateStr.split('-').map(Number);
                const dateObj = new Date(y, m - 1, d);
                const weekdayName = dateObj.toLocaleDateString('pt-BR', { weekday: 'long' });

                return (
                  <div
                    key={dateStr}
                    className={`p-3 rounded-2xl border transition-all ${
                      isSelected
                        ? 'bg-amber-50/90 border-amber-300 ring-1 ring-amber-200'
                        : 'bg-stone-50/80 border-stone-200/80 hover:bg-stone-100/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 font-extrabold text-xs flex items-center justify-center shrink-0">
                          {d}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-stone-900 capitalize leading-tight">
                            {weekdayName}, {d} de {MONTH_NAMES[m - 1]}
                          </p>
                          <span className="text-[10px] text-stone-700">
                            {dayServices.length} culto{dayServices.length > 1 ? 's' : ''} nesta data
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => onSelectDate(isSelected ? null : dateStr)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                          isSelected
                            ? 'bg-amber-600 text-white font-bold'
                            : 'bg-white hover:bg-stone-200 text-stone-700 border border-stone-200'
                        }`}
                      >
                        {isSelected ? 'Filtrado' : 'Filtrar'}
                      </button>
                    </div>

                    {/* Services on this date */}
                    <div className="space-y-1.5 pl-2 border-l-2 border-amber-300/80 mt-2">
                      {dayServices.map((svc) => (
                        <div
                          key={svc.id}
                          onClick={() => onOpenServiceDetails && onOpenServiceDetails(svc)}
                          className="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-white/90 cursor-pointer transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-stone-900 truncate">
                              {svc.title}
                            </p>
                            <span className="text-[10px] text-stone-700 flex items-center gap-1 mt-0.5">
                              <Clock size={11} className="text-stone-600" />
                              {svc.time}
                            </span>
                          </div>

                          <div className="shrink-0">
                            {svc.status === 'published' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                                Publicada
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                                Rascunho
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Legend / Filter Feedback */}
      <div className="mt-3 pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between text-xs text-stone-700 gap-2">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Publicada
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Rascunho
          </span>
        </div>

        {selectedDate && (
          <button
            onClick={() => onSelectDate(null)}
            className="text-amber-800 hover:text-amber-900 font-semibold underline text-xs"
          >
            Limpar filtro ({selectedDate})
          </button>
        )}
      </div>
    </div>
  );
};
