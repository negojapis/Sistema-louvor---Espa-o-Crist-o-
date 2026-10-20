import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Obter credenciais via variáveis de ambiente (.env) ou configuração salva no navegador
const getEnvOrStorage = (key: string, storageKey: string): string => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(storageKey);
    if (saved && saved.trim() !== '') return saved.trim();
  }
  return (import.meta.env[key] as string) || '';
};

export const getSupabaseConfig = () => {
  const url = getEnvOrStorage('VITE_SUPABASE_URL', 'espaco_cristao_supabase_url');
  const anonKey = getEnvOrStorage('VITE_SUPABASE_ANON_KEY', 'espaco_cristao_supabase_anon_key');
  return {
    url,
    anonKey,
    isConfigured: Boolean(url && anonKey && url.startsWith('http') && anonKey.length > 10),
  };
};

export const saveSupabaseConfig = (url: string, anonKey: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('espaco_cristao_supabase_url', url.trim());
    localStorage.setItem('espaco_cristao_supabase_anon_key', anonKey.trim());
  }
};

export const clearSupabaseConfig = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('espaco_cristao_supabase_url');
    localStorage.removeItem('espaco_cristao_supabase_anon_key');
  }
};

// Inicialização segura do cliente Supabase
let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  const config = getSupabaseConfig();
  if (!config.isConfigured) return null;

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } catch (err) {
      console.warn('Erro ao inicializar Supabase client:', err);
      return null;
    }
  }
  return supabaseInstance;
};

// Testar conexão com o banco do Supabase
export const testSupabaseConnection = async (): Promise<{ success: boolean; message: string }> => {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'URL ou Chave Anon não configuradas.' };
  }
  try {
    const { error } = await client.from('services').select('count', { count: 'exact', head: true });
    if (error) {
      // Se der erro de tabela não encontrada ou RLS, indica que conectou mas falta rodar o SQL
      if (error.code === '42P01') {
        return { success: false, message: 'Conectou ao Supabase, mas a tabela "services" ainda não existe. Execute o script SQL no Supabase!' };
      }
      return { success: true, message: `Conexão bem sucedida com o Supabase! (Status: ${error.message})` };
    }
    return { success: true, message: 'Conexão com o Supabase estabelecida com sucesso!' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Falha ao conectar com o Supabase.';
    return { success: false, message: msg };
  }
};
