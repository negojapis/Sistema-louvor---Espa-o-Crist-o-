import React, { useState } from 'react';
import type { Service, AvailabilityStatus } from '../types';
import { useApp } from '../context/AppContext';
import { AvailabilityBadge } from './AvailabilityBadge';
import {
  X,
  Calendar,
  Clock,
  Music,
  Users,
  CheckCircle2,
  XCircle,
  Pencil,
  Trash2,
  ExternalLink,
  Plus,
  Share2,
  Check,
  Eye,
  EyeOff,
  LayoutGrid,
  Table as TableIcon,
  MessageCircle,
} from 'lucide-react';
import { generateWhatsAppScheduleText, copyToClipboard } from '../utils/whatsapp';

interface Props {
  service: Service;
  onClose: () => void;
  onOpenScheduleBuilder: (service: Service) => void;
  onOpenSongEditor: (service: Service) => void;
  onEditService: (service: Service) => void;
  onOpenWhatsAppShare?: (service: Service) => void;
}

export const ServiceDetailModal: React.FC<Props> = ({
  service,
  onClose,
  onOpenScheduleBuilder,
  onOpenSongEditor,
  onEditService,
  onOpenWhatsAppShare,
}) => {
  const {
    isAdmin,
    currentMember,
    getMemberAvailability,
    setMemberAvailability,
    getServiceSchedule,
    getServiceSongs,
    toggleServiceStatus,
    deleteService,
    members,
    deleteSong,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'escala' | 'repertorio' | 'respostas'>('escala');
  const [scheduleViewFormat, setScheduleViewFormat] = useState<'auto' | 'cards' | 'table'>('auto');
  const [copiedLink, setCopiedLink] = useState(false);

  const myAvailability: AvailabilityStatus = currentMember
    ? getMemberAvailability(service.id, currentMember.id)
    : 'pendente';

  const schedule = getServiceSchedule(service.id);
  const songs = getServiceSongs(service.id);

  const formattedDate = (() => {
    try {
      const [year, month, day] = service.date.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      return d.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return service.date;
    }
  })();

  const isPublished = service.status === 'published';

  const handleCopySummary = async () => {
    const text = generateWhatsAppScheduleText({ service, schedule, songs });
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleDeleteService = async () => {
    if (confirm(`Tem certeza que deseja excluir o culto "${service.title}"?`)) {
      await deleteService(service.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-6 animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-stone-50/90 border-b border-stone-200 p-3.5 sm:p-6 flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-200/80">
                <Calendar size={13} className="text-amber-700 shrink-0" />
                <span className="truncate">{formattedDate}</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:py-1 rounded-full text-xs font-semibold bg-stone-200/70 text-stone-700">
                <Clock size={13} />
                {service.time}
              </span>

              {isPublished ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  Publicada
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                  Rascunho
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-2xl font-bold text-stone-900 leading-snug break-words">
                {service.title}
              </h2>
              {isAdmin && (
                <button
                  onClick={() => onEditService(service)}
                  className="p-1 rounded-lg text-stone-400 hover:text-amber-800 transition-colors shrink-0"
                  title="Editar dados do culto"
                >
                  <Pencil size={16} />
                </button>
              )}
            </div>

            {service.notes && (
              <p className="text-xs sm:text-sm text-stone-700 mt-1 leading-relaxed break-words">
                {service.notes}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors shrink-0 touch-target"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Member Availability Response Box (Apenas para integrantes da equipe; o pastor não precisa de disponibilidade) */}
        {currentMember && !isAdmin && (
          <div className="bg-amber-50/70 border-b border-amber-200/60 p-3 sm:p-4 shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="min-w-0">
                <p className="text-xs font-bold text-amber-950 uppercase tracking-wide truncate">
                  Sua Disponibilidade ({currentMember.name}):
                </p>
                <p className="text-[11px] sm:text-xs text-amber-800 mt-0.5">
                  Informe se você pode ministrar neste culto. Você pode alterar a qualquer momento.
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setMemberAvailability(service.id, 'disponivel')}
                  className={`flex-1 sm:flex-none px-3.5 py-2.5 min-h-[44px] rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                    myAvailability === 'disponivel'
                      ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/30'
                      : 'bg-white hover:bg-emerald-50 text-stone-700 hover:text-emerald-700 border border-stone-200'
                  }`}
                >
                  <CheckCircle2 size={16} />
                  <span>Disponível</span>
                </button>

                <button
                  onClick={() => setMemberAvailability(service.id, 'indisponivel')}
                  className={`flex-1 sm:flex-none px-3.5 py-2.5 min-h-[44px] rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                    myAvailability === 'indisponivel'
                      ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-500/30'
                      : 'bg-white hover:bg-rose-50 text-stone-700 hover:text-rose-700 border border-stone-200'
                  }`}
                >
                  <XCircle size={16} />
                  <span>Indisponível</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs inside modal (Horizontal scrollable with no scrollbar) */}
        <div className="flex border-b border-stone-200 px-3 sm:px-6 bg-white shrink-0 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('escala')}
            className={`py-3 px-3 sm:px-4 font-semibold text-xs sm:text-sm border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap min-h-[44px] ${
              activeTab === 'escala'
                ? 'border-amber-600 text-amber-900'
                : 'border-transparent text-stone-700 hover:text-stone-900'
            }`}
          >
            <Users size={16} />
            <span>Escala ({schedule.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('repertorio')}
            className={`py-3 px-3 sm:px-4 font-semibold text-xs sm:text-sm border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap min-h-[44px] ${
              activeTab === 'repertorio'
                ? 'border-amber-600 text-amber-900'
                : 'border-transparent text-stone-700 hover:text-stone-900'
            }`}
          >
            <Music size={16} />
            <span>Músicas ({songs.length})</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => setActiveTab('respostas')}
              className={`py-3 px-3 sm:px-4 font-semibold text-xs sm:text-sm border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap min-h-[44px] ${
                activeTab === 'respostas'
                  ? 'border-amber-600 text-amber-900'
                  : 'border-transparent text-stone-700 hover:text-stone-900'
              }`}
            >
              <CheckCircle2 size={16} />
              <span>Respostas da Equipe</span>
            </button>
          )}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-3.5 sm:p-6 overflow-y-auto space-y-4">
          {/* TAB 1: ESCALA */}
          {activeTab === 'escala' && (
            <div>
              {!isAdmin && !isPublished ? (
                <div className="text-center py-10 px-4 bg-stone-50 rounded-2xl border border-stone-200/80">
                  <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-3">
                    <Clock size={24} />
                  </div>
                  <h4 className="text-base font-bold text-stone-900">Escala em Elaboração</h4>
                  <p className="text-xs sm:text-sm text-stone-700 max-w-md mx-auto mt-1 leading-relaxed">
                    A liderança do louvor está montando a equipe para este culto. Assim que a escala for
                    publicada, você poderá visualizar todos os integrantes e funções aqui.
                  </p>
                </div>
              ) : schedule.length === 0 ? (
                <div className="text-center py-10 px-4 bg-stone-50 rounded-2xl border border-stone-200/80">
                  <div className="w-12 h-12 rounded-full bg-stone-200 text-stone-600 flex items-center justify-center mx-auto mb-3">
                    <Users size={24} />
                  </div>
                  <h4 className="text-base font-bold text-stone-900">Nenhum integrante escalado ainda</h4>
                  <p className="text-xs sm:text-sm text-stone-700 max-w-md mx-auto mt-1">
                    {isAdmin
                      ? 'Clique no botão abaixo para selecionar os integrantes e suas funções.'
                      : 'Aguarde a liderança publicar a escala.'}
                  </p>
                  {isAdmin && (
                    <button
                      onClick={() => onOpenScheduleBuilder(service)}
                      className="mt-4 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors shadow-2xs inline-flex items-center gap-1.5"
                    >
                      <Plus size={16} />
                      Montar Escala Manualmente
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <p className="text-xs font-bold text-stone-700 uppercase tracking-wide">
                      Integrantes Escalados ({schedule.length})
                    </p>

                    <div className="flex items-center gap-2">
                      {/* Responsive format switcher: On tablet/desktop allow switching table vs cards */}
                      <div className="hidden sm:flex items-center bg-stone-100 p-0.5 rounded-lg text-xs font-medium">
                        <button
                          onClick={() => setScheduleViewFormat('cards')}
                          className={`px-2 py-1 rounded-md flex items-center gap-1 ${
                            scheduleViewFormat === 'cards' || scheduleViewFormat === 'auto'
                              ? 'bg-white shadow-2xs font-bold text-stone-900'
                              : 'text-stone-600'
                          }`}
                          title="Exibir em Cartões"
                        >
                          <LayoutGrid size={13} />
                          <span>Cartões</span>
                        </button>
                        <button
                          onClick={() => setScheduleViewFormat('table')}
                          className={`px-2 py-1 rounded-md flex items-center gap-1 ${
                            scheduleViewFormat === 'table'
                              ? 'bg-white shadow-2xs font-bold text-stone-900'
                              : 'text-stone-600'
                          }`}
                          title="Exibir em Tabela"
                        >
                          <TableIcon size={13} />
                          <span>Tabela</span>
                        </button>
                      </div>

                      {isAdmin && (
                        <button
                          onClick={() => onOpenScheduleBuilder(service)}
                          className="text-xs font-semibold text-amber-800 hover:text-amber-900 flex items-center gap-1"
                        >
                          <Pencil size={14} /> Editar Escala
                        </button>
                      )}
                    </div>
                  </div>

                  {/* CARDS VIEW (Divided into Louvor & Condução and Multimídia) */}
                  {scheduleViewFormat !== 'table' && (
                    <div className="space-y-4">
                      {/* Louvor & Condução */}
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 mb-2">
                          🎵 Louvor & Condução
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {schedule
                            .filter((item) => item.ministry_section !== 'multimidia')
                            .map((item, idx) => {
                              const isMe = currentMember && item.member_id === currentMember.id;
                              return (
                                <div
                                  key={item.id || idx}
                                  className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                                    item.hasConflict
                                      ? 'bg-rose-50/80 border-rose-300 ring-1 ring-rose-200'
                                      : isMe
                                      ? 'bg-amber-50/90 border-amber-300 ring-1 ring-amber-200'
                                      : 'bg-white border-stone-200/90 shadow-2xs'
                                  }`}
                                >
                                  <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div
                                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                                        item.hasConflict
                                          ? 'bg-rose-600 text-white'
                                          : isMe
                                          ? 'bg-amber-600 text-white'
                                          : 'bg-stone-100 text-stone-700'
                                      }`}
                                    >
                                      {item.member?.name ? item.member.name.charAt(0).toUpperCase() : '?'}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="font-bold text-stone-900 text-xs sm:text-sm truncate">
                                        {item.member?.name || 'Integrante não encontrado'}
                                        {isMe && (
                                          <span className="ml-1.5 text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                                            Você
                                          </span>
                                        )}
                                      </p>
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold bg-stone-100 text-stone-700 border border-stone-200/60 max-w-full truncate">
                                          {item.role_name}
                                        </span>
                                        {item.hasConflict && (
                                          <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-rose-600 text-white">
                                            ⚠️ Indisponível
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>

                      {/* Multimídia (Som, Luz, Projeção) */}
                      {schedule.some((item) => item.ministry_section === 'multimidia') && (
                        <div className="pt-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900 mb-2">
                            🎛️ Multimídia (Som, Luz e Projeção)
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {schedule
                              .filter((item) => item.ministry_section === 'multimidia')
                              .map((item, idx) => {
                                const isMe = currentMember && item.member_id === currentMember.id;
                                return (
                                  <div
                                    key={item.id || idx}
                                    className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                                      item.hasConflict
                                        ? 'bg-rose-50/80 border-rose-300 ring-1 ring-rose-200'
                                        : isMe
                                        ? 'bg-purple-50/90 border-purple-300 ring-1 ring-purple-200'
                                        : 'bg-white border-purple-200/90 shadow-2xs'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                      <div
                                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                                          item.hasConflict
                                            ? 'bg-rose-600 text-white'
                                            : isMe
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-purple-100 text-purple-800'
                                        }`}
                                      >
                                        {item.member?.name ? item.member.name.charAt(0).toUpperCase() : '?'}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="font-bold text-stone-900 text-xs sm:text-sm truncate">
                                          {item.member?.name || 'Voluntário de Multimídia'}
                                          {item.member?.is_leader && (
                                            <span className="ml-1 text-[10px] text-purple-700 font-bold bg-purple-100 px-1.5 py-0.5 rounded">
                                              Líder
                                            </span>
                                          )}
                                        </p>
                                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-800 border border-purple-200/60 max-w-full truncate">
                                          {item.role_name}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TABLE VIEW (For tablets and computers when requested) */}
                  {scheduleViewFormat === 'table' && (
                    <div className="overflow-x-auto border border-stone-200 rounded-2xl hidden sm:block">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase text-[10px] tracking-wider">
                          <tr>
                            <th className="py-2.5 px-3 w-12 text-center">#</th>
                            <th className="py-2.5 px-3">Seção</th>
                            <th className="py-2.5 px-3">Função</th>
                            <th className="py-2.5 px-3">Integrante</th>
                            <th className="py-2.5 px-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {schedule.map((item, idx) => {
                            const isMe = currentMember && item.member_id === currentMember.id;
                            const avail = item.member ? getMemberAvailability(service.id, item.member.id) : 'pendente';
                            const isMultimidia = item.ministry_section === 'multimidia';

                            return (
                              <tr
                                key={item.id || idx}
                                className={
                                  item.hasConflict
                                    ? 'bg-rose-50/70 font-semibold text-rose-900'
                                    : isMe
                                    ? 'bg-amber-50/50 font-semibold'
                                    : 'hover:bg-stone-50'
                                }
                              >
                                <td className="py-2.5 px-3 text-center text-stone-500">{idx + 1}</td>
                                <td className="py-2.5 px-3 font-semibold text-[11px]">
                                  {isMultimidia ? (
                                    <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                                      Multimídia
                                    </span>
                                  ) : (
                                    <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                      Louvor
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 font-bold text-stone-900">{item.role_name}</td>
                                <td className="py-2.5 px-3 text-stone-800">
                                  {item.member?.name || 'Não atribuído'}
                                  {isMe && <span className="ml-1 text-[10px] text-amber-700 font-bold">(Você)</span>}
                                  {item.member?.is_leader && (
                                    <span className="ml-1 text-[10px] text-purple-700 font-bold">(Líder)</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3">
                                  {item.hasConflict ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-600 text-white">
                                      ⚠️ Indisponível
                                    </span>
                                  ) : (
                                    <AvailabilityBadge status={avail} size="sm" />
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: REPERTÓRIO */}
          {activeTab === 'repertorio' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-stone-700 uppercase tracking-wide">
                  Músicas em Ordem de Apresentação
                </p>
                {isAdmin && (
                  <button
                    onClick={() => onOpenSongEditor(service)}
                    className="text-xs font-semibold text-amber-800 hover:text-amber-900 flex items-center gap-1 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200/80 min-h-[36px]"
                  >
                    <Plus size={14} /> Adicionar Música
                  </button>
                )}
              </div>

              {songs.length === 0 ? (
                <div className="text-center py-10 px-4 bg-stone-50 rounded-2xl border border-stone-200/80">
                  <div className="w-12 h-12 rounded-full bg-stone-200 text-stone-600 flex items-center justify-center mx-auto mb-3">
                    <Music size={24} />
                  </div>
                  <h4 className="text-base font-bold text-stone-900">Nenhuma música cadastrada</h4>
                  <p className="text-xs sm:text-sm text-stone-700 max-w-md mx-auto mt-1">
                    {isAdmin
                      ? 'Adicione as músicas com tom e links de referência para a equipe ensaiar.'
                      : 'O repertório deste culto ainda não foi definido.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {songs.map((song, idx) => (
                    <div
                      key={song.id || idx}
                      className="p-3 sm:p-3.5 rounded-2xl bg-white border border-stone-200/90 shadow-2xs flex items-center justify-between gap-3 hover:border-amber-300 transition-colors"
                    >
                      <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-stone-100 text-stone-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                          {idx + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-stone-900 text-xs sm:text-sm break-words leading-tight">
                            {song.title}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            {song.tone && (
                              <span className="text-[10px] sm:text-[11px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-200/60">
                                Tom: {song.tone}
                              </span>
                            )}
                            {song.link && (
                              <a
                                href={song.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] sm:text-[11px] text-stone-600 hover:text-stone-900 hover:underline flex items-center gap-1 font-medium bg-stone-50 px-2 py-0.5 rounded-md border border-stone-200"
                              >
                                <span>Ver referência</span>
                                <ExternalLink size={11} />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      {isAdmin && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => deleteSong(song.id)}
                            className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors touch-target"
                            title="Remover música"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: RESPOSTAS DA EQUIPE (Admin Only) */}
          {activeTab === 'respostas' && isAdmin && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-stone-700 uppercase tracking-wide mb-1">
                  Resumo de Disponibilidade da Equipe
                </p>
                <p className="text-xs text-stone-700 mb-3">
                  Acompanhe em tempo real quem pode ministrar neste culto.
                </p>
              </div>

              <div className="space-y-2">
                {members
                  .filter((m) => m.active)
                  .map((member) => {
                    const status = getMemberAvailability(service.id, member.id);
                    return (
                      <div
                        key={member.id}
                        className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                      >
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-stone-900 truncate">
                            {member.name}
                          </p>
                          <p className="text-[11px] text-stone-700 truncate">
                            {member.roles.join(', ') || 'Nenhuma função vinculada'}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 justify-between sm:justify-end">
                          <AvailabilityBadge status={status} size="sm" />

                          <select
                            value={status}
                            onChange={(e) =>
                              setMemberAvailability(
                                service.id,
                                e.target.value as AvailabilityStatus,
                                member.id
                              )
                            }
                            className="text-xs bg-white border border-stone-300 rounded-xl px-2.5 py-1.5 text-stone-700 font-medium min-h-[36px]"
                          >
                            <option value="disponivel">Disponível</option>
                            <option value="indisponivel">Indisponível</option>
                            <option value="pendente">Pendente</option>
                          </select>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer / Actions */}
        <div className="bg-stone-50 border-t border-stone-200 p-3 sm:px-6 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopySummary}
              className="py-2 px-3 min-h-[40px] rounded-xl border border-stone-200 bg-white hover:bg-stone-100 text-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              {copiedLink ? (
                <>
                  <Check size={15} className="text-emerald-600" />
                  <span className="text-emerald-700">Copiado!</span>
                </>
              ) : (
                <>
                  <Share2 size={15} className="text-stone-500" />
                  <span>Copiar Resumo</span>
                </>
              )}
            </button>

            {/* WhatsApp Share Button */}
            {onOpenWhatsAppShare && (
              <button
                type="button"
                onClick={() => onOpenWhatsAppShare(service)}
                className="py-2 px-3 sm:px-3.5 min-h-[40px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                title="Publicar ou copiar escala no WhatsApp"
              >
                <MessageCircle size={15} />
                <span>WhatsApp</span>
              </button>
            )}

            {isAdmin && (
              <button
                onClick={handleDeleteService}
                className="p-2 min-h-[40px] rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Excluir este culto"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {isAdmin && (
              <>
                <button
                  onClick={() => toggleServiceStatus(service.id)}
                  className={`py-2 px-3 min-h-[40px] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    isPublished
                      ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                  }`}
                >
                  {isPublished ? (
                    <>
                      <EyeOff size={15} />
                      <span className="hidden sm:inline">Rascunho</span>
                    </>
                  ) : (
                    <>
                      <Eye size={15} />
                      <span>Publicar</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => onOpenScheduleBuilder(service)}
                  className="py-2 px-3.5 min-h-[40px] rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Pencil size={15} className="text-amber-400" />
                  <span>Editar Escala</span>
                </button>
              </>
            )}

            {!isAdmin && (
              <button
                onClick={onClose}
                className="py-2 px-5 min-h-[40px] rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 transition-colors"
              >
                Fechar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
