import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { AuthedRequest, requireAuth, requireAdmin } from '../auth';
import { makeId } from '../util';
import { getPricing, setPricing, Pricing } from '../settings';
import { importCatalog } from '../seed/content';

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
              COALESCE(sub.plan, 'free') AS plan,
              (SELECT 1 FROM customer_plans cp WHERE cp.user_id = u.id) AS has_plan
       FROM users u LEFT JOIN subscriptions sub ON sub.user_id = u.id
       ORDER BY u.created_at DESC`,
    )
    .all() as any[];
  res.json(
    rows.map((r) => ({
      id: r.id, email: r.email, name: r.name, role: r.role, plan: r.plan,
      segmentId: r.segment_id ?? null, hasPlan: !!r.has_plan, createdAt: r.created_at,
    })),
  );
});

adminRouter.get('/customers/:id', (req: Request, res: Response) => {
  const u = db.prepare('SELECT id, email, name, role, segment_id, created_at FROM users WHERE id = ?').get(req.params.id) as any;
  if (!u) return res.status(404).json({ error: 'Customer not found.' });
  const sub = db.prepare('SELECT plan, status, current_period_end, updated_at FROM subscriptions WHERE user_id = ?').get(req.params.id) as any;
  const state = db.prepare('SELECT updated_at FROM user_state WHERE user_id = ?').get(req.params.id) as any;
  const planRow = db.prepare('SELECT name, meals, assigned_at FROM customer_plans WHERE user_id = ?').get(req.params.id) as any;

  // LTV estimate: months active × the plan's monthly price (USD).
  let ltv = 0;
  let monthsActive = 0;
  const plan = sub?.plan ?? 'free';
  if (plan === 'premium' || plan === 'coached') {
    const start = Date.parse(sub.updated_at || u.created_at);
    monthsActive = Math.max(1, Math.round((Date.now() - start) / (30 * 864e5)));
    const pr = getPricing();
    const monthly = (plan === 'coached' ? pr.coached.month.usd : pr.premium.month.usd) / 100;
    ltv = Math.round(monthsActive * monthly);
  }

  res.json({
    id: u.id, email: u.email, name: u.name, role: u.role,
    segmentId: u.segment_id ?? null, createdAt: u.created_at,
    subscription: { plan, status: sub?.status ?? 'none' },
    ltv, monthsActive,
    lastActive: state?.updated_at ?? null,
    assignedPlan: planRow ? { name: planRow.name, meals: JSON.parse(planRow.meals), assignedAt: planRow.assigned_at } : null,
  });
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

// ─────────────────── Content backfill (one-time import) ───────────────────
adminRouter.post('/seed-catalog', (_req, res) => {
  const counts = importCatalog();
  res.json({ ok: true, imported: counts });
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
adminRouter.get('/stats', (req: Request, res: Response) => {
  const days = Math.min(180, Math.max(7, Number(req.query.days) || 30));
  const one = (sql: string, ...args: any[]) => (db.prepare(sql).get(...args) as any)?.n ?? 0;
  const dayAgo = (d: number) => new Date(Date.now() - d * 864e5).toISOString();
  const series = (rows: { d: string; n: number }[], n: number) => {
    const byDay = new Map(rows.map((r) => [r.d, r.n]));
    const out: { date: string; count: number }[] = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10);
      out.push({ date: d, count: byDay.get(d) ?? 0 });
    }
    return out;
  };

  const totalUsers = one('SELECT COUNT(*) n FROM users');
  const totalCustomers = one("SELECT COUNT(*) n FROM users WHERE role = 'customer'");
  const newToday = one('SELECT COUNT(*) n FROM users WHERE created_at >= ?', dayAgo(1));
  const newInRange = one('SELECT COUNT(*) n FROM users WHERE created_at >= ?', dayAgo(days));
  const prevRange = one('SELECT COUNT(*) n FROM users WHERE created_at >= ? AND created_at < ?', dayAgo(days * 2), dayAgo(days));
  const growthPct = prevRange ? Math.round(((newInRange - prevRange) / prevRange) * 100) : newInRange ? 100 : 0;

  const active = "status IN ('active','trialing')";
  const premium = one(`SELECT COUNT(*) n FROM subscriptions WHERE plan='premium' AND ${active}`);
  const coached = one(`SELECT COUNT(*) n FROM subscriptions WHERE plan='coached' AND ${active}`);
  const paying = premium + coached;
  const free = Math.max(0, totalUsers - paying);
  const churned = one("SELECT COUNT(*) n FROM subscriptions WHERE status='canceled'");
  const conversion = totalUsers ? Math.round((paying / totalUsers) * 1000) / 10 : 0;
  const churnRate = paying + churned ? Math.round((churned / (paying + churned)) * 1000) / 10 : 0;

  // Active users from last cloud-sync time.
  const activeUsers = {
    dau: one('SELECT COUNT(*) n FROM user_state WHERE updated_at >= ?', dayAgo(1)),
    wau: one('SELECT COUNT(*) n FROM user_state WHERE updated_at >= ?', dayAgo(7)),
    mau: one('SELECT COUNT(*) n FROM user_state WHERE updated_at >= ?', dayAgo(30)),
  };
  const retention = totalUsers ? Math.round((activeUsers.wau / totalUsers) * 1000) / 10 : 0;

  // Revenue estimates (USD) from current pricing.
  const pr = getPricing();
  const mrr = Math.round(premium * (pr.premium.month.usd / 100) + coached * (pr.coached.month.usd / 100));
  const arr = mrr * 12;
  const arpu = paying ? Math.round((mrr / paying) * 100) / 100 : 0;

  const signupRows = db.prepare(
    `SELECT substr(created_at,1,10) d, COUNT(*) n FROM users WHERE created_at >= ? GROUP BY d`,
  ).all(dayAgo(days)) as { d: string; n: number }[];
  const signups = series(signupRows, days);
  const baseline = totalUsers - signups.reduce((a, b) => a + b.count, 0);
  let run = baseline;
  const cumulative = signups.map((s) => ({ date: s.date, count: (run += s.count) }));

  const subRows = db.prepare(
    `SELECT substr(updated_at,1,10) d, COUNT(*) n FROM subscriptions
     WHERE plan != 'free' AND ${active} AND updated_at >= ? GROUP BY d`,
  ).all(dayAgo(days)) as { d: string; n: number }[];
  const newSubs = series(subRows, days);

  const segments = db.prepare(
    `SELECT s.name, COUNT(u.id) n FROM segments s LEFT JOIN users u ON u.segment_id = s.id GROUP BY s.id ORDER BY n DESC`,
  ).all() as { name: string; n: number }[];

  const content = {
    foods: one('SELECT COUNT(*) n FROM cms_foods'),
    recipes: one('SELECT COUNT(*) n FROM cms_recipes'),
    exercises: one('SELECT COUNT(*) n FROM cms_exercises'),
    templates: one('SELECT COUNT(*) n FROM plan_templates'),
    segments: one('SELECT COUNT(*) n FROM segments'),
  };

  const recent = db.prepare(
    `SELECT u.email, u.name, u.created_at, COALESCE(sub.plan,'free') plan
     FROM users u LEFT JOIN subscriptions sub ON sub.user_id = u.id
     ORDER BY u.created_at DESC LIMIT 8`,
  ).all() as any[];

  const recentSubs = db.prepare(
    `SELECT u.email, s.plan, s.updated_at FROM subscriptions s JOIN users u ON u.id = s.user_id
     WHERE s.plan != 'free' ORDER BY s.updated_at DESC LIMIT 6`,
  ).all() as any[];

  res.json({
    days,
    totalUsers, totalCustomers, newToday, newInRange, growthPct,
    plans: { free, premium, coached, paying },
    conversion, churned, churnRate,
    revenue: { mrr, arr, arpu },
    activeUsers, retention,
    signups, cumulative, newSubs,
    segments, content,
    recent: recent.map((r) => ({ email: r.email, name: r.name, plan: r.plan, createdAt: r.created_at })),
    recentSubs: recentSubs.map((r) => ({ email: r.email, plan: r.plan, at: r.updated_at })),
  });
});

// ───────────────────── Cohort retention ─────────────────────
adminRouter.get('/cohorts', (_req: Request, res: Response) => {
  const N = 8; // weekly cohorts
  const WEEK = 7 * 864e5;
  const rows = db.prepare(
    `SELECT u.created_at c, st.updated_at a FROM users u LEFT JOIN user_state st ON st.user_id = u.id`,
  ).all() as { c: string; a: string | null }[];

  const cohorts: { label: string; size: number; retention: number[] }[] = [];
  for (let w = N; w >= 1; w--) {
    const winStart = Date.now() - w * WEEK;
    const winEnd = Date.now() - (w - 1) * WEEK;
    const members = rows.filter((r) => {
      const t = Date.parse(r.c);
      return t >= winStart && t < winEnd;
    });
    const ageWeeks = w - 1; // elapsed full weeks since the cohort started
    const retention: number[] = [];
    for (let k = 0; k <= ageWeeks; k++) {
      const cutoff = winStart + k * WEEK;
      const retained = members.filter((m) => m.a && Date.parse(m.a) >= cutoff).length;
      retention.push(members.length ? Math.round((retained / members.length) * 100) : 0);
    }
    const label = new Date(winStart).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    cohorts.push({ label, size: members.length, retention });
  }
  res.json({ weeks: N, cohorts });
});

// ───────────────────────── Revenue report ─────────────────────────
adminRouter.get('/revenue', (_req: Request, res: Response) => {
  const pr = getPricing();
  const pPrem = pr.premium.month.usd / 100;
  const pCoach = pr.coached.month.usd / 100;
  const price = (plan: string) => (plan === 'coached' ? pCoach : pPrem);
  const WEEK = 7 * 864e5;

  const subs = db.prepare('SELECT plan, status, updated_at FROM subscriptions').all() as
    { plan: string; status: string; updated_at: string }[];
  const isActive = (s: { plan: string; status: string }) =>
    (s.plan === 'premium' || s.plan === 'coached') && (s.status === 'active' || s.status === 'trialing');

  const active = subs.filter(isActive);
  const premium = active.filter((s) => s.plan === 'premium').length;
  const coached = active.filter((s) => s.plan === 'coached').length;
  const byPlan = { premium: Math.round(premium * pPrem), coached: Math.round(coached * pCoach) };
  const mrr = byPlan.premium + byPlan.coached;
  const arr = mrr * 12;
  const paying = premium + coached;
  const arpu = paying ? Math.round((mrr / paying) * 100) / 100 : 0;

  // MRR movement over the last 30 days.
  const since = Date.now() - 30 * 864e5;
  let newMrr = 0;
  let churnedMrr = 0;
  for (const s of subs) {
    if (Date.parse(s.updated_at) < since) continue;
    if (isActive(s)) newMrr += price(s.plan);
    else if (s.status === 'canceled' && s.plan !== 'free') churnedMrr += price(s.plan);
  }
  newMrr = Math.round(newMrr);
  churnedMrr = Math.round(churnedMrr);

  // MRR over the last 12 weeks (active subs attributed from their start).
  const mrrSeries: { label: string; mrr: number }[] = [];
  for (let w = 11; w >= 0; w--) {
    const end = Date.now() - w * WEEK;
    let m = 0;
    for (const s of active) if (Date.parse(s.updated_at) <= end) m += price(s.plan);
    mrrSeries.push({ label: new Date(end).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), mrr: Math.round(m) });
  }

  res.json({ mrr, arr, arpu, paying, byPlan, movement: { newMrr, churnedMrr, netMrr: newMrr - churnedMrr }, mrrSeries });
});

// ───────────────────── Customer-facing: my plan ─────────────────────
mePlanRouter.get('/plan', (req: AuthedRequest, res: Response) => {
  const row = db.prepare('SELECT * FROM customer_plans WHERE user_id = ?').get(req.userId) as any;
  if (!row) return res.json({ plan: null });
  res.json({ plan: { name: row.name, meals: JSON.parse(row.meals), assignedAt: row.assigned_at } });
});
