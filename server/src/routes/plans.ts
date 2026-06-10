import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { AuthedRequest, requireAuth, requireAdmin } from '../auth';
import { makeId } from '../util';
import { getPricing, setPricing, Pricing } from '../settings';

/**
 * Stage 2 — Plans & CRM.
 *  - adminRouter  (mounted at /api/admin, requireAdmin): customers, segments
 *    assignment, plan templates, and assigning a plan to a customer.
 *  - mePlanRouter (mounted at /api/me, requireAuth): the signed-in customer's
 *    assigned plan (read-only).
 */
export const adminRouter = Router();
adminRouter.use(requireAdmin);

export const mePlanRouter = Router();
mePlanRouter.use(requireAuth);

const now = () => new Date().toISOString();
const bad = (res: Response, e: z.ZodError) => res.status(400).json({ error: e.errors[0]?.message ?? 'Invalid input.' });

const planMeal = z.object({
  slot: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  title: z.string().min(1),
  calories: z.number().nonnegative().default(0),
  protein: z.number().nonnegative().default(0),
  carbs: z.number().nonnegative().default(0),
  fat: z.number().nonnegative().default(0),
  recipeId: z.string().optional(),
});

const templateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  segmentId: z.string().optional(),
  meals: z.array(planMeal).default([]),
});

const assignSchema = z.object({
  name: z.string().min(1),
  meals: z.array(planMeal).min(1),
  templateId: z.string().optional(),
});

// ───────────────────────── Customers (CRM) ─────────────────────────
adminRouter.get('/customers', (_req, res) => {
  const rows = db
    .prepare(
      `SELECT u.id, u.email, u.name, u.role, u.segment_id, u.created_at,
              (SELECT 1 FROM customer_plans cp WHERE cp.user_id = u.id) AS has_plan
       FROM users u ORDER BY u.created_at DESC`,
    )
    .all() as any[];
  res.json(
    rows.map((r) => ({
      id: r.id, email: r.email, name: r.name, role: r.role,
      segmentId: r.segment_id ?? null, hasPlan: !!r.has_plan, createdAt: r.created_at,
    })),
  );
});

adminRouter.patch('/customers/:id', (req: Request, res: Response) => {
  const segmentId = req.body?.segmentId ?? null;
  const r = db.prepare('UPDATE users SET segment_id = ? WHERE id = ?').run(segmentId, req.params.id);
  if (!r.changes) return res.status(404).json({ error: 'Customer not found.' });
  res.json({ ok: true });
});

adminRouter.get('/customers/:id/plan', (req: Request, res: Response) => {
  const row = db.prepare('SELECT * FROM customer_plans WHERE user_id = ?').get(req.params.id) as any;
  if (!row) return res.json({ plan: null });
  res.json({ plan: { name: row.name, meals: JSON.parse(row.meals), templateId: row.template_id, assignedAt: row.assigned_at } });
});

adminRouter.post('/customers/:id/plan', (req: Request, res: Response) => {
  const p = assignSchema.safeParse(req.body);
  if (!p.success) return bad(res, p.error);
  const exists = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);
  if (!exists) return res.status(404).json({ error: 'Customer not found.' });
  db.prepare(
    `INSERT INTO customer_plans (user_id, name, meals, template_id, assigned_at)
     VALUES (@uid, @name, @meals, @template_id, @t)
     ON CONFLICT(user_id) DO UPDATE SET name=excluded.name, meals=excluded.meals,
       template_id=excluded.template_id, assigned_at=excluded.assigned_at`,
  ).run({ uid: req.params.id, name: p.data.name, meals: JSON.stringify(p.data.meals), template_id: p.data.templateId ?? null, t: now() });
  res.status(201).json({ ok: true });
});

