import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import type { Service, Member } from '../types';
import {
  CalendarDays,
  Users,
  CheckCircle2,
  HelpCircle,
  AlertTriangle,
  MessageSquare,
  Sparkles,
  Plus,
  Music,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Search,
  Filter,
  Eye,
  MessageCircle,
  Sun,
  Moon,
} from 'lucide-react';

interface Props {
  onOpenScheduleBuilder: (service: Service) => void;
  onOpenSongEditor: (service: Service) => void;
  onOpenCreateService: (date?: string) => void;
  onOpenBatchSundays: () => void;
  onOpenServiceDetails: (service: Service) => void;
  onOpenWhatsAppShare: (service: Service) => void;
}

const MONTHS = [
  { value: '2026-11', label: 'Novembro de 2026' },
  { value: '2026-12', label: 'Dezembro de 2026' },
];

export const PastorDashboardView: React.FC<Props> = ({
  onOpenScheduleBuilder,
  onOpenSongEditor,
  onOpenCreateService,
  onOpenBatchSundays,
  onOpenServiceDetails,
  onOpenWhatsAppShare,
}) => {
  const {
    members,
    services,
    monthlySubmissions,
    getMemberAvailability,
    getServiceSchedule,
    getServiceConflicts,
    getServiceSongs,
    toggleServiceStatus,
  } = useApp();

  const [selectedMonth, setSelectedMonth] = useState<string>('2026-11');
  const [activeTab, setActiveTab] = useState<'domingos' | 'jovens' | 'equipe' | 'sugestoes' | 'matriz'>('domingos');
  const [memberFilter, setMemberFilter] = useState<'todos' | 'enviados' | 'pendentes'>('todos');
  const [searchMember, setSearchMember] = useState<string>('');
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(null);

  // Cultos do mês
  const monthServices = useMemo(() => {
    return services
      .filter((s) => s.date.startsWith(selectedMonth))
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  }, [services, selectedMonth]);

  // Agrupamento dos cultos do mês por data (especial para Domingos Manhã e Noite lado a lado)
  const groupedDays = useMemo(() => {
    const map = new Map<
      string,
      {
        date: string;
        isSunday: boolean;
        isSaturday: boolean;
        dayNum: string;
        dayOfWeek: number;
        formattedDate: string;
        morningService?: Service;
        eveningService?: Service;
        otherServices: Service[];
        allServices: Service[];
      }
    >();

    monthServices.forEach((srv) => {
      if (!map.has(srv.date)) {
        const [y, m, d] = srv.date.split('-').map(Number);
        const dateObj = new Date(y, m - 1, d);
        const dayOfWeek = dateObj.getDay();
        const dayNum = String(d).padStart(2, '0');
        const formattedDate = dateObj.toLocaleDateString('pt-BR', {
          day: 'numeric',
          month: 'long',
        });

        map.set(srv.date, {
          date: srv.date,
          isSunday: dayOfWeek === 0,
          isSaturday: dayOfWeek === 6,
          dayNum,
          dayOfWeek,
          formattedDate,
          otherServices: [],
          allServices: [],
        });
      }

      const dayGroup = map.get(srv.date)!;
      dayGroup.allServices.push(srv);

      if (dayGroup.isSunday) {
        if ((srv.service_type === 'domingo_manha' || srv.time <= '12:00') && !dayGroup.morningService) {
          dayGroup.morningService = srv;
        } else if ((srv.service_type === 'domingo_noite' || srv.time > '12:00') && !dayGroup.eveningService) {
          dayGroup.eveningService = srv;
        } else {
          dayGroup.otherServices.push(srv);
        }
      } else {
        dayGroup.otherServices.push(srv);
      }
    });

    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [monthServices]);

  // Cultos exclusivos de Domingo (Manhã 09:30 & Noite 19:00)
  const sundayGroups = useMemo(() => {
    return groupedDays.filter((g) => g.isSunday);
  }, [groupedDays]);

  // Cultos exclusivos de Jovens (Sábados ou identificados como jovens)
  const youthServices = useMemo(() => {
    return monthServices.filter(
      (s) =>
        s.service_type === 'sabado_jovens' ||
        s.title.toLowerCase().includes('joven') ||
        new Date(s.date + 'T12:00:00').getDay() === 6
    );
  }, [monthServices]);

  // Integrantes da equipe que enviam disponibilidade (o Pastor Administrador não precisa de disponibilidade)
  const teamMembers = useMemo(() => {
    return members.filter(
      (m) =>
        m.active &&
        m.id !== 'm-pr-junior' &&
        m.user_id !== 'user-admin-junior' &&
        !m.roles.includes('Administrador')
    );
  }, [members]);

  // Submissões do mês selecionado
  const monthSubmissions = useMemo(() => {
    return monthlySubmissions.filter((s) => s.month === selectedMonth);
  }, [monthlySubmissions, selectedMonth]);

  // Mapa de membro para submissão
  const submissionMap = useMemo(() => {
    const map = new Map<string, typeof monthSubmissions[0]>();
    monthSubmissions.forEach((s) => {
      map.set(s.member_id, s);
    });
    return map;
  }, [monthSubmissions]);

  // Status de envio da equipe (exclui o pastor, que não precisa de disponibilidade)
  const submissionStats = useMemo(() => {
    const enviados = teamMembers.filter((m) => submissionMap.has(m.id));
    const pendentes = teamMembers.filter((m) => !submissionMap.has(m.id));
    const percent = teamMembers.length > 0 ? Math.round((enviados.length / teamMembers.length) * 100) : 0;

    return {
      enviados,
      pendentes,
      total: teamMembers.length,
      percent,
    };
  }, [teamMembers, submissionMap]);

  // Conflitos globais no mês: integrantes que estão escalados mas informaram "indisponível"
  const allMonthConflicts = useMemo(() => {
    const list: { service: Service; conflicts: { assignment: any; member?: Member }[] }[] = [];

    monthServices.forEach((srv) => {
      const conflicts = getServiceConflicts(srv.id);
      if (conflicts.length > 0) {
        list.push({ service: srv, conflicts });
      }
    });

    return list;
  }, [monthServices, getServiceConflicts]);

  // Sugestões de outras formas de servir
  const suggestions = useMemo(() => {
    return monthSubmissions
      .filter((s) => s.serve_other_suggestion && s.serve_other_suggestion.trim().length > 0)
      .map((s) => ({
        ...s,
        member: members.find((m) => m.id === s.member_id),
      }));
  }, [monthSubmissions, members]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-stone-200/90 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                Painel do Pastor Administrador
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900 tracking-tight">
              Gestão Mensal de Cultos & Disponibilidade
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
              Acompanhe quem já enviou a disponibilidade, veja sugestões para servir e monte as escalas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Seletor de Mês */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-amber-50 border border-amber-300 rounded-2xl px-3.5 py-2 text-xs sm:text-sm font-bold text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>

            {/* Ação: Gerar Domingos */}
            <button
              onClick={onOpenBatchSundays}
              className="px-3.5 py-2 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Sparkles size={15} />
              <span>Gerar Domingos</span>
            </button>

            {/* Ação: Novo Culto de Jovens ou Individual */}
            <button
              onClick={() => onOpenCreateService()}
              className="px-3 py-2 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 text-xs font-bold flex items-center gap-1 transition-colors"
            >
              <Plus size={15} />
              <span>Novo Culto</span>
            </button>
          </div>
        </div>

        {/* Global Conflict Alert Banner */}
        {allMonthConflicts.length > 0 && (
          <div className="mt-4 p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-950 flex items-start gap-3 shadow-2xs animate-in fade-in">
            <ShieldAlert size={22} className="text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              <p className="font-extrabold text-sm text-rose-900">
                ⚠️ Alerta de Conflito em {allMonthConflicts.length} Culto(s)
              </p>
              <p className="mt-0.5 text-rose-900/90 leading-relaxed">
                Um ou mais integrantes foram escalados, mas posteriormente informaram que estão <strong>INDISPONÍVEIS</strong>.
                O sistema preserva a escala sem remover automaticamente, permitindo que você avalie e substitua com tranquilidade.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {allMonthConflicts.map(({ service, conflicts }) => (
                  <button
                    key={service.id}
                    onClick={() => {
                      setActiveTab('domingos');
                      setExpandedServiceId(service.id);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-rose-200/80 hover:bg-rose-300 font-bold text-[11px] text-rose-950 transition-colors"
                  >
                    {service.title} ({service.date.split('-').slice(1).reverse().join('/')}):{' '}
                    {conflicts.map((c) => c.member?.name).join(', ')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t border-stone-100">
          {/* Card 1: Respostas */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
            <div className="flex items-center justify-between text-emerald-800 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Respostas</span>
              <CheckCircle2 size={16} />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-emerald-950">
                {submissionStats.enviados.length}
              </span>
              <span className="text-xs font-semibold text-emerald-800">
                de {submissionStats.total} ({submissionStats.percent}%)
              </span>
            </div>
            <p className="text-[11px] text-emerald-800 mt-1">Disponibilidade enviada</p>
          </div>

          {/* Card 2: Pendentes */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80">
            <div className="flex items-center justify-between text-amber-800 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Pendentes</span>
              <HelpCircle size={16} />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-amber-950">
                {submissionStats.pendentes.length}
              </span>
              <span className="text-xs font-semibold text-amber-800">
                integrantes
              </span>
            </div>
            <p className="text-[11px] text-amber-800 mt-1">Ainda não responderam</p>
          </div>

          {/* Card 3: Cultos no Mês */}
          <div className="p-3.5 rounded-2xl bg-stone-100/80 border border-stone-200">
            <div className="flex items-center justify-between text-stone-700 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Cultos</span>
              <CalendarDays size={16} />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-stone-900">
                {monthServices.length}
              </span>
              <span className="text-xs font-semibold text-stone-600">
                cadastrados
              </span>
            </div>
            <p className="text-[11px] text-stone-600 mt-1">Domingos e sábados</p>
          </div>

          {/* Card 4: Sugestões de Servir */}
          <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200/80">
            <div className="flex items-center justify-between text-purple-800 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Sugestões</span>
              <MessageSquare size={16} />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-purple-950">
                {suggestions.length}
              </span>
              <span className="text-xs font-semibold text-purple-800">
                outras funções
              </span>
            </div>
            <p className="text-[11px] text-purple-800 mt-1">Propostas para avaliar</p>
          </div>
        </div>
      </div>

      {/* Sub-Tabs Selector */}
      <div className="flex items-center gap-1.5 p-1.5 bg-stone-100/90 rounded-2xl border border-stone-200/80 overflow-x-auto">
        <button
          onClick={() => setActiveTab('domingos')}
          className={`flex-1 min-h-[42px] px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
            activeTab === 'domingos'
              ? 'bg-white text-amber-950 shadow-xs ring-1 ring-amber-200/50'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
          }`}
        >
          <Sun size={16} className="text-amber-500" />
          <span>☀️🌙 Domingos de Louvor ({sundayGroups.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('jovens')}
          className={`flex-1 min-h-[42px] px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
            activeTab === 'jovens'
              ? 'bg-white text-purple-950 shadow-xs ring-1 ring-purple-200/50'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
          }`}
        >
          <Sparkles size={16} className="text-purple-600" />
          <span>✨ Culto de Jovens ({youthServices.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('equipe')}
          className={`flex-1 min-h-[42px] px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
            activeTab === 'equipe'
              ? 'bg-white text-stone-900 shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
          }`}
        >
          <Users size={16} />
          <span>Status da Equipe ({submissionStats.enviados.length}/{submissionStats.total})</span>
        </button>

        <button
          onClick={() => setActiveTab('sugestoes')}
          className={`flex-1 min-h-[42px] px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
            activeTab === 'sugestoes'
              ? 'bg-white text-stone-900 shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
          }`}
        >
          <MessageSquare size={16} />
          <span>Sugestões ({suggestions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('matriz')}
          className={`flex-1 min-h-[42px] px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
            activeTab === 'matriz'
              ? 'bg-white text-stone-900 shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
          }`}
        >
          <Filter size={16} />
          <span>Matriz de Respostas</span>
        </button>
      </div>

      {/* RENDER SERVICE CARD HELPER */}
      {(() => null)()}

      {/* ABA 1: DOMINGOS DE LOUVOR (EXCLUSIVAMENTE OS DOMINGOS) */}
      {activeTab === 'domingos' && (
        <div className="space-y-6">
          {sundayGroups.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-stone-200 text-stone-500">
              <CalendarDays size={40} className="mx-auto text-amber-500 mb-2 opacity-50" />
              <p className="font-bold text-sm text-stone-800">
                Nenhum domingo cadastrado em {MONTHS.find((m) => m.value === selectedMonth)?.label}
              </p>
              <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                Clique no botão "Gerar Domingos" acima para criar automaticamente todos os domingos do mês (Manhã 09:30 e Noite 19:00).
              </p>
              <button
                onClick={onOpenBatchSundays}
                className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs hover:bg-amber-700"
              >
                <Sparkles size={16} />
                <span>Gerar Domingos do Mês</span>
              </button>
            </div>
          ) : (
            sundayGroups.map((group) => {
              const renderServiceCard = (
                srv: Service,
                periodType: 'morning' | 'evening' | 'youth' | 'default'
              ) => {
                const schedule = getServiceSchedule(srv.id);
                const conflicts = getServiceConflicts(srv.id);
                const songs = getServiceSongs(srv.id);
                const isExpanded = expandedServiceId === srv.id;

                const louvorAndConducao = schedule.filter(
                  (asg) => asg.ministry_section !== 'multimidia'
                );
                const multimidia = schedule.filter(
                  (asg) => asg.ministry_section === 'multimidia'
                );
                const availableMembers = teamMembers.filter(
                  (m) => getMemberAvailability(srv.id, m.id) === 'disponivel'
                );

                const isMorning =
                  periodType === 'morning' ||
                  srv.service_type === 'domingo_manha' ||
                  srv.time <= '12:00';

                const theme = isMorning
                  ? {
                      cardBorder:
                        conflicts.length > 0
                          ? 'border-rose-400 ring-2 ring-rose-300'
                          : 'border-amber-300/80 hover:border-amber-400',
                      bg: 'bg-gradient-to-b from-amber-50/50 via-white to-amber-50/20',
                      badgeBg: 'bg-amber-500 text-white',
                      timeBg: 'bg-amber-100 text-amber-950 border border-amber-300/80',
                      icon: Sun,
                      periodLabel: 'Culto da Manhã',
                      periodPrefix: '☀️',
                      primaryBtn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-2xs',
                    }
                  : {
                      cardBorder:
                        conflicts.length > 0
                          ? 'border-rose-400 ring-2 ring-rose-300'
                          : 'border-indigo-300/80 hover:border-indigo-400',
                      bg: 'bg-gradient-to-b from-indigo-50/40 via-white to-slate-50/20',
                      badgeBg: 'bg-indigo-600 text-white',
                      timeBg: 'bg-indigo-100 text-indigo-950 border border-indigo-300/80',
                      icon: Moon,
                      periodLabel: 'Culto da Noite',
                      periodPrefix: '🌙',
                      primaryBtn: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs',
                    };

                const Icon = theme.icon;

                return (
                  <div
                    key={srv.id}
                    className={`rounded-2xl sm:rounded-3xl border transition-all ${theme.cardBorder} ${theme.bg} shadow-2xs flex flex-col justify-between overflow-hidden`}
                  >
                    <div className="p-4 sm:p-5 space-y-3.5">
                      {/* Top Header of Service Card */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-stone-200/80">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${theme.badgeBg} shadow-2xs shrink-0`}
                          >
                            <Icon size={18} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm sm:text-base font-black text-stone-900 leading-tight">
                                {theme.periodPrefix} {theme.periodLabel}
                              </h4>
                              <span
                                className={`px-2 py-0.5 rounded-lg text-xs font-black ${theme.timeBg}`}
                              >
                                {srv.time}
                              </span>
                            </div>
                            <span className="text-[11px] text-stone-600 font-medium">
                              {srv.title}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-center">
                          {/* Status Pill */}
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              srv.status === 'published'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300/80'
                                : 'bg-stone-200/90 text-stone-700 border border-stone-300/80'
                            }`}
                          >
                            {srv.status === 'published' ? '● Publicada' : '○ Rascunho'}
                          </span>

                          {/* Quick WhatsApp Action Button */}
                          <button
                            onClick={() => onOpenWhatsAppShare(srv)}
                            className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 transition-all shadow-2xs active:scale-95"
                            title="Compartilhar escala no WhatsApp"
                          >
                            <MessageCircle size={13} />
                            <span>WhatsApp</span>
                          </button>
                        </div>
                      </div>

                      {/* Conflict Notice if any in this service */}
                      {conflicts.length > 0 && (
                        <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 flex items-start gap-2 text-xs text-rose-950">
                          <AlertTriangle size={15} className="text-rose-600 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-rose-900 block font-bold">
                              Atenção ao Conflito de Disponibilidade:
                            </strong>
                            {conflicts.map((c) => (
                              <span key={c.assignment.id} className="block mt-0.5">
                                • <strong>{c.member?.name}</strong> está escalado ({c.assignment.role_name}), mas informou <strong>INDISPONÍVEL</strong>.
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Metrics: Disponíveis & Escalados */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 font-bold border border-emerald-200">
                          <CheckCircle2 size={13} className="text-emerald-600" />
                          {availableMembers.length} disponíveis para este culto
                        </span>
                        <span className="text-stone-700 font-semibold text-[11px]">
                          {schedule.length} escalado(s) ({louvorAndConducao.length} Louvor /{' '}
                          {multimidia.length} Multimídia)
                        </span>
                      </div>

                      {/* Mini Roster Display (Louvor & Condução) */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-black uppercase tracking-wider text-stone-700">
                            Louvor &amp; Condução ({louvorAndConducao.length})
                          </span>
                        </div>

                        {louvorAndConducao.length === 0 ? (
                          <p className="text-xs text-stone-500 italic bg-white/80 p-2.5 rounded-xl border border-stone-200/80">
                            Nenhum integrante escalado para o louvor neste culto ainda.
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {louvorAndConducao.map((item) => (
                              <div
                                key={item.id}
                                className={`px-2.5 py-1.5 rounded-xl border text-xs flex items-center justify-between gap-1.5 ${
                                  item.hasConflict
                                    ? 'bg-rose-50 border-rose-400 ring-1 ring-rose-300'
                                    : 'bg-white/95 border-stone-200/90 shadow-2xs'
                                }`}
                              >
                                <div className="min-w-0">
                                  <span className="font-bold text-stone-900 block truncate leading-tight">
                                    {item.member?.name}
                                  </span>
                                  <span className="text-[10px] text-amber-800 font-semibold block leading-tight">
                                    {item.role_name}
                                  </span>
                                </div>
                                {item.hasConflict && (
                                  <span className="px-1 py-0.5 rounded text-[9px] font-extrabold bg-rose-600 text-white shrink-0">
                                    Indisp!
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Mini Roster Display (Multimídia) */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-black uppercase tracking-wider text-purple-900">
                            Multimídia ({multimidia.length})
                          </span>
                          <span className="text-[10px] text-stone-500">Som, Luz e Projeção</span>
                        </div>

                        {multimidia.length === 0 ? (
                          <p className="text-xs text-stone-600 italic bg-white/80 p-2.5 rounded-xl border border-stone-200/80">
                            Nenhum voluntário de multimídia escalado.
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {multimidia.map((item) => (
                              <div
                                key={item.id}
                                className={`px-2.5 py-1.5 rounded-xl border text-xs flex items-center justify-between gap-1.5 ${
                                  item.hasConflict
                                    ? 'bg-rose-50 border-rose-400 ring-1 ring-rose-300'
                                    : 'bg-white/95 border-purple-200 shadow-2xs'
                                }`}
                              >
                                <div className="min-w-0">
                                  <span className="font-bold text-stone-900 block truncate leading-tight">
                                    {item.member?.name}
                                  </span>
                                  <span className="text-[10px] text-purple-800 font-semibold block leading-tight">
                                    {item.role_name}
                                  </span>
                                </div>
                                {item.hasConflict && (
                                  <span className="px-1 py-0.5 rounded text-[9px] font-extrabold bg-rose-600 text-white shrink-0">
                                    Indisp!
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Songs preview if any */}
                      {songs.length > 0 && (
                        <div className="p-2.5 rounded-xl bg-white/90 border border-stone-200/90 text-xs text-stone-700 flex items-center gap-2">
                          <Music size={14} className="text-amber-600 shrink-0" />
                          <span className="font-bold text-stone-900 shrink-0">
                            {songs.length} Músicas:
                          </span>
                          <span className="truncate text-[11px] text-stone-600">
                            {songs.map((s) => s.title).join(' • ')}
                          </span>
                        </div>
                      )}

                      {/* Toggle to view Available Members for this service */}
                      <div>
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedServiceId((prev) => (prev === srv.id ? null : srv.id))
                          }
                          className="w-full py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200/80 text-stone-700 text-xs font-semibold flex items-center justify-between transition-colors"
                        >
                          <span className="flex items-center gap-1.5">
                            <Users size={13} className="text-stone-500" />
                            <span>Ver quem informou disponibilidade ({availableMembers.length})</span>
                          </span>
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>

                        {isExpanded && (
                          <div className="mt-2 p-3 rounded-xl bg-white border border-stone-200 text-xs space-y-1.5 animate-in fade-in">
                            <span className="font-bold text-stone-800 block text-[11px]">
                              Integrantes Disponíveis para este culto ({availableMembers.length}):
                            </span>
                            {availableMembers.length === 0 ? (
                              <p className="text-stone-500 italic text-[11px]">
                                Nenhum integrante marcou disponível para este culto ainda.
                              </p>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {availableMembers.map((m) => (
                                  <span
                                    key={m.id}
                                    className="px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-950 text-[11px] font-medium"
                                  >
                                    {m.name}{' '}
                                    <span className="text-[10px] text-stone-500">
                                      ({m.roles.join(', ')})
                                    </span>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Toolbar */}
                    <div className="p-3 sm:p-4 bg-white/90 border-t border-stone-200/80 flex flex-wrap items-center justify-between gap-2">
                      <button
                        onClick={() => onOpenScheduleBuilder(srv)}
                        className={`flex-1 min-w-[130px] px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors ${theme.primaryBtn}`}
                      >
                        <Users size={15} />
                        <span>Montar Escala</span>
                      </button>

                      <button
                        onClick={() => onOpenSongEditor(srv)}
                        className="px-3 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                        title="Editar Repertório de Músicas"
                      >
                        <Music size={14} />
                        <span className="hidden sm:inline">Músicas</span>
                      </button>

                      <button
                        onClick={async () => {
                          const willPublish = srv.status !== 'published';
                          await toggleServiceStatus(srv.id);
                          if (willPublish) {
                            onOpenWhatsAppShare(srv);
                          }
                        }}
                        className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                          srv.status === 'published'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                        }`}
                        title={
                          srv.status === 'published'
                            ? 'Voltar para rascunho'
                            : 'Publicar e abrir WhatsApp'
                        }
                      >
                        {srv.status === 'published' ? 'Publicado' : 'Publicar'}
                      </button>

                      <button
                        onClick={() => onOpenServiceDetails(srv)}
                        className="p-2.5 rounded-xl text-stone-600 hover:bg-stone-100 border border-stone-200 transition-colors"
                        title="Visualizar Detalhes Completos"
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  </div>
                );
              };

              const totalScheduled = group.allServices.reduce(
                (sum, s) => sum + getServiceSchedule(s.id).length,
                0
              );
              const dayConflicts = group.allServices.some(
                (s) => getServiceConflicts(s.id).length > 0
              );

              return (
                <div
                  key={group.date}
                  className="bg-white rounded-3xl border border-stone-200/90 shadow-2xs overflow-hidden transition-all hover:border-amber-300"
                >
                  {/* Sunday Master Header */}
                  <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500/10 via-amber-50/40 to-indigo-500/10 border-b border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-700 text-white flex flex-col items-center justify-center font-extrabold shadow-xs shrink-0">
                        <span className="text-[10px] uppercase tracking-wider leading-none">
                          DOM
                        </span>
                        <span className="text-xl leading-none mt-0.5">{group.dayNum}</span>
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base sm:text-lg font-black text-stone-900 tracking-tight">
                            Domingo, {group.formattedDate}
                          </h3>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-100 text-amber-950 border border-amber-300/80">
                            ☀️ Manhã &amp; 🌙 Noite
                          </span>
                        </div>
                        <p className="text-xs text-stone-600 mt-0.5 flex flex-wrap items-center gap-2">
                          <span>{totalScheduled} integrante(s) escalados no domingo</span>
                          {dayConflicts ? (
                            <span className="text-rose-700 font-extrabold flex items-center gap-1">
                              <AlertTriangle size={13} />
                              Atenção: há conflito de disponibilidade
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-semibold">
                              ✓ Sem conflitos informados
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 2-Columns Side-by-Side: ☀️ Manhã (09:30) e 🌙 Noite (19:00) */}
                  <div className="p-4 sm:p-5 lg:p-6 grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Coluna 1: ☀️ Culto da Manhã */}
                    {group.morningService ? (
                      renderServiceCard(group.morningService, 'morning')
                    ) : (
                      <div className="rounded-2xl border-2 border-dashed border-amber-200 p-6 flex flex-col items-center justify-center text-center bg-amber-50/30">
                        <Sun size={28} className="text-amber-400 mb-2" />
                        <p className="text-xs font-bold text-amber-950">
                          Sem Culto da Manhã Cadastrado
                        </p>
                        <button
                          onClick={() => onOpenCreateService(group.date)}
                          className="mt-3 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-2xs"
                        >
                          + Adicionar Manhã (09:30)
                        </button>
                      </div>
                    )}

                    {/* Coluna 2: 🌙 Culto da Noite */}
                    {group.eveningService ? (
                      renderServiceCard(group.eveningService, 'evening')
                    ) : (
                      <div className="rounded-2xl border-2 border-dashed border-indigo-200 p-6 flex flex-col items-center justify-center text-center bg-indigo-50/30">
                        <Moon size={28} className="text-indigo-400 mb-2" />
                        <p className="text-xs font-bold text-indigo-950">
                          Sem Culto da Noite Cadastrado
                        </p>
                        <button
                          onClick={() => onOpenCreateService(group.date)}
                          className="mt-3 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-2xs"
                        >
                          + Adicionar Noite (19:00)
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ABA 2: CULTO DE JOVENS (TOTALMENTE SEPARADO DO LOUVOR DE DOMINGO) */}
      {activeTab === 'jovens' && (
        <div className="space-y-6">
          {/* Banner Exclusivo Ministério de Jovens */}
          <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white p-5 sm:p-7 rounded-3xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles size={22} className="text-purple-200" />
                <h3 className="text-lg sm:text-xl font-black tracking-tight">
                  Culto de Jovens — Ministério da Juventude
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-purple-100 mt-1 max-w-2xl leading-relaxed">
                Escalas e repertórios exclusivos para os cultos de jovens aos sábados (19:30).
                Acontecem somente nos sábados específicos definidos pelo pastor.
              </p>
            </div>

            <button
              onClick={() => onOpenCreateService()}
              className="px-4 py-2.5 rounded-2xl bg-white text-purple-900 hover:bg-purple-50 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shrink-0 self-start sm:self-center"
            >
              <Plus size={16} />
              <span>Novo Culto de Jovens</span>
            </button>
          </div>

          {youthServices.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-stone-200 text-stone-500">
              <Sparkles size={40} className="mx-auto text-purple-400 mb-2 opacity-50" />
              <p className="font-bold text-sm text-stone-800">
                Nenhum culto de jovens agendado em {MONTHS.find((m) => m.value === selectedMonth)?.label}
              </p>
              <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                Os cultos de jovens acontecem somente nos sábados escolhidos pelo pastor.
              </p>
              <button
                onClick={() => onOpenCreateService()}
                className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs"
              >
                <Plus size={16} />
                <span>Agendar Culto de Jovens</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {youthServices.map((srv) => {
                const schedule = getServiceSchedule(srv.id);
                const conflicts = getServiceConflicts(srv.id);
                const songs = getServiceSongs(srv.id);
                const isExpanded = expandedServiceId === srv.id;

                const louvorAndConducao = schedule.filter(
                  (asg) => asg.ministry_section !== 'multimidia'
                );
                const multimidia = schedule.filter(
                  (asg) => asg.ministry_section === 'multimidia'
                );
                const availableMembers = teamMembers.filter(
                  (m) => getMemberAvailability(srv.id, m.id) === 'disponivel'
                );

                const [y, m, d] = srv.date.split('-').map(Number);
                const dateObj = new Date(y, m - 1, d);
                const formattedDate = dateObj.toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                });

                return (
                  <div
                    key={srv.id}
                    className="rounded-3xl border border-purple-200/90 hover:border-purple-300 bg-gradient-to-b from-purple-50/50 via-white to-purple-50/20 shadow-2xs flex flex-col justify-between overflow-hidden transition-all"
                  >
                    <div className="p-5 space-y-4">
                      {/* Header Culto de Jovens */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-purple-100">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-purple-600 text-white flex flex-col items-center justify-center font-extrabold shadow-xs shrink-0">
                            <span className="text-[10px] uppercase leading-none">SÁB</span>
                            <span className="text-base leading-none mt-0.5">{String(d).padStart(2, '0')}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-base font-black text-purple-950">
                                {srv.title}
                              </h4>
                              <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-purple-100 text-purple-900 border border-purple-200">
                                {srv.time}
                              </span>
                            </div>
                            <span className="text-xs text-purple-800 font-semibold capitalize">
                              {formattedDate}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              srv.status === 'published'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300/80'
                                : 'bg-stone-200 text-stone-700'
                            }`}
                          >
                            {srv.status === 'published' ? '● Publicada' : '○ Rascunho'}
                          </span>

                          <button
                            onClick={() => onOpenWhatsAppShare(srv)}
                            className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 transition-all shadow-2xs active:scale-95"
                            title="Compartilhar escala com a juventude"
                          >
                            <MessageCircle size={13} />
                            <span>WhatsApp</span>
                          </button>
                        </div>
                      </div>

                      {/* Conflict Alert */}
                      {conflicts.length > 0 && (
                        <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 flex items-start gap-2 text-xs text-rose-950">
                          <AlertTriangle size={15} className="text-rose-600 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-rose-900 block font-bold">
                              Atenção ao Conflito de Disponibilidade:
                            </strong>
                            {conflicts.map((c) => (
                              <span key={c.assignment.id} className="block mt-0.5">
                                • <strong>{c.member?.name}</strong> está escalado ({c.assignment.role_name}), mas informou <strong>INDISPONÍVEL</strong>.
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Disponíveis e Escalados */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 font-bold border border-emerald-200">
                          <CheckCircle2 size={13} className="text-emerald-600" />
                          {availableMembers.length} voluntários disponíveis
                        </span>
                        <span className="text-stone-700 font-semibold text-[11px]">
                          {schedule.length} escalado(s) ({louvorAndConducao.length} Louvor / {multimidia.length} Multimídia)
                        </span>
                      </div>

                      {/* Louvor dos Jovens */}
                      <div>
                        <span className="text-[11px] font-black uppercase tracking-wider text-purple-900 block mb-1.5">
                          Equipe de Louvor dos Jovens ({louvorAndConducao.length})
                        </span>
                        {louvorAndConducao.length === 0 ? (
                          <p className="text-xs text-stone-500 italic bg-white/80 p-2.5 rounded-xl border border-stone-200">
                            Nenhum integrante escalado para o louvor deste culto ainda.
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {louvorAndConducao.map((item) => (
                              <div
                                key={item.id}
                                className={`px-2.5 py-1.5 rounded-xl border text-xs flex items-center justify-between gap-1.5 ${
                                  item.hasConflict
                                    ? 'bg-rose-50 border-rose-400'
                                    : 'bg-white/95 border-purple-200 shadow-2xs'
                                }`}
                              >
                                <div className="min-w-0">
                                  <span className="font-bold text-stone-900 block truncate leading-tight">
                                    {item.member?.name}
                                  </span>
                                  <span className="text-[10px] text-purple-800 font-semibold block leading-tight">
                                    {item.role_name}
                                  </span>
                                </div>
                                {item.hasConflict && (
                                  <span className="px-1 py-0.5 rounded text-[9px] font-extrabold bg-rose-600 text-white shrink-0">
                                    Indisp!
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Multimídia dos Jovens */}
                      <div>
                        <span className="text-[11px] font-black uppercase tracking-wider text-purple-900 block mb-1.5">
                          Multimídia ({multimidia.length})
                        </span>
                        {multimidia.length === 0 ? (
                          <p className="text-xs text-stone-500 italic bg-white/80 p-2.5 rounded-xl border border-stone-200">
                            Nenhum voluntário de multimídia escalado.
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {multimidia.map((item) => (
                              <div
                                key={item.id}
                                className="px-2.5 py-1.5 rounded-xl border border-purple-200 bg-white/95 text-xs flex items-center justify-between gap-1.5 shadow-2xs"
                              >
                                <div className="min-w-0">
                                  <span className="font-bold text-stone-900 block truncate leading-tight">
                                    {item.member?.name}
                                  </span>
                                  <span className="text-[10px] text-purple-800 font-semibold block leading-tight">
                                    {item.role_name}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Músicas */}
                      {songs.length > 0 && (
                        <div className="p-2.5 rounded-xl bg-white border border-purple-200 text-xs text-stone-700 flex items-center gap-2">
                          <Music size={14} className="text-purple-600 shrink-0" />
                          <span className="font-bold text-purple-950 shrink-0">{songs.length} Músicas:</span>
                          <span className="truncate text-[11px] text-stone-600">
                            {songs.map((s) => s.title).join(' • ')}
                          </span>
                        </div>
                      )}

                      {/* Toggle Disponíveis */}
                      <div>
                        <button
                          type="button"
                          onClick={() => setExpandedServiceId((prev) => (prev === srv.id ? null : srv.id))}
                          className="w-full py-2 px-3 rounded-xl bg-purple-50 hover:bg-purple-100/80 text-purple-900 text-xs font-semibold flex items-center justify-between transition-colors"
                        >
                          <span className="flex items-center gap-1.5">
                            <Users size={13} className="text-purple-600" />
                            <span>Ver voluntários disponíveis ({availableMembers.length})</span>
                          </span>
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>

                        {isExpanded && (
                          <div className="mt-2 p-3 rounded-xl bg-white border border-purple-200 text-xs space-y-1.5 animate-in fade-in">
                            <span className="font-bold text-purple-950 block text-[11px]">
                              Disponíveis para o culto de jovens ({availableMembers.length}):
                            </span>
                            {availableMembers.length === 0 ? (
                              <p className="text-stone-500 italic text-[11px]">
                                Nenhum voluntário informou disponibilidade ainda.
                              </p>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {availableMembers.map((m) => (
                                  <span
                                    key={m.id}
                                    className="px-2 py-0.5 rounded-lg bg-purple-50 border border-purple-200 text-purple-950 text-[11px] font-medium"
                                  >
                                    {m.name}{' '}
                                    <span className="text-[10px] text-purple-700">({m.roles.join(', ')})</span>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Toolbar Jovens */}
                    <div className="p-4 bg-white/90 border-t border-purple-100 flex flex-wrap items-center justify-between gap-2">
                      <button
                        onClick={() => onOpenScheduleBuilder(srv)}
                        className="flex-1 min-w-[130px] px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white shadow-2xs transition-colors"
                      >
                        <Users size={15} />
                        <span>Montar Escala</span>
                      </button>

                      <button
                        onClick={() => onOpenSongEditor(srv)}
                        className="px-3 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <Music size={14} />
                        <span>Músicas</span>
                      </button>

                      <button
                        onClick={async () => {
                          const willPublish = srv.status !== 'published';
                          await toggleServiceStatus(srv.id);
                          if (willPublish) {
                            onOpenWhatsAppShare(srv);
                          }
                        }}
                        className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                          srv.status === 'published'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {srv.status === 'published' ? 'Publicado' : 'Publicar'}
                      </button>

                      <button
                        onClick={() => onOpenServiceDetails(srv)}
                        className="p-2.5 rounded-xl text-stone-600 hover:bg-stone-100 border border-stone-200 transition-colors"
                        title="Ver Detalhes"
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: STATUS DA EQUIPE (QUEM ENVIOU E QUEM ESTÁ PENDENTE) */}
      {activeTab === 'equipe' && (
        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-stone-200/90 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-stone-900">
                Status de Envio de Disponibilidade — {MONTHS.find((m) => m.value === selectedMonth)?.label}
              </h3>
              <p className="text-xs text-stone-600 mt-0.5">
                {submissionStats.enviados.length} de {submissionStats.total} integrantes responderam.
              </p>
            </div>

            {/* Search and Filter buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-600" />
                <input
                  type="text"
                  placeholder="Buscar por nome..."
                  value={searchMember}
                  onChange={(e) => setSearchMember(e.target.value)}
                  className="w-full sm:w-44 pl-8 pr-3 py-1.5 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setMemberFilter('todos')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    memberFilter === 'todos'
                      ? 'bg-amber-600 text-white'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  Todos ({submissionStats.total})
                </button>
                <button
                  onClick={() => setMemberFilter('enviados')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    memberFilter === 'enviados'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  Enviados ({submissionStats.enviados.length})
                </button>
                <button
                  onClick={() => setMemberFilter('pendentes')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    memberFilter === 'pendentes'
                      ? 'bg-amber-500 text-white'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  Pendentes ({submissionStats.pendentes.length})
                </button>
              </div>
            </div>
          </div>

          {/* Members List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {teamMembers
              .filter((m) => {
                if (searchMember && !m.name.toLowerCase().includes(searchMember.toLowerCase())) {
                  return false;
                }
                const isSent = submissionMap.has(m.id);
                if (memberFilter === 'enviados') return isSent;
                if (memberFilter === 'pendentes') return !isSent;
                return true;
              })
              .map((m) => {
                const sub = submissionMap.get(m.id);

                return (
                  <div
                    key={m.id}
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-2.5 ${
                      sub
                        ? 'bg-white border-emerald-200/90 shadow-2xs'
                        : 'bg-stone-50 border-stone-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-extrabold text-stone-900 text-xs sm:text-sm">
                          {m.name}
                        </span>
                        {sub ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">
                            <CheckCircle2 size={12} />
                            Enviado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-[10px]">
                            <HelpCircle size={12} />
                            Pendente
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-amber-800 font-semibold mt-0.5">
                        {m.ministry} • {m.roles.join(', ')}
                        {m.is_leader && ' (Líder)'}
                      </p>

                      {sub && (
                        <p className="text-[10px] text-stone-500 mt-1">
                          Enviado em {new Date(sub.submitted_at).toLocaleDateString('pt-BR')} às{' '}
                          {new Date(sub.submitted_at).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      )}
                    </div>

                    {sub?.serve_other_suggestion && (
                      <div className="p-2 rounded-xl bg-purple-50 border border-purple-200 text-[11px] text-purple-950">
                        <span className="font-bold block text-[10px] text-purple-900 uppercase tracking-wider">
                          Sugestão de outra função:
                        </span>
                        "{sub.serve_other_suggestion}"
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB 3: SUGESTÕES PARA SERVIR EM OUTRA FUNÇÃO */}
      {activeTab === 'sugestoes' && (
        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-stone-200/90 shadow-2xs space-y-4">
          <div>
            <h3 className="text-base font-extrabold text-stone-900">
              Sugestões da Equipe para Servir em Outras Funções
            </h3>
            <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">
              Respostas enviadas no campo opcional do formulário mensal. Estas sugestões servem para avaliação pastoral e <strong>não alteram automaticamente</strong> o cadastro de funções dos integrantes.
            </p>
          </div>

          {suggestions.length === 0 ? (
            <div className="p-10 text-center bg-stone-50 rounded-2xl border border-stone-200 text-stone-500 text-xs">
              Nenhuma sugestão enviada pelos integrantes para este mês até o momento.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {suggestions.map((sug) => (
                <div
                  key={sug.id}
                  className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200/80 shadow-2xs space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-extrabold text-purple-950 text-sm">
                      {sug.member?.name}
                    </span>
                    <span className="text-[11px] font-semibold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-lg">
                      {sug.member?.ministry}
                    </span>
                  </div>

                  <p className="text-xs text-purple-900 font-medium leading-relaxed bg-white p-3 rounded-xl border border-purple-200/80">
                    "{sug.serve_other_suggestion}"
                  </p>

                  <div className="text-[10px] text-purple-700 flex items-center justify-between">
                    <span>Funções atuais: {sug.member?.roles.join(', ')}</span>
                    <span>
                      {new Date(sug.submitted_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: MATRIZ DE RESPOSTAS (TABELA / GRADE MENSAL) */}
      {activeTab === 'matriz' && (
        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-stone-200/90 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-extrabold text-stone-900">
                Matriz Completa de Disponibilidade por Culto
              </h3>
              <p className="text-xs text-stone-600 mt-0.5">
                Consulte as respostas de cada pessoa por culto e período.
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 font-semibold text-emerald-800">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Disponível
              </span>
              <span className="flex items-center gap-1 font-semibold text-rose-800">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Indisponível
              </span>
              <span className="flex items-center gap-1 font-semibold text-stone-600">
                <span className="w-2.5 h-2.5 rounded-full bg-stone-300"></span> Pendente
              </span>
            </div>
          </div>

          <div className="overflow-x-auto border border-stone-200 rounded-2xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-stone-700 font-extrabold">
                  <th className="p-3 sticky left-0 bg-stone-50 min-w-[160px] z-10 border-r border-stone-200">
                    Integrante
                  </th>
                  {monthServices.map((srv) => (
                    <th key={srv.id} className="p-2.5 text-center min-w-[110px] border-r border-stone-200">
                      <span className="block font-bold text-stone-900">
                        {srv.date.split('-').slice(1).reverse().join('/')}
                      </span>
                      <span className="block text-[10px] font-semibold text-stone-500">
                        {srv.period === 'manha' ? '☀️ Manhã' : '🌙 Noite'}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {teamMembers.map((m) => (
                  <tr key={m.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="p-3 font-bold text-stone-900 sticky left-0 bg-white border-r border-stone-200 z-10">
                      {m.name}
                      <span className="block text-[10px] text-stone-500 font-normal">
                        {m.roles.join(', ')}
                      </span>
                    </td>
                    {monthServices.map((srv) => {
                      const st = getMemberAvailability(srv.id, m.id);

                      return (
                        <td key={srv.id} className="p-2 text-center border-r border-stone-200">
                          {st === 'disponivel' && (
                            <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                              Disp.
                            </span>
                          )}
                          {st === 'indisponivel' && (
                            <span className="inline-block px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold text-[10px]">
                              Indisp.
                            </span>
                          )}
                          {st === 'pendente' && (
                            <span className="inline-block px-2 py-0.5 rounded-md bg-stone-100 text-stone-500 font-semibold text-[10px]">
                              —
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
