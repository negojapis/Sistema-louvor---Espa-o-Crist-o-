import React, { useState } from 'react';
import type { Service } from '../types';
import { useApp } from '../context/AppContext';
import {
  X,
  Plus,
  Trash2,
  Music,
  ExternalLink,
} from 'lucide-react';

interface Props {
  service: Service;
  onClose: () => void;
}

const COMMON_TONES = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'Em', 'Am', 'Dm', 'Bm', 'F#m'];

export const SongEditorModal: React.FC<Props> = ({ service, onClose }) => {
  const { getServiceSongs, addSong, deleteSong } = useApp();

  const songs = getServiceSongs(service.id);

  const [title, setTitle] = useState('');
  const [tone, setTone] = useState('');
  const [link, setLink] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsAdding(true);
    try {
      await addSong(service.id, {
        title: title.trim(),
        tone: tone.trim() || undefined,
        link: link.trim() || undefined,
      });
      setTitle('');
      setTone('');
      setLink('');
    } catch {
      alert('Erro ao adicionar música.');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-stone-50 border-b border-stone-200 p-4 sm:p-5 flex items-start justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Music size={20} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-stone-900">
                Repertório de Músicas
              </h3>
              <p className="text-xs text-stone-700">{service.title}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* Add Song Form */}
          <form onSubmit={handleAdd} className="bg-stone-50/80 p-4 rounded-2xl border border-stone-200 space-y-3">
            <p className="text-xs font-bold text-stone-700 uppercase tracking-wide">
              Nova Música
            </p>

            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                Nome da Música *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Bondade de Deus, A Casa É Sua..."
                className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                  Tom (opcional)
                </label>
                <input
                  type="text"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  placeholder="Ex: G, Em, D#"
                  className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />

                <div className="flex flex-wrap gap-1 mt-1.5">
                  {COMMON_TONES.slice(0, 6).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTone(t)}
                      className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-stone-200/70 hover:bg-amber-100 text-stone-700 hover:text-amber-900 transition-colors"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                  Link de Referência (opcional)
                </label>
                <input
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="YouTube, Cifra Club, etc."
                  className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isAdding || !title.trim()}
              className="w-full py-2 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs mt-2"
            >
              <Plus size={16} />
              <span>Adicionar ao Repertório</span>
            </button>
          </form>

          {/* Current Songs List */}
          <div>
            <p className="text-xs font-bold text-stone-700 uppercase tracking-wide mb-2">
              Músicas do Culto ({songs.length})
            </p>

            {songs.length === 0 ? (
              <p className="text-xs text-stone-700 italic py-4 text-center bg-stone-50 rounded-xl border border-stone-200">
                Nenhuma música adicionada ainda.
              </p>
            ) : (
              <div className="space-y-2">
                {songs.map((song, idx) => (
                  <div
                    key={song.id}
                    className="p-3 rounded-xl bg-white border border-stone-200 flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-stone-100 text-stone-600 font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-bold text-stone-900 text-xs truncate">{song.title}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                          {song.tone && (
                            <span className="font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/60">
                              Tom: {song.tone}
                            </span>
                          )}
                          {song.link && (
                            <a
                              href={song.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-stone-600 hover:text-stone-900 flex items-center gap-0.5"
                            >
                              <span>Link</span>
                              <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => deleteSong(song.id)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-stone-50 border-t border-stone-200 p-4 px-6 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition-colors"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
