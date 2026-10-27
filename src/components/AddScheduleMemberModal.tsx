import React, { useState, useEffect } from 'react';
import type { Member, SundayService, ScheduleAssignment } from '../types';
import { AVAILABLE_INSTRUMENTS } from '../data/initialData';
import { X, Check, Users, Sparkles, UserPlus } from 'lucide-react';

interface AddScheduleMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: SundayService;
  members: Member[];
  existingAssignments: ScheduleAssignment[];
  assignmentToEdit?: { memberId: string; role: string } | null;
  onSave: (serviceId: string, memberId: string, role: string) => void;
}

export const AddScheduleMemberModal: React.FC<AddScheduleMemberModalProps> = ({
  isOpen,
  onClose,
  service,
  members,
  assignmentToEdit,
  onSave,
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string>(() => {
    if (assignmentToEdit) return assignmentToEdit.memberId;
    return members.length > 0 ? members[0].id : '';
  });

  const [selectedRole, setSelectedRole] = useState<string>(() => {
    if (assignmentToEdit) return assignmentToEdit.role;
    return 'Voz Principal';
  });

  const [customRole, setCustomRole] = useState<string>('');

  useEffect(() => {
    if (assignmentToEdit) {
      setSelectedMemberId(assignmentToEdit.memberId);
      setSelectedRole(assignmentToEdit.role);
    } else if (members.length > 0) {
      setSelectedMemberId(members[0].id);
      setSelectedRole('Voz Principal');
    }
  }, [assignmentToEdit, members, isOpen]);

  if (!isOpen) return null;

  const currentMember = members.find((m) => m.id === selectedMemberId);

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    const finalRole = customRole.trim() || selectedRole;
    if (!selectedMemberId || !finalRole) {
      alert('Selecione um integrante e informe a função/instrumento.');
      return;
    }

    onSave(service.id, selectedMemberId, finalRole);
    setCustomRole('');
    onClose();
  };

  // Separação visual dos instrumentos de louvor vs equipe técnica (som, multimídia, foto)
  const louvorRoles = AVAILABLE_INSTRUMENTS.filter(
    (r) =>
      !r.includes('Som') &&
      !r.includes('Multimídia') &&
      !r.includes('Transmissão') &&
      !r.includes('Fotografia') &&
      !r.includes('Iluminação')
  );

  const mediaTechRoles = AVAILABLE_INSTRUMENTS.filter(
    (r) =>
      r.includes('Som') ||
      r.includes('Multimídia') ||
      r.includes('Transmissão') ||
      r.includes('Fotografia') ||
      r.includes('Iluminação')
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-[#D96B0B] flex items-center justify-center font-bold">
              <UserPlus size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">
                {assignmentToEdit ? 'Editar Integrante na Escala' : 'Adicionar à Escala Oficial'}
              </h2>
              <p className="text-xs text-stone-500">
                Escala geral do culto (Louvor, Som, Multimídia, Foto...)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:text-stone-900"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleConfirm} className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* Selecionar Integrante */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
              <Users size={15} className="text-[#D96B0B]" />
              Selecione o Integrante da Equipe:
            </label>
            <select
              value={selectedMemberId}
              onChange={(e) => {
                setSelectedMemberId(e.target.value);
                const found = members.find((m) => m.id === e.target.value);
                if (found && found.roles.length > 0) {
                  setSelectedRole(found.roles[0]);
                }
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:border-[#D96B0B] text-sm font-semibold text-stone-900 outline-none bg-stone-50"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} — ({m.roles.join(', ')})
                </option>
              ))}
            </select>
          </div>

          {/* Instrumentos cadastrados da pessoa selecionada (Atalho) */}
          {currentMember && currentMember.roles.length > 0 && (
            <div className="p-3 bg-orange-50/70 border border-orange-200/80 rounded-xl">
              <span className="text-[11px] font-bold text-[#D96B0B] block mb-1.5">
                Funções cadastradas de {currentMember.name.split(' ')[0]}:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {currentMember.roles.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setSelectedRole(r);
                      setCustomRole('');
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      selectedRole === r && !customRole
                        ? 'bg-[#D96B0B] text-white shadow-xs'
                        : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Selecionar Função / Instrumento: Louvor */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-500" />
              Equipe de Louvor & Vozes:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {louvorRoles.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setSelectedRole(r);
                    setCustomRole('');
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedRole === r && !customRole
                      ? 'bg-[#D96B0B] text-white font-bold shadow-xs'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Selecionar Função: Multimídia, Foto, Som */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
              <Sparkles size={14} className="text-indigo-500" />
              Multimídia, Som, Foto & Técnica:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {mediaTechRoles.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setSelectedRole(r);
                    setCustomRole('');
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedRole === r && !customRole
                      ? 'bg-indigo-600 text-white font-bold shadow-xs'
                      : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200/60'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Função customizada ou digitada */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Ou digite outra função personalizada:
            </label>
            <input
              type="text"
              value={customRole}
              onChange={(e) => setCustomRole(e.target.value)}
              placeholder="Ex: Câmera 1, Transmissão YouTube, Mesa..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:border-[#D96B0B] text-xs outline-none"
            />
          </div>

          {/* Botão Salvar */}
          <div className="pt-3 safe-area-pb">
            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-[#D96B0B] hover:bg-[#B85505] text-white text-sm font-bold shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              <Check size={18} />
              {assignmentToEdit
                ? 'Atualizar Escala Oficial'
                : 'Adicionar Integrante à Escala Oficial'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
