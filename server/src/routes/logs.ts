import { Router, Response } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { AuthedRequest, requireAuth } from '../auth';
import { makeId, todayISO } from '../util';

export const logsRouter = Router();
logsRouter.use(requireAuth);

const foodItemSchema = z.object({
  name: z.string(),
  calories: z.number().nonnegative(),
  protein: z.number().nonnegative().optional(),
  carbs: z.number().nonnegative().optional(),
  fat: z.number().nonnegative().optional(),
});

function dateFilter(req: AuthedRequest): string | undefined {
  const d = req.query.date;
  return typeof d === 'string' ? d : undefined;
}

/* ----------------------------- Meals ----------------------------- */

const mealSchema = z.object({
  date: z.string().optional(),
  type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  items: z.array(foodItemSchema).min(1),
  notes: z.string().optional(),
});

logsRouter.get('/meals', async (req: AuthedRequest, res: Response) => {
  const date = dateFilter(req);
  const rows = date
    ? await db.prepare('SELECT * FROM meals WHERE user_id = ? AND date = ? ORDER BY logged_at DESC')
        .all(req.userId, date)
    : await db.prepare('SELECT * FROM meals WHERE user_id = ? ORDER BY logged_at DESC LIMIT 200')
        .all(req.userId);
  res.json(
    (rows as any[]).map((r) => ({ ...r, items: JSON.parse(r.items) })),
  );
});

logsRouter.post('/meals', async (req: AuthedRequest, res: Response) => {
  const parsed = mealSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  const { date, type, items, notes } = parsed.data;
  const id = makeId();
  const now = new Date().toISOString();
  await db.prepare(
    'INSERT INTO meals (id, user_id, date, logged_at, type, items, notes) VALUES (?,?,?,?,?,?,?)',
  ).run(id, req.userId, date ?? todayISO(), now, type, JSON.stringify(items), notes ?? null);
  res.status(201).json({ id });
});

/* --------------------------- Exercises --------------------------- */

const exerciseSchema = z.object({
  date: z.string().optional(),
  activity: z.string(),
  durationMinutes: z.number().positive(),
  caloriesBurned: z.number().nonnegative().optional(),
  steps: z.number().nonnegative().optional(),
  avgHeartRate: z.number().positive().optional(),
  source: z.enum(['manual', 'apple_health', 'google_fit', 'fitbit']).default('manual'),
});

logsRouter.get('/exercises', async (req: AuthedRequest, res: Response) => {
  const date = dateFilter(req);
  const rows = date
    ? await db.prepare('SELECT * FROM exercises WHERE user_id = ? AND date = ? ORDER BY logged_at DESC')
        .all(req.userId, date)
    : await db.prepare('SELECT * FROM exercises WHERE user_id = ? ORDER BY logged_at DESC LIMIT 200')
        .all(req.userId);
  res.json(rows);
});

