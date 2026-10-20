import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig,
  testSupabaseConnection,
} from '../lib/supabase';
import {
  X,
  Database,
  Copy,
  Check,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

interface Props {
  onClose: () => void;
}

export const SupabaseSetupModal: React.FC<Props> = ({ onClose }) => {
  const { isDemoMode, setIsDemoMode, refreshData } = useApp();

  const currentConfig = getSupabaseConfig();

  const [url, setUrl] = useState(currentConfig.url);
  const [anonKey, setAnonKey] = useState(currentConfig.anonKey);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  const handleCopySql = async () => {
    try {
      const response = await fetch('/src/sql/schema.sql');
      const text = await response.text();
      await navigator.clipboard.writeText(text);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2500);
    } catch {
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2500);
    }
  };

  const handleSaveAndTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setTesting(true);
    setTestResult(null);

    saveSupabaseConfig(url, anonKey);

    const res = await testSupabaseConnection();
    setTestResult(res);
    setTesting(false);

    if (res.success) {
      setIsDemoMode(false);
      await refreshData();
    }
  };

  const handleResetToDemo = () => {
    clearSupabaseConfig();
    setUrl('');
    setAnonKey('');
    setIsDemoMode(true);
    setTestResult({ success: true, message: 'Modo Demonstração reativado com dados de exemplo!' });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-stone-50 border-b border-stone-200 p-4 sm:p-5 flex items-start justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Database size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-stone-900">
                  Conexão com o Supabase
                </h3>
                {isDemoMode ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                    Modo Demonstração
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Supabase Conectado
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-700">
                Guia de configuração para persistência real e políticas de segurança RLS
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

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {testResult && (
            <div
              className={`p-3.5 rounded-2xl border text-xs sm:text-sm font-medium flex items-center gap-2.5 ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              {testResult.success ? (
                <Check size={18} className="text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle size={18} className="text-rose-600 shrink-0" />
              )}
              <p>{testResult.message}</p>
            </div>
          )}

          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3">
            <ShieldCheck size={20} className="text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-950">
              <p className="font-bold">Segurança e Row Level Security (RLS)</p>
              <p className="mt-0.5 text-amber-800 leading-relaxed">
                As regras de permissão (integrante só edita sua própria disponibilidade; apenas admin edita
                escalas e cultos; integrantes só veem escalas publicadas) são aplicadas no PostgreSQL do Supabase,
                e nenhuma chave de serviço (service_role) é exposta.
              </p>
            </div>
          </div>

          {/* Step 1: SQL Script */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wide flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-stone-900 text-white flex items-center justify-center text-[10px]">
                  1
                </span>
                Executar Script SQL no Supabase
              </h4>

              <button
                type="button"
                onClick={handleCopySql}
                className="text-xs font-bold text-amber-800 hover:text-amber-900 flex items-center gap-1 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-200 transition-colors"
              >
                {copiedSql ? (
                  <>
                    <Check size={14} className="text-emerald-600" />
                    <span className="text-emerald-700">Script Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copiar Script SQL</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-stone-700">
              No painel do Supabase, acesse o <strong>SQL Editor</strong>, cole o conteúdo do script
              e clique em <strong>Run</strong>. Ele cria todas as tabelas, triggers e políticas RLS.
            </p>
          </div>

          {/* Step 2: Credentials Input */}
          <form onSubmit={handleSaveAndTest} className="space-y-3 pt-2 border-t border-stone-200">
            <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wide flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-stone-900 text-white flex items-center justify-center text-[10px]">
                2
              </span>
              Informar Credenciais do Supabase
            </h4>
            <p className="text-xs text-stone-700">
              Obtenha em <em>Project Settings &gt; API</em> no Supabase. Você pode salvá-las no arquivo{' '}
              <code className="bg-stone-100 px-1 py-0.5 rounded text-[11px]">.env</code> ou colar abaixo
              para conectar imediatamente:
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Project URL (VITE_SUPABASE_URL)
                </label>
                <input
                  type="url"
                  placeholder="https://xyzcompany.supabase.co"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Anon Public Key (VITE_SUPABASE_ANON_KEY)
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={handleResetToDemo}
                className="text-xs text-stone-700 hover:text-stone-900 font-semibold underline"
              >
                Voltar ao Modo Demonstração (Mock)
              </button>

              <button
                type="submit"
                disabled={testing || !url.trim() || !anonKey.trim()}
                className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 transition-colors shadow-2xs"
              >
                {testing ? (
                  <RefreshCw size={16} className="animate-spin text-amber-400" />
                ) : (
                  <Database size={16} className="text-amber-400" />
                )}
                <span>Salvar e Testar Conexão</span>
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-stone-50 border-t border-stone-200 p-4 px-6 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-semibold transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
