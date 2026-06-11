import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { requireAdmin } from '../auth';
import { makeId } from '../util';
import { getPricing, getOnboarding, getFeatures } from '../settings';

/**
 * CMS content API. Reads are public so the customer app can fetch the
 * admin-managed catalog and merge it over its bundled data; writes require the
 * admin role (the back-office).
 */
export const contentRouter = Router();

const now = () => new Date().toISOString();

// ── Mappers: DB row (snake_case + JSON strings) → API object (camelCase) ──
const mapFood = (r: any) => ({
  id: r.id, name: r.name, brand: r.brand ?? undefined, serving: r.serving,
  calories: r.calories, protein: r.protein, carbs: r.carbs, fat: r.fat,
  category: r.category, imageUrl: r.image_url ?? undefined,
});
const mapExercise = (r: any) => ({
  id: r.id, name: r.name, category: r.category, muscle: r.muscle,
  equipment: r.equipment ?? undefined, met: r.met, imageUrl: r.image_url ?? undefined,
});
const mapRecipe = (r: any) => ({
  id: r.id, name: r.name, emoji: r.emoji ?? '🍽️',
  mealTypes: JSON.parse(r.meal_types), diets: JSON.parse(r.diets),
  timeMin: r.time_min, calories: r.calories, protein: r.protein, carbs: r.carbs, fat: r.fat,
  ingredients: JSON.parse(r.ingredients), steps: JSON.parse(r.steps),
  imageUrl: r.image_url ?? undefined,
});

// ── Schemas ──
const foodSchema = z.object({
  name: z.string().min(1), brand: z.string().optional(), serving: z.string().min(1),
  calories: z.number().nonnegative(), protein: z.number().nonnegative().default(0),
  carbs: z.number().nonnegative().default(0), fat: z.number().nonnegative().default(0),
  category: z.string().default('meal'), imageUrl: z.string().url().optional(),
});
const exerciseSchema = z.object({
  name: z.string().min(1), category: z.string().min(1), muscle: z.string().min(1),
  equipment: z.string().optional(), met: z.number().positive(), imageUrl: z.string().url().optional(),
});
const recipeSchema = z.object({
  name: z.string().min(1), emoji: z.string().default('🍽️'),
  mealTypes: z.array(z.string()).min(1), diets: z.array(z.string()).min(1),
  timeMin: z.number().int().nonnegative().default(15),
  calories: z.number().nonnegative(), protein: z.number().nonnegative().default(0),
  carbs: z.number().nonnegative().default(0), fat: z.number().nonnegative().default(0),
  ingredients: z.array(z.object({ name: z.string(), quantity: z.string() })).default([]),
  steps: z.array(z.string()).default([]),
  imageUrl: z.string().url().optional(),
});
const segmentSchema = z.object({ name: z.string().min(1), color: z.string().optional() });

const bad = (res: Response, e: z.ZodError) => res.status(400).json({ error: e.errors[0]?.message ?? 'Invalid input.' });

// ───────────────────────── Public reads ─────────────────────────
contentRouter.get('/foods', async (_req, res) =>
  res.json((await db.prepare('SELECT * FROM cms_foods ORDER BY updated_at DESC').all()).map(mapFood)));
contentRouter.get('/exercises', async (_req, res) =>
  res.json((await db.prepare('SELECT * FROM cms_exercises ORDER BY updated_at DESC').all()).map(mapExercise)));
contentRouter.get('/recipes', async (_req, res) =>
  res.json((await db.prepare('SELECT * FROM cms_recipes ORDER BY updated_at DESC').all()).map(mapRecipe)));
contentRouter.get('/segments', async (_req, res) =>
  res.json(await db.prepare('SELECT * FROM segments ORDER BY name').all()));
contentRouter.get('/pricing', async (_req, res) => res.json(await getPricing()));
contentRouter.get('/onboarding', async (_req, res) => res.json(await getOnboarding()));
contentRouter.get('/features', async (_req, res) => res.json(await getFeatures()));

/** One call for the app to hydrate all admin content. */
contentRouter.get('/all', async (_req, res) =>
  res.json({
    foods: (await db.prepare('SELECT * FROM cms_foods').all()).map(mapFood),
    exercises: (await db.prepare('SELECT * FROM cms_exercises').all()).map(mapExercise),
    recipes: (await db.prepare('SELECT * FROM cms_recipes').all()).map(mapRecipe),
  }));

// ───────────────────────── Admin writes ─────────────────────────
contentRouter.use(requireAdmin);

