import {
  Workspace,
  WorkspaceCreate,
  QueueStatus,
  Session,
  SessionCreate,
  SessionContext,
  SessionSummaries,
  Message,
  MessageBatchCreate,
  Peer,
  PeerCreate,
  PeerCardResponse,
  PeerContext,
  PeerRepresentationGet,
  RepresentationResponse,
  Conclusion,
  ConclusionQuery,
  DialecticOptions,
  DialecticResponse,
  DialecticStreamChunk,
  Page,
} from '../types/api';

const BASE_URL = '/api';

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData: unknown;
    let errorMessage = `HTTP ${response.status} ${response.statusText}`;
    try {
      errorData = await response.json();
      if (typeof errorData === 'object' && errorData !== null) {
        const d = errorData as Record<string, unknown>;
        if (typeof d.detail === 'string') {
          errorMessage = d.detail;
        } else if (typeof d.error === 'string') {
          errorMessage = d.error;
        } else if (Array.isArray(d.detail)) {
          errorMessage = d.detail.map((item: { msg?: string }) => item.msg || JSON.stringify(item)).join('; ');
        }
      }
    } catch {
      // Body wasn't JSON
    }
    throw new ApiError(response.status, errorMessage, errorData);
  }

  return response.json();
}

export const api = {
  // Health
  async healthCheck(): Promise<{ status: string }> {
    return request<{ status: string }>('/health');
  },

  // Workspaces
  async listWorkspaces(page = 1, size = 50, reverse = false, filters: Record<string, unknown> = {}): Promise<Page<Workspace>> {
    const query = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      reverse: reverse.toString(),
    });
    return request<Page<Workspace>>(`/v3/workspaces/list?${query.toString()}`, {
      method: 'POST',
      body: JSON.stringify(filters),
    });
  },

  async createWorkspace(data: WorkspaceCreate): Promise<Workspace> {
    return request<Workspace>('/v3/workspaces', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getQueueStatus(workspaceId: string): Promise<QueueStatus> {
    return request<QueueStatus>(`/v3/workspaces/${encodeURIComponent(workspaceId)}/queue/status`);
  },

  // Sessions
  async listSessions(workspaceId: string, page = 1, size = 50, reverse = false, filters: Record<string, unknown> = {}): Promise<Page<Session>> {
    const query = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      reverse: reverse.toString(),
    });
    return request<Page<Session>>(`/v3/workspaces/${encodeURIComponent(workspaceId)}/sessions/list?${query.toString()}`, {
      method: 'POST',
      body: JSON.stringify(filters),
    });
  },

  async createSession(workspaceId: string, data: SessionCreate): Promise<Session> {
    return request<Session>(`/v3/workspaces/${encodeURIComponent(workspaceId)}/sessions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getSessionContext(workspaceId: string, sessionId: string): Promise<SessionContext> {
    return request<SessionContext>(`/v3/workspaces/${encodeURIComponent(workspaceId)}/sessions/${encodeURIComponent(sessionId)}/context`);
  },

  async getSessionSummaries(workspaceId: string, sessionId: string): Promise<SessionSummaries> {
    return request<SessionSummaries>(`/v3/workspaces/${encodeURIComponent(workspaceId)}/sessions/${encodeURIComponent(sessionId)}/summaries`);
  },

  // Messages
  async listMessages(workspaceId: string, sessionId: string, page = 1, size = 50, reverse = false, filters: Record<string, unknown> = {}): Promise<Page<Message>> {
    const query = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      reverse: reverse.toString(),
    });
    return request<Page<Message>>(`/v3/workspaces/${encodeURIComponent(workspaceId)}/sessions/${encodeURIComponent(sessionId)}/messages/list?${query.toString()}`, {
      method: 'POST',
      body: JSON.stringify(filters),
    });
  },

  async createMessagesBatch(workspaceId: string, sessionId: string, data: MessageBatchCreate): Promise<Message[]> {
    return request<Message[]>(`/v3/workspaces/${encodeURIComponent(workspaceId)}/sessions/${encodeURIComponent(sessionId)}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getMessage(workspaceId: string, sessionId: string, messageId: string): Promise<Message> {
    return request<Message>(`/v3/workspaces/${encodeURIComponent(workspaceId)}/sessions/${encodeURIComponent(sessionId)}/messages/${encodeURIComponent(messageId)}`);
  },

  // Peers
  async listPeers(workspaceId: string, page = 1, size = 50, reverse = false, filters: Record<string, unknown> = {}): Promise<Page<Peer>> {
    const query = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      reverse: reverse.toString(),
    });
    return request<Page<Peer>>(`/v3/workspaces/${encodeURIComponent(workspaceId)}/peers/list?${query.toString()}`, {
      method: 'POST',
      body: JSON.stringify(filters),
    });
  },

  async createPeer(workspaceId: string, data: PeerCreate): Promise<Peer> {
    return request<Peer>(`/v3/workspaces/${encodeURIComponent(workspaceId)}/peers`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getPeerCard(workspaceId: string, peerId: string): Promise<PeerCardResponse> {
    return request<PeerCardResponse>(`/v3/workspaces/${encodeURIComponent(workspaceId)}/peers/${encodeURIComponent(peerId)}/card`);
  },

  async getPeerContext(workspaceId: string, peerId: string): Promise<PeerContext> {
    return request<PeerContext>(`/v3/workspaces/${encodeURIComponent(workspaceId)}/peers/${encodeURIComponent(peerId)}/context`);
  },

  async getPeerRepresentation(workspaceId: string, peerId: string, data: PeerRepresentationGet): Promise<RepresentationResponse> {
    return request<RepresentationResponse>(`/v3/workspaces/${encodeURIComponent(workspaceId)}/peers/${encodeURIComponent(peerId)}/representation`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Conclusions
  async listConclusions(workspaceId: string, page = 1, size = 50, reverse = false, filters: Record<string, unknown> = {}): Promise<Page<Conclusion>> {
    const query = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      reverse: reverse.toString(),
    });
    return request<Page<Conclusion>>(`/v3/workspaces/${encodeURIComponent(workspaceId)}/conclusions/list?${query.toString()}`, {
      method: 'POST',
      body: JSON.stringify(filters),
    });
  },

  async queryConclusions(workspaceId: string, data: ConclusionQuery): Promise<Conclusion[]> {
    return request<Conclusion[]>(`/v3/workspaces/${encodeURIComponent(workspaceId)}/conclusions/query`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getConclusion(workspaceId: string, conclusionId: string): Promise<Conclusion> {
    return request<Conclusion>(`/v3/workspaces/${encodeURIComponent(workspaceId)}/conclusions/${encodeURIComponent(conclusionId)}`);
  },

  // Dialectic Chat (Non-streaming)
  async dialecticChat(workspaceId: string, peerId: string, options: DialecticOptions): Promise<DialecticResponse> {
    // Validate scope vs session exclusivity
    const cleanedOptions = { ...options, stream: false };
    if (cleanedOptions.scope) {
      delete cleanedOptions.session_id;
      delete cleanedOptions.filters;
    }

    return request<DialecticResponse>(`/v3/workspaces/${encodeURIComponent(workspaceId)}/peers/${encodeURIComponent(peerId)}/chat`, {
      method: 'POST',
      body: JSON.stringify(cleanedOptions),
    });
  },

  // Dialectic Chat (Streaming SSE)
  async streamDialecticChat(
    workspaceId: string,
    peerId: string,
    options: DialecticOptions,
    onChunk: (chunk: DialecticStreamChunk) => void,
    signal?: AbortSignal
  ): Promise<void> {
    const cleanedOptions = { ...options, stream: true };
    if (cleanedOptions.scope) {
      delete cleanedOptions.session_id;
      delete cleanedOptions.filters;
    }

    const url = `${BASE_URL}/v3/workspaces/${encodeURIComponent(workspaceId)}/peers/${encodeURIComponent(peerId)}/chat`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify(cleanedOptions),
      signal,
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (typeof errorData === 'object' && errorData !== null) {
          const d = errorData as Record<string, unknown>;
          if (typeof d.detail === 'string') errorMessage = d.detail;
          else if (typeof d.error === 'string') errorMessage = d.error;
        }
      } catch {
        // Body wasn't JSON
      }
      throw new ApiError(response.status, errorMessage);
    }

    if (!response.body) {
      throw new Error('Response body is empty or stream not supported');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split(/\r?\n/);
        // Keep the last partial line in buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) {
            // Empty line or SSE comment (keepalive/ping)
            continue;
          }

          if (trimmed.startsWith('data:')) {
            const dataStr = trimmed.substring(5).trim();
            if (dataStr === '[DONE]') {
              onChunk({ done: true });
              return;
            }

            try {
              const parsed = JSON.parse(dataStr);
              onChunk(parsed);
              if (parsed.done) {
                return;
              }
            } catch (err) {
              console.warn('Failed to parse SSE data frame:', dataStr, err);
            }
          }
        }
      }

      // Flush remaining decoder buffer
      buffer += decoder.decode();
      if (buffer.trim().startsWith('data:')) {
        const dataStr = buffer.trim().substring(5).trim();
        try {
          const parsed = JSON.parse(dataStr);
          onChunk(parsed);
        } catch {
          // ignore incomplete trailing data
        }
      }
    } finally {
      reader.releaseLock();
    }
  },
};
