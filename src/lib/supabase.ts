import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient, Session } from '@supabase/supabase-js';

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

let supabaseInstance: SupabaseClient | null = null;

export const saveSupabaseConfig = (url: string, anonKey: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('espaco_cristao_supabase_url', url.trim());
    localStorage.setItem('espaco_cristao_supabase_anon_key', anonKey.trim());
  }
  supabaseInstance = null; // Reinicializa a instância com novas chaves
};

export const clearSupabaseConfig = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('espaco_cristao_supabase_url');
    localStorage.removeItem('espaco_cristao_supabase_anon_key');
  }
  supabaseInstance = null;
};

// Inicialização segura do cliente Supabase (usando apenas anonKey no frontend)
export const getSupabaseClient = (): SupabaseClient | null => {
  const config = getSupabaseConfig();
  if (!config.isConfigured) return null;

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
    } catch (err) {
      console.warn('Erro ao inicializar Supabase client:', err);
      return null;
    }
  }
  return supabaseInstance;
};

// ==============================================================================
// FUNÇÕES DE AUTENTICAÇÃO SUPABASE AUTH
// ==============================================================================

export const signInWithEmail = async (email: string, password: string) => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Cliente Supabase não está configurado.');
  const { data, error } = await client.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw error;
  return data;
};

export const signUpWithEmail = async (email: string, password: string, fullName: string) => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Cliente Supabase não está configurado.');
  const { data, error } = await client.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: {
        full_name: fullName.trim(),
      },
    },
  });
  if (error) throw error;
  return data;
};

export const signOutUser = async () => {
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client.auth.signOut();
  if (error) throw error;
};

export const resetPasswordForEmail = async (email: string) => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Cliente Supabase não está configurado.');
  const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: window.location.origin,
  });
  if (error) throw error;
};

export const getCurrentSession = async (): Promise<Session | null> => {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data } = await client.auth.getSession();
  return data.session;
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
