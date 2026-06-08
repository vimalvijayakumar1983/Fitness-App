import { Router, Response } from 'express';
import { db } from '../db';
import { AuthedRequest, requireAuth } from '../auth';

/**
 * Cloud sync of the app-owned data blob (logs, profile, plan, custom items).
 * The app is the source of truth for this; admin-assigned content is delivered
 * separately so it can't be clobbered by a sync push.
 */
export const syncRouter = Router();
syncRouter.use(requireAuth);

syncRouter.get('/', (req: AuthedRequest, res: Response) => {
  const row = db
    .prepare('SELECT data, updated_at FROM user_state WHERE user_id = ?')
    .get(req.userId) as { data: string; updated_at: string } | undefined;
  if (!row) return res.json({ data: null, updatedAt: null });
  res.json({ data: JSON.parse(row.data), updatedAt: row.updated_at });
});

syncRouter.put('/', (req: AuthedRequest, res: Response) => {
  const data = req.body?.data;
  if (data == null) return res.status(400).json({ error: 'Missing data.' });
  const updatedAt = new Date().toISOString();
  db.prepare(
    `INSERT INTO user_state (user_id, data, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`,
  ).run(req.userId, JSON.stringify(data), updatedAt);
  res.json({ ok: true, updatedAt });
});
