const API_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:4000';

const TOKEN_KEY = 'fitadmin:token';

export const auth = {
  get token() {
    return localStorage.getItem(TOKEN_KEY);
  },
  set token(t: string | null) {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  },
};

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(auth.token ? { Authorization: `Bearer ${auth.token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any).error || `Request failed (${res.status})`);
  return data as T;
}

export interface Me {
  user: { id: string; email: string; name: string | null; role: string };
}

export const api = {
  login: (email: string, password: string) =>
    req<{ token: string; user: Me['user'] }>('POST', '/api/auth/login', { email, password }),
  me: () => req<Me>('GET', '/api/auth/me'),

  list: <T>(resource: string) => req<T[]>('GET', `/api/content/${resource}`),
  create: <T>(resource: string, body: unknown) => req<T>('POST', `/api/content/${resource}`, body),
  update: <T>(resource: string, id: string, body: unknown) =>
    req<T>('PUT', `/api/content/${resource}/${id}`, body),
  remove: (resource: string, id: string) => req('DELETE', `/api/content/${resource}/${id}`),

  // ── CRM: customers ──
  listCustomers: <T>() => req<T[]>('GET', '/api/admin/customers'),
  getCustomer: <T>(id: string) => req<T>('GET', `/api/admin/customers/${id}`),
  setSegment: (id: string, segmentId: string | null) =>
    req('PATCH', `/api/admin/customers/${id}`, { segmentId }),
  getCustomerPlan: <T>(id: string) => req<T>('GET', `/api/admin/customers/${id}/plan`),
  assignPlan: (id: string, body: unknown) => req('POST', `/api/admin/customers/${id}/plan`, body),
  removePlan: (id: string) => req('DELETE', `/api/admin/customers/${id}/plan`),

  // ── Plan templates ──
  listTemplates: <T>() => req<T[]>('GET', '/api/admin/plan-templates'),
  createTemplate: <T>(body: unknown) => req<T>('POST', '/api/admin/plan-templates', body),
  updateTemplate: <T>(id: string, body: unknown) => req<T>('PUT', `/api/admin/plan-templates/${id}`, body),
  deleteTemplate: (id: string) => req('DELETE', `/api/admin/plan-templates/${id}`),

  // ── Phase 2: programs ──
  listPrograms: <T>() => req<T[]>('GET', '/api/admin/programs'),
  createProgram: <T>(body: unknown) => req<T>('POST', '/api/admin/programs', body),
  updateProgram: <T>(id: string, body: unknown) => req<T>('PUT', `/api/admin/programs/${id}`, body),
  deleteProgram: (id: string) => req('DELETE', `/api/admin/programs/${id}`),
  programEnrollments: <T>(id: string) => req<T[]>('GET', `/api/admin/programs/${id}/enrollments`),

  // ── Phase 2: coaches ──
  listCoaches: <T>() => req<T[]>('GET', '/api/admin/coaches'),
  createCoach: <T>(body: unknown) => req<T>('POST', '/api/admin/coaches', body),
  updateCoach: <T>(id: string, body: unknown) => req<T>('PUT', `/api/admin/coaches/${id}`, body),
  deleteCoach: (id: string) => req('DELETE', `/api/admin/coaches/${id}`),
  coachBookings: <T>() => req<T[]>('GET', '/api/admin/coach-bookings'),
  bookingMessages: <T>(id: string) => req<T[]>('GET', `/api/admin/coach-bookings/${id}/messages`),
  sendBookingMessage: <T>(id: string, body: string) => req<T>('POST', `/api/admin/coach-bookings/${id}/messages`, { body }),

  // ── Phase 2: companies (corporate) ──
  listCompanies: <T>() => req<T[]>('GET', '/api/admin/companies'),
  getCompany: <T>(id: string) => req<T>('GET', `/api/admin/companies/${id}`),
  createCompany: <T>(body: unknown) => req<T>('POST', '/api/admin/companies', body),
  updateCompany: <T>(id: string, body: unknown) => req<T>('PUT', `/api/admin/companies/${id}`, body),
  deleteCompany: (id: string) => req('DELETE', `/api/admin/companies/${id}`),

  // ── Reports & pricing ──
  stats: <T>(days = 30) => req<T>('GET', `/api/admin/stats?days=${days}`),
  cohorts: <T>() => req<T>('GET', '/api/admin/cohorts'),
  revenue: <T>() => req<T>('GET', '/api/admin/revenue'),
  seedCatalog: <T>() => req<T>('POST', '/api/admin/seed-catalog'),
  getPricing: <T>() => req<T>('GET', '/api/admin/pricing'),
  savePricing: <T>(body: unknown) => req<T>('PUT', '/api/admin/pricing', body),

  // ── Push announcements ──
  announce: <T>(body: unknown) => req<T>('POST', '/api/admin/announce', body),

  // ── Challenges ──
  listChallenges: <T>() => req<T[]>('GET', '/api/admin/challenges'),
  createChallenge: <T>(body: unknown) => req<T>('POST', '/api/admin/challenges', body),
  updateChallenge: <T>(id: string, body: unknown) => req<T>('PUT', `/api/admin/challenges/${id}`, body),
  deleteChallenge: (id: string) => req('DELETE', `/api/admin/challenges/${id}`),
};

export { API_URL };
