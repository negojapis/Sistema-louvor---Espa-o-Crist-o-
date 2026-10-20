import React, { useState } from 'react';
import type { Member, MinistryType } from '../types';
import { MINISTRY_ROLES_CATALOG } from '../types';
import { useApp } from '../context/AppContext';
import { X, UserPlus, Save, Check } from 'lucide-react';

interface Props {
  memberToEdit?: Member | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const MemberModal: React.FC<Props> = ({ memberToEdit, onClose, onSuccess }) => {
  const { createMember, updateMember } = useApp();

  const isEditing = Boolean(memberToEdit);

  const [name, setName] = useState(memberToEdit?.name || '');
  const [ministry, setMinistry] = useState<MinistryType>(memberToEdit?.ministry || 'Louvor');
  const [email, setEmail] = useState(memberToEdit?.email || '');
  const [phone, setPhone] = useState(memberToEdit?.phone || '');
  const [selectedRoles, setSelectedRoles] = useState<string[]>(memberToEdit?.roles || []);
  const [customRole, setCustomRole] = useState('');
  const [isLeader, setIsLeader] = useState(Boolean(memberToEdit?.is_leader));
  const [active, setActive] = useState(memberToEdit ? memberToEdit.active : true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleAddCustomRole = () => {
    if (!customRole.trim()) return;
    const trimmed = customRole.trim();
    if (!selectedRoles.includes(trimmed)) {
      setSelectedRoles((prev) => [...prev, trimmed]);
    }
    setCustomRole('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (selectedRoles.length === 0) {
      alert('Selecione ao menos uma função que este integrante pode exercer.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && memberToEdit) {
        await updateMember(memberToEdit.id, {
          name: name.trim(),
          ministry,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          roles: selectedRoles,
          is_leader: isLeader,
          active,
        });
      } else {
        await createMember({
          name: name.trim(),
          ministry,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          roles: selectedRoles,
          is_leader: isLeader,
          active,
          user_id: null,
        });
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar integrante.';
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-stone-50 border-b border-stone-200 p-4 sm:p-5 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <UserPlus size={20} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-stone-900">
                {isEditing ? 'Editar Integrante' : 'Novo Integrante'}
              </h3>
              <p className="text-xs text-stone-700">
                Cadastre o nome e todas as funções que a pessoa pode exercer.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Nome Completo *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Katia, Alex, Pastor Paulo..."
              className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Ministério *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {(['Louvor', 'Condução e Palavra', 'Multimídia', 'Outro'] as MinistryType[]).map((min) => (
                <button
                  key={min}
                  type="button"
                  onClick={() => setMinistry(min)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                    ministry === min
                      ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                  }`}
                >
                  {min}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                E-mail (opcional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@email.com"
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Telefone (opcional)
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 98765-4321"
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>
          </div>

          {/* Funções / Habilidades Habilitadas */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-stone-700">
                Funções que pode exercer *
              </label>
              <span className="text-[11px] text-stone-600">
                {selectedRoles.length} selecionada{selectedRoles.length !== 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-xs text-stone-600 mb-2.5">
              Uma pessoa pode ter várias funções cadastradas. O pastor escolhe em qual ela servirá em cada culto.
            </p>

            <div className="flex flex-wrap gap-1.5">
              {(MINISTRY_ROLES_CATALOG[ministry] || []).map((role) => {
                const isSelected = selectedRoles.includes(role);
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => toggleRole(role)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'bg-stone-100 hover:bg-stone-200/70 text-stone-700 border border-stone-200'
                    }`}
                  >
                    {isSelected && <Check size={14} />}
                    <span>{role}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 mt-3">
              <input
                type="text"
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                placeholder="Outra função específica (ex: Saxofone, Transmissão)..."
                className="flex-1 bg-stone-50 border border-stone-300 rounded-xl px-3 py-1.5 text-xs text-stone-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
              <button
                type="button"
                onClick={handleAddCustomRole}
                className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl text-xs font-semibold transition-colors"
              >
                + Adicionar
              </button>
            </div>
          </div>

          {/* Liderança de Ministério */}
          <div className="pt-1">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isLeader}
                onChange={(e) => setIsLeader(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-amber-600 focus:ring-amber-500 border-stone-300"
              />
              <div>
                <span className="text-xs font-semibold text-stone-800 block">
                  Líder de Ministério (ex: Daniel líder de Multimídia)
                </span>
                <span className="text-[11px] text-stone-500 block">
                  Identifica a liderança da área. Não concede permissões de Pastor Administrador.
                </span>
              </div>
            </label>
          </div>

          {/* Status Ativo */}
          <div className="pt-1">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-amber-600 focus:ring-amber-500 border-stone-300"
              />
              <div>
                <span className="text-xs font-semibold text-stone-800 block">
                  Integrante ativo para novas escalas
                </span>
                <span className="text-[11px] text-stone-500 block">
                  Desativar o integrante não remove seu histórico de participações em cultos passados.
                </span>
              </div>
            </label>
          </div>

          <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Save size={16} />
              <span>{isEditing ? 'Salvar Integrante' : 'Cadastrar Integrante'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
