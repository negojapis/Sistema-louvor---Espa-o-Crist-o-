import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Music2, Link2, Check } from 'lucide-react';

interface NewRepertoireSongModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceIdToAddTo?: string; // Se fornecido, já adiciona à setlist deste culto após cadastrar
}

export const NewRepertoireSongModal: React.FC<NewRepertoireSongModalProps> = ({
  isOpen,
  onClose,
  serviceIdToAddTo,
}) => {
  const { addNewRepertoireSong, addSongToSetlist } = useApp();

  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [tone, setTone] = useState('G');
  const [link, setLink] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !artist.trim()) {
      alert('Por favor, informe o título e o cantor/versão.');
      return;
    }

    const songData = {
      title: title.trim(),
      artist: artist.trim(),
      tone: tone.trim() || 'G',
      link: link.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    addNewRepertoireSong(songData);

    if (serviceIdToAddTo) {
      addSongToSetlist(serviceIdToAddTo, songData);
    }

    // Reset and close
    setTitle('');
    setArtist('');
    setTone('G');
    setLink('');
    setNotes('');
    onClose();
  };

  const commonTones = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'Em', 'Am', 'Dm', 'F#m', 'G#m'];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Music2 size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">Novo Louvor Oficial</h2>
              <p className="text-xs text-stone-500">Músicas que já tocamos (Repertório da igreja)</p>
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

        <form onSubmit={handleSubmit} className="p-5 flex-1 overflow-y-auto space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Nome da Música *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Bondade de Deus"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:border-[#D96B0B] text-sm outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Cantor / Versão de Referência *
            </label>
            <input
              type="text"
              required
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Ex: Isaías Saad, Casa Worship, Morada..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:border-[#D96B0B] text-sm outline-none"
            />
            <p className="text-[11px] text-stone-400 mt-1">
              Especificar o cantor evita confusão de versões no ensaio.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Tom Oficial da Igreja *
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {commonTones.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTone(t)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    tone === t
                      ? 'bg-[#D96B0B] text-white shadow-xs'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              placeholder="Outro tom (ex: F#)"
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Link de Referência (Cifra Club ou YouTube)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                <Link2 size={16} />
              </div>
              <input
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://..."
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-200 focus:border-[#D96B0B] text-sm outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Observações de Arranjo / Dinâmica
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Não alterar o tom. Começar com violão suave..."
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:border-[#D96B0B] text-xs outline-none resize-none"
            />
          </div>

          <div className="pt-3 safe-area-pb">
            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-[#D96B0B] hover:bg-[#B85505] text-white text-sm font-bold shadow-md shadow-orange-500/20 flex items-center justify-center gap-2"
            >
              <Check size={18} />
              Salvar no Repertório Oficial
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
