import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from './client';

describe('Honcho API Client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('lists workspaces with query parameters for pagination', async () => {
    const mockData = {
      items: [{ id: 'test-workspace' }],
      total: 1,
      page: 2,
      size: 20,
      pages: 1,
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    } as Response);

    const result = await api.listWorkspaces(2, 20, true, { name: 'test' });
    expect(result).toEqual(mockData);

    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/v3/workspaces/list?page=2&size=20&reverse=true',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'test' }),
      })
    );
  });

  it('throws ApiError with detail message on HTTP failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 422,
      statusText: 'Unprocessable Entity',
      json: async () => ({ detail: 'Scope and session_id are mutually exclusive' }),
    } as Response);

    await expect(api.listWorkspaces()).rejects.toThrow('Scope and session_id are mutually exclusive');
  });

  it('enforces scope exclusivity in dialecticChat', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: 'response' }),
    } as Response);

    await api.dialecticChat('test-workspace', 'alex', {
      query: 'Hello',
      scope: 'custom-scope',
      session_id: 'session-01',
      filters: { key: 'val' },
    });

    const calledBody = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string);
    expect(calledBody.scope).toBe('custom-scope');
    expect(calledBody.session_id).toBeUndefined();
    expect(calledBody.filters).toBeUndefined();
  });

  it('correctly parses streaming SSE chunks and completion', async () => {
    const ssePayload = [
      'data: {"delta": {"content": "Hello "}, "done": false}\n\n',
      'data: {"delta": {"content": "World!"}, "done": false}\n\n',
      'data: {"done": true, "evidence": {"conclusions": []}}\n\n',
    ];

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        for (const chunk of ssePayload) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      },
    });

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      body: stream,
    } as Response);

    const receivedChunks: unknown[] = [];
    await api.streamDialecticChat(
      'test-workspace',
      'alex',
      { query: 'test' },
      chunk => receivedChunks.push(chunk)
    );

    expect(receivedChunks).toHaveLength(3);
    expect(receivedChunks[0]).toEqual({ delta: { content: 'Hello ' }, done: false });
    expect(receivedChunks[1]).toEqual({ delta: { content: 'World!' }, done: false });
    expect(receivedChunks[2]).toEqual({ done: true, evidence: { conclusions: [] } });
  });

  it('handles arbitrary chunk boundaries in SSE streaming', async () => {
    // A single JSON event split across two stream enqueues
    const chunk1 = 'data: {"delta": {"cont';
    const chunk2 = 'ent": "Split message"';
    const chunk3 = '}, "done": false}\n\n';

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(chunk1));
        controller.enqueue(encoder.encode(chunk2));
        controller.enqueue(encoder.encode(chunk3));
        controller.close();
      },
    });

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      body: stream,
    } as Response);

    const receivedChunks: unknown[] = [];
    await api.streamDialecticChat(
      'test-workspace',
      'alex',
      { query: 'test' },
      chunk => receivedChunks.push(chunk)
    );

    expect(receivedChunks).toHaveLength(1);
    expect(receivedChunks[0]).toEqual({ delta: { content: 'Split message' }, done: false });
  });
});
