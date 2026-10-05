import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConclusionsTab } from './ConclusionsTab';
import { api } from '../../api/client';
import { Conclusion } from '../../types/api';

vi.mock('../../api/client', () => ({
  api: {
    listConclusions: vi.fn(),
    queryConclusions: vi.fn(),
    getConclusion: vi.fn(),
  },
}));

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('ConclusionsTab Component & Premise Drilldown (UI-03)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders conclusions list and triggers premise drilldown via accessible button', async () => {
    const mockDerivedConclusion: Conclusion = {
      id: 'conc-derived-01',
      content: 'Utente predilige architetture multi-agente distribuite',
      observer_id: 'honcho-dreamer',
      observed_id: 'alex',
      level: 'deductive',
      created_at: '2026-10-02T10:00:00Z',
      session_id: 'session-01',
      source_ids: ['conc-premise-01'],
      times_derived: 2,
    };

    const mockPremiseConclusion: Conclusion = {
      id: 'conc-premise-01',
      content: 'Utente ha menzionato orchestrazione con Hermes Agent su Umbrel',
      observer_id: 'honcho-listener',
      observed_id: 'alex',
      level: 'explicit',
      created_at: '2026-10-02T09:30:00Z',
      session_id: 'session-01',
      source_ids: [],
      times_derived: 1,
    };

    vi.mocked(api.listConclusions).mockResolvedValue({
      items: [mockDerivedConclusion],
      total: 1,
      page: 1,
      size: 20,
      pages: 1,
    });

    vi.mocked(api.getConclusion).mockImplementation(async (_ws, id) => {
      if (id === 'conc-derived-01') return mockDerivedConclusion;
      if (id === 'conc-premise-01') return mockPremiseConclusion;
      throw new Error('Not found');
    });

    renderWithClient(<ConclusionsTab workspaceId="test-ws" />);

    // 1. Verify conclusion is rendered in list
    await waitFor(() => {
      expect(screen.getByText('Utente predilige architetture multi-agente distribuite')).toBeInTheDocument();
    });

    // 2. Open drawer by selecting the row with keyboard (Enter key)
    const row = screen.getByRole('button', { name: /Dettaglio conclusione conc-derived-01/i });
    fireEvent.keyDown(row, { key: 'Enter', code: 'Enter' });

    // 3. Drawer opens and renders details
    await waitFor(() => {
      expect(screen.getByText('Dettaglio Derivazione')).toBeInTheDocument();
      expect(screen.getByText('Premesse Originarie (source_ids)')).toBeInTheDocument();
    });

    // 4. Verify premise button is an accessible button element
    const premiseBtn = screen.getByRole('button', { name: /conc-premise-01/i });
    expect(premiseBtn).toBeInTheDocument();
    expect(premiseBtn.tagName.toLowerCase()).toBe('button');

    // 5. Click the premise button to drill down into the origin premise
    fireEvent.click(premiseBtn);

    // 6. Verify api.getConclusion was called with the premise ID and rendered
    await waitFor(() => {
      expect(api.getConclusion).toHaveBeenCalledWith('test-ws', 'conc-premise-01');
      expect(screen.getByText('Utente ha menzionato orchestrazione con Hermes Agent su Umbrel')).toBeInTheDocument();
    });
  });
});
