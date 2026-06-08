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
};

export { API_URL };
