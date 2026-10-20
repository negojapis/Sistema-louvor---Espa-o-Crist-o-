import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type {
  Member,
  Service,
  Availability,
  MonthlySubmission,
  ScheduleAssignment,
  Song,
  AppUser,
  AvailabilityStatus,
  ServiceStatus,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_MEMBERS,
  INITIAL_SERVICES,
  INITIAL_AVAILABILITIES,
  INITIAL_MONTHLY_SUBMISSIONS,
  INITIAL_SCHEDULE_ASSIGNMENTS,
  INITIAL_SONGS,
} from '../mock/demoData';
import { getSupabaseClient, getSupabaseConfig } from '../lib/supabase';

interface AppContextType {
  // Estado de Acesso e Modo
  currentUser: AppUser;
  availableUsers: AppUser[];
  switchUser: (userId: string) => void;
  isDemoMode: boolean;
  setIsDemoMode: (val: boolean) => void;
  isSupabaseConnected: boolean;
  isAdmin: boolean;
  currentMember: Member | undefined;

  // Dados
  members: Member[];
  services: Service[];
  availabilities: Availability[];
  monthlySubmissions: MonthlySubmission[];
  scheduleAssignments: ScheduleAssignment[];
  songs: Song[];

  // Ações de Disponibilidade
  setMemberAvailability: (serviceId: string, status: AvailabilityStatus, targetMemberId?: string) => Promise<void>;
  saveMonthlyAvailability: (
    month: string,
    statuses: Record<string, AvailabilityStatus>,
    serveOtherSuggestion?: string,
    targetMemberId?: string
  ) => Promise<void>;
  getMemberAvailability: (serviceId: string, memberId: string) => AvailabilityStatus;
  getServiceAvailabilityCounts: (serviceId: string) => { disponiveis: number; indisponiveis: number; pendentes: number };
  getMonthlySubmission: (memberId: string, month: string) => MonthlySubmission | undefined;
  getMonthlySubmissionsForMonth: (month: string) => MonthlySubmission[];

  // Ações de Cultos
  createService: (service: Omit<Service, 'id'>) => Promise<Service>;
  updateService: (id: string, updates: Partial<Service>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  toggleServiceStatus: (serviceId: string) => Promise<void>;
  generateMonthSundays: (
    year: number,
    month: number, // 1-12
    morningTime?: string,
    eveningTime?: string
  ) => Promise<Service[]>;

  // Ações de Integrantes
  createMember: (member: Omit<Member, 'id'>) => Promise<Member>;
  updateMember: (id: string, updates: Partial<Member>) => Promise<void>;
  deactivateMember: (id: string, active: boolean) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;

  // Ações de Escala
  saveSchedule: (
    serviceId: string,
    assignments: { member_id: string; role_name: string; ministry_section?: 'louvor' | 'multimidia' | 'conducao' }[],
    publish?: boolean
  ) => Promise<{ success: boolean; error?: string }>;
  getServiceSchedule: (serviceId: string) => (ScheduleAssignment & { member?: Member; hasConflict?: boolean })[];
  getServiceConflicts: (serviceId: string) => { assignment: ScheduleAssignment; member?: Member }[];

  // Ações de Músicas
  addSong: (serviceId: string, song: { title: string; tone?: string; link?: string }) => Promise<void>;
  updateSong: (id: string, updates: Partial<Song>) => Promise<void>;
  deleteSong: (id: string) => Promise<void>;
  getServiceSongs: (serviceId: string) => Song[];

  // Utilidades
  resetDemoData: () => void;
  refreshData: () => Promise<void>;
  loading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_PREFIX = 'louvor_escala_demo_v2_';

function loadStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.error('Erro ao ler localStorage', e);
    return fallback;
  }
}

function saveStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error('Erro ao salvar localStorage', e);
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    const config = getSupabaseConfig();
    return !config.isConfigured;
  });

  const [availableUsers] = useState<AppUser[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<AppUser>(() => {
    const saved = localStorage.getItem('louvor_escala_current_user_id');
    const found = INITIAL_USERS.find((u) => u.id === saved);
    return found || INITIAL_USERS[0];
  });

  const [members, setMembers] = useState<Member[]>(() => loadStorage('members', INITIAL_MEMBERS));
  const [services, setServices] = useState<Service[]>(() => {
    const loaded = loadStorage<Service[]>('services', INITIAL_SERVICES);
    // Assegura que o horário do culto de domingo à noite seja 19:00 conforme diretriz
    const updated = loaded.map((s) => {
      if (s.service_type === 'domingo_noite' && s.time === '18:30') {
        return { ...s, time: '19:00' };
      }
      return s;
    });

    // Se ainda não tiver os cultos de dezembro cadastrados no storage local, mescla os cultos iniciais de dezembro
    const hasDec = updated.some((s) => s.date.startsWith('2026-12'));
    if (!hasDec) {
      const decServices = INITIAL_SERVICES.filter((s) => s.date.startsWith('2026-12'));
      return [...updated, ...decServices];
    }
    return updated;
  });
  const [availabilities, setAvailabilities] = useState<Availability[]>(() =>
    loadStorage('availabilities', INITIAL_AVAILABILITIES)
  );
  const [monthlySubmissions, setMonthlySubmissions] = useState<MonthlySubmission[]>(() =>
    loadStorage('monthly_submissions', INITIAL_MONTHLY_SUBMISSIONS)
  );
  const [scheduleAssignments, setScheduleAssignments] = useState<ScheduleAssignment[]>(() => {
    const loaded = loadStorage<ScheduleAssignment[]>('schedules', INITIAL_SCHEDULE_ASSIGNMENTS);
    if (loaded.some((a) => a.id === 'as-1' && a.member_id === 'm-pr-junior')) {
      return INITIAL_SCHEDULE_ASSIGNMENTS;
    }
    return loaded;
  });
  const [songs, setSongs] = useState<Song[]>(() => loadStorage('songs', INITIAL_SONGS));

  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(false);

  useEffect(() => {
    if (isDemoMode) {
      saveStorage('members', members);
      saveStorage('services', services);
      saveStorage('availabilities', availabilities);
      saveStorage('monthly_submissions', monthlySubmissions);
      saveStorage('schedules', scheduleAssignments);
      saveStorage('songs', songs);
    }
  }, [members, services, availabilities, monthlySubmissions, scheduleAssignments, songs, isDemoMode]);

  const isAdmin = currentUser.role === 'admin';

  const currentMember = useMemo(() => {
    return members.find((m) => m.id === currentUser.member_id || m.user_id === currentUser.id);
  }, [members, currentUser]);

  const switchUser = useCallback((userId: string) => {
    const user = availableUsers.find((u) => u.id === userId);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('louvor_escala_current_user_id', user.id);
    }
  }, [availableUsers]);

  const checkSupabase = useCallback(async () => {
    const client = getSupabaseClient();
    if (!client) {
      setIsSupabaseConnected(false);
      return;
    }
    try {
      const { data, error } = await client.from('services').select('id').limit(1);
      setIsSupabaseConnected(!error && data !== null);
    } catch {
      setIsSupabaseConnected(false);
    }
  }, []);

  useEffect(() => {
    checkSupabase();
  }, [checkSupabase]);

  const loadSupabaseData = useCallback(async () => {
    const client = getSupabaseClient();
    if (!client || isDemoMode) return;

    setLoading(true);
    try {
      const [membersRes, servicesRes, availRes, subRes, schedRes, songsRes] = await Promise.all([
        client.from('members').select('*').order('name'),
        client.from('services').select('*').order('date', { ascending: true }),
        client.from('availabilities').select('*'),
        client.from('monthly_submissions').select('*'),
        client.from('schedule_assignments').select('*').order('order_index'),
        client.from('songs').select('*').order('order_index'),
      ]);

      if (membersRes.data) setMembers(membersRes.data);
      if (servicesRes.data) setServices(servicesRes.data);
      if (availRes.data) setAvailabilities(availRes.data);
      if (subRes.data) setMonthlySubmissions(subRes.data);
      if (schedRes.data) setScheduleAssignments(schedRes.data);
      if (songsRes.data) setSongs(songsRes.data);
    } catch (err) {
      console.error('Erro ao carregar do Supabase:', err);
    } finally {
      setLoading(false);
    }
  }, [isDemoMode]);

  useEffect(() => {
    if (!isDemoMode && isSupabaseConnected) {
      loadSupabaseData();
    }
  }, [isDemoMode, isSupabaseConnected, loadSupabaseData]);

  const getMemberAvailability = useCallback(
    (serviceId: string, memberId: string): AvailabilityStatus => {
      const found = availabilities.find(
        (a) => a.service_id === serviceId && a.member_id === memberId
      );
      return found ? found.status : 'pendente';
    },
    [availabilities]
  );

  const getServiceAvailabilityCounts = useCallback(
    (serviceId: string) => {
      let disponiveis = 0;
      let indisponiveis = 0;
      let respondidosCount = 0;

      availabilities.forEach((a) => {
        if (a.service_id === serviceId) {
          if (a.status === 'disponivel') disponiveis++;
          else if (a.status === 'indisponivel') indisponiveis++;
          respondidosCount++;
        }
      });

      const totalMembers = members.filter((m) => m.active).length;
      const pendentes = Math.max(0, totalMembers - respondidosCount);

      return { disponiveis, indisponiveis, pendentes };
    },
    [availabilities, members]
  );

  const setMemberAvailability = useCallback(
    async (serviceId: string, status: AvailabilityStatus, targetMemberId?: string) => {
      const memberId = targetMemberId || currentMember?.id;
      if (!memberId) {
        alert('Não foi possível identificar o integrante vinculado a este usuário.');
        return;
      }

      if (targetMemberId && targetMemberId !== currentMember?.id && !isAdmin) {
        alert('Você só pode alterar a sua própria disponibilidade.');
        return;
      }

      if (isDemoMode) {
        setAvailabilities((prev) => {
          const index = prev.findIndex((a) => a.service_id === serviceId && a.member_id === memberId);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = { ...updated[index], status, updated_at: new Date().toISOString() };
            return updated;
          }
          return [
            ...prev,
            {
              id: `av-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              service_id: serviceId,
              member_id: memberId,
              status,
              updated_at: new Date().toISOString(),
            },
          ];
        });
        return;
      }

      const client = getSupabaseClient();
      if (!client) return;

      const { error } = await client.from('availabilities').upsert(
        {
          service_id: serviceId,
          member_id: memberId,
          status,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'service_id,member_id' }
      );

      if (error) {
        alert(`Erro ao salvar disponibilidade no Supabase: ${error.message}`);
      } else {
        await loadSupabaseData();
      }
    },
    [currentMember, isAdmin, isDemoMode, loadSupabaseData]
  );

  const getMonthlySubmission = useCallback(
    (memberId: string, month: string): MonthlySubmission | undefined => {
      return monthlySubmissions.find((s) => s.member_id === memberId && s.month === month);
    },
    [monthlySubmissions]
  );

  const getMonthlySubmissionsForMonth = useCallback(
    (month: string): MonthlySubmission[] => {
      return monthlySubmissions.filter((s) => s.month === month);
    },
    [monthlySubmissions]
  );

  const saveMonthlyAvailability = useCallback(
    async (
      month: string,
      statuses: Record<string, AvailabilityStatus>,
      serveOtherSuggestion?: string,
      targetMemberId?: string
    ) => {
      const memberId = targetMemberId || currentMember?.id;
      if (!memberId) {
        alert('Não foi possível identificar o integrante vinculado a este usuário.');
        return;
      }

      if (targetMemberId && targetMemberId !== currentMember?.id && !isAdmin) {
        alert('Você só pode alterar a sua própria disponibilidade.');
        return;
      }

      const now = new Date().toISOString();

      if (isDemoMode) {
        // Atualiza disponibilidades por culto
        setAvailabilities((prev) => {
          const next = [...prev];
          Object.entries(statuses).forEach(([srvId, st]) => {
            const idx = next.findIndex((a) => a.service_id === srvId && a.member_id === memberId);
            if (idx >= 0) {
              next[idx] = { ...next[idx], status: st, updated_at: now };
            } else {
              next.push({
                id: `av-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                service_id: srvId,
                member_id: memberId,
                status: st,
                updated_at: now,
              });
            }
          });
          return next;
        });

        // Atualiza ou cria submissão mensal
        setMonthlySubmissions((prev) => {
          const idx = prev.findIndex((s) => s.member_id === memberId && s.month === month);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = {
              ...next[idx],
              serve_other_suggestion: serveOtherSuggestion,
              submitted_at: now,
              updated_at: now,
            };
            return next;
          } else {
            return [
              ...prev,
              {
                id: `sub-${Date.now()}`,
                member_id: memberId,
                month,
                submitted_at: now,
                updated_at: now,
                serve_other_suggestion: serveOtherSuggestion,
              },
            ];
          }
        });
        return;
      }

      const client = getSupabaseClient();
      if (!client) return;

      const availabilityUpserts = Object.entries(statuses).map(([service_id, status]) => ({
        service_id,
        member_id: memberId,
        status,
        updated_at: now,
      }));

      if (availabilityUpserts.length > 0) {
        await client.from('availabilities').upsert(availabilityUpserts, {
          onConflict: 'service_id,member_id',
        });
      }

      await client.from('monthly_submissions').upsert(
        {
          member_id: memberId,
          month,
          serve_other_suggestion: serveOtherSuggestion || null,
          submitted_at: now,
          updated_at: now,
        },
        { onConflict: 'member_id,month' }
      );

      await loadSupabaseData();
    },
    [currentMember, isAdmin, isDemoMode, loadSupabaseData]
  );

  const createService = useCallback(
    async (serviceData: Omit<Service, 'id'>): Promise<Service> => {
      const newService: Service = {
        ...serviceData,
        id: `s-${Date.now()}`,
        created_at: new Date().toISOString(),
      };

      if (isDemoMode) {
        setServices((prev) => [newService, ...prev].sort((a, b) => a.date.localeCompare(b.date)));
        return newService;
      }

      const client = getSupabaseClient();
      if (!client) return newService;

      const { data, error } = await client.from('services').insert([serviceData]).select().single();
      if (error) {
        throw new Error(error.message);
      }
      await loadSupabaseData();
      return data;
    },
    [isDemoMode, loadSupabaseData]
  );

  const updateService = useCallback(
    async (id: string, updates: Partial<Service>) => {
      if (isDemoMode) {
        setServices((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
        return;
      }

      const client = getSupabaseClient();
      if (!client) return;

      const { error } = await client.from('services').update(updates).eq('id', id);
      if (error) throw new Error(error.message);
      await loadSupabaseData();
    },
    [isDemoMode, loadSupabaseData]
  );

  const deleteService = useCallback(
    async (id: string) => {
      if (isDemoMode) {
        setServices((prev) => prev.filter((s) => s.id !== id));
        setAvailabilities((prev) => prev.filter((a) => a.service_id !== id));
        setScheduleAssignments((prev) => prev.filter((sc) => sc.service_id !== id));
        setSongs((prev) => prev.filter((sg) => sg.service_id !== id));
        return;
      }

      const client = getSupabaseClient();
      if (!client) return;

      const { error } = await client.from('services').delete().eq('id', id);
      if (error) throw new Error(error.message);
      await loadSupabaseData();
    },
    [isDemoMode, loadSupabaseData]
  );

  const toggleServiceStatus = useCallback(
    async (serviceId: string) => {
      const service = services.find((s) => s.id === serviceId);
      if (!service) return;
      const nextStatus: ServiceStatus = service.status === 'published' ? 'draft' : 'published';
      await updateService(serviceId, { status: nextStatus });
    },
    [services, updateService]
  );

  const generateMonthSundays = useCallback(
    async (
      year: number,
      month: number, // 1 a 12
      morningTime: string = '09:30',
      eveningTime: string = '19:00'
    ): Promise<Service[]> => {
      if (!isAdmin) {
        throw new Error('Apenas o Pastor Administrador pode gerar cultos.');
      }

      const createdList: Service[] = [];
      const daysInMonth = new Date(year, month, 0).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, month - 1, day);
        if (d.getDay() === 0) {
          // Domingo
          const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

          createdList.push({
            id: `srv-${Date.now()}-${day}m`,
            title: 'Culto de Domingo - Manhã',
            date: dateStr,
            time: morningTime,
            period: 'manha',
            service_type: 'domingo_manha',
            notes: 'Culto Matutino da Família e Adoração.',
            status: 'draft',
            created_at: new Date().toISOString(),
          });

          createdList.push({
            id: `srv-${Date.now()}-${day}n`,
            title: 'Culto de Domingo - Noite',
            date: dateStr,
            time: eveningTime,
            period: 'noite',
            service_type: 'domingo_noite',
            notes: 'Culto de Celebração e Ministração da Palavra.',
            status: 'draft',
            created_at: new Date().toISOString(),
          });
        }
      }

      if (isDemoMode) {
        setServices((prev) => {
          const filtered = createdList.filter(
            (c) => !prev.some((exist) => exist.date === c.date && exist.time === c.time)
          );
          return [...prev, ...filtered].sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
        });
        return createdList;
      }

      const client = getSupabaseClient();
      if (!client) return createdList;

      const payload = createdList.map(({ id: _unusedId, ...rest }) => rest);
      const { data, error } = await client.from('services').insert(payload).select();
      if (error) throw new Error(error.message);
      await loadSupabaseData();
      return data || createdList;
    },
    [isAdmin, isDemoMode, loadSupabaseData]
  );

  const createMember = useCallback(
    async (memberData: Omit<Member, 'id'>): Promise<Member> => {
      const newMember: Member = {
        ...memberData,
        id: `m-${Date.now()}`,
      };

      if (isDemoMode) {
        setMembers((prev) => [...prev, newMember].sort((a, b) => a.name.localeCompare(b.name)));
        return newMember;
      }

      const client = getSupabaseClient();
      if (!client) return newMember;

      const { data, error } = await client.from('members').insert([memberData]).select().single();
      if (error) throw new Error(error.message);
      await loadSupabaseData();
      return data;
    },
    [isDemoMode, loadSupabaseData]
  );

  const updateMember = useCallback(
    async (id: string, updates: Partial<Member>) => {
      if (isDemoMode) {
        setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
        return;
      }

      const client = getSupabaseClient();
      if (!client) return;

      const { error } = await client.from('members').update(updates).eq('id', id);
      if (error) throw new Error(error.message);
      await loadSupabaseData();
    },
    [isDemoMode, loadSupabaseData]
  );

  const deactivateMember = useCallback(
    async (id: string, active: boolean) => {
      await updateMember(id, { active });
    },
    [updateMember]
  );

  const deleteMember = useCallback(
    async (id: string) => {
      if (isDemoMode) {
        setMembers((prev) => prev.filter((m) => m.id !== id));
        setScheduleAssignments((prev) => prev.filter((sc) => sc.member_id !== id));
        setAvailabilities((prev) => prev.filter((a) => a.member_id !== id));
        return;
      }

      const client = getSupabaseClient();
      if (!client) return;

      const { error } = await client.from('members').delete().eq('id', id);
      if (error) throw new Error(error.message);
      await loadSupabaseData();
    },
    [isDemoMode, loadSupabaseData]
  );

  const saveSchedule = useCallback(
    async (
      serviceId: string,
      assignments: { member_id: string; role_name: string; ministry_section?: 'louvor' | 'multimidia' | 'conducao' }[],
      publish?: boolean
    ): Promise<{ success: boolean; error?: string }> => {
      const memberIds = assignments.map((a) => a.member_id);
      const uniqueMemberIds = new Set(memberIds);
      if (uniqueMemberIds.size !== memberIds.length) {
        return {
          success: false,
          error: 'Existe integrante repetido na escala. Cada pessoa só pode ser escalada uma vez por culto.',
        };
      }

      for (const item of assignments) {
        const avail = getMemberAvailability(serviceId, item.member_id);
        if (avail === 'indisponivel') {
          const member = members.find((m) => m.id === item.member_id);
          return {
            success: false,
            error: `Não é permitido escalar ${member?.name || 'este integrante'} pois marcou INDISPONÍVEL para este culto.`,
          };
        }
      }

      if (isDemoMode) {
        setScheduleAssignments((prev) => {
          const filtered = prev.filter((a) => a.service_id !== serviceId);
          const newAssignments: ScheduleAssignment[] = assignments.map((a, idx) => {
            const member = members.find((m) => m.id === a.member_id);
            let section = a.ministry_section;
            if (!section) {
              if (member?.ministry === 'Multimídia') section = 'multimidia';
              else if (member?.ministry === 'Condução e Palavra') section = 'conducao';
              else section = 'louvor';
            }
            return {
              id: `as-${Date.now()}-${idx}`,
              service_id: serviceId,
              member_id: a.member_id,
              role_name: a.role_name,
              order_index: idx + 1,
              ministry_section: section,
            };
          });
          return [...filtered, ...newAssignments];
        });

        if (publish !== undefined) {
          await updateService(serviceId, { status: publish ? 'published' : 'draft' });
        }
        return { success: true };
      }

      const client = getSupabaseClient();
      if (!client) return { success: false, error: 'Supabase não conectado.' };

      const { error: delError } = await client
        .from('schedule_assignments')
        .delete()
        .eq('service_id', serviceId);

      if (delError) {
        return { success: false, error: delError.message };
      }

      if (assignments.length > 0) {
        const insertData = assignments.map((a, idx) => {
          const member = members.find((m) => m.id === a.member_id);
          let section = a.ministry_section;
          if (!section) {
            if (member?.ministry === 'Multimídia') section = 'multimidia';
            else if (member?.ministry === 'Condução e Palavra') section = 'conducao';
            else section = 'louvor';
          }
          return {
            service_id: serviceId,
            member_id: a.member_id,
            role_name: a.role_name,
            order_index: idx + 1,
            ministry_section: section,
          };
        });
        const { error: insError } = await client.from('schedule_assignments').insert(insertData);
        if (insError) {
          return { success: false, error: insError.message };
        }
      }

      if (publish !== undefined) {
        await updateService(serviceId, { status: publish ? 'published' : 'draft' });
      }

      await loadSupabaseData();
      return { success: true };
    },
    [getMemberAvailability, members, isDemoMode, updateService, loadSupabaseData]
  );

  const getServiceConflicts = useCallback(
    (serviceId: string) => {
      const assignments = scheduleAssignments.filter((sc) => sc.service_id === serviceId);
      const conflicts: { assignment: ScheduleAssignment; member?: Member }[] = [];

      assignments.forEach((asg) => {
        const avail = getMemberAvailability(serviceId, asg.member_id);
        if (avail === 'indisponivel') {
          conflicts.push({
            assignment: asg,
            member: members.find((m) => m.id === asg.member_id),
          });
        }
      });

      return conflicts;
    },
    [scheduleAssignments, getMemberAvailability, members]
  );

  const getServiceSchedule = useCallback(
    (serviceId: string) => {
      const service = services.find((s) => s.id === serviceId);
      if (!service) return [];

      if (!isAdmin && service.status !== 'published') {
        return [];
      }

      const list = scheduleAssignments
        .filter((sc) => sc.service_id === serviceId)
        .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

      return list.map((item) => {
        const member = members.find((m) => m.id === item.member_id);
        const avail = getMemberAvailability(serviceId, item.member_id);
        return {
          ...item,
          member,
          hasConflict: avail === 'indisponivel',
        };
      });
    },
    [services, isAdmin, scheduleAssignments, members, getMemberAvailability]
  );

  const addSong = useCallback(
    async (serviceId: string, songData: { title: string; tone?: string; link?: string }) => {
      const existingSongs = songs.filter((s) => s.service_id === serviceId);
      const nextOrder = existingSongs.length + 1;

      if (isDemoMode) {
        const newSong: Song = {
          id: `sg-${Date.now()}`,
          service_id: serviceId,
          title: songData.title.trim(),
          tone: songData.tone?.trim() || undefined,
          link: songData.link?.trim() || undefined,
          order_index: nextOrder,
        };
        setSongs((prev) => [...prev, newSong]);
        return;
      }

      const client = getSupabaseClient();
      if (!client) return;

      const { error } = await client.from('songs').insert([
        {
          service_id: serviceId,
          title: songData.title.trim(),
          tone: songData.tone?.trim() || null,
          link: songData.link?.trim() || null,
          order_index: nextOrder,
        },
      ]);
      if (error) throw new Error(error.message);
      await loadSupabaseData();
    },
    [songs, isDemoMode, loadSupabaseData]
  );

  const updateSong = useCallback(
    async (id: string, updates: Partial<Song>) => {
      if (isDemoMode) {
        setSongs((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
        return;
      }

      const client = getSupabaseClient();
      if (!client) return;

      const { error } = await client.from('songs').update(updates).eq('id', id);
      if (error) throw new Error(error.message);
      await loadSupabaseData();
    },
    [isDemoMode, loadSupabaseData]
  );

  const deleteSong = useCallback(
    async (id: string) => {
      if (isDemoMode) {
        setSongs((prev) => prev.filter((s) => s.id !== id));
        return;
      }

      const client = getSupabaseClient();
      if (!client) return;

      const { error } = await client.from('songs').delete().eq('id', id);
      if (error) throw new Error(error.message);
      await loadSupabaseData();
    },
    [isDemoMode, loadSupabaseData]
  );

  const getServiceSongs = useCallback(
    (serviceId: string) => {
      const service = services.find((s) => s.id === serviceId);
      if (!service) return [];

      if (!isAdmin && service.status !== 'published') {
        return [];
      }

      return songs
        .filter((s) => s.service_id === serviceId)
        .sort((a, b) => a.order_index - b.order_index);
    },
    [services, isAdmin, songs]
  );

  const resetDemoData = useCallback(() => {
    setMembers(INITIAL_MEMBERS);
    setServices(INITIAL_SERVICES);
    setAvailabilities(INITIAL_AVAILABILITIES);
    setMonthlySubmissions(INITIAL_MONTHLY_SUBMISSIONS);
    setScheduleAssignments(INITIAL_SCHEDULE_ASSIGNMENTS);
    setSongs(INITIAL_SONGS);
    localStorage.removeItem(LOCAL_STORAGE_KEY_PREFIX + 'members');
    localStorage.removeItem(LOCAL_STORAGE_KEY_PREFIX + 'services');
    localStorage.removeItem(LOCAL_STORAGE_KEY_PREFIX + 'availabilities');
    localStorage.removeItem(LOCAL_STORAGE_KEY_PREFIX + 'monthly_submissions');
    localStorage.removeItem(LOCAL_STORAGE_KEY_PREFIX + 'schedules');
    localStorage.removeItem(LOCAL_STORAGE_KEY_PREFIX + 'songs');
  }, []);

  const refreshData = useCallback(async () => {
    if (!isDemoMode) {
      await loadSupabaseData();
    }
  }, [isDemoMode, loadSupabaseData]);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        availableUsers,
        switchUser,
        isDemoMode,
        setIsDemoMode,
        isSupabaseConnected,
        isAdmin,
        currentMember,
        members,
        services,
        availabilities,
        monthlySubmissions,
        scheduleAssignments,
        songs,
        setMemberAvailability,
        saveMonthlyAvailability,
        getMemberAvailability,
        getServiceAvailabilityCounts,
        getMonthlySubmission,
        getMonthlySubmissionsForMonth,
        createService,
        updateService,
        deleteService,
        toggleServiceStatus,
        generateMonthSundays,
        createMember,
        updateMember,
        deactivateMember,
        deleteMember,
        saveSchedule,
        getServiceSchedule,
        getServiceConflicts,
        addSong,
        updateSong,
        deleteSong,
        getServiceSongs,
        resetDemoData,
        refreshData,
        loading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp deve ser usado dentro de um AppProvider');
  }
  return context;
};
