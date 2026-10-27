import type { Member, SundayService, Availability, ScheduleAssignment, RepertoireSong, SetlistSong } from '../types';
import { getCurrentMonthKey, getSundaysOfMonth } from '../utils/dateUtils';

export const AVAILABLE_INSTRUMENTS: string[] = [
  'Voz Principal',
  'Backing Vocal',
  'Violão',
  'Guitarra',
  'Teclado',
  'Baixo',
  'Bateria',
  'Percussão',
  'Sax / Metais',
  'Sonoplastia / Som',
  'Multimídia / Projeção',
  'Transmissão / Live',
  'Fotografia / Vídeo',
  'Iluminação',
];

export const INITIAL_MEMBERS: Member[] = [
  {
    id: 'm1',
    name: 'Felipe Silva',
    phone: '(11) 98765-4321',
    email: 'felipe@espacocristao.org',
    roles: ['Violão', 'Teclado', 'Voz Principal'],
  },
  {
    id: 'm2',
    name: 'Sarah Mendes',
    phone: '(11) 99123-4567',
    email: 'sarah@espacocristao.org',
    roles: ['Voz Principal', 'Backing Vocal'],
  },
  {
    id: 'm3',
    name: 'Lucas Ferreira',
    phone: '(11) 97654-3210',
    email: 'lucas@espacocristao.org',
    roles: ['Bateria', 'Percussão'],
  },
  {
    id: 'm4',
    name: 'Davi Oliveira',
    phone: '(11) 98234-5678',
    email: 'davi@espacocristao.org',
    roles: ['Baixo', 'Violão'],
  },
  {
    id: 'm5',
    name: 'Gabriel Costa',
    phone: '(11) 99456-7890',
    email: 'gabriel@espacocristao.org',
    roles: ['Guitarra', 'Violão'],
  },
  {
    id: 'm6',
    name: 'Priscila Rocha',
    phone: '(11) 98111-2233',
    email: 'priscila@espacocristao.org',
    roles: ['Teclado', 'Backing Vocal'],
  },
  {
    id: 'm7',
    name: 'Marcos Santos',
    phone: '(11) 97222-3344',
    email: 'marcos@espacocristao.org',
    roles: ['Sonoplastia / Som'],
  },
  {
    id: 'm8',
    name: 'Tiago Ramos',
    phone: '(11) 98333-4455',
    email: 'tiago@espacocristao.org',
    roles: ['Multimídia / Projeção', 'Transmissão / Live'],
  },
  {
    id: 'm9',
    name: 'Beatriz Lima',
    phone: '(11) 99444-5566',
    email: 'beatriz@espacocristao.org',
    roles: ['Fotografia / Vídeo'],
  },
];

// Repertório oficial da igreja ("Músicas que já tocamos")
export const INITIAL_REPERTOIRE: RepertoireSong[] = [
  {
    id: 'r1',
    title: 'Bondade de Deus',
    artist: 'Isaías Saad',
    tone: 'G',
    link: 'https://www.cifraclub.com.br/isaias-saad/bondade-de-deus/',
    notes: 'Versão oficial da igreja em Sol Maior (G). Não alterar o tom.',
  },
  {
    id: 'r2',
    title: 'Ruja o Leão',
    artist: 'Casa Worship',
    tone: 'D',
    link: 'https://www.cifraclub.com.br/casa-worship/ruja-o-leao/',
    notes: 'Intro forte de guitarra e bateria marcando no surdo.',
  },
  {
    id: 'r3',
    title: 'É Tudo Sobre Você',
    artist: 'Morada',
    tone: 'Em',
    link: 'https://www.cifraclub.com.br/morada/e-tudo-sobre-voce/',
    notes: 'Tom oficial Em. Condução suave no teclado.',
  },
  {
    id: 'r4',
    title: 'A Ele a Glória',
    artist: 'Gabriela Rocha',
    tone: 'C',
    link: 'https://www.cifraclub.com.br/gabriela-rocha/a-ele-a-gloria/',
    notes: 'Arranjo com cordas e dinâmica crescente.',
  },
  {
    id: 'r5',
    title: 'Vem Me Buscar',
    artist: 'Jefferson & Suellen',
    tone: 'A',
    link: 'https://www.cifraclub.com.br/jefferson-e-suellen/vem-me-buscar/',
    notes: 'Tom A. Backing vocals bem abertos no refrão.',
  },
  {
    id: 'r6',
    title: 'Grandes Coisas',
    artist: 'Fernandinho',
    tone: 'B',
    link: 'https://www.cifraclub.com.br/fernandinho/grandes-coisas/',
    notes: 'Tom B (Si Maior). Louvor de celebração e júbilo.',
  },
  {
    id: 'r7',
    title: 'Santo Espírito',
    artist: 'Laura Souguellis',
    tone: 'D',
    link: 'https://www.cifraclub.com.br/laura-souguellis/santo-espirito/',
    notes: 'Ministração espontânea no final.',
  },
  {
    id: 'r8',
    title: 'Ousado Amor',
    artist: 'Isaías Saad',
    tone: 'G#m',
    link: 'https://www.cifraclub.com.br/isaias-saad/ousado-amor/',
    notes: 'Tom oficial G#m.',
  },
];

