import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { AuthedRequest, requireAuth, requireAdmin } from '../auth';
import { makeId } from '../util';

/**
 * Phase 2 — Programs (condition reversal), Coaching marketplace, and
 * Corporate wellness.
 *
 *  - programsRouter   (/api/programs):  public catalog + the signed-in user's
 *    enrollment & weekly progress.
 *  - coachesRouter    (/api/coaches):   public coach catalog + the user's
 *    booking with a coach.
 *  - companyRouter    (/api/company):   employee joins a corporate org by code.
 *  - adminPhase2Router(/api/admin):     back-office CRUD for programs, coaches,
 *    companies, plus enrollment / booking rosters.
 */

const now = () => new Date().toISOString();
const bad = (res: Response, e: z.ZodError) =>
  res.status(400).json({ error: e.errors[0]?.message ?? 'Invalid input.' });

// ─────────────────────────── Mappers ───────────────────────────
const mapProgram = (r: any) => ({
  id: r.id,
  slug: r.slug ?? undefined,
  name: r.name,
  condition: r.condition,
  tagline: r.tagline ?? '',
  description: r.description ?? '',
  durationWeeks: r.duration_weeks,
  imageUrl: r.image_url ?? undefined,
  color: r.color ?? undefined,
  outcomes: JSON.parse(r.outcomes || '[]'),
  modules: JSON.parse(r.modules || '[]'),
  active: !!r.active,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const mapEnrollment = (r: any) => ({
  id: r.id,
  programId: r.program_id,
  startedAt: r.started_at,
  currentWeek: r.current_week,
  status: r.status,
  completedTasks: JSON.parse(r.completed_tasks || '[]'),
  updatedAt: r.updated_at,
});

const mapCoach = (r: any) => ({
  id: r.id,
  name: r.name,
  title: r.title ?? '',
  specialties: JSON.parse(r.specialties || '[]'),
  bio: r.bio ?? '',
  photoUrl: r.photo_url ?? undefined,
  rating: r.rating,
  reviews: r.reviews,
  priceMonthUsd: r.price_month_usd,
  languages: JSON.parse(r.languages || '[]'),
  active: !!r.active,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const mapBooking = (r: any) => ({
  id: r.id,
  coachId: r.coach_id,
  status: r.status,
  note: r.note ?? '',
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const mapCompany = (r: any) => ({
  id: r.id,
  name: r.name,
  joinCode: r.join_code,
  seats: r.seats,
  contactEmail: r.contact_email ?? '',
  plan: r.plan,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

// ═══════════════════════════ Programs ═══════════════════════════
export const programsRouter = Router();

// Public: list active programs.
programsRouter.get('/', async (_req, res) => {
  const rows = await db.prepare('SELECT * FROM programs WHERE active = 1 ORDER BY updated_at DESC').all();
  res.json(rows.map(mapProgram));
});

// Signed-in user's enrollments (must precede '/:id').
programsRouter.get('/mine', requireAuth, async (req: AuthedRequest, res) => {
  const rows = await db.prepare('SELECT * FROM program_enrollments WHERE user_id = ? ORDER BY updated_at DESC').all(req.userId);
  res.json(rows.map(mapEnrollment));
});

programsRouter.post('/:id/enroll', requireAuth, async (req: AuthedRequest, res: Response) => {
  const program = await db.prepare('SELECT id FROM programs WHERE id = ? AND active = 1').get(req.params.id);
  if (!program) return res.status(404).json({ error: 'Program not found.' });
  const existing = await db.prepare('SELECT * FROM program_enrollments WHERE user_id = ? AND program_id = ?').get(req.userId, req.params.id) as any;
  if (existing) return res.json(mapEnrollment(existing));
  const id = `enr_${makeId()}`;
  const t = now();
  await db.prepare(
    `INSERT INTO program_enrollments (id, user_id, program_id, started_at, current_week, status, completed_tasks, updated_at)
     VALUES (?, ?, ?, ?, 1, 'active', '[]', ?)`,
  ).run(id, req.userId, req.params.id, t, t);
  res.status(201).json(mapEnrollment(await db.prepare('SELECT * FROM program_enrollments WHERE id = ?').get(id)));
});

const enrollPatch = z.object({
  currentWeek: z.number().int().min(1).optional(),
  status: z.enum(['active', 'paused', 'completed']).optional(),
  completedTasks: z.array(z.string()).optional(),
});

programsRouter.patch('/enrollments/:id', requireAuth, async (req: AuthedRequest, res: Response) => {
  const p = enrollPatch.safeParse(req.body);
  if (!p.success) return bad(res, p.error);
  const row = await db.prepare('SELECT * FROM program_enrollments WHERE id = ? AND user_id = ?').get(req.params.id, req.userId) as any;
  if (!row) return res.status(404).json({ error: 'Enrollment not found.' });
  const next = {
    current_week: p.data.currentWeek ?? row.current_week,
    status: p.data.status ?? row.status,
    completed_tasks: p.data.completedTasks ? JSON.stringify(p.data.completedTasks) : row.completed_tasks,
    t: now(),
    id: req.params.id,
  };
  await db.prepare(
    `UPDATE program_enrollments SET current_week=@current_week, status=@status,
       completed_tasks=@completed_tasks, updated_at=@t WHERE id=@id`,
  ).run(next);
  res.json(mapEnrollment(await db.prepare('SELECT * FROM program_enrollments WHERE id = ?').get(req.params.id)));
});

programsRouter.delete('/enrollments/:id', requireAuth, async (req: AuthedRequest, res: Response) => {
  await db.prepare('DELETE FROM program_enrollments WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  res.json({ ok: true });
});

// Public: program detail (after the specific routes above).
programsRouter.get('/:id', async (req, res) => {
  const row = await db.prepare('SELECT * FROM programs WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Program not found.' });
  res.json(mapProgram(row));
});

// ═══════════════════════════ Coaches ═══════════════════════════
export const coachesRouter = Router();

coachesRouter.get('/', async (_req, res) => {
  const rows = await db.prepare('SELECT * FROM coaches WHERE active = 1 ORDER BY rating DESC, reviews DESC').all();
  res.json(rows.map(mapCoach));
});

// The signed-in user's coaching relationship (must precede '/:id').
coachesRouter.get('/mine', requireAuth, async (req: AuthedRequest, res) => {
  const row = await db.prepare("SELECT * FROM coach_bookings WHERE user_id = ? AND status != 'ended' ORDER BY updated_at DESC LIMIT 1").get(req.userId) as any;
  res.json({ booking: row ? mapBooking(row) : null });
});

coachesRouter.post('/:id/book', requireAuth, async (req: AuthedRequest, res: Response) => {
  const coach = await db.prepare('SELECT id FROM coaches WHERE id = ? AND active = 1').get(req.params.id);
  if (!coach) return res.status(404).json({ error: 'Coach not found.' });
  const note = typeof req.body?.note === 'string' ? req.body.note.slice(0, 1000) : null;
  // End any current booking, then create the new one.
  await db.prepare("UPDATE coach_bookings SET status='ended', updated_at=? WHERE user_id=? AND status!='ended'").run(now(), req.userId);
  const id = `bk_${makeId()}`;
  const t = now();
  await db.prepare(
    `INSERT INTO coach_bookings (id, user_id, coach_id, status, note, created_at, updated_at)
     VALUES (?, ?, ?, 'requested', ?, ?, ?)`,
  ).run(id, req.userId, req.params.id, note, t, t);
  res.status(201).json(mapBooking(await db.prepare('SELECT * FROM coach_bookings WHERE id = ?').get(id)));
});

coachesRouter.delete('/booking/:id', requireAuth, async (req: AuthedRequest, res: Response) => {
  await db.prepare("UPDATE coach_bookings SET status='ended', updated_at=? WHERE id=? AND user_id=?").run(now(), req.params.id, req.userId);
  res.json({ ok: true });
});

const mapMessage = (r: any) => ({ id: r.id, sender: r.sender, body: r.body, createdAt: r.created_at });

// Messages within a booking (customer side).
coachesRouter.get('/booking/:id/messages', requireAuth, async (req: AuthedRequest, res: Response) => {
  const owns = await db.prepare('SELECT id FROM coach_bookings WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!owns) return res.status(404).json({ error: 'Booking not found.' });
  const rows = await db.prepare('SELECT * FROM coach_messages WHERE booking_id = ? ORDER BY created_at').all(req.params.id);
  res.json(rows.map(mapMessage));
});

coachesRouter.post('/booking/:id/messages', requireAuth, async (req: AuthedRequest, res: Response) => {
  const owns = await db.prepare('SELECT id FROM coach_bookings WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!owns) return res.status(404).json({ error: 'Booking not found.' });
  const body = String(req.body?.body ?? '').trim().slice(0, 4000);
  if (!body) return res.status(400).json({ error: 'Message is empty.' });
  const id = `msg_${makeId()}`;
  await db.prepare('INSERT INTO coach_messages (id, booking_id, sender, body, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(id, req.params.id, 'customer', body, now());
  res.status(201).json(mapMessage(await db.prepare('SELECT * FROM coach_messages WHERE id = ?').get(id)));
});

coachesRouter.get('/:id', async (req, res) => {
  const row = await db.prepare('SELECT * FROM coaches WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Coach not found.' });
  res.json(mapCoach(row));
});

// ═══════════════════════ Corporate (employee) ═══════════════════════
export const companyRouter = Router();
companyRouter.use(requireAuth);

// What company (if any) the signed-in user belongs to.
companyRouter.get('/me', async (req: AuthedRequest, res) => {
  const u = await db.prepare('SELECT company_id FROM users WHERE id = ?').get(req.userId) as any;
  if (!u?.company_id) return res.json({ company: null });
  const c = await db.prepare('SELECT * FROM companies WHERE id = ?').get(u.company_id) as any;
  res.json({ company: c ? mapCompany(c) : null });
});

companyRouter.post('/join', async (req: AuthedRequest, res: Response) => {
  const code = String(req.body?.code ?? '').trim().toUpperCase();
  if (!code) return res.status(400).json({ error: 'Enter your company code.' });
  const c = await db.prepare('SELECT * FROM companies WHERE UPPER(join_code) = ?').get(code) as any;
  if (!c) return res.status(404).json({ error: 'No company found for that code.' });
  const seatsUsed = (await db.prepare('SELECT COUNT(*) n FROM users WHERE company_id = ?').get(c.id) as any).n;
  if (seatsUsed >= c.seats) return res.status(409).json({ error: 'This company has no seats left.' });
  await db.prepare('UPDATE users SET company_id = ? WHERE id = ?').run(c.id, req.userId);
  // Grant the company's entitlement to the employee.
  await db.prepare(
    `INSERT INTO subscriptions (user_id, plan, status, provider, updated_at)
     VALUES (?, ?, 'active', 'corporate', ?)
     ON CONFLICT(user_id) DO UPDATE SET plan=excluded.plan, status='active', provider='corporate', updated_at=excluded.updated_at`,
  ).run(req.userId, c.plan, now());
  res.json({ company: mapCompany(c) });
});

companyRouter.post('/leave', async (req: AuthedRequest, res) => {
  await db.prepare('UPDATE users SET company_id = NULL WHERE id = ?').run(req.userId);
  res.json({ ok: true });
});

// ═══════════════════════ Admin (back office) ═══════════════════════
export const adminPhase2Router = Router();
adminPhase2Router.use(requireAdmin);

// ── Programs CRUD ──
const moduleSchema = z.object({
  week: z.number().int().min(1),
  title: z.string().min(1),
  focus: z.string().optional().default(''),
  tasks: z.array(z.string()).default([]),
});
const programSchema = z.object({
  name: z.string().min(1),
  condition: z.string().min(1),
  tagline: z.string().optional().default(''),
  description: z.string().optional().default(''),
  durationWeeks: z.number().int().min(1).max(104).default(12),
  imageUrl: z.string().url().optional().or(z.literal('')),
  color: z.string().optional(),
  outcomes: z.array(z.string()).default([]),
  modules: z.array(moduleSchema).default([]),
  active: z.boolean().default(true),
});

const programRow = (id: string, d: z.infer<typeof programSchema>) => ({
  id,
  slug: d.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
  name: d.name,
  condition: d.condition,
  tagline: d.tagline ?? '',
  description: d.description ?? '',
  duration_weeks: d.durationWeeks,
  image_url: d.imageUrl || null,
  color: d.color ?? null,
  outcomes: JSON.stringify(d.outcomes ?? []),
  modules: JSON.stringify(d.modules ?? []),
  active: d.active ? 1 : 0,
  t: now(),
});

adminPhase2Router.get('/programs', async (_req, res) =>
  res.json((await db.prepare('SELECT * FROM programs ORDER BY updated_at DESC').all()).map(mapProgram)));

adminPhase2Router.post('/programs', async (req: Request, res: Response) => {
  const p = programSchema.safeParse(req.body);
  if (!p.success) return bad(res, p.error);
  const id = `prog_${makeId()}`;
  await db.prepare(
    `INSERT INTO programs (id,slug,name,condition,tagline,description,duration_weeks,image_url,color,outcomes,modules,active,created_at,updated_at)
     VALUES (@id,@slug,@name,@condition,@tagline,@description,@duration_weeks,@image_url,@color,@outcomes,@modules,@active,@t,@t)`,
  ).run(programRow(id, p.data));
  res.status(201).json(mapProgram(await db.prepare('SELECT * FROM programs WHERE id = ?').get(id)));
});

adminPhase2Router.put('/programs/:id', async (req: Request, res: Response) => {
  const p = programSchema.safeParse(req.body);
  if (!p.success) return bad(res, p.error);
  const r = await db.prepare(
    `UPDATE programs SET slug=@slug,name=@name,condition=@condition,tagline=@tagline,description=@description,
       duration_weeks=@duration_weeks,image_url=@image_url,color=@color,outcomes=@outcomes,modules=@modules,
       active=@active,updated_at=@t WHERE id=@id`,
  ).run(programRow(req.params.id, p.data));
  if (!r.changes) return res.status(404).json({ error: 'Program not found.' });
  res.json(mapProgram(await db.prepare('SELECT * FROM programs WHERE id = ?').get(req.params.id)));
});

adminPhase2Router.delete('/programs/:id', async (req: Request, res: Response) => {
  await db.prepare('DELETE FROM programs WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// Enrollment roster for a program.
adminPhase2Router.get('/programs/:id/enrollments', async (req: Request, res: Response) => {
  const rows = await db.prepare(
    `SELECT e.*, u.email, u.name FROM program_enrollments e JOIN users u ON u.id = e.user_id
     WHERE e.program_id = ? ORDER BY e.updated_at DESC`,
  ).all(req.params.id) as any[];
  res.json(rows.map((r) => ({ ...mapEnrollment(r), email: r.email, name: r.name })));
});

// ── Coaches CRUD ──
const coachSchema = z.object({
  name: z.string().min(1),
  title: z.string().optional().default(''),
  specialties: z.array(z.string()).default([]),
  bio: z.string().optional().default(''),
  photoUrl: z.string().url().optional().or(z.literal('')),
  rating: z.number().min(0).max(5).default(5),
  reviews: z.number().int().nonnegative().default(0),
  priceMonthUsd: z.number().nonnegative().default(99),
  languages: z.array(z.string()).default([]),
  active: z.boolean().default(true),
});

const coachRow = (id: string, d: z.infer<typeof coachSchema>) => ({
  id,
  name: d.name,
  title: d.title ?? '',
  specialties: JSON.stringify(d.specialties ?? []),
  bio: d.bio ?? '',
  photo_url: d.photoUrl || null,
  rating: d.rating,
  reviews: d.reviews,
  price_month_usd: d.priceMonthUsd,
  languages: JSON.stringify(d.languages ?? []),
  active: d.active ? 1 : 0,
  t: now(),
});

adminPhase2Router.get('/coaches', async (_req, res) =>
  res.json((await db.prepare('SELECT * FROM coaches ORDER BY updated_at DESC').all()).map(mapCoach)));

adminPhase2Router.post('/coaches', async (req: Request, res: Response) => {
  const p = coachSchema.safeParse(req.body);
  if (!p.success) return bad(res, p.error);
  const id = `coach_${makeId()}`;
  await db.prepare(
    `INSERT INTO coaches (id,name,title,specialties,bio,photo_url,rating,reviews,price_month_usd,languages,active,created_at,updated_at)
     VALUES (@id,@name,@title,@specialties,@bio,@photo_url,@rating,@reviews,@price_month_usd,@languages,@active,@t,@t)`,
  ).run(coachRow(id, p.data));
  res.status(201).json(mapCoach(await db.prepare('SELECT * FROM coaches WHERE id = ?').get(id)));
});

adminPhase2Router.put('/coaches/:id', async (req: Request, res: Response) => {
  const p = coachSchema.safeParse(req.body);
  if (!p.success) return bad(res, p.error);
  const r = await db.prepare(
    `UPDATE coaches SET name=@name,title=@title,specialties=@specialties,bio=@bio,photo_url=@photo_url,
       rating=@rating,reviews=@reviews,price_month_usd=@price_month_usd,languages=@languages,active=@active,updated_at=@t WHERE id=@id`,
  ).run(coachRow(req.params.id, p.data));
  if (!r.changes) return res.status(404).json({ error: 'Coach not found.' });
  res.json(mapCoach(await db.prepare('SELECT * FROM coaches WHERE id = ?').get(req.params.id)));
});

adminPhase2Router.delete('/coaches/:id', async (req: Request, res: Response) => {
  await db.prepare('DELETE FROM coaches WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// Booking roster across all coaches.
adminPhase2Router.get('/coach-bookings', async (_req, res) => {
  const rows = await db.prepare(
    `SELECT b.*, u.email, u.name AS user_name, c.name AS coach_name
     FROM coach_bookings b JOIN users u ON u.id = b.user_id JOIN coaches c ON c.id = b.coach_id
     ORDER BY b.updated_at DESC`,
  ).all() as any[];
  res.json(rows.map((r) => ({
    id: r.id, status: r.status, note: r.note ?? '', createdAt: r.created_at,
    email: r.email, userName: r.user_name, coachName: r.coach_name,
  })));
});

// Coach messaging (admin replies on behalf of the coach).
adminPhase2Router.get('/coach-bookings/:id/messages', async (req: Request, res: Response) => {
  const rows = await db.prepare('SELECT * FROM coach_messages WHERE booking_id = ? ORDER BY created_at').all(req.params.id) as any[];
  res.json(rows.map((r) => ({ id: r.id, sender: r.sender, body: r.body, createdAt: r.created_at })));
});

adminPhase2Router.post('/coach-bookings/:id/messages', async (req: Request, res: Response) => {
  const booking = await db.prepare('SELECT id FROM coach_bookings WHERE id = ?').get(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found.' });
  const body = String(req.body?.body ?? '').trim().slice(0, 4000);
  if (!body) return res.status(400).json({ error: 'Message is empty.' });
  // Replying activates the relationship.
  await db.prepare("UPDATE coach_bookings SET status='active', updated_at=? WHERE id=? AND status='requested'").run(now(), req.params.id);
  const id = `msg_${makeId()}`;
  await db.prepare('INSERT INTO coach_messages (id, booking_id, sender, body, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(id, req.params.id, 'coach', body, now());
  res.status(201).json({ id, sender: 'coach', body, createdAt: now() });
});

// ── Companies CRUD ──
const companySchema = z.object({
  name: z.string().min(1),
  joinCode: z.string().min(3).optional(),
  seats: z.number().int().min(1).default(50),
  contactEmail: z.string().email().optional().or(z.literal('')),
  plan: z.enum(['premium', 'coached']).default('premium'),
});

adminPhase2Router.get('/companies', async (_req, res) => {
  const rows = await db.prepare('SELECT * FROM companies ORDER BY updated_at DESC').all() as any[];
  res.json(await Promise.all(rows.map(async (r) => ({
    ...mapCompany(r),
    seatsUsed: ((await db.prepare('SELECT COUNT(*) n FROM users WHERE company_id = ?').get(r.id)) as any).n,
  }))));
});

adminPhase2Router.get('/companies/:id', async (req: Request, res: Response) => {
  const c = await db.prepare('SELECT * FROM companies WHERE id = ?').get(req.params.id) as any;
  if (!c) return res.status(404).json({ error: 'Company not found.' });
  const employees = await db.prepare(
    `SELECT u.email, u.name, u.created_at, COALESCE(s.plan,'free') plan, st.updated_at last_active
     FROM users u LEFT JOIN subscriptions s ON s.user_id = u.id
     LEFT JOIN user_state st ON st.user_id = u.id
     WHERE u.company_id = ? ORDER BY u.created_at DESC`,
  ).all(req.params.id) as any[];
  const dayAgo = (d: number) => new Date(Date.now() - d * 864e5).toISOString();
  const wau = employees.filter((e) => e.last_active && e.last_active >= dayAgo(7)).length;
  res.json({
    ...mapCompany(c),
    seatsUsed: employees.length,
    activeThisWeek: wau,
    engagement: employees.length ? Math.round((wau / employees.length) * 100) : 0,
    employees: employees.map((e) => ({
      email: e.email, name: e.name, plan: e.plan, joinedAt: e.created_at, lastActive: e.last_active ?? null,
    })),
  });
});

const genCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

adminPhase2Router.post('/companies', async (req: Request, res: Response) => {
  const p = companySchema.safeParse(req.body);
  if (!p.success) return bad(res, p.error);
  const id = `co_${makeId()}`;
  let code = (p.data.joinCode || genCode()).toUpperCase();
  // Ensure uniqueness.
  while (await db.prepare('SELECT id FROM companies WHERE UPPER(join_code) = ?').get(code)) code = genCode();
  const t = now();
  await db.prepare(
    `INSERT INTO companies (id,name,join_code,seats,contact_email,plan,created_at,updated_at)
     VALUES (?,?,?,?,?,?,?,?)`,
  ).run(id, p.data.name, code, p.data.seats, p.data.contactEmail || null, p.data.plan, t, t);
  res.status(201).json(mapCompany(await db.prepare('SELECT * FROM companies WHERE id = ?').get(id)));
});

adminPhase2Router.put('/companies/:id', async (req: Request, res: Response) => {
  const p = companySchema.safeParse(req.body);
  if (!p.success) return bad(res, p.error);
  const existing = await db.prepare('SELECT join_code FROM companies WHERE id = ?').get(req.params.id) as any;
  if (!existing) return res.status(404).json({ error: 'Company not found.' });
  const code = (p.data.joinCode || existing.join_code).toUpperCase();
  await db.prepare(
    `UPDATE companies SET name=?, join_code=?, seats=?, contact_email=?, plan=?, updated_at=? WHERE id=?`,
  ).run(p.data.name, code, p.data.seats, p.data.contactEmail || null, p.data.plan, now(), req.params.id);
  res.json(mapCompany(await db.prepare('SELECT * FROM companies WHERE id = ?').get(req.params.id)));
});

adminPhase2Router.delete('/companies/:id', async (req: Request, res: Response) => {
  await db.prepare('UPDATE users SET company_id = NULL WHERE company_id = ?').run(req.params.id);
  await db.prepare('DELETE FROM companies WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});
