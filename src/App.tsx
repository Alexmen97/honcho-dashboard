import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api/client';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, TabType } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { OverviewTab } from './components/overview/OverviewTab';
import { SessionsTab } from './components/sessions/SessionsTab';
import { PeersTab } from './components/peers/PeersTab';
import { ConclusionsTab } from './components/conclusions/ConclusionsTab';
import { DialecticTab } from './components/dialectic/DialecticTab';
import { CreateWorkspaceModal } from './components/modals/CreateWorkspaceModal';
import { CreateSessionModal } from './components/modals/CreateSessionModal';
import { CreatePeerModal } from './components/modals/CreatePeerModal';
import { ShimmerCard } from './components/common/LoadingShimmer';
import { ErrorBanner } from './components/common/ErrorBanner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function DashboardContent() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>('');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Modals state
  const [isWsModalOpen, setIsWsModalOpen] = useState(false);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isPeerModalOpen, setIsPeerModalOpen] = useState(false);

  // Health check query
  const { data: healthData } = useQuery({
    queryKey: ['health'],
    queryFn: () => api.healthCheck(),
    refetchInterval: 20000,
  });

  // Workspaces list query
  const {
    data: workspacesData,
    isLoading: isWsLoading,
    error: wsError,
    refetch: refetchWorkspaces,
  } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => api.listWorkspaces(1, 50),
  });

  // Set default workspace if not set
  useEffect(() => {
    if (!activeWorkspaceId && workspacesData?.items?.length) {
      setActiveWorkspaceId(workspacesData.items[0].id);
    }
  }, [workspacesData, activeWorkspaceId]);

  // Handle workspace change with strict query isolation
  const handleSelectWorkspace = (newWsId: string) => {
    if (newWsId === activeWorkspaceId) return;
    // Cancel outstanding queries from the previous workspace
    qc.cancelQueries();
    setActiveWorkspaceId(newWsId);
  };

  // Live Counts for Sidebar Badges
  const { data: sessionsPage } = useQuery({
    queryKey: ['workspace', activeWorkspaceId, 'sessions-count'],
    queryFn: () => api.listSessions(activeWorkspaceId, 1, 1),
    enabled: Boolean(activeWorkspaceId),
  });

  const { data: peersPage } = useQuery({
    queryKey: ['workspace', activeWorkspaceId, 'peers-count'],
    queryFn: () => api.listPeers(activeWorkspaceId, 1, 50),
    enabled: Boolean(activeWorkspaceId),
  });

  const { data: conclusionsPage } = useQuery({
    queryKey: ['workspace', activeWorkspaceId, 'conclusions-count'],
    queryFn: () => api.listConclusions(activeWorkspaceId, 1, 1),
    enabled: Boolean(activeWorkspaceId),
  });

  const availablePeers = peersPage?.items?.map((p) => p.id) || [];
  const isHealthOk = healthData?.status === 'ok';

  return (
    <div className="h-full flex flex-col bg-canvas text-slate-100 overflow-hidden font-sans">
      {/* Top Navbar */}
      <Navbar
        workspaces={workspacesData?.items || []}
        activeWorkspaceId={activeWorkspaceId}
        onSelectWorkspace={handleSelectWorkspace}
        onOpenCreateWorkspace={() => setIsWsModalOpen(true)}
        onToggleMobileNav={() => setIsMobileNavOpen(!isMobileNavOpen)}
        isHealthOk={isHealthOk}
      />

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          sessionCount={sessionsPage?.total}
          peerCount={peersPage?.total}
          conclusionCount={conclusionsPage?.total}
        />

        {/* Mobile Navigation & Drawer */}
        <MobileNav
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isOpen={isMobileNavOpen}
          onClose={() => setIsMobileNavOpen(false)}
          sessionCount={sessionsPage?.total}
          peerCount={peersPage?.total}
          conclusionCount={conclusionsPage?.total}
        />

        {/* Viewport Canvas */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6" role="main">
          {isWsLoading && <ShimmerCard rows={4} />}

          {wsError && (
            <ErrorBanner
              title="Errore connessione Honcho"
              message={wsError instanceof Error ? wsError.message : 'Impossibile caricare i workspace'}
              onRetry={() => refetchWorkspaces()}
            />
          )}

          {!isWsLoading && !wsError && (
            <>
              {activeTab === 'overview' && (
                <OverviewTab
                  workspaceId={activeWorkspaceId}
                  onNavigate={setActiveTab}
                  onOpenCreateSession={() => setIsSessionModalOpen(true)}
                  onOpenCreatePeer={() => setIsPeerModalOpen(true)}
                />
              )}

              {activeTab === 'sessions' && (
                <SessionsTab
                  workspaceId={activeWorkspaceId}
                  onOpenCreateSession={() => setIsSessionModalOpen(true)}
                  availablePeers={availablePeers}
                />
              )}

              {activeTab === 'peer' && (
                <PeersTab
                  workspaceId={activeWorkspaceId}
                  onOpenCreatePeer={() => setIsPeerModalOpen(true)}
                />
              )}

              {activeTab === 'conclusions' && (
                <ConclusionsTab workspaceId={activeWorkspaceId} />
              )}

              {activeTab === 'dialectic' && (
                <DialecticTab
                  key={activeWorkspaceId}
                  workspaceId={activeWorkspaceId}
                  defaultPeerId={availablePeers[0] || 'alex'}
                  availablePeers={availablePeers}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Modals */}
      <CreateWorkspaceModal
        isOpen={isWsModalOpen}
        onClose={() => setIsWsModalOpen(false)}
        onCreated={(newId) => {
          qc.invalidateQueries({ queryKey: ['workspaces'] });
          setActiveWorkspaceId(newId);
        }}
      />

      <CreateSessionModal
        isOpen={isSessionModalOpen}
        workspaceId={activeWorkspaceId}
        onClose={() => setIsSessionModalOpen(false)}
        onCreated={() => {
          qc.invalidateQueries({ queryKey: ['workspace', activeWorkspaceId, 'sessions'] });
          qc.invalidateQueries({ queryKey: ['workspace', activeWorkspaceId, 'sessions-count'] });
          setActiveTab('sessions');
        }}
      />

      <CreatePeerModal
        isOpen={isPeerModalOpen}
        workspaceId={activeWorkspaceId}
        onClose={() => setIsPeerModalOpen(false)}
        onCreated={() => {
          qc.invalidateQueries({ queryKey: ['workspace', activeWorkspaceId, 'peers'] });
          qc.invalidateQueries({ queryKey: ['workspace', activeWorkspaceId, 'peers-count'] });
          setActiveTab('peer');
        }}
      />
    </div>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DashboardContent />
    </QueryClientProvider>
  );
}

export default App;
