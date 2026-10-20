import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { X, CalendarDays, Sparkles, Clock } from 'lucide-react';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

const MONTH_OPTIONS = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
];

export const BatchSundaysModal: React.FC<Props> = ({ onClose, onSuccess }) => {
  const { generateMonthSundays, isAdmin } = useApp();

  const [selectedYear, setSelectedYear] = useState<number>(2026);
  // Default to November (11) as requested in the prompt
  const [selectedMonth, setSelectedMonth] = useState<number>(11);
  const [morningTime, setMorningTime] = useState<string>('09:30');
  const [eveningTime, setEveningTime] = useState<string>('19:00');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Calcula os domingos do mês selecionado
  const sundays = useMemo(() => {
    const list: { day: number; dateStr: string; formatted: string }[] = [];
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(selectedYear, selectedMonth - 1, day);
      if (d.getDay() === 0) {
        const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const formatted = `${String(day).padStart(2, '0')}/${String(selectedMonth).padStart(2, '0')}/${selectedYear}`;
        list.push({ day, dateStr, formatted });
      }
    }
    return list;
  }, [selectedYear, selectedMonth]);

  const monthLabel = MONTH_OPTIONS.find((m) => m.value === selectedMonth)?.label || '';

  const handleGenerate = async () => {
    if (!isAdmin) {
      alert('Apenas o Pastor Administrador tem permissão para gerar cultos.');
      return;
    }

    setIsSubmitting(true);
    try {
      await generateMonthSundays(selectedYear, selectedMonth, morningTime, eveningTime);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao gerar cultos de domingo.';
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-stone-50 border-b border-stone-200 p-4 sm:p-5 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <CalendarDays size={20} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-stone-900">
                Gerar Domingos do Mês
              </h3>
              <p className="text-xs text-stone-600">
                Crie todos os domingos de uma vez, com períodos da manhã e da noite.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {/* Seletor de Mês e Ano */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Mês
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-semibold text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              >
                {MONTH_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Ano
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-semibold text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              >
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>
            </div>
          </div>

          {/* Horários Padrão */}
          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
            <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
              <Clock size={14} className="text-amber-700" />
              <span>Horários Padrão dos Domingos</span>
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                  ☀️ Culto da Manhã
                </label>
                <input
                  type="time"
                  required
                  value={morningTime}
                  onChange={(e) => setMorningTime(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-xl px-3 py-1.5 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                  🌙 Culto da Noite
                </label>
                <input
                  type="time"
                  required
                  value={eveningTime}
                  onChange={(e) => setEveningTime(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-xl px-3 py-1.5 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>
            </div>
          </div>

          {/* Lista de Domingos Encontrados */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              Domingos de {monthLabel} de {selectedYear} ({sundays.length} domingos):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto p-1">
              {sundays.map((s, idx) => (
                <div
                  key={s.dateStr}
                  className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/80 text-xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-600 text-white font-bold text-[10px] flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-amber-950">
                      {s.formatted}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-amber-800">
                    Manhã & Noite
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Aviso sobre Culto de Jovens */}
          <div className="p-3 rounded-2xl bg-stone-100 border border-stone-200 text-xs text-stone-700">
            <p className="font-semibold text-stone-900 mb-0.5">
              📌 Cultos de Jovens:
            </p>
            <p className="leading-relaxed text-[11px]">
              Os cultos de jovens devem ser cadastrados apenas nos sábados escolhidos pelo pastor, sem repetição semanal automática, usando o botão <strong>Novo Culto</strong>.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isSubmitting || sundays.length === 0}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs disabled:opacity-50"
            >
              <Sparkles size={16} />
              <span>
                {isSubmitting
                  ? 'Gerando...'
                  : `Criar ${sundays.length * 2} Cultos de Domingo`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
