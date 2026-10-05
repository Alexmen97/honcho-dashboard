import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OverviewTab } from './OverviewTab';
import { api } from '../../api/client';

vi.mock('../../api/client', () => ({
  api: {
    getQueueStatus: vi.fn(),
    listSessions: vi.fn(),
    listPeers: vi.fn(),
    listConclusions: vi.fn(),
  },
}));

function renderWithClient(ui: React.ReactElement) {
  const testQueryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={testQueryClient}>{ui}</QueryClientProvider>);
}

describe('OverviewTab Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders queue status and actual API counts without fabricated metrics', async () => {
    vi.mocked(api.getQueueStatus).mockResolvedValue({
      total_work_units: 42,
      completed_work_units: 35,
      in_progress_work_units: 2,
      pending_work_units: 5,
    });
    vi.mocked(api.listSessions).mockResolvedValue({ items: [], total: 3, page: 1, size: 1, pages: 3 });
    vi.mocked(api.listPeers).mockResolvedValue({ items: [], total: 7, page: 1, size: 1, pages: 7 });
    vi.mocked(api.listConclusions).mockResolvedValue({ items: [], total: 15, page: 1, size: 1, pages: 15 });

    renderWithClient(
      <OverviewTab
        workspaceId="test-hermes-workspace"
        onNavigate={vi.fn()}
        onOpenCreateSession={vi.fn()}
        onOpenCreatePeer={vi.fn()}
      />
    );

    await waitFor(() => {
      // Work units
      expect(screen.getByText('42')).toBeInTheDocument();
      expect(screen.getByText('35')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();

      // Entity totals
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('7')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();

      // Compliance notice
      expect(screen.getByText(/Nessuna telemetria simulata o statistiche inventate/)).toBeInTheDocument();
    });
  });
});
