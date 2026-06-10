/**
 * Typed client for the Fitness App backend API.
 *
 * The app currently persists to local storage (see services/storage.ts); this
 * client is the bridge to the server for the next phase (accounts, cloud sync,
 * food search, AI coach). Point `API_BASE_URL` at your running server.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ExerciseDef, Food, Recipe } from '@/models/types';

/**
 * Base URL comes from EXPO_PUBLIC_API_URL (inlined at build time). When unset,
 * the app runs entirely on bundled + local data so nothing breaks offline.
 */
const API_ORIGIN = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:4000';
export const API_BASE_URL = `${API_ORIGIN}/api`;
export const apiEnabled = !!process.env.EXPO_PUBLIC_API_URL;

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

export interface CmsContent {
  foods: Food[];
  exercises: ExerciseDef[];
  recipes: Recipe[];
}

export interface AssignedMeal {
  slot: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  title: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  recipeId?: string;
}
export interface AssignedPlan {
  name: string;
  meals: AssignedMeal[];
  assignedAt?: string;
}

export interface Subscription {
  plan: 'free' | 'premium' | 'coached';
  status: 'none' | 'trialing' | 'active' | 'canceled';
  isPremium: boolean;
  stripe?: boolean;
}

/** Pricing in minor units per tier → interval → currency. */
export interface PricingConfig {
  premium: { month: Record<string, number>; year: Record<string, number> };
  coached: { month: Record<string, number>; year: Record<string, number> };
}

/** Best-effort fetch of admin content; returns empty sets on any failure. */
export async function fetchCmsContent(): Promise<CmsContent> {
  const empty: CmsContent = { foods: [], exercises: [], recipes: [] };
  if (!apiEnabled) return empty;
  try {
    const data = await api.contentAll();
    return {
      foods: data.foods ?? [],
      exercises: data.exercises ?? [],
      recipes: data.recipes ?? [],
    };
  } catch {
    return empty;
  }
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
  me: () => request<{ user: { id: string; email: string; name: string | null; role: string } }>('/auth/me'),

  // Cloud sync (app-owned data blob)
  getSync: () => request<{ data: unknown | null; updatedAt: string | null }>('/sync'),
  putSync: (data: unknown) =>
    request<{ ok: boolean; updatedAt: string }>('/sync', { method: 'PUT', body: { data } }),

  // Coach-assigned plan (read-only for the customer)
  getMyPlan: () => request<{ plan: AssignedPlan | null }>('/me/plan'),

  // Billing / subscription
  getSubscription: () => request<Subscription>('/billing/subscription'),
  checkout: (tier: 'premium' | 'coached', interval: 'month' | 'year', currency: string) =>
    request<{ url?: string | null; mock?: boolean; isPremium?: boolean }>('/billing/checkout', {
      method: 'POST',
      body: { tier, interval, currency },
    }),

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

  // CMS content (admin-managed; public reads)
  contentAll: () => request<CmsContent>('/content/all', { auth: false }),
  getPricing: () => request<PricingConfig>('/content/pricing', { auth: false }),

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
