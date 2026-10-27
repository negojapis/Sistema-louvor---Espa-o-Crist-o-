import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { MemberView } from './views/MemberView';
import { PastorView } from './views/PastorView';
import { ProfileEditModal } from './components/ProfileEditModal';
import { initNativeMobileApp } from './lib/mobile';

const MainApp: React.FC = () => {
  const { activeTab } = useApp();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    initNativeMobileApp(() => {
      if (isProfileOpen) {
        setIsProfileOpen(false);
        return true;
      }
      return false;
    });
  }, [isProfileOpen]);

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex flex-col text-[#202420] selection:bg-orange-100 selection:text-orange-900">
      {/* Top Header com identificação e chave Músico / Pastor */}
      <Header onOpenProfile={() => setIsProfileOpen(true)} />

      {/* Conteúdo Principal do Fluxo */}
      <main className="flex-1 pb-12">
        {activeTab === 'musico' ? (
          <MemberView onOpenProfile={() => setIsProfileOpen(true)} />
        ) : (
          <PastorView />
        )}
      </main>

      {/* Modal de Edição de Perfil e Instrumentos */}
      <ProfileEditModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
};

export default App;
