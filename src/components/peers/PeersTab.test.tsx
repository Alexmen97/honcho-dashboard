import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PeersTab } from './PeersTab';
import { api } from '../../api/client';

vi.mock('../../api/client', () => ({
  api: {
    listPeers: vi.fn(),
    getPeerCard: vi.fn(),
    getPeerContext: vi.fn(),
    getPeerRepresentation: vi.fn(),
  },
}));

function renderWithClient(ui: React.ReactElement) {
  const testQueryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={testQueryClient}>{ui}</QueryClientProvider>);
}

describe('PeersTab Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders educational empty state when peer_card is null', async () => {
    vi.mocked(api.listPeers).mockResolvedValue({
      items: [{ id: 'alex', workspace_id: 'test-workspace', created_at: '2026-10-02T00:00:00Z' }],
      total: 1,
      page: 1,
      size: 50,
      pages: 1,
    });
    vi.mocked(api.getPeerCard).mockResolvedValue({ peer_card: null });
    vi.mocked(api.getPeerContext).mockResolvedValue({ peer_id: 'alex', target_id: 'alex', representation: 'User profile representation' });

    renderWithClient(
      <PeersTab workspaceId="test-workspace" onOpenCreatePeer={vi.fn()} />
    );

    await waitFor(() => {
      expect(screen.getByText('Scheda cognitiva in fase di distillazione')).toBeInTheDocument();
      expect(screen.getByText(/Honcho sta osservando le conversazioni con/)).toBeInTheDocument();
    });
  });

  it('renders synthesized trait bullets when peer_card is populated', async () => {
    vi.mocked(api.listPeers).mockResolvedValue({
      items: [{ id: 'alex', workspace_id: 'test-workspace', created_at: '2026-10-02T00:00:00Z' }],
      total: 1,
      page: 1,
      size: 50,
      pages: 1,
    });
    vi.mocked(api.getPeerCard).mockResolvedValue({
      peer_card: [
        'Prefers multi-agent architectural paradigms',
        'Expert in umbrelOS sandboxed runtime environments',
      ],
    });
    vi.mocked(api.getPeerContext).mockResolvedValue({ peer_id: 'alex', target_id: 'alex', representation: 'User profile representation' });

    renderWithClient(
      <PeersTab workspaceId="test-workspace" onOpenCreatePeer={vi.fn()} />
    );

    await waitFor(() => {
      expect(screen.getByText('Prefers multi-agent architectural paradigms')).toBeInTheDocument();
      expect(screen.getByText('Expert in umbrelOS sandboxed runtime environments')).toBeInTheDocument();
    });
  });
});
