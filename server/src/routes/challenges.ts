import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { AuthedRequest, requireAuth, requireAdmin } from '../auth';
import { makeId } from '../util';

/**
 * Community challenges — time-boxed goals (steps, workouts, glucose logs, …)
 * users join and climb a leaderboard. A retention/social loop.
 *  - challengesRouter (/api/challenges): public list + the user's participation.
 *  - adminChallengesRouter (/api/admin): back-office CRUD.
 */
const now = () => new Date().toISOString();
const bad = (res: Response, e: z.ZodError) => res.status(400).json({ error: e.errors[0]?.message ?? 'Invalid input.' });

const METRICS = ['steps', 'active_minutes', 'workouts', 'glucose_logs', 'days_logged'] as const;

const mapChallenge = (r: any) => ({
  id: r.id, title: r.title, description: r.description ?? '', emoji: r.emoji ?? '🏆',
  metric: r.metric, goal: r.goal, unit: r.unit ?? '', startAt: r.start_at, endAt: r.end_at,
  active: !!r.active, createdAt: r.created_at, updatedAt: r.updated_at,
});

const initials = (name: string | null, email: string) =>
  (name || email).split(/[ @.]/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');

export const challengesRouter = Router();

// Public: active challenges with participant counts.
challengesRouter.get('/', async (_req, res) => {
  const rows = await db.prepare("SELECT * FROM challenges WHERE active = 1 ORDER BY end_at ASC").all() as any[];
  res.json(await Promise.all(rows.map(async (r) => ({
    ...mapChallenge(r),
    participants: ((await db.prepare('SELECT COUNT(*) n FROM challenge_participants WHERE challenge_id = ?').get(r.id)) as any).n,
  }))));
});

// The signed-in user's joined challenges + progress (precedes '/:id').
challengesRouter.get('/mine', requireAuth, async (req: AuthedRequest, res) => {
  const rows = await db.prepare(
    `SELECT c.*, p.progress, p.joined_at FROM challenge_participants p JOIN challenges c ON c.id = p.challenge_id
     WHERE p.user_id = ? ORDER BY c.end_at ASC`,
  ).all(req.userId) as any[];
  res.json(rows.map((r) => ({ ...mapChallenge(r), progress: r.progress, joined: true })));
});

challengesRouter.post('/:id/join', requireAuth, async (req: AuthedRequest, res: Response) => {
  const c = await db.prepare('SELECT id FROM challenges WHERE id = ? AND active = 1').get(req.params.id);
  if (!c) return res.status(404).json({ error: 'Challenge not found.' });
  await db.prepare(
    `INSERT INTO challenge_participants (challenge_id, user_id, progress, joined_at, updated_at)
     VALUES (?, ?, 0, ?, ?) ON CONFLICT(challenge_id, user_id) DO NOTHING`,
  ).run(req.params.id, req.userId, now(), now());
  res.status(201).json({ ok: true });
});

challengesRouter.post('/:id/progress', requireAuth, async (req: AuthedRequest, res: Response) => {
  const progress = Math.max(0, Number(req.body?.progress) || 0);
  const r = await db.prepare(
    `UPDATE challenge_participants SET progress = ?, updated_at = ? WHERE challenge_id = ? AND user_id = ?`,
  ).run(progress, now(), req.params.id, req.userId);
  if (!r.changes) return res.status(404).json({ error: 'Join the challenge first.' });
  res.json({ ok: true, progress });
});

challengesRouter.post('/:id/leave', requireAuth, async (req: AuthedRequest, res) => {
  await db.prepare('DELETE FROM challenge_participants WHERE challenge_id = ? AND user_id = ?').run(req.params.id, req.userId);
  res.json({ ok: true });
});

// Leaderboard (top 50) + the caller's rank.
challengesRouter.get('/:id/leaderboard', requireAuth, async (req: AuthedRequest, res: Response) => {
  const rows = await db.prepare(
    `SELECT p.user_id, p.progress, u.name, u.email FROM challenge_participants p JOIN users u ON u.id = p.user_id
     WHERE p.challenge_id = ? ORDER BY p.progress DESC, p.updated_at ASC LIMIT 50`,
  ).all(req.params.id) as any[];
  const board = rows.map((r, i) => ({
    rank: i + 1, name: r.name || r.email.split('@')[0], initials: initials(r.name, r.email),
    progress: r.progress, you: r.user_id === req.userId,
  }));
  res.json({ leaderboard: board });
});

challengesRouter.get('/:id', async (req, res) => {
  const r = await db.prepare('SELECT * FROM challenges WHERE id = ?').get(req.params.id);
  if (!r) return res.status(404).json({ error: 'Challenge not found.' });
  res.json(mapChallenge(r));
});

// ───────────────────────── Admin CRUD ─────────────────────────
export const adminChallengesRouter = Router();
adminChallengesRouter.use(requireAdmin);

const schema = z.object({
  title: z.string().min(1),
  description: z.string().optional().default(''),
  emoji: z.string().optional().default('🏆'),
  metric: z.enum(METRICS),
  goal: z.number().positive(),
  unit: z.string().optional().default(''),
  startAt: z.string(),
  endAt: z.string(),
  active: z.boolean().default(true),
});
const row = (id: string, d: z.infer<typeof schema>) => ({
  id, title: d.title, description: d.description ?? '', emoji: d.emoji ?? '🏆', metric: d.metric,
  goal: d.goal, unit: d.unit ?? '', start_at: d.startAt, end_at: d.endAt, active: d.active ? 1 : 0, t: now(),
});

adminChallengesRouter.get('/challenges', async (_req, res) =>
  res.json(await Promise.all(((await db.prepare('SELECT * FROM challenges ORDER BY updated_at DESC').all()) as any[]).map(async (r: any) => ({
    ...mapChallenge(r),
    participants: ((await db.prepare('SELECT COUNT(*) n FROM challenge_participants WHERE challenge_id = ?').get(r.id)) as any).n,
  })))));

adminChallengesRouter.post('/challenges', async (req: Request, res: Response) => {
  const p = schema.safeParse(req.body);
  if (!p.success) return bad(res, p.error);
  const id = `chal_${makeId()}`;
  await db.prepare(
    `INSERT INTO challenges (id,title,description,emoji,metric,goal,unit,start_at,end_at,active,created_at,updated_at)
     VALUES (@id,@title,@description,@emoji,@metric,@goal,@unit,@start_at,@end_at,@active,@t,@t)`,
  ).run(row(id, p.data));
  res.status(201).json(mapChallenge(await db.prepare('SELECT * FROM challenges WHERE id = ?').get(id)));
});

adminChallengesRouter.put('/challenges/:id', async (req: Request, res: Response) => {
  const p = schema.safeParse(req.body);
  if (!p.success) return bad(res, p.error);
  const r = await db.prepare(
    `UPDATE challenges SET title=@title,description=@description,emoji=@emoji,metric=@metric,goal=@goal,
       unit=@unit,start_at=@start_at,end_at=@end_at,active=@active,updated_at=@t WHERE id=@id`,
  ).run(row(req.params.id, p.data));
  if (!r.changes) return res.status(404).json({ error: 'Not found.' });
  res.json(mapChallenge(await db.prepare('SELECT * FROM challenges WHERE id = ?').get(req.params.id)));
});

adminChallengesRouter.delete('/challenges/:id', async (req: Request, res: Response) => {
  await db.prepare('DELETE FROM challenges WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});
