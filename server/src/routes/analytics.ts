import { Router, Response } from 'express';
import { db } from '../db';
import { AuthedRequest, requireAuth } from '../auth';
import { todayISO } from '../util';

export const analyticsRouter = Router();
analyticsRouter.use(requireAuth);

/** GET /api/analytics/daily?date=YYYY-MM-DD — one-day headline summary. */
analyticsRouter.get('/daily', async (req: AuthedRequest, res: Response) => {
  const date = (req.query.date as string | undefined) ?? todayISO();
  const uid = req.userId;

  const meals = await db.prepare('SELECT items FROM meals WHERE user_id = ? AND date = ?')
    .all(uid, date) as { items: string }[];
  let caloriesIn = 0;
  let proteinIn = 0;
  for (const m of meals) {
    for (const item of JSON.parse(m.items) as any[]) {
      caloriesIn += item.calories || 0;
      proteinIn += item.protein || 0;
    }
  }

  const ex = await db.prepare(
      `SELECT COALESCE(SUM(calories_burned),0) AS cals,
              COALESCE(SUM(duration_minutes),0) AS mins,
              COALESCE(SUM(steps),0) AS steps
       FROM exercises WHERE user_id = ? AND date = ?`,
    )
    .get(uid, date) as { cals: number; mins: number; steps: number };

  const sleep = await db.prepare(
      'SELECT COALESCE(SUM(duration_minutes),0) AS mins FROM sleep WHERE user_id = ? AND date = ?',
    )
    .get(uid, date) as { mins: number };

  const mood = await db.prepare('SELECT AVG(mood) AS avg FROM moods WHERE user_id = ? AND date = ?')
    .get(uid, date) as { avg: number | null };

  const water = await db.prepare('SELECT COALESCE(SUM(amount_ml),0) AS ml FROM water WHERE user_id = ? AND date = ?')
    .get(uid, date) as { ml: number };

  res.json({
    date,
    caloriesIn,
    proteinIn,
    caloriesOut: ex.cals,
    exerciseMinutes: ex.mins,
    steps: ex.steps,
    sleepMinutes: sleep.mins,
    avgMood: mood.avg,
    waterMl: water.ml,
  });
});

/** GET /api/analytics/trend?metric=steps&days=30 — daily series for charts. */
analyticsRouter.get('/trend', async (req: AuthedRequest, res: Response) => {
  const metric = (req.query.metric as string) ?? 'steps';
  const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 365);
  const uid = req.userId;

  // Map each supported metric to a SQL aggregate over its table.
  const queries: Record<string, string> = {
    steps: `SELECT date, COALESCE(SUM(steps),0) AS value FROM exercises WHERE user_id = ? GROUP BY date`,
    caloriesOut: `SELECT date, COALESCE(SUM(calories_burned),0) AS value FROM exercises WHERE user_id = ? GROUP BY date`,
    exerciseMinutes: `SELECT date, COALESCE(SUM(duration_minutes),0) AS value FROM exercises WHERE user_id = ? GROUP BY date`,
    sleepMinutes: `SELECT date, COALESCE(SUM(duration_minutes),0) AS value FROM sleep WHERE user_id = ? GROUP BY date`,
    mood: `SELECT date, AVG(mood) AS value FROM moods WHERE user_id = ? GROUP BY date`,
    waterMl: `SELECT date, COALESCE(SUM(amount_ml),0) AS value FROM water WHERE user_id = ? GROUP BY date`,
    weightKg: `SELECT date, AVG(weight_kg) AS value FROM weights WHERE user_id = ? GROUP BY date`,
  };
  const sql = queries[metric];
  if (!sql) return res.status(400).json({ error: 'Unknown metric.' });

  const rows = await db.prepare(`${sql} ORDER BY date DESC LIMIT ?`).all(uid, days) as {
    date: string;
    value: number;
  }[];
  res.json({ metric, days, points: rows.reverse() });
});