/**
 * Gera automaticamente os cultos de domingo (Manhã e Noite) para o mês atual e próximo mês
 */
export function generateInitialSundayServices(): SundayService[] {
  const currentKey = getCurrentMonthKey();
  const [currY, currM] = currentKey.split('-').map(Number);

  // Mês atual e próximo
  const monthsToGenerate = [
    { year: currY, month: currM },
    { year: currM === 12 ? currY + 1 : currY, month: currM === 12 ? 1 : currM + 1 },
  ];

  const services: SundayService[] = [];

  monthsToGenerate.forEach(({ year, month }) => {
    const sundays = getSundaysOfMonth(year, month);
    sundays.forEach((date) => {
      // Culto Manhã
      services.push({
        id: `srv-${date}-manha`,
        date,
        period: 'manha',
        title: 'Culto da Manhã',
        time: '09:30',
        status: 'draft',
      });
      // Culto Noite
      services.push({
        id: `srv-${date}-noite`,
        date,
        period: 'noite',
        title: 'Culto da Noite',
        time: '19:00',
        status: 'draft',
      });
    });
  });

  return services;
}

export function generateInitialAvailabilities(services: SundayService[]): Availability[] {
  const availabilities: Availability[] = [];

  // Gera dados de exemplo para os integrantes pré-cadastrados
  services.slice(0, 8).forEach((service, idx) => {
    INITIAL_MEMBERS.forEach((member, mIdx) => {
      // Simula uma distribuição realista de respostas
      if ((idx + mIdx) % 5 === 0) {
        availabilities.push({
          serviceId: service.id,
          memberId: member.id,
          status: 'indisponivel',
        });
      } else if ((idx + mIdx) % 7 !== 0) {
        availabilities.push({
          serviceId: service.id,
          memberId: member.id,
          status: 'disponivel',
        });
      }
    });
  });

  return availabilities;
}

export function generateInitialAssignments(services: SundayService[]): ScheduleAssignment[] {
  const assignments: ScheduleAssignment[] = [];

  if (services.length > 0) {
    const firstService = services[0];
    assignments.push(
      { serviceId: firstService.id, memberId: 'm1', role: 'Violão' },
      { serviceId: firstService.id, memberId: 'm2', role: 'Voz Principal' },
      { serviceId: firstService.id, memberId: 'm3', role: 'Bateria' },
      { serviceId: firstService.id, memberId: 'm4', role: 'Baixo' },
      { serviceId: firstService.id, memberId: 'm6', role: 'Teclado' }
    );
  }

  return assignments;
}

export function generateInitialSetlists(services: SundayService[]): SetlistSong[] {
  const setlists: SetlistSong[] = [];

  if (services.length > 0) {
    const firstService = services[0];
    setlists.push(
      {
        id: 'set-1',
        serviceId: firstService.id,
        title: 'Bondade de Deus',
        artist: 'Isaías Saad',
        tone: 'G',
        link: 'https://www.cifraclub.com.br/isaias-saad/bondade-de-deus/',
        notes: 'Abertura suave com violão e teclado',
        order: 1,
      },
      {
        id: 'set-2',
        serviceId: firstService.id,
        title: 'Ruja o Leão',
        artist: 'Casa Worship',
        tone: 'D',
        link: 'https://www.cifraclub.com.br/casa-worship/ruja-o-leao/',
        notes: 'Crescendo até a ministração',
        order: 2,
      },
      {
        id: 'set-3',
        serviceId: firstService.id,
        title: 'É Tudo Sobre Você',
        artist: 'Morada',
        tone: 'Em',
        link: 'https://www.cifraclub.com.br/morada/e-tudo-sobre-voce/',
        notes: 'Louvor de adoração e consagração',
        order: 3,
      }
    );
  }

  return setlists;
}
