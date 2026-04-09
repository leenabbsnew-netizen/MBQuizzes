const BASE = '/api';

async function request<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json();
}

export const api = {
  // Events
  getEvents: () => request<any[]>('/events'),
  getEvent: (id: string) => request<any>(`/events/${id}`),
  getEconomics: (id: string, board?: number) =>
    request<any>(`/events/${id}/economics${board ? `?board=${board}` : ''}`),

  // Decisions
  postDecision: (eventId: string, data: any) =>
    request<any>(`/events/${eventId}/decision`, { method: 'POST', body: JSON.stringify(data) }),
  getDecisions: () => request<any[]>('/decisions'),

  // Sync
  triggerSync: () => request<any>('/sync', { method: 'POST' }),
  getSyncLog: () => request<any[]>('/sync/log'),

  // Assumptions
  getAssumptions: () => request<any>('/assumptions'),
  updateAssumptions: (data: any) =>
    request<any>('/assumptions', { method: 'PUT', body: JSON.stringify(data) }),

  // Reconciliation
  getReconciliation: () => request<any>('/reconciliation'),

  // Bingo matrix
  getBingoMatrix: (maxMain = 50, maxBonus = 50, board?: number) =>
    request<any>(`/reports/bingo-matrix?maxMain=${maxMain}&maxBonus=${maxBonus}${board ? `&board=${board}` : ''}`),

  // Planner
  getPlanner: () => request<any[]>('/planner'),

  // Hosts
  getHosts: () => request<any[]>('/hosts'),
};
