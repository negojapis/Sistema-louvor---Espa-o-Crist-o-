import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Member, MinistryType } from '../types';
import {
  Users,
  UserPlus,
  Pencil,
  Trash2,
  Phone,
  Mail,
  Search,
  Power,
  Star,
} from 'lucide-react';

interface Props {
  onOpenCreateMember: () => void;
  onOpenEditMember: (member: Member) => void;
}

export const MembersView: React.FC<Props> = ({ onOpenCreateMember, onOpenEditMember }) => {
  const { members, isAdmin, deleteMember, deactivateMember } = useApp();

  const [search, setSearch] = useState('');
  const [ministryFilter, setMinistryFilter] = useState<'Todos' | MinistryType>('Todos');

  const filteredMembers = members.filter((m) => {
    const term = search.toLowerCase();
    const nameMatch = m.name.toLowerCase().includes(term);
    const roleMatch = m.roles.some((r) => r.toLowerCase().includes(term));
    const ministryMatch = ministryFilter === 'Todos' || m.ministry === ministryFilter;
    return (nameMatch || roleMatch) && ministryMatch;
  });

  const handleToggleActive = async (member: Member) => {
    const nextState = !member.active;
    const action = nextState ? 'ativar' : 'desativar';
    if (
      confirm(
        `Deseja ${action} ${member.name}?\n\nNota: Desativar não apaga o histórico das escalas que esta pessoa já participou.`
      )
    ) {
      await deactivateMember(member.id, nextState);
    }
  };

  const handleDelete = async (member: Member) => {
    if (confirm(`Deseja excluir definitivamente "${member.name}" do cadastro?`)) {
      await deleteMember(member.id);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Users size={22} className="text-amber-600" />
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
              Equipe & Ministérios
            </h2>
            <span className="text-xs font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full">
              {members.length} cadastrados
            </span>
          </div>
          <p className="text-xs text-stone-700 mt-1">
            Louvor, Condução, Palavra e Multimídia. O pastor escolhe a função de cada integrante na escala.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={onOpenCreateMember}
            className="px-4 py-2.5 min-h-[44px] rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs active:scale-95"
          >
            <UserPlus size={16} />
            <span>Adicionar Integrante</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {(['Todos', 'Louvor', 'Condução e Palavra', 'Multimídia'] as const).map((cat) => {
            const count =
              cat === 'Todos' ? members.length : members.filter((m) => m.ministry === cat).length;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setMinistryFilter(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  ministryFilter === cat
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>

        <div className="relative">
          <Search
            size={16}
            className="text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar integrante por nome ou função (ex: Katia, Alex, Flávio, Som, Projeção)..."
            className="w-full bg-white border border-stone-200/90 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 shadow-2xs min-h-[44px]"
          />
        </div>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredMembers.map((member) => {
          const isMultimidia = member.ministry === 'Multimídia';
          const isConducao = member.ministry === 'Condução e Palavra';

          return (
            <div
              key={member.id}
              className={`bg-white rounded-3xl border p-4 shadow-xs hover:border-amber-300 transition-all flex flex-col justify-between overflow-hidden ${
                !member.active ? 'opacity-65 border-stone-200 bg-stone-50/60' : 'border-stone-200/90'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`w-10 h-10 rounded-2xl font-extrabold text-sm flex items-center justify-center shrink-0 ${
                        isMultimidia
                          ? 'bg-purple-100 text-purple-900'
                          : isConducao
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-stone-100 text-stone-800'
                      }`}
                    >
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-extrabold text-stone-900 text-sm leading-tight break-words">
                          {member.name}
                        </h3>
                        {member.is_leader && (
                          <span className="px-1.5 py-0.2 rounded-md bg-purple-100 text-purple-800 font-extrabold text-[10px] inline-flex items-center gap-0.5">
                            <Star size={10} /> Líder
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.2 rounded-md ${
                            isMultimidia
                              ? 'bg-purple-50 text-purple-800 border border-purple-200'
                              : isConducao
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-stone-100 text-stone-700 border border-stone-200'
                          }`}
                        >
                          {member.ministry}
                        </span>

                        {member.active ? (
                          <span className="text-[10px] font-bold text-emerald-800 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Ativo
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-stone-500 bg-stone-200 px-1.5 py-0.2 rounded">
                            Inativo
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={() => handleToggleActive(member)}
                        className={`p-1.5 rounded-xl transition-colors ${
                          member.active
                            ? 'text-stone-400 hover:text-amber-800 hover:bg-stone-100'
                            : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                        title={member.active ? 'Desativar integrante' : 'Ativar integrante'}
                      >
                        <Power size={14} />
                      </button>
                      <button
                        onClick={() => onOpenEditMember(member)}
                        className="p-1.5 rounded-xl text-stone-400 hover:text-amber-800 hover:bg-stone-50 transition-colors"
                        title="Editar"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(member)}
                        className="p-1.5 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Roles Chips */}
                <div className="mt-3">
                  <span className="text-[11px] font-semibold text-stone-600 block mb-1">
                    Funções habilitadas:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {member.roles.map((role) => (
                      <span
                        key={role}
                        className="text-[11px] font-semibold bg-stone-100 text-stone-800 px-2.5 py-1 rounded-lg border border-stone-200/60 max-w-full truncate"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Contacts */}
              {(member.phone || member.email) && (
                <div className="mt-3.5 pt-2.5 border-t border-stone-100 flex flex-wrap items-center gap-3 text-xs text-stone-600">
                  {member.phone && (
                    <span className="inline-flex items-center gap-1 truncate max-w-full text-[11px]">
                      <Phone size={12} className="text-stone-400 shrink-0" />
                      <span className="truncate">{member.phone}</span>
                    </span>
                  )}
                  {member.email && (
                    <span className="inline-flex items-center gap-1 truncate max-w-full text-[11px]">
                      <Mail size={12} className="text-stone-400 shrink-0" />
                      <span className="truncate">{member.email}</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
