import React, { useState } from 'react';
import type { Member, SundayService } from '../types';
import { X, Check, Music2 } from 'lucide-react';

interface ScheduleAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: SundayService;
  member: Member;
  currentRole?: string;
  onAssign: (serviceId: string, memberId: string, role: string) => void;
}

export const ScheduleAssignmentModal: React.FC<ScheduleAssignmentModalProps> = ({
  isOpen,
  onClose,
  service,
  member,
  currentRole,
  onAssign,
}) => {
  // Inicializa com a função atual ou com a primeira função cadastrada pelo usuário
  const [selectedRole, setSelectedRole] = useState<string>(() => {
    if (currentRole && member.roles.includes(currentRole)) {
      return currentRole;
    }
    return member.roles.length > 0 ? member.roles[0] : '';
  });

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!selectedRole) {
      alert('Selecione um instrumento para o integrante.');
      return;
    }
    onAssign(service.id, member.id, selectedRole);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom duration-200">
        {/* Header do Modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <div>
            <h2 className="text-base font-bold text-stone-900">Escalar Integrante</h2>
            <p className="text-xs text-stone-500">Defina a função para este culto</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:text-stone-900 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* Cartão de Resumo do Integrante */}
          <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/80">
            <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-0.5">
              Integrante
            </div>
            <div className="text-base font-extrabold text-stone-900">{member.name}</div>
            <p className="text-xs text-stone-500 mt-0.5">
              Toca {member.roles.length} {member.roles.length === 1 ? 'instrumento' : 'instrumentos'} cadastrados
            </p>
          </div>

          {/* Lista EXCLUSIVA dos instrumentos que o integrante preencheu/toca */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-2.5 flex items-center gap-1.5">
              <Music2 size={15} className="text-[#D96B0B]" />
              Selecione o instrumento para o culto:
            </label>

            {member.roles.length > 0 ? (
              <div className="space-y-2">
                {member.roles.map((role) => {
                  const isSelected = selectedRole === role;
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setSelectedRole(role)}
                      className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-[#D96B0B] bg-orange-50 text-[#D96B0B] ring-2 ring-orange-200 shadow-xs'
                          : 'border-stone-200 bg-white text-stone-800 hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isSelected ? 'bg-[#D96B0B]' : 'bg-stone-300'
                          }`}
                        />
                        <span className="text-sm font-bold">{role}</span>
                      </div>

                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-[#D96B0B] text-white flex items-center justify-center shrink-0">
                          <Check size={14} strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 px-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs">
                Este integrante ainda não cadastrou instrumentos no perfil.
              </div>
            )}
          </div>

          {/* Botão de Confirmação */}
          <div className="pt-3 safe-area-pb">
            <button
              type="button"
              disabled={!selectedRole}
              onClick={handleConfirm}
              className="w-full py-3.5 px-4 rounded-xl bg-[#D96B0B] hover:bg-[#B85505] disabled:opacity-40 disabled:pointer-events-none text-white text-sm font-bold shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              <Check size={18} />
              Confirmar {member.name.split(' ')[0]} no {selectedRole || 'instrumento'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
