import { db } from '../db';
import catalog from './catalog.json';

/**
 * Pre-loads the CMS with the FULL app catalog (foods, exercises, recipes) plus
 * starter segments and plan templates, so the backend is the source of truth
 * and the admin can edit everything the app shows. Ids match the app's bundled
 * ids. Each table is seeded only when empty, so admin edits are never overwritten.
 */
const now = () => new Date().toISOString();
const count = async (t: string): Promise<number> =>
  ((await db.prepare(`SELECT COUNT(*) n FROM ${t}`).get()) as any).n as number;

const FOODS = catalog.foods as any[];
const EX = catalog.exercises as any[];
const RECIPES = catalog.recipes as any[];

const SEGMENTS: [string, string][] = [
  ['Weight loss', '#23A455'],
  ['Muscle gain', '#F2784B'],
  ['Keto', '#8B5CF6'],
  ['PCOS', '#3B82F6'],
  ['Ramadan', '#E8A317'],
];

const meal = (slot: string, title: string, c: number, p: number, cb: number, f: number, recipeId?: string) =>
  ({ slot, title, calories: c, protein: p, carbs: cb, fat: f, recipeId });

const TEMPLATES = [
  {
    id: 'tpl_lean', name: 'Lean 1800', description: 'Calorie-controlled cut',
    meals: [
      meal('breakfast', 'Greek yogurt protein bowl', 330, 30, 35, 6, 'r_greek_yogurt_bowl'),
      meal('lunch', 'Greek chicken salad', 450, 38, 18, 26, 'r_greek_salad'),
      meal('dinner', 'Baked salmon & veggies', 480, 40, 14, 30, 'r_salmon_veg'),
      meal('snack', 'Hummus & veggie sticks', 180, 6, 18, 10, 'r_hummus_veg'),
    ],
  },
  {
    id: 'tpl_muscle', name: 'Muscle 2600', description: 'High-protein gain',
    meals: [
      meal('breakfast', 'Veggie omelette', 310, 22, 6, 22, 'r_veggie_omelette'),
      meal('lunch', 'Chicken & rice power bowl', 550, 45, 55, 14, 'r_chicken_rice_bowl'),
      meal('dinner', 'Chicken biryani', 580, 32, 64, 20, 'r_chicken_biryani'),
      meal('snack', 'Protein shake', 220, 30, 18, 4, 'r_protein_shake'),
    ],
  },
  {
    id: 'tpl_balanced', name: 'Balanced 2000', description: 'Everyday healthy eating',
    meals: [
      meal('breakfast', 'Peanut butter banana oats', 420, 15, 62, 14, 'r_oats_pb_banana'),
      meal('lunch', 'Chicken & rice power bowl', 550, 45, 55, 14, 'r_chicken_rice_bowl'),
      meal('dinner', 'Tofu coconut curry', 520, 22, 48, 26, 'r_tofu_curry'),
    ],
  },
];

const foodParams = (f: any, t: string) => ({
  id: f.id, name: f.name, brand: f.brand ?? null, serving: f.serving, calories: f.calories,
  protein: f.protein ?? 0, carbs: f.carbs ?? 0, fat: f.fat ?? 0, category: f.category, image_url: f.imageUrl ?? null, t,
});
const exParams = (e: any, t: string) => ({
  id: e.id, name: e.name, category: e.category, muscle: e.muscle, equipment: e.equipment ?? null, met: e.met, image_url: e.imageUrl ?? null, t,
});
const recParams = (r: any, t: string) => ({
  id: r.id, name: r.name, emoji: r.emoji ?? '🍽️', meal_types: JSON.stringify(r.mealTypes ?? []), diets: JSON.stringify(r.diets ?? []),
  time_min: r.timeMin ?? 15, calories: r.calories, protein: r.protein ?? 0, carbs: r.carbs ?? 0, fat: r.fat ?? 0,
  ingredients: JSON.stringify(r.ingredients ?? []), steps: JSON.stringify(r.steps ?? []), image_url: r.imageUrl ?? null, t,
});

/**
 * Backfill/refresh the full catalog into an EXISTING database (upsert by id).
 */
