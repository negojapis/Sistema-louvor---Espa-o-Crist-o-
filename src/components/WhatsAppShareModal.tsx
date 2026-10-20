import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import type { Service } from '../types';
import {
  generateWhatsAppScheduleText,
  openWhatsAppWithMessage,
  copyToClipboard,
  formatServiceDate,
} from '../utils/whatsapp';
import { X, Copy, Check, MessageCircle, Share2, Sparkles } from 'lucide-react';

interface Props {
  service: Service;
  onClose: () => void;
}

export const WhatsAppShareModal: React.FC<Props> = ({ service, onClose }) => {
  const { getServiceSchedule, getServiceSongs } = useApp();

  const schedule = getServiceSchedule(service.id);
  const songs = getServiceSongs(service.id);

  const initialText = useMemo(() => {
    return generateWhatsAppScheduleText({ service, schedule, songs });
  }, [service, schedule, songs]);

  const [messageText, setMessageText] = useState<string>(initialText);
  const [copied, setCopied] = useState<boolean>(false);

  const formattedDate = formatServiceDate(service.date);

  const handleCopy = async () => {
    const success = await copyToClipboard(messageText);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSendWhatsApp = () => {
    openWhatsAppWithMessage(messageText);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-emerald-600 text-white p-4 sm:p-5 flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-emerald-100 text-xs font-bold uppercase tracking-wider mb-1">
              <MessageCircle size={15} />
              <span>Publicar Escala no WhatsApp</span>
            </div>
            <h3 className="text-base sm:text-lg font-black truncate">
              {service.title}
            </h3>
            <p className="text-xs text-emerald-100 mt-0.5">
              {formattedDate} às {service.time}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-emerald-100 hover:text-white hover:bg-emerald-700/60 transition-colors shrink-0"
            title="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-xs text-emerald-950 flex items-start gap-2.5">
            <Sparkles size={16} className="text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Texto formatado pronto para envio!</p>
              <p className="text-emerald-800 text-[11px] mt-0.5">
                Envie diretamente para o aplicativo do WhatsApp ou copie o texto para colar no grupo da equipe de louvor e multimídia.
              </p>
            </div>
          </div>

          {/* Text preview / editable area */}
          <div>
            <label className="text-xs font-extrabold text-stone-700 block mb-1.5">
              Mensagem para o WhatsApp:
            </label>
            <div className="relative">
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                rows={11}
                className="w-full p-3.5 rounded-2xl border border-stone-200 bg-stone-50 font-mono text-xs leading-relaxed text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y"
              />
            </div>
            <p className="text-[11px] text-stone-600 mt-1">
              Dica: Você pode editar ou adicionar qualquer recado antes de enviar.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-stone-50 border-t border-stone-200 p-3 sm:px-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-stone-600 hover:text-stone-900 order-3 sm:order-1"
          >
            Fechar
          </button>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 order-1 sm:order-2">
            <button
              type="button"
              onClick={handleCopy}
              className={`px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                copied
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  : 'bg-white hover:bg-stone-100 text-stone-800 border-stone-300'
              }`}
            >
              {copied ? <Check size={16} className="text-emerald-700" /> : <Copy size={16} />}
              <span>{copied ? 'Copiado para WhatsApp!' : 'Copiar para WhatsApp'}</span>
            </button>

            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="px-5 py-2.5 min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <Share2 size={16} />
              <span>Enviar no WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
