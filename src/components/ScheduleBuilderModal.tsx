import React, { useState } from 'react';
import type { Service } from '../types';
import { DEFAULT_MINISTRY_ROLES } from '../types';
import { useApp } from '../context/AppContext';
import { AvailabilityBadge } from './AvailabilityBadge';
import {
  X,
  Plus,
  Trash2,
  AlertTriangle,
  Eye,
  Save,
} from 'lucide-react';

interface Props {
  service: Service;
  onClose: () => void;
  onSuccess: () => void;
}

interface DraftAssignment {
  member_id: string;
  role_name: string;
}

export const STANDARD_BAND_FORMATION = [
  'Voz',
  'Voz',
  'Voz',
  'Violão',
  'Baixo',
  'Teclado',
  'Bateria',
];

export function getRoleIcon(role: string): string {
  const r = role.toLowerCase();
  if (r.includes('voz') || r.includes('vocal') || r.includes('canto')) return '🎤';
  if (r.includes('violão') || r.includes('violao')) return '🎸';
  if (r.includes('baixo')) return '🎸';
  if (r.includes('guitarra')) return '🎸';
  if (r.includes('teclado') || r.includes('piano')) return '🎹';
  if (r.includes('bateria')) return '🥁';
  if (r.includes('cajon') || r.includes('cajón')) return '🪘';
  if (r.includes('som')) return '🎚️';
  if (r.includes('luz')) return '💡';
  if (r.includes('proje')) return '📽️';
  if (r.includes('ministra') || r.includes('palavra')) return '📖';
  return '🎵';
}

export function isMemberQualifiedForRole(roles: string[] | undefined, roleName: string): boolean {
  if (!roles || roles.length === 0) return false;

  const target = roleName.trim().toLowerCase();

  return roles.some((r) => {
    const mr = r.trim().toLowerCase();

    // 1. Igualdade direta
    if (mr === target) return true;

    // 2. Voz / Canto / Vocal
    const isTargetVoice = target.includes('voz') || target.includes('vocal') || target.includes('canto');
    const isMemberVoice = mr.includes('voz') || mr.includes('vocal') || mr.includes('canto');
    if (isTargetVoice && isMemberVoice) return true;

    // 3. Teclado / Piano
    const isTargetKeys = target.includes('teclado') || target.includes('piano');
    const isMemberKeys = mr.includes('teclado') || mr.includes('piano');
    if (isTargetKeys && isMemberKeys) return true;

    // 4. Bateria
    if (target.includes('bateria') && mr.includes('bateria')) return true;

    // 5. Violão
    if (
      (target.includes('violão') || target.includes('violao')) &&
      (mr.includes('violão') || mr.includes('violao'))
    ) {
      return true;
    }

    // 6. Guitarra
    if (target.includes('guitarra') && mr.includes('guitarra')) return true;

    // 7. Baixo
    if (target.includes('baixo') && mr.includes('baixo')) return true;

    // 8. Cajon
    if (
      (target.includes('cajon') || target.includes('cajón')) &&
      (mr.includes('cajon') || mr.includes('cajón'))
    ) {
      return true;
    }

    // 9. Ministração e Condução
    if (target.includes('ministra') && mr.includes('ministra')) return true;
    if (target.includes('palavra') && mr.includes('palavra')) return true;

    // 10. Multimídia
    if (target.includes('som') && mr.includes('som')) return true;
    if (target.includes('luz') && mr.includes('luz')) return true;
    if (target.includes('proje') && mr.includes('proje')) return true;

    return false;
  });
}

