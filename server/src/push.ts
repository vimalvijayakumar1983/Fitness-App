import { db } from './db';

/**
 * Remote push via the Expo Push API. No SDK dependency — a plain fetch to
 * Expo's endpoint. Degrades gracefully if the network blocks it (e.g. locally);
 * in production (Railway) outbound is open.
 */
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export interface PushMessage {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

/** Sends a push to a set of Expo tokens (chunked to 100 per request). */
export async function sendPush(tokens: string[], msg: PushMessage): Promise<{ sent: number }> {
  const valid = tokens.filter((t) => t.startsWith('ExponentPushToken') || t.startsWith('ExpoPushToken'));
  if (!valid.length || typeof fetch !== 'function') return { sent: 0 };

  let sent = 0;
  for (let i = 0; i < valid.length; i += 100) {
    const chunk = valid.slice(i, i + 100).map((to) => ({ to, title: msg.title, body: msg.body, data: msg.data ?? {}, sound: 'default' }));
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(chunk),
      });
      if (res.ok) sent += chunk.length;
    } catch {
      /* network unavailable in this environment */
    }
  }
  return { sent };
}

/** Push tokens for a set of user ids. */
export async function tokensForUsers(userIds: string[]): Promise<string[]> {
  if (!userIds.length) return [];
  const rows = (await db.prepare(`SELECT token FROM push_tokens WHERE user_id IN (${userIds.map(() => '?').join(',')})`)
    .all(...userIds)) as { token: string }[];
  return rows.map((r) => r.token);
}
