import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Service } from '../types';
import { CalendarView } from '../components/CalendarView';
import { ServiceCard } from '../components/ServiceCard';
import { Calendar, Plus } from 'lucide-react';

interface Props {
  onOpenServiceDetails: (service: Service) => void;
  onOpenCreateService: (initialDate?: string | null) => void;
  onOpenScheduleBuilder: (service: Service) => void;
  onOpenSongEditor: (service: Service) => void;
  onEditService: (service: Service) => void;
  onOpenBatchSundays?: () => void;
}

export const ServicesView: React.FC<Props> = ({
  onOpenServiceDetails,
  onOpenCreateService,
  onOpenScheduleBuilder,
  onOpenSongEditor,
  onEditService,
  onOpenBatchSundays,
}) => {
  const { services, isAdmin, isDemoMode, resetDemoData } = useApp();

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');

  const filteredServices = services
    .filter((s) => {
      if (selectedDate && s.date !== selectedDate) return false;
      if (filterStatus === 'published' && s.status !== 'published') return false;
      if (filterStatus === 'draft' && s.status !== 'draft') return false;
      return true;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-6">
      {/* Top Header & New Service CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Calendar size={22} className="text-amber-600" />
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
              Cultos &amp; Escalas
            </h2>
            <span className="text-xs font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full">
              {services.length} cultos
            </span>
          </div>
          <p className="text-xs text-stone-700 mt-1">
            Consulte o calendário mensal, informe disponibilidade e confira o repertório.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              {onOpenBatchSundays && (
                <button
                  onClick={onOpenBatchSundays}
                  className="px-3.5 py-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                >
                  <span>☀️ Gerar Domingos</span>
                </button>
              )}
              <button
                onClick={() => onOpenCreateService(selectedDate)}
                className="px-4 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs active:scale-95"
              >
                <Plus size={16} />
                <span>Novo Culto</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Monthly Interactive Calendar */}
      <CalendarView
        services={services}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        onOpenServiceDetails={onOpenServiceDetails}
      />

      {/* Services List Section */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200/80 pb-3">
          <div>
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wide">
              {selectedDate ? `Cultos na Data (${selectedDate})` : 'Próximos Cultos Cadastrados'}
            </h3>
            {selectedDate && (
              <p className="text-xs text-amber-800">
                Filtro ativo por data.{' '}
                <button
                  onClick={() => setSelectedDate(null)}
                  className="underline font-semibold"
                >
                  Ver todos os cultos
                </button>
              </p>
            )}
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 bg-stone-100/90 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                filterStatus === 'all'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-700 hover:text-stone-900'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterStatus('published')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                filterStatus === 'published'
                  ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                  : 'text-stone-700 hover:text-stone-900'
              }`}
            >
              Publicadas
            </button>
            <button
              onClick={() => setFilterStatus('draft')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                filterStatus === 'draft'
                  ? 'bg-white text-amber-800 shadow-2xs font-bold'
                  : 'text-stone-700 hover:text-stone-900'
              }`}
            >
              Rascunhos
            </button>
          </div>
        </div>

        {/* Empty State */}
        {filteredServices.length === 0 ? (
          <div className="bg-white rounded-3xl border border-stone-200 p-8 text-center max-w-md mx-auto my-6 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-3">
              <Calendar size={24} />
            </div>
            <h4 className="text-base font-bold text-stone-900">Nenhum culto encontrado</h4>
            <p className="text-xs text-stone-700 mt-1">
              {selectedDate
                ? 'Não há cultos agendados para este dia específico.'
                : 'Nenhum culto atende aos filtros selecionados.'}
            </p>
            {selectedDate && (
              <div className="mt-4 flex justify-center gap-2">
                <button
                  onClick={() => setSelectedDate(null)}
                  className="px-3.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold"
                >
                  Limpar Data
                </button>
                {isAdmin && (
                  <button
                    onClick={() => onOpenCreateService(selectedDate)}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold"
                  >
                    + Criar Culto Neste Dia
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onOpenDetails={onOpenServiceDetails}
                onOpenScheduleBuilder={onOpenScheduleBuilder}
                onOpenSongEditor={onOpenSongEditor}
                onEditService={onEditService}
              />
            ))}
          </div>
        )}
      </div>

      {isDemoMode && (
        <div className="pt-4 text-center">
          <button
            onClick={() => {
              if (confirm('Deseja restaurar os dados originais de exemplo do ministério?')) {
                resetDemoData();
              }
            }}
            className="text-xs text-stone-600 hover:text-amber-800 underline transition-colors"
          >
            Restaurar dados de exemplo originais
          </button>
        </div>
      )}
    </div>
  );
};
