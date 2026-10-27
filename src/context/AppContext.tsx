import React, { createContext, useContext, useState, useEffect } from 'react';
import type {
  Member,
  SundayService,
  Availability,
  AvailabilityStatus,
  ScheduleAssignment,
  RepertoireSong,
  SetlistSong,
} from '../types';
import {
  INITIAL_MEMBERS,
  INITIAL_REPERTOIRE,
  generateInitialSundayServices,
  generateInitialAvailabilities,
  generateInitialAssignments,
  generateInitialSetlists,
} from '../data/initialData';

interface AppContextType {
  activeTab: 'musico' | 'pastor';
  setActiveTab: (tab: 'musico' | 'pastor') => void;

  // Usuário atual (Músico no aparelho)
  currentUser: Member;
  saveUserProfile: (data: { name: string; phone: string; email: string; roles: string[] }) => void;

  // Dados globais
  members: Member[];
  services: SundayService[];
  availabilities: Availability[];
  assignments: ScheduleAssignment[];
  repertoire: RepertoireSong[];
  setlistSongs: SetlistSong[];

  // Ações de Disponibilidade (Músico)
  setMemberAvailability: (serviceId: string, memberId: string, status: AvailabilityStatus) => void;
  submitBatchAvailability: (items: { serviceId: string; status: AvailabilityStatus }[], memberId: string) => void;

  // Ações do Pastor
  assignMemberToService: (serviceId: string, memberId: string, role: string) => void;
  removeMemberFromService: (serviceId: string, memberId: string) => void;
  publishService: (serviceId: string) => void;

  // Ações de Músicas e Repertório
  addSongToSetlist: (serviceId: string, song: Omit<SetlistSong, 'id' | 'order' | 'serviceId'>) => void;
  addRepertoireSongToSetlist: (serviceId: string, repertoireSongId: string) => void;
  removeSongFromSetlist: (setlistSongId: string) => void;
  updateSetlistSong: (id: string, updated: Partial<SetlistSong>) => void;
  addNewRepertoireSong: (song: Omit<RepertoireSong, 'id'>) => void;
  updateRepertoireSong: (id: string, updated: Partial<RepertoireSong>) => void;
  removeRepertoireSong: (id: string) => void;

  // Utilitários
  resetAllData: () => void;
}

