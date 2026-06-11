import { Router, Request, Response } from 'express';
import { db } from '../db';
import { AuthedRequest, requireAuth } from '../auth';
import { makeId } from '../util';

/**
 * Real device-data ingestion. A user "connects" a provider (Apple Health via a
 * bridge, Terra, Rook, …) to get a connection token; the aggregator then POSTs
 * readings to /webhook, which merges them into the user's synced app data so
 * exercises, sleep, glucose and weight from real devices appear in the app.
 *
 * The native on-device read (HealthKit / Health Connect) is wired through the
 * client provider layer; this server side is the cloud ingestion path.
 */
const now = () => new Date().toISOString();

export const integrationsRouter = Router();

/** Issue (or reuse) a connection token for the signed-in user. */
integrationsRouter.post('/connect', requireAuth, (req: AuthedRequest, res: Response) => {
  const provider = String(req.body?.provider ?? 'generic').slice(0, 40);
  let row = db.prepare('SELECT token FROM integration_links WHERE user_id = ? AND provider = ?').get(req.userId, provider) as any;
  if (!row) {
    const token = `lnk_${makeId()}${makeId()}`;
    db.prepare('INSERT INTO integration_links (token, user_id, provider, created_at) VALUES (?, ?, ?, ?)')
      .run(token, req.userId, provider, now());
    row = { token };
  }
  res.json({ token: row.token, provider, webhookPath: '/api/integrations/webhook' });
});

integrationsRouter.get('/status', requireAuth, (req: AuthedRequest, res: Response) => {
  const rows = db.prepare('SELECT provider, created_at, last_sync_at FROM integration_links WHERE user_id = ?').all(req.userId) as any[];
  res.json({ connected: rows.map((r) => ({ provider: r.provider, connectedAt: r.created_at, lastSyncAt: r.last_sync_at })) });
});

integrationsRouter.delete('/disconnect', requireAuth, (req: AuthedRequest, res: Response) => {
  const provider = String(req.body?.provider ?? '');
  db.prepare('DELETE FROM integration_links WHERE user_id = ? AND provider = ?').run(req.userId, provider);
  res.json({ ok: true });
});

type Bucket = 'exercises' | 'sleep' | 'glucose' | 'weights';

/** Merge arrays into the user's app-data blob, de-duping by id. */
function mergeIntoBlob(userId: string, incoming: Partial<Record<Bucket, any[]>>): number {
  const stateRow = db.prepare('SELECT data FROM user_state WHERE user_id = ?').get(userId) as { data: string } | undefined;
  const data: any = stateRow?.data ? JSON.parse(stateRow.data) : {};
  let added = 0;
  for (const bucket of ['exercises', 'sleep', 'glucose', 'weights'] as Bucket[]) {
    const items = incoming[bucket];
    if (!Array.isArray(items) || !items.length) continue;
    const existing: any[] = Array.isArray(data[bucket]) ? data[bucket] : [];
    const ids = new Set(existing.map((e) => e.id));
    for (const raw of items) {
      const item = { id: raw.id || `dev_${makeId()}`, loggedAt: raw.loggedAt || now(), ...raw };
      if (ids.has(item.id)) continue;
      existing.unshift(item);
      ids.add(item.id);
      added++;
    }
    data[bucket] = existing;
  }
  db.prepare(
    `INSERT INTO user_state (user_id, data, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`,
  ).run(userId, JSON.stringify(data), now());
  return added;
}

/**
 * Webhook for aggregators. Auth by the per-user connection token (and an
 * optional shared secret in INTEGRATIONS_WEBHOOK_SECRET). Body:
 * { token, provider?, exercises?, sleep?, glucose?, weights? }.
 */
integrationsRouter.post('/webhook', (req: Request, res: Response) => {
  const secret = process.env.INTEGRATIONS_WEBHOOK_SECRET;
  if (secret && req.headers['x-webhook-secret'] !== secret) {
    return res.status(401).json({ error: 'Bad webhook secret.' });
  }
  const token = String(req.body?.token ?? '');
  const link = db.prepare('SELECT user_id FROM integration_links WHERE token = ?').get(token) as { user_id: string } | undefined;
  if (!link) return res.status(404).json({ error: 'Unknown connection token.' });

  const added = mergeIntoBlob(link.user_id, {
    exercises: req.body?.exercises,
    sleep: req.body?.sleep,
    glucose: req.body?.glucose,
    weights: req.body?.weights,
  });
  db.prepare('UPDATE integration_links SET last_sync_at = ? WHERE token = ?').run(now(), token);
  res.json({ ok: true, ingested: added });
});
