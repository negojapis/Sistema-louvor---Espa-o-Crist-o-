export type PeriodType = 'manha' | 'noite';

export interface Member {
  id: string;
  name: string;
  phone: string;
  email: string;
  roles: string[]; // Instrumentos ou funções que a pessoa toca/exerce
}

export interface SundayService {
  id: string;
  date: string; // YYYY-MM-DD (apenas domingos)
  period: PeriodType;
  title: string;
  time: string; // "09:30" ou "19:00"
  status: 'draft' | 'published';
}

export type AvailabilityStatus = 'disponivel' | 'indisponivel' | 'pendente';

export interface Availability {
  serviceId: string;
  memberId: string;
  status: AvailabilityStatus;
}

export interface ScheduleAssignment {
  serviceId: string;
  memberId: string;
  role: string; // Instrumento que o pastor escolheu para a pessoa tocar neste culto
}

// Músicas que já tocamos (Repertório oficial da igreja)
export interface RepertoireSong {
  id: string;
  title: string;
  artist: string; // Cantor / Versão oficial (ex: Isaías Saad, Morada)
  tone: string; // Tom padrão da igreja (ex: "G", "D", "Em")
  link?: string; // Link Cifra Club ou YouTube
  notes?: string;
}

// Músicas que vamos tocar (Setlist do culto)
export interface SetlistSong {
  id: string;
  serviceId: string;
  title: string;
  artist: string;
  tone: string;
  link?: string;
  notes?: string;
  order: number;
}
