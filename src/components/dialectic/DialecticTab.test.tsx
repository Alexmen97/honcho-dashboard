import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { DialecticTab } from './DialecticTab';
import { api } from '../../api/client';

vi.mock('../../api/client', () => ({
  api: {
    streamDialecticChat: vi.fn(),
    dialecticChat: vi.fn(),
    getMessage: vi.fn(),
  },
}));

describe('DialecticTab Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders configuration toolbar with reasoning levels and mutual exclusivity switches', () => {
    render(
      <DialecticTab
        workspaceId="test-workspace"
        defaultPeerId="alex"
        availablePeers={['alex', 'user']}
        availableSessions={['session-01']}
      />
    );

    expect(screen.getByText('Anchor Peer:')).toBeInTheDocument();
    expect(screen.getByText('Ragionamento:')).toBeInTheDocument();
    expect(screen.getByText('Globale')).toBeInTheDocument();
    expect(screen.getByText('Sessione')).toBeInTheDocument();
    expect(screen.getByText('Named Scope')).toBeInTheDocument();
  });

  it('toggles between session scope and named scope with mutual exclusivity', async () => {
    render(
      <DialecticTab
        workspaceId="test-workspace"
        defaultPeerId="alex"
        availablePeers={['alex']}
        availableSessions={['session-01']}
      />
    );

    // Initial mode is 'Sessione'
    expect(screen.getByPlaceholderText(/ID Sessione/)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Nome Scope')).not.toBeInTheDocument();

    // Click 'Named Scope'
    fireEvent.click(screen.getByText('Named Scope'));
    expect(screen.getByPlaceholderText('Nome Scope')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/ID Sessione/)).not.toBeInTheDocument();

    // Click 'Globale'
    fireEvent.click(screen.getByText('Globale'));
    expect(screen.queryByPlaceholderText('Nome Scope')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/ID Sessione/)).not.toBeInTheDocument();
  });

  it('invokes streamDialecticChat with exclusive options when user sends a query', async () => {
    vi.mocked(api.streamDialecticChat).mockImplementation(
      async (_ws, _peer, _options, onChunk) => {
        onChunk({ delta: { content: 'Ciao Alex!' }, done: false });
        onChunk({ done: true, evidence: { conclusions: [], messages: [] } });
      }
    );

    render(
      <DialecticTab
        workspaceId="test-workspace"
        defaultPeerId="alex"
        availablePeers={['alex']}
      />
    );

    const input = screen.getByPlaceholderText(/Poni una domanda dialettica/);
    fireEvent.change(input, { target: { value: 'Quali sono i tuoi vincoli?' } });
    fireEvent.click(screen.getByRole('button', { name: 'Invia' }));

    await waitFor(() => {
      expect(api.streamDialecticChat).toHaveBeenCalledWith(
        'test-workspace',
        'alex',
        expect.objectContaining({
          query: 'Quali sono i tuoi vincoli?',
          stream: true,
          reasoning_level: 'low',
        }),
        expect.any(Function),
        expect.any(AbortSignal)
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Ciao Alex!')).toBeInTheDocument();
    });
  });

  it('rapid workspace switching cancels ongoing stream, clears messages and suppresses late callbacks', async () => {
    let capturedSignal: AbortSignal | undefined;
    let lateChunkCallback: ((chunk: any) => void) | undefined;

    vi.mocked(api.streamDialecticChat).mockImplementation(
      async (_ws, _peer, _options, onChunk, signal) => {
        capturedSignal = signal;
        lateChunkCallback = onChunk;
        onChunk({ delta: { content: 'Prima risposta parziale' }, done: false });
        // Return a promise that waits to simulate ongoing streaming
        return new Promise<void>((resolve) => {
          signal?.addEventListener('abort', () => resolve());
        });
      }
    );

    const { rerender } = render(
      <DialecticTab
        workspaceId="workspace-alpha"
        defaultPeerId="alex"
        availablePeers={['alex']}
      />
    );

    const input = screen.getByPlaceholderText(/Poni una domanda dialettica/);
    fireEvent.change(input, { target: { value: 'Domanda per alpha' } });
    fireEvent.click(screen.getByRole('button', { name: 'Invia' }));

    await waitFor(() => {
      expect(screen.getByText('Prima risposta parziale')).toBeInTheDocument();
    });

    // Rapid switch to another workspace wrapped in await act
    await act(async () => {
      rerender(
        <DialecticTab
          workspaceId="workspace-beta"
          defaultPeerId="alex"
          availablePeers={['alex']}
        />
      );
      await Promise.resolve();
    });

    // Verify signal was aborted
    expect(capturedSignal?.aborted).toBe(true);

    // Verify message list is reset and old messages are cleared
    await waitFor(() => {
      expect(screen.queryByText('Prima risposta parziale')).not.toBeInTheDocument();
      expect(screen.queryByText('Domanda per alpha')).not.toBeInTheDocument();
    });

    // Verify late chunk callback does not leak or re-add text
    if (lateChunkCallback) {
      await act(async () => {
        lateChunkCallback!({ delta: { content: 'Messaggio tardivo' }, done: false });
        await Promise.resolve();
      });
    }
    expect(screen.queryByText('Messaggio tardivo')).not.toBeInTheDocument();
  });
});