// Foods
contentRouter.post('/foods', async (req: Request, res: Response) => {
  const p = foodSchema.safeParse(req.body);
  if (!p.success) return bad(res, p.error);
  const id = `cms_${makeId()}`;
  const d = p.data;
  await db.prepare(`INSERT INTO cms_foods (id,name,brand,serving,calories,protein,carbs,fat,category,image_url,created_at,updated_at)
    VALUES (@id,@name,@brand,@serving,@calories,@protein,@carbs,@fat,@category,@image_url,@t,@t)`)
    .run({ id, ...d, brand: d.brand ?? null, image_url: d.imageUrl ?? null, t: now() });
  res.status(201).json(mapFood(await db.prepare('SELECT * FROM cms_foods WHERE id = ?').get(id)));
});
contentRouter.put('/foods/:id', async (req: Request, res: Response) => {
  const p = foodSchema.safeParse(req.body);
  if (!p.success) return bad(res, p.error);
  const d = p.data;
  const r = await db.prepare(`UPDATE cms_foods SET name=@name,brand=@brand,serving=@serving,calories=@calories,
    protein=@protein,carbs=@carbs,fat=@fat,category=@category,image_url=@image_url,updated_at=@t WHERE id=@id`)
    .run({ id: req.params.id, ...d, brand: d.brand ?? null, image_url: d.imageUrl ?? null, t: now() });
  if (!r.changes) return res.status(404).json({ error: 'Not found.' });
  res.json(mapFood(await db.prepare('SELECT * FROM cms_foods WHERE id = ?').get(req.params.id)));
});
contentRouter.delete('/foods/:id', async (req: Request, res: Response) => {
  await db.prepare('DELETE FROM cms_foods WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// Exercises
contentRouter.post('/exercises', async (req: Request, res: Response) => {
  const p = exerciseSchema.safeParse(req.body);
  if (!p.success) return bad(res, p.error);
  const id = `cms_${makeId()}`;
  const d = p.data;
  await db.prepare(`INSERT INTO cms_exercises (id,name,category,muscle,equipment,met,image_url,created_at,updated_at)
    VALUES (@id,@name,@category,@muscle,@equipment,@met,@image_url,@t,@t)`)
    .run({ id, ...d, equipment: d.equipment ?? null, image_url: d.imageUrl ?? null, t: now() });
  res.status(201).json(mapExercise(await db.prepare('SELECT * FROM cms_exercises WHERE id = ?').get(id)));
});
contentRouter.put('/exercises/:id', async (req: Request, res: Response) => {
  const p = exerciseSchema.safeParse(req.body);
  if (!p.success) return bad(res, p.error);
  const d = p.data;
  const r = await db.prepare(`UPDATE cms_exercises SET name=@name,category=@category,muscle=@muscle,
    equipment=@equipment,met=@met,image_url=@image_url,updated_at=@t WHERE id=@id`)
    .run({ id: req.params.id, ...d, equipment: d.equipment ?? null, image_url: d.imageUrl ?? null, t: now() });
  if (!r.changes) return res.status(404).json({ error: 'Not found.' });
  res.json(mapExercise(await db.prepare('SELECT * FROM cms_exercises WHERE id = ?').get(req.params.id)));
});
contentRouter.delete('/exercises/:id', async (req: Request, res: Response) => {
  await db.prepare('DELETE FROM cms_exercises WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// Recipes
const recipeRow = (id: string, d: z.infer<typeof recipeSchema>) => ({
  id, name: d.name, emoji: d.emoji,
  meal_types: JSON.stringify(d.mealTypes), diets: JSON.stringify(d.diets),
  time_min: d.timeMin, calories: d.calories, protein: d.protein, carbs: d.carbs, fat: d.fat,
  ingredients: JSON.stringify(d.ingredients), steps: JSON.stringify(d.steps),
  image_url: d.imageUrl ?? null, t: now(),
});
contentRouter.post('/recipes', async (req: Request, res: Response) => {
  const p = recipeSchema.safeParse(req.body);
  if (!p.success) return bad(res, p.error);
  const id = `cms_${makeId()}`;
  await db.prepare(`INSERT INTO cms_recipes (id,name,emoji,meal_types,diets,time_min,calories,protein,carbs,fat,ingredients,steps,image_url,created_at,updated_at)
    VALUES (@id,@name,@emoji,@meal_types,@diets,@time_min,@calories,@protein,@carbs,@fat,@ingredients,@steps,@image_url,@t,@t)`)
    .run(recipeRow(id, p.data));
  res.status(201).json(mapRecipe(await db.prepare('SELECT * FROM cms_recipes WHERE id = ?').get(id)));
});
contentRouter.put('/recipes/:id', async (req: Request, res: Response) => {
  const p = recipeSchema.safeParse(req.body);
  if (!p.success) return bad(res, p.error);
  const r = await db.prepare(`UPDATE cms_recipes SET name=@name,emoji=@emoji,meal_types=@meal_types,diets=@diets,
    time_min=@time_min,calories=@calories,protein=@protein,carbs=@carbs,fat=@fat,ingredients=@ingredients,
    steps=@steps,image_url=@image_url,updated_at=@t WHERE id=@id`)
    .run(recipeRow(req.params.id, p.data));
  if (!r.changes) return res.status(404).json({ error: 'Not found.' });
  res.json(mapRecipe(await db.prepare('SELECT * FROM cms_recipes WHERE id = ?').get(req.params.id)));
});
contentRouter.delete('/recipes/:id', async (req: Request, res: Response) => {
  await db.prepare('DELETE FROM cms_recipes WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// Segments
contentRouter.post('/segments', async (req: Request, res: Response) => {
  const p = segmentSchema.safeParse(req.body);
  if (!p.success) return bad(res, p.error);
  const id = `seg_${makeId()}`;
  await db.prepare('INSERT INTO segments (id,name,color,created_at) VALUES (?,?,?,?)')
    .run(id, p.data.name, p.data.color ?? null, now());
  res.status(201).json(await db.prepare('SELECT * FROM segments WHERE id = ?').get(id));
});
contentRouter.delete('/segments/:id', async (req: Request, res: Response) => {
  await db.prepare('DELETE FROM segments WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});
