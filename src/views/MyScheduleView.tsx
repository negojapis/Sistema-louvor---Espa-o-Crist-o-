import React from 'react';
import { useApp } from '../context/AppContext';
import type { Service } from '../types';
import {
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  ArrowRight,
} from 'lucide-react';

interface Props {
  onOpenServiceDetails: (service: Service) => void;
}

export const MyScheduleView: React.FC<Props> = ({ onOpenServiceDetails }) => {
  const {
    currentMember,
    currentUser,
    services,
    getMemberAvailability,
    setMemberAvailability,
    getServiceSchedule,
  } = useApp();

  if (!currentMember) {
    return (
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 text-center max-w-lg mx-auto my-6 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-3">
          <Clock size={24} />
        </div>
        <h3 className="text-lg font-bold text-stone-900">Nenhum integrante vinculado</h3>
        <p className="text-xs text-stone-700 mt-1 leading-relaxed">
          O usuário atual (<strong>{currentUser.name}</strong>) ainda não foi associado a um cadastro
          de integrante na equipe.
        </p>
      </div>
    );
  }

  const upcomingServices = [...services].sort((a, b) => a.date.localeCompare(b.date));

  const myAssignments = upcomingServices
    .map((service) => {
      const schedule = getServiceSchedule(service.id);
      const assignment = schedule.find((a) => a.member_id === currentMember.id);
      return assignment ? { service, assignment } : null;
    })
    .filter(Boolean) as { service: Service; assignment: { role_name: string } }[];

  const pendingServices = upcomingServices.filter((s) => {
    const status = getMemberAvailability(s.id, currentMember.id);
    return status === 'pendente';
  });

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-3xl p-4 sm:p-6 text-white shadow-md shadow-amber-900/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-hidden">
        <div className="min-w-0">
          <span className="text-[10px] sm:text-xs uppercase tracking-wider font-bold text-amber-100">
            Painel do Integrante
          </span>
          <h2 className="text-lg sm:text-2xl font-extrabold mt-0.5 tracking-tight truncate">
            Olá, {currentMember.name.split(' ')[0]}!
          </h2>
          <p className="text-xs sm:text-sm text-amber-100 mt-1 break-words">
            Suas funções: <strong>{currentMember.roles.join(', ')}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <div className="bg-white/15 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/20 text-center min-w-[70px]">
            <p className="text-[10px] sm:text-xs text-amber-100 font-medium leading-none">Escalas</p>
            <p className="text-base sm:text-lg font-extrabold mt-1 leading-none">{myAssignments.length}</p>
          </div>
          <div className="bg-white/15 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/20 text-center min-w-[70px]">
            <p className="text-[10px] sm:text-xs text-amber-100 font-medium leading-none">Pendentes</p>
            <p className="text-base sm:text-lg font-extrabold mt-1 leading-none">{pendingServices.length}</p>
          </div>
        </div>
      </div>

      {/* SECTION 1: Onde estou escalado */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <UserCheck size={20} className="text-amber-600" />
          <h3 className="text-base font-bold text-stone-900">Onde Você Está Escalado(a)</h3>
        </div>

        {myAssignments.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200/90 p-6 text-center shadow-xs">
            <p className="text-xs sm:text-sm text-stone-700">
              Você ainda não possui escalas publicadas nos próximos cultos.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {myAssignments.map(({ service, assignment }) => (
              <div
                key={service.id}
                onClick={() => onOpenServiceDetails(service)}
                className="bg-white rounded-3xl border border-amber-300/80 p-4 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-stone-600 mb-2 gap-2">
                    <span className="font-semibold bg-stone-100 px-2.5 py-1 rounded-lg truncate">
                      📅 {service.date} às {service.time}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                      Confirmado
                    </span>
                  </div>

                  <h4 className="font-bold text-stone-900 group-hover:text-amber-800 transition-colors text-sm sm:text-base break-words">
                    {service.title}
                  </h4>
                </div>

                <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] text-stone-600 block">Sua função:</span>
                    <span className="text-xs font-bold text-amber-950 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 inline-block mt-0.5 truncate max-w-full">
                      🎵 {assignment.role_name}
                    </span>
                  </div>

                  <span className="text-xs font-semibold text-stone-600 group-hover:text-amber-800 flex items-center gap-1 shrink-0">
                    Ver músicas <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: Responda sua disponibilidade para os próximos cultos */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={20} className="text-amber-600" />
            <h3 className="text-base font-bold text-stone-900">
              Sua Disponibilidade para Próximos Cultos
            </h3>
          </div>
          <span className="text-xs text-stone-700 hidden sm:inline">Toque para responder</span>
        </div>

        <div className="space-y-2.5">
          {upcomingServices.map((service) => {
            const currentStatus = getMemberAvailability(service.id, currentMember.id);

            return (
              <div
                key={service.id}
                className="bg-white rounded-3xl border border-stone-200/90 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-amber-200 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs text-stone-600 mb-1">
                    <span className="font-semibold">{service.date}</span>
                    <span>·</span>
                    <span>{service.time}</span>
                  </div>
                  <h4 className="font-bold text-stone-900 text-sm break-words">{service.title}</h4>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                  <button
                    onClick={() => setMemberAvailability(service.id, 'disponivel')}
                    className={`flex-1 sm:flex-none px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                      currentStatus === 'disponivel'
                        ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-500/30'
                        : 'bg-stone-100 hover:bg-emerald-50 text-stone-700 hover:text-emerald-700 border border-stone-200'
                    }`}
                  >
                    <CheckCircle2 size={16} />
                    <span>Disponível</span>
                  </button>

                  <button
                    onClick={() => setMemberAvailability(service.id, 'indisponivel')}
                    className={`flex-1 sm:flex-none px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                      currentStatus === 'indisponivel'
                        ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-500/30'
                        : 'bg-stone-100 hover:bg-rose-50 text-stone-700 hover:text-rose-700 border border-stone-200'
                    }`}
                  >
                    <XCircle size={16} />
                    <span>Indisponível</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
