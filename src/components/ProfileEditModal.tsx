import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AVAILABLE_INSTRUMENTS } from '../data/initialData';
import { X, Check, Plus, Music2, Phone, Mail, User } from 'lucide-react';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, saveUserProfile } = useApp();

  const [name, setName] = useState(currentUser.name);
  const [phone, setPhone] = useState(currentUser.phone);
  const [email, setEmail] = useState(currentUser.email);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(currentUser.roles || []);
  const [customRoleInput, setCustomRoleInput] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const toggleRole = (role: string) => {
    if (selectedRoles.includes(role)) {
      if (selectedRoles.length === 1) {
        alert('Selecione ao menos um instrumento ou função.');
        return;
      }
      setSelectedRoles(selectedRoles.filter((r) => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  const handleAddCustomRole = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customRoleInput.trim();
    if (!trimmed) return;
    if (!selectedRoles.includes(trimmed)) {
      setSelectedRoles([...selectedRoles, trimmed]);
    }
    setCustomRoleInput('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Por favor, informe seu nome completo.');
      return;
    }
    if (selectedRoles.length === 0) {
      alert('Por favor, escolha pelo menos um instrumento.');
      return;
    }

    saveUserProfile({
      name,
      phone,
      email,
      roles: selectedRoles,
    });

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <div>
            <h2 className="text-lg font-bold text-stone-900">Meu Cadastro & Funções</h2>
            <p className="text-xs text-stone-500">
              Seus dados ficam salvos para você não precisar logar novamente.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:text-stone-900 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Nome completo */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Nome Completo *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                <User size={16} />
              </div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Felipe Silva"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 focus:border-[#D96B0B] focus:ring-2 focus:ring-[#D96B0B]/20 text-sm outline-none transition-all"
              />
            </div>
          </div>

          {/* WhatsApp */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Número de WhatsApp *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                <Phone size={16} />
              </div>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ex: (11) 98765-4321"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 focus:border-[#D96B0B] focus:ring-2 focus:ring-[#D96B0B]/20 text-sm outline-none transition-all"
              />
            </div>
          </div>

          {/* E-mail */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              E-mail
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                <Mail size={16} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: felipe@email.com"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 focus:border-[#D96B0B] focus:ring-2 focus:ring-[#D96B0B]/20 text-sm outline-none transition-all"
              />
            </div>
          </div>

          {/* Funções e Instrumentos */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
                <Music2 size={15} className="text-[#D96B0B]" />
                Instrumentos & Funções que exerço *
              </label>
              <span className="text-[11px] text-stone-400">
                Selecione quantos quiser
              </span>
            </div>
            <p className="text-[11px] text-stone-500 mb-2.5 leading-relaxed">
              Você pode alterar a qualquer momento se aprender outro instrumento ou função.
            </p>

            {/* Quick Chips */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {AVAILABLE_INSTRUMENTS.map((role) => {
                const isSelected = selectedRoles.includes(role);
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => toggleRole(role)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#D96B0B] text-white shadow-xs font-semibold'
                        : 'bg-stone-100 hover:bg-stone-200/70 text-stone-700 border border-stone-200/60'
                    }`}
                  >
                    {isSelected && <Check size={12} strokeWidth={3} />}
                    {role}
                  </button>
                );
              })}
            </div>

            {/* Adicionar outro instrumento se aprender */}
            <div className="flex gap-2">
              <input
                type="text"
                value={customRoleInput}
                onChange={(e) => setCustomRoleInput(e.target.value)}
                placeholder="Aprendeu outro? Digite aqui..."
                className="flex-1 px-3 py-2 rounded-xl border border-stone-200 focus:border-[#D96B0B] text-xs outline-none"
              />
              <button
                type="button"
                onClick={handleAddCustomRole}
                className="px-3 py-2 bg-stone-100 hover:bg-stone-200 rounded-xl text-xs font-semibold text-stone-700 flex items-center gap-1"
              >
                <Plus size={14} />
                Adicionar
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 safe-area-pb">
            <button
              type="submit"
              disabled={savedSuccess}
              className={`w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 ${
                savedSuccess
                  ? 'bg-emerald-600'
                  : 'bg-[#D96B0B] hover:bg-[#B85505] shadow-orange-500/20'
              }`}
            >
              {savedSuccess ? (
                <>
                  <Check size={18} />
                  Salvo com Sucesso!
                </>
              ) : (
                'Salvar Meu Cadastro'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
