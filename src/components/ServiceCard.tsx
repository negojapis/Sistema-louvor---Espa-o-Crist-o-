import React from 'react';
import type { Service, AvailabilityStatus } from '../types';
import { useApp } from '../context/AppContext';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Users,
  Music,
  Pencil,
  ArrowRight,
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react';

interface Props {
  service: Service;
  onOpenDetails: (service: Service) => void;
  onOpenScheduleBuilder?: (service: Service) => void;
  onOpenSongEditor?: (service: Service) => void;
  onEditService?: (service: Service) => void;
}

export const ServiceCard: React.FC<Props> = ({
  service,
  onOpenDetails,
  onOpenScheduleBuilder,
}) => {
  const {
    isAdmin,
    currentMember,
    getMemberAvailability,
    setMemberAvailability,
    getServiceAvailabilityCounts,
    getServiceSchedule,
    getServiceSongs,
  } = useApp();

  const myAvailability: AvailabilityStatus = currentMember
    ? getMemberAvailability(service.id, currentMember.id)
    : 'pendente';

  const availabilityCounts = getServiceAvailabilityCounts(service.id);
  const schedule = getServiceSchedule(service.id);
  const songs = getServiceSongs(service.id);

  const myAssignment = currentMember
    ? schedule.find((a) => a.member_id === currentMember.id)
    : undefined;

  const formattedDate = (() => {
    try {
      const [year, month, day] = service.date.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      const weekday = d.toLocaleDateString('pt-BR', { weekday: 'short' });
      const monthName = d.toLocaleDateString('pt-BR', { month: 'long' });
      return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)}, ${day} de ${
        monthName.charAt(0).toUpperCase() + monthName.slice(1)
      }`;
    } catch {
      return service.date;
    }
  })();

  const isPublished = service.status === 'published';

  return (
    <div className="bg-white rounded-3xl border border-stone-200/90 hover:border-amber-300/80 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group overflow-hidden">
      <div>
        {/* Top Meta */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-stone-600">
            <span className="inline-flex items-center gap-1 bg-stone-100 text-stone-700 px-2.5 py-1 rounded-lg">
              <Calendar size={13} className="text-amber-600 shrink-0" />
              <span className="truncate">{formattedDate}</span>
            </span>
            {service.service_type === 'domingo_manha' || service.time <= '12:00' ? (
              <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-950 font-bold px-2 py-0.5 rounded-lg border border-amber-300/80">
                <Sun size={12} className="text-amber-600" />
                Manhã • {service.time}
              </span>
            ) : service.service_type === 'domingo_noite' || (service.time > '12:00' && service.service_type !== 'sabado_jovens') ? (
              <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-950 font-bold px-2 py-0.5 rounded-lg border border-indigo-300/80">
                <Moon size={12} className="text-indigo-600" />
                Noite • {service.time}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-950 font-bold px-2 py-0.5 rounded-lg border border-purple-300/80">
                <Sparkles size={12} className="text-purple-600" />
                Jovens • {service.time}
              </span>
            )}
          </div>

          <div className="shrink-0">
            {isPublished ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Publicada
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Rascunho
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <h3
          onClick={() => onOpenDetails(service)}
          className="text-base sm:text-lg font-bold text-stone-900 group-hover:text-amber-800 transition-colors cursor-pointer mb-1 leading-snug break-words"
        >
          {service.title}
        </h3>

        {service.notes && (
          <p className="text-xs text-stone-700 line-clamp-2 break-words mb-3">{service.notes}</p>
        )}

        {/* Highlight if current member is scheduled */}
        {isPublished && myAssignment && (
          <div className="mt-2 mb-3 p-2.5 rounded-2xl bg-gradient-to-r from-amber-50 to-amber-100/60 border border-amber-200/80 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-amber-600 text-white flex items-center justify-center text-xs font-bold shadow-2xs shrink-0">
                ✓
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-amber-800 font-medium leading-none">Você está escalado(a):</p>
                <p className="text-xs font-bold text-amber-950 mt-0.5 truncate">{myAssignment.role_name}</p>
              </div>
            </div>
            <span className="text-[10px] text-amber-700 font-semibold bg-white/80 px-2 py-0.5 rounded-md border border-amber-200/50 shrink-0">
              Confirmado
            </span>
          </div>
        )}

        {/* Preview counts */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-stone-600 my-2">
          {isPublished || isAdmin ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-stone-50 rounded-lg border border-stone-200/60">
              <Users size={13} className="text-stone-600 shrink-0" />
              <span>
                {schedule.length > 0
                  ? `${schedule.length} integrante${schedule.length > 1 ? 's' : ''}`
                  : 'Nenhum escalado'}
              </span>
            </span>
          ) : (
            <span className="text-xs text-stone-700 italic">Escala em elaboração</span>
          )}

          {(isPublished || isAdmin) && songs.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-stone-50 rounded-lg border border-stone-200/60">
              <Music size={13} className="text-amber-600 shrink-0" />
              <span>{songs.length} música{songs.length > 1 ? 's' : ''}</span>
            </span>
          )}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="mt-3 pt-3 border-t border-stone-100 space-y-2">
        {/* Apenas integrantes da equipe informam disponibilidade individual. O pastor não precisa de disponibilidade */}
        {currentMember && !isAdmin && (
          <div className="flex items-center justify-between bg-stone-50/80 p-2 rounded-2xl border border-stone-200/60 gap-2">
            <span className="text-xs text-stone-700 font-medium truncate">Sua disponibilidade:</span>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMemberAvailability(service.id, 'disponivel');
                }}
                title="Marcar Disponível"
                className={`px-2.5 py-1.5 min-h-[36px] rounded-xl text-xs font-semibold flex items-center gap-1 transition-all active:scale-95 ${
                  myAvailability === 'disponivel'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white hover:bg-emerald-50 text-stone-700 hover:text-emerald-700 border border-stone-200'
                }`}
              >
                <CheckCircle2 size={14} />
                <span>Sim</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMemberAvailability(service.id, 'indisponivel');
                }}
                title="Marcar Indisponível"
                className={`px-2.5 py-1.5 min-h-[36px] rounded-xl text-xs font-semibold flex items-center gap-1 transition-all active:scale-95 ${
                  myAvailability === 'indisponivel'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white hover:bg-rose-50 text-stone-700 hover:text-rose-700 border border-stone-200'
                }`}
              >
                <XCircle size={14} />
                <span>Não</span>
              </button>
            </div>
          </div>
        )}

        {/* Visão do Pastor: Escala da Equipe e Disponíveis */}
        {isAdmin && (
          <div className="p-2.5 rounded-2xl bg-amber-50/70 border border-amber-200/70 flex items-center justify-between text-xs">
            <div className="min-w-0">
              <span className="font-extrabold text-stone-900 block truncate">
                {schedule.length > 0
                  ? `Escala: ${schedule.length} integrante(s)`
                  : 'Escala da equipe pendente'}
              </span>
              <span className="text-[11px] text-amber-900 font-semibold">
                {availabilityCounts.disponiveis} disponíveis para escalar
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0 text-[11px] font-bold">
              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800" title="Disponíveis na equipe">
                ✓ {availabilityCounts.disponiveis}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800" title="Indisponíveis na equipe">
                ✕ {availabilityCounts.indisponiveis}
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            onClick={() => onOpenDetails(service)}
            className="flex-1 py-2.5 px-3 min-h-[44px] rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs active:scale-[0.98]"
          >
            <span>Ver Escala da Equipe</span>
            <ArrowRight size={14} className="text-stone-400 shrink-0" />
          </button>

          {isAdmin && onOpenScheduleBuilder && (
            <button
              onClick={() => onOpenScheduleBuilder(service)}
              className="py-2.5 px-3 min-h-[44px] rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold flex items-center justify-center gap-1 transition-colors active:scale-[0.98] shrink-0"
              title="Montar ou Editar Escala"
            >
              <Pencil size={14} className="text-amber-700" />
              <span className="hidden sm:inline">Escalar</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
