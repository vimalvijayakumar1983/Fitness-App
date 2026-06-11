import { Router, Response } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { AuthedRequest, requireAuth } from '../auth';

export const goalsRouter = Router();
goalsRouter.use(requireAuth);

const goalsSchema = z.object({
  dailyCalories: z.number().int().positive().optional(),
  dailyProtein: z.number().int().positive().optional(),
  dailySteps: z.number().int().positive().optional(),
  dailyWaterMl: z.number().int().positive().optional(),
  sleepHours: z.number().positive().optional(),
  targetWeightKg: z.number().positive().optional(),
});

goalsRouter.get('/', async (req: AuthedRequest, res: Response) => {
  const row = await db.prepare('SELECT * FROM goals WHERE user_id = ?').get(req.userId);
  res.json(row ?? null);
});

goalsRouter.put('/', async (req: AuthedRequest, res: Response) => {
  const parsed = goalsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  const g = parsed.data;
  await db.prepare(
    `INSERT INTO goals
       (user_id, daily_calories, daily_protein, daily_steps, daily_water_ml, sleep_hours, target_weight_kg, updated_at)
     VALUES (@user_id, @daily_calories, @daily_protein, @daily_steps, @daily_water_ml, @sleep_hours, @target_weight_kg, @updated_at)
     ON CONFLICT(user_id) DO UPDATE SET
       daily_calories = excluded.daily_calories,
       daily_protein = excluded.daily_protein,
       daily_steps = excluded.daily_steps,
       daily_water_ml = excluded.daily_water_ml,
       sleep_hours = excluded.sleep_hours,
       target_weight_kg = excluded.target_weight_kg,
       updated_at = excluded.updated_at`,
  ).run({
    user_id: req.userId,
    daily_calories: g.dailyCalories ?? null,
    daily_protein: g.dailyProtein ?? null,
    daily_steps: g.dailySteps ?? null,
    daily_water_ml: g.dailyWaterMl ?? null,
    sleep_hours: g.sleepHours ?? null,
    target_weight_kg: g.targetWeightKg ?? null,
    updated_at: new Date().toISOString(),
  });
  res.json({ ok: true });
});
