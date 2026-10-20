import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import type { TabType } from './components/Navigation';
import { ServicesView } from './views/ServicesView';
import { MyScheduleView } from './views/MyScheduleView';
import { MembersView } from './views/MembersView';
import { HelpView } from './views/HelpView';
import { PastorDashboardView } from './views/PastorDashboardView';
import { MonthlyAvailabilityView } from './views/MonthlyAvailabilityView';
import { ServiceDetailModal } from './components/ServiceDetailModal';
import { ScheduleBuilderModal } from './components/ScheduleBuilderModal';
import { SongEditorModal } from './components/SongEditorModal';
import { ServiceFormModal } from './components/ServiceFormModal';
import { MemberModal } from './components/MemberModal';
import { BatchSundaysModal } from './components/BatchSundaysModal';
import { SupabaseSetupModal } from './components/SupabaseSetupModal';
import { WhatsAppShareModal } from './components/WhatsAppShareModal';
import type { Service, Member } from './types';
import { Info } from 'lucide-react';

const MainContent: React.FC = () => {
  const { isDemoMode, currentUser, isAdmin, currentMember, services, getMemberAvailability } = useApp();

  const [activeTab, setActiveTab] = useState<TabType>(() => (isAdmin ? 'painel-pastor' : 'disponibilidade-mensal'));

  // Ajusta a aba padrão quando o usuário alternar de perfil
  useEffect(() => {
    if (isAdmin && (activeTab === 'minha-escala' || activeTab === 'disponibilidade-mensal')) {
      setActiveTab('painel-pastor');
    } else if (!isAdmin && activeTab === 'painel-pastor') {
      setActiveTab('disponibilidade-mensal');
    }
  }, [isAdmin, activeTab]);

  // Modals state
  const [detailService, setDetailService] = useState<Service | null>(null);
  const [scheduleService, setScheduleService] = useState<Service | null>(null);
  const [songService, setSongService] = useState<Service | null>(null);
  const [serviceToEdit, setServiceToEdit] = useState<Service | null>(null);
  const [isCreatingService, setIsCreatingService] = useState(false);
  const [isBatchSundaysOpen, setIsBatchSundaysOpen] = useState(false);
  const [initialServiceDate, setInitialServiceDate] = useState<string | null>(null);
  const [whatsAppService, setWhatsAppService] = useState<Service | null>(null);

  const [memberToEdit, setMemberToEdit] = useState<Member | null>(null);
  const [isCreatingMember, setIsCreatingMember] = useState(false);

  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [dismissDemoNotice, setDismissDemoNotice] = useState(false);

  // O pastor não precisa de disponibilidade; pendingCount é apenas para integrantes da equipe
  const pendingCount = !isAdmin && currentMember
    ? services.filter((s) => getMemberAvailability(s.id, currentMember.id) === 'pendente').length
    : 0;

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col selection:bg-amber-100 selection:text-amber-900">
      {/* Top Header */}
      <Header onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)} />

      {/* Navigation (Desktop Tabs & Mobile Dock) */}
      <Navigation
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        pendingCount={pendingCount}
      />

      {/* Main Container (Amplo no desktop para melhor aproveitamento do espaço) */}
      <main className="flex-1 max-w-[1720px] 2xl:max-w-[1840px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pb-24 sm:pb-12">
        {/* Demonstration Mode Informational Banner */}
        {isDemoMode && !dismissDemoNotice && (
          <div className="mb-6 p-4 rounded-3xl bg-amber-50/90 border border-amber-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                <Info size={16} />
              </div>
              <div className="text-xs text-amber-950">
                <p className="font-bold">
                  Modo Demonstração Ativo (Dados de Exemplo)
                </p>
                <p className="mt-0.5 text-amber-900/90 leading-relaxed">
                  Você está testando como <strong>{currentUser.name}</strong> ({isAdmin ? 'Pastor Administrador' : 'Integrante'}).
                  Use o seletor no topo para alternar entre perfis e testar as permissões de cada um.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                onClick={() => setIsSupabaseModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors shadow-2xs"
              >
                Conectar ao Supabase
              </button>
              <button
                onClick={() => setDismissDemoNotice(true)}
                className="p-1.5 text-stone-700 hover:text-stone-900 text-xs font-semibold"
                title="Dispensar aviso"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* View Tabs */}
        {activeTab === 'painel-pastor' && (
          <PastorDashboardView
            onOpenScheduleBuilder={(service) => setScheduleService(service)}
            onOpenSongEditor={(service) => setSongService(service)}
            onOpenCreateService={(date) => {
              setInitialServiceDate(date || null);
              setServiceToEdit(null);
              setIsCreatingService(true);
            }}
            onOpenBatchSundays={() => setIsBatchSundaysOpen(true)}
            onOpenServiceDetails={(service) => setDetailService(service)}
            onOpenWhatsAppShare={(service) => setWhatsAppService(service)}
          />
        )}

        {activeTab === 'disponibilidade-mensal' && (
          <MonthlyAvailabilityView />
        )}

        {activeTab === 'cultos' && (
          <ServicesView
            onOpenServiceDetails={(service) => setDetailService(service)}
            onOpenCreateService={(date) => {
              setInitialServiceDate(date || null);
              setServiceToEdit(null);
              setIsCreatingService(true);
            }}
            onOpenScheduleBuilder={(service) => setScheduleService(service)}
            onOpenSongEditor={(service) => setSongService(service)}
            onEditService={(service) => {
              setServiceToEdit(service);
              setIsCreatingService(true);
            }}
            onOpenBatchSundays={() => setIsBatchSundaysOpen(true)}
          />
        )}

        {activeTab === 'minha-escala' && (
          <MyScheduleView
            onOpenServiceDetails={(service) => setDetailService(service)}
          />
        )}

        {activeTab === 'equipe' && (
          <MembersView
            onOpenCreateMember={() => {
              setMemberToEdit(null);
              setIsCreatingMember(true);
            }}
            onOpenEditMember={(member) => {
              setMemberToEdit(member);
              setIsCreatingMember(true);
            }}
          />
        )}

        {activeTab === 'ajuda' && (
          <HelpView onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)} />
        )}
      </main>

      {/* MODALS */}
      {/* 0. Gerar Domingos do Mês em Lote */}
      {isBatchSundaysOpen && (
        <BatchSundaysModal
          onClose={() => setIsBatchSundaysOpen(false)}
          onSuccess={() => {}}
        />
      )}

      {/* 1. Detalhes do Culto (Escala, Músicas, Respostas) */}
      {detailService && (
        <ServiceDetailModal
          service={detailService}
          onClose={() => setDetailService(null)}
          onOpenScheduleBuilder={(s) => {
            setDetailService(null);
            setScheduleService(s);
          }}
          onOpenSongEditor={(s) => {
            setDetailService(null);
            setSongService(s);
          }}
          onEditService={(s) => {
            setDetailService(null);
            setServiceToEdit(s);
            setIsCreatingService(true);
          }}
          onOpenWhatsAppShare={(s) => setWhatsAppService(s)}
        />
      )}

      {/* 2. Montar Escala Manualmente (Admin) */}
      {scheduleService && (
        <ScheduleBuilderModal
          service={scheduleService}
          onClose={() => setScheduleService(null)}
          onSuccess={() => {}}
        />
      )}

      {/* 3. Editor de Músicas do Culto (Admin) */}
      {songService && (
        <SongEditorModal
          service={songService}
          onClose={() => setSongService(null)}
        />
      )}

      {/* 4. Criar / Editar Culto (Admin) */}
      {isCreatingService && (
        <ServiceFormModal
          serviceToEdit={serviceToEdit}
          initialDate={initialServiceDate}
          onClose={() => {
            setIsCreatingService(false);
            setServiceToEdit(null);
          }}
          onSuccess={(saved) => {
            setDetailService(saved);
          }}
        />
      )}

      {/* 5. Criar / Editar Integrante (Admin) */}
      {isCreatingMember && (
        <MemberModal
          memberToEdit={memberToEdit}
          onClose={() => {
            setIsCreatingMember(false);
            setMemberToEdit(null);
          }}
          onSuccess={() => {}}
        />
      )}

      {/* 6. Configuração e Conexão Supabase */}
      {isSupabaseModalOpen && (
        <SupabaseSetupModal onClose={() => setIsSupabaseModalOpen(false)} />
      )}

      {/* 7. Publicar / Compartilhar Escala no WhatsApp */}
      {whatsAppService && (
        <WhatsAppShareModal
          service={whatsAppService}
          onClose={() => setWhatsAppService(null)}
        />
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
};

export default App;
