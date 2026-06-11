import { db } from './db';

/** Pricing in minor units (cents/fils) per tier → interval → currency. */
export interface Pricing {
  premium: { month: Record<string, number>; year: Record<string, number> };
  coached: { month: Record<string, number>; year: Record<string, number> };
}

export const DEFAULT_PRICING: Pricing = {
  premium: {
    month: { usd: 999, aed: 3900, eur: 899, gbp: 799 },
    year: { usd: 7900, aed: 29900, eur: 6900, gbp: 5900 },
  },
  coached: {
    month: { usd: 9900, aed: 39900, eur: 8900, gbp: 7900 },
    year: { usd: 99000, aed: 399000, eur: 89000, gbp: 79000 },
  },
};

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const row = (await db.prepare('SELECT value FROM settings WHERE key = ?').get(key)) as { value: string } | undefined;
  if (!row) return fallback;
  try {
    return JSON.parse(row.value) as T;
  } catch {
    return fallback;
  }
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  await db.prepare(
    `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
  ).run(key, JSON.stringify(value), new Date().toISOString());
}

export const getPricing = (): Promise<Pricing> => getSetting<Pricing>('pricing', DEFAULT_PRICING);
export const setPricing = (p: Pricing): Promise<void> => setSetting('pricing', p);
