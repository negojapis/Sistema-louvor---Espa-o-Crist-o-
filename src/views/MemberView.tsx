import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  getCurrentMonthKey,
  getSundaysOfMonth,
  formatSundayDate,
  generateMonthOptions,
} from '../utils/dateUtils';
import type { AvailabilityStatus, Member } from '../types';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Edit3,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Send,
  Info,
  Sun,
  Moon,
  Sparkles,
  Users,
  Music2,
  ExternalLink,
  CalendarCheck,
} from 'lucide-react';

interface MemberViewProps {
  onOpenProfile: () => void;
}

export const MemberView: React.FC<MemberViewProps> = ({ onOpenProfile }) => {
  const {
    currentUser,
    services,
    availabilities,
    members,
    assignments,
    setlistSongs,
    submitBatchAvailability,
  } = useApp();

  // Aba ativa na Área do Músico: 'minha_disponibilidade' ou 'escalas_equipe'
  const [memberTab, setMemberTab] = useState<'minha_disponibilidade' | 'escalas_equipe'>('minha_disponibilidade');

  // Mês selecionado no calendário
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(() => getCurrentMonthKey());
  const monthOptions = useMemo(() => generateMonthOptions(selectedMonthKey, 3), [selectedMonthKey]);

  // Estado local para edições pendentes antes do envio
  const [localAvailabilities, setLocalAvailabilities] = useState<Record<string, AvailabilityStatus>>({});
  const [isSent, setIsSent] = useState(false);

  // Controle de cards expandidos na visão de disponibilidade
  const [expandedServiceIds, setExpandedServiceIds] = useState<Record<string, boolean>>({});

  const toggleExpandService = (serviceId: string) => {
    setExpandedServiceIds((prev) => ({
      ...prev,
      [serviceId]: !prev[serviceId],
    }));
  };

  // Parse do ano e mês selecionado
  const [year, month] = useMemo(() => {
    const [y, m] = selectedMonthKey.split('-').map(Number);
    return [y, m];
  }, [selectedMonthKey]);

  // Lista estrita de apenas os domingos do mês selecionado
  const sundays = useMemo(() => getSundaysOfMonth(year, month), [year, month]);

  // Cultos correspondentes aos domingos deste mês
  const monthServices = useMemo(() => {
    return services.filter((s) => s.date.startsWith(selectedMonthKey));
  }, [services, selectedMonthKey]);

  // Obtém o status atual de um culto (local ou salvo)
  const getServiceStatus = (serviceId: string): AvailabilityStatus => {
    if (localAvailabilities[serviceId] !== undefined) {
      return localAvailabilities[serviceId];
    }
    const found = availabilities.find(
      (a) => a.serviceId === serviceId && a.memberId === currentUser.id
    );
    return found ? found.status : 'pendente';
  };

  const handleToggle = (serviceId: string, status: AvailabilityStatus) => {
    setIsSent(false);
    setLocalAvailabilities((prev) => ({
      ...prev,
      [serviceId]: prev[serviceId] === status ? 'pendente' : status,
    }));
  };

  // Enviar para o painel do pastor
  const handleSubmitAll = () => {
    const batchItems: { serviceId: string; status: AvailabilityStatus }[] = [];

    monthServices.forEach((s) => {
      const status = getServiceStatus(s.id);
      batchItems.push({ serviceId: s.id, status });
    });

    submitBatchAvailability(batchItems, currentUser.id);
    setIsSent(true);

    if (window.navigator?.vibrate) {
      window.navigator.vibrate([40, 60, 40]);
    }
  };

  // Navegação entre meses
  const handlePrevMonth = () => {
    const prevDate = new Date(year, month - 2, 1);
    const y = prevDate.getFullYear();
    const m = String(prevDate.getMonth() + 1).padStart(2, '0');
    setSelectedMonthKey(`${y}-${m}`);
    setIsSent(false);
  };

  const handleNextMonth = () => {
    const nextDate = new Date(year, month, 1);
    const y = nextDate.getFullYear();
    const m = String(nextDate.getMonth() + 1).padStart(2, '0');
    setSelectedMonthKey(`${y}-${m}`);
    setIsSent(false);
  };

  // Auxiliar para obter a equipe de um culto
  const getServiceTeamDetails = (serviceId: string) => {
    const serviceAssignments = assignments
      .filter((a) => a.serviceId === serviceId)
      .map((a) => ({
        ...a,
        member: members.find((m) => m.id === a.memberId),
      }));

    const disp: Member[] = [];
    const indisp: Member[] = [];
    const pend: Member[] = [];

    members.forEach((m) => {
      const av = availabilities.find((a) => a.serviceId === serviceId && a.memberId === m.id);
      if (!av || av.status === 'pendente') {
        pend.push(m);
      } else if (av.status === 'disponivel') {
        disp.push(m);
      } else {
        indisp.push(m);
      }
    });

    const songs = setlistSongs
      .filter((s) => s.serviceId === serviceId)
      .sort((a, b) => a.order - b.order);

    return {
      serviceAssignments,
      disp,
      indisp,
      pend,
      songs,
    };
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-4 space-y-4">
      {/* 1. Saudação + Funções do Músico (Clean & Personalizado) */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/80 shadow-xs">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#D96B0B] uppercase tracking-wider mb-0.5">
              <Sparkles size={13} />
              Portal do Integrante
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
              Bem-vindo(a), {currentUser.name.split(' ')[0]}!
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Informe seus domingos disponíveis e veja a escala da equipe.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenProfile}
            className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200/70 text-stone-600 transition-colors flex items-center gap-1 text-xs font-medium"
            title="Alterar meus instrumentos ou dados"
          >
            <Edit3 size={15} />
            <span className="hidden sm:inline">Editar</span>
          </button>
        </div>

        {/* Funções que o usuário exerce */}
        <div className="mt-3.5 pt-3 border-t border-stone-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-stone-500">Minhas Funções:</span>
            {currentUser.roles.map((role) => (
              <span
                key={role}
                className="px-2.5 py-1 bg-orange-50 text-[#D96B0B] border border-orange-200/70 rounded-full text-xs font-semibold"
              >
                {role}
              </span>
            ))}
          </div>

          <button
            type="button"
            onClick={onOpenProfile}
            className="text-xs text-[#D96B0B] hover:underline font-medium"
          >
            + Alterar meus instrumentos
          </button>
        </div>
      </div>

      {/* 2. Abas da Área do Usuário: "Marcar Disponibilidade" vs "Ver Escalas & Equipe" */}
      <div className="grid grid-cols-2 p-1 bg-stone-100 rounded-xl border border-stone-200">
        <button
          type="button"
          onClick={() => setMemberTab('minha_disponibilidade')}
          className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            memberTab === 'minha_disponibilidade'
              ? 'bg-white text-[#D96B0B] shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <CalendarCheck size={14} />
          <span>Marcar Disponibilidade</span>
        </button>

        <button
          type="button"
          onClick={() => setMemberTab('escalas_equipe')}
          className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            memberTab === 'escalas_equipe'
              ? 'bg-white text-[#D96B0B] shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Users size={14} />
          <span>Ver Escalas & Equipe</span>
        </button>
      </div>

      {/* 3. Navegador de Mês (Apenas os Domingos do Mês) */}
      <div className="bg-white rounded-2xl p-3 border border-stone-200/80 shadow-xs flex items-center justify-between">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
          title="Mês anterior"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-[#D96B0B]" />
          <select
            value={selectedMonthKey}
            onChange={(e) => {
              setSelectedMonthKey(e.target.value);
              setIsSent(false);
            }}
            className="bg-transparent font-bold text-sm text-stone-900 cursor-pointer outline-none border-b border-dashed border-stone-300 pb-0.5"
          >
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={handleNextMonth}
          className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
          title="Próximo mês"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* ========================================================================= */}
      {/* ABA 1: MARCAR MINHA DISPONIBILIDADE (Clean, Rápido e com Expansão de Equipe) */}
      {/* ========================================================================= */}
      {memberTab === 'minha_disponibilidade' && (
        <div className="space-y-4">
          {/* Aviso sobre escolha do pastor */}
          <div className="bg-amber-50/70 border border-amber-200/70 rounded-2xl p-3.5 flex items-start gap-3 text-amber-900">
            <Info size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <span className="font-bold">Como funciona a escala:</span> Escolha abaixo os domingos e períodos que você pode servir. 
              Caso toque mais de um instrumento, <strong>o pastor definirá qual instrumento você tocará</strong> em cada culto.
            </div>
          </div>

          {/* Lista dos Domingos do Mês */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Domingos de {monthOptions.find((m) => m.value === selectedMonthKey)?.label || selectedMonthKey}
              </h2>
              <span className="text-xs text-stone-400">
                {sundays.length} domingos no mês
              </span>
            </div>

            {sundays.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center text-stone-400 text-sm border border-stone-200">
                Nenhum domingo localizado para este mês.
              </div>
            ) : (
              sundays.map((dateStr) => {
                const formattedDate = formatSundayDate(dateStr);
                const manhaService = monthServices.find((s) => s.date === dateStr && s.period === 'manha');
                const noiteService = monthServices.find((s) => s.date === dateStr && s.period === 'noite');

                const manhaStatus = manhaService ? getServiceStatus(manhaService.id) : 'pendente';
                const noiteStatus = noiteService ? getServiceStatus(noiteService.id) : 'pendente';

                return (
                  <div
                    key={dateStr}
                    className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-xs hover:border-stone-300 transition-all"
                  >
                    {/* Header do Domingo */}
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-100">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#D96B0B]" />
                        <span className="font-bold text-sm text-stone-900">{formattedDate}</span>
                      </div>
                    </div>

                    {/* Grid dos dois períodos: Manhã (09:30) e Noite (19:00) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Culto Manhã */}
                      {manhaService && (
                        <ServiceCardWithDetails
                          service={manhaService}
                          periodName="Manhã"
                          periodTime="09:30"
                          periodIcon={<Sun size={15} className="text-amber-500" />}
                          status={manhaStatus}
                          onToggle={handleToggle}
                          isExpanded={!!expandedServiceIds[manhaService.id]}
                          onToggleExpand={() => toggleExpandService(manhaService.id)}
                          teamDetails={getServiceTeamDetails(manhaService.id)}
                          currentUserId={currentUser.id}
                        />
                      )}

                      {/* Culto Noite */}
                      {noiteService && (
                        <ServiceCardWithDetails
                          service={noiteService}
                          periodName="Noite"
                          periodTime="19:00"
                          periodIcon={<Moon size={15} className="text-indigo-500" />}
                          status={noiteStatus}
                          onToggle={handleToggle}
                          isExpanded={!!expandedServiceIds[noiteService.id]}
                          onToggleExpand={() => toggleExpandService(noiteService.id)}
                          teamDetails={getServiceTeamDetails(noiteService.id)}
                          currentUserId={currentUser.id}
                        />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Botão de Envio para o Pastor */}
          <div className="sticky bottom-4 z-20 pt-2 safe-area-pb">
            <button
              type="button"
              onClick={handleSubmitAll}
              className={`w-full py-4 px-5 rounded-2xl text-sm font-bold text-white transition-all shadow-lg active:scale-98 flex items-center justify-center gap-2.5 ${
                isSent
                  ? 'bg-emerald-600 shadow-emerald-500/25 ring-4 ring-emerald-100'
                  : 'bg-[#D96B0B] hover:bg-[#B85505] shadow-orange-500/30'
              }`}
            >
              {isSent ? (
                <>
                  <CheckCircle2 size={20} />
                  <span>✓ Disponibilidade Enviada ao Pastor!</span>
                </>
              ) : (
                <>
                  <Send size={18} />
                  <span>Enviar Minha Disponibilidade ao Pastor</span>
                </>
              )}
            </button>
            {isSent && (
              <p className="text-center text-xs text-emerald-700 font-medium mt-2 animate-in fade-in">
                Suas respostas já foram atualizadas no painel do pastor em tempo real!
              </p>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: VER ESCALAS & DISPONIBILIDADE DA EQUIPE (Visão Completa dos Usuários) */}
      {/* ========================================================================= */}
      {memberTab === 'escalas_equipe' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-200 flex items-center justify-between text-xs text-stone-600">
            <span className="flex items-center gap-1.5 font-medium">
              <Users size={16} className="text-[#D96B0B]" />
              Visualização geral da equipe e escalas do mês
            </span>
            <span className="font-bold text-stone-900">
              {monthServices.length} cultos no mês
            </span>
          </div>

          {monthServices.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-stone-400 text-sm border border-stone-200">
              Nenhum culto programado para este mês.
            </div>
          ) : (
            monthServices.map((service) => {
              const formattedDate = formatSundayDate(service.date);
              const { serviceAssignments, disp, indisp, pend, songs } = getServiceTeamDetails(service.id);
              const myAssignment = serviceAssignments.find((a) => a.memberId === currentUser.id);

              return (
                <div
                  key={service.id}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/90 shadow-xs space-y-3.5"
                >
                  {/* Cabeçalho do Culto */}
                  <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                    <div>
                      <div className="flex items-center gap-2">
                        {service.period === 'manha' ? (
                          <Sun size={16} className="text-amber-500" />
                        ) : (
                          <Moon size={16} className="text-indigo-500" />
                        )}
                        <span className="font-extrabold text-sm sm:text-base text-stone-900">
                          {service.title} — {service.time}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 mt-0.5">{formattedDate}</p>
                    </div>

                    {service.status === 'published' ? (
                      <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold border border-emerald-200">
                        Publicado
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 bg-stone-100 text-stone-600 rounded-full text-[10px] font-semibold border border-stone-200">
                        Rascunho
                      </span>
                    )}
                  </div>

                  {/* Banner de Destaque se o Músico estiver escalado */}
                  {myAssignment && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between text-amber-900 animate-in fade-in">
                      <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-[#D96B0B]" />
                        <span className="text-xs font-bold">
                          Você está escalado(a) neste culto!
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 bg-[#D96B0B] text-white rounded-full text-xs font-extrabold">
                        {myAssignment.role}
                      </span>
                    </div>
                  )}

                  {/* 1. Escala Oficial da Equipe */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2 flex items-center gap-1.5">
                      <Users size={14} className="text-[#D96B0B]" />
                      Escala Oficial ({serviceAssignments.length} escalados)
                    </h3>

                    {serviceAssignments.length === 0 ? (
                      <p className="text-xs text-stone-400 italic py-1">
                        O pastor ainda não definiu a escala para este culto.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {serviceAssignments.map((item) => (
                          <div
                            key={item.memberId}
                            className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                              item.memberId === currentUser.id
                                ? 'bg-orange-50/70 border-orange-200 font-bold'
                                : 'bg-stone-50 border-stone-200'
                            }`}
                          >
                            <span className="text-stone-800 truncate mr-2">
                              {item.member?.name || 'A definir'}
                            </span>
                            <span className="px-2 py-0.5 bg-white text-[#D96B0B] border border-orange-200 rounded-md text-[11px] font-bold shrink-0">
                              {item.role}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 2. Músicas do Culto (Setlist) */}
                  {songs.length > 0 && (
                    <div className="pt-2 border-t border-stone-100">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2 flex items-center gap-1.5">
                        <Music2 size={14} className="text-[#D96B0B]" />
                        Músicas do Culto ({songs.length})
                      </h3>
                      <div className="space-y-1.5">
                        {songs.map((song, idx) => (
                          <div
                            key={song.id}
                            className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-orange-100 text-[#D96B0B] text-[10px] font-black flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <div>
                                <span className="text-xs font-bold text-stone-900 mr-2">
                                  {song.title}
                                </span>
                                <span className="text-[11px] text-stone-500">
                                  • {song.artist}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-extrabold">
                                Tom: {song.tone}
                              </span>
                              {song.link && (
                                <a
                                  href={song.link}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1 text-stone-400 hover:text-stone-900 rounded-md hover:bg-stone-200"
                                  title="Abrir cifra ou vídeo"
                                >
                                  <ExternalLink size={13} />
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3. Disponibilidade de Todos os Membros */}
                  <div className="pt-2 border-t border-stone-100 space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                      <Users size={14} className="text-stone-400" />
                      Disponibilidade dos Integrantes
                    </h3>

                    {/* Quem pode (Disponíveis) */}
                    <div>
                      <div className="text-[11px] font-bold text-emerald-800 bg-emerald-50/80 px-2.5 py-1 rounded-lg flex items-center justify-between mb-1.5">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 size={12} className="text-emerald-600" />
                          Podem servir ({disp.length}):
                        </span>
                      </div>
                      {disp.length === 0 ? (
                        <p className="text-xs text-stone-400 italic px-2">Ninguém disponível ainda.</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 px-1">
                          {disp.map((m) => (
                            <span
                              key={m.id}
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 ${
                                m.id === currentUser.id
                                  ? 'bg-emerald-100 border-emerald-300 text-emerald-900 font-bold'
                                  : 'bg-stone-50 border-stone-200 text-stone-700'
                              }`}
                            >
                              <span>{m.name}</span>
                              <span className="text-[10px] text-stone-400">
                                ({m.roles.join(', ')})
                              </span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Quem não pode */}
                    {indisp.length > 0 && (
                      <div className="pt-1">
                        <div className="text-[11px] font-bold text-rose-800 bg-rose-50/80 px-2.5 py-1 rounded-lg flex items-center gap-1 mb-1">
                          <XCircle size={12} className="text-rose-600" />
                          Não podem ({indisp.length}):
                        </div>
                        <div className="flex flex-wrap gap-1 px-1">
                          {indisp.map((m) => (
                            <span
                              key={m.id}
                              className="text-xs text-stone-500 bg-stone-50 px-2 py-0.5 rounded-md border border-stone-200/70"
                            >
                              {m.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quem ainda não respondeu */}
                    {pend.length > 0 && (
                      <div className="pt-1">
                        <div className="text-[11px] font-bold text-stone-600 bg-stone-100 px-2.5 py-1 rounded-lg flex items-center gap-1 mb-1">
                          <HelpCircle size={12} className="text-stone-400" />
                          Ainda não responderam ({pend.length}):
                        </div>
                        <div className="flex flex-wrap gap-1 px-1">
                          {pend.map((m) => (
                            <span
                              key={m.id}
                              className="text-xs text-stone-500 bg-stone-50 px-2 py-0.5 rounded-md border border-stone-200/50"
                            >
                              {m.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

// Componente auxiliar para os cards de serviço com detalhe expansível
interface ServiceCardWithDetailsProps {
  service: { id: string; title: string; time: string };
  periodName: string;
  periodTime: string;
  periodIcon: React.ReactNode;
  status: AvailabilityStatus;
  onToggle: (serviceId: string, status: AvailabilityStatus) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  teamDetails: {
    serviceAssignments: { memberId: string; role: string; member?: Member }[];
    disp: Member[];
    indisp: Member[];
    pend: Member[];
    songs: { id: string; title: string; tone: string; artist: string }[];
  };
  currentUserId: string;
}

const ServiceCardWithDetails: React.FC<ServiceCardWithDetailsProps> = ({
  service,
  periodName,
  periodTime,
  periodIcon,
  status,
  onToggle,
  isExpanded,
  onToggleExpand,
  teamDetails,
  currentUserId,
}) => {
  const { serviceAssignments, disp, indisp, songs } = teamDetails;
  const myAssignment = serviceAssignments.find((a) => a.memberId === currentUserId);

  return (
    <div className="bg-stone-50/80 rounded-xl p-3 border border-stone-200/60 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            {periodIcon}
            <span className="text-xs font-bold text-stone-800">{periodName}</span>
            <span className="text-[11px] text-stone-400 font-medium">{periodTime}</span>
          </div>

          {status === 'disponivel' && (
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              Disponível
            </span>
          )}
          {status === 'indisponivel' && (
            <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
              Não posso
            </span>
          )}
          {status === 'pendente' && (
            <span className="text-[10px] font-medium text-stone-400 flex items-center gap-0.5">
              <HelpCircle size={11} /> Pendente
            </span>
          )}
        </div>

        {/* Botões Posso / Não Posso */}
        <div className="grid grid-cols-2 gap-2 mb-2.5">
          <button
            type="button"
            onClick={() => onToggle(service.id, 'disponivel')}
            className={`py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              status === 'disponivel'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white hover:bg-emerald-50 text-stone-700 border border-stone-200'
            }`}
          >
            <CheckCircle2 size={14} />
            Posso
          </button>
          <button
            type="button"
            onClick={() => onToggle(service.id, 'indisponivel')}
            className={`py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              status === 'indisponivel'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white hover:bg-rose-50 text-stone-700 border border-stone-200'
            }`}
          >
            <XCircle size={14} />
            Não posso
          </button>
        </div>

        {/* Badge se já estiver escalado */}
        {myAssignment && (
          <div className="mb-2 p-1.5 bg-amber-100/70 border border-amber-300 rounded-lg text-[11px] text-amber-900 font-bold flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Sparkles size={12} className="text-[#D96B0B]" /> Escalado:
            </span>
            <span className="px-1.5 py-0.2 bg-[#D96B0B] text-white rounded text-[10px]">
              {myAssignment.role}
            </span>
          </div>
        )}
      </div>

      {/* Botão expansível para ver detalhes da equipe */}
      <div className="pt-1.5 border-t border-stone-200/50">
        <button
          type="button"
          onClick={onToggleExpand}
          className="w-full py-1.5 px-2 rounded-lg bg-white hover:bg-stone-100 border border-stone-200/80 text-[11px] font-semibold text-stone-600 flex items-center justify-between transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Users size={12} className="text-[#D96B0B]" />
            <span>
              {serviceAssignments.length} escalados • {disp.length} disponíveis
            </span>
          </span>
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {/* Gaveta Expansível com Detalhes */}
        {isExpanded && (
          <div className="mt-2 p-2.5 bg-white rounded-xl border border-stone-200 text-xs space-y-2 animate-in fade-in duration-150">
            {/* Escala */}
            <div>
              <span className="font-bold text-[10px] text-stone-400 uppercase tracking-wider block mb-1">
                Escala do Culto:
              </span>
              {serviceAssignments.length === 0 ? (
                <span className="text-[11px] text-stone-400 italic">Nenhum integrante escalado ainda.</span>
              ) : (
                <div className="space-y-1">
                  {serviceAssignments.map((a) => (
                    <div key={a.memberId} className="flex items-center justify-between text-[11px]">
                      <span className="text-stone-700">{a.member?.name}</span>
                      <span className="font-bold text-[#D96B0B] bg-orange-50 px-1.5 rounded">
                        {a.role}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Músicas */}
            {songs.length > 0 && (
              <div className="pt-1.5 border-t border-stone-100">
                <span className="font-bold text-[10px] text-stone-400 uppercase tracking-wider block mb-1">
                  Músicas ({songs.length}):
                </span>
                <div className="space-y-0.5">
                  {songs.map((s) => (
                    <div key={s.id} className="text-[11px] text-stone-700 flex justify-between">
                      <span className="truncate mr-1">• {s.title}</span>
                      <span className="font-bold text-emerald-700 shrink-0">Tom: {s.tone}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Disponibilidade da Equipe */}
            <div className="pt-1.5 border-t border-stone-100">
              <span className="font-bold text-[10px] text-stone-400 uppercase tracking-wider block mb-1">
                Quem pode servir ({disp.length}):
              </span>
              {disp.length === 0 ? (
                <span className="text-[11px] text-stone-400 italic">Ninguém respondeu ainda.</span>
              ) : (
                <div className="text-[11px] text-stone-600 flex flex-wrap gap-1">
                  {disp.map((m) => (
                    <span key={m.id} className="bg-stone-100 px-1.5 py-0.5 rounded text-[10px]">
                      {m.name.split(' ')[0]} ({m.roles[0]})
                    </span>
                  ))}
                </div>
              )}
            </div>

            {indisp.length > 0 && (
              <div className="pt-1 text-[10px] text-stone-400">
                <span>Não podem: {indisp.map((m) => m.name.split(' ')[0]).join(', ')}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