export async function importCatalog(): Promise<{ foods: number; exercises: number; recipes: number }> {
  const t = now();
  await db.tx(async () => {
    const foodIns = db.prepare(
      `INSERT INTO cms_foods (id,name,brand,serving,calories,protein,carbs,fat,category,image_url,created_at,updated_at)
       VALUES (@id,@name,@brand,@serving,@calories,@protein,@carbs,@fat,@category,@image_url,@t,@t)
       ON CONFLICT(id) DO UPDATE SET name=excluded.name, serving=excluded.serving, calories=excluded.calories,
         protein=excluded.protein, carbs=excluded.carbs, fat=excluded.fat, category=excluded.category, updated_at=excluded.updated_at`,
    );
    for (const f of FOODS) await foodIns.run(foodParams(f, t));

    const exIns = db.prepare(
      `INSERT INTO cms_exercises (id,name,category,muscle,equipment,met,image_url,created_at,updated_at)
       VALUES (@id,@name,@category,@muscle,@equipment,@met,@image_url,@t,@t)
       ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, muscle=excluded.muscle,
         equipment=excluded.equipment, met=excluded.met, updated_at=excluded.updated_at`,
    );
    for (const e of EX) await exIns.run(exParams(e, t));

    const recIns = db.prepare(
      `INSERT INTO cms_recipes (id,name,emoji,meal_types,diets,time_min,calories,protein,carbs,fat,ingredients,steps,image_url,created_at,updated_at)
       VALUES (@id,@name,@emoji,@meal_types,@diets,@time_min,@calories,@protein,@carbs,@fat,@ingredients,@steps,@image_url,@t,@t)
       ON CONFLICT(id) DO UPDATE SET name=excluded.name, emoji=excluded.emoji, meal_types=excluded.meal_types,
         diets=excluded.diets, time_min=excluded.time_min, calories=excluded.calories, protein=excluded.protein,
         carbs=excluded.carbs, fat=excluded.fat, ingredients=excluded.ingredients, steps=excluded.steps, updated_at=excluded.updated_at`,
    );
    for (const r of RECIPES) await recIns.run(recParams(r, t));
  });

  if ((await count('segments')) === 0) {
    const ins = db.prepare('INSERT INTO segments (id,name,color,created_at) VALUES (?,?,?,?)');
    let i = 0;
    for (const [name, color] of SEGMENTS) await ins.run(`seg_${++i}`, name, color, t);
  }
  if ((await count('plan_templates')) === 0) {
    const ins = db.prepare(`INSERT INTO plan_templates (id,name,description,segment_id,meals,created_at,updated_at) VALUES (?,?,?,NULL,?,?,?)`);
    for (const tp of TEMPLATES) await ins.run(tp.id, tp.name, tp.description, JSON.stringify(tp.meals), t, t);
  }

  return { foods: FOODS.length, exercises: EX.length, recipes: RECIPES.length };
}

export async function seedContent(): Promise<void> {
  const t = now();

  if ((await count('cms_foods')) === 0) {
    const ins = db.prepare(
      `INSERT INTO cms_foods (id,name,brand,serving,calories,protein,carbs,fat,category,image_url,created_at,updated_at)
       VALUES (@id,@name,@brand,@serving,@calories,@protein,@carbs,@fat,@category,@image_url,@t,@t)`,
    );
    await db.tx(async () => { for (const f of FOODS) await ins.run(foodParams(f, t)); });
  }

  if ((await count('cms_exercises')) === 0) {
    const ins = db.prepare(
      `INSERT INTO cms_exercises (id,name,category,muscle,equipment,met,image_url,created_at,updated_at)
       VALUES (@id,@name,@category,@muscle,@equipment,@met,@image_url,@t,@t)`,
    );
    await db.tx(async () => { for (const e of EX) await ins.run(exParams(e, t)); });
  }

  if ((await count('cms_recipes')) === 0) {
    const ins = db.prepare(
      `INSERT INTO cms_recipes (id,name,emoji,meal_types,diets,time_min,calories,protein,carbs,fat,ingredients,steps,image_url,created_at,updated_at)
       VALUES (@id,@name,@emoji,@meal_types,@diets,@time_min,@calories,@protein,@carbs,@fat,@ingredients,@steps,@image_url,@t,@t)`,
    );
    await db.tx(async () => { for (const r of RECIPES) await ins.run(recParams(r, t)); });
  }

  if ((await count('segments')) === 0) {
    const ins = db.prepare('INSERT INTO segments (id,name,color,created_at) VALUES (?,?,?,?)');
    let i = 0;
    for (const [name, color] of SEGMENTS) await ins.run(`seg_${++i}`, name, color, t);
  }

  if ((await count('plan_templates')) === 0) {
    const ins = db.prepare(`INSERT INTO plan_templates (id,name,description,segment_id,meals,created_at,updated_at) VALUES (?,?,?,NULL,?,?,?)`);
    for (const tp of TEMPLATES) await ins.run(tp.id, tp.name, tp.description, JSON.stringify(tp.meals), t, t);
  }
}
