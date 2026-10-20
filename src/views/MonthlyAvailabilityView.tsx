import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import type { AvailabilityStatus, Service } from '../types';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Send,
  Info,
  MessageSquare,
  AlertCircle,
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react';

const MONTHS = [
  { value: '2026-11', label: 'Novembro de 2026' },
  { value: '2026-12', label: 'Dezembro de 2026' },
];

export const MonthlyAvailabilityView: React.FC = () => {
  const {
    currentMember,
    currentUser,
    services,
    availabilities,
    monthlySubmissions,
    saveMonthlyAvailability,
  } = useApp();

  // Mês selecionado (padrão Novembro de 2026 conforme solicitado)
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-11');
  const [localStatuses, setLocalStatuses] = useState<Record<string, AvailabilityStatus>>({});
  const [suggestion, setSuggestion] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Cultos do mês selecionado
  const monthServices = useMemo(() => {
    return services
      .filter((s) => s.date.startsWith(selectedMonth))
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  }, [services, selectedMonth]);

  // Agrupamento por Domingos (Manhã e Noite) e Sábados (Culto de Jovens)
  const groupedDates = useMemo(() => {
    const map = new Map<
      string,
      {
        date: string;
        dayOfWeek: number;
        formattedDate: string;
        isSunday: boolean;
        isSaturday: boolean;
        services: Service[];
      }
    >();

    monthServices.forEach((srv) => {
      if (!map.has(srv.date)) {
        // Parse da data
        const [y, m, d] = srv.date.split('-').map(Number);
        const dateObj = new Date(y, m - 1, d);
        const dayOfWeek = dateObj.getDay(); // 0 = Domingo, 6 = Sábado
        const formattedDate = `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;

        map.set(srv.date, {
          date: srv.date,
          dayOfWeek,
          formattedDate,
          isSunday: dayOfWeek === 0,
          isSaturday: dayOfWeek === 6,
          services: [],
        });
      }
      map.get(srv.date)?.services.push(srv);
    });

    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [monthServices]);

  // Seção ativa: domingos de louvor ou culto de jovens (separados em abas)
  const [activeSection, setActiveSection] = useState<'domingos' | 'jovens'>('domingos');

  // Grupos separados
  const sundayGroups = useMemo(() => {
    return groupedDates.filter((g) => g.isSunday);
  }, [groupedDates]);

  const youthGroups = useMemo(() => {
    return groupedDates.filter(
      (g) => g.isSaturday || g.services.some((s) => s.service_type === 'sabado_jovens')
    );
  }, [groupedDates]);

  const sundayServicesCount = useMemo(() => {
    return sundayGroups.reduce((acc, g) => acc + g.services.length, 0);
  }, [sundayGroups]);

  const youthServicesCount = useMemo(() => {
    return youthGroups.reduce((acc, g) => acc + g.services.length, 0);
  }, [youthGroups]);

  // Submissão mensal atual do integrante
  const existingSubmission = useMemo(() => {
    if (!currentMember) return undefined;
    return monthlySubmissions.find(
      (s) => s.member_id === currentMember.id && s.month === selectedMonth
    );
  }, [monthlySubmissions, currentMember, selectedMonth]);

  // Inicializa respostas locais quando o mês ou integrante mudar
  useEffect(() => {
    if (!currentMember) return;
    const initialMap: Record<string, AvailabilityStatus> = {};

    monthServices.forEach((s) => {
      const found = availabilities.find(
        (a) => a.service_id === s.id && a.member_id === currentMember.id
      );
      initialMap[s.id] = found ? found.status : 'pendente';
    });

    setLocalStatuses(initialMap);
    setSuggestion(existingSubmission?.serve_other_suggestion || '');
    setSaveSuccess(false);
  }, [currentMember, monthServices, availabilities, selectedMonth, existingSubmission]);

  const handleStatusChange = (serviceId: string, status: AvailabilityStatus) => {
    setLocalStatuses((prev) => ({
      ...prev,
      [serviceId]: status,
    }));
    setSaveSuccess(false);
  };

  // Preenche somente os cultos da aba ativa (Domingos ou Jovens)
  const handleQuickMarkSection = (status: AvailabilityStatus) => {
    const targetGroups = activeSection === 'domingos' ? sundayGroups : youthGroups;
    const targetServiceIds = targetGroups.flatMap((g) => g.services.map((s) => s.id));
    setLocalStatuses((prev) => {
      const next = { ...prev };
      targetServiceIds.forEach((id) => {
        next[id] = status;
      });
      return next;
    });
    setSaveSuccess(false);
  };

  const handleQuickMarkAll = (status: AvailabilityStatus) => {
    const updated: Record<string, AvailabilityStatus> = {};
    monthServices.forEach((s) => {
      updated[s.id] = status;
    });
    setLocalStatuses(updated);
    setSaveSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMember) {
      alert('Você precisa estar vinculado a um cadastro de integrante para enviar disponibilidade.');
      return;
    }

    setIsSaving(true);
    try {
      await saveMonthlyAvailability(
        selectedMonth,
        localStatuses,
        suggestion.trim() || undefined,
        currentMember.id
      );
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao enviar disponibilidade.';
      alert(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // Contadores de respostas locais
  const counts = useMemo(() => {
    let disp = 0;
    let indisp = 0;
    let pend = 0;
    Object.values(localStatuses).forEach((st) => {
      if (st === 'disponivel') disp++;
      else if (st === 'indisponivel') indisp++;
      else pend++;
    });
    return { disp, indisp, pend, total: monthServices.length };
  }, [localStatuses, monthServices]);

  if (currentUser.role === 'admin') {
    return (
      <div className="p-8 bg-white rounded-3xl border border-stone-200 text-center max-w-lg mx-auto my-8 shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-3">
          <Info size={28} />
        </div>
        <h3 className="text-lg font-extrabold text-stone-900 mb-1">
          O Pastor não precisa de disponibilidade
        </h3>
        <p className="text-xs text-stone-600 leading-relaxed mb-4">
          Como Pastor Administrador, você não precisa informar disponibilidade. Acesse o{' '}
          <strong>Painel do Pastor</strong> ou <strong>Escalas dos Cultos</strong> para ver e gerenciar a escala dos demais integrantes.
        </p>
      </div>
    );
  }

  if (!currentMember) {
    return (
      <div className="p-6 bg-white rounded-3xl border border-stone-200 text-center max-w-lg mx-auto">
        <AlertCircle size={40} className="mx-auto text-amber-600 mb-3" />
        <h3 className="text-base font-bold text-stone-900 mb-1">
          Usuário não vinculado a um integrante
        </h3>
        <p className="text-xs text-stone-600 leading-relaxed mb-4">
          O usuário logado ({currentUser.name}) não possui vínculo direto com um integrante.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Banner & Month Selector */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-stone-200/90 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                Disponibilidade Mensal
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900 tracking-tight">
              Minha Disponibilidade do Mês
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
              Integrante: <strong>{currentMember.name}</strong> •{' '}
              <span className="text-amber-800 font-semibold">{currentMember.ministry}</span> (
              {currentMember.roles.join(', ')})
            </p>
          </div>

          {/* Month Dropdown */}
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <label className="text-xs font-bold text-stone-700 whitespace-nowrap">
              Mês:
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-amber-50 border border-amber-300/80 rounded-2xl px-3.5 py-2 text-xs sm:text-sm font-bold text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Existing Submission Status Alert */}
        <div className="mt-4 pt-4 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            {existingSubmission ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                <CheckCircle2 size={14} />
                Disponibilidade enviada ao pastor em{' '}
                {new Date(existingSubmission.submitted_at).toLocaleDateString('pt-BR')} às{' '}
                {new Date(existingSubmission.submitted_at).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-xs">
                <HelpCircle size={14} />
                Pendente de envio para este mês
              </span>
            )}
          </div>

          {/* Quick Mark Helpers */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <span className="text-[11px] text-stone-500 mr-1">Preencher todos:</span>
            <button
              type="button"
              onClick={() => handleQuickMarkAll('disponivel')}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
            >
              Disponível em Todos
            </button>
            <button
              type="button"
              onClick={() => handleQuickMarkAll('pendente')}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-stone-100 text-stone-600 hover:bg-stone-200 border border-stone-200 transition-colors"
            >
              Limpar
            </button>
          </div>
        </div>
      </div>

      {/* Important Disclaimer Notice */}
      <div className="p-4 rounded-3xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-950 flex items-start gap-3 shadow-2xs">
        <Info size={18} className="text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">
            Atenção às regras de disponibilidade:
          </p>
          <ul className="list-disc list-inside space-y-0.5 text-amber-900/90 leading-relaxed text-[11px] sm:text-xs">
            <li>
              <strong>Estar disponível não significa estar escalado.</strong> A escolha final dos integrantes de cada culto será sempre do pastor administrador.
            </li>
            <li>
              <strong>Não responder não conta como disponível.</strong> Se não marcar, constará como pendente.
            </li>
            <li>
              Você pode editar e reenviar sua disponibilidade a qualquer momento. Ao salvar, as informações atualizam instantaneamente no painel do pastor.
            </li>
          </ul>
        </div>
      </div>

      {/* Services Matrix (Separated in Tabs: Sundays vs Youth) */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tab Switcher: Domingos vs Jovens */}
        <div className="flex items-center gap-1.5 p-1.5 bg-stone-100/90 rounded-2xl border border-stone-200/80">
          <button
            type="button"
            onClick={() => setActiveSection('domingos')}
            className={`flex-1 min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all ${
              activeSection === 'domingos'
                ? 'bg-white text-amber-950 shadow-xs ring-1 ring-amber-200'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            <Sun size={16} className="text-amber-500" />
            <span>☀️🌙 Domingos de Louvor ({sundayServicesCount} cultos)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('jovens')}
            className={`flex-1 min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all ${
              activeSection === 'jovens'
                ? 'bg-white text-purple-950 shadow-xs ring-1 ring-purple-200'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            <Sparkles size={16} className="text-purple-600" />
            <span>✨ Culto de Jovens ({youthServicesCount} cultos)</span>
          </button>
        </div>

        {/* SECTION: DOMINGOS DE LOUVOR */}
        {activeSection === 'domingos' && (
          <div className="space-y-4">
            {/* Header / Quick helpers for Sundays */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80">
              <div>
                <h4 className="text-sm font-bold text-amber-950">
                  ☀️🌙 Cultos de Domingo — Manhã (09:30) &amp; Noite (19:00)
                </h4>
                <p className="text-xs text-amber-900/80 mt-0.5">
                  Informe sua disponibilidade para os cultos dominicais de louvor.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleQuickMarkSection('disponivel')}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-2xs transition-colors"
                >
                  Disponível em Todos os Domingos
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickMarkSection('pendente')}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white text-stone-700 hover:bg-stone-100 border border-stone-200 transition-colors"
                >
                  Limpar
                </button>
              </div>
            </div>

            {sundayGroups.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-stone-200 text-stone-500 text-xs">
                Nenhum culto de domingo cadastrado para este mês.
              </div>
            ) : (
              <div className="space-y-3">
                {sundayGroups.map((group) => (
                  <div
                    key={group.date}
                    className="bg-white rounded-3xl border border-stone-200/90 p-4 sm:p-5 shadow-2xs transition-all hover:border-amber-200"
                  >
                    {/* Date Header Badge */}
                    <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-stone-100">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-xl text-xs font-extrabold uppercase tracking-wider bg-amber-100 text-amber-900">
                          Domingo
                        </span>
                        <span className="text-sm sm:text-base font-extrabold text-stone-900">
                          {group.formattedDate}
                        </span>
                      </div>

                      <span className="text-[11px] font-semibold text-stone-500">
                        {group.services.length} culto{group.services.length !== 1 ? 's' : ''} no domingo
                      </span>
                    </div>

                    {/* Services list for this Sunday */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {group.services.map((srv) => {
                        const currentStatus = localStatuses[srv.id] || 'pendente';
                        const isMorning = srv.service_type === 'domingo_manha' || srv.time <= '12:00';

                        const periodBadge = isMorning ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-black bg-amber-100 text-amber-950 border border-amber-300/80 shrink-0">
                            <Sun size={13} className="text-amber-600" />
                            MANHÃ • 09:30
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-black bg-indigo-100 text-indigo-950 border border-indigo-300/80 shrink-0">
                            <Moon size={13} className="text-indigo-600" />
                            NOITE • 19:00
                          </span>
                        );

                        return (
                          <div
                            key={srv.id}
                            className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                              currentStatus === 'disponivel'
                                ? 'bg-emerald-50/70 border-emerald-300 shadow-2xs'
                                : currentStatus === 'indisponivel'
                                ? 'bg-rose-50/70 border-rose-300 shadow-2xs'
                                : isMorning
                                ? 'bg-gradient-to-b from-amber-50/40 via-white to-amber-50/10 border-amber-200/90'
                                : 'bg-gradient-to-b from-indigo-50/30 via-white to-slate-50/10 border-indigo-200/90'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2">
                                <h3 className="text-xs sm:text-sm font-extrabold text-stone-900 leading-tight">
                                  {srv.title}
                                </h3>
                                {periodBadge}
                              </div>
                              {srv.notes && (
                                <p className="text-[11px] text-stone-600 mt-1.5 line-clamp-2">
                                  {srv.notes}
                                </p>
                              )}
                            </div>

                            <div className="grid grid-cols-3 gap-1.5 pt-1">
                              <button
                                type="button"
                                onClick={() => handleStatusChange(srv.id, 'disponivel')}
                                className={`min-h-[44px] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] ${
                                  currentStatus === 'disponivel'
                                    ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-500/30'
                                    : 'bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200/90'
                                }`}
                              >
                                <CheckCircle2 size={16} />
                                <span>Disponível</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleStatusChange(srv.id, 'indisponivel')}
                                className={`min-h-[44px] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] ${
                                  currentStatus === 'indisponivel'
                                    ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-500/30'
                                    : 'bg-white hover:bg-rose-50 text-rose-800 border border-rose-200/90'
                                }`}
                              >
                                <XCircle size={16} />
                                <span>Indisponível</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleStatusChange(srv.id, 'pendente')}
                                className={`min-h-[44px] rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all active:scale-[0.98] ${
                                  currentStatus === 'pendente'
                                    ? 'bg-stone-600 text-white shadow-xs'
                                    : 'bg-white hover:bg-stone-100 text-stone-600 border border-stone-200'
                                }`}
                              >
                                <HelpCircle size={15} />
                                <span>Pendente</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SECTION: CULTO DE JOVENS (SEPARADO DO LOUVOR DE DOMINGO) */}
        {activeSection === 'jovens' && (
          <div className="space-y-4">
            {/* Header / Quick helpers for Youth */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-purple-50/80 border border-purple-200">
              <div>
                <h4 className="text-sm font-bold text-purple-950 flex items-center gap-1.5">
                  <Sparkles size={16} className="text-purple-600" />
                  Culto de Jovens — Sábados (19:30)
                </h4>
                <p className="text-xs text-purple-900/80 mt-0.5">
                  Acontece em sábados específicos. Informe sua disponibilidade para a equipe da juventude.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleQuickMarkSection('disponivel')}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-2xs transition-colors"
                >
                  Disponível nos Jovens
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickMarkSection('pendente')}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white text-stone-700 hover:bg-stone-100 border border-stone-200 transition-colors"
                >
                  Limpar
                </button>
              </div>
            </div>

            {youthGroups.length === 0 ? (
              <div className="p-10 text-center bg-white rounded-3xl border border-stone-200 text-stone-500">
                <Sparkles size={36} className="mx-auto text-purple-400 mb-2 opacity-50" />
                <p className="font-bold text-sm text-stone-800">
                  Nenhum culto de jovens cadastrado para este mês
                </p>
                <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                  Os cultos de jovens acontecem somente em sábados específicos definidos pelo pastor.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {youthGroups.map((group) => (
                  <div
                    key={group.date}
                    className="bg-white rounded-3xl border border-purple-200 p-4 sm:p-5 shadow-2xs transition-all hover:border-purple-300"
                  >
                    {/* Date Header Badge */}
                    <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-purple-100">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-xl text-xs font-extrabold uppercase tracking-wider bg-purple-100 text-purple-900">
                          Sábado de Jovens
                        </span>
                        <span className="text-sm sm:text-base font-extrabold text-stone-900">
                          {group.formattedDate}
                        </span>
                      </div>

                      <span className="text-[11px] font-semibold text-purple-800">
                        {group.services.length} culto{group.services.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Youth Services List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {group.services.map((srv) => {
                        const currentStatus = localStatuses[srv.id] || 'pendente';

                        return (
                          <div
                            key={srv.id}
                            className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                              currentStatus === 'disponivel'
                                ? 'bg-emerald-50/70 border-emerald-300 shadow-2xs'
                                : currentStatus === 'indisponivel'
                                ? 'bg-rose-50/70 border-rose-300 shadow-2xs'
                                : 'bg-gradient-to-b from-purple-50/40 via-white to-purple-50/10 border-purple-200'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2">
                                <h3 className="text-xs sm:text-sm font-extrabold text-stone-900 leading-tight">
                                  {srv.title}
                                </h3>
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-black bg-purple-100 text-purple-950 border border-purple-300/80 shrink-0">
                                  <Sparkles size={13} className="text-purple-600" />
                                  JOVENS • {srv.time}
                                </span>
                              </div>
                              {srv.notes && (
                                <p className="text-[11px] text-stone-600 mt-1.5 line-clamp-2">
                                  {srv.notes}
                                </p>
                              )}
                            </div>

                            <div className="grid grid-cols-3 gap-1.5 pt-1">
                              <button
                                type="button"
                                onClick={() => handleStatusChange(srv.id, 'disponivel')}
                                className={`min-h-[44px] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] ${
                                  currentStatus === 'disponivel'
                                    ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-500/30'
                                    : 'bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200/90'
                                }`}
                              >
                                <CheckCircle2 size={16} />
                                <span>Disponível</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleStatusChange(srv.id, 'indisponivel')}
                                className={`min-h-[44px] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] ${
                                  currentStatus === 'indisponivel'
                                    ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-500/30'
                                    : 'bg-white hover:bg-rose-50 text-rose-800 border border-rose-200/90'
                                }`}
                              >
                                <XCircle size={16} />
                                <span>Indisponível</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleStatusChange(srv.id, 'pendente')}
                                className={`min-h-[44px] rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all active:scale-[0.98] ${
                                  currentStatus === 'pendente'
                                    ? 'bg-stone-600 text-white shadow-xs'
                                    : 'bg-white hover:bg-stone-100 text-stone-600 border border-stone-200'
                                }`}
                              >
                                <HelpCircle size={15} />
                                <span>Pendente</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Section 4: Disponibilidade para servir em outra função (Opcional) */}
        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-stone-200/90 shadow-2xs space-y-2.5">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
              <MessageSquare size={16} />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-bold text-stone-900">
                Você também pode servir em outra função ou ministério neste mês? (Opcional)
              </label>
              <p className="text-xs text-stone-600 leading-relaxed mt-0.5">
                Informe em quê e em quais datas ou períodos. Essa resposta aparecerá diretamente para avaliação do pastor no painel administrativo, sem alterar suas funções fixas.
              </p>
            </div>
          </div>

          <textarea
            rows={3}
            value={suggestion}
            onChange={(e) => setSuggestion(e.target.value)}
            placeholder="Ex: Posso ajudar na equipe de som no primeiro domingo, ou tocar cajon se precisar no culto de jovens do dia 14..."
            className="w-full bg-stone-50 border border-stone-300 rounded-2xl p-3 text-xs sm:text-sm font-medium text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          />
        </div>

        {/* Floating Submit Bar (Mobile Friendly, 48px action) */}
        <div className="sticky bottom-16 sm:bottom-6 z-20 bg-white/95 backdrop-blur-md p-3.5 sm:p-4 rounded-3xl border border-amber-200/90 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-stone-800">Resumo:</span>
            <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 font-bold">
              {counts.disp} Disp.
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-rose-100 text-rose-800 font-bold">
              {counts.indisp} Indisp.
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-stone-200 text-stone-800 font-semibold">
              {counts.pend} Pendentes
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {saveSuccess && (
              <span className="text-xs font-bold text-emerald-700 animate-in fade-in">
                ✓ Disponibilidade enviada ao pastor com sucesso!
              </span>
            )}
            <button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto min-h-[48px] px-6 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] disabled:opacity-50"
            >
              <Send size={16} />
              <span>
                {isSaving
                  ? 'Enviando...'
                  : existingSubmission
                  ? 'Atualizar e Reenviar Disponibilidade'
                  : 'Enviar Disponibilidade do Mês'}
              </span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