adminRouter.delete('/customers/:id/plan', (req: Request, res: Response) => {
  db.prepare('DELETE FROM customer_plans WHERE user_id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ───────────────────────── Plan templates ─────────────────────────
const mapTemplate = (r: any) => ({
  id: r.id, name: r.name, description: r.description ?? undefined,
  segmentId: r.segment_id ?? null, meals: JSON.parse(r.meals),
  createdAt: r.created_at, updatedAt: r.updated_at,
});

adminRouter.get('/plan-templates', (_req, res) =>
  res.json(db.prepare('SELECT * FROM plan_templates ORDER BY updated_at DESC').all().map(mapTemplate)));

adminRouter.post('/plan-templates', (req: Request, res: Response) => {
  const p = templateSchema.safeParse(req.body);
  if (!p.success) return bad(res, p.error);
  const id = `tpl_${makeId()}`;
  db.prepare(
    `INSERT INTO plan_templates (id, name, description, segment_id, meals, created_at, updated_at)
     VALUES (@id, @name, @description, @segment_id, @meals, @t, @t)`,
  ).run({ id, name: p.data.name, description: p.data.description ?? null, segment_id: p.data.segmentId ?? null, meals: JSON.stringify(p.data.meals), t: now() });
  res.status(201).json(mapTemplate(db.prepare('SELECT * FROM plan_templates WHERE id = ?').get(id)));
});

adminRouter.put('/plan-templates/:id', (req: Request, res: Response) => {
  const p = templateSchema.safeParse(req.body);
  if (!p.success) return bad(res, p.error);
  const r = db.prepare(
    `UPDATE plan_templates SET name=@name, description=@description, segment_id=@segment_id,
       meals=@meals, updated_at=@t WHERE id=@id`,
  ).run({ id: req.params.id, name: p.data.name, description: p.data.description ?? null, segment_id: p.data.segmentId ?? null, meals: JSON.stringify(p.data.meals), t: now() });
  if (!r.changes) return res.status(404).json({ error: 'Template not found.' });
  res.json(mapTemplate(db.prepare('SELECT * FROM plan_templates WHERE id = ?').get(req.params.id)));
});

adminRouter.delete('/plan-templates/:id', (req: Request, res: Response) => {
  db.prepare('DELETE FROM plan_templates WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ───────────────────────── Pricing (settings) ─────────────────────────
adminRouter.get('/pricing', (_req, res) => res.json(getPricing()));
adminRouter.put('/pricing', (req: Request, res: Response) => {
  const p = req.body as Pricing;
  if (!p?.premium || !p?.coached) return res.status(400).json({ error: 'Invalid pricing.' });
  setPricing(p);
  res.json(getPricing());
});

// ───────────────────────── Reports / analytics ─────────────────────────
adminRouter.get('/stats', (_req, res) => {
  const one = (sql: string, ...args: any[]) => (db.prepare(sql).get(...args) as any)?.n ?? 0;
  const dayAgo = (d: number) => new Date(Date.now() - d * 864e5).toISOString();

  const totalUsers = one('SELECT COUNT(*) n FROM users');
  const totalCustomers = one("SELECT COUNT(*) n FROM users WHERE role = 'customer'");
  const newToday = one('SELECT COUNT(*) n FROM users WHERE created_at >= ?', dayAgo(1));
  const new7d = one('SELECT COUNT(*) n FROM users WHERE created_at >= ?', dayAgo(7));
  const new30d = one('SELECT COUNT(*) n FROM users WHERE created_at >= ?', dayAgo(30));

  const activeSql = "status IN ('active','trialing')";
  const premium = one(`SELECT COUNT(*) n FROM subscriptions WHERE plan='premium' AND ${activeSql}`);
  const coached = one(`SELECT COUNT(*) n FROM subscriptions WHERE plan='coached' AND ${activeSql}`);
  const paying = premium + coached;
  const free = Math.max(0, totalUsers - paying);
  const conversion = totalUsers ? Math.round((paying / totalUsers) * 1000) / 10 : 0;

  // Rough MRR estimate in USD using current pricing (monthly equivalent).
  const pr = getPricing();
  const mPrem = pr.premium.month.usd / 100;
  const mCoach = pr.coached.month.usd / 100;
  const mrr = Math.round(premium * mPrem + coached * mCoach);

  // Signups per day, last 14 days.
  const rows = db
    .prepare(
      `SELECT substr(created_at,1,10) d, COUNT(*) n FROM users
       WHERE created_at >= ? GROUP BY d ORDER BY d`,
    )
    .all(dayAgo(14)) as { d: string; n: number }[];
  const byDay = new Map(rows.map((r) => [r.d, r.n]));
  const signups: { date: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10);
    signups.push({ date: d, count: byDay.get(d) ?? 0 });
  }

  const segments = db
    .prepare(
      `SELECT s.name, COUNT(u.id) n FROM segments s
       LEFT JOIN users u ON u.segment_id = s.id GROUP BY s.id ORDER BY n DESC`,
    )
    .all() as { name: string; n: number }[];

  const recent = db
    .prepare(
      `SELECT u.email, u.name, u.created_at, COALESCE(sub.plan,'free') plan
       FROM users u LEFT JOIN subscriptions sub ON sub.user_id = u.id
       ORDER BY u.created_at DESC LIMIT 8`,
    )
    .all() as any[];

  res.json({
    totalUsers, totalCustomers, newToday, new7d, new30d,
    plans: { free, premium, coached, paying },
    conversion, mrr,
    signups,
    segments,
    recent: recent.map((r) => ({ email: r.email, name: r.name, plan: r.plan, createdAt: r.created_at })),
  });
});

// ───────────────────── Customer-facing: my plan ─────────────────────
mePlanRouter.get('/plan', (req: AuthedRequest, res: Response) => {
  const row = db.prepare('SELECT * FROM customer_plans WHERE user_id = ?').get(req.userId) as any;
  if (!row) return res.json({ plan: null });
  res.json({ plan: { name: row.name, meals: JSON.parse(row.meals), assignedAt: row.assigned_at } });
});
