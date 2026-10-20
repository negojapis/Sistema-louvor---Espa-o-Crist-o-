import React, { useState } from 'react';
import {
  Database,
  ShieldCheck,
  Copy,
  Check,
} from 'lucide-react';

interface Props {
  onOpenSupabaseModal: () => void;
}

export const HelpView: React.FC<Props> = ({ onOpenSupabaseModal }) => {
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const envSample = `# Arquivo .env no diretório raiz do projeto
VITE_SUPABASE_URL=https://seuid.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
`;

  const copyEnv = () => {
    navigator.clipboard.writeText(envSample);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2000);
  };

  const copySql = async () => {
    try {
      const res = await fetch('/src/sql/schema.sql');
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2000);
    } catch {
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2000);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-500 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-stone-900">
                  Arquitetura &amp; Segurança (Supabase + RLS)
                </h2>
              </div>
              <p className="text-xs text-stone-700 mt-0.5">
                Regras de permissão aplicadas diretamente no banco de dados PostgreSQL.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenSupabaseModal}
            className="px-4 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-2xs"
          >
            <Database size={16} />
            <span>Configurar Conexão</span>
          </button>
        </div>
      </div>

      {/* Permissions Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Integrante Permissions */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-2">
          <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
            <span className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs">
              M
            </span>
            <span>Perfil: Integrante</span>
          </div>
          <ul className="text-xs text-stone-700 space-y-1.5 pt-2 list-disc list-inside">
            <li>
              Pode alterar <strong>apenas a sua própria disponibilidade</strong> por culto.
            </li>
            <li>
              Visualiza apenas <strong>escalas publicadas</strong> (escalas em rascunho são bloqueadas
              no RLS).
            </li>
            <li>Visualiza as músicas e links de referência dos cultos publicados.</li>
            <li>Bloqueado para criar, editar ou excluir cultos e integrantes.</li>
          </ul>
        </div>

        {/* Admin Permissions */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-2">
          <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
            <span className="w-7 h-7 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center text-xs">
              A
            </span>
            <span>Perfil: Administrador</span>
          </div>
          <ul className="text-xs text-stone-700 space-y-1.5 pt-2 list-disc list-inside">
            <li>Cadastra, edita e remove cultos com títulos, datas e horários.</li>
            <li>Cadastra integrantes e define todas as suas funções possíveis.</li>
            <li>Monta a escala manualmente escolhendo integrante e função.</li>
            <li>Acesso a todas as respostas de disponibilidade da equipe.</li>
            <li>Adiciona, edita e ordena músicas com tom e links de referência.</li>
          </ul>
        </div>
      </div>

      {/* Step by step configuration for the user */}
      <div className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-6 space-y-5">
        <h3 className="text-base font-bold text-stone-900">
          Passos de Configuração que Dependem de Você:
        </h3>

        <div className="space-y-4 text-xs text-stone-700">
          {/* Step 1 */}
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-stone-900 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
              1
            </span>
            <div>
              <p className="font-bold text-stone-900 text-sm">Criar um projeto no Supabase</p>
              <p className="mt-0.5">
                Acesse{' '}
                <a
                  href="https://supabase.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-800 font-bold underline"
                >
                  supabase.com
                </a>{' '}
                e crie um novo projeto gratuito na região mais próxima (ex: South America - São Paulo).
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-stone-900 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
              2
            </span>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-bold text-stone-900 text-sm">Executar o Script SQL</p>
                <button
                  onClick={copySql}
                  className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 font-semibold text-[11px] text-stone-800 flex items-center gap-1"
                >
                  {copiedSql ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  <span>{copiedSql ? 'Copiado!' : 'Copiar SQL'}</span>
                </button>
              </div>
              <p className="mt-0.5">
                Vá na aba <strong>SQL Editor</strong> do Supabase e cole o script disponível no arquivo{' '}
                <code className="bg-stone-100 px-1 py-0.5 rounded text-amber-900">src/sql/schema.sql</code>.
                Ele cria automaticamente todas as tabelas, índices, triggers e regras RLS.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-stone-900 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
              3
            </span>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-bold text-stone-900 text-sm">Definir as Chaves de Acesso</p>
                <button
                  onClick={copyEnv}
                  className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 font-semibold text-[11px] text-stone-800 flex items-center gap-1"
                >
                  {copiedEnv ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  <span>{copiedEnv ? 'Copiado!' : 'Copiar formato .env'}</span>
                </button>
              </div>
              <p className="mt-0.5">
                Copie a <strong>Project URL</strong> e a <strong>Anon Public Key</strong> do painel
                (Settings &gt; API) e insira no arquivo <code className="bg-stone-100 px-1 py-0.5 rounded text-amber-900">.env</code>{' '}
                ou diretamente no botão "Configurar Conexão" no topo da página.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
