import type { AdminAction, ChatResult, PublicState } from '../shared/types';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...init
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json() as Promise<T>;
}

export function loadState() {
  return request<PublicState>('/api/state');
}

export function resetState() {
  return request<PublicState>('/api/reset', { method: 'POST' });
}

export function runAction(action: AdminAction) {
  return request<{ ok: boolean; state: PublicState }>('/api/admin-action', {
    method: 'POST',
    body: JSON.stringify(action)
  });
}

export function sendMessage(ticketId: string, body: string) {
  return request<ChatResult>(`/api/tickets/${ticketId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ body })
  });
}

export function closeTicket(ticketId: string) {
  return request<{ closed: boolean; state: PublicState }>(`/api/tickets/${ticketId}/close`, { method: 'POST' });
}
