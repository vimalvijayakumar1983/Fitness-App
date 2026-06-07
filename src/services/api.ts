/**
 * Typed client for the Fitness App backend API.
 *
 * The app currently persists to local storage (see services/storage.ts); this
 * client is the bridge to the server for the next phase (accounts, cloud sync,
 * food search, AI coach). Point `API_BASE_URL` at your running server.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

// For a real device, replace localhost with your machine's LAN IP.
export const API_BASE_URL = 'http://localhost:4000/api';

const TOKEN_KEY = 'fitnessapp:token';

let cachedToken: string | null = null;

export async function getToken(): Promise<string | null> {
  if (cachedToken) return cachedToken;
  cachedToken = await AsyncStorage.getItem(TOKEN_KEY);
  return cachedToken;
}

export async function setToken(token: string | null): Promise<void> {
  cachedToken = token;
  if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
  else await AsyncStorage.removeItem(TOKEN_KEY);
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean } = {},
): Promise<T> {
  const { method = 'GET', body, auth = true } = options;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = await getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const message = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(message.error || `Request failed (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export interface AuthResult {
  token: string;
  user: { id: string; email: string; name: string | null };
}

export interface FoodResult {
  id: string;
  name: string;
  brand: string | null;
  serving: string;
  calories: number;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
}

export const api = {
  // Auth
  async register(email: string, password: string, name?: string): Promise<AuthResult> {
    const result = await request<AuthResult>('/auth/register', {
      method: 'POST',
      body: { email, password, name },
      auth: false,
    });
    await setToken(result.token);
    return result;
  },
  async login(email: string, password: string): Promise<AuthResult> {
    const result = await request<AuthResult>('/auth/login', {
      method: 'POST',
      body: { email, password },
      auth: false,
    });
    await setToken(result.token);
    return result;
  },
  logout: () => setToken(null),

  // Food database
  searchFoods: (q: string) =>
    request<FoodResult[]>(`/foods/search?q=${encodeURIComponent(q)}`),
  lookupBarcode: (code: string) => request<FoodResult>(`/foods/barcode/${code}`),

  // Logging (mirrors local model shapes)
  logMeal: (body: unknown) => request<{ id: string }>('/meals', { method: 'POST', body }),
  logExercise: (body: unknown) => request<{ id: string }>('/exercises', { method: 'POST', body }),
  logMood: (body: unknown) => request<{ id: string }>('/moods', { method: 'POST', body }),
  logSleep: (body: unknown) => request<{ id: string }>('/sleep', { method: 'POST', body }),
  logWeight: (body: unknown) => request<{ id: string }>('/weights', { method: 'POST', body }),
  logWater: (amountMl: number) =>
    request<{ id: string }>('/water', { method: 'POST', body: { amountMl } }),

  // Goals & analytics
  getGoals: () => request<Record<string, number> | null>('/goals'),
  setGoals: (body: unknown) => request<{ ok: boolean }>('/goals', { method: 'PUT', body }),
  dailySummary: (date?: string) =>
    request<Record<string, number>>(`/analytics/daily${date ? `?date=${date}` : ''}`),
  trend: (metric: string, days = 30) =>
    request<{ metric: string; points: { date: string; value: number }[] }>(
      `/analytics/trend?metric=${metric}&days=${days}`,
    ),

  // AI coach
  coachChat: (message: string, history?: { role: 'user' | 'assistant'; content: string }[]) =>
    request<{ reply: string; offline: boolean }>('/coach/chat', {
      method: 'POST',
      body: { message, history },
    }),
  analyzeFoodPhoto: (imageBase64: string, mediaType = 'image/jpeg') =>
    request<{ items: FoodResult[]; note?: string }>('/coach/analyze-food', {
      method: 'POST',
      body: { imageBase64, mediaType },
    }),
};
