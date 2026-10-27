import React, { useState, useEffect } from 'react';
import { X, Check, Music2, Link2, Sparkles } from 'lucide-react';

interface EditSongModalProps {
  isOpen: boolean;
  onClose: () => void;
  song: {
    id: string;
    title: string;
    artist: string;
    tone: string;
    link?: string;
    notes?: string;
  } | null;
  type: 'repertoire' | 'setlist';
  onSave: (
    id: string,
    updated: {
      title: string;
      artist: string;
      tone: string;
      link?: string;
      notes?: string;
    }
  ) => void;
}

const COMMON_TONES = [
  'C', 'D', 'E', 'F', 'G', 'A', 'B',
  'Em', 'Am', 'Dm', 'Bm', 'F#m', 'G#m', 'C#m',
  'Bb', 'Eb', 'Ab', 'F#',
];

export const EditSongModal: React.FC<EditSongModalProps> = ({
  isOpen,
  onClose,
  song,
  type,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [tone, setTone] = useState('');
  const [link, setLink] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (song) {
      setTitle(song.title);
      setArtist(song.artist);
      setTone(song.tone);
      setLink(song.link || '');
      setNotes(song.notes || '');
    }
  }, [song]);

  if (!isOpen || !song) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !artist.trim() || !tone.trim()) {
      alert('Preencha o título, cantor e o tom.');
      return;
    }

    onSave(song.id, {
      title: title.trim(),
      artist: artist.trim(),
      tone: tone.trim().toUpperCase(),
      link: link.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-[#D96B0B] flex items-center justify-center font-bold">
              <Music2 size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">
                {type === 'repertoire' ? 'Editar no Repertório Oficial' : 'Editar no Culto (Setlist)'}
              </h2>
              <p className="text-xs text-stone-500">
                Ajuste o tom ou versão para o que a igreja melhor se adapta
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
        <form onSubmit={handleSubmit} className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* Alerta de tom */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-900">
            <Sparkles size={16} className="text-[#D96B0B] shrink-0 mt-0.5" />
            <span>
              Ao alterar o tom aqui, a alteração fica registrada para toda a equipe, evitando confusão de tons nos ensaios.
            </span>
          </div>

          {/* Nome da Música */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Nome da Música *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:border-[#D96B0B] text-sm outline-none font-bold text-stone-900"
            />
          </div>

          {/* Cantor / Versão */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Cantor / Versão de Referência *
            </label>
            <input
              type="text"
              required
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Ex: Isaías Saad, Casa Worship..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:border-[#D96B0B] text-sm outline-none text-stone-800"
            />
          </div>

          {/* Tom Oficial / Adaptado */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-stone-800">
                Tom que a Igreja Toca/Canta *
              </label>
              <span className="text-xs font-extrabold text-[#D96B0B] bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                Tom Atual: {tone || 'Não definido'}
              </span>
            </div>

            {/* Seletor rápido de Tons */}
            <div className="grid grid-cols-6 gap-1.5 mb-2">
              {COMMON_TONES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTone(t)}
                  className={`py-2 rounded-lg text-xs font-black transition-all ${
                    tone === t
                      ? 'bg-[#D96B0B] text-white shadow-xs ring-2 ring-orange-300'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-stone-400">Ou digite:</span>
              <input
                type="text"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                placeholder="Ex: F# ou Abm"
                className="flex-1 px-3 py-1.5 rounded-lg border border-stone-200 text-xs font-bold text-stone-800 uppercase outline-none focus:border-[#D96B0B]"
              />
            </div>
          </div>

          {/* Link Cifra / YouTube */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Link de Cifra ou Vídeo (Opcional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                <Link2 size={15} />
              </div>
              <input
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://www.cifraclub.com.br/..."
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-200 focus:border-[#D96B0B] text-xs outline-none"
              />
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Observações de Arranjo / Dinâmica
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Tom adaptado para a voz da líder. Não mudar."
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:border-[#D96B0B] text-xs outline-none resize-none"
            />
          </div>

          {/* Botão Salvar */}
          <div className="pt-3 safe-area-pb">
            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-[#D96B0B] hover:bg-[#B85505] text-white text-sm font-bold shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              <Check size={18} />
              Salvar Novo Tom & Informações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
