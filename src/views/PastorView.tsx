import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  getCurrentMonthKey,
  getSundaysOfMonth,
  formatSundayDate,
  generateMonthOptions,
} from '../utils/dateUtils';
import type { Member, SundayService, ScheduleAssignment } from '../types';
import { WhatsAppShareModal } from '../components/WhatsAppShareModal';
import { NewRepertoireSongModal } from '../components/NewRepertoireSongModal';
import { ScheduleAssignmentModal } from '../components/ScheduleAssignmentModal';
import { EditSongModal } from '../components/EditSongModal';
import { AddScheduleMemberModal } from '../components/AddScheduleMemberModal';
import {
  Calendar,
  Sun,
  Moon,
  Users,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Music2,
  Share2,
  Plus,
  Trash2,
  Check,
  Search,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Edit3,
} from 'lucide-react';

export const PastorView: React.FC = () => {
  const {
    members,
    services,
    availabilities,
    assignments,
    repertoire,
    setlistSongs,
    assignMemberToService,
    removeMemberFromService,
    publishService,
    addRepertoireSongToSetlist,
    removeSongFromSetlist,
    updateSetlistSong,
    updateRepertoireSong,
    removeRepertoireSong,
  } = useApp();

  // Mês selecionado
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(() => getCurrentMonthKey());
  const monthOptions = useMemo(() => generateMonthOptions(selectedMonthKey, 3), [selectedMonthKey]);

  const [year, month] = useMemo(() => {
    const [y, m] = selectedMonthKey.split('-').map(Number);
    return [y, m];
  }, [selectedMonthKey]);

  // Domingos do mês
  const sundays = useMemo(() => getSundaysOfMonth(year, month), [year, month]);

  // Domingo selecionado (padrão: primeiro domingo)
  const [selectedSundayDate, setSelectedSundayDate] = useState<string>(() => {
    return sundays[0] || `${selectedMonthKey}-04`;
  });

  // Atualiza selectedSundayDate quando o mês muda se não estiver na lista
  React.useEffect(() => {
    if (sundays.length > 0 && !sundays.includes(selectedSundayDate)) {
      setSelectedSundayDate(sundays[0]);
    }
  }, [sundays, selectedSundayDate]);

  // Período selecionado ('manha' ou 'noite')
  const [selectedPeriod, setSelectedPeriod] = useState<'manha' | 'noite'>('manha');

  // Culto atual ativo
  const currentService: SundayService | undefined = useMemo(() => {
    return services.find(
      (s) => s.date === selectedSundayDate && s.period === selectedPeriod
    );
  }, [services, selectedSundayDate, selectedPeriod]);

  // Modais
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isNewSongModalOpen, setIsNewSongModalOpen] = useState(false);
  const [assigningMember, setAssigningMember] = useState<Member | null>(null);
  const [isAddScheduleModalOpen, setIsAddScheduleModalOpen] = useState(false);
  const [assignmentToEdit, setAssignmentToEdit] = useState<{ memberId: string; role: string } | null>(null);
  const [editingSong, setEditingSong] = useState<{
    song: {
      id: string;
      title: string;
      artist: string;
      tone: string;
      link?: string;
      notes?: string;
    };
    type: 'repertoire' | 'setlist';
  } | null>(null);

  // Busca no repertório
  const [repertoireSearch, setRepertoireSearch] = useState('');
  const [musicTab, setMusicTab] = useState<'setlist' | 'repertoire'>('setlist');

  // Escala do culto atual
  const currentAssignments: (ScheduleAssignment & { member?: Member })[] = useMemo(() => {
    if (!currentService) return [];
    return assignments
      .filter((a) => a.serviceId === currentService.id)
      .map((a) => ({
        ...a,
        member: members.find((m) => m.id === a.memberId),
      }));
  }, [currentService, assignments, members]);

  // Músicas do culto atual (Setlist)
  const currentSetlist = useMemo(() => {
    if (!currentService) return [];
    return setlistSongs
      .filter((s) => s.serviceId === currentService.id)
      .sort((a, b) => a.order - b.order);
  }, [currentService, setlistSongs]);

  // Status de disponibilidade da equipe para o culto atual
  const { disponiveis, indisponiveis, pendentes } = useMemo(() => {
    if (!currentService) {
      return { disponiveis: [], indisponiveis: [], pendentes: [] };
    }

    const disp: Member[] = [];
    const indisp: Member[] = [];
    const pend: Member[] = [];

    members.forEach((m) => {
      const av = availabilities.find(
        (a) => a.serviceId === currentService.id && a.memberId === m.id
      );
      if (!av || av.status === 'pendente') {
        pend.push(m);
      } else if (av.status === 'disponivel') {
        disp.push(m);
      } else {
        indisp.push(m);
      }
    });

    return { disponiveis: disp, indisponiveis: indisp, pendentes: pend };
  }, [currentService, members, availabilities]);

  // Filtragem do repertório oficial
  const filteredRepertoire = useMemo(() => {
    const term = repertoireSearch.toLowerCase().trim();
    if (!term) return repertoire;
    return repertoire.filter(
      (r) =>
        r.title.toLowerCase().includes(term) ||
        r.artist.toLowerCase().includes(term) ||
        r.tone.toLowerCase().includes(term)
    );
  }, [repertoire, repertoireSearch]);

  const handlePrevSunday = () => {
    const idx = sundays.indexOf(selectedSundayDate);
    if (idx > 0) {
      setSelectedSundayDate(sundays[idx - 1]);
    }
  };

  const handleNextSunday = () => {
    const idx = sundays.indexOf(selectedSundayDate);
    if (idx >= 0 && idx < sundays.length - 1) {
      setSelectedSundayDate(sundays[idx + 1]);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-4 space-y-4">
      {/* 1. Header do Painel do Pastor */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/80 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#D96B0B] uppercase tracking-wider mb-0.5">
              <Sparkles size={13} />
              Gestão Pastoral
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
              Painel do Louvor
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Monitore respostas, defina instrumentos e organize o repertório oficial.
            </p>
          </div>

          {currentService && (
            <div className="flex items-center gap-1.5">
              {currentService.status === 'published' ? (
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[11px] font-bold border border-emerald-200 flex items-center gap-1">
                  <Check size={12} />
                  Publicado
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => publishService(currentService.id)}
                  className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-full text-[11px] font-semibold border border-stone-200 transition-colors"
                >
                  Rascunho • Publicar
                </button>
              )}
            </div>
          )}
        </div>

        {/* Mês Selector */}
        <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-stone-500 flex items-center gap-1">
            <Calendar size={14} className="text-[#D96B0B]" />
            Mês:
          </span>
          <select
            value={selectedMonthKey}
            onChange={(e) => setSelectedMonthKey(e.target.value)}
            className="bg-stone-50 text-xs font-bold text-stone-800 rounded-lg px-2.5 py-1.5 border border-stone-200 outline-none"
          >
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Seletor de Domingo e Período (Apenas Domingos do Mês) */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-xs space-y-3">
        {/* Carrossel de Domingos */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrevSunday}
            disabled={sundays.indexOf(selectedSundayDate) <= 0}
            className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 disabled:opacity-30 disabled:pointer-events-none text-stone-700 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="text-center">
            <span className="text-xs uppercase font-bold text-[#D96B0B] tracking-wider block">
              Culto Selecionado
            </span>
            <span className="text-sm sm:text-base font-extrabold text-stone-900">
              {formatSundayDate(selectedSundayDate)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleNextSunday}
            disabled={sundays.indexOf(selectedSundayDate) >= sundays.length - 1}
            className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 disabled:opacity-30 disabled:pointer-events-none text-stone-700 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Abas de Período (Manhã 09:30 vs Noite 19:00) */}
        <div className="grid grid-cols-2 p-1 bg-stone-100 rounded-xl border border-stone-200/80">
          <button
            type="button"
            onClick={() => setSelectedPeriod('manha')}
            className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              selectedPeriod === 'manha'
                ? 'bg-white text-amber-700 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Sun size={15} className="text-amber-500" />
            <span>Manhã (09:30)</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedPeriod('noite')}
            className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              selectedPeriod === 'noite'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Moon size={15} className="text-indigo-500" />
            <span>Noite (19:00)</span>
          </button>
        </div>
      </div>

      {/* 3. Disponibilidade da Equipe (com Instrumentos ao lado de cada nome) */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-[#D96B0B]" />
            <h2 className="text-sm font-bold text-stone-900">
              Disponibilidade da Equipe
            </h2>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {disponiveis.length} podem
            </span>
            <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
              {indisponiveis.length} não
            </span>
          </div>
        </div>

        {/* 3.1 Lista dos Disponíveis */}
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50/80 px-2.5 py-1 rounded-lg mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <CheckCircle2 size={13} className="text-emerald-600" />
              Disponíveis para este culto ({disponiveis.length})
            </span>
            <span className="text-[10px] text-emerald-700 font-normal">
              Toque para escalar ou mudar instrumento
            </span>
          </div>

          {disponiveis.length === 0 ? (
            <p className="text-xs text-stone-400 py-2 italic text-center">
              Nenhum integrante disponível informado ainda para este culto.
            </p>
          ) : (
            <div className="space-y-2">
              {disponiveis.map((member) => {
                const assigned = currentAssignments.find((a) => a.memberId === member.id);
                return (
                  <div
                    key={member.id}
                    className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                      assigned
                        ? 'bg-amber-50/50 border-amber-200'
                        : 'bg-stone-50/80 hover:bg-stone-100 border-stone-200'
                    }`}
                  >
                    {/* Nome + Instrumentos que a pessoa toca */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs sm:text-sm text-stone-900">
                          {member.name}
                        </span>
                        {assigned && (
                          <span className="px-2 py-0.5 bg-[#D96B0B] text-white text-[10px] font-bold rounded-full">
                            Escalado: {assigned.role}
                          </span>
                        )}
                      </div>

                      {/* Instrumentos cadastrados exibidos claramente */}
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        <span className="text-[11px] text-stone-500 font-medium">Toca:</span>
                        {member.roles.map((r) => (
                          <span
                            key={r}
                            className="px-2 py-0.5 bg-white text-stone-700 border border-stone-200 rounded-md text-[10px] font-semibold"
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Botão de Ação: Escalar / Alterar Instrumento */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setAssigningMember(member)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          assigned
                            ? 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                            : 'bg-[#D96B0B] hover:bg-[#B85505] text-white shadow-xs'
                        }`}
                      >
                        {assigned ? 'Alterar Instrumento' : '+ Escalar no Culto'}
                      </button>

                      {assigned && currentService && (
                        <button
                          type="button"
                          onClick={() => removeMemberFromService(currentService.id, member.id)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                          title="Remover da escala"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 3.2 Lista de Indisponíveis e Pendentes (Sanfona/Resumo) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-stone-100">
          {/* Indisponíveis */}
          <div className="bg-rose-50/50 rounded-xl p-2.5 border border-rose-100">
            <span className="text-[11px] font-bold text-rose-800 flex items-center gap-1 mb-1">
              <XCircle size={12} className="text-rose-600" />
              Não podem ({indisponiveis.length}):
            </span>
            {indisponiveis.length === 0 ? (
              <span className="text-[11px] text-stone-400 italic">Ninguém</span>
            ) : (
              <div className="text-xs text-stone-700 space-y-0.5">
                {indisponiveis.map((m) => (
                  <div key={m.id} className="truncate">
                    • {m.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pendentes */}
          <div className="bg-stone-50 rounded-xl p-2.5 border border-stone-200">
            <span className="text-[11px] font-bold text-stone-600 flex items-center gap-1 mb-1">
              <HelpCircle size={12} className="text-stone-400" />
              Ainda não responderam ({pendentes.length}):
            </span>
            {pendentes.length === 0 ? (
              <span className="text-[11px] text-emerald-700 font-medium">Todos responderam!</span>
            ) : (
              <div className="text-xs text-stone-600 space-y-0.5">
                {pendentes.map((m) => (
                  <div key={m.id} className="truncate">
                    • {m.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Escala Oficial do Culto (Louvor, Som, Multimídia, Foto...) */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-sm font-bold text-stone-900">
              Escala Oficial do Culto
            </h2>
            <p className="text-xs text-stone-500">
              Louvor, Som, Multimídia, Foto & Equipe Geral
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#D96B0B] bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">
              {currentAssignments.length} escalados
            </span>
            {currentService && (
              <button
                type="button"
                onClick={() => {
                  setAssignmentToEdit(null);
                  setIsAddScheduleModalOpen(true);
                }}
                className="px-2.5 py-1.5 bg-[#D96B0B] hover:bg-[#B85505] text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition-all active:scale-98"
              >
                <Plus size={14} />
                <span>+ Adicionar na Escala</span>
              </button>
            )}
          </div>
        </div>

        {currentAssignments.length === 0 ? (
          <div className="text-center py-6 px-4 bg-stone-50 rounded-xl border border-dashed border-stone-200 text-stone-400 text-xs">
            Nenhum integrante escalado para este culto ainda.
            <br />
            Clique em <strong>"+ Adicionar na Escala"</strong> acima para escalar Louvor, Som, Foto ou Multimídia.
          </div>
        ) : (
          <div className="space-y-1.5">
            {currentAssignments.map((item) => (
              <div
                key={item.memberId}
                className="flex items-center justify-between p-2.5 bg-stone-50 hover:bg-stone-100/70 rounded-xl border border-stone-200 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-[#D96B0B]" />
                  <div>
                    <span className="text-xs font-extrabold text-[#D96B0B] uppercase tracking-wide mr-2">
                      {item.role}:
                    </span>
                    <span className="text-xs font-semibold text-stone-900">
                      {item.member?.name || 'A definir'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAssignmentToEdit({ memberId: item.memberId, role: item.role });
                      setIsAddScheduleModalOpen(true);
                    }}
                    className="text-[11px] text-stone-600 hover:text-[#D96B0B] px-2 py-1 rounded-md hover:bg-orange-50 transition-colors font-semibold flex items-center gap-1"
                    title="Editar função ou trocar integrante"
                  >
                    <Edit3 size={12} />
                    <span>Editar</span>
                  </button>
                  {currentService && (
                    <button
                      type="button"
                      onClick={() => removeMemberFromService(currentService.id, item.memberId)}
                      className="p-1 text-stone-400 hover:text-rose-600 rounded-md"
                      title="Remover da escala"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Músicas: "Músicas que vamos tocar" (Setlist) vs "Músicas que já tocamos" (Repertório oficial) */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music2 size={18} className="text-[#D96B0B]" />
            <div>
              <h2 className="text-sm font-bold text-stone-900">Repertório & Louvores</h2>
              <p className="text-xs text-stone-500">Tons e versões de referência fixados</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsNewSongModalOpen(true)}
            className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-[#D96B0B] border border-orange-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
          >
            <Plus size={14} />
            <span>Cadastrar Louvor</span>
          </button>
        </div>

        {/* Abas: Setlist do Culto vs Acervo Oficial */}
        <div className="grid grid-cols-2 p-1 bg-stone-100 rounded-xl border border-stone-200/80">
          <button
            type="button"
            onClick={() => setMusicTab('setlist')}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              musicTab === 'setlist'
                ? 'bg-white text-[#D96B0B] shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <span>Músicas que vamos tocar ({currentSetlist.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setMusicTab('repertoire')}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              musicTab === 'repertoire'
                ? 'bg-white text-[#D96B0B] shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <span>Músicas que já tocamos ({repertoire.length})</span>
          </button>
        </div>

        {/* Conteúdo da Aba 1: Setlist do Culto */}
        {musicTab === 'setlist' && (
          <div className="space-y-2 pt-1">
            {currentSetlist.length === 0 ? (
              <div className="text-center py-6 px-4 bg-stone-50 rounded-xl border border-dashed border-stone-200 text-stone-400 text-xs">
                Nenhum louvor adicionado à setlist deste culto.
                <br />
                Vá na aba <strong>"Músicas que já tocamos"</strong> para incluir com 1 clique!
              </div>
            ) : (
              currentSetlist.map((song, index) => (
                <div
                  key={song.id}
                  className="p-3 bg-stone-50 hover:bg-stone-100/70 rounded-xl border border-stone-200/80 flex items-center justify-between gap-2 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-orange-100 text-[#D96B0B] text-xs font-black flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-stone-900">
                          {song.title}
                        </span>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-black">
                          Tom: {song.tone}
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-500 font-medium">
                        Versão / Cantor: <strong className="text-stone-700">{song.artist}</strong>
                      </div>
                      {song.notes && (
                        <div className="text-[10px] text-stone-400 italic mt-0.5">
                          {song.notes}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {song.link && (
                      <a
                        href={song.link}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-stone-400 hover:text-stone-900 rounded-lg hover:bg-stone-200 transition-colors"
                        title="Abrir cifra ou vídeo"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => setEditingSong({ song, type: 'setlist' })}
                      className="p-1.5 text-stone-500 hover:text-[#D96B0B] rounded-lg hover:bg-orange-50 transition-colors"
                      title="Editar tom ou versão desta música no culto"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSongFromSetlist(song.id)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Remover do culto"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Conteúdo da Aba 2: Repertório Oficial da Igreja */}
        {musicTab === 'repertoire' && (
          <div className="space-y-3 pt-1">
            {/* Campo de Busca */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                <Search size={15} />
              </div>
              <input
                type="text"
                value={repertoireSearch}
                onChange={(e) => setRepertoireSearch(e.target.value)}
                placeholder="Buscar por música, cantor ou tom..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 text-xs outline-none focus:border-[#D96B0B]"
              />
            </div>

            {/* Lista com botão de 1 toque para adicionar */}
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {filteredRepertoire.map((rep) => {
                const isAlreadyInService = currentSetlist.some((s) => s.title === rep.title);
                return (
                  <div
                    key={rep.id}
                    className="p-3 bg-stone-50 hover:bg-stone-100 rounded-xl border border-stone-200/80 flex items-center justify-between gap-2 transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-stone-900">
                          {rep.title}
                        </span>
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-bold">
                          Tom: {rep.tone}
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-500 font-medium">
                        Cantor Oficial: <strong className="text-stone-700">{rep.artist}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {rep.link && (
                        <a
                          href={rep.link}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-stone-400 hover:text-stone-800 rounded-lg hover:bg-stone-200"
                          title="Abrir cifra"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => setEditingSong({ song: rep, type: 'repertoire' })}
                        className="p-1.5 text-stone-500 hover:text-[#D96B0B] rounded-lg hover:bg-orange-50 transition-colors"
                        title="Editar tom ou versão no repertório oficial"
                      >
                        <Edit3 size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Remover "${rep.title}" do repertório oficial da igreja?`)) {
                            removeRepertoireSong(rep.id);
                          }
                        }}
                        className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Excluir do repertório"
                      >
                        <Trash2 size={14} />
                      </button>

                      {currentService && (
                        <button
                          type="button"
                          onClick={() => addRepertoireSongToSetlist(currentService.id, rep.id)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                            isAlreadyInService
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-[#D96B0B] hover:bg-[#B85505] text-white shadow-xs'
                          }`}
                        >
                          {isAlreadyInService ? (
                            <>
                              <Check size={13} />
                              No Culto
                            </>
                          ) : (
                            <>
                              <Plus size={13} />
                              + Adicionar
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 6. Ação de Compartilhar no WhatsApp */}
      {currentService && (
        <div className="sticky bottom-4 z-20 pt-2 safe-area-pb">
          <button
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            className="w-full py-4 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-600/25 active:scale-98 flex items-center justify-center gap-2.5"
          >
            <Share2 size={18} />
            <span>Compartilhar Escala & Louvores no WhatsApp</span>
          </button>
        </div>
      )}

      {/* Modais do Pastor */}
      {currentService && (
        <WhatsAppShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          service={currentService}
          assignments={currentAssignments}
          songs={currentSetlist}
        />
      )}

      <NewRepertoireSongModal
        isOpen={isNewSongModalOpen}
        onClose={() => setIsNewSongModalOpen(false)}
        serviceIdToAddTo={currentService?.id}
      />

      {assigningMember && currentService && (
        <ScheduleAssignmentModal
          isOpen={!!assigningMember}
          onClose={() => setAssigningMember(null)}
          service={currentService}
          member={assigningMember}
          currentRole={currentAssignments.find((a) => a.memberId === assigningMember.id)?.role}
          onAssign={assignMemberToService}
        />
      )}

      {editingSong && (
        <EditSongModal
          isOpen={!!editingSong}
          onClose={() => setEditingSong(null)}
          song={editingSong.song}
          type={editingSong.type}
          onSave={(id, updated) => {
            if (editingSong.type === 'repertoire') {
              updateRepertoireSong(id, updated);
            } else {
              updateSetlistSong(id, updated);
            }
          }}
        />
      )}

      {currentService && (
        <AddScheduleMemberModal
          isOpen={isAddScheduleModalOpen}
          onClose={() => {
            setIsAddScheduleModalOpen(false);
            setAssignmentToEdit(null);
          }}
          service={currentService}
          members={members}
          existingAssignments={assignments}
          assignmentToEdit={assignmentToEdit}
          onSave={assignMemberToService}
        />
      )}
    </div>
  );
};
