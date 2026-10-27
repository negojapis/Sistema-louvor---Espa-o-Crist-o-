import React, { useState } from 'react';
import type { SundayService, ScheduleAssignment, Member, SetlistSong } from '../types';
import { generateWhatsAppScheduleText, openWhatsAppWithMessage, copyToClipboard } from '../utils/whatsapp';
import { X, Copy, Check, MessageSquare } from 'lucide-react';

interface WhatsAppShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: SundayService;
  assignments: (ScheduleAssignment & { member?: Member })[];
  songs: SetlistSong[];
}

export const WhatsAppShareModal: React.FC<WhatsAppShareModalProps> = ({
  isOpen,
  onClose,
  service,
  assignments,
  songs,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const messageText = generateWhatsAppScheduleText({
    service,
    assignments,
    songs,
  });

  const handleCopy = async () => {
    const ok = await copyToClipboard(messageText);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenWhatsApp = () => {
    openWhatsAppWithMessage(messageText);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <MessageSquare size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">Compartilhar no WhatsApp</h2>
              <p className="text-xs text-stone-500">Texto formatado pronto para envio</p>
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

        <div className="p-4 flex-1 overflow-y-auto">
          <div className="bg-stone-50 rounded-xl p-3.5 border border-stone-200 font-mono text-xs whitespace-pre-wrap leading-relaxed text-stone-800 max-h-80 overflow-y-auto">
            {messageText}
          </div>
        </div>

        <div className="p-4 border-t border-stone-100 bg-stone-50 flex flex-col sm:flex-row gap-2.5 safe-area-pb">
          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 py-3 px-4 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-800 font-semibold text-xs flex items-center justify-center gap-2 transition-all"
          >
            {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
            {copied ? 'Copiado para a área de transferência!' : 'Copiar Texto'}
          </button>

          <button
            type="button"
            onClick={handleOpenWhatsApp}
            className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20"
          >
            <MessageSquare size={16} />
            Abrir no WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};
