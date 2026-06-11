import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db } from './db';
import { makeId } from './util';
import { sendEmail, welcomeEmail, resetEmail } from './email';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-insecure-secret';
const TOKEN_TTL = '30d';

export interface AuthedRequest extends Request {
  userId?: string;
  userRole?: string;
}

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  name: string | null;
  role: string;
  created_at: string;
}

const credsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
});

function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

export const authRouter = Router();

authRouter.post('/register', async (req: Request, res: Response) => {
  const parsed = credsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid email or password (min 6 chars).' });
  }
  const { email, password, name } = parsed.data;

  const existing = await db.prepare('SELECT id FROM users WHERE email = ?')
    .get(email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'An account with that email already exists.' });
  }

  const id = makeId();
  const passwordHash = bcrypt.hashSync(password, 10);
  await db.prepare(
    'INSERT INTO users (id, email, password_hash, name, created_at) VALUES (?, ?, ?, ?, ?)',
  ).run(id, email.toLowerCase(), passwordHash, name ?? null, new Date().toISOString());

  void sendEmail(welcomeEmail(email.toLowerCase(), name));

  return res.status(201).json({
    token: signToken(id),
    user: { id, email: email.toLowerCase(), name: name ?? null, role: 'customer' },
  });
});

/**
 * POST /api/auth/forgot — emails a 6-digit reset code. Always responds 200 so
 * the endpoint can't be used to discover which emails have accounts.
 */
authRouter.post('/forgot', async (req: Request, res: Response) => {
  const email = String(req.body?.email ?? '').toLowerCase().trim();
  const user = email ? (await db.prepare('SELECT id, email FROM users WHERE email = ?').get(email) as UserRow | undefined) : undefined;
  if (user) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = bcrypt.hashSync(code, 10);
    const expires = new Date(Date.now() + 30 * 60_000).toISOString();
    await db.prepare(
      `INSERT INTO password_resets (user_id, code_hash, expires_at) VALUES (?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET code_hash=excluded.code_hash, expires_at=excluded.expires_at`,
    ).run(user.id, codeHash, expires);
    void sendEmail(resetEmail(user.email, code));
  }
  res.json({ ok: true });
});

/** POST /api/auth/reset — verifies the code and sets a new password. */
authRouter.post('/reset', async (req: Request, res: Response) => {
  const email = String(req.body?.email ?? '').toLowerCase().trim();
  const code = String(req.body?.code ?? '').trim();
  const password = String(req.body?.password ?? '');
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  const user = await db.prepare('SELECT id FROM users WHERE email = ?').get(email) as { id: string } | undefined;
  if (!user) return res.status(400).json({ error: 'Invalid code.' });
  const row = await db.prepare('SELECT code_hash, expires_at FROM password_resets WHERE user_id = ?').get(user.id) as
    | { code_hash: string; expires_at: string }
    | undefined;
  if (!row || row.expires_at < new Date().toISOString() || !bcrypt.compareSync(code, row.code_hash)) {
    return res.status(400).json({ error: 'Invalid or expired code.' });
  }
  await db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(password, 10), user.id);
  await db.prepare('DELETE FROM password_resets WHERE user_id = ?').run(user.id);
  return res.json({ token: signToken(user.id) });
});

authRouter.post('/login', async (req: Request, res: Response) => {
  const parsed = credsSchema.pick({ email: true, password: true }).safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid request.' });
  }
  const { email, password } = parsed.data;

  const user = await db.prepare('SELECT * FROM users WHERE email = ?')
    .get(email.toLowerCase()) as UserRow | undefined;
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Incorrect email or password.' });
  }

  return res.json({
    token: signToken(user.id),
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
});

/** GET /api/auth/me — current user from token. */
authRouter.get('/me', async (req: AuthedRequest, res: Response) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized.' });
  try {
    const { sub } = jwt.verify(header.slice(7), JWT_SECRET) as { sub: string };
    const user = await db.prepare('SELECT id, email, name, role FROM users WHERE id = ?').get(sub);
    if (!user) return res.status(401).json({ error: 'Unauthorized.' });
    return res.json({ user });
  } catch {
    return res.status(401).json({ error: 'Invalid token.' });
  }
});

/**
 * Ensures an admin account exists, from ADMIN_EMAIL / ADMIN_PASSWORD env vars.
 * Promotes the account to the admin role if it already exists.
 */
export async function seedAdmin(): Promise<void> {
  const email = process.env.ADMIN_EMAIL?.toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;
  const existing = await db.prepare('SELECT id FROM users WHERE email = ?').get(email) as
    | { id: string }
    | undefined;
  if (existing) {
    await db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(existing.id);
    return;
  }
  await db.prepare(
    "INSERT INTO users (id, email, password_hash, name, role, created_at) VALUES (?, ?, ?, ?, 'admin', ?)",
  ).run(makeId(), email, bcrypt.hashSync(password, 10), 'Admin', new Date().toISOString());
}

/** Express middleware: requires a valid Bearer token, sets req.userId. */
export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization token.' });
  }
  const token = header.slice('Bearer '.length);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string };
    req.userId = payload.sub;
    const row = await db.prepare('SELECT role FROM users WHERE id = ?').get(payload.sub) as
      | { role: string }
      | undefined;
    req.userRole = row?.role ?? 'customer';
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

/** Middleware: requires the authenticated user to have the admin role. */
export function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Admin access required.' });
    }
    return next();
  });
}