const STORAGE_KEYS = {
  USER: 'ec_current_user_v2',
  MEMBERS: 'ec_members_v2',
  SERVICES: 'ec_services_v2',
  AVAILABILITY: 'ec_availabilities_v2',
  ASSIGNMENTS: 'ec_assignments_v2',
  REPERTOIRE: 'ec_repertoire_v2',
  SETLISTS: 'ec_setlists_v2',
  ACTIVE_TAB: 'ec_active_tab_v2',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Inicialização com cache local
  const [activeTab, setActiveTabState] = useState<'musico' | 'pastor'>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB);
    return saved === 'pastor' ? 'pastor' : 'musico';
  });

  const setActiveTab = (tab: 'musico' | 'pastor') => {
    setActiveTabState(tab);
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, tab);
  };

  const [members, setMembers] = useState<Member[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MEMBERS);
    return saved ? JSON.parse(saved) : INITIAL_MEMBERS;
  });

  const [currentUser, setCurrentUser] = useState<Member>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USER);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return INITIAL_MEMBERS[0];
  });

  const [services, setServices] = useState<SundayService[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SERVICES);
    return saved ? JSON.parse(saved) : generateInitialSundayServices();
  });

  const [availabilities, setAvailabilities] = useState<Availability[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AVAILABILITY);
    if (saved) return JSON.parse(saved);
    const initialServices = generateInitialSundayServices();
    return generateInitialAvailabilities(initialServices);
  });

  const [assignments, setAssignments] = useState<ScheduleAssignment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS);
    if (saved) return JSON.parse(saved);
    const initialServices = generateInitialSundayServices();
    return generateInitialAssignments(initialServices);
  });

  const [repertoire, setRepertoire] = useState<RepertoireSong[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.REPERTOIRE);
    return saved ? JSON.parse(saved) : INITIAL_REPERTOIRE;
  });

  const [setlistSongs, setSetlistSongs] = useState<SetlistSong[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETLISTS);
    if (saved) return JSON.parse(saved);
    const initialServices = generateInitialSundayServices();
    return generateInitialSetlists(initialServices);
  });

  // Salvar no localStorage sempre que houver mudanças
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AVAILABILITY, JSON.stringify(availabilities));
  }, [availabilities]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(assignments));
  }, [assignments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.REPERTOIRE, JSON.stringify(repertoire));
  }, [repertoire]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETLISTS, JSON.stringify(setlistSongs));
  }, [setlistSongs]);

  // Salvar/Editar perfil do usuário
  const saveUserProfile = (data: { name: string; phone: string; email: string; roles: string[] }) => {
    const updatedUser: Member = {
      ...currentUser,
      name: data.name.trim(),
      phone: data.phone.trim(),
      email: data.email.trim(),
      roles: data.roles.length > 0 ? data.roles : ['Violão'],
    };

    setCurrentUser(updatedUser);

    // Atualiza ou insere na lista de membros
    setMembers((prev) => {
      const idx = prev.findIndex((m) => m.id === updatedUser.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updatedUser;
        return copy;
      }
      return [...prev, updatedUser];
    });
  };

  // Disponibilidade
  const setMemberAvailability = (serviceId: string, memberId: string, status: AvailabilityStatus) => {
    setAvailabilities((prev) => {
      const filtered = prev.filter((a) => !(a.serviceId === serviceId && a.memberId === memberId));
      return [...filtered, { serviceId, memberId, status }];
    });
  };

  const submitBatchAvailability = (items: { serviceId: string; status: AvailabilityStatus }[], memberId: string) => {
    setAvailabilities((prev) => {
      const serviceIds = new Set(items.map((i) => i.serviceId));
      const filtered = prev.filter((a) => !(a.memberId === memberId && serviceIds.has(a.serviceId)));
      const newItems: Availability[] = items.map((i) => ({
        serviceId: i.serviceId,
        memberId,
        status: i.status,
      }));
      return [...filtered, ...newItems];
    });
  };

  // Escala pelo Pastor
  const assignMemberToService = (serviceId: string, memberId: string, role: string) => {
    setAssignments((prev) => {
      const filtered = prev.filter((a) => !(a.serviceId === serviceId && a.memberId === memberId));
      return [...filtered, { serviceId, memberId, role }];
    });
  };

  const removeMemberFromService = (serviceId: string, memberId: string) => {
    setAssignments((prev) => prev.filter((a) => !(a.serviceId === serviceId && a.memberId === memberId)));
  };

  const publishService = (serviceId: string) => {
    setServices((prev) =>
      prev.map((s) => (s.id === serviceId ? { ...s, status: 'published' } : s))
    );
  };

  // Músicas & Repertório
  const addSongToSetlist = (serviceId: string, song: Omit<SetlistSong, 'id' | 'order' | 'serviceId'>) => {
    const existing = setlistSongs.filter((s) => s.serviceId === serviceId);
    const newSong: SetlistSong = {
      ...song,
      id: `song-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      serviceId,
      order: existing.length + 1,
    };
    setSetlistSongs((prev) => [...prev, newSong]);
  };

  const addRepertoireSongToSetlist = (serviceId: string, repertoireSongId: string) => {
    const rep = repertoire.find((r) => r.id === repertoireSongId);
    if (!rep) return;

    addSongToSetlist(serviceId, {
      title: rep.title,
      artist: rep.artist,
      tone: rep.tone,
      link: rep.link,
      notes: rep.notes,
    });
  };

  const removeSongFromSetlist = (setlistSongId: string) => {
    setSetlistSongs((prev) => prev.filter((s) => s.id !== setlistSongId));
  };

  const updateSetlistSong = (id: string, updated: Partial<SetlistSong>) => {
    setSetlistSongs((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updated } : s))
    );
  };

  const addNewRepertoireSong = (song: Omit<RepertoireSong, 'id'>) => {
    const newSong: RepertoireSong = {
      ...song,
      id: `rep-${Date.now()}`,
    };
    setRepertoire((prev) => [newSong, ...prev]);
  };

  const updateRepertoireSong = (id: string, updated: Partial<RepertoireSong>) => {
    setRepertoire((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updated } : r))
    );
  };

  const removeRepertoireSong = (id: string) => {
    setRepertoire((prev) => prev.filter((r) => r.id !== id));
  };

  const resetAllData = () => {
    const initialServices = generateInitialSundayServices();
    setCurrentUser(INITIAL_MEMBERS[0]);
    setMembers(INITIAL_MEMBERS);
    setServices(initialServices);
    setAvailabilities(generateInitialAvailabilities(initialServices));
    setAssignments(generateInitialAssignments(initialServices));
    setRepertoire(INITIAL_REPERTOIRE);
    setSetlistSongs(generateInitialSetlists(initialServices));
    localStorage.clear();
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        currentUser,
        saveUserProfile,
        members,
        services,
        availabilities,
        assignments,
        repertoire,
        setlistSongs,
        setMemberAvailability,
        submitBatchAvailability,
        assignMemberToService,
        removeMemberFromService,
        publishService,
        addSongToSetlist,
        addRepertoireSongToSetlist,
        removeSongFromSetlist,
        updateSetlistSong,
        addNewRepertoireSong,
        updateRepertoireSong,
        removeRepertoireSong,
        resetAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
