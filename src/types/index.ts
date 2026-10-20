export type UserRole = 'admin' | 'member';

export type AvailabilityStatus = 'disponivel' | 'indisponivel' | 'pendente';

export type ServiceStatus = 'draft' | 'published';

export type ServicePeriod = 'manha' | 'noite' | 'outro';

export type ServiceType = 'domingo_manha' | 'domingo_noite' | 'sabado_jovens' | 'outro';

export type MinistryType = 'Louvor' | 'Condução e Palavra' | 'Multimídia' | 'Outro';

export interface Member {
  id: string;
  name: string;
  ministry: MinistryType;
  roles: string[]; // Funções que a pessoa está habilitada a exercer
  email?: string;
  phone?: string;
  active: boolean;
  is_leader?: boolean; // Ex: Daniel líder de multimídia (não concede admin automático)
  user_id?: string | null;
}

export interface Service {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  period?: ServicePeriod;
  service_type?: ServiceType;
  notes?: string;
  status: ServiceStatus;
  created_at?: string;
}

export interface Availability {
  id: string;
  service_id: string;
  member_id: string;
  status: AvailabilityStatus;
  updated_at: string;
}

export interface MonthlySubmission {
  id: string;
  member_id: string;
  month: string; // Formato YYYY-MM (ex: "2026-11")
  submitted_at: string;
  serve_other_suggestion?: string; // "Você também pode servir em outra função ou ministério neste mês?"
  updated_at?: string;
}

export interface ScheduleAssignment {
  id: string;
  service_id: string;
  member_id: string;
  role_name: string;
  order_index?: number;
  ministry_section?: 'louvor' | 'multimidia' | 'conducao';
}

export interface Song {
  id: string;
  service_id: string;
  title: string;
  tone?: string; // Tom opcional (ex: "G", "Em", "D#")
  link?: string; // Link de referência opcional
  order_index: number;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  member_id?: string; // ID do integrante associado
}

// Funções padrão separadas por ministério
export const MINISTRY_ROLES_CATALOG: Record<MinistryType, string[]> = {
  Louvor: [
    'Voz',
    'Cajon',
    'Violão',
    'Guitarra',
    'Baixo',
    'Bateria',
    'Teclado',
  ],
  'Condução e Palavra': [
    'Ministração e condução',
    'Auxílio na voz',
    'Palavra',
  ],
  Multimídia: [
    'Som',
    'Luz',
    'Projeção',
  ],
  Outro: [
    'Apoio Geral',
    'Recepção',
  ],
};

export const ALL_ROLES = [
  'Voz',
  'Cajon',
  'Violão',
  'Guitarra',
  'Baixo',
  'Bateria',
  'Teclado',
  'Ministração e condução',
  'Auxílio na voz',
  'Palavra',
  'Som',
  'Luz',
  'Projeção',
];

export const DEFAULT_MINISTRY_ROLES = ALL_ROLES;