export const ScheduleBuilderModal: React.FC<Props> = ({ service, onClose, onSuccess }) => {
  const {
    members,
    getMemberAvailability,
    saveSchedule,
    scheduleAssignments,
  } = useApp();

  // Inicialização: Se já tem escala para este culto, carrega ela.
  // Caso contrário, inicia com o padrão solicitado: 3 vozes, 1 violão, 1 baixo, 1 teclado e 1 baterista.
  const [assignments, setAssignments] = useState<DraftAssignment[]>(() => {
    const existing = scheduleAssignments
      .filter((s) => s.service_id === service.id)
      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

    if (existing.length > 0) {
      return existing.map((e) => ({
        member_id: e.member_id,
        role_name: e.role_name,
      }));
    }

    return STANDARD_BAND_FORMATION.map((role_name) => ({
      member_id: '',
      role_name,
    }));
  });

  // Controle de exibição por posição (padrão: filtrado por função; se o pastor clicar em "Mostrar todos", expande apenas para essa posição)
  const [showAllPerPosition, setShowAllPerPosition] = useState<Record<number, boolean>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleShowAll = (index: number) => {
    setShowAllPerPosition((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleAddRow = (role = 'Voz') => {
    setAssignments((prev) => [...prev, { member_id: '', role_name: role }]);
  };

  const handleRemoveRow = (index: number) => {
    setAssignments((prev) => prev.filter((_, i) => i !== index));
    // Limpa controle de expansão dessa linha
    setShowAllPerPosition((prev) => {
      const updated = { ...prev };
      delete updated[index];
      return updated;
    });
  };

  const handleMemberChange = (index: number, member_id: string) => {
    setErrorMessage(null);
    setAssignments((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], member_id };
      return updated;
    });
  };

  const handleRoleChange = (index: number, role_name: string) => {
    setAssignments((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], role_name };
      return updated;
    });
  };

  // Carrega a formação padrão: 3 vozes, 1 violão, 1 baixo, 1 teclado, 1 baterista
  const handleLoadStandardBand = () => {
    setAssignments(
      STANDARD_BAND_FORMATION.map((role_name) => ({
        member_id: '',
        role_name,
      }))
    );
    setShowAllPerPosition({});
    setErrorMessage(null);
  };

  const handleSave = async (publish: boolean) => {
    setErrorMessage(null);

    const validAssignments = assignments.filter((a) => a.member_id.trim() !== '');

    if (validAssignments.length === 0 && publish) {
      setErrorMessage('Adicione ao menos um integrante antes de publicar a escala.');
      return;
    }

    const memberIds = validAssignments.map((a) => a.member_id);
    const uniqueIds = new Set(memberIds);
    if (uniqueIds.size !== memberIds.length) {
      setErrorMessage('Não é permitido repetir a mesma pessoa na escala deste culto.');
      return;
    }

    const unavailableAssigned: string[] = [];
    for (const item of validAssignments) {
      const avail = getMemberAvailability(service.id, item.member_id);
      if (avail === 'indisponivel') {
        const mem = members.find((m) => m.id === item.member_id);
        unavailableAssigned.push(mem?.name || 'Integrante');
      }
    }

    if (unavailableAssigned.length > 0 && publish) {
      const confirmSave = window.confirm(
        `Atenção: Os seguintes integrantes marcaram INDISPONÍVEL para este culto:\n• ${unavailableAssigned.join(
          '\n• '
        )}\n\nDeseja publicar a escala mesmo assim?`
      );
      if (!confirmSave) return;
    }

    setIsSubmitting(true);
    try {
      const res = await saveSchedule(service.id, validAssignments, publish);
      if (!res.success) {
        setErrorMessage(res.error || 'Erro ao salvar escala.');
      } else {
        onSuccess();
        onClose();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao processar.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedMemberIds = assignments.map((a) => a.member_id).filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-6 animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-stone-50 border-b border-stone-200 p-3.5 sm:p-5 flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100/80 px-2.5 py-0.5 rounded-full inline-block">
              Montar Escala
            </span>
            <h3 className="text-base sm:text-xl font-bold text-stone-900 mt-1 truncate">
              {service.title}
            </h3>
            <p className="text-xs text-stone-700 mt-0.5">
              Escolha os integrantes e suas respectivas funções para este culto.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="bg-rose-50 border-b border-rose-200 p-3 px-4 sm:px-6 flex items-center gap-2.5 text-rose-800 text-xs sm:text-sm font-medium shrink-0 animate-in slide-in-from-top-1">
            <AlertTriangle size={16} className="text-rose-600 shrink-0" />
            <p className="break-words">{errorMessage}</p>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="p-3.5 sm:p-6 overflow-y-auto space-y-3.5">
          {/* Card com Formação Padrão e Ação Rápida */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl">
            <div>
              <p className="text-xs font-extrabold text-amber-950 uppercase tracking-wide">
                Posições e Integrantes ({assignments.length})
              </p>
              <p className="text-[11px] text-amber-900/80 mt-0.5">
                Padrão: <strong>3 vozes, 1 violão, 1 baixo, 1 teclado e 1 baterista</strong>.
              </p>
            </div>

            <button
              type="button"
              onClick={handleLoadStandardBand}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors self-start sm:self-auto"
              title="Redefine as posições para o formato padrão (7)"
            >
              <span>⚡ Formação Padrão (7)</span>
            </button>
          </div>

          <div className="space-y-3">
            {assignments.map((assignment, index) => {
              const currentAvailability = assignment.member_id
                ? getMemberAvailability(service.id, assignment.member_id)
                : null;

              const selectedMember = members.find((m) => m.id === assignment.member_id);

              // Integrantes ativos qualificados para a função atual
              const qualifiedMembers = members.filter(
                (m) => m.active && isMemberQualifiedForRole(m.roles, assignment.role_name)
              );

              // Se o pastor pediu para "Mostrar todos" nesta posição ou se ninguém tem essa função cadastrada
              const isFiltered = !showAllPerPosition[index] && qualifiedMembers.length > 0;

              // Lista de integrantes a exibir no dropdown
              let candidates = isFiltered ? qualifiedMembers : members.filter((m) => m.active);

              // Se um integrante já selecionado não estava na lista (ex: caso raro), garante que ele continue visível
              if (selectedMember && !candidates.some((c) => c.id === selectedMember.id)) {
                candidates = [selectedMember, ...candidates];
              }

              // Ordena: Disponíveis primeiro (🟢), depois Pendentes (🟡), depois Indisponíveis (🔴)
              const sortedCandidates = [...candidates].sort((a, b) => {
                const availA = getMemberAvailability(service.id, a.id);
                const availB = getMemberAvailability(service.id, b.id);
                const score = (st: string) => (st === 'disponivel' ? 0 : st === 'pendente' ? 1 : 2);
                const diff = score(availA) - score(availB);
                if (diff !== 0) return diff;
                return a.name.localeCompare(b.name);
              });

              const roleIcon = getRoleIcon(assignment.role_name);

              return (
                <div
                  key={index}
                  className="p-3.5 sm:p-4 rounded-2xl bg-stone-50 border border-stone-200/90 flex flex-col gap-2.5 shadow-2xs hover:border-amber-200 transition-colors"
                >
                  {/* Position row top: Label + Remove */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-stone-700 uppercase flex items-center gap-1.5">
                      <span className="text-sm">{roleIcon}</span>
                      <span>
                        Posição #{index + 1} • {assignment.role_name}
                      </span>
                    </span>

                    <button
                      type="button"
                      onClick={() => handleRemoveRow(index)}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1 p-1 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Remover esta posição da escala"
                    >
                      <Trash2 size={13} />
                      <span>Remover</span>
                    </button>
                  </div>

                  {/* Form fields: Stacked on mobile, side-by-side on sm+ */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-end">
                    {/* Role field */}
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                        Função no Culto
                      </label>
                      <select
                        value={assignment.role_name}
                        onChange={(e) => handleRoleChange(index, e.target.value)}
                        className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30 min-h-[44px]"
                      >
                        {DEFAULT_MINISTRY_ROLES.map((role) => (
                          <option key={role} value={role}>
                            {getRoleIcon(role)} {role}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Member field com filtro por função */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <label className="block text-[11px] font-semibold text-stone-700">
                            Integrante
                          </label>
                          {isFiltered && (
                            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                              Apenas {assignment.role_name} ({qualifiedMembers.length})
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          {currentAvailability && (
                            <AvailabilityBadge status={currentAvailability} size="sm" />
                          )}
                          <button
                            type="button"
                            onClick={() => toggleShowAll(index)}
                            className="text-[10px] text-amber-900 hover:text-amber-950 font-semibold underline"
                            title={isFiltered ? 'Exibir todos os integrantes da igreja' : 'Filtrar apenas quem exerce esta função'}
                          >
                            {isFiltered ? 'Mostrar todos' : `Filtrar ${assignment.role_name}`}
                          </button>
                        </div>
                      </div>

                      <select
                        value={assignment.member_id}
                        onChange={(e) => handleMemberChange(index, e.target.value)}
                        className={`w-full bg-white border rounded-xl px-3 py-2.5 text-xs font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30 min-h-[44px] ${
                          currentAvailability === 'pendente'
                            ? 'border-amber-400 bg-amber-50/20'
                            : currentAvailability === 'indisponivel'
                            ? 'border-rose-400 bg-rose-50/20'
                            : 'border-stone-300'
                        }`}
                      >
                        <option value="">
                          {isFiltered
                            ? `-- Selecione quem faz ${assignment.role_name} (${sortedCandidates.length}) --`
                            : '-- Selecione o integrante --'}
                        </option>
                        {sortedCandidates.map((member) => {
                          const avail = getMemberAvailability(service.id, member.id);
                          const isUnavailable = avail === 'indisponivel';
                          const isAlreadySelected =
                            selectedMemberIds.includes(member.id) &&
                            assignment.member_id !== member.id;

                          let statusText = '';
                          if (avail === 'disponivel') statusText = '🟢 Disponível';
                          else if (avail === 'indisponivel') statusText = '🔴 Indisponível (bloqueado)';
                          else statusText = '🟡 Pendente';

                          if (isAlreadySelected) {
                            statusText += ' - Já escalado';
                          }

                          // Mostra os papéis cadastrados da pessoa para destacar coringas
                          const rolesSummary =
                            member.roles && member.roles.length > 0
                              ? ` (${member.roles.join(', ')})`
                              : '';

                          return (
                            <option
                              key={member.id}
                              value={member.id}
                              disabled={isUnavailable || isAlreadySelected}
                            >
                              {member.name}
                              {rolesSummary} • {statusText}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>

                  {/* Warning if member has not responded yet (Pendente) */}
                  {currentAvailability === 'pendente' && selectedMember && (
                    <div className="text-[11px] text-amber-800 bg-amber-100/70 border border-amber-200/80 rounded-xl px-2.5 py-1.5 flex items-center gap-1.5 mt-1">
                      <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                      <span className="break-words">
                        Aviso: <strong>{selectedMember.name}</strong> ainda não respondeu a disponibilidade
                        para este culto.
                      </span>
                    </div>
                  )}

                  {/* Warning if member marked indisponivel */}
                  {currentAvailability === 'indisponivel' && selectedMember && (
                    <div className="text-[11px] text-rose-900 bg-rose-100/80 border border-rose-300 rounded-xl px-2.5 py-1.5 flex items-center gap-1.5 mt-1 font-bold">
                      <AlertTriangle size={14} className="text-rose-600 shrink-0" />
                      <span className="break-words">
                        Atenção: <strong>{selectedMember.name}</strong> marcou INDISPONÍVEL para este culto.
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick-add chips + Add Row Button */}
          <div className="space-y-2 pt-1">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[11px] font-bold text-stone-500 mr-1">+ Adicionar:</span>
              <button
                type="button"
                onClick={() => handleAddRow('Voz')}
                className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-amber-100 text-stone-800 text-[11px] font-bold border border-stone-200 transition-colors"
              >
                🎤 + Voz
              </button>
              <button
                type="button"
                onClick={() => handleAddRow('Violão')}
                className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-amber-100 text-stone-800 text-[11px] font-bold border border-stone-200 transition-colors"
              >
                🎸 + Violão
              </button>
              <button
                type="button"
                onClick={() => handleAddRow('Baixo')}
                className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-amber-100 text-stone-800 text-[11px] font-bold border border-stone-200 transition-colors"
              >
                🎸 + Baixo
              </button>
              <button
                type="button"
                onClick={() => handleAddRow('Teclado')}
                className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-amber-100 text-stone-800 text-[11px] font-bold border border-stone-200 transition-colors"
              >
                🎹 + Teclado
              </button>
              <button
                type="button"
                onClick={() => handleAddRow('Bateria')}
                className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-amber-100 text-stone-800 text-[11px] font-bold border border-stone-200 transition-colors"
              >
                🥁 + Bateria
              </button>
              <button
                type="button"
                onClick={() => handleAddRow('Guitarra')}
                className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-amber-100 text-stone-800 text-[11px] font-bold border border-stone-200 transition-colors"
              >
                🎸 + Guitarra
              </button>
              <button
                type="button"
                onClick={() => handleAddRow('Cajon')}
                className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-amber-100 text-stone-800 text-[11px] font-bold border border-stone-200 transition-colors"
              >
                🪘 + Cajon
              </button>
              <button
                type="button"
                onClick={() => handleAddRow('Som')}
                className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-amber-100 text-stone-800 text-[11px] font-bold border border-stone-200 transition-colors"
              >
                🎚️ + Som
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleAddRow('Voz')}
              className="w-full py-3 border-2 border-dashed border-stone-300 hover:border-amber-400 rounded-2xl text-stone-600 hover:text-amber-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-all bg-white hover:bg-amber-50/30 min-h-[44px]"
            >
              <Plus size={16} />
              <span>Adicionar Mais Uma Posição</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-stone-50 border-t border-stone-200 p-3 sm:px-6 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2.5 min-h-[44px] text-xs font-semibold text-stone-600 hover:text-stone-900"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSave(false)}
              className="px-3.5 py-2.5 min-h-[44px] rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Save size={15} className="text-stone-500" />
              <span>Salvar Rascunho</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSave(true)}
              className="px-4 py-2.5 min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Eye size={15} />
              <span>Publicar Escala</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
