import React, { useState } from 'react';
import type { Service, ServicePeriod, ServiceType } from '../types';
import { useApp } from '../context/AppContext';
import { X, Calendar, Save, Sparkles } from 'lucide-react';

interface Props {
  serviceToEdit?: Service | null;
  initialDate?: string | null;
  onClose: () => void;
  onSuccess: (service: Service) => void;
}

export const ServiceFormModal: React.FC<Props> = ({
  serviceToEdit,
  initialDate,
  onClose,
  onSuccess,
}) => {
  const { createService, updateService } = useApp();

  const isEditing = Boolean(serviceToEdit);

  const [title, setTitle] = useState(serviceToEdit?.title || '');
  const [date, setDate] = useState(() => {
    if (serviceToEdit) return serviceToEdit.date;
    if (initialDate) return initialDate;
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')}`;
  });
  const [time, setTime] = useState(serviceToEdit?.time || '10:00');
  const [period, setPeriod] = useState<ServicePeriod>(serviceToEdit?.period || 'manha');
  const [serviceType, setServiceType] = useState<ServiceType>(serviceToEdit?.service_type || 'domingo_manha');
  const [notes, setNotes] = useState(serviceToEdit?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const applyTemplate = (type: 'domingo_manha' | 'domingo_noite' | 'sabado_jovens') => {
    if (type === 'domingo_manha') {
      setTitle('Culto de Domingo - Manhã');
      setTime('09:30');
      setPeriod('manha');
      setServiceType('domingo_manha');
    } else if (type === 'domingo_noite') {
      setTitle('Culto de Domingo - Noite');
      setTime('19:00');
      setPeriod('noite');
      setServiceType('domingo_noite');
    } else if (type === 'sabado_jovens') {
      setTitle('Culto de Jovens');
      setTime('19:30');
      setPeriod('noite');
      setServiceType('sabado_jovens');
      setNotes('Culto com louvor jovem e ministração da Palavra.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date || !time) return;

    setIsSubmitting(true);
    try {
      if (isEditing && serviceToEdit) {
        await updateService(serviceToEdit.id, {
          title: title.trim(),
          date,
          time,
          period,
          service_type: serviceType,
          notes: notes.trim() || undefined,
        });
        onSuccess({
          ...serviceToEdit,
          title: title.trim(),
          date,
          time,
          period,
          service_type: serviceType,
          notes: notes.trim() || undefined,
        });
      } else {
        const created = await createService({
          title: title.trim(),
          date,
          time,
          period,
          service_type: serviceType,
          notes: notes.trim() || undefined,
          status: 'draft',
        });
        onSuccess(created);
      }
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar culto.';
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-auto flex flex-col">
        {/* Header */}
        <div className="bg-stone-50 border-b border-stone-200 p-4 sm:p-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Calendar size={20} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-stone-900">
                {isEditing ? 'Editar Culto' : 'Novo Culto'}
              </h3>
              <p className="text-xs text-stone-700">
                {isEditing ? 'Atualize as informações do culto' : 'Cadastre um novo evento ou culto'}
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
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {!isEditing && (
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-600" />
                <span>Preencher com Modelo Rápido</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => applyTemplate('domingo_manha')}
                  className="py-1.5 px-2 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-amber-50 hover:text-amber-900 hover:border-amber-300 border border-stone-200 text-stone-700 transition-colors text-center"
                >
                  ☀️ Domingo Manhã
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate('domingo_noite')}
                  className="py-1.5 px-2 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-amber-50 hover:text-amber-900 hover:border-amber-300 border border-stone-200 text-stone-700 transition-colors text-center"
                >
                  🌙 Domingo Noite
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate('sabado_jovens')}
                  className="py-1.5 px-2 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-amber-50 hover:text-amber-900 hover:border-amber-300 border border-stone-200 text-stone-700 transition-colors text-center"
                >
                  🔥 Culto de Jovens
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Título do Culto *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Culto de Domingo - Noite, Culto da Família..."
              className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Data *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Horário *
              </label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Observações / Avisos (opcional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Ceia do Senhor, ensaio geral às 09:00..."
              className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-xs sm:text-sm font-medium text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Save size={16} />
              <span>{isEditing ? 'Salvar Alterações' : 'Criar Culto'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