logsRouter.post('/exercises', async (req: AuthedRequest, res: Response) => {
  const parsed = exerciseSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  const e = parsed.data;
  const id = makeId();
  await db.prepare(
    `INSERT INTO exercises
       (id, user_id, date, logged_at, activity, duration_minutes, calories_burned, steps, avg_heart_rate, source)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
  ).run(
    id,
    req.userId,
    e.date ?? todayISO(),
    new Date().toISOString(),
    e.activity,
    e.durationMinutes,
    e.caloriesBurned ?? null,
    e.steps ?? null,
    e.avgHeartRate ?? null,
    e.source,
  );
  res.status(201).json({ id });
});

/* ----------------------------- Moods ----------------------------- */

const moodSchema = z.object({
  date: z.string().optional(),
  mood: z.number().int().min(1).max(5),
  stress: z.number().int().min(1).max(5).optional(),
  energy: z.number().int().min(1).max(5).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

logsRouter.get('/moods', async (req: AuthedRequest, res: Response) => {
  const date = dateFilter(req);
  const rows = date
    ? await db.prepare('SELECT * FROM moods WHERE user_id = ? AND date = ? ORDER BY logged_at DESC')
        .all(req.userId, date)
    : await db.prepare('SELECT * FROM moods WHERE user_id = ? ORDER BY logged_at DESC LIMIT 200')
        .all(req.userId);
  res.json(
    (rows as any[]).map((r) => ({ ...r, tags: r.tags ? JSON.parse(r.tags) : [] })),
  );
});

logsRouter.post('/moods', async (req: AuthedRequest, res: Response) => {
  const parsed = moodSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  const m = parsed.data;
  const id = makeId();
  await db.prepare(
    `INSERT INTO moods (id, user_id, date, logged_at, mood, stress, energy, tags, notes)
     VALUES (?,?,?,?,?,?,?,?,?)`,
  ).run(
    id,
    req.userId,
    m.date ?? todayISO(),
    new Date().toISOString(),
    m.mood,
    m.stress ?? null,
    m.energy ?? null,
    m.tags ? JSON.stringify(m.tags) : null,
    m.notes ?? null,
  );
  res.status(201).json({ id });
});

/* ----------------------------- Sleep ----------------------------- */

const sleepSchema = z.object({
  date: z.string().optional(),
  bedtime: z.string(),
  wakeTime: z.string(),
  durationMinutes: z.number().positive(),
  quality: z.number().int().min(1).max(5),
  source: z.enum(['manual', 'apple_health', 'google_fit', 'fitbit']).default('manual'),
});

logsRouter.get('/sleep', async (req: AuthedRequest, res: Response) => {
  const date = dateFilter(req);
  const rows = date
    ? await db.prepare('SELECT * FROM sleep WHERE user_id = ? AND date = ? ORDER BY logged_at DESC')
        .all(req.userId, date)
    : await db.prepare('SELECT * FROM sleep WHERE user_id = ? ORDER BY logged_at DESC LIMIT 200')
        .all(req.userId);
  res.json(rows);
});

logsRouter.post('/sleep', async (req: AuthedRequest, res: Response) => {
  const parsed = sleepSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  const s = parsed.data;
  const id = makeId();
  await db.prepare(
    `INSERT INTO sleep (id, user_id, date, logged_at, bedtime, wake_time, duration_minutes, quality, source)
     VALUES (?,?,?,?,?,?,?,?,?)`,
  ).run(
    id,
    req.userId,
    s.date ?? todayISO(),
    new Date().toISOString(),
    s.bedtime,
    s.wakeTime,
    s.durationMinutes,
    s.quality,
    s.source,
  );
  res.status(201).json({ id });
});

/* ----------------------------- Weight ---------------------------- */

const weightSchema = z.object({
  date: z.string().optional(),
  weightKg: z.number().positive(),
  bodyFatPct: z.number().positive().optional(),
});

logsRouter.get('/weights', async (req: AuthedRequest, res: Response) => {
  const rows = await db.prepare('SELECT * FROM weights WHERE user_id = ? ORDER BY date DESC LIMIT 365')
    .all(req.userId);
  res.json(rows);
});

logsRouter.post('/weights', async (req: AuthedRequest, res: Response) => {
  const parsed = weightSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  const w = parsed.data;
  const id = makeId();
  await db.prepare(
    'INSERT INTO weights (id, user_id, date, logged_at, weight_kg, body_fat_pct) VALUES (?,?,?,?,?,?)',
  ).run(id, req.userId, w.date ?? todayISO(), new Date().toISOString(), w.weightKg, w.bodyFatPct ?? null);
  res.status(201).json({ id });
});

/* ------------------------------ Water ---------------------------- */

const waterSchema = z.object({
  date: z.string().optional(),
  amountMl: z.number().positive(),
});

logsRouter.get('/water', async (req: AuthedRequest, res: Response) => {
  const date = dateFilter(req) ?? todayISO();
  const rows = await db.prepare('SELECT * FROM water WHERE user_id = ? AND date = ? ORDER BY logged_at DESC')
    .all(req.userId, date) as any[];
  const total = rows.reduce((sum, r) => sum + r.amount_ml, 0);
  res.json({ date, total_ml: total, entries: rows });
});

logsRouter.post('/water', async (req: AuthedRequest, res: Response) => {
  const parsed = waterSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  const w = parsed.data;
  const id = makeId();
  await db.prepare(
    'INSERT INTO water (id, user_id, date, logged_at, amount_ml) VALUES (?,?,?,?,?)',
  ).run(id, req.userId, w.date ?? todayISO(), new Date().toISOString(), w.amountMl);
  res.status(201).json({ id });
});

/* ----------------------- Generic delete -------------------------- */

const DELETABLE: Record<string, string> = {
  meals: 'meals',
  exercises: 'exercises',
  moods: 'moods',
  sleep: 'sleep',
  weights: 'weights',
  water: 'water',
};

logsRouter.delete('/:kind/:id', async (req: AuthedRequest, res: Response) => {
  const table = DELETABLE[req.params.kind];
  if (!table) return res.status(404).json({ error: 'Unknown entry type.' });
  const info = await db.prepare(`DELETE FROM ${table} WHERE id = ? AND user_id = ?`)
    .run(req.params.id, req.userId);
  if (info.changes === 0) return res.status(404).json({ error: 'Entry not found.' });
  res.status(204).end();
});
